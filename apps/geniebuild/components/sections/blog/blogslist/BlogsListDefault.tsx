import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}

const DEFAULT_POSTS = [
  { img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', category: 'Tips & Guides', title: '10 Signs You Need a Professional Right Away', excerpt: 'Spot the early warning signs before a small issue becomes an expensive emergency.', date: 'Jun 12, 2025', read: '5 min read' },
  { img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80', category: 'How-To', title: 'A Simple Maintenance Checklist for Every Season', excerpt: 'Keep everything running smoothly year-round with these easy, proven steps.', date: 'Jun 08, 2025', read: '7 min read' },
  { img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80', category: 'Industry News', title: 'What the Latest Standards Mean for Your Home', excerpt: 'New regulations are changing the game — here is what you should know today.', date: 'May 30, 2025', read: '4 min read' },
  { img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', category: 'Tips & Guides', title: 'How to Choose the Right Service Provider', excerpt: 'Not all providers are equal. Learn the questions that separate the best from the rest.', date: 'May 22, 2025', read: '6 min read' },
  { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', category: 'Community', title: 'Behind the Scenes: A Day With Our Team', excerpt: 'Meet the people who make it happen and see how we deliver on our promise.', date: 'May 15, 2025', read: '3 min read' },
  { img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80', category: 'How-To', title: 'Budgeting for Your Next Big Project', excerpt: 'Plan ahead and avoid surprises with this practical guide to pricing and value.', date: 'May 09, 2025', read: '8 min read' },
];

/**
 * BlogsListDefault — responsive blog post cards grid. Light section following the
 * homepage tc.light pattern. Header (badge + heading + desc) via ElementsSection;
 * each post card is an editable image-box element (image + title + excerpt).
 */
export const BlogsListDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

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

  const rawPosts = (content.items && content.items.length > 0)
    ? content.items.map((it: any, i: number) => ({
        img:      it.img || it.image || it.imageUrl || DEFAULT_POSTS[i % DEFAULT_POSTS.length].img,
        category: it.category || DEFAULT_POSTS[i % DEFAULT_POSTS.length].category,
        title:    it.title || DEFAULT_POSTS[i % DEFAULT_POSTS.length].title,
        excerpt:  it.excerpt || it.description || DEFAULT_POSTS[i % DEFAULT_POSTS.length].excerpt,
        date:     it.date || DEFAULT_POSTS[i % DEFAULT_POSTS.length].date,
        read:     it.read || it.readTime || DEFAULT_POSTS[i % DEFAULT_POSTS.length].read,
      }))
    : DEFAULT_POSTS;

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

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {rawPosts.map((p: any, i: number) => (
            <motion.article key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="group rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 10px 30px -18px ${accent}30` }}
            >
              {/* Image + category badge */}
              <div className="relative h-48 overflow-hidden">
                <img src={p.img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: accent, color: '#FFFFFF' }}>
                  {p.category}
                </span>
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col p-5 gap-3">
                {/* Meta */}
                <div className="flex items-center gap-3 text-xs" style={{ color: textColor }}>
                  <span className="inline-flex items-center gap-1"><i className="fas fa-calendar-day opacity-60" aria-hidden="true" />{p.date}</span>
                  <span className="inline-flex items-center gap-1"><i className="fas fa-clock opacity-60" aria-hidden="true" />{p.read}</span>
                </div>

                <ElementsSection section={{ ...section, elements: [getCardTitleEl(i, p.title)] }} {...passThrough} />
                <ElementsSection section={{ ...section, elements: [getCardExcerptEl(i, p.excerpt)] }} {...passThrough} />

                <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold pt-1" style={{ color: accent }}>
                  Read Article
                  <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogsListDefault;
