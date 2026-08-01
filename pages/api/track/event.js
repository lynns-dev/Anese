// Public, fire-and-forget funnel event tracking. Never throws in a way that
// would surface to the visitor — a lost analytics ping shouldn't affect
// their experience.

import { incrementEvent, logEvent, logVisitor } from '../../../lib/analyticsStore';
import { sendCapiEvent, getRequestUserData } from '../../../lib/metaCapi';
import { isExcludedIp } from '../../../lib/ipFilter';

const ALLOWED = ['pageview', 'addtocart', 'checkout_start', 'checkout_payment', 'checkout_review'];
// Logged to the timestamped recent-events feed for the live-activity view.
// pageview is excluded — too high-volume to be useful there.
const LOGGED = ['addtocart', 'checkout_start'];

// Trims a client-supplied string to a sane length so a malformed/hostile
// payload can't bloat the stored visitor entry — same guard
// pages/api/track/heartbeat.js uses on its own fields.
function clip(value, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

// Maps our internal event names to Meta's standard event names for CAPI,
// paired with the browser Pixel call sharing the same eventId (see
// lib/useCart.js, pages/checkout.jsx) so Meta dedupes instead of
// double-counting.
const CAPI_EVENT_NAMES = { addtocart: 'AddToCart', checkout_start: 'InitiateCheckout' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { event, productName, eventId, contentId, contentIds, contents, value, url, sessionId, email, phone, source, campaign, path } = req.body || {};
  if (ALLOWED.includes(event) && !isExcludedIp(req)) {
    // The Meta send and the KV analytics writes are started together and
    // kept in separate try/catch blocks on purpose. They used to sit in one
    // sequential try: the KV counter went first, so a transient KV failure
    // (quota, rate limit, a blip at the provider) threw before the Meta call
    // was ever reached and the conversion was lost silently — an internal
    // dashboard number taking down an ad-optimization signal. Running them
    // concurrently also means Meta isn't waiting behind two KV round-trips.
    const capiEventName = CAPI_EVENT_NAMES[event];
    const capiSend = capiEventName && eventId
      ? sendCapiEvent({
          eventName: capiEventName,
          eventId,
          eventSourceUrl: url,
          // email/phone ride along whenever the shopper has already given
          // them (lib/identity.js remembers them across the visit), so an
          // AddToCart or InitiateCheckout later in a session carries the
          // same identifiers Purchase does instead of matching on cookies
          // alone. They're hashed in getRequestUserData before sending.
          userData: getRequestUserData(req, {
            email,
            phone,
            externalId: sessionId || undefined,
          }),
          customData: {
            currency: 'USD',
            value,
            content_ids: contentIds || (contentId ? [contentId] : undefined),
            content_type: 'product',
            contents,
          },
        }).catch((err) => console.error('Meta CAPI send failed:', err))
      : null;

    try {
      await incrementEvent(event, sessionId);
      if (LOGGED.includes(event)) {
        await logEvent(event, {
          ...(productName ? { productName } : {}),
          ...(sessionId ? { sessionId } : {}),
        });
      }
      // One entry per visitor per day (see logVisitor's own dedup) into the
      // admin "past traffic" list — pageview is the highest-fidelity signal
      // for "this is a real visit," same reasoning DEDUPED_EVENTS in
      // lib/analyticsStore.js already gives it for the funnel counters.
      if (event === 'pageview' && sessionId) {
        const city = req.headers['x-vercel-ip-city'];
        const country = req.headers['x-vercel-ip-country'] || 'XX';
        await logVisitor({
          sessionId,
          source: clip(source, 80) || 'Direct',
          campaign: clip(campaign, 80),
          path: clip(path, 200),
          city: city ? decodeURIComponent(city) : null,
          country,
        });
      }
    } catch (err) {
      console.error('Event tracking failed:', err);
    }

    // Awaited before responding: on serverless the function can be frozen
    // the moment the response is sent, which would abandon an in-flight
    // request to Meta.
    await capiSend;
  }

  return res.status(204).end();
}
