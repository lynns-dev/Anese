// Admin read/update for questions and stories (lib/inboxStore.js).
// Behind the admin session check in middleware.js like every
// /api/admin/* route.
//
// POST { id, reply } emails the reply to the person who wrote in
// (lib/email/inboxReplyEmail.js, through Resend), saves it on the entry
// (entry.replies) and marks the entry answered. Nothing is saved if the
// email doesn't go out, so admin can fix the problem and send again.

import crypto from 'crypto';
import { getInbox, updateInboxEntry, deleteInboxEntry } from '../../../lib/inboxStore';
import { sendTransactionalEmail } from '../../../lib/email/resendEmail';
import { getSettings } from '../../../lib/email/settingsStore';
import { renderInboxReplyEmail, inboxReplySubject } from '../../../lib/email/inboxReplyEmail';

const MAX_REPLY = 5000;

const STATUSES = ['new', 'answered', 'archived'];

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const entries = await getInbox();
      return res.status(200).json({ entries: entries.slice().reverse() });
    }
    if (req.method === 'POST') {
      const { id, reply } = req.body || {};
      const text = String(reply || '').trim();
      if (!id || !text) return res.status(400).json({ error: 'Write a reply first.' });
      if (text.length > MAX_REPLY) return res.status(400).json({ error: `Keep replies under ${MAX_REPLY.toLocaleString()} characters.` });
      const entry = (await getInbox()).find((e) => e.id === id);
      if (!entry) return res.status(404).json({ error: 'Not found.' });
      if (!entry.email) return res.status(400).json({ error: 'They didn’t leave an email, so there’s no one to reply to.' });

      const settings = await getSettings().catch(() => ({}));
      let sent;
      try {
        sent = await sendTransactionalEmail({
          to: entry.email,
          subject: inboxReplySubject(entry),
          html: renderInboxReplyEmail({ entry, reply: text, settings }),
        });
      } catch (err) {
        return res.status(502).json({ error: `The email didn’t send: ${err.message}` });
      }
      const replies = [...(entry.replies || []), { id: crypto.randomUUID(), text, at: new Date().toISOString(), emailId: sent?.id || null }];
      const updated = await updateInboxEntry(id, { replies, status: 'answered' });
      return res.status(200).json({ entry: updated });
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
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
