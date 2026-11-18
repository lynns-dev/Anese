// Topic matching is editorial relevance, not a medical diagnosis or efficacy check.
export function selectConcernReviews(reviews, concern) {
  const topic = concern === 'spots'
    ? /dark\s*(spots?|marks?)|hyperpigment|pigmentation|acne\s*(marks?|scars?)|discolou?r/i
    : /\bacne\b|break\s?outs?|\bbumps?\b|\bblemishes?\b|\bbutt?ne\b|\bbootyne\b/i;
  const seen = new Set();
  return reviews.filter((review) => {
    const text = String(review.text || '').trim();
    // The historical import includes misfiled other-product reviews.
    if (!text || !topic.test(text) || /boob|breast|chest|the girls|down with the thickness|hold my drink/i.test(text)) return false;
    // A shared product key alone isn't enough: generic comments in this legacy
    // import may belong to a different product. Require explicit context.
    if (!/\bbooty\b|\bbutt\b|\bbum\b|\bthighs?\b|\bhips?\b|\btbt\b|\bbutt?ne\b|\bbootyne\b/i.test(text)) return false;
    if (/do enjoy the booty scrub|prefer.{0,25}booty scrub|booty scrub.{0,30}(far more|better)/i.test(text)) return false;
    if (/\bface\b|facial/i.test(text) && !/booty|\bbutt\b|\bbum\b|thigh|hips?/i.test(text)) return false;
    const key = `${String(review.author || '').trim().toLowerCase()}:${text.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Owner-supplied comparisons, November 15, 2026. Existing Maddie and Sambo
// images are reused rather than duplicated. Only That Booty Tho.-labelled
// images appear here; supplied duo-labelled photos are excluded.
const diana = { src: '/images/anese-proof-diana-spots.jpg', alt: 'That Booty Tho. before-and-after comparison with visible dark spots on butt skin', caption: 'That Booty Tho. comparison · @dianagescobar', width: 1143, height: 1143 };
const maddie = { src: '/images/anese-before-after-2.jpg', alt: 'That Booty Tho. before-and-after comparison with visible spots and marks on butt skin', caption: 'That Booty Tho. comparison · @maddiequig', width: 1242, height: 1242 };
const sambo = { src: '/images/anese-before-after-3.jpg', alt: 'That Booty Tho. before-and-after comparison with visible bumps on butt skin', caption: 'That Booty Tho. comparison · @sambo_bro', width: 639, height: 639 };
const side = { src: '/images/anese-proof-bumps-side.jpg', alt: 'Side-view That Booty Tho. before-and-after comparison with visible bumps and redness', caption: 'That Booty Tho. comparison · side view', width: 640, height: 640 };
const closeup = { src: '/images/anese-proof-marks-closeup.jpg', alt: 'Close-up That Booty Tho. before-and-after comparison with visible spots and marks', caption: 'That Booty Tho. comparison · close-up', width: 1080, height: 1350 };
export const CONCERN_PHOTOS = {
  spots: [diana, maddie, closeup],
  bumps: [sambo, side, closeup],
};
