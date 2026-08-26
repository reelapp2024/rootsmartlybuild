// Centralized runtime configuration — Vite (GenieBuild) or Next (SiteNextJS).
// All API/media URL references must go through BackendUrl (see lib/backendUrl.ts).

import {
  resolveAdminApiUrl,
  resolveBackendUrl,
  resolveMediaBaseUrl,
  resolveSiteNextApiUrl,
} from './lib/backendUrl';

/** Backend origin — e.g. http://localhost:1111 */
export const BACKEND_URL: string = resolveBackendUrl();

/** Admin API base — `${BackendUrl}/admin/v1` */
export const API_BASE_URL: string = (() => {
  const admin = resolveAdminApiUrl();
  if (admin) return admin;
  // If env was a full …/sitenextjs/v1 URL, still expose a usable admin path
  const origin = resolveBackendUrl();
  return origin ? `${origin}/admin/v1` : '';
})();

/** SiteNext public API — `${BackendUrl}/sitenextjs/v1` */
export const SITENEXT_API_URL: string = resolveSiteNextApiUrl();

/** Media / uploads host = backend origin */
export const MEDIA_BASE_URL: string = resolveMediaBaseUrl();

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
 */
export function toAbsoluteMediaUrl(url: unknown): string {
  const u = extractMediaUrl(url);
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  const base = MEDIA_BASE_URL;
  if (!base) return u.startsWith('/') ? u : `/${u}`;
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
}
