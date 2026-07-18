import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { getProjectIdFromUrl } from '../../../../lib/aboutUsApi';
import {
  BLOGS_FILTER_EVENT,
  fetchPublishedBlogs,
  type BlogsFilterDetail,
  type PublishedBlogItem,
} from '../../../../lib/blogsApi';
import { toAbsoluteMediaUrl } from '../../../../config';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  projectId?: string;
}

const DEFAULT_POSTS: PublishedBlogItem[] = [
  { img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', category: 'Tips & Guides', title: '10 Signs You Need a Professional Right Away', excerpt: 'Spot the early warning signs before a small issue becomes an expensive emergency.', date: 'Jun 12, 2025', read: '5 min read', link: '#' },
  { img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80', category: 'How-To', title: 'A Simple Maintenance Checklist for Every Season', excerpt: 'Keep everything running smoothly year-round with these easy, proven steps.', date: 'Jun 08, 2025', read: '7 min read', link: '#' },
  { img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80', category: 'Industry News', title: 'What the Latest Standards Mean for Your Home', excerpt: 'New regulations are changing the game — here is what you should know today.', date: 'May 30, 2025', read: '4 min read', link: '#' },
  { img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', category: 'Tips & Guides', title: 'How to Choose the Right Service Provider', excerpt: 'Not all providers are equal. Learn the questions that separate the best from the rest.', date: 'May 22, 2025', read: '6 min read', link: '#' },
  { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', category: 'Community', title: 'Behind the Scenes: A Day With Our Team', excerpt: 'Meet the people who make it happen and see how we deliver on our promise.', date: 'May 15, 2025', read: '3 min read', link: '#' },
  { img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80', category: 'How-To', title: 'Budgeting for Your Next Big Project', excerpt: 'Plan ahead and avoid surprises with this practical guide to pricing and value.', date: 'May 09, 2025', read: '8 min read', link: '#' },
];

const PAGE_SIZE = 9;

function normalizePost(it: any, i: number): PublishedBlogItem {
  const fallback = DEFAULT_POSTS[i % DEFAULT_POSTS.length];
  const imgRaw = it?.img || it?.image || it?.imageUrl || it?.coverImage?.url || it?.coverImage || '';
  const slug = String(it?.slug || '').trim();
  return {
    id: it?.id || it?.blogId || slug || String(i),
    blogId: it?.blogId || it?.id,
    slug,
    link: it?.link || (slug ? `/blog/${slug}` : '#'),
    title: it?.title || fallback.title,
    excerpt: it?.excerpt || it?.description || fallback.excerpt,
    category: it?.category || it?.type || fallback.category,
    date: it?.date || fallback.date,
    read: it?.read || it?.readTime || fallback.read,
    img: toAbsoluteMediaUrl(String(imgRaw || fallback.img || '')),
    authorName: it?.authorName || '',
  };
}

/**
 * BlogsListDefault — live Blog collection when projectId is present; dummy cards
 * only in standalone builder demo. Empty API → "No blogs found" + pagination.
 */
export const BlogsListDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc, projectId: projectIdProp,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const projectId = String(projectIdProp || getProjectIdFromUrl() || '').trim();
  const useLiveApi = Boolean(projectId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(useLiveApi);
  const [items, setItems] = useState<PublishedBlogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [emptyMessage, setEmptyMessage] = useState('No blogs found');

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const cardBg     = fb.background || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border     || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';

  const savedBg = s.backgroundColor;
  const isThemeSurface = (() => {
    if (!savedBg || typeof savedBg !== 'string') return true;
    const norm = savedBg.trim().toLowerCase();
    return PRESET_THEMES.some(t => {
      const dark  = (t.elements?.surface || '').toLowerCase();
      const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
      return norm === dark || norm === light;
    });
  })();
  const bg = isThemeSurface ? '#FFFFFF' : savedBg;

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-6 sm:pt-8';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16 lg:pb-20';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const contentItems = useMemo(() => {
    if (!Array.isArray(content?.items) || !content.items.length) return [];
    return content.items.map((it: any, i: number) => normalizePost(it, i));
  }, [content?.items]);

  const loadBlogs = useCallback(async () => {
    if (!useLiveApi) {
      setItems(contentItems.length ? contentItems : DEFAULT_POSTS);
      setTotal(contentItems.length || DEFAULT_POSTS.length);
      setPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetchPublishedBlogs({
        projectId,
        page,
        limit: PAGE_SIZE,
        search,
        type,
      });
      setItems((res.items || []).map((it, i) => normalizePost(it, i)));
      setTotal(Number(res.total || 0));
      setPages(Math.max(1, Number(res.pages || 1)));
      setEmptyMessage(res.emptyStateMessage || 'No blogs found');
    } finally {
      setLoading(false);
    }
  }, [useLiveApi, projectId, page, search, type, contentItems]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  useEffect(() => {
    const onFilter = (event: Event) => {
      const detail = (event as CustomEvent<BlogsFilterDetail>).detail || {};
      setPage(1);
      setSearch(String(detail.search || '').trim());
      setType(String(detail.type || '').trim());
    };
    window.addEventListener(BLOGS_FILTER_EVENT, onFilter as EventListener);
    return () => window.removeEventListener(BLOGS_FILTER_EVENT, onFilter as EventListener);
  }, []);

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const getCardTitleEl = (i: number, title: string): WebsiteElement => {
    const id = `${section.id}-bl-title${i}`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: title, htmlTag: 'h3' },
      style: { fontWeight: '700', fontSize: '1.125rem', lineHeight: '1.3', textAlign: 'left' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || title } };
  };
  const getCardExcerptEl = (i: number, excerpt: string): WebsiteElement => {
    const id = `${section.id}-bl-desc${i}`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = existing || {
      id, type: 'text',
      content: { text: excerpt, textSize: 'base' },
      style: { lineHeight: '1.6', textAlign: 'left' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || excerpt } };
  };

  const goToPage = (next: number) => {
    const clamped = Math.min(pages, Math.max(1, next));
    if (clamped === page) return;
    setPage(clamped);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pageButtons = useMemo(() => {
    if (pages <= 1) return [] as number[];
    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    let end = Math.min(pages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const list: number[] = [];
    for (let n = start; n <= end; n += 1) list.push(n);
    return list;
  }, [page, pages]);

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="rounded-2xl overflow-hidden animate-pulse"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, minHeight: 320 }}
              >
                <div className="h-48 bg-gray-200/70" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/3 rounded bg-gray-200/80" />
                  <div className="h-5 w-5/6 rounded bg-gray-200/80" />
                  <div className="h-4 w-full rounded bg-gray-200/70" />
                  <div className="h-4 w-2/3 rounded bg-gray-200/70" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-16 text-center"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              <i className="fas fa-newspaper text-xl" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: titleColor }}>
              {emptyMessage || 'No blogs found'}
            </h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: textColor }}>
              {search || type
                ? 'Try a different search or category.'
                : 'Published articles will appear here once they are available.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {items.map((p: PublishedBlogItem, i: number) => {
                const href = String(p.link || '#').trim() || '#';
                const CardTag: any = readOnly && href !== '#' ? 'a' : 'div';
                const cardProps =
                  CardTag === 'a'
                    ? { href, className: 'block no-underline' }
                    : {};
                return (
                  <CardTag key={String(p.id || p.slug || i)} {...cardProps}>
                    <motion.article
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                      className="group rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 h-full"
                      style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 10px 30px -18px ${accent}30` }}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={p.img || DEFAULT_POSTS[0].img}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {p.category ? (
                          <span
                            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: accent, color: '#FFFFFF' }}
                          >
                            {p.category}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex-1 flex flex-col p-5 gap-3">
                        <div className="flex items-center gap-3 text-xs" style={{ color: textColor }}>
                          {p.date ? (
                            <span className="inline-flex items-center gap-1">
                              <i className="fas fa-calendar-day opacity-60" aria-hidden="true" />
                              {p.date}
                            </span>
                          ) : null}
                          {p.read ? (
                            <span className="inline-flex items-center gap-1">
                              <i className="fas fa-clock opacity-60" aria-hidden="true" />
                              {p.read}
                            </span>
                          ) : null}
                        </div>

                        <ElementsSection section={{ ...section, elements: [getCardTitleEl(i, String(p.title || ''))] }} {...passThrough} />
                        <ElementsSection section={{ ...section, elements: [getCardExcerptEl(i, String(p.excerpt || ''))] }} {...passThrough} />

                        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold pt-1" style={{ color: accent }}>
                          Read Article
                          <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      </div>
                    </motion.article>
                  </CardTag>
                );
              })}
            </div>

            {useLiveApi && pages > 1 ? (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                  style={{ border: `1px solid ${cardBorder}`, color: titleColor, backgroundColor: cardBg }}
                >
                  Previous
                </button>
                {pageButtons.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => goToPage(n)}
                    className="min-w-10 px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{
                      border: `1px solid ${n === page ? accent : cardBorder}`,
                      color: n === page ? '#FFFFFF' : titleColor,
                      backgroundColor: n === page ? accent : cardBg,
                    }}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= pages}
                  className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                  style={{ border: `1px solid ${cardBorder}`, color: titleColor, backgroundColor: cardBg }}
                >
                  Next
                </button>
                <span className="w-full text-center text-xs mt-2" style={{ color: textColor }}>
                  Page {page} of {pages} · {total} article{total === 1 ? '' : 's'}
                </span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogsListDefault;
