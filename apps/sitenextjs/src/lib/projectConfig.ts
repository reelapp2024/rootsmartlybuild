/**
 * Default project for local/preview SiteNextJS when the URL has no ?projectId=.
 * Set NEXT_PUBLIC_PROJECT_ID in apps/sitenextjs/.env.local (must match your WebsitePage rows).
 */
export function getDefaultProjectId(): string {
  return (process.env.NEXT_PUBLIC_PROJECT_ID || '').trim();
}

/** Query param overrides env (admin preview). */
export function resolveProjectId(queryProjectId?: string | null): string {
  const fromQuery = (queryProjectId || '').trim();
  if (fromQuery) return fromQuery;
  return getDefaultProjectId();
}
