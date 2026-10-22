// Channel classification and touch-state rules (lib/touchClassify.js).
// Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyVisit, applyVisit, sanitizeTouch, isInternalReferrer, HISTORY_LIMIT } from '../lib/touchClassify.js';

const NOW = new Date('2026-10-22T18:00:00Z');
const visit = (params = {}, referrer = '', extra = {}) =>
  classifyVisit({ params, referrer, ownHosts: ['aneseskin.com'], landing: '/product/that-booty-tho', now: NOW, ...extra });
const channel = (params, referrer) => visit(params, referrer).channel;

test('Meta Paid: fbclid, or facebook/instagram/fb/ig as utm_source', () => {
  assert.equal(channel({ fbclid: 'IwAR123' }), 'Meta Paid');
  for (const source of ['facebook', 'instagram', 'fb', 'ig', 'Facebook', 'IG']) {
    assert.equal(channel({ utm_source: source, utm_medium: 'paid_social' }), 'Meta Paid', source);
  }
  // fbclid wins even when the referrer is Google
  assert.equal(channel({ fbclid: 'x' }, 'https://www.google.com/'), 'Meta Paid');
  // in-app browser: facebook referrer plus fbclid
  assert.equal(channel({ fbclid: 'x' }, 'https://l.facebook.com/'), 'Meta Paid');
});

test('Google Paid: gclid (and gbraid/wbraid), or google with a paid medium', () => {
  assert.equal(channel({ gclid: 'Cj0K' }), 'Google Paid');
  assert.equal(channel({ gbraid: 'abc' }), 'Google Paid');
  assert.equal(channel({ wbraid: 'abc' }), 'Google Paid');
  assert.equal(channel({ utm_source: 'google', utm_medium: 'cpc' }), 'Google Paid');
  assert.equal(channel({ utm_source: 'google', utm_medium: 'paid' }), 'Google Paid');
  assert.equal(channel({ gclid: 'x' }, 'https://www.google.com/'), 'Google Paid');
});

test('Google Organic: Google referrer with no gclid, any Google country domain', () => {
  assert.equal(channel({}, 'https://www.google.com/'), 'Google Organic');
  assert.equal(channel({}, 'https://www.google.co.uk/search?q=x'), 'Google Organic');
  assert.equal(channel({}, 'https://google.de/'), 'Google Organic');
  // Gmail is not search
  assert.notEqual(channel({}, 'https://mail.google.com/'), 'Google Organic');
});

test('TikTok Paid: ttclid or utm_source=tiktok', () => {
  assert.equal(channel({ ttclid: 'E.C.P.x' }), 'TikTok Paid');
  assert.equal(channel({ utm_source: 'tiktok', utm_medium: 'paid' }), 'TikTok Paid');
});

test('Email/SMS: medium email/sms, or klaviyo/attentive/postscript', () => {
  assert.equal(channel({ utm_source: 'newsletter', utm_medium: 'email' }), 'Email/SMS');
  assert.equal(channel({ utm_medium: 'sms' }), 'Email/SMS');
  for (const source of ['klaviyo', 'attentive', 'postscript']) assert.equal(channel({ utm_source: source }), 'Email/SMS', source);
  // a tagged email link beats the webmail referrer
  assert.equal(channel({ utm_medium: 'email' }, 'https://mail.google.com/'), 'Email/SMS');
});

test('Social Organic: a social referrer with no paid signal', () => {
  for (const ref of ['https://www.instagram.com/', 'https://l.facebook.com/l.php', 'https://www.tiktok.com/@anese', 'https://t.co/abc', 'https://www.pinterest.com/pin/1', 'https://www.youtube.com/watch?v=1', 'https://www.reddit.com/r/skincare']) {
    assert.equal(channel({}, ref), 'Social Organic', ref);
  }
});

test('Referral: any other external site, and tagged links from unknown sources', () => {
  assert.equal(channel({}, 'https://www.allure.com/story/best-body-scrubs'), 'Referral');
  assert.equal(channel({}, 'https://www.bing.com/search?q=anese'), 'Referral');
  const t = visit({ utm_source: 'pinterest', utm_medium: 'social' });
  assert.equal(t.channel, 'Referral');
  assert.equal(t.source, 'pinterest');
});

test('Direct: nothing on the link and no outside referrer', () => {
  assert.equal(channel({}, ''), 'Direct');
  assert.equal(channel({}, 'not a url'), 'Direct');
});

test('own domain and payment/checkout domains never count as a referrer', () => {
  for (const ref of [
    'https://aneseskin.com/shop', 'https://www.aneseskin.com/', 'https://shop.app/pay', 'https://checkout.shopify.com/',
    'https://portal.afterpay.com/', 'https://cash.app/pay', 'https://pay.amazon.com/', 'https://www.paypal.com/checkout',
    'https://connect.squareup.com/', 'https://checkout.stripe.com/',
  ]) {
    assert.equal(channel({}, ref), 'Direct', ref);
  }
  // the current host passed in (e.g. a preview URL) also counts as own
  assert.equal(classifyVisit({ referrer: 'https://anese-git-x.vercel.app/a', ownHosts: ['anese-git-x.vercel.app'], now: NOW }).channel, 'Direct');
  assert.equal(isInternalReferrer('evil-aneseskin.com'), false);
});

test('touch fields: source/medium, campaign, ad_id, landing path and timestamp', () => {
  const t = visit({ utm_source: 'facebook', utm_medium: 'paid', utm_campaign: 'Fall Prospecting', utm_content: 'Broad 25-44', utm_term: 'Video 3', ad_id: '120211' });
  assert.deepEqual(t, {
    channel: 'Meta Paid', source: 'facebook', medium: 'paid', campaign: 'Fall Prospecting', content: 'Broad 25-44',
    term: 'Video 3', ad_id: '120211', landing: '/product/that-booty-tho', ts: NOW.toISOString(),
  });
  // fbclid alone gets a sensible source/medium
  assert.equal(visit({ fbclid: 'x' }).source, 'facebook');
  // Meta URL-tag style names fill campaign/content/term when UTMs are absent
  const named = visit({ fbclid: 'x', campaign_name: 'C', adset_name: 'S', ad_name: 'A' });
  assert.deepEqual([named.campaign, named.content, named.term], ['C', 'S', 'A']);
  // the query string is never stored in the landing path
  assert.equal(visit({}, '', { landing: '/shop?email=a@b.com' }).landing, '/shop');
  // long values are cut short
  assert.equal(visit({ utm_campaign: 'x'.repeat(500), utm_source: 'fb' }).campaign.length, 150);
});

test('sanitizeTouch rejects anything that is not a real touch', () => {
  assert.equal(sanitizeTouch(null), null);
  assert.equal(sanitizeTouch({ channel: 'Hacked', ts: NOW.toISOString() }), null);
  assert.equal(sanitizeTouch({ channel: 'Direct', ts: 'nope' }), null);
  assert.equal(sanitizeTouch({ channel: 'Direct', ts: NOW.toISOString(), source: '<script>' }).source, '<script>');
});

const at = (iso, params = {}, referrer = '') => classifyVisit({ params, referrer, now: new Date(iso), landing: '/' });

test('first touch is set once; last non-direct only moves on non-direct visits', () => {
  let state = {};
  const t0 = Date.parse('2026-10-01T10:00:00Z');
  ({ state } = applyVisit(state, at('2026-10-01T10:00:00Z', { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'brand' }), t0));
  ({ state } = applyVisit(state, at('2026-10-03T10:00:00Z', { fbclid: 'abc' }), t0 + 2 * 86400000));
  ({ state } = applyVisit(state, at('2026-10-05T10:00:00Z'), t0 + 4 * 86400000));
  assert.equal(state.first.channel, 'Google Paid');
  assert.equal(state.first.campaign, 'brand');
  assert.equal(state.lastNonDirect.channel, 'Meta Paid');
  assert.deepEqual(state.history.map((t) => t.channel), ['Google Paid', 'Meta Paid']);
});

test('a direct first visit is still the first touch', () => {
  const t0 = Date.parse('2026-10-01T10:00:00Z');
  let { state } = applyVisit({}, at('2026-10-01T10:00:00Z'), t0);
  ({ state } = applyVisit(state, at('2026-10-02T10:00:00Z', { fbclid: 'x' }), t0 + 86400000));
  assert.equal(state.first.channel, 'Direct');
  assert.equal(state.lastNonDirect.channel, 'Meta Paid');
});

test('history keeps the last 5 non-direct touches; a quick repeat is not a new touch', () => {
  let state = {};
  const t0 = Date.parse('2026-10-01T00:00:00Z');
  for (let i = 0; i < 8; i += 1) {
    const iso = new Date(t0 + i * 3600000).toISOString();
    ({ state } = applyVisit(state, at(iso, { utm_source: 'facebook', utm_campaign: `c${i}` }), t0 + i * 3600000));
  }
  assert.equal(state.history.length, HISTORY_LIMIT);
  assert.deepEqual(state.history.map((t) => t.campaign), ['c3', 'c4', 'c5', 'c6', 'c7']);
  const before = JSON.stringify(state);
  const { changed } = applyVisit(state, at(new Date(t0 + 7 * 3600000 + 60000).toISOString(), { utm_source: 'facebook', utm_campaign: 'c7' }), t0 + 7 * 3600000 + 60000);
  assert.equal(changed, false);
  assert.equal(JSON.stringify(state), before);
});

test('first touch expires after 90 days and the next visit becomes the new first touch', () => {
  const t0 = Date.parse('2026-06-01T00:00:00Z');
  let { state } = applyVisit({}, at('2026-06-01T00:00:00Z', { fbclid: 'old' }), t0);
  const later = t0 + 91 * 86400000;
  ({ state } = applyVisit(state, at(new Date(later).toISOString(), { utm_source: 'klaviyo' }), later));
  assert.equal(state.first.channel, 'Email/SMS');
  assert.deepEqual(state.history.map((t) => t.channel), ['Email/SMS']);
});
