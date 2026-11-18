import { getReviews } from '../../lib/reviewsStore';
import { selectConcernReviews } from '../../lib/concernProof';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const { concern, offset = '0' } = req.query;
  if (!['spots', 'bumps'].includes(concern) || !/^\d{1,6}$/.test(String(offset))) return res.status(400).json({ error: 'Invalid concern or offset.' });
  try {
    const rows = (await Promise.all(['that-booty-tho', 'that-booty-tho-6oz'].map(getReviews))).flat();
    // Preserve the existing public-feed eligibility rules, without extra
    // rating selection or rewriting customers' statements for this campaign.
    const approved = rows.filter((r) => r.status === 'approved' && r.rating >= 3 && !/scam/i.test(r.text || ''));
    const matched = selectConcernReviews(approved, concern).sort((a,b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || String(a.id || a.author).localeCompare(String(b.id || b.author)));
    const start = Number(offset);
    return res.status(200).json({ reviews: matched.slice(start, start + 6).map(({ id, text, author, rating }) => ({ id, text, author, rating })), count: matched.length });
  } catch {
    return res.status(503).json({ error: 'Reviews are temporarily unavailable.' });
  }
}
