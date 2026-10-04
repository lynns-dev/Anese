// Public endpoint behind the "Ask us anything" and "Share your story"
// forms. Stores the submission in the admin inbox (lib/inboxStore.js);
// nothing is published automatically. The hidden `website` field is a
// honeypot — real visitors never see or fill it, so anything that does
// is a bot and gets a fake success.

import crypto from 'crypto';
import { addInboxEntry } from '../../lib/inboxStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, text, name, email, permission, website } = req.body || {};
  if (website) return res.status(200).json({ ok: true });

  if (!['question', 'story'].includes(type)) return res.status(400).json({ error: 'Unknown form.' });
  const body = String(text || '').trim();
  if (body.length < 5) return res.status(400).json({ error: 'Tell us a little more first.' });
  if (body.length > 2000) return res.status(400).json({ error: 'That one’s a bit long — keep it under 2,000 characters.' });
  const cleanEmail = String(email || '').trim();
  if (cleanEmail && !EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'That email doesn’t look quite right.' });
  if (type === 'story' && !permission) {
    return res.status(400).json({ error: 'Please tick the box so we know it’s okay to share your story.' });
  }

  try {
    await addInboxEntry({
      id: crypto.randomUUID(),
      type,
      text: body,
      name: String(name || '').trim().slice(0, 80),
      email: cleanEmail.slice(0, 200),
      permission: Boolean(permission),
      status: 'new',
      createdAt: new Date().toISOString(),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Inbox save failed:', err);
    return res.status(500).json({ error: 'Something went wrong on our end. Try again in a minute?' });
  }
}
