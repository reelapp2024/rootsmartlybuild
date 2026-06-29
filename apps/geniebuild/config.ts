// Centralized runtime configuration — read from Vite env vars.
// All API/media URL references across the app must use these exports.

export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:1111/admin/v1';

export const MEDIA_BASE_URL: string = (() => {
  const apiUrl: string = (import.meta as any).env?.VITE_API_URL || 'http://localhost:1111/admin/v1';
  try {
    const parsed = new URL(apiUrl);
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
 * Converts a relative path to an absolute media URL using MEDIA_BASE_URL.
 * Returns '' for empty input. Passes through already-absolute URLs unchanged.
 */
export function toAbsoluteMediaUrl(url: string): string {
  const u = (url || '').trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  return `${MEDIA_BASE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}
