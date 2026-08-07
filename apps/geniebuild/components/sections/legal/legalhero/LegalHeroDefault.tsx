import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { motion } from 'motion/react';
import { resolveSectionBackground } from '../../../../utils/sectionBackground';
import { resolveSectionElement, elementFromExistingOrDna } from '../../../../elements';

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

/**
 * LegalHeroDefault — dark sub-page hero for Privacy / Terms / Disclaimer pages.
 * Same base as the other sub-page heroes (badge + title + subtitle + breadcrumb)
 * plus a "last updated" line. Colors from the active theme; everything editable.
 */
export const LegalHeroDefault: React.FC<Props> = ({
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
  const bgStyle = resolveSectionBackground(s, { defaultSurface: bg });

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-24 sm:pt-28 lg:pt-32';
  const padB = s.paddingBottom ?? 'pb-14 sm:pb-16 lg:pb-20';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const apiBadgeText = String(c.badgeText || 'Legal');
  const apiTitleText = String(c.heroTitle || c.title || 'Privacy Policy');
  const apiSubtitle  = String(c.heroSubtitle || c.subtitle || 'Please read this page carefully to understand how we handle your information and your rights.');
  const lastUpdated  = String(c.lastUpdatedLabel || 'Last updated: June 2025');
  const crumb        = String(c.breadcrumbLabel || apiTitleText);

  const themeColors = {
    ...tc, titleColor, textColor,
    accentColor: accent, iconColor: accent, secondaryHeadingColor: accent,
  };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-lh-badge`, type: 'badge',
    content: { text: apiBadgeText, icon: 'fa-scale-balanced', iconPosition: 'left', iconSize: '0.7rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '8px 16px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  });
  const badgeElResolved: WebsiteElement = { ...badgeEl, content: { ...(badgeEl.content || {}), text: apiBadgeText } };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-lh-title`;
    const existing = section.elements?.find(e => e.id === id);
    const sourceText = apiTitleText.toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h1' },
      style: { fontWeight: '900', fontSize: s.titleSize || 'clamp(2.25rem, 5.5vw, 3.5rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'center' as any },
    });
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          htmlTag: (existing.content as any)?.htmlTag || 'h1',
        },
        style: { ...(base.style as any), ...(existing.style as any) },
      } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h1' } };
  })();

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-lh-desc`, type: 'text',
    content: { text: apiSubtitle, textSize: 'large' },
    style: { lineHeight: '1.75', textAlign: 'center' as any, maxWidth: '38rem', marginLeft: 'auto', marginRight: 'auto' },
  });
  const descElResolved: WebsiteElement = { ...descEl, content: { ...(descEl.content || {}), text: apiSubtitle } };

  return (
    <div className="relative w-full overflow-hidden" style={{ ...bgStyle }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full blur-[130px]"
          style={{ backgroundColor: `${accent}14` }} />
      </div>

      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center gap-5">

          <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
            <span>Home</span>
            <i className="fas fa-chevron-right text-[0.6rem] opacity-60" aria-hidden="true" />
            <span style={{ color: accent, fontWeight: 600 }}>{crumb}</span>
          </div>

          <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...passThrough} />
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
          <ElementsSection section={{ ...section, elements: [descElResolved] }} {...passThrough} />

          <span className="inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full"
            style={{ color: textColor, backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <i className="fas fa-clock-rotate-left opacity-70" aria-hidden="true" />{lastUpdated}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default LegalHeroDefault;
