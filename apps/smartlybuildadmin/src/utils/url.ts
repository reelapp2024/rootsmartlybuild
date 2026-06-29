// src/utils/url.ts

/** Public site path for a WebsitePage (uses slug, not internal name). */
export function pagePublicPath(page?: { slug?: string; name?: string } | null): string {
  if (!page) return "/";
  const raw = String(page.slug ?? page.name ?? "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!raw || raw.toLowerCase() === "home") return "/";
  return `/${raw}`;
}

export function withBase(p?: string) {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;        // already absolute
  const base = (import.meta as any).env?.VITE_IMAGES_BASE_URL || '';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = String(p).replace(/^\/+/, '');
  return cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
}
