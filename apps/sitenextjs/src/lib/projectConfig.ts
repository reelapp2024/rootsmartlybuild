import {
  PROJECT_ID_COOKIE_KEY,
  readStoredProjectId,
  writeStoredProjectId,
} from '@geniebuild/lib/projectIdStorage';

/**
 * Default project for local/preview SiteNextJS when the URL has no ?projectId=
 * and nothing is stored yet.
 * Set NEXT_PUBLIC_PROJECT_ID in apps/sitenextjs/.env.local (must match WebsitePage rows).
 */
export function getDefaultProjectId(): string {
  return (process.env.NEXT_PUBLIC_PROJECT_ID || '').trim();
}

/**
 * Full-site demo with dummy GenieBuild sections (header/footer + all page sections).
 * Set NEXT_PUBLIC_DEMOMODE=true (or DEMOMODE=true on the server) in apps/sitenextjs/.env.local
 */
export function isDemoMode(explicit?: boolean | null): boolean {
  if (explicit === true) return true;
  if (explicit === false) return false;
  const raw = (
    process.env.NEXT_PUBLIC_DEMOMODE ||
    process.env.DEMOMODE ||
    ''
  )
    .trim()
    .toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on';
}

export { writeStoredProjectId, readStoredProjectId, PROJECT_ID_COOKIE_KEY };

/**
 * Resolve order: URL ?projectId= → cookie (SSR/middleware) → localStorage (client) → env.
 * When query has a projectId, callers should also persist it via writeStoredProjectId.
 */
export function resolveProjectId(
  queryProjectId?: string | null,
  options?: { cookie?: string | null }
): string {
  const fromQuery = (queryProjectId || '').trim();
  if (fromQuery) return fromQuery;

  const fromCookie = String(options?.cookie || '').trim();
  if (fromCookie) {
    try {
      return decodeURIComponent(fromCookie).trim() || fromCookie;
    } catch {
      return fromCookie;
    }
  }

  if (typeof window !== 'undefined') {
    const stored = readStoredProjectId();
    if (stored) return stored;
  }

  return getDefaultProjectId();
}
