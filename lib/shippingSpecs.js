// What Easyship needs to know about each product to create a shipment
// (lib/easyship.js): its packed weight and size, and its customs code.
//
// SPECS — fill in per product id (lib/products.js): weight in kilograms,
// size in centimetres, each as packed for shipping. Until a product has
// one, orders containing it aren't sent to Easyship; they show "add the
// shipping weight and size for …" in admin instead. (1 oz = 0.0283 kg,
// 1 lb = 0.4536 kg, 1 in = 2.54 cm.)
export const SPECS = {
  // 'that-booty-tho': { weightKg: 0, lengthCm: 0, widthCm: 0, heightCm: 0 },
};

// Harmonized System codes by product category: 3304.99 skin care, 3303.00
// perfumes, 4202.92 textile bags. Easyship needs a category or an HS code
// per item; the HS code is the standard one and needs no Easyship lookup.
const HS_BY_CATEGORY = {
  scrub: '330499', serum: '330499', 'body-rub': '330499', 'body-cream': '330499', bundle: '330499',
  accessory: '420292', gift: '420292',
};

export function hsCodeFor(product) {
  return HS_BY_CATEGORY[product?.category] || '330499';
}
