// Server-rendered sitemap.xml (not a static public/ file) so it stays in
// sync with lib/products.js automatically as products are added/removed.
// priority is a hint only — Google doesn't guarantee using it for ranking
// or sitelink selection, but it's the standard way to signal which pages
// matter most on the site, and Shop + That Booty Tho are the two pages
// requested as the priority "top links" to show under the site's search
// result.
import { SITE_URL } from '../components/Seo';
import { PRODUCTS } from '../lib/products';

function urlEntry(path, priority, changefreq) {
  return `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function buildSitemap() {
  const entries = [
    urlEntry('/', '1.0', 'daily'),
    urlEntry('/shop', '0.9', 'daily'),
    ...PRODUCTS.map((p) =>
      urlEntry(`/product/${p.id}`, p.id === 'that-booty-tho' ? '0.9' : '0.7', 'weekly')
    ),
    urlEntry('/terms', '0.2', 'yearly'),
    urlEntry('/privacy', '0.2', 'yearly'),
    urlEntry('/returns', '0.2', 'yearly'),
    urlEntry('/shipping', '0.2', 'yearly'),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;
}

export default function Sitemap() {
  return null;
}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/xml');
  res.write(buildSitemap());
  res.end();
  return { props: {} };
}
