// Brand copy shared by the homepage and the /questions, /rituals and
// /stories pages, so the same answer never drifts between two places.
//
// Voice: kind first, useful second, funny third. The joke is never about
// how a body looks, and nothing here promises results we can't show.

// Announcement bar: `text` on wider screens, `short` on phones so every
// message fits on a single line.
export const ANNOUNCEMENTS = [
  { text: 'Free shipping $50+. Your butt deserves a care package.', short: 'Free shipping on orders $50+' },
  { text: 'Free silk bag on orders $50+. Cute and useful.', short: 'Free silk bag on orders $50+' },
  { text: 'New here? 15% off with code FIRST15.', short: '15% off with code FIRST15' },
  { text: "Got a question you'd only ask your best friend? Ask us.", short: 'Awkward question? Ask us.' },
];

// "Things people ask us" — each question gets a straight answer and the
// product that fits (or, for sensitive skin, the gentler option).
export const QUESTION_TOPICS = [
  {
    tab: 'Butt breakouts',
    question: 'Is it normal to get breakouts on my butt?',
    answer: 'Very normal. Sweat, friction, tight leggings and long days sitting all add up. Gentle exfoliation 2–3 times a week helps clear the buildup that leaves skin feeling bumpy and congested.',
    product: 'that-booty-tho',
    tip: "More scrubbing isn't better scrubbing. Twice a week beats every day.",
    more: { href: '/booty-acne', label: 'Read the booty acne guide' },
  },
  {
    tab: 'Rough, bumpy skin',
    question: 'What actually helps with rough, bumpy skin?',
    answer: 'Consistency, a gentle buff and plenty of moisture. Finely milled walnut grain smooths the rough feel; shea, jojoba and rosehip keep skin from drying out.',
    product: 'that-booty-tho-6oz',
    productNote: "Made for a routine you'll actually keep.",
    tip: "Rough texture is a long game. Be patient with your skin — it's doing its best.",
  },
  {
    tab: 'Uneven tone',
    question: 'My skin tone looks uneven. Can anything help?',
    answer: 'Regular exfoliation buffs away dull surface skin; a serum finishes with a smooth, glowy feel. Give any routine a few weeks before judging.',
    product: 'glazed-set',
    productNote: 'Scrub + Booty Glaze serum.',
    tip: 'Consistency over intensity, always.',
  },
  {
    tab: 'Stretch marks',
    question: 'Can I do anything about stretch marks?',
    answer: "Honestly? Nothing erases them — and you don't have to want them gone. If you'd like skin that feels softer, rich moisture helps.",
    product: 'cream-dream-set',
    tip: 'Apply right after showering, while skin is still damp.',
  },
  {
    tab: 'Dry, dull skin',
    question: 'My skin just feels dry and dull.',
    answer: "Sugar polishes away dry flakes; coconut leaves skin soft and smelling like a vacation you didn't have to book.",
    product: 'hold-my-drink',
    tip: 'Works on legs and arms too — anywhere below the neck.',
  },
  {
    tab: 'Sensitive skin',
    question: 'Can I scrub if my skin is sensitive?',
    answer: "Sometimes the honest answer is \"not right now.\" If your skin is irritated, broken or freshly shaved, skip the scrub and moisturize instead. Come back when it's calm.",
    product: 'cream-dream-set',
    productNote: 'For the gentle days.',
    tip: "Listen to your skin. If it stings, that's a no for today.",
  },
];

export const DEMO_STEPS = [
  ['The scoop', "Two fingers' worth. No, you don't need more."],
  ['The texture', 'Gritty enough to work, gentle enough for twice a week.'],
  ['The circles', 'Booty, thighs, hips. Wherever you want it.'],
  ['The rinse', 'Soft, not stripped. No oily film.'],
];

export const RITUALS = [
  {
    name: 'The 2-minute Tuesday',
    line: 'One scoop, a few circles, rinse. Back to your life.',
    steps: ['On wet skin, scoop two fingers’ worth of That Booty Tho.', 'Massage in circles for about 30 seconds.', 'Rinse and get on with your day.'],
    product: 'that-booty-tho',
  },
  {
    name: 'The Sunday reset',
    line: 'Face mask on, playlist on, booty scrub on. Main-character shower.',
    steps: ['Start the playlist. This part is mandatory.', 'Scrub booty, thighs and hips while your face mask does its thing.', 'Rinse, then smooth on Cream Dream while skin is still damp.'],
    product: 'cream-dream-set',
  },
  {
    name: 'The post-gym rinse',
    line: 'Sweaty leggings were a choice. So is this.',
    steps: ['Get out of the sweaty leggings as soon as you can.', 'Quick scrub where they sat tightest — friction is not your friend.', 'Rinse with lukewarm water and pat dry.'],
    product: 'that-booty-tho',
  },
  {
    name: 'The night-before-the-beach',
    line: 'Scrub the night before, not the morning of. Trust us.',
    steps: ['The night before: scrub, rinse, moisturize.', 'Give your skin the night to settle.', 'Morning of: sunscreen, sunglasses, zero stress.'],
    product: 'glazed-set',
  },
];

export const MYTHS = [
  ["Butt breakouts mean you're not clean.", "Friction and sweat don't care how often you shower."],
  ['Scrub harder for better results.', "We're buffing, not sanding. Gentle wins."],
  ['You need a 10-step body routine.', 'One good scrub, twice a week, and a moisturizer you like.'],
  ['Stretch marks are something to fix.', "They're skin doing its job. Care for it however you want."],
];

export const HOW_TO = [
  ['Hop in the shower', "On wet skin, scoop two fingers' worth."],
  ['Massage in circles', 'Booty, thighs, hips. Hum something if you want.'],
  ['Rinse and go', '2–3 times a week. A little goes a long way.'],
];

export const FAQS = [
  ['How often should I use it?', '2–3 times a week. Every day is too much, even if you love it.'],
  ['Is it too rough?', "Gritty, not gnarly. We're buffing, not sanding."],
  ['Where can I use it?', 'Anywhere below the neck — booty, thighs, hips, arms, legs.'],
  ['Can I use it after shaving?', 'Wait a day. Freshly shaved skin wants a break.'],
  ['How fast does it ship?', 'Usually within 1 business day; most orders arrive in 3–5 business days (US only).'],
  ['How much is shipping?', '$5 flat, free on orders $50+.'],
  ["What's your return policy?", 'Unopened products can be returned within 30 days. Opened items are final sale for hygiene reasons, unless they arrived damaged.'],
];

// Short card line per product — the collection grid and shop page.
export const PRODUCT_ONE_LINERS = {
  'that-booty-tho': 'Our walnut scrub. Gritty, not gnarly.',
  'that-booty-tho-6oz': 'Same scrub, more showers.',
  'glazed-set': 'Scrub, then glow. The full routine.',
  'hold-my-drink': 'Coconut sugar rub. Vacation, in a jar.',
  'cream-dream-set': 'Whipped cocoa butter. The cozy one.',
  'silk-bag': 'For your jar, your stuff, your weekend.',
};
