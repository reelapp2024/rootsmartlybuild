import { API_BASE_URL } from '../config';

export type PublishedBlogItem = {
  id?: string;
  blogId?: string;
  slug?: string;
  link?: string;
  title?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  date?: string;
  read?: string;
  readTime?: string;
  img?: string;
  image?: string;
  imageUrl?: string;
  authorName?: string;
};

export type PublishedBlogsResponse = {
  items: PublishedBlogItem[];
  emptyStateMessage: string;
  page: number;
  limit: number;
  total: number;
  pages: number;
};

function resolveBlogApiBases(): string[] {
  const bases: string[] = [];
  const push = (raw?: string | null) => {
    const v = String(raw || '').trim().replace(/\/+$/, '');
    if (v && !bases.includes(v)) bases.push(v);
  };

  push(API_BASE_URL);

  try {
    const nextAdmin =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITENEXTJS_API_URL
        : '';
    const trimmed = String(nextAdmin || '').trim().replace(/\/+$/, '');
    if (trimmed) {
      if (/\/sitenextjs\/v1$/i.test(trimmed)) {
        push(trimmed);
        push(trimmed.replace(/\/sitenextjs\/v1$/i, '/admin/v1'));
      } else if (/\/admin\/v1$/i.test(trimmed)) {
        push(trimmed);
        push(trimmed.replace(/\/admin\/v1$/i, '/sitenextjs/v1'));
      } else {
        push(`${trimmed}/admin/v1`);
        push(`${trimmed}/sitenextjs/v1`);
      }
    }
  } catch {
    /* ignore */
  }

  if (!bases.length) push('http://localhost:1111/admin/v1');
  return bases;
}

export async function fetchPublishedBlogs(options: {
  projectId: string;
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}): Promise<PublishedBlogsResponse> {
  const projectId = String(options.projectId || '').trim();
  if (!projectId) {
    return {
      items: [],
      emptyStateMessage: 'No blogs found',
      page: 1,
      limit: options.limit || 9,
      total: 0,
      pages: 1,
    };
  }

  const params = new URLSearchParams();
  params.set('projectId', projectId);
  params.set('page', String(Math.max(1, Number(options.page) || 1)));
  params.set('limit', String(Math.max(1, Number(options.limit) || 9)));
  if (options.search) params.set('search', String(options.search).trim());
  if (options.type && !/^all$/i.test(String(options.type))) {
    params.set('type', String(options.type).trim());
  }

  const query = params.toString();
  let lastError: unknown = null;

  for (const base of resolveBlogApiBases()) {
    try {
      const res = await fetch(`${base}/listPublishedBlogs?${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) continue;
      const body = await res.json().catch(() => ({}));
      const data = body?.data || body || {};
      const items = Array.isArray(data.items) ? data.items : [];
      return {
        items,
        emptyStateMessage: String(data.emptyStateMessage || 'No blogs found'),
        page: Number(data.page || options.page || 1),
        limit: Number(data.limit || options.limit || 9),
        total: Number(data.total || 0),
        pages: Math.max(1, Number(data.pages || 1)),
      };
    } catch (err) {
      lastError = err;
    }
  }

  console.warn('[fetchPublishedBlogs] failed:', lastError);
  return {
    items: [],
    emptyStateMessage: 'No blogs found',
    page: 1,
    limit: options.limit || 9,
    total: 0,
    pages: 1,
  };
}

export const BLOGS_FILTER_EVENT = 'smartlybuild:blogs-filter';

export type BlogsFilterDetail = {
  search?: string;
  type?: string;
};

export function emitBlogsFilter(detail: BlogsFilterDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(BLOGS_FILTER_EVENT, { detail }));
}
