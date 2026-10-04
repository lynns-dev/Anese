import { NextResponse } from 'next/server';
import { isOutsideServiceAreaCountry } from './lib/ipFilter';

const SESSION_COOKIE = 'admin_session';

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    // Every storefront page load — see storefrontResponse below. Static
    // files and API routes are left out.
    '/((?!api|_next|admin|.*\\..*).*)',
    // In-site navigation fetches page data here instead of the page itself,
    // so the geo-blocked pages below are guarded on this route too.
    '/_next/data/:path*',
  ],
};

// Visitors arriving from these sites get a plain "not available" page instead
// of the store. Added for a Reddit thread being pushed by paid engagement
// (click farms clicking through to the site). Matches the host and any
// subdomain (www., old., out., np.). Remove an entry to let that traffic in
// again.
//
// Limits worth knowing: Reddit usually sends only "https://www.reddit.com/"
// as the referrer, not the thread's URL, so this blocks all Reddit click-
// throughs, not one thread. The Reddit app and copy-pasted links often send
// no referrer at all and can't be told apart from direct visits. The cookie
// below keeps a blocked browser blocked when it comes back without one.
const BLOCKED_REFERRER_HOSTS = ['reddit.com', 'redd.it'];
const BLOCKED_COOKIE = 'anese_ref_block';
const BLOCKED_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function isBlockedReferrer(req) {
  const referrer = req.headers.get('referer');
  if (!referrer) return false;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return BLOCKED_REFERRER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function blockedResponse({ rememberBlock = true } = {}) {
  const res = new NextResponse(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Not available</title></head>'
    + '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;color:#111;font-family:system-ui,sans-serif">'
    + '<p style="font-size:15px">This page isn’t available.</p></body></html>',
    { status: 403, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
  if (rememberBlock) {
    res.cookies.set(BLOCKED_COOKIE, '1', { path: '/', maxAge: BLOCKED_COOKIE_MAX_AGE, sameSite: 'lax' });
  }
  return res;
}

// Pages closed to visitors outside the US, however they arrive. The Reddit
// thread above links straight to this product, and click-farm workers who
// open it from the Reddit app (or paste the link) send no referrer, so the
// referrer block can't see them — but they all come from outside the US,
// and the store only ships within it (lib/ipFilter.js). Add a path here to
// close another page the same way; remove one to reopen it.
const GEO_BLOCKED_PATHS = ['/product/that-booty-tho'];

// Search and ad-review crawlers are let through so the page still gets
// indexed and Meta/Google don't flag an ad's landing page as broken when
// their reviewer happens to fetch it from outside the US.
const ALLOWED_CRAWLER_UA_RE = /facebookexternalhit|facebot|meta-externalagent|facebookcatalog|googlebot|adsbot-google|google-inspectiontool|mediapartners-google|bingbot|pinterestbot/i;

function pagePath(pathname) {
  // /_next/data/<buildId>/product/that-booty-tho.json -> /product/that-booty-tho
  const data = pathname.match(/^\/_next\/data\/[^/]+(\/.*)\.json$/);
  if (!data) return pathname;
  return data[1] === '/index' ? '/' : data[1];
}

function isGeoBlocked(req) {
  const path = pagePath(req.nextUrl.pathname).replace(/\/+$/, '') || '/';
  if (!GEO_BLOCKED_PATHS.includes(path)) return false;
  if (ALLOWED_CRAWLER_UA_RE.test(req.headers.get('user-agent') || '')) return false;
  const country = req.geo?.country || req.headers.get('x-vercel-ip-country');
  return isOutsideServiceAreaCountry(country);
}

// Tells the page which country the visitor is browsing from (Vercel's edge
// geo-IP, no external lookup), so pages/_app.jsx can skip loading the Meta
// Pixel for visitors outside the US — see lib/ipFilter.js. Only written when
// it changes, so most responses carry no Set-Cookie at all.
const GEO_COOKIE = 'anese_geo';

function setGeoTag(req, res) {
  const country = req.geo?.country || req.headers.get('x-vercel-ip-country');
  if (!country) return res;
  const tag = isOutsideServiceAreaCountry(country) ? 'outside' : 'us';
  if (req.cookies.get(GEO_COOKIE)?.value === tag) return res;
  res.cookies.set(GEO_COOKIE, tag, { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });
  return res;
}

function storefrontResponse(req) {
  const isPageData = req.headers.has('x-nextjs-data') || req.nextUrl.pathname.startsWith('/_next/data/');
  // Page-data requests only need the geo check; the referrer on them is the
  // site itself, and the block cookie was already applied on the page load.
  if (!isPageData && (isBlockedReferrer(req) || req.cookies.get(BLOCKED_COOKIE)?.value === '1')) {
    return blockedResponse();
  }
  // Not remembered with a cookie: the same browser may be legitimately in
  // the US another day (travel, a VPN switched off).
  if (isGeoBlocked(req)) return blockedResponse({ rememberBlock: false });
  if (isPageData) return NextResponse.next();
  return setGeoTag(req, NextResponse.next());
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return storefrontResponse(req);
  }

  // The login page/route itself must stay reachable without a session.
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySession(token) : false;

  if (valid) return NextResponse.next();

  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', req.url);
  return NextResponse.redirect(loginUrl);
}

async function verifySession(token) {
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!KV_URL || !KV_TOKEN) return false;
  try {
    const res = await fetch(`${KV_URL}/get/admin_session:${token}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const data = await res.json();
    return Boolean(data.result);
  } catch {
    return false;
  }
}
