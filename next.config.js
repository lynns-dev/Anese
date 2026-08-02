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
    return [
      ...OLD_PRODUCT_URL_REWRITES,
      // Routed to a serverless function (pages/api/apple-pay-domain-
      // verification.js) instead of a static public/ file, to avoid
      // Vercel's static-asset CDN honoring Range requests with a 206
      // Partial Content response — see that file for the actual payload
      // and a note on a separate, now-fixed content bug.
      {
        source: '/.well-known/apple-developer-merchantid-domain-association',
        destination: '/api/apple-pay-domain-verification',
      },
    ];
  },
};

module.exports = nextConfig;
