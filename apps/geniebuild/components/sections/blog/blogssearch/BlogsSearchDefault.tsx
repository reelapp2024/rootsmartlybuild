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

const DEFAULT_CATEGORIES = ['All', 'Tips & Guides', 'Industry News', 'How-To', 'Community'];

/**
 * BlogsSearchDefault — search bar + category filter chips for the blog listing.
 * Light section following the homepage tc.light pattern. The heading is an
 * editable ElementsSection element; the search input + filter chips are
 * theme-styled visual controls (placeholder/labels come from content).
 */
export const BlogsSearchDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const cardBorder = fb.border     || lc.cardBorderColor || 'rgba(0,0,0,0.08)';
  const inputBg    = (lc as any).inputBg || '#F9FAFB';

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
  const padT = s.paddingTop    ?? 'pt-8 sm:pt-10';
  const padB = s.paddingBottom ?? 'pb-4 sm:pb-6';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-4xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const searchPlaceholder = String(c.searchPlaceholder || 'Search articles…');
  const categories: string[] = Array.isArray(c.categories) && c.categories.length
    ? c.categories.map((x: any) => String(x))
    : DEFAULT_CATEGORIES;

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-bs-title`) || {
    id: `${section.id}-bs-title`, type: 'text',
    content: { text: String(c.filterHelperText || 'Browse by topic or search for exactly what you need.'), textSize: 'base' },
    style: { textAlign: 'center' as any, maxWidth: '520px', margin: '0 auto', lineHeight: '1.6' },
  };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="flex flex-col items-center gap-5">

          {/* Search bar (visual) */}
          <div className="w-full max-w-xl relative">
            <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: accent }} aria-hidden="true" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              disabled={readOnly}
              style={{
                width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem',
                borderRadius: '9999px', backgroundColor: inputBg,
                border: `1px solid ${cardBorder}`, color: titleColor,
                fontSize: '0.95rem', outline: 'none',
              }}
            />
          </div>

          {/* Category filter chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat, i) => {
              const active = i === 0;
              return (
                <span key={i}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors"
                  style={active
                    ? { backgroundColor: accent, color: '#FFFFFF' }
                    : { backgroundColor: `${accent}12`, color: accent, border: `1px solid ${accent}22` }}
                >
                  {cat}
                </span>
              );
            })}
          </div>

          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
        </motion.div>
      </div>
    </div>
  );
};

export default BlogsSearchDefault;
