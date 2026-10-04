// Questions and customer stories sent through the "Ask us anything" and
// "Share your story" forms (components/AskBox.jsx). Same Upstash KV store
// as reviews/leads. One key, newest last:
//   inbox -> JSON array of { id, type, text, name, email, permission,
//            status, createdAt }
// type is 'question' or 'story'; status is 'new', 'answered' or
// 'archived'. Nothing here is ever shown publicly by itself — admin
// reads them in the Inbox tab and decides what (if anything) to publish.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'inbox';
const MAX_ENTRIES = 2000;

function assertConfigured() {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  }
}

export async function getInbox() {
  assertConfigured();
  const res = await fetch(`${KV_URL}/get/${KEY}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : [];
}

async function save(entries) {
  const res = await fetch(`${KV_URL}/set/${KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(entries.slice(-MAX_ENTRIES)),
  });
  if (!res.ok) throw new Error('Failed to save inbox.');
}

export async function addInboxEntry(entry) {
  const existing = await getInbox();
  await save([...existing, entry]);
  return entry;
}

export async function updateInboxEntry(id, updates) {
  const existing = await getInbox();
  let found = null;
  const next = existing.map((e) => {
    if (e.id !== id) return e;
    found = { ...e, ...updates };
    return found;
  });
  if (!found) return null;
  await save(next);
  return found;
}

export async function deleteInboxEntry(id) {
  const existing = await getInbox();
  await save(existing.filter((e) => e.id !== id));
}
