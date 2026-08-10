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
 * ServicesEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * Centered header, then a clean numbered list of service rows. Each row: a big
 * index numeral + accent rule, an icon tile, an editable title/body, a ticked
 * items list, and a "Learn more →" action (opens the service page or a modal,
 * same nav contract as the other services variants). Industry-neutral, light.
 *
 * Fully dynamic keys: badgeText, title, description/subtitle, items[]{id,icon,
 * title,description, link/slug, items[]}. Element ids reuse the `sp2-` prefix so
 * content carries over on variant switch. Nav mode + modal preserved.
 */
const DEFAULT_SERVICES = [
  { icon: 'fa-wrench',        title: 'Repairs & callouts',       desc: 'Something has stopped working and you need it sorted today. We keep emergency slots free every day.', items: ['Same-day emergency slots', 'Fault finding & diagnosis', 'Parts carried on the van'] },
  { icon: 'fa-layer-group',   title: 'Installations & upgrades', desc: 'Bigger jobs booked in for a date that suits you. We survey first, quote a fixed price, and agree the schedule.', items: ['Free on-site survey', 'Fixed written quote', 'All waste removed'] },
  { icon: 'fa-calendar-check', title: 'Servicing & maintenance', desc: 'A yearly check that catches small problems before they turn into expensive ones, with a written report.', items: ['Annual safety check', 'Written condition report', 'Priority booking'] },
];

export const ServicesEditorial: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  isSelected = false, onSectionUpdate,
}) => {
  const { styles } = section;
  const dataLayer = (section as any)?.data && typeof (section as any).data === 'object' ? ((section as any).data as Record<string, unknown>) : {};
  const content = { ...(section.content || ({} as Section['content'])), ...dataLayer } as Section['content'];
  const s = styles as any;

  const [svcModal, setSvcModal] = React.useState<{ open: boolean; title: string; body: string; href: string }>({ open: false, title: '', body: '', href: '#' });

  const navSources = ((content as any)?.navSources || {}) as Record<string, any>;
  const navServiceItems = Array.isArray(navSources.services) ? navSources.services : [];
  const normalize = (v: unknown) => String(v || '').trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
  const sanitizeSlug = (v: unknown) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const isValidLink = (v: unknown): boolean => { const x = String(v || '').trim(); return !!x && x !== '#'; };
  const pickPreferredLink = (...candidates: unknown[]): string => { for (const c of candidates) if (isValidLink(c)) return String(c).trim(); return '/services'; };
  const toServiceHref = (svc: any, title: string | undefined): string => {
    const explicitLink = svc?.link || svc?.href || svc?.url || svc?.path || svc?.permalink || svc?.serviceLink || svc?.service_link || svc?.serviceUrl || svc?.service_url || '';
    if (isValidLink(explicitLink)) return String(explicitLink).trim();
    const explicitSlug = svc?.slug || svc?.serviceSlug || svc?.service_slug || svc?.serviceNameSlug || svc?.service_name_slug || '';
    const cleanedExplicitSlug = sanitizeSlug(explicitSlug);
    if (cleanedExplicitSlug) return `/services/${cleanedExplicitSlug}`;
    const normTitle = normalize(title || svc?.title || svc?.name || svc?.service_name);
    if (normTitle && navServiceItems.length) {
      const match = navServiceItems.find((row: any) => { const label = normalize(row?.label || row?.name || row?.title || ''); return label && label === normTitle; });
      const fromNav = match?.link || match?.url || '';
      if (isValidLink(fromNav)) return String(fromNav).trim();
    }
    return '/services';
  };

  const lc = tc?.light || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = lc.titleColor || '#111827';
  const textColor  = lc.textColor  || '#4B5563';
  const cardBg     = lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = (lc as any).cardBorderColor || 'rgba(0,0,0,0.08)';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';
  const learnMoreText: string = String((content as any).learnMoreText || '').trim() || 'Learn more';

  const defaultSurface = (lc as any).surface || lc.cardBackgroundColor || '#FFFFFF';
  const sectionBg = resolveSectionBackground(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop  ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1080px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const itemsAreMaterialized = Array.isArray(content.items) && content.items.length > 0;
  const items = itemsAreMaterialized ? (content.items as any[]) : DEFAULT_SERVICES;
  const serviceNavMode: 'card' | 'button' = (content as any).serviceNavMode === 'card' ? 'card' : 'button';

  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return items;
    if (!onSectionUpdate) return items;
    const seeded = DEFAULT_SERVICES.map((sv, i) => ({ id: `sp2-svc-${i}`, title: sv.title, description: sv.desc, icon: sv.icon, items: sv.items }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };
  const handleAddCard = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = DEFAULT_SERVICES[current.length % DEFAULT_SERVICES.length];
    const newItem = { id: `sp2-svc-x${current.length}`, title: 'New Service', description: 'Add a description for this service.', icon: fallback.icon, items: ['Detail one', 'Detail two'] };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };
  const handleRemoveCard = (cardId: string, idx: number) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any, i: number) => (it.id ? it.id !== cardId : i !== idx));
    const idsToRemove = new Set([`${section.id}-sp2-svc${idx}-title`, `${section.id}-sp2-svc${idx}-body`]);
    const nextElements = (section.elements || []).filter((e) => !idsToRemove.has(e.id));
    onSectionUpdate(section.id, { content: { ...content, items: next }, elements: nextElements });
  };

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };

  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-sp2-badge`, type: 'badge',
    content: { text: content.badgeText || 'What we do', iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase' as any, padding: '0', borderRadius: '0', textAlign: 'center' as any},
  });

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-sp2-title`;
    const existing = section.elements?.find(e => e.id === id);
    const src = (existing?.content as any)?.text || content.title || 'Straightforward services, priced up front.';
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.08', letterSpacing: '-0.035em', textAlign: 'center' as any },
    });
    if (existing) {
      return { ...existing, type: 'heading', content: { ...(existing.content || {}), htmlTag: (existing.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), ...(existing.style as any) } } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: 'h2' } };
  })();

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-sp2-desc`, type: 'text',
    content: { text: content.description || content.subtitle || 'Whatever you need doing, you get the same deal: a clear written quote before we start, a tidy job, and a guarantee in writing.', textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '640px', lineHeight: '1.75', margin: '0 auto' },
  });

  const getTitleEl = (i: number, def: any): WebsiteElement => {
    const id = `${section.id}-sp2-svc${i}-title`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: def.title, htmlTag: 'h3' },
      style: { fontWeight: '700', fontSize: '1.4rem', lineHeight: '1.2', letterSpacing: '-0.025em', textAlign: 'left' as any },
    });
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || def.title } };
  };
  const getBodyEl = (i: number, def: any): WebsiteElement => {
    const id = `${section.id}-sp2-svc${i}-body`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'text',
      content: {
        text: def.desc,
        textSize: 'base',
        textLimitMode: 'lines',
        maxLines: 3,
      },
      style: { textAlign: 'left' as any, lineHeight: '1.7' },
    });
    return {
      ...base,
      content: {
        ...(base.content || {}),
        text: (existing?.content as any)?.text || def.desc,
        textLimitMode: (base.content as any)?.textLimitMode || 'lines',
        maxLines: (base.content as any)?.maxLines || 3,
        wordLimit: (base.content as any)?.wordLimit || 0,
      },
    };
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const uid = `se-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className={`w-full relative ${uid}`} style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />}
      <style>{`
        .${uid} .se-row { position:relative; transition:border-color .3s; }
        .${uid} .se-row:hover { border-color:${cardBorder} !important; }
        .${uid} .se-row:hover .se-icon { background:${accent} !important; color:#fff !important; }
        .${uid} .se-num { -webkit-text-stroke:1.5px ${cardBorder}; color:transparent; }
      `}</style>
      {svcModal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/50 border-0 cursor-default" aria-label="Close" onClick={() => setSvcModal((m) => ({ ...m, open: false }))} />
          <div className="relative z-[201] w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-6 sm:p-8 text-left" style={{ backgroundColor: cardBg }}>
            <h3 className="text-xl font-extrabold mb-3" style={{ color: titleColor }}>{svcModal.title}</h3>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: textColor }}>{svcModal.body}</div>
            <div className="mt-8 flex flex-wrap gap-3 justify-end">
              <button type="button" className="px-4 py-2 rounded-lg font-semibold text-sm border border-gray-300 bg-transparent hover:bg-gray-50" style={{ color: titleColor }} onClick={() => setSvcModal((m) => ({ ...m, open: false }))}>Close</button>
              <a href={pickPreferredLink(svcModal.href)} className="px-4 py-2 rounded-lg font-semibold text-sm no-underline inline-flex items-center" style={{ backgroundColor: accent, color: '#FFFFFF' }}>Open service page</a>
            </div>
          </div>
        </div>
      )}
      <div className={`relative z-10 ${innerClass}`} style={innerStyle}>

        {/* Header — centered */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
          <div className="inline-flex items-center gap-2.5 justify-center">
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: cardBorder }} />
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...pass} />
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: cardBorder }} />
          </div>
          <div className="mt-5"><ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} /></div>
          <div className="mt-5"><ElementsSection section={{ ...section, elements: [descEl] }} {...pass} /></div>
        </motion.div>

        {/* Numbered service rows */}
        <div className="mt-14 space-y-4">
          {items.map((svc: any, i: number) => {
            const d = DEFAULT_SERVICES[i % DEFAULT_SERVICES.length];
            const def = {
              icon:  svc.icon || d.icon,
              title: svc.title || d.title,
              desc:  String(svc.fullDescription || svc.description || svc.desc || '').trim() || d.desc,
              link:  toServiceHref(svc, svc.title || d.title),
            };
            const listItems: string[] = Array.isArray(svc.items) && svc.items.length ? svc.items.map((it: any) => String(it?.text ?? it ?? '').trim()).filter(Boolean) : d.items;
            const cardId = svc.id || `sp2-svc-${i}`;
            return (
              <motion.div key={cardId}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
                className="se-row group relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 md:gap-8 items-start rounded-2xl p-6 md:p-8"
                style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>

                {/* index + icon */}
                <div className="flex items-center gap-4 md:flex-col md:items-center md:gap-3">
                  <span aria-hidden className="se-num text-5xl font-extrabold leading-none select-none">{String(i + 1).padStart(2, '0')}</span>
                  <span className="se-icon inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-300" style={{ border: `1px solid ${cardBorder}`, backgroundColor: `${accent}12`, color: accent }}>
                    <i className={`fa-solid ${def.icon} text-[17px]`} />
                  </span>
                </div>

                {/* body */}
                <div className="min-w-0">
                  <ElementsSection section={{ ...section, elements: [getTitleEl(i, def)] }} {...pass} />
                  <div className="mt-2"><ElementsSection section={{ ...section, elements: [getBodyEl(i, def)] }} {...pass} /></div>
                  <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    {listItems.map((item, k) => (
                      <li key={k} className="flex items-center gap-2 text-[13px]" style={{ color: titleColor }}>
                        <span aria-hidden className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}1F`, color: accent }}>
                          <svg viewBox="0 0 20 20" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5 8 14.5 16 5.5" /></svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* action */}
                <div className="md:self-center">
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); if (!readOnly) return; if (serviceNavMode === 'card' && def.link !== '#') { window.location.href = def.link; } else { setSvcModal({ open: true, title: def.title, body: def.desc, href: pickPreferredLink(def.link) }); } }}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 bg-transparent border-0 cursor-pointer" style={{ color: accent }}>
                    {learnMoreText}
                    <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                  </button>
                </div>

                {isSelected && !readOnly && onSectionUpdate && items.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveCard(cardId, i); }}
                    className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110"
                    title="Remove service" aria-label="Remove service"><i className="fa-solid fa-xmark" /></button>
                )}
              </motion.div>
            );
          })}
          {isSelected && !readOnly && onSectionUpdate && (
            <button type="button" onClick={(e) => { e.stopPropagation(); handleAddCard(); }}
              className="w-full min-h-[96px] rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-3"
              style={{ borderColor: `${accent}55`, backgroundColor: `${accent}05`, color: accent }} title="Add a service">
              <i className="fa-solid fa-plus text-xl" />
              <span className="text-xs font-bold uppercase tracking-widest">Add Service</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesEditorial;
