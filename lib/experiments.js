import React from 'react';
import { getSessionId } from './session';

// Split tests (A/B). Each visitor is put in one variant per test, 50/50, and
// stays there (kept on this device). A test only counts a visitor once they
// have actually seen it (exposeExperiment), and from then on every cart /
// checkout / purchase step they reach is counted under their variant
// (lib/cartTracking.js → pages/api/track/cart.js → lib/experimentsStore.js).
// Results: admin → /admin/tests.
//
// To end a test: set `winner` to the variant that should show for everyone.

export const EXPERIMENTS = {
  shop_pay_checkout_v1: {
    name: 'Checkout: current payment options vs adding Shop Pay',
    variants: ['control', 'shop_pay'], started: '2026-11-07', status: 'running', primaryMetric: 'purchased',
    hypothesis: 'Adding Shop Pay increases completed purchases per checkout visitor. Stable 50/50 assignment; purchases confirmed server-side across all payment methods.',
  },
  pdp_proof: {
    name: 'Product page: top review + "what it does" above Add to shower',
    variants: ['control', 'proof'],
    started: '2026-11-05',
    // Ended 2026-11-06: proof selected as the permanent product-page treatment.
    winner: 'proof',
  },
  set_offer: {
    name: 'Scrub / Glaze page: Glazed Set card above Add to shower',
    variants: ['control', 'set'],
    started: '2026-11-05',
    // Ended 2026-11-08: keep the original product page (control) permanently.
    winner: 'control',
  },
  hero_real_skin: {
    name: 'Homepage hero: "real skin. real scrub." (relaunch) vs current',
    variants: ['control', 'realskin'],
    // Ended 2026-11-06: current homepage hero (control) selected as permanent.
    winner: 'control',
    started: '2026-11-06',
  },
  cart_checkout_cta: {
    name: 'Cart: checkout CTA wording', variants: ['control', 'secure'], started: '2026-11-06',
  },
  cart_discount_visibility: {
    name: 'Cart: discount offer expanded vs collapsed', variants: ['control', 'collapsed'], started: '2026-11-06',
    // Ended 2026-11-08: keep the expanded discount offer (control) permanently.
    winner: 'control',
  },
  cart_total_reassurance: {
    name: 'Cart: explicit free-shipping line beside order total', variants: ['control', 'shipping'], started: '2026-11-06',
  },
  cart_trust: {
    name: 'Cart: reviews + 30-day guarantee above Checkout',
    variants: ['control', 'trust'],
    started: '2026-11-05',
  },
};

const KEY = (id) => `anese-exp:${id}`;
const SEEN = (id) => `anese-exp-seen:${id}`;

function store(fn) {
  try { return fn(window.localStorage); } catch { return null; }
}

export function getVariant(id) {
  const exp = EXPERIMENTS[id];
  if (!exp || typeof window === 'undefined') return 'control';
  if (exp.winner) return exp.winner;
  // ?exp_<id>=<variant> forces a variant on this device (for checking a test).
  try {
    const forced = new URLSearchParams(window.location.search).get(`exp_${id}`);
    if (forced && exp.variants.includes(forced)) {
      store((s) => s.setItem(KEY(id), forced));
      return forced;
    }
  } catch { /* ignore */ }
  let v = store((s) => s.getItem(KEY(id)));
  if (!exp.variants.includes(v)) {
    v = exp.variants[Math.floor(Math.random() * exp.variants.length)];
    store((s) => s.setItem(KEY(id), v));
  }
  return v;
}

// 'control' on first render (matches the server), then the real variant.
export function useVariant(id) {
  const [v, setV] = React.useState('control');
  React.useEffect(() => { setV(getVariant(id)); }, [id]);
  return v;
}

export function exposeExperiment(id) {
  const exp = EXPERIMENTS[id];
  if (!exp || exp.winner || typeof window === 'undefined') return;
  const variant = getVariant(id);
  if (store((s) => s.getItem(SEEN(id))) === variant) return;
  store((s) => s.setItem(SEEN(id), variant));
  try {
    fetch('/api/track/exp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, variant, sessionId: getSessionId() }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* tracking never gets in the way */ }
}

export function exposedExperiments() {
  if (typeof window === 'undefined') return {};
  const out = {};
  for (const [id, exp] of Object.entries(EXPERIMENTS)) {
    if (exp.winner) continue;
    const seen = store((s) => s.getItem(SEEN(id)));
    if (seen && exp.variants.includes(seen)) out[id] = seen;
  }
  return out;
}
