// One-off discount codes minted per subscriber — the abandoned-checkout
// email's {{DISCOUNT_CODE}} (lib/email/automationSend.js). Kept out of the
// shared `discounts` list (lib/discountsStore.js) so the admin's code list
// doesn't fill up with one row per email sent; checkout still accepts them
// through pages/api/validate-discount.js.
//
// Keys: discount_unique:<CODE> -> { code, type, value, email, source, createdAt }
//       discount_unique_email:<source>:<email> -> CODE
// The second key means a subscriber gets the same code back if the email
// is re-sent (manual "send now", a later checkout restarting the flow)
// instead of a new one every time.

import { randomInt } from 'crypto';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// No 0/O/1/I/L — the code is read off an email and typed by hand.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function assertConfigured() {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  }
}

async function kvGet(key) {
  assertConfigured();
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const data = await res.json();
  return data.result ?? null;
}

async function kvSet(key, value) {
  assertConfigured();
  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: typeof value === 'string' ? value : JSON.stringify(value),
  });
  if (!res.ok) throw new Error('Failed to save discount code.');
}

function randomSuffix(length = 6) {
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export async function findUniqueDiscount(code) {
  const raw = await kvGet(`discount_unique:${String(code || '').trim().toUpperCase()}`);
  return raw ? JSON.parse(raw) : null;
}

export async function getOrCreateUniqueDiscount(email, { source, prefix, type = 'percent', value }) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) throw new Error('An email is required for a unique discount code.');

  const emailKey = `discount_unique_email:${source}:${normalized}`;
  const existingCode = await kvGet(emailKey);
  if (existingCode) {
    const existing = await findUniqueDiscount(existingCode);
    if (existing) return existing;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `${prefix}-${randomSuffix()}`;
    if (await findUniqueDiscount(code)) continue;
    const discount = { code, type, value, email: normalized, source, createdAt: Date.now() };
    await kvSet(`discount_unique:${code}`, discount);
    await kvSet(emailKey, code);
    return discount;
  }
  throw new Error('Could not generate a unique discount code.');
}
