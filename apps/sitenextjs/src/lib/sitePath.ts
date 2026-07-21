/** Custom event so soft-nav can sync path even when Next router is slow/stale. */
export const SITE_PATH_CHANGE_EVENT = 'sitenextjs-pathchange';

export function normalizeSitePathname(pathname: string | null | undefined): string {
  const raw = String(pathname || '/').trim() || '/';
  if (raw === '/') return '/';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, '') || '/';
}

/** Strip leading/trailing slashes; treat `home` as homepage (empty slug). */
export function slugFromPathname(pathname: string | null | undefined): string {
  const routeSlug = normalizeSitePathname(pathname)
    .replace(/^\/+|\/+$/g, '')
    .trim()
    .toLowerCase();
  return routeSlug && routeSlug !== 'home' ? routeSlug : '';
}

/**
 * Soft-navigate while keeping projectId (and other query params) when the href has none.
 * Catch-all SPA soft-nav used to drop `?projectId=` and break subsequent loads.
 */
export function dispatchSitePathChange(href: string): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(href, window.location.origin);
    if (!url.search && window.location.search) {
      const current = new URLSearchParams(window.location.search);
      current.forEach((value, key) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
    }
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
      window.history.pushState({}, '', next);
    }
  } catch {
    const pathOnly = href.startsWith('/') ? href : `/${href}`;
    const next = pathOnly.includes('?') || pathOnly.includes('#')
      ? pathOnly
      : `${pathOnly}${window.location.search || ''}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
      window.history.pushState({}, '', next);
    }
  }
  window.dispatchEvent(new Event(SITE_PATH_CHANGE_EVENT));
}
