// Centralized runtime configuration — Vite (GenieBuild) or Next (SiteNextJS).
// All API/media URL references across the app must use these exports.

function readEnvApiUrl(): string {
  try {
    const fromNext =
      typeof process !== 'undefined'
        ? String(
            process.env?.NEXT_PUBLIC_API_URL ||
              process.env?.NEXT_PUBLIC_SITENEXTJS_API_URL ||
              ''
          ).trim()
        : '';
    if (fromNext) return fromNext;
  } catch {
    /* ignore */
  }
  try {
    const fromVite = String((import.meta as any).env?.VITE_API_URL || '').trim();
    if (fromVite) return fromVite;
  } catch {
    /* ignore */
  }
  return 'http://localhost:1111/admin/v1';
}

export const API_BASE_URL: string = readEnvApiUrl();

export const MEDIA_BASE_URL: string = (() => {
  const apiUrl = API_BASE_URL;
  try {
    const parsed = new URL(apiUrl.includes('://') ? apiUrl : `http://${apiUrl}`);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'http://localhost:1111';
  }
})();

/** Returns true only for absolute http/https URLs — rejects javascript:, data:, etc. */
export function isValidHttpUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Pull a real URL string from coverImage / image fields.
 * Never coerce objects with String() — that becomes "[object Object]".
 */
export function extractMediaUrl(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s || /^\[object\s+object\]$/i.test(s)) return '';
    // JSON-encoded { url } payloads
    if (
      (s.startsWith('{') && s.endsWith('}')) ||
      (s.startsWith('[') && s.endsWith(']'))
    ) {
      try {
        return extractMediaUrl(JSON.parse(s));
      } catch {
        return '';
      }
    }
    return s;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['url', 'src', 'href', 'path', 'image', 'imageUrl', 'secure_url', 'location']) {
      const nested = obj[key];
      if (typeof nested === 'string') {
        const inner = extractMediaUrl(nested);
        if (inner) return inner;
      }
      if (nested && typeof nested === 'object') {
        const deeper = extractMediaUrl(nested);
        if (deeper) return deeper;
      }
    }
  }
  return '';
}

/**
 * Converts a relative path to an absolute media URL using MEDIA_BASE_URL.
 * Returns '' for empty input. Passes through already-absolute URLs unchanged.
 * Safe with objects / bad "[object Object]" strings.
 */
export function toAbsoluteMediaUrl(url: unknown): string {
  const u = extractMediaUrl(url);
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  return `${MEDIA_BASE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}
