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

const DEFAULT_LOCATIONS = [
  { name: 'Downtown', meta: '12 areas covered' },
  { name: 'North Side', meta: '9 areas covered' },
  { name: 'West End', meta: '8 areas covered' },
  { name: 'East Village', meta: '7 areas covered' },
  { name: 'Southgate', meta: '10 areas covered' },
  { name: 'Riverside', meta: '6 areas covered' },
  { name: 'Hillcrest', meta: '5 areas covered' },
  { name: 'Lakeside', meta: '8 areas covered' },
];

/**
 * All Areas listing grid (`allareas/sublocations`).
 * Cards come from BusinessLocation / section content.items.
 */
export const SubLocationsDefault: React.FC<Props> = ({
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
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  // Live site (readOnly): never invent Downtown/# demo cards — empty grid if API sent no items.
  // Builder preview may still show DEFAULT_LOCATIONS so editors see the layout.
  const rawItems = (content.items && content.items.length > 0)
    ? content.items
        .map((it: any, i: number) => {
          const name = String(it.name || it.title || it.label || '').trim();
          if (!name && readOnly) return null;
          const fallback = DEFAULT_LOCATIONS[i % DEFAULT_LOCATIONS.length];
          return {
            name: name || fallback.name,
            meta: String(it.meta || it.subtitle || it.description || (readOnly ? 'Service area' : fallback.meta)).trim(),
            link: String(it.link || it.href || it.url || '#').trim() || '#',
          };
        })
        .filter(Boolean)
    : readOnly
      ? []
      : DEFAULT_LOCATIONS.map((x) => ({ ...x, link: '#' }));

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sl-badge`) || {
    id: `${section.id}-sl-badge`, type: 'badge',
    content: { text: content.badgeText || 'Areas We Serve', icon: 'fa-map-location-dot', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-sl-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const sourceText = (
      (readOnly ? String(content.title || '').trim() : '') ||
      cc.text ||
      content.title ||
      'Explore Nearby Locations'
    ).toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
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

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sl-desc`) || {
    id: `${section.id}-sl-desc`, type: 'text',
    content: { text: String(content.subtitle || (content as any).intro || 'We proudly serve homes and businesses across these areas — find yours below.'), textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '580px', margin: '0 auto', lineHeight: '1.65' },
  };

  return (
    <div className="w-full text-center" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="flex justify-center mb-10 sm:mb-12">
          <ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} />
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 text-left">
          {rawItems.map((loc: any, i: number) => (
            <motion.a key={i} href={loc.link || '#'}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
              className="group flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${accent}15`, color: accent }}>
                <i className="fas fa-location-dot text-sm" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-sm truncate" style={{ color: titleColor }}>{loc.name}</span>
                <span className="block text-xs truncate" style={{ color: textColor }}>{loc.meta}</span>
              </span>
              <i className="fas fa-arrow-right text-xs ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }} aria-hidden="true" />
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubLocationsDefault;
