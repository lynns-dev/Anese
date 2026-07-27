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
];

// A checkout-only free-gift offer — deliberately not part of PRODUCTS so it
// never shows up in the shop grid or search; it's only ever added via the
// timed offer on the checkout page.
export const TASSEL_GIFT = {
  // TODO: replace with Anese's actual checkout free-gift offer.
  id: 'gift',
  name: 'Free Gift',
  price: 15,
  size: 'one size',
  images: [],
  category: 'gift',
};

export const getProductById = (id) => PRODUCTS.find((p) => p.id === id);
export const getProductsByCategory = (category) => PRODUCTS.filter((p) => p.category === category);
export const getFeaturedProducts = () => PRODUCTS.slice(0, 4);
