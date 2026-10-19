// Shipping rule, shared by the cart drawer, every checkout page and the
// site copy that mentions it. ANESE ships free on every order — product
// prices carry the cost — so FREE_SHIPPING_THRESHOLD is 0. Setting it back
// to a dollar amount (and STANDARD_SHIPPING to the flat rate) restores a
// "free over $X" rule everywhere at once.
export const FREE_SHIPPING_THRESHOLD = 0;
export const STANDARD_SHIPPING = 5;
export const SHIPPING_ALWAYS_FREE = FREE_SHIPPING_THRESHOLD <= 0;

export function shippingFor(subtotal) {
  return Number(subtotal) >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}
