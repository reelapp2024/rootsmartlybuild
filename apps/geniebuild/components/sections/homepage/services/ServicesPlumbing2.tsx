import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { IMAGE_BOX_DEFAULT_TITLE_HEADING, PRESET_THEMES } from '../../../../constants';
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
  /** Whether the section is selected — drives the visibility of "Add card" / per-card "Remove" tiles. */
  isSelected?: boolean;
  /** Section-level patch applied through the parent reducer; used to materialize defaults
   *  to `content.items` and to add/remove cards. */
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

/**
 * ServicesPlumbing2 — clean 3-column service card grid.
 *
 * Header (badge + heading + description) sits on top, followed by a responsive
 * grid where each card is a single sidebar-editable `image-box` element with
 * its built-in CTA button. Bottom of the section has a section-level CTA.
 *
 * Everything that's user-content goes through ElementsSection — no hardcoded
 * <h3>/<img>/<button>/<a>. Just layout chrome (motion wrappers + grid container).
 */
// Each desc kept to ~13 words so it fits cleanly on 2 lines with line-clamp.
const DEFAULT_SERVICES = [
  { img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=900&q=80', title: 'Drain Cleaning',            desc: 'Hydro-jetting clears tough blockages fast and helps prevent future clogs in your pipes.' },
  { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80', title: 'Water Heater Services',      desc: 'Install, repair or replace any water heater brand — tank or tankless options.' },
  { img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=900&q=80', title: 'Pipe Repair & Replacement',  desc: 'From small leaks to full home repiping with durable, long-lasting modern materials.' },
  { img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80', title: 'Bathroom Plumbing',          desc: 'Faucets, fixtures and complete bathroom remodels handled by our licensed plumbing team.' },
  { img: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=900&q=80', title: 'Emergency Repairs',          desc: 'Round-the-clock service for burst pipes, floods, leaks and other urgent plumbing issues.' },
  { img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=900&q=80', title: 'Leak Detection',             desc: 'Thermal imaging and acoustic sensors find hidden leaks with minimal disruption to your home.' },
];

/** Published / read-only: shorten generic AI service blurbs so cards stay readable. */
function compactServiceCardBlurb(serviceTitle: string, rawDescription: string): string {
  const title = String(serviceTitle || '').trim();
  let d = String(rawDescription || '').trim();
  if (!d) {
    return title ? `${title.charAt(0).toUpperCase() + title.slice(1)} — local installs with tidy workmanship.` : '';
  }
  if (d.toLowerCase() === title.toLowerCase()) {
    return `${title.charAt(0).toUpperCase() + title.slice(1)} — skilled installs and dependable support.`;
  }
  if (/Our team provides dependable/i.test(d) && /with a focus on quality/i.test(d)) {
    d = d
      .replace(/^Our team provides dependable\s+/i, '')
      .replace(/\s+with a focus on quality,?\s+speed,?\s+and\s+long-term value\.?/i, '')
      .replace(/\s+We tailor[\s\S]*$/i, '')
      .trim();
    d = d.charAt(0).toUpperCase() + d.slice(1);
    if (d && !d.endsWith('.')) d += '.';
    if (d.length > 160) d = d.slice(0, 157).trimEnd() + '…';
    return d || (title ? `${title.charAt(0).toUpperCase() + title.slice(1)} — quality-driven local service.` : '');
  }
  if (d.length > 220) return d.slice(0, 217).trimEnd() + '…';
  return d;
}

/** Ensure image-box titles default to H5; migrate legacy 1.125rem-only service cards. */
function normalizeImageBoxCardStyle(style: Record<string, any> | undefined): Record<string, any> {
  const s: Record<string, any> = { ...(style || {}) };
  const hadTag = !!String(s.titleHeadingTag || '').trim();
  if (!hadTag) {
    s.titleHeadingTag = IMAGE_BOX_DEFAULT_TITLE_HEADING;
    if (s.titleFontSize === '1.125rem' || !s.titleFontSize) {
      delete s.titleFontSize;
    }
  }
  return s;
}

export const ServicesPlumbing2: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  isSelected = false, onSectionUpdate,
}) => {
  const { styles } = section;
  const dataLayer =
    (section as any)?.data && typeof (section as any).data === 'object'
      ? ((section as any).data as Record<string, unknown>)
      : {};
  const content = {
    ...(section.content || ({} as Section['content'])),
    ...dataLayer,
  } as Section['content'];
  const s = styles as any;

  const [svcModal, setSvcModal] = React.useState<{
    open: boolean;
    title: string;
    body: string;
    href: string;
  }>({ open: false, title: '', body: '', href: '#' });

  const navSources = ((content as any)?.navSources || {}) as Record<string, any>;
  const navServiceItems = Array.isArray(navSources.services) ? navSources.services : [];
  const normalize = (v: unknown) =>
    String(v || '')
      .trim()
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const sanitizeSlug = (v: unknown) =>
    String(v || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  const isValidLink = (v: unknown): boolean => {
    const s = String(v || '').trim();
    return !!s && s !== '#';
  };
  const pickPreferredLink = (...candidates: unknown[]): string => {
    for (const candidate of candidates) {
      if (isValidLink(candidate)) return String(candidate).trim();
    }
    return '/services';
  };
  const toServiceHref = (svc: any, title: string | undefined): string => {
    const explicitLink =
      svc?.link ||
      svc?.href ||
      svc?.url ||
      svc?.path ||
      svc?.permalink ||
      svc?.serviceLink ||
      svc?.service_link ||
      svc?.serviceUrl ||
      svc?.service_url ||
      '';
    if (isValidLink(explicitLink)) return String(explicitLink).trim();

    const explicitSlug =
      svc?.slug ||
      svc?.serviceSlug ||
      svc?.service_slug ||
      svc?.serviceNameSlug ||
      svc?.service_name_slug ||
      '';
    const cleanedExplicitSlug = sanitizeSlug(explicitSlug);
    if (cleanedExplicitSlug) return `/services/${cleanedExplicitSlug}`;

    const normTitle = normalize(title || svc?.title || svc?.name || svc?.service_name);
    if (normTitle && navServiceItems.length) {
      const match = navServiceItems.find((row: any) => {
        const label = normalize(row?.label || row?.name || row?.title || '');
        return label && label === normTitle;
      });
      const fromNav = match?.link || match?.url || '';
      if (isValidLink(fromNav)) return String(fromNav).trim();
    }

    return '/services';
  };

  // Light-palette tokens (Services section is white-bg by default)
  const lc = tc?.light || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = lc.titleColor || '#111827';
  const textColor  = lc.textColor  || '#4B5563';
  const cardBg     = lc.cardBackgroundColor || '#FFFFFF';
  const btnBg      = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText    = (lc.buttonTextColor as string)       || tc?.buttonTextColor       || '#FFFFFF';

  // Section background — white by default; user-custom (non-theme) wins
  const savedBg = s.backgroundColor;
  const isThemeSurface = (() => {
    if (!savedBg || typeof savedBg !== 'string') return true;
    const norm = savedBg.trim().toLowerCase();
    return PRESET_THEMES.some(t => {
      const dark = (t.elements?.surface || '').toLowerCase();
      const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
      return norm === dark || norm === light;
    });
  })();
  const bg = isThemeSurface ? '#FFFFFF' : savedBg;

  // Padding accepts both Tailwind classes and raw CSS values
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

  // Services list — read from content.items, fallback to defaults
  const itemsAreMaterialized = Array.isArray(content.items) && content.items.length > 0;
  const items = itemsAreMaterialized ? (content.items as any[]) : DEFAULT_SERVICES;
  const serviceNavMode: 'card' | 'button' = (content as any).serviceNavMode === 'card' ? 'card' : 'button';
  const learnMoreText: string = String((content as any).learnMoreText || '').trim() || 'Learn More';

  // Materialize defaults to content.items on first edit so add/remove operate on real data.
  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return items;
    if (!onSectionUpdate) return items;
    const seeded = DEFAULT_SERVICES.map((s, i) => ({
      id: `sp2-svc-${i}`,
      title: s.title,
      description: s.desc,
      imageUrl: s.img,
    }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };

  const handleAddCard = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = DEFAULT_SERVICES[current.length % DEFAULT_SERVICES.length];
    const newItem = {
      id: `sp2-svc-${Date.now()}`,
      title: 'New Service',
      description: 'Add a description for this service.',
      imageUrl: fallback.img,
    };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };

  const handleRemoveCard = (cardId: string, idx: number) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any, i: number) => (it.id ? it.id !== cardId : i !== idx));
    // Drop any per-card image-box element override stored under the same idx-based id
    const elementIdToRemove = `${section.id}-sp2-svc${idx}`;
    const nextElements = (section.elements || []).filter((e) => e.id !== elementIdToRemove);
    onSectionUpdate(section.id, {
      content: { ...content, items: next },
      elements: nextElements,
    });
  };

  // Theme tokens forwarded to ElementsSection
  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    secondaryHeadingColor: accent,
    cardBackgroundColor: cardBg,
    buttonBackgroundColor: btnBg,
    buttonTextColor: btnText,
  };

  // ── Editable elements ─────────────────────────────────────────────
  // Template sections often persist header *elements* (plumbing defaults). Resolved
  // SectionContent / API fields live on `section.content` and `section.data` — when
  // those have copy, prefer them over saved elements (GenieBuild canvas is not read-only).
  const badgeFound = section.elements?.find((e) => e.id === `${section.id}-sp2-badge`);
  let badgeEl: WebsiteElement =
    badgeFound || {
    id: `${section.id}-sp2-badge`, type: 'badge',
    content: {
      text: content.badgeText || 'What We Do',
      icon: 'fa-tools', iconPosition: 'left', iconSize: '0.65rem',
    },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
      backgroundColor: `${accent}1A`,
      color: accent,
    },
  };

  const titleFound = section.elements?.find((e) => e.id === `${section.id}-sp2-title`);
  let titleEl: WebsiteElement =
    titleFound || {
    id: `${section.id}-sp2-title`, type: 'heading',
    content: {
      text: content.title || 'Our Plumbing Services',
      textBefore: 'Our Plumbing',
      highlightedText: 'Services',
      textAfter: '',
      htmlTag: 'h2',
    },
    style: {
      textAlign: 'center' as any, fontWeight: '800',
      fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
      lineHeight: '1.15',
    },
  };

  const descFound = section.elements?.find((e) => e.id === `${section.id}-sp2-desc`);
  let descEl: WebsiteElement =
    descFound || {
    id: `${section.id}-sp2-desc`, type: 'text',
    content: {
      text: content.description || content.subtitle || 'Honest, fast and reliable service for every plumbing need.',
      textSize: 'large',
    },
    style: { textAlign: 'center' as any, maxWidth: '640px', margin: '0 auto', lineHeight: '1.65' },
  };

  const apiBadge = String(content.badgeText ?? '').trim();
  if (apiBadge) {
    badgeEl = {
      ...badgeEl,
      content: { ...(badgeEl.content as any), text: apiBadge },
    };
  }
  const apiTitle = String(
    content.title ?? (content as any).heading ?? (content as any).sectionTitle ?? ''
  ).trim();
  if (apiTitle) {
    titleEl = {
      ...titleEl,
      content: {
        ...(titleEl.content as any),
        text: apiTitle,
        textBefore: '',
        highlightedText: '',
        textAfter: '',
        htmlTag: (titleEl.content as any)?.htmlTag || 'h2',
      },
    };
  }
  const apiDesc = String(
    content.description ?? content.subtitle ?? (content as any).descriptionText ?? ''
  ).trim();
  if (apiDesc) {
    descEl = {
      ...descEl,
      content: { ...(descEl.content as any), text: apiDesc, textSize: (descEl.content as any)?.textSize || 'large' },
    };
  }

  // Per-service image-box card (image top + title + description + Learn More button)
  const getServiceCardEl = (i: number, def: { img: string; title: string; desc: string; link?: string }): WebsiteElement => {
    const id = `${section.id}-sp2-svc${i}`;
    const cardDesc =
      readOnly || itemsAreMaterialized ? compactServiceCardBlurb(def.title, def.desc) : def.desc;
    const existing = section.elements?.find((e) => e.id === id);
    if (existing) {
      const ec = (existing.content || {}) as any;
      const imgOut = readOnly
        ? (String(def.img || ec.imageUrl || '').trim() || ec.imageUrl)
        : (String(ec.imageUrl || def.img || '').trim() || def.img);
      const titleOut = readOnly
        ? (String(def.title || ec.text || ec.title || '').trim() || def.title)
        : (String(ec.text || ec.title || def.title || '').trim() || def.title);
      const descOut = readOnly
        ? (String(cardDesc || ec.description || ec.subText || '').trim() || cardDesc)
        : (String(ec.description || ec.subText || cardDesc || '').trim() || cardDesc);
      const linkOut = String(ec.buttonLink || ec.link || def.link || '#').trim() || '#';
      const cardLinkOut = serviceNavMode === 'card' ? linkOut : '#';
      return {
        ...existing,
        type: 'image-box',
        content: {
          ...ec,
          imageUrl: imgOut,
          text: titleOut,
          title: titleOut,
          description: descOut,
          subText: descOut,
          link: cardLinkOut,
          buttonLink: linkOut,
          buttonText: ec.buttonText || learnMoreText,
          showButton: serviceNavMode === 'card' ? false : (ec.showButton !== false),
        } as any,
        style: normalizeImageBoxCardStyle(existing.style as Record<string, any>),
      };
    }
    return {
      id, type: 'image-box',
      content: {
        imageUrl: def.img,
        text: def.title,
        title: def.title,
        description: cardDesc,
        subText: cardDesc,
        link: serviceNavMode === 'card' ? (def.link || '#') : '#',
        linkNewTab: true,
        showButton: serviceNavMode !== 'card',
        buttonText: learnMoreText,
        buttonLink: def.link || '#',
        buttonNewTab: true,
      } as any,
      style: {
        backgroundColor: 'transparent',
        borderRadius: '0.875rem',
        borderWidth: '0px',
        borderColor: 'transparent',
        contentPadding: '1rem 0 0',
        contentGap: '1rem',
        imageContentGap: '1rem',
        imageHeight: '12rem',
        imageObjectFit: 'cover',
        titleColor,
        titleHeadingTag: IMAGE_BOX_DEFAULT_TITLE_HEADING,
        titleFontWeight: '700',
        descriptionColor: textColor,
        descriptionFontSize: '0.875rem',
        descriptionLineClamp: 2,
        // Button as simple link — text-with-URL, accent-colored
        buttonVariant: 'link',
        buttonTextColor: accent,
        buttonFontSize: '0.875rem',
        buttonFontWeight: 600,
      } as any,
    };
  };

  // Section-level CTA button (only when content.ctaText is set)
  const ctaText: string = (content as any).ctaText || '';
  const ctaBtnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sp2-cta`) || {
    id: `${section.id}-sp2-cta`, type: 'button',
    content: { text: ctaText || 'View All Services', link: (content as any).ctaHref || '#', buttonVariant: 'primary' },
    style: {
      backgroundColor: btnBg, color: btnText,
      padding: '0.875rem 1.75rem', borderRadius: '0.5rem',
      fontWeight: '700', fontSize: '1rem',
    },
  };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      {svcModal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={`${section.id}-svc-modal-title`}>
          <button
            type="button"
            className="absolute inset-0 bg-black/50 border-0 cursor-default"
            aria-label="Close dialog backdrop"
            onClick={() => setSvcModal((m) => ({ ...m, open: false }))}
          />
          <div
            className="relative z-[201] w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-6 sm:p-8 text-left"
            style={{ backgroundColor: cardBg, color: textColor }}
          >
            <h3 id={`${section.id}-svc-modal-title`} className="text-xl font-extrabold mb-3" style={{ color: titleColor }}>
              {svcModal.title}
            </h3>
            {/<\s*p[\s>]|<\s*br\s*\/?>/i.test(svcModal.body) ? (
              <div
                className="text-sm leading-relaxed prose prose-sm max-w-none"
                style={{ color: textColor }}
                dangerouslySetInnerHTML={{ __html: svcModal.body }}
              />
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: textColor }}>
                {svcModal.body}
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg font-semibold text-sm border border-gray-300 bg-transparent hover:bg-gray-50"
                style={{ color: titleColor }}
                onClick={() => setSvcModal((m) => ({ ...m, open: false }))}
              >
                Close
              </button>
              <a
                href={pickPreferredLink(svcModal.href)}
                className="px-4 py-2 rounded-lg font-semibold text-sm no-underline inline-flex items-center"
                style={{ backgroundColor: btnBg, color: btnText }}
              >
                Open service page
              </a>
            </div>
          </div>
        </div>
      )}
      <div className={innerClass} style={innerStyle}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
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

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-10 sm:mb-14"
        >
          <ElementsSection section={{ ...section, elements: [descEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* ── Services grid ──────────────────────────────────────── */}
        {/* Columns: styles.columns (1-4), default 3.
            Mobile (<sm) is always 1 col. Tablet (sm) caps at 2 cols.
            Desktop (lg) hits the user-set columns count. */}
        {(() => {
          const cols = Math.max(1, Math.min(4, parseInt(String(s.columns), 10) || 3));
          const tabletCols = Math.min(2, cols);
          const gridId = `sp2-grid-${section.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          return (
            <>
              <style>{`
                #${gridId} { grid-template-columns: repeat(1, minmax(0, 1fr)); }
                @media (min-width: 640px) { #${gridId} { grid-template-columns: repeat(${tabletCols}, minmax(0, 1fr)); } }
                @media (min-width: 1024px) { #${gridId} { grid-template-columns: repeat(${cols}, minmax(0, 1fr)); } }
              `}</style>
              <div id={gridId} className="grid gap-6">
          {items.map((svc: any, i: number) => {
            const fullDescription = String(
              svc.fullDescription || svc.about_service_full || svc.about_service || svc.description || svc.desc || ''
            ).trim() || DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].desc;
            const def = {
              img:   svc.imageUrl   || svc.img   || DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].img,
              title: svc.title      || DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].title,
              desc: fullDescription,
              link:  toServiceHref(svc, svc.title || DEFAULT_SERVICES[i % DEFAULT_SERVICES.length].title),
            };
            const cardId = svc.id || `sp2-svc-${i}`;
            return (
              <motion.div
                key={cardId}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="relative group/item"
              >
                {serviceNavMode === 'card' && readOnly && def.link && def.link !== '#' ? (
                  <a href={def.link} className="block no-underline text-inherit" style={{ cursor: 'pointer' }}>
                    <ElementsSection
                      section={{ ...section, elements: [getServiceCardEl(i, def)] }}
                      onTextEdit={onTextEdit}
                      onElementUpdate={onElementUpdate || (() => {})}
                      onElementSelect={onElementSelect}
                      selectedElementId={selectedElementId}
                      readOnly={readOnly}
                      isWrapped={false}
                      buttonClass={buttonClass}
                      themeColors={themeColors}
                    />
                  </a>
                ) : (
                  <div
                    onClick={(e) => {
                      if (!readOnly || serviceNavMode === 'card') return;
                      const target = e.target as HTMLElement | null;
                      if (target?.closest('a,button,input,select,textarea,[role="button"]')) return;
                      setSvcModal({
                        open: true,
                        title: def.title,
                        body: fullDescription,
                        href: pickPreferredLink(def.link),
                      });
                    }}
                    style={{ cursor: readOnly && serviceNavMode !== 'card' ? 'pointer' : undefined }}
                  >
                    <ElementsSection
                      section={{ ...section, elements: [getServiceCardEl(i, def)] }}
                      onTextEdit={onTextEdit}
                      onElementUpdate={onElementUpdate || (() => {})}
                      onElementSelect={onElementSelect}
                      selectedElementId={selectedElementId}
                      readOnly={readOnly}
                      isWrapped={false}
                      buttonClass={buttonClass}
                      themeColors={themeColors}
                      publishedImageBoxDetailHandler={
                        serviceNavMode !== 'card' && String(fullDescription).trim().length > 0
                          ? (p) =>
                              setSvcModal({
                                open: true,
                                title: p.title || def.title,
                                body: fullDescription,
                                href: pickPreferredLink((p as any)?.href, (p as any)?.link, def.link),
                              })
                          : undefined
                      }
                    />
                  </div>
                )}
                {isSelected && !readOnly && onSectionUpdate && items.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveCard(cardId, i); }}
                    className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover/item:opacity-100 transition-all flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110"
                    title="Remove card"
                    aria-label="Remove card"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </motion.div>
            );
          })}

          {/* Add-card tile — only when section is selected */}
          {isSelected && !readOnly && onSectionUpdate && (
            <motion.button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleAddCard(); }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="min-h-[280px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 hover:scale-[1.02]"
              style={{
                borderColor: `${accent}55`,
                backgroundColor: `${accent}05`,
                color: accent,
              }}
              title="Add a new service card"
            >
              <i className="fa-solid fa-plus text-2xl" />
              <span className="text-xs font-bold uppercase tracking-widest">Add Card</span>
            </motion.button>
          )}
              </div>
            </>
          );
        })()}

        {/* ── Optional bottom CTA ───────────────────────────────── */}
        {ctaText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mt-10 sm:mt-14"
          >
            <div style={{ width: 'max-content' }}>
              <ElementsSection
                section={{ ...section, elements: [ctaBtnEl] }}
                onTextEdit={onTextEdit}
                onElementUpdate={onElementUpdate || (() => {})}
                onElementSelect={onElementSelect}
                selectedElementId={selectedElementId}
                readOnly={readOnly}
                isWrapped={false}
                buttonClass={buttonClass}
                themeColors={themeColors}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
