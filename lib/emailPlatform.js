// Customer order emails, sent through the separate email platform
// (lynns-dev/email — the same standalone app Veil uses). Every call here
// passes brand: 'anese', so that app renders them with Anese's own
// template and sender (its lib/brands.js) rather than Veil's.
//
// - notifyOrderConfirmed(): the "thank you for your order" email, from
//   lib/orderFulfillment.js right after a charge captures.
// - notifyOrderShipped(): the "your order has shipped" email, from
//   pages/api/admin/orders/tracking.js when admin saves a tracking number.
//
// Both are server-side and Bearer-token protected (EMAIL_APP_WEBHOOK_SECRET,
// matching that app's STOREFRONT_WEBHOOK_SECRET) — a forged call would send
// a real email to a real customer. Unlike Veil, this storefront does NOT
// call that app's checkout-capture/order-received routes: those feed its
// subscriber list and automations, which are Veil-branded.
//
// Each call resolves to { ok, id?, error? } rather than throwing, and the
// caller records it on the order (emailLog) so admin can see exactly what
// each customer was sent, and what failed.

// A bare domain pasted into Vercel without the scheme is an easy mistake
// and makes fetch() fail with an opaque "Failed to parse URL"; default a
// missing scheme to https instead.
function emailAppBaseUrl() {
  const raw = process.env.EMAIL_APP_URL || process.env.NEXT_PUBLIC_EMAIL_APP_URL;
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

async function postToEmailApp(path, payload) {
  const base = emailAppBaseUrl();
  const secret = process.env.EMAIL_APP_WEBHOOK_SECRET;
  if (!base || !secret) return { ok: false, error: 'Email app is not configured (EMAIL_APP_URL / EMAIL_APP_WEBHOOK_SECRET).' };
  if (!payload.email) return { ok: false, error: 'This order has no email on file.' };
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ brand: 'anese', ...payload }),
      // The confirmation runs inside the checkout request — a hung email
      // app must not hold up the shopper's order response.
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || `Email app returned ${res.status}.` };
    return { ok: true, id: data.id || null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function notifyOrderConfirmed({ email, orderId, items, amount, shipping, shippingProtection }) {
  return postToEmailApp('/api/email/order-confirmation', {
    email,
    orderId,
    amount,
    shippingProtection: shippingProtection || 0,
    items: (items || []).map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    shipping: shipping
      ? { name: shipping.name, address: shipping.address, apt: shipping.apt, city: shipping.city, state: shipping.state, zip: shipping.zip }
      : null,
  });
}

export function notifyOrderShipped({ email, orderId, carrier, trackingNumber, trackingUrl }) {
  return postToEmailApp('/api/email/order-shipped', { email, orderId, carrier, trackingNumber, trackingUrl });
}

// One entry in an order's emailLog, shown per order in the admin Orders tab.
// `ok` means the email app accepted it and handed it to Resend for delivery.
export function emailLogEntry(type, to, { ok, id, error } = {}) {
  return { type, to: to || '', ok: Boolean(ok), id: id || null, error: ok ? null : error || null, at: new Date().toISOString() };
}
