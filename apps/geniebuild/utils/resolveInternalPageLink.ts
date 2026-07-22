/**
 * Resolve a free-form href to an internal GenieBuild page id (by slug).
 * Supports leaf ↔ hierarchical matches (e.g. /punjab ↔ /india/punjab).
 */

export type PageLinkCandidate = {
  id: string;
  slug?: string | null;
  name?: string | null;
};

/** True when href can navigate (not empty / hash-only). */
export function hasUsableHref(href?: string | null): boolean {
  const raw = String(href || '').trim();
  return !!raw && raw !== '#';
}

/**
 * Builder/preview: never open internal site paths in a new tab.
 * External http(s) only when the author explicitly opted in.
 */
export function shouldOpenHrefInNewTab(
  href: string,
  openInNewTab?: boolean | null
): boolean {
  const raw = String(href || '').trim();
  if (!hasUsableHref(raw)) return false;
  if (/^(mailto:|tel:|javascript:)/i.test(raw)) return false;
  if (normalizeInternalPath(raw)) return false;
  // Absolute external URL
  if (/^(https?:)?\/\//i.test(raw)) return openInNewTab === true;
  return false;
}

export function resolveAnchorTargetRel(
  href: string,
  openInNewTab?: boolean | null
): { target?: '_blank'; rel?: string } {
  if (!shouldOpenHrefInNewTab(href, openInNewTab)) return {};
  return { target: '_blank', rel: 'noopener noreferrer' };
}

export function normalizeInternalPath(href: string): string | null {
  const raw = String(href || '').trim();
  if (!raw || raw === '#') return null;
  if (/^(mailto:|tel:|javascript:)/i.test(raw)) return null;

  try {
    if (/^https?:\/\//i.test(raw) || raw.startsWith('//')) {
      if (typeof window === 'undefined') return null;
      const url = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
      if (url.origin !== window.location.origin) return null;
      const path = url.pathname.replace(/\/+$/, '') || '/';
      return path === '/home' ? '/' : path;
    }
  } catch {
    return null;
  }

  // Hash-only — not a page switch target.
  if (raw.startsWith('#')) return null;

  const withoutHash = raw.split('#')[0].split('?')[0];
  if (!withoutHash) return null;
  const withSlash = withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
  const path = withSlash.replace(/\/+$/, '') || '/';
  return path === '/home' ? '/' : path;
}

export function slugKeyFromPath(path: string): string {
  return String(path || '/')
    .replace(/^\/+|\/+$/g, '')
    .trim()
    .toLowerCase();
}

function scorePageForHref(page: PageLinkCandidate, wanted: string): number {
  const slug = slugKeyFromPath(String(page.slug || ''));
  const name = String(page.name || '').toLowerCase();
  let score = 0;

  if (!wanted) {
    if (!slug || slug === 'home') return 1;
    return 0;
  }

  if (slug === wanted) {
    score += 10000;
  } else if (slug.endsWith(`/${wanted}`)) {
    score += 5000;
    if (name.startsWith('location-')) score += 2000;
  } else if (wanted.includes('/') && wanted.endsWith(`/${slug}`) && slug) {
    score += 4500;
    if (name.startsWith('location-')) score += 2000;
  } else {
    return 0;
  }

  if (name.startsWith('location-')) score += 60;
  if (name.startsWith('service-')) score += 40;
  return score;
}

export function findPageIdByHref(
  href: string,
  pages: PageLinkCandidate[] | null | undefined
): string | null {
  const path = normalizeInternalPath(href);
  if (path === null) return null;
  const wanted = slugKeyFromPath(path);
  const list = Array.isArray(pages) ? pages : [];

  let bestId: string | null = null;
  let bestScore = 0;
  for (const page of list) {
    const score = scorePageForHref(page, wanted);
    if (score > bestScore) {
      bestScore = score;
      bestId = page.id;
    }
  }
  return bestId;
}

export function isExternalOrSpecialHref(href: string): boolean {
  const raw = String(href || '').trim();
  return /^(https?:)?\/\//i.test(raw) || /^(mailto:|tel:)/i.test(raw);
}

/** True absolute external URL (different origin) — not a GenieBuild soft-nav target. */
export function isTrueExternalHref(href: string): boolean {
  const raw = String(href || '').trim();
  if (!/^(https?:)?\/\//i.test(raw)) return false;
  try {
    if (typeof window === 'undefined') return true;
    const url = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
    return url.origin !== window.location.origin;
  } catch {
    return true;
  }
}
