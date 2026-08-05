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

export type PublishedBlogComment = {
  name?: string;
  avatar?: string;
  date?: string;
  text?: string;
  rating?: number;
};

/** GenieBuild-shaped live article payload from getPublishedBlog / get_blog_by_slug */
export type PublishedBlogDetail = {
  blogId?: string;
  slug?: string;
  link?: string;
  currentSlug?: string;
  title?: string;
  information?: string;
  type?: string;
  category?: string;
  coverImage?: { url?: string; alt?: string };
  hero?: Record<string, any>;
  content?: Record<string, any>;
  author?: Record<string, any>;
  related?: { items?: PublishedBlogItem[]; badgeText?: string; relatedTitle?: string; title?: string };
  faq?: {
    title?: string;
    subtitle?: string;
    items?: Array<{
      title?: string;
      question?: string;
      description?: string;
      answer?: string;
    }>;
  };
  comments?: {
    commentSectionTitle?: string;
    commentSectionSubtitle?: string;
    ctaText?: string;
    blogId?: string;
    comments?: PublishedBlogComment[];
    contentRef?: { source?: string; blogId?: string };
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
};

export type PublishedBlogsResponse = {
  items: PublishedBlogItem[];
  emptyStateMessage: string;
  categories?: string[];
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
      categories: ['All'],
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
        categories: Array.isArray(data.categories) ? data.categories.map(String) : undefined,
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

/**
 * Live single published blog — GenieBuild section-shaped payload
 * (hero / content / author / related / comments).
 */
export async function fetchPublishedBlogBySlug(options: {
  projectId: string;
  slug?: string;
  blogId?: string;
}): Promise<PublishedBlogDetail | null> {
  const projectId = String(options.projectId || '').trim();
  const slug = String(options.slug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^blog\//i, '');
  const blogId = String(options.blogId || '').trim();
  if (!projectId || (!slug && !blogId)) return null;

  const params = new URLSearchParams();
  params.set('projectId', projectId);
  if (slug) params.set('slug', slug);
  if (blogId) params.set('blogId', blogId);
  const query = params.toString();

  const paths = ['getPublishedBlog', 'get_blog_by_slug'];
  let lastError: unknown = null;

  for (const base of resolveBlogApiBases()) {
    for (const path of paths) {
      try {
        const res = await fetch(`${base}/${path}?${query}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) continue;
        const body = await res.json().catch(() => ({}));
        const data = body?.data || body || null;
        if (data && (data.hero || data.content || data.slug || data.blogId)) {
          return data as PublishedBlogDetail;
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  console.warn('[fetchPublishedBlogBySlug] failed:', lastError);
  return null;
}

export async function fetchRelatedPublishedBlogs(options: {
  projectId: string;
  slug?: string;
  blogId?: string;
  limit?: number;
}): Promise<PublishedBlogItem[]> {
  const projectId = String(options.projectId || '').trim();
  if (!projectId) return [];

  const slug = String(options.slug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^blog\//i, '');
  const blogId = String(options.blogId || '').trim();
  const limit = Math.max(1, Number(options.limit) || 3);

  const body = {
    projectId,
    ...(slug ? { slug, excludeSlug: slug } : {}),
    ...(blogId ? { blogId } : {}),
    limit,
  };

  let lastError: unknown = null;
  for (const base of resolveBlogApiBases()) {
    try {
      const res = await fetch(`${base}/related_blogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) continue;
      const json = await res.json().catch(() => ({}));
      const items = Array.isArray(json?.data?.items)
        ? json.data.items
        : Array.isArray(json?.items)
          ? json.items
          : [];
      return items;
    } catch (err) {
      lastError = err;
    }
  }

  // Fallback: use list endpoint and drop current slug
  try {
    const list = await fetchPublishedBlogs({ projectId, page: 1, limit: limit + 2 });
    return (list.items || [])
      .filter((it) => {
        const s = String(it.slug || '').toLowerCase();
        return !slug || s !== slug.toLowerCase();
      })
      .slice(0, limit);
  } catch (err) {
    lastError = err;
  }

  console.warn('[fetchRelatedPublishedBlogs] failed:', lastError);
  return [];
}

export const BLOGS_FILTER_EVENT = 'smartlybuild:blogs-filter';
export const BLOGS_CATEGORIES_EVENT = 'smartlybuild:blogs-categories';

export type BlogsFilterDetail = {
  search?: string;
  type?: string;
};

export function emitBlogsFilter(detail: BlogsFilterDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(BLOGS_FILTER_EVENT, { detail }));
}

export function emitBlogsCategories(categories: string[]) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(BLOGS_CATEGORIES_EVENT, { detail: { categories } })
  );
}
