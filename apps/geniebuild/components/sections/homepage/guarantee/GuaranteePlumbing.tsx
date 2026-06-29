import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
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

const DEFAULT_POINTS = [
  { icon: 'fa-rotate-left',     title: 'Free callback if any issue returns within 10 years' },
  { icon: 'fa-money-bill-wave', title: "Full refund if you're not 100% satisfied — no questions asked" },
  { icon: 'fa-calendar-check',  title: 'On-time arrival guarantee or we discount your bill' },
  { icon: 'fa-star',            title: 'Premium materials and parts with manufacturer warranty' },
];

/**
 * GuaranteePlumbing — light variant.
 *
 * Layout: centered header (badge + heading + description) → callout card with
 * a left-side stat (the "10 Years" number) + right-side list of guarantees →
 * centered CTA button.
 *
 * Elements used (all standard, sidebar-editable):
 *   • badge      – "Our Promise" pill at top
 *   • heading    – section title with highlighted last word
 *   • text       – section subtitle
 *   • stat-card  – the big "10 / YEAR GUARANTEE" number on the left of the card
 *   • list       – all four guarantee points in a single editable element
 *                  (replaces the previous 4 feature-boxes)
 *   • button     – the CTA at the bottom
 */
export const GuaranteePlumbing: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const apiBadgeText = String((content as any).badgeText || 'Our Promise');
  const apiTitleText = String((content as any).title || 'Our 100% Satisfaction Guarantee');
  const apiDescriptionText = String(
    (content as any).subtitle ||
    (content as any).description ||
    "We stand behind every job we do. If anything goes wrong, we'll make it right — guaranteed."
  );
  const apiStatValue = String((content as any).statValue || (content as any)?.statCard?.value || '10');
  const apiStatLabel = String((content as any).statLabel || (content as any)?.statCard?.label || 'Year Guarantee');
  const apiStatIcon = String((content as any).statIcon || (content as any)?.statCard?.icon || 'fa-shield-halved');
  const apiCtaText = String((content as any).ctaText || 'Book With Confidence');
  const apiCtaHref = String((content as any).ctaHref || '#');

  // Light-palette tokens
  const lc = tc?.light || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = lc.titleColor || '#111827';
  const textColor  = lc.textColor  || '#4B5563';
  const cardBg     = lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = lc.cardBorderColor || 'rgba(0,0,0,0.08)';
  const btnBg      = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText    = (lc.buttonTextColor as string)       || tc?.buttonTextColor       || '#FFFFFF';

  // Section bg locks to white when no user override (matches Process / Services2 pattern)
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

  // Padding
  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-5xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  // Theme bag forwarded to ElementsSection — light-aware so badges + lists
  // pick up the correct colors on white background.
  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    cardBackgroundColor: cardBg,
    cardBorderColor: cardBorder,
    buttonBackgroundColor: btnBg,
    buttonTextColor: btnText,
    secondaryHeadingColor: accent,
  };

  // Badge — accent-tinted pill
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-gp-badge`) || {
    id: `${section.id}-gp-badge`, type: 'badge',
    content: { text: content.badgeText || 'Our Promise', icon: 'fa-shield-halved', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
      backgroundColor: `${accent}1A`,
      color: accent,
    },
  };
  const badgeElResolved: WebsiteElement = {
    ...badgeEl,
    content: { ...(badgeEl.content || {}), text: apiBadgeText },
  };

  // Heading — last word highlighted
  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-gp-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const sourceText: string = apiTitleText.toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) {
      highlightedText = words[words.length - 1];
      textBefore = words.slice(0, -1).join(' ');
    }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { textAlign: 'center' as any, fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  // Description
  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-gp-desc`) || {
    id: `${section.id}-gp-desc`, type: 'text',
    content: { text: apiDescriptionText, textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '560px', margin: '0 auto', lineHeight: '1.65' },
  };
  const descElResolved: WebsiteElement = {
    ...descEl,
    content: { ...(descEl.content || {}), text: apiDescriptionText },
  };

  // Stat card — the big "10 / YEAR GUARANTEE" callout on the left
  const statEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-gp-stat`) || {
    id: `${section.id}-gp-stat`, type: 'stat-card',
    content: {
      value: apiStatValue,
      text: apiStatLabel,
      icon: apiStatIcon,
    } as any,
    style: {
      padding: '1.5rem',
      borderRadius: '1rem',
      backgroundColor: `${accent}10`,
      borderColor: `${accent}30`,
      borderWidth: '1px',
      borderStyle: 'solid',
      titleColor: accent,
      titleFontSize: 'clamp(3rem, 7vw, 5rem)',
      titleFontWeight: '900',
      descriptionColor: titleColor,
      descriptionFontSize: '0.85rem',
      descriptionFontWeight: '700',
      textAlign: 'center' as any,
      iconColor: accent,
      iconSize: '1.5rem',
    } as any,
  };
  const statElResolved: WebsiteElement = {
    ...statEl,
    content: {
      ...(statEl.content || {}),
      value: apiStatValue,
      text: apiStatLabel,
      icon: apiStatIcon,
    },
  };

  // List — all guarantee points in ONE editable element (not 4 feature-boxes).
  // Uses the `list` element type with custom check icons.
  const listItemsResolved = (
    Array.isArray((content as any).guaranteeList) && (content as any).guaranteeList.length > 0
      ? (content as any).guaranteeList.map((it: any, i: number) => ({
          title: it?.line || it?.title || DEFAULT_POINTS[i % DEFAULT_POINTS.length].title,
        }))
      : (Array.isArray((content as any).items) && (content as any).items.length > 0)
        ? (content as any).items.map((it: any, i: number) => ({
            title: it?.title || it?.line || it?.description || DEFAULT_POINTS[i % DEFAULT_POINTS.length].title,
          }))
        : DEFAULT_POINTS.map(p => ({ title: p.title }))
  );
  const listEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-gp-list`) || {
    id: `${section.id}-gp-list`, type: 'list',
    content: { items: listItemsResolved } as any,
    style: {
      listType: 'check',
      itemGap: '0.875rem',
      indent: '0px',
      color: textColor,
      markerColor: accent,
      iconColor: accent,
      fontSize: '0.95rem',
      fontWeight: '500',
    } as any,
  };
  const listElResolved: WebsiteElement = {
    ...listEl,
    content: { ...(listEl.content || {}), items: listItemsResolved },
  };

  // CTA button
  const btnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-gp-btn`) || {
    id: `${section.id}-gp-btn`, type: 'button',
    content: { text: apiCtaText, link: apiCtaHref },
    style: {
      backgroundColor: btnBg, color: btnText,
      padding: '0.875rem 2rem', borderRadius: '0.5rem',
      fontWeight: '700', fontSize: '0.95rem',
    } as any,
  };
  const btnElResolved: WebsiteElement = {
    ...btnEl,
    content: {
      ...(btnEl.content || {}),
      text: apiCtaText,
      link: apiCtaHref,
    },
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      {/* Subtle accent halo behind the callout card — keeps the white feeling premium */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 60%, ${accent}10 0%, transparent 60%)` }} />

      <div className={`${innerClass} relative z-10`} style={innerStyle}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeElResolved] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-10 sm:mb-12"
        >
          <ElementsSection section={{ ...section, elements: [descElResolved] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Callout card — stat (left) + list (right) */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-[minmax(220px,280px)_1fr] gap-6 lg:gap-10 items-center"
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: `0 12px 32px -16px ${accent}20`,
          }}
        >
          {/* Left — stat-card */}
          <div className="flex justify-center">
            <div className="w-full max-w-[260px]">
              <ElementsSection section={{ ...section, elements: [statElResolved] }} onTextEdit={onTextEdit}
                onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                buttonClass={buttonClass} themeColors={themeColors} />
            </div>
          </div>

          {/* Right — list */}
          <div>
            <ElementsSection section={{ ...section, elements: [listElResolved] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center mt-8 sm:mt-10"
        >
          <div style={{ width: 'max-content' }}>
            <ElementsSection section={{ ...section, elements: [btnElResolved] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
