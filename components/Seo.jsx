import Head from 'next/head';

// Site-wide default so a page that hasn't been given its own copy yet
// still ships a real <title>/description instead of nothing — the pages
// router doesn't render one on its own, and a blank title is what Google
// was indexing every page under until this existed.
export const SITE_URL = 'https://aneseskin.com';
export const DEFAULT_TITLE = 'ANESE | Booty Skincare — That Booty Tho Scrub';
export const DEFAULT_DESCRIPTION =
  'ANESE makes booty skincare for butt, thighs, and hips — starting with That Booty Tho, the cult-favorite scrub for smoother, softer, glowing skin. Shop the full collection.';

export default function Seo({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, path = '/', image = '/images/anese-lifestyle-hero.png' }) {
  const url = `${SITE_URL}${path}`;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="ANESE" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${SITE_URL}${image}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}${image}`} />
    </Head>
  );
}
