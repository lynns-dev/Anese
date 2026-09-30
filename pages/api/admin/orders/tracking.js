// Saves a tracking number for an order and emails the customer, in one
// admin action. The email send (lib/emailPlatform.js's notifyOrderShipped)
// doesn't roll back the tracking info if it fails — that's real and worth
// keeping regardless — but the outcome is reported back to admin
// (emailSent/emailError) and appended to the order's emailLog either way,
// so the order's email history shows failed attempts too.

import { updateOrderStatus } from '../../../../lib/analyticsStore';
import { notifyOrderShipped, emailLogEntry } from '../../../../lib/emailPlatform';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, carrier, trackingNumber, trackingUrl } = req.body || {};
  if (!orderId || !trackingNumber || !trackingNumber.trim()) {
    return res.status(400).json({ error: 'orderId and trackingNumber are required.' });
  }

  try {
    const updated = await updateOrderStatus(orderId, {
      trackingNumber: trackingNumber.trim(),
      carrier: carrier?.trim() || null,
      trackingUrl: trackingUrl?.trim() || null,
      shippedAt: new Date().toISOString(),
    });
    if (!updated) return res.status(404).json({ error: 'Order not found.' });

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

    return res.status(200).json({ order: logged || updated, emailSent: result.ok, emailError: result.error || null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
