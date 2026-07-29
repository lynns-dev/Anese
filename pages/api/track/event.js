// Public, fire-and-forget funnel event tracking. Never throws in a way that
// would surface to the visitor — a lost analytics ping shouldn't affect
// their experience.

import { incrementEvent, logEvent } from '../../../lib/analyticsStore';
import { sendCapiEvent, getRequestUserData } from '../../../lib/metaCapi';
import { isExcludedIp } from '../../../lib/ipFilter';

const ALLOWED = ['pageview', 'addtocart', 'checkout_start', 'checkout_payment', 'checkout_review'];
// Logged to the timestamped recent-events feed for the live-activity view.
// pageview is excluded — too high-volume to be useful there.
const LOGGED = ['addtocart', 'checkout_start'];

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

  const { event, productName, eventId, contentId, contentIds, contents, value, url, sessionId, email, phone } = req.body || {};
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
