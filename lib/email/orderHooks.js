// Server-side order events -> this store's email system. Replaces the HTTP
// calls to the separate email app with direct calls. The send functions
// resolve to { ok, id, error } instead of throwing, so callers can log the
// outcome on the order (emailLogEntry) without a failed email ever failing
// the order itself.

import { addSubscriberManually, touchLastOrder } from './subscribersStore';
import { sendTransactionalEmail } from './resendEmail';
import { renderOrderShippedEmail } from './orderShippedEmail';
import { renderOrderConfirmationEmail } from './orderConfirmationEmail';
import { getSettings } from './settingsStore';

async function sendTransactional(email, subject, html) {
  if (!email) return { ok: false, error: 'This order has no email on file.' };
  try {
    const data = await sendTransactionalEmail({ to: email, subject, html });
    return { ok: true, id: data?.id || null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// A completed order: makes sure the buyer is on the list, records the
// purchase time, and stops abandoned_checkout / add_to_cart for them
// (touchLastOrder) while starting a fresh order_received cycle. Never throws.
export async function notifyOrderReceived(email, timestampMs = Date.now()) {
  if (!email) return;
  try {
    await addSubscriberManually(email, 'order').catch(() => {});
    await touchLastOrder(email, timestampMs);
  } catch (err) {
    console.error('Email order hook failed:', err.message);
  }
}

export async function notifyOrderConfirmed({ email, orderId, items, amount, shipping, shippingProtection }) {
  const settings = await getSettings().catch(() => ({}));
  const html = renderOrderConfirmationEmail({ orderId, items, amount, shipping, shippingProtection, settings });
  return sendTransactional(email, 'Your ANESE order is confirmed', html);
}

export async function notifyOrderShipped({ email, orderId, carrier, trackingNumber, trackingUrl }) {
  if (!trackingNumber) return { ok: false, error: 'A tracking number is required.' };
  const settings = await getSettings().catch(() => ({}));
  const html = renderOrderShippedEmail({ orderId, carrier, trackingNumber, trackingUrl, settings });
  return sendTransactional(email, 'Your order has shipped!', html);
}

// Shape of one entry in order.emailLog (shown on the order in admin).
export function emailLogEntry(type, to, { ok, id, error } = {}) {
  return { type, to: to || '', ok: Boolean(ok), id: id || null, error: ok ? null : error || null, at: new Date().toISOString() };
}
