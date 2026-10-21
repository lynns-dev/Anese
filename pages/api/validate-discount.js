// Public endpoint checkout calls to validate a discount code. Deliberately
// doesn't expose the full code list (unlike a plain GET-all would) — only
// confirms whether the specific submitted code is valid.

import { getDiscounts } from '../../lib/discountsStore';
import { findUniqueDiscount } from '../../lib/uniqueDiscounts';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  if (!code || !code.trim()) {
    return res.status(400).json({ valid: false });
  }

  try {
    const discounts = await getDiscounts();
    // Falls back to the one-off per-subscriber codes the abandoned-checkout
    // email hands out (lib/uniqueDiscounts.js).
    const match = discounts.find((d) => d.code.toLowerCase() === code.trim().toLowerCase())
      || await findUniqueDiscount(code);
    if (!match) return res.status(200).json({ valid: false });
    return res.status(200).json({ valid: true, code: match.code, type: match.type, value: match.value });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
