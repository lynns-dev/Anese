// Admin read/update for questions and stories (lib/inboxStore.js).
// Behind the admin session check in middleware.js like every
// /api/admin/* route.

import { getInbox, updateInboxEntry, deleteInboxEntry } from '../../../lib/inboxStore';

const STATUSES = ['new', 'answered', 'archived'];

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const entries = await getInbox();
      return res.status(200).json({ entries: entries.slice().reverse() });
    }
    if (req.method === 'PATCH') {
      const { id, status } = req.body || {};
      if (!id || !STATUSES.includes(status)) return res.status(400).json({ error: 'id and a valid status are required.' });
      const updated = await updateInboxEntry(id, { status });
      if (!updated) return res.status(404).json({ error: 'Not found.' });
      return res.status(200).json({ entry: updated });
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required.' });
      await deleteInboxEntry(id);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
