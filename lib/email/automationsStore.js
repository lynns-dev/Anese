// Automation flow definitions, stored in the same KV store as everything
// else. Key: email_automations -> JSON array. Seeded on first read the
// same way discountsStore.js seeds its default codes. Per-subscriber
// progress through a flow lives on the subscriber record
// (subscribersStore.updateAutomationState), not here — this store only
// holds the editable flow definitions.
//
// Step content is stored as `html` — raw HTML pasted directly, same as
// campaigns (lib/emailBlocks.js's renderEmailHtml) — so every automation
// email still gets the account's logo, footer, and font from
// lib/settingsStore.js applied automatically at send time
// (pages/api/cron/email-automations.js), and each step is editable from /admin/email
// as a plain HTML textarea, same as the campaign composer. Button/image
// The starter flows below are this store's own (lib/email/brand.js);
// the veil-ecommerce repo seeds its own.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'email_automations';

// Small helpers so the seed HTML below reads as plain content instead of
// markup boilerplate — styled to ANESE's brand ink (lib/theme.js).
//
// Every starter flow ships switched OFF: the copy below is a starting
// point, not reviewed marketing, and no discount codes are included since
// none are known for this store. Review each step in admin → Email →
// Automations, add any offer you want, then switch the flow on.
const INK = '#2E2620';
const SOFT = '#8A7F76';
const SITE = 'https://aneseskin.com';
const eyebrow = (text, align = 'left') => `<p style="margin:0 0 10px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:${SOFT};text-align:${align};">${text}</p>`;
const heading = (text, align = 'left') => `<p style="margin:0 0 16px;font-size:22px;line-height:1.35;color:${INK};font-weight:400;text-align:${align};">${text}</p>`;
const p = (text, align = 'left') => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${INK};text-align:${align};">${text}</p>`;
const button = (label, url = '') => `<div style="text-align:center;margin:28px 0;"><a href="${url}" style="background:${INK};color:#FFFFFF;font-size:12px;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;padding:16px 36px;display:inline-block;">${label}</a></div>`;
const image = (alt, url = '') => `<img src="${url}" alt="${alt}" style="width:100%;display:block;border:0;margin:0 0 20px;" />`;

const SEED_AUTOMATIONS = [
  {
    id: 'welcome_series',
    name: 'Welcome series',
    trigger: 'confirmed',
    enabled: false,
    steps: [
      {
        delayDays: 0,
        subject: 'Welcome to ANESE',
        html: eyebrow('Welcome to ANESE')
          + heading("You're in.")
          + image('That Booty Tho.', `${SITE}/images/anese-product-4oz-poppy6-v2.png`)
          + p("Thanks for joining. You'll be first to hear about new drops, restocks and the routines our customers swear by.")
          + button('Shop ANESE', `${SITE}/shop`),
      },
      {
        delayDays: 3,
        subject: 'The routine everyone asks about',
        html: eyebrow('The ritual')
          + heading('Smooth skin, start to finish.')
          + image('ANESE', `${SITE}/images/anese-lifestyle-hero.png`)
          + p('Our scrubs and creams are made to work together — exfoliate, then lock in moisture. Here is where most people start.')
          + button('See the routine', `${SITE}/shop`),
      },
    ],
  },
  {
    id: 'sunset_winback',
    name: 'Sunset / win-back',
    trigger: 'inactive',
    enabled: false,
    steps: [
      {
        delayDays: 90,
        subject: 'Still want to hear from us?',
        html: eyebrow('Checking in')
          + heading("It's been a while.")
          + p("We only want to be in inboxes that want us there. If you'd still like our emails, just tap below — otherwise we'll stop sending them.")
          + button('Yes, keep me updated', `${SITE}/shop`),
      },
      // Suppress step, not a send — pages/api/cron/email-automations.js
      // treats a falsy subject as "suppress this subscriber".
      { delayDays: 180, subject: null, html: null },
    ],
  },
  {
    id: 'abandoned_checkout',
    name: 'Abandoned checkout',
    trigger: 'checkout_started',
    enabled: false,
    steps: [
      {
        delayHours: 0.5,
        subject: 'Forgot something?',
        html: eyebrow('Your cart', 'center')
          + heading('Still here, waiting for you.', 'center')
          + p("Your cart's exactly how you left it.", 'center')
          + '{{CART_ITEMS}}'
          + button('Finish checking out', `${SITE}/checkout`),
      },
      {
        delayHours: 24,
        subject: 'Still thinking it over?',
        html: eyebrow('Your cart', 'center')
          + heading('One more look?', 'center')
          + '{{CART_ITEMS}}'
          + button('Complete my order', `${SITE}/checkout`),
      },
    ],
  },
  {
    id: 'add_to_cart',
    name: 'Add to cart',
    trigger: 'cart_updated',
    enabled: false,
    steps: [
      {
        delayHours: 3,
        subject: 'Still thinking about it?',
        html: eyebrow('Your cart')
          + heading("It's still there.")
          + p("Everything's exactly how you left it whenever you're ready.")
          + button('View my cart', `${SITE}/checkout`),
      },
    ],
  },
  {
    id: 'order_received',
    name: 'Order received',
    trigger: 'order_placed',
    enabled: false,
    // Not a receipt — the order confirmation email (lib/email/orderHooks.js)
    // covers that. This is a later check-in and review nudge.
    steps: [
      {
        delayHours: 120,
        subject: "How's everything going?",
        html: eyebrow("We'd love to know")
          + heading("How's everything going?")
          + p("Your order should have arrived by now — we'd love to hear what you think.")
          + button('Leave a review', `${SITE}/product/that-booty-tho`),
      },
    ],
  },
];

function assertConfigured() {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  }
}

async function saveAutomations(automations) {
  assertConfigured();
  const res = await fetch(`${KV_URL}/set/${KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(automations),
  });
  if (!res.ok) throw new Error('Failed to save automations.');
}

export async function getAutomations() {
  assertConfigured();
  const res = await fetch(`${KV_URL}/get/${KEY}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const data = await res.json();
  if (!data.result) {
    await saveAutomations(SEED_AUTOMATIONS);
    return SEED_AUTOMATIONS;
  }

  // Backfills any flow introduced after this account's automations were
  // first seeded (e.g. add_to_cart/order_received added later) — an
  // existing deployment picks up new flow types without losing any
  // edits made to the ones it already has.
  const existing = JSON.parse(data.result);
  const missing = SEED_AUTOMATIONS.filter((seed) => !existing.some((a) => a.id === seed.id));
  if (missing.length === 0) return existing;
  const merged = [...existing, ...missing];
  await saveAutomations(merged);
  return merged;
}

export async function getAutomation(id) {
  const automations = await getAutomations();
  return automations.find((a) => a.id === id) || null;
}

export async function updateAutomation(id, patch) {
  const automations = await getAutomations();
  const idx = automations.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('Automation not found.');
  automations[idx] = { ...automations[idx], ...patch };
  await saveAutomations(automations);
  return automations[idx];
}

// getAutomations() only ever writes SEED_AUTOMATIONS content to KV once
// (an empty store, or a brand-new flow id added after this account was
// first set up) — a content OR timing edit to an *existing* flow's steps
// in this file never reaches an already-provisioned live store on its
// own. This is the explicit action that pushes it: overwrites each
// step's subject/html/delayDays/delayHours with the current seed values,
// matched by index, while leaving enabled, trigger, linkTargets, and
// stats untouched.
export async function syncAutomationDesign() {
  const automations = await getAutomations();
  const updated = automations.map((flow) => {
    const seed = SEED_AUTOMATIONS.find((s) => s.id === flow.id);
    if (!seed) return flow;
    const steps = flow.steps.map((step, i) => {
      const seedStep = seed.steps[i];
      if (!seedStep) return step;
      const timing = {};
      if (seedStep.delayDays !== undefined) timing.delayDays = seedStep.delayDays;
      if (seedStep.delayHours !== undefined) timing.delayHours = seedStep.delayHours;
      return { ...step, subject: seedStep.subject, html: seedStep.html, ...timing };
    });
    return { ...flow, steps };
  });
  await saveAutomations(updated);
  return updated;
}

// Send/click tracking for automation steps — mirrors campaignsStore.js's
// linkTargets/stats/send-log/click-log pattern so automation emails get
// the same click-tracking and conversion-analysis treatment campaigns
// already have (lib/automationSend.js, pages/api/email/click.js). Keyed
// by flowId + stepIndex rather than a single id, since a flow has
// multiple steps that each need their own independent link targets and
// stats — a click on step 0 shouldn't count toward step 1's numbers.

export async function updateStepLinkTargets(flowId, stepIndex, linkTargets) {
  const automations = await getAutomations();
  const idx = automations.findIndex((a) => a.id === flowId);
  if (idx === -1) return null;
  const steps = automations[idx].steps.map((s, i) => (i === stepIndex ? { ...s, linkTargets } : s));
  automations[idx] = { ...automations[idx], steps };
  await saveAutomations(automations);
  return automations[idx];
}

export async function incrementStepStat(flowId, stepIndex, statKey, by = 1) {
  const automations = await getAutomations();
  const idx = automations.findIndex((a) => a.id === flowId);
  if (idx === -1) return null;
  const steps = automations[idx].steps.map((s, i) => {
    if (i !== stepIndex) return s;
    const stats = { sent: 0, clicked: 0, ...s.stats, [statKey]: ((s.stats?.[statKey]) || 0) + by };
    return { ...s, stats };
  });
  automations[idx] = { ...automations[idx], steps };
  await saveAutomations(automations);
  return automations[idx];
}

export async function logAutomationSend(flowId, stepIndex, entries) {
  assertConfigured();
  const key = `automation_sends:${flowId}:${stepIndex}`;
  const existing = await getAutomationSendLog(flowId, stepIndex);
  const updated = [...existing, ...entries];
  const res = await fetch(`${KV_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(updated),
  });
  if (!res.ok) throw new Error('Failed to log automation send.');
}

export async function getAutomationSendLog(flowId, stepIndex) {
  assertConfigured();
  const res = await fetch(`${KV_URL}/get/automation_sends:${flowId}:${stepIndex}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : [];
}

export async function findAutomationSend(flowId, stepIndex, sendId) {
  const log = await getAutomationSendLog(flowId, stepIndex);
  return log.find((s) => s.sendId === sendId) || null;
}

export async function logAutomationClick(flowId, stepIndex, entry) {
  assertConfigured();
  const key = `automation_clicks:${flowId}:${stepIndex}`;
  const existing = await getAutomationClickLog(flowId, stepIndex);
  const updated = [...existing, entry];
  const res = await fetch(`${KV_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(updated),
  });
  if (!res.ok) throw new Error('Failed to log automation click.');
}

export async function getAutomationClickLog(flowId, stepIndex) {
  assertConfigured();
  const res = await fetch(`${KV_URL}/get/automation_clicks:${flowId}:${stepIndex}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : [];
}
