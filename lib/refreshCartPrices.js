import { getProductById, FREE_GIFT } from './products';

// Saved carts retain quantities, but current catalog details determine prices.
export function refreshCartPrices(lines) {
  if (!Array.isArray(lines)) return [];
  return lines.flatMap(item => {
    if (!item || !Number.isInteger(item.quantity) || item.quantity < 1) return [];
    const gift = item.id === FREE_GIFT.id;
    const product = gift ? FREE_GIFT : getProductById(item.id);
    if (!product || product.archived) return [];
    const { originalPrice, ...saved } = item;
    return [{ ...saved, ...product, quantity: item.quantity,
      ...(gift ? { price: 0, originalPrice: product.price } : {}) }];
  });
}
