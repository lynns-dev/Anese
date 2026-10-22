// Admin → Attribution: revenue by channel under last click, last non-direct
// and first touch (pages/api/admin/attribution.js, lib/attributionReport.js),
// the Meta orders last click hands to Direct/Google, time from first touch
// to purchase, and a CSV of every order.

import React from 'react';
import { T, S } from '../lib/theme';

const TZ = 'America/Los_Angeles';
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const today = () => dayFormatter.format(new Date());
const daysAgo = (n) => dayFormatter.format(new Date(Date.now() - n * 86400000));
const PRESETS = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last 12 months']];

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n) => `${Math.round((n || 0) * 1000) / 10}%`;

export default function AttributionReport() {
  const [from, setFrom] = React.useState(daysAgo(29));
  const [to, setTo] = React.useState(today());
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [backfill, setBackfill] = React.useState({ busy: false, message: '' });

  const load = React.useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`/api/admin/attribution?from=${from}&to=${to}`)
      .then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error || 'Could not load the report.')))))
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [from, to]);
  React.useEffect(() => { load(); }, [load]);

  const runBackfill = async () => {
    setBackfill({ busy: true, message: '' });
    try {
      const res = await fetch('/api/admin/attribution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'backfill' }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed.');
      setBackfill({ busy: false, message: `Saved ${d.added} order${d.added === 1 ? '' : 's'} to the permanent history.` });
      load();
    } catch (err) {
      setBackfill({ busy: false, message: err.message });
    }
  };

  const setPreset = (days) => { setFrom(daysAgo(Number(days) - 1)); setTo(today()); };
  const summary = data?.summary;

  return (
    <div>
      <style>{'.attr-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }'}</style>

      <div style={card}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESETS.map(([days, label]) => (
            <button key={days} type="button" onClick={() => setPreset(days)} style={{ ...chip, ...(from === daysAgo(Number(days) - 1) && to === today() ? chipOn : {}) }}>{label}</button>
          ))}
          <label style={dateLabel}>From <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} style={dateInput} /></label>
          <label style={dateLabel}>To <input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} style={dateInput} /></label>
          <a href={`/api/admin/attribution?from=${from}&to=${to}&format=csv`} style={{ ...S.btnOutline, height: 38, padding: '0 16px', fontSize: 12, marginLeft: 'auto' }}>Export CSV</a>
        </div>
        <p style={{ fontSize: 12, color: T.soft, margin: '12px 0 0', lineHeight: 1.6 }}>
          <strong style={{ color: T.ink }}>Last click</strong>: the visit that bought, direct included.{' '}
          <strong style={{ color: T.ink }}>Last non-direct</strong>: the latest visit from a real source.{' '}
          <strong style={{ color: T.ink }}>First touch</strong>: the first visit in the last 90 days.
          Refunded and cancelled orders are left out of revenue (they&rsquo;re still in the CSV).
        </p>
      </div>

      {error && <p style={{ color: '#a13d2b', fontSize: 14 }}>{error}</p>}
      {loading && !data && <p style={{ color: T.soft, fontSize: 14 }}>Loading…</p>}

      {summary && (
        <>
          {(summary.totals.untracked > 0 || data.notInLedger > 0) && (
            <div style={{ ...card, borderColor: '#d9a441', background: '#fff8e6' }}>
              {summary.totals.untracked > 0 && (
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                  <strong>{summary.totals.untracked} order{summary.totals.untracked === 1 ? '' : 's'} in this range ha{summary.totals.untracked === 1 ? 's' : 've'} no attribution data</strong>
                  {' '}— placed before touch tracking went live (or from a browser that blocked it). They&rsquo;re shown as &ldquo;{'No attribution data'}&rdquo;, never as Direct.
                </p>
              )}
              {data.notInLedger > 0 && (
                <div style={{ marginTop: summary.totals.untracked > 0 ? 10 : 0, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
                  <span>{data.notInLedger} order{data.notInLedger === 1 ? '' : 's'} here {data.notInLedger === 1 ? 'is' : 'are'} only in the 45-day order store and will drop out of this report when {data.notInLedger === 1 ? 'it expires' : 'they expire'}.</span>
                  <button type="button" onClick={runBackfill} disabled={backfill.busy} style={{ ...S.btnFill, height: 34, padding: '0 14px', fontSize: 12 }}>
                    {backfill.busy ? 'Saving…' : 'Save them to the permanent history'}
                  </button>
                  {backfill.message && <span>{backfill.message}</span>}
                </div>
              )}
            </div>
          )}

          <div style={card}>
            <p style={{ ...S.label, margin: '0 0 6px' }}>Revenue by channel</p>
            <p style={{ fontSize: 13, color: T.soft, margin: '0 0 16px' }}>
              {summary.totals.orders} orders · {money(summary.totals.revenue)} · AOV {money(summary.totals.aov)}
              {summary.totals.excluded > 0 && ` · ${summary.totals.excluded} refunded/cancelled not counted`}
            </p>
            <div className="attr-scroll">
              <table style={table}>
                <thead>
                  <tr>
                    <th style={{ ...th, textAlign: 'left' }} rowSpan={2}>Channel</th>
                    {data.models.map(([key, label]) => <th key={key} colSpan={3} style={{ ...th, borderLeft: `1px solid ${T.line}` }}>{label}</th>)}
                  </tr>
                  <tr>
                    {data.models.map(([key]) => ['Revenue', 'Orders', 'AOV'].map((h, i) => (
                      <th key={`${key}${h}`} style={{ ...th, fontWeight: 500, ...(i === 0 ? { borderLeft: `1px solid ${T.line}` } : {}) }}>{h}</th>
                    )))}
                  </tr>
                </thead>
                <tbody>
                  {summary.channels.map((ch) => (
                    <tr key={ch} style={ch === 'No attribution data' ? { background: '#fff8e6' } : undefined}>
                      <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{ch}</td>
                      {data.models.map(([key]) => {
                        const c = summary.models[key][ch];
                        return [
                          <td key={`${key}r`} style={{ ...td, borderLeft: `1px solid ${T.line}` }}>{c ? <>{money(c.revenue)}<div style={sub}>{pct(c.share)}</div></> : '—'}</td>,
                          <td key={`${key}o`} style={td}>{c ? c.orders : '—'}</td>,
                          <td key={`${key}a`} style={td}>{c ? money(c.aov) : '—'}</td>,
                        ];
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={card}>
            <p style={{ ...S.label, margin: '0 0 6px' }}>Meta first touch, credited elsewhere by last click</p>
            <p style={{ fontSize: 13, color: T.soft, margin: '0 0 16px' }}>
              Orders that started from a Meta ad but bought on a Direct or Google visit: {data.meta.totals.orders} order{data.meta.totals.orders === 1 ? '' : 's'} · {money(data.meta.totals.revenue)}.
            </p>
            {data.meta.rows.length === 0 ? (
              <p style={{ fontSize: 13, color: T.soft, margin: 0 }}>None in this range.</p>
            ) : (
              <div className="attr-scroll">
                <table style={table}>
                  <thead>
                    <tr>
                      {['Campaign', 'Ad', 'Ad set / content', 'Orders', 'Revenue', 'Last click went to'].map((h, i) => <th key={h} style={{ ...th, textAlign: i < 3 || i === 5 ? 'left' : 'right' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.meta.rows.map((g) => (
                      <tr key={`${g.campaign}|${g.ad}`}>
                        <td style={{ ...td, textAlign: 'left' }}>{g.campaign}</td>
                        <td style={{ ...td, textAlign: 'left' }}>{g.adName || g.ad}{g.adId && <div style={sub}>ID {g.adId}</div>}</td>
                        <td style={{ ...td, textAlign: 'left' }}>{g.adset || '—'}</td>
                        <td style={td}>{g.orders}</td>
                        <td style={td}>{money(g.revenue)}</td>
                        <td style={{ ...td, textAlign: 'left' }}>{Object.entries(g.lastClick).map(([ch, n]) => `${ch} ${n}`).join(' · ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={card}>
            <p style={{ ...S.label, margin: '0 0 16px' }}>Days from first touch to purchase</p>
            <div className="attr-scroll">
              <table style={table}>
                <thead>
                  <tr>
                    <th style={{ ...th, textAlign: 'left' }}>Days</th>
                    <th style={th}>All orders</th>
                    <th style={th}>Revenue</th>
                    <th style={{ ...th, borderLeft: `1px solid ${T.line}` }}>Meta first touch</th>
                    <th style={th}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.buckets.map((b) => (
                    <tr key={b}>
                      <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{b}</td>
                      <td style={td}>{data.timeToPurchase.all[b].orders}</td>
                      <td style={td}>{money(data.timeToPurchase.all[b].revenue)}</td>
                      <td style={{ ...td, borderLeft: `1px solid ${T.line}` }}>{data.timeToPurchase.meta[b].orders}</td>
                      <td style={td}>{money(data.timeToPurchase.meta[b].revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: T.soft, margin: '10px 0 0' }}>Counts calendar days (Pacific time). Orders without attribution data aren&rsquo;t included.</p>
          </div>

          {data.untrackedOrders.length > 0 && (
            <div style={card}>
              <p style={{ ...S.label, margin: '0 0 12px' }}>Orders with no attribution data{data.untrackedOrders.length === 50 ? ' (first 50)' : ''}</p>
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                {data.untrackedOrders.map((o) => (
                  <div key={o.id} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ color: T.soft, minWidth: 130 }}>{new Date(o.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    <span style={{ minWidth: 80 }}>{money(o.amount)}</span>
                    <span style={{ color: T.soft }}>{o.id}{o.status !== 'paid' ? ` · ${o.status}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const card = { background: T.white, border: `1px solid ${T.line}`, padding: 20, marginBottom: 20 };
const chip = { fontSize: 12, padding: '8px 12px', border: `1px solid ${T.line}`, background: T.white, cursor: 'pointer', color: T.ink, fontFamily: T.sans };
const chipOn = { background: T.ink, color: T.white, borderColor: T.ink };
const dateLabel = { fontSize: 12, color: T.soft, display: 'flex', alignItems: 'center', gap: 6 };
const dateInput = { height: 36, padding: '0 8px', border: `1px solid ${T.line}`, fontSize: 13, color: T.ink, fontFamily: T.sans, background: T.white };
const table = { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 };
const th = { fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.soft, padding: '8px 10px', borderBottom: `1px solid ${T.ink}`, textAlign: 'right', whiteSpace: 'nowrap' };
const td = { padding: '10px', borderBottom: `1px solid ${T.line}`, textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' };
const sub = { fontSize: 11, color: T.soft, marginTop: 2 };
