// Public, fire-and-forget cart/checkout step tracking for the admin's Cart
// drop-off report (lib/cartFunnel.js). Sent by lib/cartTracking.js. Never
// fails in a way the shopper would notice.

import { recordCartEvent, STEPS, SIGNALS } from '../../../lib/cartFunnel';
import { visitorIdFrom } from '../../../lib/journeys';
import { isExcludedIp, isOutsideServiceArea } from '../../../lib/ipFilter';

const STEP_LABELS = Object.fromEntries(STEPS);
const ID_RE = /^[A-Za-z0-9_-]{6,100}$/;

function clip(value, max) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const { kind, sessionId, detail, path, source, device } = req.body || {};
  // One count per person: the visitor cookie, else this tab's session id.
  const id = [visitorIdFrom(req), sessionId].find((v) => typeof v === 'string' && ID_RE.test(v));
  if (!id || !(STEP_LABELS[kind] || SIGNALS.includes(kind)) || isExcludedIp(req) || isOutsideServiceArea(req)) return res.status(204).end();

  const d = detail && typeof detail === 'object' ? detail : {};
  const safeDetail = {
    name: clip(d.name, 60),
    code: clip(d.code, 30),
    method: clip(d.method, 30),
    message: clip(d.message, 120),
    answer: clip(d.answer, 20),
    text: clip(d.text, 200),
    shipping: Number(d.shipping) || 0,
    freeAt: Number(d.freeAt) || undefined,
    subtotal: Number(d.subtotal) || undefined,
    dwellSec: Number(d.dwellSec) || undefined,
    items: Array.isArray(d.items) ? d.items.slice(0, 6).map((n) => clip(String(n), 60)).filter(Boolean) : undefined,
  };
  try {
    await recordCartEvent({ visitorId: id, kind, detail: safeDetail, context: { path, source, device } });
  } catch (err) {
    console.error('Cart step tracking failed:', err.message);
  }
  return res.status(204).end();
}
