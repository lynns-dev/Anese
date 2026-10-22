// Admin attribution report (components/AttributionReport.jsx). Behind the
// admin session check in middleware.js like every /api/admin/* route.
//
// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD          report JSON (store time zone days)
// GET ?from=…&to=…&format=csv                  every order in range, all fields
// POST { action: 'backfill' }                  one-time migration: copy every
//   order still in the 45-day order store into the permanent attribution
//   history (lib/attributionLedger.js backfillLedger). Safe to repeat.
//
// Rows come from the permanent history plus the last 45 days of full orders
// (lib/attributionReport.js buildRows).

import { getOrders, dateKeysForRange } from '../../../lib/analyticsStore';
import { readLedger, backfillLedger } from '../../../lib/attributionLedger';
import { buildRows, summarize, metaAssists, timeToPurchase, isTracked, CSV_HEADER, csvRow, MODELS, DAY_BUCKETS } from '../../../lib/attributionReport';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TZ = 'America/Los_Angeles';

// Milliseconds between UTC and the store's time zone at `ms`.
function tzOffsetMs(ms) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - ms;
}

// Start of a store-time-zone day, as a UTC timestamp.
function dayStart(day) {
  const guess = Date.parse(`${day}T00:00:00Z`);
  return guess - tzOffsetMs(guess);
}

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function recentOrders() {
  return (await Promise.all(dateKeysForRange('45d').map((key) => getOrders(key)))).flat();
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      if (req.body?.action !== 'backfill') return res.status(400).json({ error: 'Unknown action.' });
      const result = await backfillLedger(await recentOrders());
      return res.status(200).json(result);
    }
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { from, to, format } = req.query;
    if (!DAY_RE.test(from || '') || !DAY_RE.test(to || '') || from > to) {
      return res.status(400).json({ error: 'from and to must be YYYY-MM-DD, from ≤ to.' });
    }
    const fromMs = dayStart(from);
    const toMs = dayStart(new Date(Date.parse(`${to}T00:00:00Z`) + 86400000).toISOString().slice(0, 10)) - 1;
    const [ledger, orders] = await Promise.all([readLedger(fromMs, toMs), recentOrders()]);
    const rows = buildRows(ledger, orders, { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() });

    if (format === 'csv') {
      const lines = [CSV_HEADER, ...rows.map(csvRow)].map((r) => r.map(csvCell).join(','));
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="anese-attribution-${from}-to-${to}.csv"`);
      return res.status(200).send(lines.join('\n'));
    }

    return res.status(200).json({
      from,
      to,
      models: MODELS,
      buckets: DAY_BUCKETS,
      summary: summarize(rows),
      meta: metaAssists(rows),
      timeToPurchase: timeToPurchase(rows),
      notInLedger: rows.filter((r) => r.notInLedger).length,
      untrackedOrders: rows.filter((r) => !isTracked(r)).slice(0, 50).map((r) => ({ id: r.id, createdAt: r.createdAt, amount: r.amount, status: r.status })),
    });
  } catch (err) {
    console.error('Attribution report failed:', err);
    return res.status(500).json({ error: err.message });
  }
}
