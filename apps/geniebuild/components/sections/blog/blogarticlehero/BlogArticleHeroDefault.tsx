import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { motion } from 'motion/react';
import { toAbsoluteMediaUrl, extractMediaUrl } from '../../../../config';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: Partial<WebsiteElement>) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}

const BUILDER_COVER_FALLBACK =
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80';

/**
 * BlogArticleHeroDefault — blog post header + breadcrumb. Dark hero with category
 * badge, H1, author/date meta, and cover image.
 */
export const BlogArticleHeroDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor  = tc?.textColor  || '#E5E7EB';
  const accent     = tc?.iconColor || tc?.accentColor || '#E11D48';
  const bg = s.backgroundColor || tc?.backgroundColor || '#0C1015';

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-24 sm:pt-28 lg:pt-32';
  const padB = s.paddingBottom ?? 'pb-0';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const coverRaw =
    extractMediaUrl(c.coverImage) ||
    extractMediaUrl(c.imageUrl) ||
    extractMediaUrl(c.cover) ||
    extractMediaUrl(c.heroImage) ||
    '';

  // Live site: only real URLs (API already falls back to first body <img>).
  // Builder (not readOnly): keep Unsplash placeholder so the layout stays visible.
  const coverUrl =
    toAbsoluteMediaUrl(coverRaw) ||
    (!readOnly ? BUILDER_COVER_FALLBACK : '');

  const hasLiveTitle = Boolean(String(c.title || '').trim());
  const apiCategory = String(c.category || c.badgeText || (hasLiveTitle || readOnly ? 'Article' : 'Tips & Guides'));
  const apiTitle    = String(c.title || (hasLiveTitle || readOnly ? '' : 'How to Choose the Right Service Provider'));
  const apiAuthor   = String(c.authorName || c.author || (hasLiveTitle || readOnly ? '' : 'Jane Doe'));
  const apiDate     = String(c.date || (hasLiveTitle || readOnly ? '' : 'June 12, 2025'));
  const apiRead     = String(c.readTime || c.read || (hasLiveTitle || readOnly ? '' : '6 min read'));
  const coverAlt    = String(
    (c.coverImage && typeof c.coverImage === 'object' ? (c.coverImage as any).alt : '') ||
      apiTitle ||
      'Cover'
  );

  const themeColors = {
    ...tc, titleColor, textColor,
    accentColor: accent, iconColor: accent, secondaryHeadingColor: accent,
  };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-ah-badge`) || {
    id: `${section.id}-ah-badge`, type: 'badge',
    content: { text: apiCategory, icon: 'fa-tag', iconPosition: 'left', iconSize: '0.7rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '8px 16px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  };
  const badgeElResolved: WebsiteElement = { ...badgeEl, content: { ...(badgeEl.content || {}), text: apiCategory } };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-ah-title`;
    const existing = section.elements?.find(e => e.id === id);
    const sourceText = apiTitle.toString().replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, htmlTag: 'h1' },
      style: { fontWeight: '900', fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', lineHeight: '1.15', letterSpacing: '-0.02em', textAlign: 'center' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || sourceText } };
  })();

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full blur-[130px]"
          style={{ backgroundColor: `${accent}14` }} />
      </div>

      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center gap-4">

          <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
            <span>Home</span>
            <i className="fas fa-chevron-right text-[0.6rem] opacity-60" aria-hidden="true" />
            <span>Blog</span>
            <i className="fas fa-chevron-right text-[0.6rem] opacity-60" aria-hidden="true" />
            <span style={{ color: accent, fontWeight: 600 }} className="truncate max-w-[200px]">{apiTitle}</span>
          </div>

          <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...passThrough} />
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />

          <div className="flex items-center justify-center gap-4 text-sm flex-wrap" style={{ color: textColor }}>
            <span className="inline-flex items-center gap-2"><i className="fas fa-user-circle" style={{ color: accent }} aria-hidden="true" />{apiAuthor}</span>
            <span className="inline-flex items-center gap-2"><i className="fas fa-calendar-day opacity-70" aria-hidden="true" />{apiDate}</span>
            <span className="inline-flex items-center gap-2"><i className="fas fa-clock opacity-70" aria-hidden="true" />{apiRead}</span>
          </div>
        </motion.div>

        {/* Cover image — always keep the element when a real URL resolves */}
        {coverUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative mt-8 sm:mt-10 max-w-4xl mx-auto"
            style={{ marginBottom: '-3rem' }}
          >
            <img
              src={coverUrl}
              alt={coverAlt}
              className="w-full rounded-2xl object-cover shadow-2xl"
              style={{ aspectRatio: '16/8', border: `1px solid ${accent}22` }}
            />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default BlogArticleHeroDefault;
