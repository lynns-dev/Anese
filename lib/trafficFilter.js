// Only the confirmed legacy catalog probe is excluded. This is not a bot
// verdict and never blocks access or marks the whole session as non-human.
export function isCatalogProbePath(value) {
  if (typeof value !== 'string') return false;
  try {
    const path = new URL(value, 'https://www.anese.co').pathname;
    return path === '/products.json' || path === '/products.json/';
  } catch { return false; }
}
