import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { preferSavedElement, resolveEditableHeadingElement } from '../utils/headingHighlight';

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

/**
 * GuaranteeEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * A single wide accent panel (theme accent tint) split into two: a bold stat
 * "seal" on the left (the guarantee number) and, on the right, the promise
 * heading, intro, a ticked list of guarantees and a CTA. Industry-neutral,
 * light section.
 *
 * Fully dynamic keys: badgeText, title, subtitle/description, statValue/
 * statLabel/statCard{value,label,icon}, guaranteeList[]{line}|items[], ctaText/
 * ctaHref. No images. Element ids reuse the `gp-` prefix (`gp-badge/title/desc/
 * stat/list/btn`) so content carries over on variant switch.
 */
const DEFAULT_POINTS = [
  { title: 'Free return visit if any issue comes back within the guarantee period' },
  { title: "Full refund if you're not 100% satisfied, no questions asked" },
  { title: 'On-time arrival or we take money off your bill' },
  { title: 'Quality materials and parts, with the manufacturer warranty' },
];

export const GuaranteeEditorial: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const apiBadgeText = String((content as any).badgeText || 'Our promise');
  const apiTitleText = String((content as any).title || 'Our 100% satisfaction guarantee');
  const apiDescriptionText = String((content as any).subtitle || (content as any).description || "We stand behind every job. If anything isn't right, we'll make it right.");
  const apiStatValue = String((content as any).statValue || (content as any)?.statCard?.value || (!readOnly ? '100%' : '')).trim();
  const apiStatLabel = String((content as any).statLabel || (content as any)?.statCard?.label || (!readOnly ? 'Satisfaction' : '')).trim();
  const apiStatIcon = String((content as any).statIcon || (content as any)?.statCard?.icon || 'fa-shield-halved');
  const apiCtaText = String((content as any).ctaText || 'Book with confidence');
  const apiCtaHref = String((content as any).ctaHref || '#');

  const lc = tc?.light || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = lc.titleColor || '#111827';
  const textColor  = lc.textColor  || '#4B5563';
  const cardBg     = lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = lc.cardBorderColor || 'rgba(0,0,0,0.08)';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';
  const btnBg      = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText    = (lc.buttonTextColor as string) || tc?.buttonTextColor || '#FFFFFF';

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
  const padT = s.paddingTop    ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1120px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent,
    cardBackgroundColor: cardBg, cardBorderColor: cardBorder,
    buttonBackgroundColor: btnBg, buttonTextColor: btnText, secondaryHeadingColor: titleColor,
  };

  const badgeFallback: WebsiteElement = {
    id: `${section.id}-gp-badge`, type: 'badge',
    content: { text: content.badgeText || 'Our promise', icon: 'fa-shield-halved', iconPosition: 'left', iconSize: '0.65rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px', textAlign: 'center' as any, backgroundColor: cardBorder, color: mutedColor },
  };
  const badgeElResolved = preferSavedElement(
    section.elements?.find(e => e.id === `${section.id}-gp-badge`),
    { ...badgeFallback, content: { ...(badgeFallback.content || {}), text: apiBadgeText } }
  );

  const titleEl = resolveEditableHeadingElement({
    id: `${section.id}-gp-title`,
    existing: section.elements?.find(e => e.id === `${section.id}-gp-title`),
    sourceText: apiTitleText.toString().replace(/<[^>]+>/g, '').trim(),
    htmlTag: 'h2',
    style: { textAlign: 'left' as any, color: titleColor, fontWeight: '800', fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', lineHeight: '1.12', letterSpacing: '-0.03em' } as any,
  }) as WebsiteElement;

  const descFallback: WebsiteElement = {
    id: `${section.id}-gp-desc`, type: 'text',
    content: { text: apiDescriptionText, textSize: 'large' },
    style: { textAlign: 'left' as any, color: textColor, maxWidth: '520px', lineHeight: '1.7' },
  };
  const descElResolved = preferSavedElement(section.elements?.find(e => e.id === `${section.id}-gp-desc`), descFallback);

  const statEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-gp-stat`) || {
    id: `${section.id}-gp-stat`, type: 'stat-card',
    content: { value: apiStatValue, text: apiStatLabel, icon: apiStatIcon } as any,
    style: {
      padding: '0', borderRadius: '0', backgroundColor: 'transparent', borderWidth: '0',
      titleColor: btnText, titleFontSize: 'clamp(3.5rem, 8vw, 6rem)', titleFontWeight: '900',
      descriptionColor: btnText, descriptionFontSize: '0.9rem', descriptionFontWeight: '700',
      textAlign: 'center' as any, iconColor: btnText, iconSize: '1.75rem',
    } as any,
  };
  const statElResolved: WebsiteElement = { ...statEl, content: { ...(statEl.content || {}), value: apiStatValue, text: apiStatLabel, icon: apiStatIcon } };

  const listItemsResolved = (
    Array.isArray((content as any).guaranteeList) && (content as any).guaranteeList.length > 0
      ? (content as any).guaranteeList.map((it: any, i: number) => ({ title: it?.line || it?.title || DEFAULT_POINTS[i % DEFAULT_POINTS.length].title }))
      : (Array.isArray((content as any).items) && (content as any).items.length > 0)
        ? (content as any).items.map((it: any, i: number) => ({ title: it?.title || it?.line || it?.description || DEFAULT_POINTS[i % DEFAULT_POINTS.length].title }))
        : DEFAULT_POINTS.map(p => ({ title: p.title }))
  );
  const listEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-gp-list`) || {
    id: `${section.id}-gp-list`, type: 'list',
    content: { items: listItemsResolved } as any,
    style: { listType: 'check', itemGap: '0.875rem', indent: '0px', color: textColor, markerColor: accent, iconColor: accent, fontSize: '0.95rem', fontWeight: '500' } as any,
  };
  const listElResolved: WebsiteElement = { ...listEl, content: { ...(listEl.content || {}), items: listItemsResolved } };

  const btnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-gp-btn`) || {
    id: `${section.id}-gp-btn`, type: 'cta-button',
    content: { text: apiCtaText, link: apiCtaHref, buttonVariant: 'primary' },
    style: { buttonVariant: 'primary', backgroundColor: btnBg, color: btnText, padding: '0 2rem', height: '3.1rem', borderRadius: '0.6rem', fontWeight: '700', fontSize: '0.95rem' } as any,
  };
  const btnElResolved: WebsiteElement = { ...btnEl, content: { ...(btnEl.content || {}), text: apiCtaText, link: apiCtaHref } };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="relative grid grid-cols-1 lg:grid-cols-[minmax(240px,320px)_1fr] rounded-3xl overflow-hidden"
          style={{ border: `1px solid ${cardBorder}`, boxShadow: `0 30px 60px -34px rgba(0,0,0,0.18)` }}>

          {/* Left — accent seal panel with the stat */}
          <div className="relative flex flex-col items-center justify-center gap-3 p-8 lg:p-10 text-center" style={{ backgroundColor: accent }}>
            <div aria-hidden className="absolute inset-0 opacity-15" style={{ backgroundImage: `radial-gradient(circle at 30% 20%, #fff2, transparent 45%)` }} />
            <div className="relative z-10 w-full">
              <ElementsSection section={{ ...section, elements: [statElResolved] }} {...pass} />
            </div>
            <span aria-hidden className="relative z-10 mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: `${btnText}CC` }}>
              <i className="fa-solid fa-check-double" /> Guaranteed in writing
            </span>
          </div>

          {/* Right — copy + list + CTA */}
          <div className="p-8 lg:p-12" style={{ backgroundColor: cardBg }}>
            <div className="inline-flex mb-4"><ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...pass} /></div>
            <ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} />
            <div className="mt-4"><ElementsSection section={{ ...section, elements: [descElResolved] }} {...pass} /></div>
            <div className="mt-7"><ElementsSection section={{ ...section, elements: [listElResolved] }} {...pass} /></div>
            <div className="mt-9" style={{ width: 'max-content' }}><ElementsSection section={{ ...section, elements: [btnElResolved] }} {...pass} /></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GuaranteeEditorial;
