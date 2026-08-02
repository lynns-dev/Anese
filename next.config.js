// Old Shopify product URLs (still referenced by live ads) mapped to this
// site's product pages. These are rewrites, not redirects — the browser URL
// bar keeps showing the old /products/... path, no 3xx response, so ad
// destination URLs never need to change. Add more entries here as old slugs
// are confirmed (see lib/products.js for current product ids).
const OLD_PRODUCT_URL_REWRITES = [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return OLD_PRODUCT_URL_REWRITES;
  },
  // Apple's own domain-verification fetcher reported a redirect on this
  // path (fixed separately at the Vercel domain level) and then a
  // "partial response" on retry — the file itself is confirmed byte-exact
  // and valid locally, so this forces the edge to always serve it fresh
  // (no-store) rather than a possibly-truncated cached copy, and pins an
  // explicit Content-Type so nothing downstream guesses one that triggers
  // compression/transformation of this exact payload.
  async headers() {
    return [
      {
        source: '/.well-known/apple-developer-merchantid-domain-association',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
