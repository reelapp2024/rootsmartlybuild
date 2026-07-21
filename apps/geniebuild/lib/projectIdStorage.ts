/**
 * Shared projectId persistence for SiteNextJS + GenieBuild.
 * Admin opens with ?projectId=…; we store it and reuse on later navigations / link opens.
 */
export const PROJECT_ID_STORAGE_KEY = 'smartlybuild_projectId';
export const PROJECT_ID_COOKIE_KEY = 'smartlybuild_projectId';

export function readStoredProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLs = String(localStorage.getItem(PROJECT_ID_STORAGE_KEY) || '').trim();
    if (fromLs) return fromLs;
  } catch {
    /* private mode / blocked storage */
  }
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${PROJECT_ID_COOKIE_KEY}=([^;]*)`)
    );
    const fromCookie = match?.[1] ? decodeURIComponent(match[1]).trim() : '';
    if (fromCookie) return fromCookie;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredProjectId(projectId: string): void {
  const id = String(projectId || '').trim();
  if (!id || typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROJECT_ID_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${PROJECT_ID_COOKIE_KEY}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function clearStoredProjectId(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PROJECT_ID_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${PROJECT_ID_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/** Query param wins; then localStorage/cookie. Persists query id when present. */
export function resolveClientProjectId(queryProjectId?: string | null): string | null {
  const fromQuery = String(queryProjectId || '').trim();
  if (fromQuery) {
    writeStoredProjectId(fromQuery);
    return fromQuery;
  }
  return readStoredProjectId();
}

/**
 * Keep GenieBuild address bar aligned with the active project/page so refresh
 * and link-open stay under the same projectId (mirrors SiteNextJS soft-nav).
 */
export function syncGenieBuildUrl(opts: {
  projectId?: string | null;
  pageId?: string | null;
  locationId?: string | null;
}): void {
  if (typeof window === 'undefined') return;
  const projectId = String(opts.projectId || '').trim();
  if (!projectId) return;

  writeStoredProjectId(projectId);

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('projectId', projectId);
    const pageId = String(opts.pageId || '').trim();
    if (pageId) url.searchParams.set('pageId', pageId);
    else url.searchParams.delete('pageId');

    const locationId = String(opts.locationId || '').trim();
    if (locationId) url.searchParams.set('locationId', locationId);
    else url.searchParams.delete('locationId');

    // Never put token back into the URL (sessionStorage owns it).
    url.searchParams.delete('token');

    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) {
      window.history.replaceState({}, '', next);
    }
  } catch {
    /* ignore */
  }
}
