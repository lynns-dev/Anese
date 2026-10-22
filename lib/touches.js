// Browser side of first-touch / last-non-direct attribution. Once per full
// page load (pages/_app.jsx), the landing URL and referrer are classified
// into a channel (lib/touchClassify.js) and folded into:
//
//   an_ft  first_touch            set once; a new one only after 90 days
//   an_lt  last_non_direct_touch  replaced by every non-direct visit
//   an_th  touch_history          the last 5 non-direct touches
//   an_st  this visit's own touch (session cookie: the last-click source of
//          the visit that converts, direct included, for comparison)
//
// Each is a first-party cookie (so the server can read it too —
// lib/touchServer.js) with a localStorage copy as a backup. Safari deletes
// cookies written by JavaScript after 7 days, so the touches also ride along
// on the visit's existing page-view ping and the server sets the same
// cookies back with their full lifetime (pages/api/track/event.js), the way
// the Meta click cookie already works. The checkout sends them with the
// order via lib/attribution.js getStoredAttribution().
//
// Separate from lib/attribution.js's last-tagged-visit record, which the
// admin "Order source" and the Meta purchase event keep using unchanged.
// Every function here swallows its own errors: attribution must never break
// a page.

import { classifyVisit, applyVisit, sanitizeTouch, FIRST_TOUCH_MAX_AGE_MS, HISTORY_LIMIT } from './touchClassify';

export const TOUCH_COOKIES = { first: 'an_ft', lastNonDirect: 'an_lt', history: 'an_th', session: 'an_st' };
const STORAGE_KEY = 'anese-touches';
const SESSION_KEY = 'anese-session-touch';
const SYNCED_KEY = 'anese-touches-synced';

let capturedThisLoad = false;

// Consent hook. The site has no cookie-consent banner today, so this is
// always true — but every read and write below goes through it, so a future
// banner only needs to set `anese_consent=denied` (or
// window.__aneseTrackingConsent = false) for all of this to stop.
export function trackingAllowed() {
  try {
    if (typeof window === 'undefined') return false;
    if (window.__aneseTrackingConsent === false) return false;
    return !/(?:^|; )anese_consent=denied(?:;|$)/.test(document.cookie);
  } catch {
    return false;
  }
}

function readCookie(name) {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? JSON.parse(decodeURIComponent(match[1])) : null;
  } catch {
    return null;
  }
}

function cookieDomain() {
  const host = window.location.hostname;
  return host === 'aneseskin.com' || host.endsWith('.aneseskin.com') ? '; Domain=.aneseskin.com' : '';
}

function writeCookie(name, value, maxAgeSeconds) {
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const age = maxAgeSeconds == null ? '' : `; Max-Age=${Math.max(60, Math.floor(maxAgeSeconds))}`;
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}${age}; Path=/; SameSite=Lax${cookieDomain()}${secure}`;
  } catch { /* cookies blocked */ }
}

const remainingSeconds = (touch) => (Date.parse(touch.ts) + FIRST_TOUCH_MAX_AGE_MS - Date.now()) / 1000;

function readState() {
  let stored = null;
  try { stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null'); } catch { stored = null; }
  const pick = (cookieName, key) => {
    const fromCookie = readCookie(cookieName);
    return fromCookie != null ? fromCookie : stored?.[key] ?? null;
  };
  return {
    first: pick(TOUCH_COOKIES.first, 'first'),
    lastNonDirect: pick(TOUCH_COOKIES.lastNonDirect, 'lastNonDirect'),
    history: pick(TOUCH_COOKIES.history, 'history') || [],
  };
}

function writeState(state) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
  if (state.first) writeCookie(TOUCH_COOKIES.first, state.first, remainingSeconds(state.first));
  if (state.lastNonDirect) writeCookie(TOUCH_COOKIES.lastNonDirect, state.lastNonDirect, remainingSeconds(state.lastNonDirect));
  if (state.history.length) writeCookie(TOUCH_COOKIES.history, state.history, remainingSeconds(state.history[state.history.length - 1]));
}

// Puts a cookie back from the localStorage copy when the browser dropped it
// (Safari's 7-day cap, a cookie clear) — only when it's actually missing,
// so a longer-lived server-set cookie is never replaced by a capped one.
function restoreMissingCookies(state) {
  if (state.first && !readCookie(TOUCH_COOKIES.first)) writeCookie(TOUCH_COOKIES.first, state.first, remainingSeconds(state.first));
  if (state.lastNonDirect && !readCookie(TOUCH_COOKIES.lastNonDirect)) writeCookie(TOUCH_COOKIES.lastNonDirect, state.lastNonDirect, remainingSeconds(state.lastNonDirect));
  if (state.history.length && !readCookie(TOUCH_COOKIES.history)) writeCookie(TOUCH_COOKIES.history, state.history, remainingSeconds(state.history[state.history.length - 1]));
}

// This visit's own source: set on its first page, and replaced if a later
// page in the same visit arrives on a new non-direct link.
function updateSessionTouch(visit) {
  try {
    const current = sanitizeTouch(JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || 'null'));
    if (current && visit.channel === 'Direct') return;
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(visit));
    writeCookie(TOUCH_COOKIES.session, visit, null);
  } catch { /* storage blocked */ }
}

function getSessionTouch() {
  try {
    return sanitizeTouch(JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || 'null')) || sanitizeTouch(readCookie(TOUCH_COOKIES.session));
  } catch {
    return null;
  }
}

// Classifies this page load and updates the stored touches. Runs once per
// full page load: Next.js page changes after that keep the original
// document.referrer, which would otherwise be re-counted on every click.
export function captureTouches() {
  try {
    if (capturedThisLoad || typeof window === 'undefined' || !trackingAllowed()) return;
    capturedThisLoad = true;
    const visit = classifyVisit({
      params: new URLSearchParams(window.location.search),
      referrer: document.referrer,
      ownHosts: [window.location.hostname],
      landing: window.location.pathname,
    });
    if (!visit) return;
    updateSessionTouch(visit);
    const { state, changed } = applyVisit(readState(), visit);
    if (changed) writeState(state);
    else restoreMissingCookies(state);
  } catch { /* attribution must never break a page */ }
}

// Everything the order needs, sent with the checkout request
// (lib/attribution.js getStoredAttribution). null when there's nothing.
export function getTouchesForOrder() {
  try {
    if (typeof window === 'undefined' || !trackingAllowed()) return null;
    const { state } = applyVisit(readState(), null);
    const lastClick = getSessionTouch();
    if (!state.first && !state.lastNonDirect && !lastClick) return null;
    return { first: state.first, lastNonDirect: state.lastNonDirect, history: state.history.slice(-HISTORY_LIMIT), lastClick };
  } catch {
    return null;
  }
}

// The touches to hand the server on the page-view ping so it can set the
// cookies back with their full lifetime — only when they changed since the
// last time this tab sent them.
export function touchesToSync() {
  try {
    const touches = getTouchesForOrder();
    if (!touches || (!touches.first && !touches.lastNonDirect)) return null;
    const payload = { first: touches.first, lastNonDirect: touches.lastNonDirect, history: touches.history };
    if (window.sessionStorage.getItem(SYNCED_KEY) === JSON.stringify(payload)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function markTouchesSynced(payload) {
  try { window.sessionStorage.setItem(SYNCED_KEY, JSON.stringify(payload)); } catch { /* best-effort */ }
}

