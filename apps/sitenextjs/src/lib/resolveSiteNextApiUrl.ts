/**
 * Resolve SiteNext public API base (`…/sitenextjs/v1`).
 * Local `.env.local` should set NEXT_PUBLIC_SITENEXTJS_API_URL or NEXT_PUBLIC_API_URL.
 * In development, never silently fall back to production (that causes Network Error on localhost:3030).
 */
export function resolveSiteNextJsApiUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_SITENEXTJS_API_URL || '').trim();
  if (explicit) {
    const cleaned = explicit.replace(/\/+$/, '');
    // Allow either full …/sitenextjs/v1 or just origin/host
    if (/\/sitenextjs\/v1$/i.test(cleaned)) return cleaned;
    try {
      const u = new URL(cleaned.includes('://') ? cleaned : `http://${cleaned}`);
      return `${u.origin}/sitenextjs/v1`;
    } catch {
      return cleaned;
    }
  }

  const adminUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (adminUrl) {
    try {
      const normalized = adminUrl.replace(/\/+$/, '');
      const u = new URL(normalized.includes('://') ? normalized : `http://${normalized}`);
      return `${u.origin}/sitenextjs/v1`;
    } catch {
      /* fall through */
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:1111/sitenextjs/v1';
  }

  return 'https://apis.smartlybuild.dev/sitenextjs/v1';
}
