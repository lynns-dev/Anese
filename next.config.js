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
      // Apple's own domain-verification fetcher kept reporting a "partial
      // response" for the static public/.well-known/... file, even after
      // the content was confirmed byte-exact and a no-store Cache-Control
      // header was added — the likely cause is Vercel's static-asset CDN
      // honoring a Range request with a 206 Partial Content response,
      // which isn't something a static file's own headers can turn off.
      // Routed to a serverless function instead (pages/api/apple-pay-
      // domain-verification.js), which has no Range/206 support at all —
      // see that file for the actual payload.
      {
        source: '/.well-known/apple-developer-merchantid-domain-association',
        destination: '/api/apple-pay-domain-verification',
      },
    ];
  },
};

module.exports = nextConfig;
