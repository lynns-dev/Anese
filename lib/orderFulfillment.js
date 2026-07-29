// Shared post-payment side effects for every checkout path (Bankful today;
// Stripe/PayPal/QuickBooks historically): order ledger entry, funnel
// counters, admin push notification, and the server-side Meta Purchase
// event. Failures here
// are logged but never thrown — a successful charge/capture must not be
// undone or reported as failed just because a notification write hiccuped.

import { recordOrder, incrementEvent, logEvent } from './analyticsStore';
import { sendPushToAdmins } from './webPush';
import { sendCapiEvent, getRequestUserData } from './metaCapi';
import { recordLead } from './checkoutLeadsStore';

// Meta's own Pixel sets this first-party cookie the instant it sees fbclid
// in the URL, independent of our own client-side capture (lib/attribution.js)
// -- a useful fallback when that capture is missing or got lost (ad blocker
// delaying our script, a race on a very fast redirect, etc). Format is
// fb.<subdomain_index>.<creation_time>.<fbclid>. This can't fix the more
// common gap of someone clicking the ad in an in-app browser and buying
// later in a different one entirely — no first-party signal survives that
// hop, only Meta's own device/account-graph matching can.
function fallbackAttributionFromCookies(req) {
  const fbc = req?.cookies?._fbc;
  if (!fbc) return null;
  const parts = fbc.split('.');
  const fbclid = parts.length >= 4 ? parts.slice(3).join('.') : null;
  return fbclid ? { fbclid } : null;
}

export async function fulfillOrder({ id, amount, items, eventId, url, req, paymentMethod, attribution, email, shipping, processor, captureId, shippingProtection, sessionId }) {
  // Started before the ledger/notification work below rather than after it,
  // and caught on its own. Previously this ran last inside the same
  // sequential try block, so any earlier step throwing — a KV blip while
  // recording the order, a push-notification failure — meant Meta never
  // received the Purchase at all. The charge had already succeeded, so the
  // money was real but the conversion went unreported, which is exactly the
  // signal ad delivery optimizes on. Nothing here can fail the order.
  const capiSend = eventId
    ? sendCapiEvent({
        eventName: 'Purchase',
        eventId,
        eventSourceUrl: url,
        userData: getRequestUserData(req, { email, phone: shipping?.phone, externalId: sessionId || undefined }),
        customData: {
          currency: 'USD',
          value: amount,
          // order_id, content_type, and num_items were the gap Meta's own
          // Purchase-event diagnostic flagged (a low match/parameter-
          // completeness score) — order_id in particular also lets Meta
          // dedupe against Shop/catalog-sourced orders of the same
          // purchase, not just against this event's own pixel/CAPI pair.
          order_id: id,
          content_type: 'product',
          content_ids: items.map((i) => i.id),
          contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
          num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        },
      }).catch((err) => console.error('Meta CAPI Purchase failed:', err))
    : null;

  try {
    await recordOrder({
      id, amount, items,
      paymentMethod: paymentMethod || 'Unknown',
      attribution: attribution || fallbackAttributionFromCookies(req) || null,
      createdAt: new Date().toISOString(),
      email: email || '',
      shipping: shipping || null,
      processor: processor || null,
      captureId: captureId || null,
      // Amount the shopper paid for the optional shipping-protection add-on
      // (pages/checkout.jsx, pages/offer3.jsx), 0/absent if they didn't buy
      // it — lets support tell at a glance whether an order is covered for
      // reshipment/refund if it's lost, damaged, or stolen in transit.
      shippingProtection: shippingProtection || 0,
      status: 'paid',
    });
    await incrementEvent('purchase');
    await logEvent('purchase', { amount });
    // Whether or not this person ever triggered the abandoned-checkout
    // capture (lib/checkoutLeadsStore.js), a completed order always ends
    // with them recorded as a converted lead, not left stuck as 'abandoned'.
    if (email) {
      await recordLead({ email, cart: items, source: processor, status: 'purchased' });
    }
    const itemCount = items.length;
    await sendPushToAdmins({
      title: 'New order',
      body: `$${Number(amount).toFixed(2)} — ${itemCount} item${itemCount === 1 ? '' : 's'}`,
      url: '/admin',
    });
  } catch (err) {
    console.error('Order/analytics recording failed:', err);
  }

  // Awaited before returning: this runs inside the checkout request, and on
  // serverless the function can be frozen as soon as that response is sent,
  // which would abandon an in-flight request to Meta.
  await capiSend;
}
