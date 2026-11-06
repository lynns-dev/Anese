// Public, fire-and-forget: a visitor saw a split test (lib/experiments.js).
import { recordExposure } from '../../../lib/experimentsStore';
import { visitorIdFrom } from '../../../lib/journeys';
import { isExcludedIp, isOutsideServiceArea } from '../../../lib/ipFilter';

const ID_RE = /^[A-Za-z0-9_-]{6,100}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const { id, variant, sessionId } = req.body || {};
  // Same person id the cart funnel uses (pages/api/track/cart.js).
  const who = [visitorIdFrom(req), sessionId].find((v) => typeof v === 'string' && ID_RE.test(v));
  if (!who || typeof id !== 'string' || typeof variant !== 'string' || isExcludedIp(req) || isOutsideServiceArea(req)) return res.status(204).end();
  try {
    await recordExposure(id.slice(0, 40), variant.slice(0, 20), who);
  } catch (err) {
    console.error('Experiment exposure failed:', err.message);
  }
  return res.status(204).end();
}
