export const PRODUCTS = [
  {
    id: 'that-booty-tho',
    name: 'That Booty Tho.',
    price: 32,
    size: '4 oz · 125ml',
    // Order: jar, model using it, texture, then supporting lifestyle shots.
    images: [
      '/images/anese-product-a.png',
      '/images/anese-product-c.png',
      '/images/anese-product-b.png',
      '/images/anese-lifestyle-hero.png',
      '/images/anese-lifestyle-1.png',
      '/images/anese-lifestyle-2.png',
      '/images/anese-lifestyle-3.png',
      '/images/anese-lifestyle-4.png',
    ],
    category: 'scrub',
    badge: 'Bestseller',
    tagline: 'petite walnut grain · botanical extracts + oils',
    description: "The scrub that's not here to \"fix\" your body — just to make it feel ridiculously good. Your booty's new hype girl.",
    longDescription: 'Perfecting Booty Scrub: finely milled walnut grain buffs away rough, uneven texture while shea, jojoba, and rosehip hydrate as you exfoliate — so you rinse off glowing, not stripped. Formulated for butt, thighs, and hips, the spots most scrubs ignore. Gritty enough to work, gentle enough for 2–3x a week.',
    notes: null,
    wear: null,
    finish: 'Smooth, soft, glowing skin',
    usage: 'On wet skin, scoop two moist fingers\' worth onto your target area. Massage in circles into booty, thighs, hips — wherever you want the glow. Rinse. Use 2–3x a week.',
    ingredients: 'Petite walnut grain, botanical extracts + oils (shea, jojoba, rosehip)',
  },
  {
    id: 'that-booty-tho-6oz',
    name: 'That Booty Tho. 6oz',
    price: 40,
    size: '6 oz · 175ml',
    badge: 'Best value',
    // Order: jar, model using it, texture — dedicated 6oz photography.
    images: [
      '/images/anese-6oz-jar.png',
      '/images/anese-6oz-model.png',
      '/images/anese-6oz-texture.png',
    ],
    category: 'scrub',
    tagline: 'petite walnut grain · botanical extracts + oils',
    description: "The scrub that's not here to \"fix\" your body — just to make it feel ridiculously good. Your booty's new hype girl.",
    longDescription: 'Perfecting Booty Scrub: finely milled walnut grain buffs away rough, uneven texture while shea, jojoba, and rosehip hydrate as you exfoliate — so you rinse off glowing, not stripped. Formulated for butt, thighs, and hips, the spots most scrubs ignore. Gritty enough to work, gentle enough for 2–3x a week.',
    notes: null,
    wear: null,
    finish: 'Smooth, soft, glowing skin',
    usage: 'On wet skin, scoop two moist fingers\' worth onto your target area. Massage in circles into booty, thighs, hips — wherever you want the glow. Rinse. Use 2–3x a week.',
    ingredients: 'Petite walnut grain, botanical extracts + oils (shea, jojoba, rosehip)',
  },
  {
    // Distinct id from FREE_GIFT ('gift') on purpose — sharing an id would
    // merge cart quantities between a purchased bag and the auto-added free
    // one (see lib/useCart.js's `add()`, which merges by id), scrambling
    // which line is $18 and which is $0.
    id: 'silk-bag',
    name: 'Anese Silk Bag',
    price: 18,
    size: 'one size',
    images: ['/images/vegan-silk-bag.jpg'],
    category: 'accessory',
    tagline: 'vegan silk · reusable · knot closure',
    description: 'A soft, reusable vegan silk bag with a knot closure — the same one gifted free on orders over $50, also sold on its own.',
    longDescription: 'Vegan silk, gently structured with a simple knot closure instead of a zipper. Roomy enough for a full-size jar of That Booty Tho. plus the essentials — a genuinely useful case, not just packaging.',
    notes: null,
    wear: null,
    finish: null,
    usage: null,
    ingredients: null,
  },
];

// Auto-added to the cart once the subtotal crosses FREE_GIFT_THRESHOLD (see
// lib/useCart.js) — deliberately not part of PRODUCTS so it never shows up
// in the shop grid or search. price is its real/original value; it's always
// added with price: 0 (see lib/useCart.js) so it rings up free.
export const FREE_GIFT = {
  id: 'gift',
  name: 'Anese Silk Bag',
  price: 18,
  size: 'one size',
  images: ['/images/vegan-silk-bag.jpg'],
  category: 'gift',
};

export const FREE_GIFT_THRESHOLD = 50;

export const getProductById = (id) => PRODUCTS.find((p) => p.id === id);
export const getProductsByCategory = (category) => PRODUCTS.filter((p) => p.category === category);
export const getFeaturedProducts = () => PRODUCTS.slice(0, 4);
