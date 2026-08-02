import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionBackground, resolveSectionOverlay, sectionBgHasImage } from '../utils/sectionBackground';
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
  isSelected?: boolean;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

/**
 * ServicesCardsNext — alternate `services` variant (light cards, ref: ServicesNext).
 *
 * Left-aligned header, then a 3-col grid of tall cards. Each card: mono
 * code · label, icon tile, title, body, a ticked items list, and a footer with
 * a "price" pill + a "Learn more →" link. Colors from theme (`tc.light`),
 * nothing hardcoded.
 *
 * Builder-compatible: header (badge/title/desc) + per-service title/body/items
 * are editable; add/remove + service-nav/modal preserved. Element ids reuse the
 * `sp2-` prefix so content carries over on variant switch. code/label/price are
 * static defaults per item (make dynamic later).
 */
const DEFAULT_SERVICES = [
  { icon: 'fa-wrench',   code: 'S.01', label: 'Most booked',  title: 'Repairs & callouts', desc: 'Something has stopped working and you need it sorted today. We keep emergency slots free every day.', items: ['Same-day emergency slots', 'Fault finding & diagnosis', 'Parts carried on the van', 'Evening & weekend cover'], price: 'Free callout' },
  { icon: 'fa-layer-group', code: 'S.02', label: 'Planned work', title: 'Installations & upgrades', desc: 'Bigger jobs booked in for a date that suits you. We survey first, quote a fixed price, and agree the schedule.', items: ['Free on-site survey', 'Fixed written quote', 'Agreed start & finish dates', 'All waste removed'], price: 'Quoted per job' },
  { icon: 'fa-calendar-check', code: 'S.03', label: 'Stay ahead', title: 'Servicing & maintenance', desc: 'A yearly check that catches small problems before they turn into expensive ones, with a written report.', items: ['Annual safety check', 'Written condition report', 'Priority booking for members', 'Reminders so nothing lapses'], price: 'Annual plan' },
];

export const ServicesCardsNext: React.FC<Props> = ({
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
  const surface    = '#FAFAF9';
  const learnMoreText: string = String((content as any).learnMoreText || '').trim() || 'Learn more';

  const defaultSurface = (lc as any).surface || lc.cardBackgroundColor || surface;
  const sectionBg = resolveSectionBackground(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop  ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1240px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
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
    const seeded = DEFAULT_SERVICES.map((sv, i) => ({ id: `sp2-svc-${i}`, code: sv.code, label: sv.label, title: sv.title, description: sv.desc, icon: sv.icon, items: sv.items, price: sv.price }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };
  const handleAddCard = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = DEFAULT_SERVICES[current.length % DEFAULT_SERVICES.length];
    const newItem = { id: `sp2-svc-${Date.now()}`, code: `S.0${current.length + 1}`, label: 'New', title: 'New Service', description: 'Add a description for this service.', icon: fallback.icon, items: ['Detail one', 'Detail two'], price: 'Quoted' };
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

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: titleColor };

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sp2-badge`) || {
    id: `${section.id}-sp2-badge`, type: 'badge',
    content: { text: content.badgeText || 'What we do', iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase' as any, padding: '0', borderRadius: '0', textAlign: 'left' as any, backgroundColor: 'transparent', color: mutedColor },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-sp2-title`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          htmlTag: (existing.content as any)?.htmlTag || 'h2',
        },
        style: {
          color: titleColor,
          fontWeight: '800',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          lineHeight: '1.08',
          letterSpacing: '-0.035em',
          textAlign: 'left' as any,
          ...(existing.style as any),
        },
      };
    }
    const src = content.title || 'Straightforward services, priced up front.';
    return {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.08', letterSpacing: '-0.035em', textAlign: 'left' as any },
    };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sp2-desc`) || {
    id: `${section.id}-sp2-desc`, type: 'text',
    content: { text: content.description || content.subtitle || 'Whatever you need doing, you get the same deal: a clear written quote before we start, a tidy job, and a guarantee in writing.', textSize: 'large' },
    style: { color: textColor, textAlign: 'left' as any, maxWidth: '620px', lineHeight: '1.75' },
  };

  const getTitleEl = (i: number, def: any): WebsiteElement => {
    const id = `${section.id}-sp2-svc${i}-title`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: def.title, htmlTag: 'h3' },
      style: { color: titleColor, fontWeight: '700', fontSize: '1.35rem', lineHeight: '1.2', letterSpacing: '-0.025em', textAlign: 'left' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || def.title } };
  };
  const getBodyEl = (i: number, def: any): WebsiteElement => {
    const id = `${section.id}-sp2-svc${i}-body`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = existing || {
      id, type: 'text',
      content: { text: def.desc, textSize: 'base' },
      style: { color: textColor, textAlign: 'left' as any, lineHeight: '1.7' },
    };
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || def.desc } };
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const uid = `sc-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className={`w-full relative ${uid}`} style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />}
      {/* Card hover: neutral border + subtle lift (restrained palette) */}
      <style>{`
        .${uid} .sc-card { position:relative; transition:border-color .3s, transform .3s, box-shadow .3s; }
        .${uid} .sc-card:hover { border-color:rgba(0,0,0,0.18) !important; transform:translateY(-4px); box-shadow:0 18px 40px -22px rgba(0,0,0,0.18); }
        .${uid} .sc-card:hover .sc-icon { border-color:rgba(0,0,0,0.18) !important; }
      `}</style>
      {svcModal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/50 border-0 cursor-default" aria-label="Close" onClick={() => setSvcModal((m) => ({ ...m, open: false }))} />
          <div className="relative z-[201] w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-6 sm:p-8 text-left" style={{ backgroundColor: cardBg, color: textColor }}>
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

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-[720px]">
          <div className="inline-flex items-center gap-2.5">
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: cardBorder }} />
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...pass} />
          </div>
          <div className="mt-5"><ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} /></div>
          <div className="mt-6"><ElementsSection section={{ ...section, elements: [descEl] }} {...pass} /></div>
        </motion.div>

        {/* Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((svc: any, i: number) => {
            const d = DEFAULT_SERVICES[i % DEFAULT_SERVICES.length];
            const def = {
              icon:  svc.icon || d.icon,
              code:  svc.code || d.code,
              label: svc.label || d.label,
              title: svc.title || d.title,
              desc:  String(svc.fullDescription || svc.description || svc.desc || '').trim() || d.desc,
              price: svc.price || d.price,
              link:  toServiceHref(svc, svc.title || d.title),
            };
            const listItems: string[] = Array.isArray(svc.items) && svc.items.length ? svc.items.map((it: any) => String(it?.text ?? it ?? '').trim()).filter(Boolean) : d.items;
            const cardId = svc.id || `sp2-svc-${i}`;
            return (
              <motion.div key={cardId}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
                onPointerMove={(e) => { const el = e.currentTarget; const r = el.getBoundingClientRect(); el.style.setProperty('--sx', `${e.clientX - r.left}px`); el.style.setProperty('--sy', `${e.clientY - r.top}px`); }}
                className="sc-card group relative flex h-full flex-col overflow-hidden rounded-2xl p-7"
                style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-[0.18em] font-mono" style={{ color: textColor }}>{def.code} · {def.label}</span>
                  <span className="sc-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200" style={{ border: `1px solid ${cardBorder}`, backgroundColor: '#FFFFFF', color: accent }}>
                    <i className={`fa-solid ${def.icon} text-[16px]`} />
                  </span>
                </div>
                <div className="mt-6"><ElementsSection section={{ ...section, elements: [getTitleEl(i, def)] }} {...pass} /></div>
                <div className="mt-3"><ElementsSection section={{ ...section, elements: [getBodyEl(i, def)] }} {...pass} /></div>
                <ul className="mt-6 space-y-2.5">
                  {listItems.map((item, k) => (
                    <li key={k} className="flex items-start gap-2.5 text-[13px] leading-[1.5]" style={{ color: titleColor }}>
                      <span aria-hidden className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}1F`, color: accent }}>
                        <svg viewBox="0 0 20 20" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5 8 14.5 16 5.5" /></svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-3 pt-7">
                  {def.price ? (
                    <span className="rounded-full px-3 py-1.5 text-[12px] font-medium" style={{ border: `1px solid ${cardBorder}`, backgroundColor: '#FFFFFF', color: titleColor }}>{def.price}</span>
                  ) : <span />}
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); if (!readOnly) return; if (serviceNavMode === 'card' && def.link !== '#') { window.location.href = def.link; } else { setSvcModal({ open: true, title: def.title, body: def.desc, href: pickPreferredLink(def.link) }); } }}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors duration-200 bg-transparent border-0 cursor-pointer" style={{ color: accent }}>
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
            <motion.button type="button" onClick={(e) => { e.stopPropagation(); handleAddCard(); }}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="min-h-[300px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3"
              style={{ borderColor: `${accent}55`, backgroundColor: `${accent}05`, color: accent }} title="Add a service">
              <i className="fa-solid fa-plus text-2xl" />
              <span className="text-xs font-bold uppercase tracking-widest">Add Service</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesCardsNext;
