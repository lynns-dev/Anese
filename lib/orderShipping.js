// Marks an order shipped and emails the customer their tracking — shared
// by admin's manual tracking form (pages/api/admin/orders/tracking.js) and
// ShippingEasy's label callback (pages/api/shippingeasy/callback.js). The
// email (lib/email/orderHooks.js notifyOrderShipped) doesn't roll back the
// tracking info if it fails; its outcome is appended to the order's
// emailLog either way, so the order's email history shows failed attempts.

import { updateOrderStatus } from './analyticsStore';
import { notifyOrderShipped, emailLogEntry } from './email/orderHooks';

export async function markOrderShipped(orderId, { carrier, trackingNumber, trackingUrl, source = 'admin' }) {
  const updated = await updateOrderStatus(orderId, {
    trackingNumber,
    carrier: carrier || null,
    trackingUrl: trackingUrl || null,
    shippedAt: new Date().toISOString(),
    shippedVia: source,
  });
  if (!updated) return null;

  const result = await notifyOrderShipped({
    email: updated.email,
    orderId: updated.id,
    carrier: updated.carrier,
    trackingNumber: updated.trackingNumber,
    trackingUrl: updated.trackingUrl,
  });

  const logged = await updateOrderStatus(orderId, {
    emailLog: [...(updated.emailLog || []), emailLogEntry('order_shipped', updated.email, result)],
  });

  return { order: logged || updated, emailSent: result.ok, emailError: result.error || null };
}
