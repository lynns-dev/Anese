// Which store this email setup belongs to. Everything else in lib/email/
// is shared, unmodified, between the veil-ecommerce and anese repos — only
// this file (and automationsStore.js's starter flows) differ per store.
export const BRAND = {
  id: 'anese',
  name: 'ANESE',
  siteUrl: 'https://aneseskin.com',
  logoUrl: 'https://aneseskin.com/images/anese_logo_transparent.png',
  // The other store's branding — see lib/email/brandRepair.js.
  foreignMarkers: [/veilpuff/i, /\bVEIL\b/],
};
