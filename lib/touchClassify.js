// Channel classification for first-touch / last-non-direct attribution
// (lib/touches.js in the browser, lib/touchServer.js on the server,
// lib/attributionReport.js for the admin report). Pure functions with no
// imports, so the same rules run everywhere and can be unit-tested with
// `npm test` (tests/touchClassify.test.mjs).
//
// A "touch" is one visit's source:
//   { channel, source, medium, campaign, content, term, ad_id, landing, ts }
//
// Rules, most specific first. Explicit signals on the link (click IDs,
// UTMs) are checked before the referrer, so a tagged link always wins over
// whatever page happened to send the visitor:
//   Meta Paid       fbclid, or utm_source facebook / instagram / fb / ig
//   Google Paid     gclid (or Google's iOS gbraid/wbraid), or
//                   utm_source=google with a paid medium (cpc, ppc, paid…)
//   TikTok Paid     ttclid, or utm_source=tiktok
//   Email/SMS       utm_medium email / sms, or utm_source klaviyo /
//                   attentive / postscript
//   Google Organic  referrer is a Google domain (no gclid)
//   Social Organic  referrer is a social network (no paid signals)
//   Referral        any other external referrer — and tagged links whose
//                   source matches none of the above (utm_source=pinterest,
//                   a partner's tag…), credited to that utm_source
//   Direct          no UTMs, no click IDs, no external referrer
// "External" ignores this site's own domains and the payment / checkout
// providers a shopper bounces through mid-purchase (PAYMENT_HOSTS).

export const CHANNELS = [
  'Meta Paid',
  'Google Paid',
  'Google Organic',
  'TikTok Paid',
  'Email/SMS',
  'Social Organic',
  'Referral',
  'Direct',
];

export const PARAM_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'ad_id', 'fbclid', 'gclid', 'gbraid', 'wbraid', 'ttclid',
  // Meta URL-tag style names this site's ads may already use instead of
  // UTMs (lib/attribution.js describeAdPlacement): used only as fallbacks
  // for campaign / content / term.
  'campaign_name', 'adset_name', 'ad_name',
];

const OWN_HOSTS = ['aneseskin.com'];

// Payment and checkout providers: coming back from one of these mid-purchase
// is the same visit continuing, not a new source.
const PAYMENT_HOSTS = [
  'shop.app', 'shopify.com', 'myshopify.com', 'shopifycs.com',
  'afterpay.com', 'clearpay.co.uk', 'cash.app', 'squareup.com', 'square.site', 'squarecdn.com',
  'amazon.com', 'amazonpay.com', 'payments-amazon.com',
  'paypal.com', 'paypalobjects.com', 'intuit.com', 'quickbooks.com',
  'stripe.com', 'bankful.com', 'klarna.com', 'affirm.com',
];

const SOCIAL_HOSTS = [
  'facebook.com', 'fb.com', 'fb.me', 'messenger.com', 'instagram.com', 'threads.net', 'threads.com',
  'tiktok.com', 'pinterest.com', 'pin.it', 'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 't.co',
  'reddit.com', 'linkedin.com', 'lnkd.in', 'snapchat.com', 'tumblr.com', 'whatsapp.com',
];

const META_SOURCES = ['facebook', 'instagram', 'fb', 'ig', 'meta'];
const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'paidsearch', 'paid_search', 'paid-search', 'sem', 'cpm', 'display'];
const EMAIL_SOURCES = ['klaviyo', 'attentive', 'postscript'];
const EMAIL_MEDIUMS = ['email', 'sms', 'e-mail', 'text'];

const MAX_FIELD = 150;

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function clip(value, max = MAX_FIELD) {
  const s = String(value ?? '').trim();
  return s ? s.slice(0, max) : null;
}

// Host matches `domain` itself or any subdomain of it.
function hostIs(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function hostIn(host, list) {
  return list.some((d) => hostIs(host, d));
}

export function referrerHost(referrer) {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.hostname.toLowerCase().replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

// Google domains: google.com, google.co.uk, google.de, … (not googleapis,
// googleusercontent, or Gmail, which is email rather than search).
function isGoogleHost(host) {
  if (hostIs(host, 'mail.google.com')) return false;
  return /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host);
}

// Whether a referrer is one we ignore: this site itself (any of
// ownHosts, plus aneseskin.com) or a payment / checkout provider.
export function isInternalReferrer(host, ownHosts = []) {
  if (!host) return true;
  const own = [...OWN_HOSTS, ...ownHosts.map((h) => lower(h).replace(/^www\./, ''))].filter(Boolean);
  return hostIn(host, own) || hostIn(host, PAYMENT_HOSTS);
}

// Classifies one visit. `params` is the landing URL's query params (plain
// object or URLSearchParams), `referrer` is document.referrer, `ownHosts`
// the current site hostname(s), `landing` the landing path, `now` a Date.
export function classifyVisit({ params = {}, referrer = '', ownHosts = [], landing = '/', now = new Date() } = {}) {
  const get = (k) => {
    const v = typeof params.get === 'function' ? params.get(k) : params[k];
    return v == null ? '' : String(v).trim();
  };
  const p = Object.fromEntries(PARAM_KEYS.map((k) => [k, get(k)]));
  const source = lower(p.utm_source);
  const medium = lower(p.utm_medium);
  const refHost = referrerHost(referrer);
  const external = refHost && !isInternalReferrer(refHost, ownHosts) ? refHost : null;
  const hasUtm = Boolean(p.utm_source || p.utm_medium || p.utm_campaign || p.utm_content || p.utm_term);
  const gclid = p.gclid || p.gbraid || p.wbraid;

  let channel;
  let derivedSource = p.utm_source || null;
  let derivedMedium = p.utm_medium || null;

  if (p.fbclid || META_SOURCES.includes(source)) {
    channel = 'Meta Paid';
    derivedSource = derivedSource || 'facebook';
    derivedMedium = derivedMedium || 'paid_social';
  } else if (gclid || (source === 'google' && PAID_MEDIUMS.includes(medium))) {
    channel = 'Google Paid';
    derivedSource = derivedSource || 'google';
    derivedMedium = derivedMedium || 'cpc';
  } else if (p.ttclid || source === 'tiktok') {
    channel = 'TikTok Paid';
    derivedSource = derivedSource || 'tiktok';
    derivedMedium = derivedMedium || 'paid_social';
  } else if (EMAIL_MEDIUMS.includes(medium) || EMAIL_SOURCES.includes(source)) {
    channel = 'Email/SMS';
  } else if (external && isGoogleHost(external)) {
    channel = 'Google Organic';
    derivedSource = derivedSource || 'google';
    derivedMedium = derivedMedium || 'organic';
  } else if (external && hostIn(external, SOCIAL_HOSTS)) {
    channel = 'Social Organic';
    derivedSource = derivedSource || external;
    derivedMedium = derivedMedium || 'social';
  } else if (external) {
    channel = 'Referral';
    derivedSource = derivedSource || external;
    derivedMedium = derivedMedium || 'referral';
  } else if (hasUtm) {
    // Tagged, but not a source any rule above knows: treated as a referral
    // from whatever utm_source names, rather than as Direct.
    channel = 'Referral';
  } else {
    channel = 'Direct';
    derivedSource = '(direct)';
    derivedMedium = '(none)';
  }

  return sanitizeTouch({
    channel,
    source: derivedSource,
    medium: derivedMedium,
    campaign: p.utm_campaign || p.campaign_name,
    content: p.utm_content || p.adset_name,
    term: p.utm_term || p.ad_name,
    ad_id: p.ad_id,
    landing,
    ts: now.toISOString(),
  });
}

// Coerces anything that claims to be a touch (from a cookie, localStorage,
// or a request body — all untrusted) into the exact shape above, or null.
export function sanitizeTouch(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!CHANNELS.includes(raw.channel)) return null;
  const ts = new Date(raw.ts);
  if (Number.isNaN(ts.getTime())) return null;
  return {
    channel: raw.channel,
    source: clip(raw.source),
    medium: clip(raw.medium),
    campaign: clip(raw.campaign),
    content: clip(raw.content),
    term: clip(raw.term),
    ad_id: clip(raw.ad_id, 64),
    landing: clip(String(raw.landing || '').split(/[?#]/)[0], 200) || '/',
    ts: ts.toISOString(),
  };
}

export const isDirect = (touch) => !touch || touch.channel === 'Direct';

// Same source, same campaign/ad, same landing page — a page reload or the
// same link opened twice, not a new touch.
export function sameTouch(a, b) {
  if (!a || !b) return false;
  return ['channel', 'source', 'medium', 'campaign', 'content', 'term', 'ad_id', 'landing'].every((k) => (a[k] || null) === (b[k] || null));
}

export const FIRST_TOUCH_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
export const HISTORY_LIMIT = 5;
// A repeat of the same touch inside this window updates nothing.
export const REPEAT_WINDOW_MS = 30 * 60 * 1000;

export function isExpired(touch, now = Date.now(), maxAge = FIRST_TOUCH_MAX_AGE_MS) {
  return !touch || now - Date.parse(touch.ts) > maxAge;
}

// Folds one visit into stored state { first, lastNonDirect, history }.
// first is set once (and again only after it has expired); lastNonDirect
// and history only ever change on a non-direct visit; history keeps the
// last HISTORY_LIMIT non-direct touches, newest last. Returns the new state
// and whether anything changed.
export function applyVisit(state, visit, now = Date.now()) {
  const prev = {
    first: isExpired(state?.first, now) ? null : sanitizeTouch(state?.first),
    lastNonDirect: isExpired(state?.lastNonDirect, now) ? null : sanitizeTouch(state?.lastNonDirect),
    history: (Array.isArray(state?.history) ? state.history : [])
      .map(sanitizeTouch)
      .filter((t) => t && !isExpired(t, now) && !isDirect(t))
      .slice(-HISTORY_LIMIT),
  };
  const next = { ...prev, history: [...prev.history] };
  if (!visit) return { state: next, changed: false };

  if (!next.first) next.first = visit;
  if (!isDirect(visit)) {
    const last = next.lastNonDirect;
    const repeat = sameTouch(last, visit) && Date.parse(visit.ts) - Date.parse(last.ts) < REPEAT_WINDOW_MS;
    if (!repeat) {
      next.lastNonDirect = visit;
      next.history = [...next.history, visit].slice(-HISTORY_LIMIT);
    }
  }
  const changed = JSON.stringify(next) !== JSON.stringify(prev);
  return { state: next, changed };
}
