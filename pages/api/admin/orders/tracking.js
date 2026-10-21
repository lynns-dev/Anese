// Saves a tracking number for an order and emails the customer, in one
// admin action (lib/orderShipping.js). The email's outcome is reported back
// to admin (emailSent/emailError) and kept in the order's emailLog.

import { markOrderShipped } from '../../../../lib/orderShipping';

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
    const result = await markOrderShipped(orderId, {
      trackingNumber: trackingNumber.trim(),
      carrier: carrier?.trim() || null,
      trackingUrl: trackingUrl?.trim() || null,
    });
    if (!result) return res.status(404).json({ error: 'Order not found.' });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
