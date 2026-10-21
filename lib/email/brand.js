// Which store this email setup belongs to. Everything else in lib/email/
// is shared, unmodified, between the veil-ecommerce and anese repos — only
// this file (and automationsStore.js's starter flows) differ per store.
export const BRAND = {
  id: 'anese',
  name: 'ANESE',
  siteUrl: 'https://aneseskin.com',
  // The A.co script logo cropped tight and flattened onto white for email
  // (public/images/anese-email-logo.png, 400x178 — shown at 180px wide).
  // The site's anese_logo_transparent.png has wide padding baked in, so it
  // rendered tiny in the email header.
  logoUrl: 'https://aneseskin.com/images/anese-email-logo.png',
  // Earlier email logo URLs — a saved setting still pointing at one of
  // these is moved to logoUrl above (lib/email/brandRepair.js).
  legacyLogoUrls: [
    'https://aneseskin.com/images/anese_logo_transparent.png',
    'https://aneseskin.com/images/anese-logo-black.png',
    'https://aneseskin.com/images/anese-logo-lockup.png',
  ],
  // The other store's branding — see lib/email/brandRepair.js.
  foreignMarkers: [/veilpuff/i, /\bVEIL\b/],
};
