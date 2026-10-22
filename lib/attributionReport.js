// The admin attribution report (pages/api/admin/attribution.js,
// components/AttributionReport.jsx), as pure functions over order records
// so it can be tested without KV (tests/attributionReport.test.mjs).
//
// Three models, side by side:
//   Last click         the converting visit's own source, direct included
//                      (order.touches.lastClick)
//   Last non-direct    the latest non-direct touch (Direct only when every
//                      visit in the last 90 days was direct)
//   First touch        the first visit in the last 90 days
// Orders saved before touch tracking existed are counted under "No
// attribution data" in every model, never as Direct. Refunded and cancelled
// orders are listed in the CSV but left out of revenue.

import { CHANNELS } from './touchClassify';

export const MODELS = [
  ['lastClick', 'Last click'],
  ['lastNonDirect', 'Last non-direct'],
  ['first', 'First touch'],
];
export const NO_DATA = 'No attribution data';
export const UNKNOWN = 'Unknown';
const EXCLUDED_STATUSES = ['refunded', 'cancelled'];
export const DAY_BUCKETS = ['Same day', '1-3 days', '4-7 days', '8-14 days', '15-30 days', '30+ days'];

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayNumber = (ts) => Date.parse(`${dayFormatter.format(new Date(ts))}T00:00:00Z`) / 86400000;

export function isTracked(row) {
  return Boolean(row.touches && row.touches.capturedVia);
}

export function channelFor(row, model) {
  if (!isTracked(row)) return NO_DATA;
  const t = row.touches;
  if (model === 'lastClick') return t.lastClick?.channel || UNKNOWN;
  if (model === 'lastNonDirect') return t.lastNonDirect?.channel || 'Direct';
  return t.first?.channel || UNKNOWN;
}

export function counted(row) {
  return !EXCLUDED_STATUSES.includes(row.status);
}

// Ledger records (permanent) + recent full orders (45 days): one row per
// order. The ledger supplies the touches; a recent order supplies its
// current status (refunds happen after the ledger row was written) and
// covers any order the ledger doesn't have yet.
export function buildRows(ledger, recentOrders, { from, to }) {
  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  const byId = new Map();
  for (const r of ledger) byId.set(r.id, { ...r });
  for (const o of recentOrders) {
    const existing = byId.get(o.id);
    if (existing) {
      existing.status = o.status || existing.status;
    } else {
      byId.set(o.id, {
        id: o.id,
        createdAt: o.createdAt,
        amount: Number(o.amount) || 0,
        status: o.status || 'paid',
        paymentMethod: o.paymentMethod || null,
        processor: o.processor || null,
        email: o.email || '',
        touches: o.touches || null,
        legacySource: null,
        notInLedger: true,
      });
    }
  }
  return [...byId.values()]
    .filter((r) => {
      const t = Date.parse(r.createdAt);
      return Number.isFinite(t) && t >= fromMs && t <= toMs;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function emptyCell() {
  return { orders: 0, revenue: 0 };
}

// { channels: [...], models: { lastClick: { [channel]: {orders, revenue, aov, share} }, … }, totals }
export function summarize(rows) {
  const live = rows.filter(counted);
  const totalRevenue = live.reduce((s, r) => s + r.amount, 0);
  const models = {};
  const seen = new Set();
  for (const [key] of MODELS) {
    const cells = {};
    for (const r of live) {
      const ch = channelFor(r, key);
      seen.add(ch);
      cells[ch] = cells[ch] || emptyCell();
      cells[ch].orders += 1;
      cells[ch].revenue += r.amount;
    }
    for (const c of Object.values(cells)) {
      c.revenue = Math.round(c.revenue * 100) / 100;
      c.aov = c.orders ? Math.round((c.revenue / c.orders) * 100) / 100 : 0;
      c.share = totalRevenue ? c.revenue / totalRevenue : 0;
    }
    models[key] = cells;
  }
  const order = [...CHANNELS, UNKNOWN, NO_DATA];
  const channels = order.filter((c) => seen.has(c));
  return {
    channels,
    models,
    totals: {
      orders: live.length,
      revenue: Math.round(totalRevenue * 100) / 100,
      aov: live.length ? Math.round((totalRevenue / live.length) * 100) / 100 : 0,
      untracked: live.filter((r) => !isTracked(r)).length,
      excluded: rows.length - live.length,
    },
  };
}

// Revenue Meta started (first touch) that last click gave to Direct or
// Google, by the campaign / ad of that first Meta touch.
export function metaAssists(rows) {
  const groups = new Map();
  for (const r of rows.filter(counted)) {
    if (channelFor(r, 'first') !== 'Meta Paid') continue;
    const lastClick = channelFor(r, 'lastClick');
    if (!['Direct', 'Google Organic', 'Google Paid'].includes(lastClick)) continue;
    const f = r.touches.first;
    const campaign = f.campaign || '(no campaign tag)';
    const ad = f.ad_id || f.term || f.content || '(no ad tag)';
    const key = `${campaign}\u0000${ad}`;
    const g = groups.get(key) || { campaign, ad, adId: f.ad_id || null, adName: f.term || null, adset: f.content || null, orders: 0, revenue: 0, lastClick: {} };
    g.orders += 1;
    g.revenue = Math.round((g.revenue + r.amount) * 100) / 100;
    g.lastClick[lastClick] = (g.lastClick[lastClick] || 0) + 1;
    groups.set(key, g);
  }
  const list = [...groups.values()].sort((a, b) => b.revenue - a.revenue);
  return {
    rows: list,
    totals: { orders: list.reduce((s, g) => s + g.orders, 0), revenue: Math.round(list.reduce((s, g) => s + g.revenue, 0) * 100) / 100 },
  };
}

export function daysToPurchase(row) {
  const first = row.touches?.first;
  if (!isTracked(row) || !first?.ts) return null;
  return Math.max(0, dayNumber(row.createdAt) - dayNumber(first.ts));
}

export function bucketFor(days) {
  if (days == null) return null;
  if (days === 0) return 'Same day';
  if (days <= 3) return '1-3 days';
  if (days <= 7) return '4-7 days';
  if (days <= 14) return '8-14 days';
  if (days <= 30) return '15-30 days';
  return '30+ days';
}

// Order counts and revenue per bucket, for all tracked orders and for
// orders Meta touched first.
export function timeToPurchase(rows) {
  const make = () => Object.fromEntries(DAY_BUCKETS.map((b) => [b, { orders: 0, revenue: 0 }]));
  const all = make();
  const meta = make();
  for (const r of rows.filter(counted)) {
    const bucket = bucketFor(daysToPurchase(r));
    if (!bucket) continue;
    all[bucket].orders += 1;
    all[bucket].revenue = Math.round((all[bucket].revenue + r.amount) * 100) / 100;
    if (channelFor(r, 'first') === 'Meta Paid') {
      meta[bucket].orders += 1;
      meta[bucket].revenue = Math.round((meta[bucket].revenue + r.amount) * 100) / 100;
    }
  }
  return { all, meta };
}

const TOUCH_FIELDS = ['channel', 'source', 'medium', 'campaign', 'content', 'term', 'ad_id', 'landing', 'ts'];
const TOUCH_SETS = [['last_click', 'lastClick'], ['last_non_direct', 'lastNonDirect'], ['first_touch', 'first']];

export const CSV_HEADER = [
  'order_id', 'created_at', 'amount', 'status', 'counted_in_revenue', 'payment_method', 'email',
  'attribution_data', 'captured_via',
  'last_click_channel_model', 'last_non_direct_channel_model', 'first_touch_channel_model',
  ...TOUCH_SETS.flatMap(([prefix]) => TOUCH_FIELDS.map((f) => `${prefix}_${f}`)),
  'days_first_touch_to_purchase', 'days_bucket', 'touch_history', 'legacy_order_source',
];

export function csvRow(r) {
  const t = r.touches || {};
  const days = daysToPurchase(r);
  return [
    r.id, r.createdAt, Number(r.amount).toFixed(2), r.status, counted(r) ? 'yes' : 'no', r.paymentMethod || '', r.email || '',
    isTracked(r) ? 'yes' : 'NO — order predates tracking or arrived without touch data', t.capturedVia || '',
    channelFor(r, 'lastClick'), channelFor(r, 'lastNonDirect'), channelFor(r, 'first'),
    ...TOUCH_SETS.flatMap(([, key]) => TOUCH_FIELDS.map((f) => t[key]?.[f] ?? '')),
    days ?? '', bucketFor(days) || '',
    (t.history || []).map((h) => `${h.ts} ${h.channel} ${h.source || ''}/${h.medium || ''} ${h.campaign || ''}`.trim()).join(' | '),
    r.legacySource ? [r.legacySource.source, r.legacySource.medium, r.legacySource.campaign].filter(Boolean).join(' / ') : '',
  ];
}
