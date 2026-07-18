/**
 * Shared projectId persistence for SiteNextJS (and GenieBuild read-only APIs).
 * Admin opens the site with ?projectId=…; we store it and reuse on later navigations.
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

/** Query param wins; then localStorage/cookie. */
export function resolveClientProjectId(queryProjectId?: string | null): string | null {
  const fromQuery = String(queryProjectId || '').trim();
  if (fromQuery) return fromQuery;
  return readStoredProjectId();
}
