// Shared standard shipping rate and free-shipping threshold.
export const FREE_SHIPPING_THRESHOLD = 50;
export const STANDARD_SHIPPING = 3;

export function shippingFor(subtotal) {
  return Number(subtotal) >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}
