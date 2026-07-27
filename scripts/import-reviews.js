#!/usr/bin/env node
// One-time import of real customer reviews (exported from the previous
// Vitals reviews app on aneseskin.com) into this site's KV-backed review
// store, for 'that-booty-tho' and 'that-booty-tho-6oz'.
//
// Source data: reviews-import-data.json, generated from the raw CSV export
// (not committed — it contained customer emails) with:
//   - PII stripped (only rating/text/author/createdAt kept)
//   - shipping/fraud/non-delivery complaints filtered out (~120 of the
//     7,037 raw rows were things like "stealing card numbers", "never
//     received", "don't shop here" — not product feedback, sometimes with a
//     mismatched star rating — and were dropped rather than published)
//   - that-booty-tho capped to 400 reviews (of ~6,700 remaining after
//     filtering) to stay well under KV request-size limits, since the whole
//     per-product review array is read/written as one JSON blob on every
//     write. The remaining 188 reviews were originally for the 8oz "XL"
//     jar (now discontinued in favor of the 6oz) and are remapped here to
//     that-booty-tho-6oz as its closest current equivalent.
//
// Idempotent: skips any review whose (author, rating, first 40 chars of
// text) already exists in the store, so re-running after a partial failure
// won't duplicate entries.
//
// Usage:
//   KV_REST_API_URL=... KV_REST_API_TOKEN=... node scripts/import-reviews.js

const fs = require('fs');
const path = require('path');

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

if (!KV_URL || !KV_TOKEN) {
  console.error('Set KV_REST_API_URL and KV_REST_API_TOKEN (same values as your Vercel project) before running this.');
  process.exit(1);
}

async function getReviews(productId) {
  const res = await fetch(`${KV_URL}/get/reviews:${productId}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : [];
}

async function setReviews(productId, reviews) {
  const res = await fetch(`${KV_URL}/set/reviews:${productId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(reviews),
  });
  if (!res.ok) throw new Error(`Failed to save reviews for ${productId}: ${res.status} ${await res.text()}`);
}

function dedupeKey(r) {
  return `${r.author}|${r.rating}|${(r.text || '').slice(0, 40)}`;
}

async function main() {
  const dataPath = path.join(__dirname, 'reviews-import-data.json');
  const importData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  for (const [productId, incoming] of Object.entries(importData)) {
    const existing = await getReviews(productId);
    const existingKeys = new Set(existing.map(dedupeKey));

    const toAdd = incoming
      .filter((r) => !existingKeys.has(dedupeKey(r)))
      .map((r, i) => ({
        id: `imported-${productId}-${Date.now()}-${i}`,
        rating: r.rating,
        text: r.text,
        author: r.author,
        createdAt: r.createdAt || new Date().toISOString(),
        source: 'imported',
        status: 'approved',
      }));

    if (toAdd.length === 0) {
      console.log(`${productId}: nothing new to import (${existing.length} already stored).`);
      continue;
    }

    const updated = [...existing, ...toAdd];
    await setReviews(productId, updated);
    console.log(`${productId}: imported ${toAdd.length} reviews (${updated.length} total now).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
