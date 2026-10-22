// Permanent attribution history: one compact record per order, so the
// attribution report (pages/api/admin/attribution.js) can look back past
// the 45 days full orders are kept (lib/analyticsStore.js, orders:<day>,
// 45-day expiry). This is the "attribution column" for a store with no SQL
// database.
//
// Keys (KV, no expiry): attribution_ledger:<YYYY-MM> — a Redis list of JSON
// records, one month per key (store time zone), appended with RPUSH so two
// orders landing at once can't overwrite each other:
//   { id, createdAt, amount, status, paymentMethod, processor, email,
//     touches: { first, lastNonDirect, history, lastClick, capturedVia },
//     legacySource }
// touches.capturedVia is null for orders placed before touch tracking
// existed (written by backfillLedger, the one-time migration below) — the
// report flags those rather than counting them as Direct.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const PREFIX = 'attribution_ledger:';

const monthFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit' });

export function monthKey(date) {
  return monthFormatter.format(new Date(date)).slice(0, 7);
}

async function redis(command) {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'Redis command failed.');
  return data.result;
}

// The existing "Order source" (last tagged visit, lib/attribution.js), kept
// alongside for orders that predate touch tracking.
function legacySource(attr) {
  if (!attr) return null;
  if (attr.utm_source) return { source: attr.utm_source, medium: attr.utm_medium || null, campaign: attr.utm_campaign || attr.campaign_name || null };
  if (attr.fbclid) return { source: 'facebook', medium: 'fbclid', campaign: attr.campaign_name || null };
  if (attr.gclid) return { source: 'google', medium: 'gclid', campaign: null };
  return null;
}

export function ledgerRecord(order) {
  return {
    id: order.id,
    createdAt: order.createdAt,
    amount: Number(order.amount) || 0,
    status: order.status || 'paid',
    paymentMethod: order.paymentMethod || null,
    processor: order.processor || null,
    email: order.email || '',
    touches: order.touches || { first: null, lastNonDirect: null, history: [], lastClick: null, capturedVia: null },
    legacySource: legacySource(order.attribution),
  };
}

export async function appendToLedger(order) {
  await redis(['RPUSH', `${PREFIX}${monthKey(order.createdAt)}`, JSON.stringify(ledgerRecord(order))]);
}

// Months (YYYY-MM) from `from` to `to`, inclusive.
export function monthsBetween(from, to) {
  const months = [];
  const [fy, fm] = monthKey(from).split('-').map(Number);
  const [ty, tm] = monthKey(to).split('-').map(Number);
  for (let y = fy, m = fm; y < ty || (y === ty && m <= tm); m === 12 ? (y += 1, m = 1) : (m += 1)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    if (months.length > 240) break;
  }
  return months;
}

export async function readLedger(from, to) {
  const months = monthsBetween(from, to);
  const lists = await Promise.all(months.map((m) => redis(['LRANGE', `${PREFIX}${m}`, '0', '-1']).catch(() => [])));
  const records = [];
  for (const list of lists) {
    for (const raw of list || []) {
      try { records.push(JSON.parse(raw)); } catch { /* skip a corrupt row */ }
    }
  }
  return records;
}

// One-time migration (admin → Attribution → "Save older orders"): copies
// every order still in the 45-day order store that isn't in the ledger yet,
// so it stays in the report after its full order expires. Orders saved
// before touch tracking get touches.capturedVia null (flagged "No
// attribution data"). Safe to run more than once.
export async function backfillLedger(orders) {
  if (!orders.length) return { added: 0 };
  const times = orders.map((o) => Date.parse(o.createdAt)).filter(Number.isFinite);
  const existing = await readLedger(Math.min(...times), Math.max(...times));
  const known = new Set(existing.map((r) => r.id));
  let added = 0;
  for (const order of orders.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))) {
    if (!order.id || known.has(order.id) || !order.createdAt) continue;
    await appendToLedger(order);
    known.add(order.id);
    added += 1;
  }
  return { added };
}
