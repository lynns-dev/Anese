// Topic matching is editorial relevance, not a medical diagnosis or efficacy check.
export function selectConcernReviews(reviews, concern) {
  const topic = concern === 'spots'
    ? /dark\s*(spots?|marks?)|hyperpigment|pigmentation|acne\s*(marks?|scars?)|discolou?r/i
    : /\bacne\b|break\s?outs?|\bbumps?\b|\bblemishes?\b/i;
  const seen = new Set();
  return reviews.filter((review) => {
    const text = String(review.text || '').trim();
    // The historical import includes misfiled other-product reviews.
    if (!text || !topic.test(text) || /boob|breast|chest|down with the thickness|hold my drink/i.test(text)) return false;
    if (/\bface\b|facial/i.test(text) && !/booty|\bbutt\b|\bbum\b|thigh|hips?/i.test(text)) return false;
    const key = `${String(review.author || '').trim().toLowerCase()}:${text.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Existing store assets, inspected individually. Duo-labelled images 1 and 4
// are deliberately excluded from this single-product funnel. No duration is known.
export const CONCERN_PHOTOS = {
  spots: { src: '/images/anese-before-after-2.jpg', alt: 'Archived That Booty Tho. before-and-after photo showing visible spots on butt skin', caption: 'From the That Booty Tho. archive: selected for visible spots and marks.' },
  bumps: { src: '/images/anese-before-after-3.jpg', alt: 'Archived That Booty Tho. before-and-after photo showing visible bumps on butt skin', caption: 'From the That Booty Tho. archive: selected for visible bumps and texture.' },
};
