// Report math (lib/attributionReport.js) and server touch cleanup
// (lib/touchServer.js). Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRows, summarize, metaAssists, timeToPurchase, bucketFor, channelFor, csvRow, CSV_HEADER, NO_DATA } from '../lib/attributionReport.js';
import { touchesForOrder, touchSetCookieHeaders } from '../lib/touchServer.js';

const touch = (channel, ts, extra = {}) => ({ channel, source: null, medium: null, campaign: null, content: null, term: null, ad_id: null, landing: '/', ts, ...extra });
const order = (id, createdAt, amount, touches, status = 'paid') => ({ id, createdAt, amount, status, touches });

const meta = touch('Meta Paid', '2026-10-01T17:00:00Z', { source: 'facebook', campaign: 'Fall', ad_id: '111', term: 'Video 3' });
const rows = buildRows([
  // Meta first, came back direct 5 days later
  order('a', '2026-10-06T18:00:00Z', 100, { first: meta, lastNonDirect: meta, history: [meta], lastClick: touch('Direct', '2026-10-06T17:50:00Z'), capturedVia: 'browser' }),
  // Meta first, came back via Google search same day
  order('b', '2026-10-01T20:00:00Z', 50, { first: meta, lastNonDirect: touch('Google Organic', '2026-10-01T19:00:00Z'), history: [], lastClick: touch('Google Organic', '2026-10-01T19:00:00Z'), capturedVia: 'browser' }),
  // email all the way
  order('c', '2026-10-10T18:00:00Z', 40, { first: touch('Email/SMS', '2026-09-01T17:00:00Z'), lastNonDirect: touch('Email/SMS', '2026-10-10T17:00:00Z'), history: [], lastClick: touch('Email/SMS', '2026-10-10T17:00:00Z'), capturedVia: 'cookies' }),
  // refunded: not counted
  order('d', '2026-10-11T18:00:00Z', 999, { first: meta, lastNonDirect: meta, history: [], lastClick: meta, capturedVia: 'browser' }),
], [
  // only in the 45-day store, from before tracking
  { id: 'e', createdAt: '2026-10-02T18:00:00Z', amount: 30, status: 'paid' },
  // refund recorded on the full order after the ledger row was written
  { id: 'd', createdAt: '2026-10-11T18:00:00Z', amount: 999, status: 'refunded' },
], { from: '2026-10-01T00:00:00Z', to: '2026-10-31T23:59:59Z' });

test('rows merge ledger + recent orders, newest first, with current status', () => {
  assert.deepEqual(rows.map((r) => r.id), ['d', 'c', 'a', 'e', 'b']);
  assert.equal(rows.find((r) => r.id === 'd').status, 'refunded');
  assert.equal(rows.find((r) => r.id === 'e').notInLedger, true);
});

test('three models side by side; untracked orders are flagged, never Direct', () => {
  const s = summarize(rows);
  assert.equal(s.totals.orders, 4);
  assert.equal(s.totals.revenue, 220);
  assert.equal(s.totals.untracked, 1);
  assert.equal(s.totals.excluded, 1);
  assert.deepEqual(s.models.first['Meta Paid'], { orders: 2, revenue: 150, aov: 75, share: 150 / 220 });
  assert.equal(s.models.lastClick['Meta Paid'], undefined);
  assert.equal(s.models.lastClick.Direct.revenue, 100);
  assert.equal(s.models.lastNonDirect['Meta Paid'].revenue, 100);
  assert.equal(s.models.lastNonDirect['Google Organic'].revenue, 50);
  assert.equal(s.models.first[NO_DATA].revenue, 30);
  assert.equal(channelFor(rows.find((r) => r.id === 'e'), 'lastClick'), NO_DATA);
});

test('Meta breakdown: first-touch Meta that last click gave to Direct/Google', () => {
  const m = metaAssists(rows);
  assert.equal(m.totals.orders, 2);
  assert.equal(m.totals.revenue, 150);
  assert.deepEqual(m.rows[0], { campaign: 'Fall', ad: '111', adId: '111', adName: 'Video 3', adset: null, orders: 2, revenue: 150, lastClick: { Direct: 1, 'Google Organic': 1 } });
});

test('days from first touch to purchase, bucketed', () => {
  assert.deepEqual([0, 1, 3, 4, 7, 8, 14, 15, 30, 31, null].map(bucketFor),
    ['Same day', '1-3 days', '1-3 days', '4-7 days', '4-7 days', '8-14 days', '8-14 days', '15-30 days', '15-30 days', '30+ days', null]);
  const t = timeToPurchase(rows);
  assert.equal(t.all['Same day'].orders, 1);
  assert.equal(t.all['4-7 days'].orders, 1);
  assert.equal(t.all['30+ days'].orders, 1);
  assert.equal(t.meta['Same day'].revenue, 50);
  assert.equal(t.meta['4-7 days'].revenue, 100);
  assert.equal(t.meta['30+ days'].orders, 0);
});

test('CSV row lines up with the header and flags missing data', () => {
  for (const r of rows) assert.equal(csvRow(r).length, CSV_HEADER.length);
  const e = csvRow(rows.find((r) => r.id === 'e'));
  assert.match(e[CSV_HEADER.indexOf('attribution_data')], /^NO/);
});

test('order touches: browser first, cookies as fallback, flagged when neither', () => {
  const ts = new Date().toISOString();
  const sent = { first: touch('Meta Paid', ts), lastNonDirect: touch('Meta Paid', ts), history: [touch('Meta Paid', ts)], lastClick: touch('Direct', ts) };
  assert.equal(touchesForOrder(sent, {}).capturedVia, 'browser');
  const cookies = { an_ft: encodeURIComponent(JSON.stringify(touch('Referral', ts))) };
  const fromCookie = touchesForOrder(null, { cookies });
  assert.equal(fromCookie.capturedVia, 'cookies');
  assert.equal(fromCookie.first.channel, 'Referral');
  assert.equal(touchesForOrder({ first: { channel: 'Bogus', ts } }, {}).capturedVia, null);
  assert.equal(touchesForOrder(null, null).capturedVia, null);
});

test('server re-issues touch cookies with the rest of their 90 days', () => {
  const ts = new Date(Date.now() - 10 * 86400000).toISOString();
  const headers = touchSetCookieHeaders({ first: touch('Meta Paid', ts), lastNonDirect: touch('Meta Paid', ts), history: [touch('Meta Paid', ts)] }, { hostname: 'www.aneseskin.com' });
  assert.equal(headers.length, 3);
  const maxAge = Number(headers[0].match(/Max-Age=(\d+)/)[1]);
  assert.ok(Math.abs(maxAge - 80 * 86400) < 120, String(maxAge));
  assert.match(headers[0], /^an_ft=.*Domain=\.aneseskin\.com/);
  assert.deepEqual(touchSetCookieHeaders({ first: { channel: 'x' } }, { hostname: 'aneseskin.com' }), []);
});
