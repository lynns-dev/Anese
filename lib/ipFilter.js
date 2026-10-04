// Requests from these IPs don't count toward site analytics (live visitors,
// funnel counters, recent-activity feed) or server-side Meta ad events --
// this is the store owner's own testing/QA traffic, not real customers.
// Comma-separated so more IPs can be added later via the env var alone.

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || null;
}

export function isExcludedIp(req) {
  const list = (process.env.EXCLUDED_ANALYTICS_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
  if (list.length === 0) return false;

  const ip = getClientIp(req);
  return ip ? list.includes(ip) : false;
}

// The store only ships within the United States (pages/shipping.jsx), so a
// visitor browsing from anywhere else can't place an order. Traffic like that
// is almost entirely bots, scrapers, and click farms — e.g. paid engagement
// pushing a thread that links here — and counting it skews the funnel and
// feeds junk into Meta's ad optimization and retargeting audiences.
//
// US territories count as inside the service area. A missing country header
// (local dev, or a request that didn't come through Vercel's edge) is never
// treated as outside, so nothing is dropped by accident.
export const SERVICE_AREA_COUNTRIES = ['US', 'PR', 'GU', 'VI', 'AS', 'MP'];

export function isOutsideServiceAreaCountry(country) {
  return Boolean(country) && !SERVICE_AREA_COUNTRIES.includes(String(country).toUpperCase());
}

export function isOutsideServiceArea(req) {
  return isOutsideServiceAreaCountry(req.headers['x-vercel-ip-country']);
}
