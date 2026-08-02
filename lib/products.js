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
    id: 'hold-my-drink',
    name: 'Hold my Drink.',
    price: 29,
    size: '4 oz · 125ml',
    images: ['/images/anese-hold-my-drink.png'],
    // Its own category (not 'scrub') — that flag drives the booty/thighs/
    // hips-specific benefits/timeline/ritual sections and copy elsewhere on
    // the product page, which don't apply to this scent/formula.
    category: 'body-rub',
    tagline: 'coconut, sugar, botanicals',
    description: 'A coconut body rub polished with sugar and botanicals — the poolside scent you\'ll want an excuse to wear year-round.',
    longDescription: 'Coconut Body Rub: sugar buffs away rough, dry texture while coconut and botanicals leave skin soft and glowing, no oily residue. A warm, sweet coconut scent that lingers just enough.',
    notes: null,
    wear: null,
    finish: 'Soft, smooth, coconut-scented skin',
    usage: 'On wet skin, scoop onto hands and massage in circles wherever you want the glow. Rinse. Use 2–3x a week.',
    ingredients: 'Sugar, coconut, botanicals',
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
