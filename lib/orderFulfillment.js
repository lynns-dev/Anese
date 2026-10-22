// Shared post-payment side effects for every checkout path (Bankful today;
// Stripe/PayPal/QuickBooks historically): order ledger entry, funnel
// counters, admin push notification, and the server-side Meta Purchase
// event (lib/metaPurchase.js). Failures here
// are logged but never thrown — a successful charge/capture must not be
// undone or reported as failed just because a notification write hiccuped.

import { recordOrder, incrementEvent, logEvent } from './analyticsStore';
import { sendPushToAdmins } from './webPush';
import { getBrowserContext } from './metaCapi';
import { initialMetaRecord, sendOrderPurchase } from './metaPurchase';
import { recordLead } from './checkoutLeadsStore';
import { recordJourneyStep } from './journeys';
import { notifyOrderConfirmed, notifyOrderReceived, emailLogEntry } from './email/orderHooks';
import { shippingEasyConfig, sendOrderToShippingEasy } from './shippingEasy';
import { touchesForOrder } from './touchServer';
import { appendToLedger } from './attributionLedger';

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

export async function fulfillOrder({ id, amount, items, eventId, url, req, paymentMethod, attribution, email, shipping, processor, captureId, shippingProtection, sessionId, browser: capturedBrowser }) {
  // capturedBrowser: the shopper's browser details saved earlier, for the
  // paths where this request isn't theirs (Shop Pay's webhook and its
  // reconciliation cron). Everywhere else the request is the shopper's own.
  const browser = capturedBrowser || getBrowserContext(req);
  // First touch / last non-direct touch / this visit's own source ride in
  // on attribution.touches (lib/attribution.js); they're saved on their own
  // as order.touches, falling back to the touch cookies on this request, so
  // order.attribution stays exactly what it was before.
  const { touches: sentTouches, ...tagged } = attribution || {};
  const order = {
    id, amount, items,
    paymentMethod: paymentMethod || 'Unknown',
    attribution: (Object.keys(tagged).length ? tagged : null) || fallbackAttributionFromCookies(req) || null,
    touches: touchesForOrder(sentTouches, req),
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
  };

  // Started before the ledger/notification work below and kept apart from
  // it, so a KV blip or push-notification failure can never stop Meta
  // hearing about a real sale — the signal ad delivery optimizes on. Its
  // outcome is saved on the order (order.meta); an order Meta didn't
  // accept is retried by pages/api/meta/resend-purchases.js. Never throws.
  const purchaseSend = sendOrderPurchase(order, initialMetaRecord({ orderId: id, eventId, url, browser, sessionId }));

  // Order confirmation email (lib/email/orderHooks.js). Started alongside the
  // CAPI send and awaited just before the order is recorded, so its
  // outcome is saved on the order itself (emailLog) for admin to see.
  // Never throws — a failed send shows up there as failed, not as a
  // failed checkout. Skipped for Shop Pay: those orders live in Shopify,
  // which sends its own confirmation.
  const confirmationSend = email && processor !== 'shopify'
    ? notifyOrderConfirmed({ email, orderId: id, items, amount, shipping, shippingProtection })
    : null;

  // Sent to ShippingEasy as an order awaiting shipment (lib/shippingEasy.js);
  // its outcome is saved on the order, and one that didn't go through is
  // retried by pages/api/cron/shippingeasy-retry.js. Skipped entirely
  // until the ShippingEasy keys are set. Never throws.
  const shippingEasySend = shippingEasyConfig().configured ? sendOrderToShippingEasy(order, {}) : null;

  try {
    const [meta, confirmation, shippingEasy] = await Promise.all([purchaseSend, confirmationSend, shippingEasySend]);
    await recordOrder({
      ...order,
      meta,
      shippingEasy: shippingEasy || null,
      emailLog: confirmation ? [emailLogEntry('order_confirmation', email, confirmation)] : [],
    });
    await incrementEvent('purchase');
    // Permanent attribution record (lib/attributionLedger.js) — kept apart
    // so a failure here can't stop the rest of the order bookkeeping.
    await appendToLedger(order).catch((err) => console.error('Attribution ledger write failed:', err.message));
    // Ends this visitor's path in admin's Paths tab (lib/journeys.js). Only
    // recorded when the request came from the shopper's own browser — a
    // server-to-server caller (a payment webhook) carries no visitor cookie.
    await recordJourneyStep(req, { sessionId, label: 'Purchase', value: amount });
    await logEvent('purchase', { amount });
    // Whether or not this person ever triggered the abandoned-checkout
    // capture (lib/checkoutLeadsStore.js), a completed order always ends
    // with them recorded as a converted lead, not left stuck as 'abandoned'.
    if (email) {
      await recordLead({ email, cart: items, source: processor, status: 'purchased' });
      // Puts the buyer on the email list and stops abandoned-checkout
      // reminders for them (lib/email/orderHooks.js).
      await notifyOrderReceived(email);
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

  // Awaited before returning (already settled unless the order write above
  // threw first): this runs inside the checkout request, and on serverless
  // the function can be frozen as soon as that response is sent, which
  // would abandon an in-flight request to Meta.
  await Promise.all([purchaseSend, shippingEasySend]);
}
