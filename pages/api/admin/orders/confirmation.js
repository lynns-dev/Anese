// Sends an order's confirmation email again from the Orders tab — to the
// order's own email, or to another address admin types in (a typo at
// checkout, a gift buyer). Same email as at checkout
// (lib/email/orderHooks.js); the outcome is added to the order's emailLog
// whether it went out or not.

import { dateKeysForRange, getOrders, updateOrderStatus } from '../../../../lib/analyticsStore';
import { notifyOrderConfirmed, emailLogEntry } from '../../../../lib/email/orderHooks';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { orderId, to } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'Missing order id' });
    const orders = (await Promise.all(dateKeysForRange('45d').map((key) => getOrders(key)))).flat();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const email = String(to || order.email || '').trim();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });

    const result = await notifyOrderConfirmed({
      email,
      orderNumber: order.orderNumber,
      orderId: order.id,
      items: order.items || [],
      amount: order.amount,
      shipping: order.shipping,
      shippingProtection: order.shippingProtection,
    });
    const updated = await updateOrderStatus(orderId, {
      emailLog: [...(order.emailLog || []), emailLogEntry('order_confirmation', email, result)],
    });
    if (!result.ok) return res.status(502).json({ error: `The email didn’t send: ${result.error}`, order: updated });
    return res.status(200).json({ order: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
