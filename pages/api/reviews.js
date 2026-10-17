// GET  (no productId): { [productId]: { reviews, average, count } } for every product.
// GET  ?productId=X:   { reviews, average, count } for that product.
// POST { productId, rating, text, author, source? }: adds a review.
// Only status: 'approved' reviews are ever returned here (public-facing) or
// counted toward the average/count — customer submissions (source omitted or
// 'site') start as 'pending' and need approval in /admin before they're
// visible anywhere. Imported reviews (source: 'imported', added by the
// store owner via /admin) publish immediately since they're already vetted.
// 1-2 star reviews, and any review whose text contains "scam", are
// excluded from the public feed entirely, regardless of status, so they
// never appear or affect the displayed average.

import { getReviews, addReview } from '../../lib/reviewsStore';
import { PRODUCTS } from '../../lib/products';

// The 6oz jar was discontinued; its reviews (same scrub) still show on the
// 4oz page. Stored data is left as-is under the old id.
const MERGED_REVIEW_IDS = { 'that-booty-tho': ['that-booty-tho', 'that-booty-tho-6oz'] };

async function getProductReviews(productId) {
  const ids = MERGED_REVIEW_IDS[productId] || [productId];
  return (await Promise.all(ids.map((id) => getReviews(id)))).flat();
}

function aggregate(reviews) {
  const approved = reviews.filter(
    (r) => r.status === 'approved' && r.rating >= 3 && !/scam/i.test(r.text || '')
  );
  const count = approved.length;
  const average = count === 0 ? 0 : Math.round((approved.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10;
  return { count, average, reviews: approved };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { productId } = req.query;

      if (productId) {
        const reviews = await getProductReviews(productId);
        return res.status(200).json(aggregate(reviews));
      }

      const entries = await Promise.all(
        PRODUCTS.map(async (p) => {
          const reviews = await getProductReviews(p.id);
          return [p.id, aggregate(reviews)];
        })
      );
      return res.status(200).json(Object.fromEntries(entries));
    }

    if (req.method === 'POST') {
      const { productId, rating, text, author, source } = req.body || {};

      if (!productId || !PRODUCTS.some((p) => p.id === productId)) {
        return res.status(400).json({ error: 'Unknown product.' });
      }
      const numericRating = Number(rating);
      if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' });
      }
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Review text is required.' });
      }

      const isImported = source === 'imported';
      const review = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        rating: numericRating,
        text: text.trim().slice(0, 2000),
        author: (author || 'Anonymous').trim().slice(0, 80) || 'Anonymous',
        createdAt: new Date().toISOString(),
        source: isImported ? 'imported' : 'site',
        status: isImported ? 'approved' : 'pending',
      };

      const updated = await addReview(productId, review);
      return res.status(200).json({ review, ...aggregate(updated) });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Reviews API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
