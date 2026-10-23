// What Easyship needs to know about each product to create a shipment
// (lib/easyship.js): its packed weight and size, and its customs code.
//
// Every product ships at 1 lb in an 8 × 6 × 4 in box (DEFAULT_SPEC, in
// Easyship's units: kilograms and centimetres). Add an entry to SPECS by
// product id (lib/products.js) only for one that differs. (1 lb = 0.4536 kg,
// 1 in = 2.54 cm.)
export const DEFAULT_SPEC = { weightKg: 0.4536, lengthCm: 20.32, widthCm: 15.24, heightCm: 10.16 };
export const SPECS = {};

export const specFor = (id) => SPECS[id] || DEFAULT_SPEC;

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
