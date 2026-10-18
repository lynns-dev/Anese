// Browser side of the Cart drop-off report (lib/cartFunnel.js): one call per
// cart/checkout step or drop-off signal, fire-and-forget. The server counts
// each person once using the long-lived site_vid cookie (lib/journeys.js),
// falling back to this tab's session id.
import { getSessionId } from './session';

export function trackCart(kind, detail = {}) {
  if (typeof window === 'undefined') return;
  try {
    fetch('/api/track/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        detail,
        sessionId: getSessionId(),
        path: window.location.pathname,
        device: window.matchMedia?.('(max-width: 760px)').matches ? 'Phone' : 'Desktop',
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking never gets in the shopper's way.
  }
}
