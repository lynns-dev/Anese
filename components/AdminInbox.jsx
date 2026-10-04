// Admin Inbox tab: questions and stories sent through the site's "Ask us
// anything" and "Share your story" forms (pages/api/ask.js). Nothing here
// is published automatically — answer by email if they left one, and add
// the good ones to lib/brandContent.js / pages/stories.jsx by hand.

import React from 'react';
import { T, S } from '../lib/theme';

const FILTERS = [
  ['new', 'New'],
  ['answered', 'Answered'],
  ['archived', 'Archived'],
  ['all', 'All'],
];

export default function AdminInbox({ onCount }) {
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [filter, setFilter] = React.useState('new');
  const [type, setType] = React.useState('all');

  const load = React.useCallback(() => {
    setLoading(true);
    fetch('/api/admin/inbox')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEntries(data.entries || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    if (onCount) onCount(entries.filter((e) => e.status === 'new').length);
  }, [entries, onCount]);

  const setStatus = async (id, status) => {
    const res = await fetch('/api/admin/inbox', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (res.ok) setEntries((prev) => prev.map((e) => (e.id === id ? data.entry : e)));
  };

  const remove = async (id) => {
    if (!confirm('Delete this permanently?')) return;
    const res = await fetch('/api/admin/inbox', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const visible = entries.filter((e) => (filter === 'all' || e.status === filter) && (type === 'all' || e.type === type));

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <p style={{ ...S.label, margin: 0 }}>Questions &amp; stories</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={select}>
            <option value="all">Questions + stories</option>
            <option value="question">Questions only</option>
            <option value="story">Stories only</option>
          </select>
          {FILTERS.map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{ ...chip, ...(filter === key ? chipActive : {}) }}>{label}</button>
          ))}
        </div>
      </div>

      {loading && <p style={{ fontSize: 13, color: T.soft }}>Loading…</p>}
      {error && <p style={{ fontSize: 13, color: '#a13d2b' }}>{error}</p>}
      {!loading && !error && visible.length === 0 && (
        <p style={{ fontSize: 13, color: T.soft }}>Nothing here yet. When someone asks a question or shares a story on the site, it shows up here.</p>
      )}

      {visible.map((e) => (
        <div key={e.id} style={row}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ ...tag, background: e.type === 'story' ? T.blush : T.paper, border: `1px solid ${T.line}` }}>
              {e.type === 'story' ? 'Story' : 'Question'}
              {e.type === 'story' && (e.permission ? ' · OK to share' : ' · Not OK to share')}
            </span>
            <span style={{ fontSize: 12, color: T.soft }}>
              {new Date(e.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <p style={{ fontSize: 15, whiteSpace: 'pre-wrap', margin: '0 0 10px' }}>{e.text}</p>
          <div style={{ fontSize: 12, color: T.soft, marginBottom: 12 }}>
            {e.name && <span>{e.name} · </span>}
            {e.email ? <a href={`mailto:${e.email}`} style={{ textDecoration: 'underline' }}>{e.email}</a> : 'No email (anonymous)'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {e.status !== 'answered' && <button onClick={() => setStatus(e.id, 'answered')} style={smallBtn}>Mark answered</button>}
            {e.status !== 'archived' && <button onClick={() => setStatus(e.id, 'archived')} style={smallBtn}>Archive</button>}
            {e.status !== 'new' && <button onClick={() => setStatus(e.id, 'new')} style={smallBtn}>Move to new</button>}
            <button onClick={() => remove(e.id)} style={{ ...smallBtn, color: '#a13d2b' }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const card = { background: T.white, border: `1px solid ${T.line}`, padding: 24, marginBottom: 24 };
const row = { padding: '16px 0', borderTop: `1px solid ${T.line}` };
const tag = { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px', fontWeight: 700 };
const chip = { fontSize: 12, padding: '6px 12px', border: `1px solid ${T.line}`, background: T.white, cursor: 'pointer', color: T.ink };
const chipActive = { background: T.ink, color: T.white, borderColor: T.ink };
const select = { fontSize: 12, padding: '6px 8px', border: `1px solid ${T.line}`, background: T.white, color: T.ink };
const smallBtn = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 12px', border: `1px solid ${T.line}`, background: 'none', cursor: 'pointer', color: T.ink };
