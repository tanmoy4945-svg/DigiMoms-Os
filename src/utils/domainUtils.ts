/**
 * DigiMoms Custom Domain & Subdomain Utility
 * Resolves restaurant custom domains, subdomains, and DigiMoms routing
 */

// Known DigiMoms core domains & development domains that serve the main SaaS portal
export const DIGIMOMS_ROOT_DOMAINS = [
  'digimoms.in',
  'www.digimoms.in',
  'os.digimoms.in',
  'localhost',
  '127.0.0.1'
];

/**
 * Normalizes a domain name (strips protocol, port, path, trailing slashes, www)
 */
export function cleanDomainName(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split(':')[0];
  return cleaned;
}

export interface DomainMatchResult {
  isCustomDomain: boolean;
  isSubdomain: boolean;
  subdomainPart?: string;
  matchedSlug?: string;
}

/**
 * Checks the current browser hostname against registered restaurants.
 * If the current hostname is a restaurant's custom domain (e.g. `kolkatabiryani.com` or `order.kolkatabiryani.com`)
 * or a DigiMoms subdomain (e.g. `kolkatabiryani.digimoms.in`), it returns the matched restaurant's slug.
 */
export function resolveCurrentHostRestaurant(
  restaurants: Array<{ slug: string; custom_domain?: string }>,
  currentHost?: string
): { slug: string; isCustom: boolean } | null {
  if (typeof window === 'undefined' && !currentHost) return null;
  const host = cleanDomainName(currentHost || window.location.hostname);
  if (!host) return null;

  // Ignore cloud run internal domains / dev server domains / local previews unless explicitly mapped
  const isInternalCloudRun = host.endsWith('.run.app') || host.endsWith('.aistudio.internal');

  // 1. Direct match with restaurant custom_domain
  const matchedCustom = restaurants.find(r => {
    if (!r.custom_domain) return false;
    const cleanedCustom = cleanDomainName(r.custom_domain);
    return cleanedCustom && (host === cleanedCustom || host === `www.${cleanedCustom}`);
  });

  if (matchedCustom) {
    return { slug: matchedCustom.slug, isCustom: true };
  }

  // 2. DigiMoms Subdomain check (e.g., [slug].digimoms.in)
  // Check if host ends with .digimoms.in and is not a reserved subdomain (like os.digimoms.in or www.digimoms.in)
  if (host.endsWith('.digimoms.in')) {
    const sub = host.replace('.digimoms.in', '').trim();
    if (sub && sub !== 'os' && sub !== 'www' && sub !== 'api' && sub !== 'app') {
      // Find matching restaurant with this slug or custom subdomain
      const matchBySlug = restaurants.find(r => r.slug.toLowerCase() === sub.toLowerCase());
      if (matchBySlug) {
        return { slug: matchBySlug.slug, isCustom: false };
      }
    }
  }

  // 3. Fallback: query parameter override for testing in dev preview environment (e.g., ?domain=example.com or ?rest_slug=xyz)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const domainSim = params.get('sim_domain') || params.get('custom_domain');
    if (domainSim) {
      const cleanedSim = cleanDomainName(domainSim);
      const matchSim = restaurants.find(r => cleanDomainName(r.custom_domain || '') === cleanedSim);
      if (matchSim) return { slug: matchSim.slug, isCustom: true };
    }
  }

  return null;
}
