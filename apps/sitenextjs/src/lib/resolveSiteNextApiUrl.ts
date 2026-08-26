/**
 * Resolve SiteNext public API base (`…/sitenextjs/v1`) from BackendUrl.
 *
 * Prefer:
 *   NEXT_PUBLIC_BackendUrl=http://localhost:1111
 * Legacy still accepted: NEXT_PUBLIC_SITENEXTJS_API_URL / NEXT_PUBLIC_API_URL
 */
export function resolveSiteNextJsApiUrl(): string {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = String(process.env[k] || '').trim();
      if (v) return v;
    }
    return '';
  };

  const raw =
    pick(
      'NEXT_PUBLIC_BackendUrl',
      'NEXT_PUBLIC_BACKEND_URL',
      'BackendUrl',
      'BACKEND_URL',
      'NEXT_PUBLIC_SITENEXTJS_API_URL',
      'NEXT_PUBLIC_API_URL'
    ) || '';

  if (raw) {
    const cleaned = raw.replace(/\/+$/, '');
    if (/\/sitenextjs\/v1$/i.test(cleaned)) return cleaned;
    try {
      const u = new URL(cleaned.includes('://') ? cleaned : `http://${cleaned}`);
      return `${u.origin}/sitenextjs/v1`;
    } catch {
      return cleaned;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:1111/sitenextjs/v1';
  }

  console.error(
    '[resolveSiteNextJsApiUrl] Set NEXT_PUBLIC_BackendUrl (origin only), e.g. https://your-api.example.com'
  );
  return '';
}
