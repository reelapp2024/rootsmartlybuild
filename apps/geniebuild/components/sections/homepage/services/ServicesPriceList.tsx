import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl, toDisplayImageUrl, SECTION_IMAGE_PLACEHOLDER } from '../utils/sectionImageResolve';
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
 * ServicesPriceList — alternate `services` variant (editorial "menu" rows + thumbnails).
 *
 * Design reference: a local-business template's services section — services as
 * horizontal rows divided by thin rules instead of an image-card grid. Improved
 * here with a per-row thumbnail IMAGE and an accent left-rail on hover:
 *   [ thumbnail ] · [ icon + name + description + detail tags ]
 * Header and rows share the same container edge so everything aligns.
 *
 * SAME content source (content.items), theme tokens, add/remove behaviour and
 * service-nav/modal logic as ServicesPlumbing2. Element ids reuse the `sp2-`
 * prefix so header + per-service content carry over on variant switch. Detail
 * tags + row images are editable sub-elements stored per item.
 */
const DEFAULT_SERVICES = [
  { img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80', icon: 'fa-faucet-drip',     title: 'Drain Cleaning',           desc: 'Hydro-jetting clears tough blockages fast and helps prevent future clogs in your pipes.', tags: ['Hydro-jetting', 'Camera inspection', 'Root removal', 'Snaking', 'Grease traps', 'Storm drains', 'Sewer lines', 'Preventive'] },
  { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', icon: 'fa-fire',            title: 'Water Heater Services',    desc: 'Install, repair or replace any water heater brand — tank or tankless options.', tags: ['Tankless', 'Tank', 'Repair', 'Replacement', 'Same-day', 'Gas', 'Electric', 'Warranty'] },
  { img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80', icon: 'fa-wrench',        title: 'Pipe Repair & Replacement', desc: 'From small leaks to full home repiping with durable, long-lasting modern materials.', tags: ['Repiping', 'Leak fix', 'PEX', 'Copper', 'Slab leaks', 'Burst pipes', 'Fittings', 'Insulation'] },
  { img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80', icon: 'fa-bath',           title: 'Bathroom Plumbing',        desc: 'Faucets, fixtures and complete bathroom remodels handled by our licensed plumbing team.', tags: ['Faucets', 'Fixtures', 'Toilets', 'Showers', 'Remodels', 'Vanities', 'Drains', 'Sealing'] },
  { img: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&q=80', icon: 'fa-triangle-exclamation', title: 'Emergency Repairs',  desc: 'Round-the-clock service for burst pipes, floods, leaks and other urgent plumbing issues.', tags: ['24/7', 'Burst pipes', 'Flooding', 'Leaks', 'Fast response', 'Weekends', 'Holidays', 'On-call'] },
  { img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80', icon: 'fa-magnifying-glass', title: 'Leak Detection',        desc: 'Thermal imaging and acoustic sensors find hidden leaks with minimal disruption to your home.', tags: ['Thermal imaging', 'Acoustic', 'Non-invasive', 'Slab leaks', 'Wall leaks', 'Water bill', 'Reports', 'Accurate'] },
];

function compactServiceCardBlurb(serviceTitle: string, rawDescription: string): string {
  const title = String(serviceTitle || '').trim();
  let d = String(rawDescription || '').trim();
  if (!d) return title ? `${title.charAt(0).toUpperCase() + title.slice(1)} — local installs with tidy workmanship.` : '';
  if (d.toLowerCase() === title.toLowerCase()) return `${title.charAt(0).toUpperCase() + title.slice(1)} — skilled installs and dependable support.`;
  if (d.length > 220) return d.slice(0, 217).trimEnd() + '…';
  return d;
}

export const ServicesPriceList: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  isSelected = false, onSectionUpdate,
}) => {
  const { styles } = section;
  const dataLayer =
    (section as any)?.data && typeof (section as any).data === 'object'
      ? ((section as any).data as Record<string, unknown>) : {};
  const content = { ...(section.content || ({} as Section['content'])), ...dataLayer } as Section['content'];
  const s = styles as any;

  const [svcModal, setSvcModal] = React.useState<{ open: boolean; title: string; body: string; href: string }>({ open: false, title: '', body: '', href: '#' });

  // ── service-nav / link resolution (mirrors ServicesPlumbing2) ──
  const navSources = ((content as any)?.navSources || {}) as Record<string, any>;
  const navServiceItems = Array.isArray(navSources.services) ? navSources.services : [];
  const normalize = (v: unknown) => String(v || '').trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
  const sanitizeSlug = (v: unknown) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const isValidLink = (v: unknown): boolean => { const x = String(v || '').trim(); return !!x && x !== '#'; };
  const pickPreferredLink = (...candidates: unknown[]): string => {
    for (const c of candidates) if (isValidLink(c)) return String(c).trim();
    return '/services';
  };
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

  // ── light palette tokens ──
  const lc = tc?.light || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = lc.titleColor || '#111827';
  const textColor  = lc.textColor  || '#4B5563';
  const cardBg     = lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = (lc as any).cardBorderColor || 'rgba(0,0,0,0.08)';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';
  const btnBg      = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText    = (lc.buttonTextColor as string)       || tc?.buttonTextColor       || '#FFFFFF';

  const defaultSurface = lc.surface || (lc as any).cardBackgroundColor || '#FFFFFF';
  const sectionBg = resolveSectionBackground(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  // Single shared container (max-w-7xl matches the other homepage sections)
  // so header + rows align to the exact same left/right edges.
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  // ── items ──
  const itemsAreMaterialized = Array.isArray(content.items) && content.items.length > 0;
  const items = itemsAreMaterialized ? (content.items as any[]) : DEFAULT_SERVICES;
  const serviceNavMode: 'card' | 'button' = (content as any).serviceNavMode === 'card' ? 'card' : 'button';

  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return items;
    if (!onSectionUpdate) return items;
    const seeded = DEFAULT_SERVICES.map((sv, i) => ({ id: `sp2-svc-${i}`, title: sv.title, description: sv.desc, icon: sv.icon, imageUrl: sv.img, tags: sv.tags }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };

  const handleAddCard = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = DEFAULT_SERVICES[current.length % DEFAULT_SERVICES.length];
    const newItem = { id: `sp2-svc-${Date.now()}`, title: 'New Service', description: 'Add a description for this service.', icon: fallback.icon, imageUrl: fallback.img, tags: ['Detail', 'Detail'] };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };

  const handleRemoveCard = (cardId: string, idx: number) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any, i: number) => (it.id ? it.id !== cardId : i !== idx));
    const idsToRemove = new Set([
      `${section.id}-sp2-svc${idx}`,
      `${section.id}-sp2-svc${idx}-img`,
      `${section.id}-sp2-svc${idx}-name`,
      `${section.id}-sp2-svc${idx}-desc`,
    ]);
    const nextElements = (section.elements || []).filter((e) => !idsToRemove.has(e.id) && !e.id.startsWith(`${section.id}-sp2-svc${idx}-tag`));
    onSectionUpdate(section.id, { content: { ...content, items: next }, elements: nextElements });
  };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent,
    cardBackgroundColor: cardBg, buttonBackgroundColor: btnBg, buttonTextColor: btnText,
  };

  // ── header elements (same ids as ServicesPlumbing2) ──
  const badgeFound = section.elements?.find((e) => e.id === `${section.id}-sp2-badge`);
  let badgeEl: WebsiteElement = badgeFound || {
    id: `${section.id}-sp2-badge`, type: 'badge',
    content: { text: content.badgeText || 'Services', icon: 'fa-tools', iconPosition: 'left', iconSize: '0.65rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px', textAlign: 'center' as any, backgroundColor: cardBorder, color: mutedColor },
  };

  const titleFound = section.elements?.find((e) => e.id === `${section.id}-sp2-title`);
  let titleEl: WebsiteElement = titleFound || {
    id: `${section.id}-sp2-title`, type: 'heading',
    content: { text: content.title || 'Our Plumbing Services', htmlTag: 'h2' },
    style: { textAlign: 'left' as any, fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', color: titleColor },
  };

  const descFound = section.elements?.find((e) => e.id === `${section.id}-sp2-desc`);
  let descEl: WebsiteElement = descFound || {
    id: `${section.id}-sp2-desc`, type: 'text',
    content: { text: content.description || content.subtitle || 'Honest, fast and reliable service for every plumbing need.', textSize: 'large' },
    style: { textAlign: 'left' as any, maxWidth: '620px', lineHeight: '1.65' },
  };

  // SectionContent seeds defaults only. Once an element exists in section.elements
  // (sidebar / canvas edits), it is the source of truth — never wipe highlight parts.
  if (!badgeFound) {
    const apiBadge = String(content.badgeText ?? '').trim();
    if (apiBadge) badgeEl = { ...badgeEl, content: { ...(badgeEl.content as any), text: apiBadge } };
  }
  if (!titleFound) {
    const apiTitle = String(content.title ?? (content as any).heading ?? (content as any).sectionTitle ?? '').trim();
    if (apiTitle) {
      titleEl = {
        ...titleEl,
        content: {
          ...(titleEl.content as any),
          text: apiTitle,
          htmlTag: (titleEl.content as any)?.htmlTag || 'h2',
        },
      };
    }
  }
  if (!descFound) {
    const apiDesc = String(content.description ?? content.subtitle ?? (content as any).descriptionText ?? '').trim();
    if (apiDesc) {
      descEl = {
        ...descEl,
        content: {
          ...(descEl.content as any),
          text: apiDesc,
          textSize: (descEl.content as any)?.textSize || 'large',
        },
      };
    }
  }

  // ── per-service editable sub-elements ──
  const hideAllIcons = !!(content as any).hideIcons;

  const resolveRowImage = (i: number, svc: any): string => {
    const url = resolveSectionImageUrl(section, { elementId: `${section.id}-sp2-svc${i}-img`, elementImageUrl: svc?.imageUrl || svc?.img });
    if (url && url !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(url);
    return DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].img;
  };

  const getNameEl = (i: number, def: { icon: string; title: string }): WebsiteElement => {
    const id = `${section.id}-sp2-svc${i}-name`;
    const existing = section.elements?.find((e) => e.id === id);
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          htmlTag: (existing.content as any)?.htmlTag || 'h3',
        },
        style: {
          fontWeight: '700',
          fontSize: '1.25rem',
          lineHeight: '1.25',
          textAlign: 'left' as any,
          ...(existing.style || {}),
        },
      };
    }
    return {
      id, type: 'heading',
      content: { text: def.title, htmlTag: 'h3' },
      style: { fontWeight: '700', fontSize: '1.25rem', lineHeight: '1.25', textAlign: 'left' as any },
    };
  };

  const getDescEl = (i: number, def: { title: string; desc: string }): WebsiteElement => {
    const id = `${section.id}-sp2-svc${i}-desc`;
    const existing = section.elements?.find((e) => e.id === id);
    const resolved = readOnly || itemsAreMaterialized ? compactServiceCardBlurb(def.title, def.desc) : def.desc;
    if (existing) {
      return {
        ...existing,
        type: 'text',
        content: {
          ...(existing.content || {}),
          textSize: (existing.content as any)?.textSize || 'base',
        },
        style: {
          textAlign: 'left' as any,
          lineHeight: '1.6',
          color: textColor,
          ...(existing.style || {}),
        },
      };
    }
    return {
      id, type: 'text',
      content: { text: resolved, textSize: 'base' },
      style: { textAlign: 'left' as any, lineHeight: '1.6', color: textColor },
    };
  };

  const ctaText: string = (content as any).ctaText || '';
  const ctaBtnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sp2-cta`) || {
    id: `${section.id}-sp2-cta`, type: 'cta-button',
    content: { text: ctaText || 'View All Services', link: (content as any).ctaHref || '#', buttonVariant: 'primary' },
    style: { backgroundColor: btnBg, color: btnText, padding: '0.875rem 1.75rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '1rem' },
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full relative" style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />}
      {svcModal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={`${section.id}-svc-modal-title`}>
          <button type="button" className="absolute inset-0 bg-black/50 border-0 cursor-default" aria-label="Close dialog backdrop" onClick={() => setSvcModal((m) => ({ ...m, open: false }))} />
          <div className="relative z-[201] w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-6 sm:p-8 text-left" style={{ backgroundColor: cardBg, color: textColor }}>
            <h3 id={`${section.id}-svc-modal-title`} className="text-xl font-extrabold mb-3" style={{ color: titleColor }}>{svcModal.title}</h3>
            {/<\s*p[\s>]|<\s*br\s*\/?>/i.test(svcModal.body) ? (
              <div className="text-sm leading-relaxed prose prose-sm max-w-none" style={{ color: textColor }} dangerouslySetInnerHTML={{ __html: svcModal.body }} />
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: textColor }}>{svcModal.body}</div>
            )}
            <div className="mt-8 flex flex-wrap gap-3 justify-end">
              <button type="button" className="px-4 py-2 rounded-lg font-semibold text-sm border border-gray-300 bg-transparent hover:bg-gray-50" style={{ color: titleColor }} onClick={() => setSvcModal((m) => ({ ...m, open: false }))}>Close</button>
              <a href={pickPreferredLink(svcModal.href)} className="px-4 py-2 rounded-lg font-semibold text-sm no-underline inline-flex items-center" style={{ backgroundColor: btnBg, color: btnText }}>Open service page</a>
            </div>
          </div>
        </div>
      )}
      <div className={`relative z-10 ${innerClass}`} style={innerStyle}>

        {/* Header — left aligned; shares the same container edge as the rows below */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8 sm:mb-12">
          <div className="mb-4 inline-flex">
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...pass} />
          </div>
          <div className="mb-3">
            <ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} />
          </div>
          <ElementsSection section={{ ...section, elements: [descEl] }} {...pass} />
        </motion.div>

        {/* Service rows — thumbnail + name/desc/tags, divided by thin rules */}
        <div style={{ borderTop: `1px solid ${cardBorder}` }}>
          {items.map((svc: any, i: number) => {
            const fullDescription = String(svc.fullDescription || svc.about_service_full || svc.about_service || svc.description || svc.desc || '').trim() || DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].desc;
            const def = {
              icon:  svc.icon || DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].icon,
              title: svc.title || DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].title,
              desc:  fullDescription,
              link:  toServiceHref(svc, svc.title || DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].title),
            };
            const tags: string[] = Array.isArray(svc.tags) && svc.tags.length
              ? svc.tags.map((t: any) => String(t?.text ?? t ?? '').trim()).filter(Boolean)
              : (DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].tags || []);
            const imageUrl = resolveRowImage(i, svc);
            const cardId = svc.id || `sp2-svc-${i}`;

            const rowInner = (
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-stretch">
                {/* Thumbnail — fills the full row height, edge to edge, image never distorts */}
                <div className="relative flex-none w-full sm:w-48 md:w-56 self-stretch min-h-[150px] rounded-2xl overflow-hidden"
                  style={{ backgroundColor: cardBg }}>
                  <img src={imageUrl} alt={def.title} loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${cardBorder}, transparent 55%)` }} />
                  {!hideAllIcons && (
                    <span className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                      style={{ backgroundColor: cardBg, color: accent }}>
                      <i className={`fa-solid ${def.icon} text-sm`} />
                    </span>
                  )}
                </div>
                {/* Name + desc + tags */}
                <div className="min-w-0 flex-1 py-0.5 flex flex-col justify-center">
                  <div className="mb-1.5">
                    <ElementsSection section={{ ...section, elements: [getNameEl(i, def)] }} {...pass} />
                  </div>
                  <ElementsSection section={{ ...section, elements: [getDescEl(i, def)] }} {...pass} />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tags.map((label, t) => (
                        <span key={t}
                          className="inline-flex items-center whitespace-nowrap text-[0.72rem] font-semibold rounded-full px-2.5 py-[3px]"
                          style={{ backgroundColor: cardBg, color: mutedColor, border: `1px solid ${cardBorder}` }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Chevron affordance */}
                <div className="hidden md:flex flex-none items-center self-center pl-2 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300" style={{ color: mutedColor }}>
                  <i className="fa-solid fa-arrow-right" />
                </div>
              </div>
            );

            return (
              <motion.div key={cardId}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.04 }}
                className="relative group/item"
                style={{ borderBottom: `1px solid ${cardBorder}` }}>
                {serviceNavMode === 'card' && readOnly && def.link && def.link !== '#' ? (
                  <a href={def.link} className="block no-underline text-inherit py-5 sm:py-6 transition-colors" style={{ cursor: 'pointer' }}>
                    {rowInner}
                  </a>
                ) : (
                  <div
                    className="py-5 sm:py-6 transition-colors"
                    onClick={(e) => {
                      if (!readOnly || serviceNavMode === 'card') return;
                      const target = e.target as HTMLElement | null;
                      if (target?.closest('a,button,input,select,textarea,[role="button"]')) return;
                      setSvcModal({ open: true, title: def.title, body: fullDescription, href: pickPreferredLink(def.link) });
                    }}
                    style={{ cursor: readOnly && serviceNavMode !== 'card' ? 'pointer' : undefined }}>
                    {rowInner}
                  </div>
                )}
                {isSelected && !readOnly && onSectionUpdate && items.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveCard(cardId, i); }}
                    className="absolute top-3 right-0 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover/item:opacity-100 transition-all flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110"
                    title="Remove service" aria-label="Remove service">
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Add-service row */}
        {isSelected && !readOnly && onSectionUpdate && (
          <motion.button type="button" onClick={(e) => { e.stopPropagation(); handleAddCard(); }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
            className="w-full mt-5 py-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:scale-[1.005]"
            style={{ borderColor: `${accent}55`, backgroundColor: `${accent}05`, color: accent }}
            title="Add a new service">
            <i className="fa-solid fa-plus" /> Add Service
          </motion.button>
        )}

        {/* Optional bottom CTA */}
        {ctaText && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }} className="flex justify-start mt-10 sm:mt-12">
            <div style={{ width: 'max-content' }}>
              <ElementsSection section={{ ...section, elements: [ctaBtnEl] }} {...pass} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ServicesPriceList;
