/**
 * Live blog author — always load the FULL links array from DB.
 */

import { API_BASE_URL } from '../config';

export type BlogAuthorLink = { label: string; url: string };

export type BlogAuthorPayload = {
  authorId?: string;
  name?: string;
  jobTitle?: string;
  bio?: string;
  image?: string;
  avatar?: string;
  links?: BlogAuthorLink[];
};

function resolveAuthorApiBases(): string[] {
  const bases: string[] = [];
  const push = (raw?: string | null) => {
    const v = String(raw || '').trim().replace(/\/+$/, '');
    if (v && !bases.includes(v)) bases.push(v);
  };

  push(API_BASE_URL);
  try {
    const next =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITENEXTJS_API_URL
        : '';
    const trimmed = String(next || '').trim().replace(/\/+$/, '');
    if (trimmed) {
      if (/\/sitenextjs\/v1$/i.test(trimmed)) {
        push(trimmed);
        push(trimmed.replace(/\/sitenextjs\/v1$/i, '/admin/v1'));
      } else if (/\/admin\/v1$/i.test(trimmed)) {
        push(trimmed);
        push(trimmed.replace(/\/admin\/v1$/i, '/sitenextjs/v1'));
      } else {
        push(`${trimmed}/sitenextjs/v1`);
        push(`${trimmed}/admin/v1`);
      }
    }
  } catch {
    /* ignore */
  }
  if (!bases.length) {
    bases.push('http://localhost:1111/sitenextjs/v1', 'http://localhost:1111/admin/v1');
  }
  return bases;
}

/** Strip wrapping quotes / junk and ensure http(s) href. */
export function normalizeAuthorHref(raw: unknown): string {
  let url = String(raw || '').trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  if (!url || url === '#' || /^javascript:/i.test(url) || /^data:/i.test(url)) return '';
  if (/^mailto:/i.test(url) || /^tel:/i.test(url)) return url;
  if (url.startsWith('//')) url = `https:${url}`;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    url = `https://${url.replace(/^\/+/, '')}`;
  }
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
    if (u.protocol === 'mailto:' || u.protocol === 'tel:') return url;
  } catch {
    /* keep best-effort */
  }
  return /^https?:\/\//i.test(url) ? url : '';
}

function labelFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('facebook') || host === 'fb.me' || host === 'fb.com') return 'Facebook';
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube';
    if (host === 'x.com' || host.includes('twitter')) return 'X';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('github')) return 'GitHub';
    if (host.includes('whatsapp') || host === 'wa.me') return 'WhatsApp';
    if (host.includes('t.me') || host.includes('telegram')) return 'Telegram';
    return host || 'Link';
  } catch {
    return 'Link';
  }
}

/** Coerce any legacy / partial link payload into a full list. */
export function coerceAuthorLinks(input: unknown): BlogAuthorLink[] {
  let raw: any = input;
  if (raw == null || raw === '') return [];
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t || t === '[]' || t === 'null') return [];
    try {
      raw = JSON.parse(t);
    } catch {
      const href = normalizeAuthorHref(t);
      return href ? [{ label: labelFromUrl(href), url: href }] : [];
    }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (typeof (raw as any).length === 'number') {
      raw = Array.from(raw as any);
    } else {
      raw = Object.entries(raw)
        .filter(([k]) => !String(k).startsWith('$') && k !== '_id' && k !== '__v')
        .map(([label, url]) => ({ label, url }));
    }
  }
  if (!Array.isArray(raw)) return [];

  const out: BlogAuthorLink[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (item == null) continue;
    let label = '';
    let url = '';
    if (typeof item === 'string') {
      url = normalizeAuthorHref(item);
      label = labelFromUrl(url);
    } else if (typeof item === 'object') {
      label = String(
        (item as any).label ||
          (item as any).name ||
          (item as any).title ||
          (item as any).platform ||
          ''
      ).trim();
      url = normalizeAuthorHref(
        (item as any).url ||
          (item as any).href ||
          (item as any).link ||
          (item as any).value ||
          ''
      );
      if (!label && url) label = labelFromUrl(url);
    }
    if (!url) continue;
    if (!label) label = 'Link';
    const key = `${label.toLowerCase()}|${url.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, url });
  }
  return out;
}

export async function fetchBlogAuthor(options: {
  authorId?: string;
  blogId?: string;
  projectId?: string;
  slug?: string;
}): Promise<BlogAuthorPayload | null> {
  const body: Record<string, string> = {};
  if (options.authorId) body.authorId = String(options.authorId).trim();
  if (options.blogId) body.blogId = String(options.blogId).trim();
  if (options.projectId) body.projectId = String(options.projectId).trim();
  if (options.slug) body.slug = String(options.slug).trim();
  if (!body.authorId && !body.blogId && !(body.projectId && body.slug)) return null;

  let lastError: unknown = null;
  for (const base of resolveAuthorApiBases()) {
    try {
      const res = await fetch(`${base}/get_blog_author`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) continue;
      const json = await res.json().catch(() => ({}));
      const data = json?.data || null;
      if (data && (data.name || data.authorId || Array.isArray(data.links))) {
        return {
          ...data,
          links: coerceAuthorLinks(data.links),
        };
      }
    } catch (err) {
      lastError = err;
    }
  }
  console.warn('[fetchBlogAuthor] failed:', lastError);
  return null;
}

export function iconForAuthorLabel(label: string): string {
  const l = String(label || '').toLowerCase();
  if (l.includes('linkedin')) return 'fa-linkedin-in';
  if (l.includes('instagram')) return 'fa-instagram';
  if (l.includes('facebook')) return 'fa-facebook-f';
  if (l.includes('youtube') || l.includes('youtu')) return 'fa-youtube';
  if (l.includes('twitter') || l === 'x' || l.includes('x-twitter') || /(^|\s)x(\s|$)/.test(l)) {
    return 'fa-x-twitter';
  }
  if (l.includes('tiktok')) return 'fa-tiktok';
  if (l.includes('github')) return 'fa-github';
  if (l.includes('whatsapp')) return 'fa-whatsapp';
  if (l.includes('telegram')) return 'fa-telegram';
  if (l.includes('website') || l.includes('site') || l.includes('portfolio') || l.includes('blog')) {
    return 'fa-globe';
  }
  if (l.includes('mail') || l.includes('email')) return 'fa-envelope';
  return 'fa-link';
}

export function authorIconClassName(icon: string): string {
  const raw = String(icon || 'fa-link').trim();
  const name = raw.replace(/^(fab|fas|far)\s+/, '');
  const fa = name.startsWith('fa-') ? name : `fa-${name}`;
  const solid =
    fa === 'fa-link' ||
    fa === 'fa-globe' ||
    fa === 'fa-envelope' ||
    fa.includes('envelope') ||
    fa.includes('globe');
  return `${solid ? 'fas' : 'fab'} ${fa}`;
}
