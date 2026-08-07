import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionBackground, resolveSectionOverlay, sectionBgHasImage } from '../utils/sectionBackground';
import { motion } from 'motion/react';
import { resolveSectionElement, elementFromExistingOrDna } from '../../../../elements';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  isSelected?: boolean;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

/**
 * AreasEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * A two-column layout: a left column with the header (badge + accent heading +
 * intro) and the CTA row (check-area button, optional phone button, note), and
 * a right "coverage" panel holding the service cities as editable pills.
 * Industry-neutral, light section.
 *
 * Fully dynamic keys: badgeText, title, subtitle, ctaText/ctaHref, phoneText/
 * phoneHref, items[]{id,title/city,link,locationId} (the cities come from the
 * BusinessLocation table via contentRef, injected into content.items). Element
 * ids reuse the `ap-` prefix (`ap-city<i>`, `ap-badge/title/desc/btn/phone/
 * note`) so content carries over on variant switch. Add/remove wired.
 */
const DEFAULT_AREAS = ['Austin', 'Houston', 'Dallas', 'San Antonio', 'Fort Worth', 'Plano', 'Irving', 'Garland', 'Arlington', 'Round Rock'];

export const AreasEditorial: React.FC<Props> = ({
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
  const cardBg     = fb.background  || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border      || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';
  const btnBg      = lc.buttonBackgroundColor || tc?.buttonBackgroundColor || accent;
  const btnText    = lc.buttonTextColor || tc?.buttonTextColor || '#FFFFFF';

  // Section background: color / gradient / image (image-only overlay) via shared resolver.
  const defaultSurface = lc.surface || (lc as any).cardBackgroundColor || '#FFFFFF';
  const sectionBg = resolveSectionBackground(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1240px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent,
    buttonBackgroundColor: btnBg, buttonTextColor: btnText,
    secondaryButtonBg: 'transparent', secondaryButtonText: titleColor, secondaryButtonBorder: accent,
  };

  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-ap-badge`, type: 'badge',
    content: { text: content.badgeText || 'Service areas', icon: 'fa-map-location-dot', iconPosition: 'left', iconSize: '0.65rem' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase' as any, padding: '0', borderRadius: '0', textAlign: 'left' as any},
  });

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-ap-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const src = (cc.text || content.title || 'Areas we cover').toString().replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.1', letterSpacing: '-0.03em', textAlign: 'left' as any },
    });
    if (existing) {
      return { ...existing, type: 'heading', content: { ...(existing.content || {}), htmlTag: (existing.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), ...(existing.style as any) } } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: 'h2' } };
  })();

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-ap-desc`, type: 'text',
    content: { text: content.subtitle || 'We cover a wide local area. Not sure if we reach you? Give us a call and we will let you know.', textSize: 'large' },
    style: { textAlign: 'left' as any, maxWidth: '440px', lineHeight: '1.7' },
  });

  const btnEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-ap-btn`, type: 'cta-button',
    content: { text: content.ctaText || 'Check your area', link: content.ctaHref || '#', buttonVariant: 'primary' },
    style: { buttonVariant: 'primary', padding: '0 1.75rem', height: '3rem', borderRadius: '0.6rem', fontWeight: '700', fontSize: '0.95rem' } as any,
  });
  const phoneEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-ap-phone`, type: 'cta-button',
    content: { text: (content as any).phoneText || '', link: (content as any).phoneHref || '', icon: 'fa-phone', buttonVariant: 'secondary' },
    style: { buttonVariant: 'secondary', padding: '0 1.5rem', height: '3rem', borderRadius: '0.6rem', fontWeight: '600', fontSize: '0.9rem' } as any,
  });
  const ctaNoteEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-ap-note`, type: 'text',
    content: { text: "Don't see your area? We may still cover it.", textSize: 'small' },
    style: { fontSize: '0.85rem',  textAlign: 'left' as any },
  });

  const itemsAreMaterialized = Array.isArray(content.items) && content.items.length > 0;
  const cityItems = itemsAreMaterialized
    ? (content.items as any[]).map((it: any, i: number) => {
        const city = String(it.title || it.city || it.name || it.label || '').trim();
        if (!city && readOnly) return null;
        return { id: it.id || `ap-city-${i}`, city: city || DEFAULT_AREAS[i % DEFAULT_AREAS.length], link: String(it.link || it.href || it.url || '').trim(), locationId: it.locationId ? String(it.locationId) : '' };
      }).filter(Boolean)
    : readOnly ? [] : DEFAULT_AREAS.map((a, i) => ({ id: `ap-city-${i}`, city: a, link: '', locationId: '' }));

  const seedItems = () => (content.items && content.items.length > 0 ? (content.items as any[]) : DEFAULT_AREAS.map((a, i) => ({ id: `ap-city-${i}`, title: a })));
  const handleAddCity = () => {
    if (readOnly || !onSectionUpdate) return;
    onSectionUpdate(section.id, { content: { ...content, items: [...seedItems(), { id: `ap-city-x${seedItems().length}`, title: 'New City' }] } });
  };
  const handleRemoveCity = (cityId: string, idx: number) => {
    if (readOnly || !onSectionUpdate) return;
    const next = seedItems().filter((it: any, i: number) => (it.id ? it.id !== cityId : i !== idx));
    const nextElements = (section.elements || []).filter((e) => e.id !== `${section.id}-ap-city${idx}`);
    onSectionUpdate(section.id, { content: { ...content, items: next }, elements: nextElements });
  };

  const getCityEl = (i: number, cityName: string, cityLink?: string): WebsiteElement => {
    const id = `${section.id}-ap-city${i}`;
    const existing = section.elements?.find(e => e.id === id);
    const existingContent = (existing?.content || {}) as Record<string, unknown>;
    const resolvedLink = String(cityLink || '').trim() || String(existingContent.link || '').trim();
    const resolvedText = String(cityName || existingContent.text || '').trim() || cityName;
    const mergedContent = {
      text: resolvedText,
      icon: existingContent.icon || 'fa-location-dot',
      iconPosition: existingContent.iconPosition || 'left',
      iconSize: existingContent.iconSize || '0.7rem',
      link: resolvedLink,
      linkNewTab: existingContent.linkNewTab ?? false,
    };
    if (existing) return { ...existing, content: { ...existingContent, ...mergedContent } as any };
    return {
      id, type: 'badge',
      content: mergedContent as any,
      style: { fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0', textTransform: 'none' as any, padding: '8px 16px', borderRadius: '9999px',    borderWidth: '1px', borderStyle: 'solid' } as any,
    };
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const uid = `ae-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const hasPhone = !!((content as any).phoneText && (content as any).phoneHref);

  return (
    <div className={`relative w-full overflow-hidden ${uid}`} style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />}
      <style>{`
        .${uid} .ae-pill:hover { transform:translateY(-2px); }
        .${uid} .ae-pill { transition:transform .25s; }
      `}</style>
      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-start">

          {/* Left — header + CTA */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2.5">
              <span aria-hidden className="h-px w-8" style={{ backgroundColor: cardBorder }} />
              <ElementsSection section={{ ...section, elements: [badgeEl] }} {...pass} />
            </div>
            <div className="mt-5"><ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} /></div>
            <div className="mt-5"><ElementsSection section={{ ...section, elements: [descEl] }} {...pass} /></div>
            <div className="mt-8 flex flex-wrap gap-3">
              <div style={{ width: 'max-content' }}><ElementsSection section={{ ...section, elements: [btnEl] }} {...pass} /></div>
              {hasPhone && <div style={{ width: 'max-content' }}><ElementsSection section={{ ...section, elements: [phoneEl] }} {...pass} /></div>}
            </div>
            <div className="mt-4"><ElementsSection section={{ ...section, elements: [ctaNoteEl] }} {...pass} /></div>
          </motion.div>

          {/* Right — coverage panel with city pills */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl p-6 sm:p-8 relative overflow-hidden" style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>
            <div aria-hidden className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: `radial-gradient(${cardBorder} 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
            <div className="relative z-10 flex flex-wrap gap-2.5">
              {cityItems.map((city: any, i: number) => (
                <div key={city.id || i} className={`ae-pill relative group/city${readOnly && city.link && city.link !== '#' ? ' cursor-pointer' : ''}`} style={{ borderRadius: '9999px' }}>
                  <ElementsSection section={{ ...section, elements: [getCityEl(i, city.city, city.link)] }} {...pass} />
                  {isSelected && !readOnly && onSectionUpdate && cityItems.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveCity(city.id || `ap-city-${i}`, i); }}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full opacity-0 group-hover/city:opacity-100 transition-all flex items-center justify-center text-[9px] z-20 shadow-lg hover:scale-110"
                      title="Remove city" aria-label="Remove city"><i className="fa-solid fa-xmark" /></button>
                  )}
                </div>
              ))}
              {isSelected && !readOnly && onSectionUpdate && (
                <button type="button" onClick={(e) => { e.stopPropagation(); handleAddCity(); }}
                  className="px-4 py-2 rounded-full border-2 border-dashed transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:scale-105"
                  style={{ borderColor: `${accent}55`, backgroundColor: `${accent}08`, color: accent }} title="Add a city">
                  <i className="fa-solid fa-plus" /> Add City
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AreasEditorial;
