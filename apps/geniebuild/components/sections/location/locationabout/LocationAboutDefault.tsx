import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import {
  mergeSectionContent,
  pickAboutServiceBody,
  pickAboutServiceImage,
  pickAboutServiceTitle,
  resolveAboutImageUrl,
} from '../../service/aboutservice/aboutServiceShared';

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
 * LocationAboutDefault — theme-consistent light "about this location" split
 * (image + copy), mirroring AboutServiceConsistent. Uses the flat themeColors
 * keys SectionRenderer provides and renders the heading + body through
 * ElementsSection so it is fully editable in the builder.
 */
export const LocationAboutDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { styles } = section;
  const s = styles as any;
  const content = mergeSectionContent(section);

  // ── Theme tokens from the LIGHT palette (tc.light) ───────────────────────
  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';

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
  const padT = s.paddingTop    ?? 'pt-12 sm:pt-16 lg:pt-20';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16 lg:pb-20';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const title = String(pickAboutServiceTitle(content) !== 'About this service' ? pickAboutServiceTitle(content) : (content.title || 'Proudly Serving Your Community')).trim();
  const bodyText = String(pickAboutServiceBody(content) || 'Our local technicians live and work in the neighborhoods we serve. We know the area, the common issues homes here face, and we show up fast with the right tools and honest, upfront pricing.').replace(/<[^>]+>/g, '').trim();
  const img = resolveAboutImageUrl(pickAboutServiceImage(content));

  const themeColors = {
    ...tc,
    titleColor, textColor,
    accentColor: accent,
    secondaryHeadingColor: accent,
  };

  const passThrough = {
    onTextEdit,
    onElementUpdate: onElementUpdate || (() => {}),
    onElementSelect,
    selectedElementId,
    readOnly,
    isWrapped: false,
    buttonClass,
    themeColors,
  } as const;

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-lab-badge`) || {
    id: `${section.id}-lab-badge`, type: 'badge',
    content: { text: (content as any).badgeText || 'About Our Location', icon: 'fa-circle-info', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'left' as any,
    },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-lab-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const sourceText = (cc.text || title).toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', lineHeight: '1.15', letterSpacing: '-0.02em', textAlign: 'left' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const bodyEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-lab-body`) || {
    id: `${section.id}-lab-body`, type: 'text',
    content: { text: bodyText, textSize: 'base' },
    style: { lineHeight: '1.75', textAlign: 'left' as any },
  };
  const bodyElResolved: WebsiteElement = { ...bodyEl, content: { ...(bodyEl.content || {}), text: (bodyEl.content as any)?.text || bodyText } };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            {img ? (
              <img src={img} alt="" className="w-full rounded-2xl object-cover shadow-lg max-h-[440px]" />
            ) : (
              <div className="w-full aspect-[4/3] rounded-2xl flex items-center justify-center text-sm border"
                style={{ backgroundColor: `${accent}0A`, borderColor: `${accent}22`, color: textColor }}>
                <i className="fas fa-image text-2xl opacity-40" aria-hidden="true" />
              </div>
            )}
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2 space-y-5"
          >
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
            <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
            <ElementsSection section={{ ...section, elements: [bodyElResolved] }} {...passThrough} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LocationAboutDefault;
