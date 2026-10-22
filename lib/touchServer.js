// Server side of first-touch / last-non-direct attribution (lib/touches.js
// is the browser side): reading the touch cookies off a request, setting
// them back with their full lifetime, and cleaning up what an order
// arrives with. Everything from the browser is untrusted and goes through
// sanitizeTouch (lib/touchClassify.js).

import { sanitizeTouch, applyVisit, isDirect, FIRST_TOUCH_MAX_AGE_MS, HISTORY_LIMIT } from './touchClassify';

const COOKIES = { first: 'an_ft', lastNonDirect: 'an_lt', history: 'an_th', session: 'an_st' };

function parseCookie(value) {
  if (!value) return null;
  try { return JSON.parse(decodeURIComponent(value)); } catch { return null; }
}

function cookieDomainForHost(hostname) {
  const host = String(hostname || '').split(':')[0].toLowerCase();
  return host === 'aneseskin.com' || host.endsWith('.aneseskin.com') ? '.aneseskin.com' : null;
}

// Cleans a { first, lastNonDirect, history, lastClick } object: every touch
// sanitized, expired ones dropped, history limited to non-direct touches.
export function cleanTouches(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return null;
  const { state } = applyVisit({ first: raw.first, lastNonDirect: raw.lastNonDirect, history: raw.history }, null, now);
  const lastClick = sanitizeTouch(raw.lastClick);
  if (!state.first && !state.lastNonDirect && !lastClick) return null;
  return { first: state.first, lastNonDirect: isDirect(state.lastNonDirect) ? null : state.lastNonDirect, history: state.history, lastClick };
}

export function readTouchCookies(req) {
  const c = req?.cookies || {};
  return cleanTouches({
    first: parseCookie(c[COOKIES.first]),
    lastNonDirect: parseCookie(c[COOKIES.lastNonDirect]),
    history: parseCookie(c[COOKIES.history]) || [],
    lastClick: parseCookie(c[COOKIES.session]),
  });
}

// Set-Cookie headers re-issuing the browser's touches from the server
// (pages/api/track/event.js), so they keep their 90-day lifetime in Safari.
export function touchSetCookieHeaders(payload, { hostname, secure = true, now = Date.now() } = {}) {
  const touches = cleanTouches(payload, now);
  if (!touches) return [];
  const domain = cookieDomainForHost(hostname);
  const build = (name, value, anchor) => {
    const maxAge = Math.floor((Date.parse(anchor.ts) + FIRST_TOUCH_MAX_AGE_MS - now) / 1000);
    if (maxAge <= 60) return null;
    return [
      `${name}=${encodeURIComponent(JSON.stringify(value))}`,
      `Max-Age=${maxAge}`,
      'Path=/',
      'SameSite=Lax',
      ...(domain ? [`Domain=${domain}`] : []),
      ...(secure ? ['Secure'] : []),
    ].join('; ');
  };
  return [
    touches.first && build(COOKIES.first, touches.first, touches.first),
    touches.lastNonDirect && build(COOKIES.lastNonDirect, touches.lastNonDirect, touches.lastNonDirect),
    touches.history.length > 0 && build(COOKIES.history, touches.history.slice(-HISTORY_LIMIT), touches.history[touches.history.length - 1]),
  ].filter(Boolean);
}

// What gets saved on the order (order.touches): the touches the checkout
// sent, or — when it sent none (an old cached page, storage blocked) — the
// touch cookies on the order request itself. `capturedVia` says which, or
// null when neither had anything, so the report can flag the order.
// Never throws — this runs while an order is being recorded.
export function touchesForOrder(sentByBrowser, req) {
  try {
    const fromBrowser = cleanTouches(sentByBrowser);
    if (fromBrowser) return { ...fromBrowser, capturedVia: 'browser' };
    const fromCookies = readTouchCookies(req);
    if (fromCookies) return { ...fromCookies, capturedVia: 'cookies' };
  } catch (err) {
    console.error('Reading order touches failed:', err.message);
  }
  return { first: null, lastNonDirect: null, history: [], lastClick: null, capturedVia: null };
}
