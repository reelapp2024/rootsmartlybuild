import React, { useEffect, useMemo, useState } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { toAbsoluteMediaUrl, extractMediaUrl } from '../../../../config';
import {
  fetchRelatedPublishedBlogs,
  type PublishedBlogItem,
} from '../../../../lib/blogsApi';
import { getProjectIdFromUrl } from '../../../../lib/aboutUsApi';

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
  sitePathname?: string;
}

type RelatedCard = {
  img: string;
  category: string;
  title: string;
  excerpt: string;
  link: string;
};

const BUILDER_PLACEHOLDER_POSTS: RelatedCard[] = [
  { img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', category: 'Tips & Guides', title: '10 Signs You Need a Professional Right Away', excerpt: 'Spot the early warning signs before a small issue becomes an expensive emergency.', link: '#' },
  { img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80', category: 'How-To', title: 'A Simple Maintenance Checklist for Every Season', excerpt: 'Keep everything running smoothly year-round with these easy, proven steps.', link: '#' },
  { img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80', category: 'Industry News', title: 'What the Latest Standards Mean for Your Home', excerpt: 'New regulations are changing the game — here is what you should know today.', link: '#' },
];

function normalizeRelatedItem(it: any): RelatedCard {
  const slug = String(it?.slug || '').trim();
  const imgRaw =
    extractMediaUrl(it?.img) ||
    extractMediaUrl(it?.image) ||
    extractMediaUrl(it?.imageUrl) ||
    extractMediaUrl(it?.coverImage) ||
    '';
  return {
    img: toAbsoluteMediaUrl(imgRaw),
    category: String(it?.category || it?.type || 'Article').trim() || 'Article',
    title: String(it?.title || '').trim(),
    excerpt: String(it?.excerpt || it?.description || it?.information || '').trim(),
    link: String(it?.link || (slug ? `/blog/${slug}` : '') || '#').trim() || '#',
  };
}

function extractSlugFromPath(pathname?: string): string {
  const normalized = String(pathname || (typeof window !== 'undefined' ? window.location.pathname : '') || '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');
  const match = normalized.match(/(?:^|\/)blog\/([^/]+)$/i);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * BlogRelatedDefault — "related articles" from Blog DB on live site.
 * Never shows dummy Unsplash cards when readOnly / projectId is present.
 */
export const BlogRelatedDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc, projectId: projectIdProp,
  sitePathname,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

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
  const bg = isThemeSurface ? '#F8FAFC' : savedBg;

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-14 sm:pt-16 lg:pt-20';
  const padB = s.paddingBottom ?? 'pb-14 sm:pb-16 lg:pb-20';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const seededItems = useMemo(() => {
    if (!Array.isArray(content?.items) || !content.items.length) return [] as RelatedCard[];
    return content.items.map(normalizeRelatedItem).filter((p) => p.title);
  }, [content?.items]);

  const projectId = String(projectIdProp || getProjectIdFromUrl() || '').trim();
  const useLiveRelated = Boolean(readOnly && projectId);
  const [liveItems, setLiveItems] = useState<RelatedCard[] | null>(null);
  const [loading, setLoading] = useState(useLiveRelated && seededItems.length === 0);

  useEffect(() => {
    if (!useLiveRelated) {
      setLiveItems(null);
      setLoading(false);
      return;
    }
    // Prefer items already injected from getPublishedBlog
    if (seededItems.length > 0) {
      setLiveItems(seededItems);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const slug = extractSlugFromPath(sitePathname);
    const blogId = String(c.blogId || c.contentRef?.blogId || '').trim();

    fetchRelatedPublishedBlogs({ projectId, slug, blogId, limit: 3 })
      .then((items: PublishedBlogItem[]) => {
        if (cancelled) return;
        setLiveItems((items || []).map(normalizeRelatedItem).filter((p) => p.title));
      })
      .catch(() => {
        if (!cancelled) setLiveItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [useLiveRelated, projectId, seededItems, sitePathname, c.blogId, c.contentRef?.blogId]);

  const rawPosts: RelatedCard[] = useLiveRelated
    ? (liveItems || seededItems)
    : seededItems.length
      ? seededItems
      : BUILDER_PLACEHOLDER_POSTS;

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-rb-badge`) || {
    id: `${section.id}-rb-badge`, type: 'badge',
    content: { text: content.badgeText || 'Keep Reading', icon: 'fa-book-open', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-rb-title`;
    const existing = section.elements?.find(e => e.id === id);
    const sourceText = String(c.relatedTitle || content.title || 'Related Articles').replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          htmlTag: (existing.content as any)?.htmlTag || 'h2',
        },
        style: { ...(base.style as any), ...(existing.style as any) },
      } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const getCardTitleEl = (i: number, title: string): WebsiteElement => {
    const id = `${section.id}-rb-title${i}`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: title, htmlTag: 'h3' },
      style: { fontWeight: '700', fontSize: '1.0625rem', lineHeight: '1.3', textAlign: 'left' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || title } };
  };
  const getCardExcerptEl = (i: number, excerpt: string): WebsiteElement => {
    const id = `${section.id}-rb-desc${i}`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = existing || {
      id, type: 'text',
      content: { text: excerpt, textSize: 'base' },
      style: { lineHeight: '1.6', textAlign: 'left' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || excerpt } };
  };

  // Live with zero related posts — hide the whole section (no dummy cards).
  if (useLiveRelated && !loading && rawPosts.length === 0) {
    return null;
  }

  return (
    <div className="w-full text-center" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`sk-${i}`} className="rounded-2xl overflow-hidden animate-pulse h-72" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-left">
            {rawPosts.map((p, i) => {
              const href = String(p.link || '#').trim() || '#';
              const CardTag: any = readOnly && href !== '#' ? 'a' : 'div';
              const cardProps =
                CardTag === 'a'
                  ? { href, className: 'block no-underline h-full' }
                  : {};
              return (
                <CardTag key={`${p.link}-${i}`} {...cardProps}>
                  <motion.article
                    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                    className="group rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 h-full"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 10px 30px -18px ${accent}30` }}
                  >
                    <div className="relative h-44 overflow-hidden" style={{ backgroundColor: `${accent}12` }}>
                      {p.img ? (
                        <img src={p.img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : null}
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: accent, color: '#FFFFFF' }}>{p.category}</span>
                    </div>
                    <div className="flex-1 flex flex-col p-5 gap-2">
                      <ElementsSection section={{ ...section, elements: [getCardTitleEl(i, p.title)] }} {...passThrough} />
                      {p.excerpt ? (
                        <ElementsSection section={{ ...section, elements: [getCardExcerptEl(i, p.excerpt)] }} {...passThrough} />
                      ) : null}
                      <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold pt-1" style={{ color: accent }}>
                        Read Article <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </div>
                  </motion.article>
                </CardTag>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogRelatedDefault;
