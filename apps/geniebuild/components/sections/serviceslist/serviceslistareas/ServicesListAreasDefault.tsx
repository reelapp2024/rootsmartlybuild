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
  /** Whether the section is selected — drives "Add city" / "Remove" tile visibility. */
  isSelected?: boolean;
  /** Section-level patch — used to materialize defaults to `content.items`
   *  and to add/remove cities. */
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

const DEFAULT_AREAS = [
  { city: 'Austin',      state: 'TX', zip: '78701' },
  { city: 'Houston',     state: 'TX', zip: '77001' },
  { city: 'Dallas',      state: 'TX', zip: '75201' },
  { city: 'San Antonio', state: 'TX', zip: '78201' },
  { city: 'Fort Worth',  state: 'TX', zip: '76101' },
  { city: 'Plano',       state: 'TX', zip: '75023' },
  { city: 'Irving',      state: 'TX', zip: '75038' },
  { city: 'Garland',     state: 'TX', zip: '75040' },
  { city: 'Arlington',   state: 'TX', zip: '76010' },
  { city: 'Lubbock',     state: 'TX', zip: '79401' },
  { city: 'Laredo',      state: 'TX', zip: '78040' },
  { city: 'Round Rock',  state: 'TX', zip: '78664' },
];

export const ServicesListAreasDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  isSelected = false, onSectionUpdate,
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
  const btnBg      = lc.buttonBackgroundColor || tc?.buttonBackgroundColor || accent;
  const btnText    = lc.buttonTextColor || tc?.buttonTextColor || '#FFFFFF';

  // bg white-lock
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
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };
  const textAlignClass = s.textAlign === 'left' ? 'text-left' : s.textAlign === 'right' ? 'text-right' : 'text-center';

  const themeColors = {
    ...tc,
    titleColor, textColor, accentColor: accent,
    buttonBackgroundColor: btnBg, buttonTextColor: btnText,
    secondaryButtonBg: 'transparent',
    secondaryButtonText: titleColor,
    secondaryButtonBorder: accent,
  };

  // Badge — uses theme accent color so it matches other section badges.
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sla-badge`) || {
    id: `${section.id}-sla-badge`, type: 'badge',
    content: { text: content.badgeText || 'Service Areas', icon: 'fa-map-location-dot', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
      backgroundColor: `${accent}1A`,
      color: accent,
    },
  };

  // Highlighted heading
  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-sla-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const sourceText: string = (
      (readOnly ? String(content.title || '').trim() : '') ||
      c.text ||
      content.title ||
      'Service Areas'
    ).toString().replace(/<[^>]+>/g, '').trim();
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
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sla-desc`) || {
    id: `${section.id}-sla-desc`, type: 'text',
    content: { text: content.subtitle || 'We provide fast, reliable plumbing services across the greater Texas area. Not sure if we serve your area? Give us a call!', textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '560px', margin: '0 auto', lineHeight: '1.65' },
  };

  const btnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sla-btn`) || {
    id: `${section.id}-sla-btn`, type: 'button',
    content: { text: content.ctaText || 'Check Your Area', link: content.ctaHref || '#' },
    style: { padding: '0.875rem 1.75rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.95rem' },
  };

  const phoneEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sla-phone`) || {
    id: `${section.id}-sla-phone`, type: 'button',
    content: { text: (content as any).phoneText || '', link: (content as any).phoneHref || '', icon: 'fa-phone', buttonVariant: 'secondary' },
    style: { padding: '0.875rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.9rem' },
  };

  const ctaNoteEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sla-note`) || {
    id: `${section.id}-sla-note`, type: 'text',
    content: { text: "Don't see your city? We may still cover your area!", textSize: 'small' },
    style: { fontSize: '0.875rem' },
  };

  // ── Cities — each city is its own editable `badge` element so the user
  // can click any pill to edit text/icon/colors individually. Section's own
  // add/remove tiles (like ServicesPlumbing2) manage the list count.
  const itemsAreMaterialized = Array.isArray(content.items) && content.items.length > 0;
  const cityItems = itemsAreMaterialized
    ? (content.items as any[])
        .map((it: any, i: number) => {
          const city = String(it.title || it.city || it.name || it.label || '').trim();
          if (!city && readOnly) return null;
          return {
            id: it.id || `area-${i + 1}`,
            city: city || DEFAULT_AREAS[i % DEFAULT_AREAS.length].city,
            link: String(it.link || it.href || it.url || '').trim(),
            locationId: it.locationId ? String(it.locationId) : '',
          };
        })
        .filter(Boolean)
    : readOnly
      ? []
      : DEFAULT_AREAS.map((a, i) => ({ id: `sla-city-${i}`, city: a.city, link: '', locationId: '' }));

  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return cityItems;
    if (!onSectionUpdate) return cityItems;
    const seeded = DEFAULT_AREAS.map((a, i) => ({ id: `sla-city-${i}`, title: a.city }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded.map(s => ({ id: s.id, city: s.title }));
  };

  const handleAddCity = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const newItem = { id: `sla-city-${Date.now()}`, title: 'New City' };
    const seeded = (content.items && content.items.length > 0
      ? (content.items as any[])
      : DEFAULT_AREAS.map((a, i) => ({ id: `sla-city-${i}`, title: a.city })));
    onSectionUpdate(section.id, { content: { ...content, items: [...seeded, newItem] } });
  };

  const handleRemoveCity = (cityId: string, idx: number) => {
    if (readOnly || !onSectionUpdate) return;
    materializeIfNeeded();
    const baseItems = (content.items && content.items.length > 0
      ? (content.items as any[])
      : DEFAULT_AREAS.map((a, i) => ({ id: `sla-city-${i}`, title: a.city })));
    const next = baseItems.filter((it: any, i: number) => (it.id ? it.id !== cityId : i !== idx));
    const elementIdToRemove = `${section.id}-sla-city${idx}`;
    const nextElements = (section.elements || []).filter((e) => e.id !== elementIdToRemove);
    onSectionUpdate(section.id, {
      content: { ...content, items: next },
      elements: nextElements,
    });
  };

  // Per-city editable badge element. Each pill carries its own link (and
  // `linkNewTab` defaulting to ON) so users can wire each area to a city
  // landing page. Edit in the sidebar Content tab.
  const getCityEl = (i: number, cityName: string, cityLink?: string): WebsiteElement => {
    const id = `${section.id}-sla-city${i}`;
    const existing = section.elements?.find(e => e.id === id);
    const existingContent = (existing?.content || {}) as Record<string, unknown>;
    const existingLink = String(existingContent.link || '').trim();
    const apiLink = String(cityLink || '').trim();
    // Dynamic location links from API win over empty/stale saved element links.
    const resolvedLink = apiLink || existingLink;
    const resolvedText = String(cityName || existingContent.text || '').trim() || cityName;
    const mergedContent = {
      text: resolvedText,
      icon: existingContent.icon || 'fa-location-dot',
      iconPosition: existingContent.iconPosition || 'left',
      iconSize: existingContent.iconSize || '0.7rem',
      link: resolvedLink,
      linkNewTab: existingContent.linkNewTab ?? false,
    };

    if (existing) {
      return {
        ...existing,
        content: { ...existingContent, ...mergedContent } as any,
      };
    }

    return {
      id,
      type: 'badge',
      content: mergedContent as WebsiteElement['content'],
      style: {
        fontSize: '0.875rem',
        fontWeight: '600',
        letterSpacing: '0',
        textTransform: 'none' as any,
        padding: '8px 16px',
        borderRadius: '9999px',
        backgroundColor: cardBg,
        color: titleColor,
        borderColor: cardBorder,
        borderWidth: '1px',
        borderStyle: 'solid',
      } as any,
    };
  };

  return (
    <div className={`relative w-full overflow-hidden ${textAlignClass}`} style={{ backgroundColor: bg }}>
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: `radial-gradient(${accent}15 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeEl] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="flex justify-center mb-10 sm:mb-12">
          <ElementsSection section={{ ...section, elements: [descEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* City pill cloud — flowing flex-wrap of editable badge elements.
            Each pill is its own badge → click to edit text + styling in sidebar.
            Hover lifts and tints with accent. */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-10 sm:mb-14 max-w-5xl mx-auto"
        >
          {cityItems.map((city: any, i: number) => (
            <motion.div
              key={city.id || i}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.03 }}
              whileHover={readOnly ? undefined : { y: -3, scale: 1.04 }}
              className={`relative group/city transition-shadow${readOnly && city.link && city.link !== '#' ? ' cursor-pointer' : ''}`}
              style={{ borderRadius: '9999px' }}
            >
              <ElementsSection section={{ ...section, elements: [getCityEl(i, city.city, city.link)] }} onTextEdit={onTextEdit}
                onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                buttonClass={buttonClass} themeColors={themeColors} />
              {isSelected && !readOnly && onSectionUpdate && cityItems.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveCity(city.id || `sla-city-${i}`, i); }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full opacity-0 group-hover/city:opacity-100 transition-all flex items-center justify-center text-[9px] z-20 shadow-lg hover:scale-110"
                  title="Remove city"
                  aria-label="Remove city"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </motion.div>
          ))}

          {/* Add-city pill — only when section is selected */}
          {isSelected && !readOnly && onSectionUpdate && (
            <motion.button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleAddCity(); }}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="px-4 py-2 rounded-full border-2 border-dashed transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:scale-105"
              style={{
                borderColor: `${accent}55`,
                backgroundColor: `${accent}08`,
                color: accent,
              }}
              title="Add a new city"
            >
              <i className="fa-solid fa-plus" />
              Add City
            </motion.button>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col items-center gap-4">
          <ElementsSection section={{ ...section, elements: [ctaNoteEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
          <div className="flex flex-wrap justify-center gap-3">
            <div style={{ width: 'max-content' }}>
              <ElementsSection section={{ ...section, elements: [btnEl] }} onTextEdit={onTextEdit}
                onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                buttonClass={buttonClass} themeColors={themeColors} />
            </div>
            {(content as any).phoneText && (content as any).phoneHref && (
              <div style={{ width: 'max-content' }}>
                <ElementsSection section={{ ...section, elements: [phoneEl] }} onTextEdit={onTextEdit}
                  onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                  selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                  buttonClass={buttonClass} themeColors={themeColors} />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ServicesListAreasDefault;
