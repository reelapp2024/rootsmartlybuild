import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { mergeDynamicElement } from '../mergeDynamicElement';

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

const DEFAULT_QUICK_LINKS = [
  { label: 'Home', link: '/' },
  { label: 'About', link: '/#about' },
  { label: 'Services', link: '/services' },
  { label: 'Areas', link: '/areas' },
  { label: 'Contact', link: '/#contact' },
];

const DEFAULT_SERVICE_LINKS = [
  { label: 'Drain Cleaning', link: '/services/drain-cleaning' },
  { label: 'Water Heaters', link: '/services/water-heaters' },
  { label: 'Pipe Repair', link: '/services/pipe-repair' },
  { label: 'Bathroom Plumbing', link: '/services/bathroom' },
  { label: 'Emergency Repairs', link: '/services/emergency' },
];

const DEFAULT_LEGAL_LINKS = [
  { label: 'Privacy Policy', link: '/privacy' },
  { label: 'Terms of Service', link: '/terms' },
  { label: 'Sitemap', link: '/sitemap' },
];

const DEFAULT_SOCIALS = [
  { icon: 'fa-brands fa-facebook', label: 'Facebook', link: 'https://facebook.com' },
  { icon: 'fa-brands fa-instagram', label: 'Instagram', link: 'https://instagram.com' },
  { icon: 'fa-brands fa-twitter', label: 'Twitter', link: 'https://twitter.com' },
  { icon: 'fa-brands fa-youtube', label: 'YouTube', link: 'https://youtube.com' },
];

export const FooterPlumbing: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  isSelected = false, onSectionUpdate,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const accent = tc?.accentColor || '#E11D48';
  const bg = s.backgroundColor || tc?.backgroundColor || '#0A0F14';
  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor = tc?.textColor || '#94A3B8';
  const dividerCol = tc?.cardBorderColor || tc?.borderColor || 'rgba(255,255,255,0.08)';
  const surfaceBg = tc?.cardBackgroundColor || 'rgba(255,255,255,0.04)';
  const btnBg = tc?.buttonBackgroundColor || accent;
  const btnText = tc?.buttonTextColor || '#FFFFFF';

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop ?? 'pt-12 sm:pt-14 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-6 sm:pb-7';
  const padX = s.paddingX ?? 'px-4 sm:px-6 lg:px-8';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const footerLayout = c.footerLayout || {};
  const footerColumns = c.footerColumns || footerLayout.columns || {};
  const footerAbout = c.footerAbout || footerLayout.about || { showTagline: true, showSocial: true };
  const footerContact = c.footerContact || footerLayout.contact || {};
  const orderedColumns = (['about', 'quickLinks', 'services', 'contact'] as const)
    .filter((key) => footerColumns[key]?.enabled !== false)
    .sort((a, b) => Number(footerColumns[a]?.order ?? 0) - Number(footerColumns[b]?.order ?? 0));
  const columnOrder =
    orderedColumns.length > 0
      ? orderedColumns
      : (['about', 'quickLinks', 'services', 'contact'] as const);
  const colCount = columnOrder.length;
  const gridColsClass =
    colCount >= 4
      ? 'lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]'
      : colCount === 3
        ? 'lg:grid-cols-3'
        : colCount === 2
          ? 'sm:grid-cols-2'
          : 'grid-cols-1';

  const showCtaBanner: boolean = c.showCtaBanner !== false;
  const showTaglineBlock = footerAbout.showTagline !== false && Boolean(String(c.tagline || '').trim());
  const showSocialBlock = footerAbout.showSocial !== false;
  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    buttonBackgroundColor: btnBg,
    buttonTextColor: btnText,
    cardBackgroundColor: surfaceBg,
    cardBorderColor: dividerCol,
  };

  const logoMode: 'text' | 'image' = c.logoMode === 'image' ? 'image' : 'text';
  const logoTextEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-fp-logo-text`),
    `${section.id}-fp-logo-text`,
    'heading',
    { text: c.logoText || 'Logo', htmlTag: 'div', link: c.logoLink || '/' },
    { fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.01em', lineHeight: '1' }
  );
  const logoImageEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-fp-logo-image`),
    `${section.id}-fp-logo-image`,
    'image',
    {
      imageUrl: c.logoUrl || '',
      imageAlt: c.logoAlt || c.logoText || 'Logo',
      link: c.logoLink || '/',
      openInNewTab: false,
    },
    { width: '140px', height: 'auto', objectFit: 'contain' }
  );
  const toggleLogoMode = () => {
    if (readOnly || !onSectionUpdate) return;
    onSectionUpdate(section.id, { content: { ...content, logoMode: logoMode === 'text' ? 'image' : 'text' } });
  };

  const taglineEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-fp-tagline`),
    `${section.id}-fp-tagline`,
    'text',
    { text: c.tagline || '', textSize: 'small' },
    { color: textColor, fontSize: '0.875rem', lineHeight: '1.6', maxWidth: '320px', textAlign: 'left' }
  );
  const SOCIAL_ICON_BY_PLATFORM: Record<string, string> = {
    facebook: 'fa-brands fa-facebook',
    instagram: 'fa-brands fa-instagram',
    twitter: 'fa-brands fa-twitter',
    x: 'fa-brands fa-x-twitter',
    threads: 'fa-brands fa-threads',
    youtube: 'fa-brands fa-youtube',
    linkedin: 'fa-brands fa-linkedin',
    pinterest: 'fa-brands fa-pinterest',
    tiktok: 'fa-brands fa-tiktok',
    whatsapp: 'fa-brands fa-whatsapp',
    telegram: 'fa-brands fa-telegram',
  };
  const normalizeSocialPlatform = (platform = '', url = '') => {
    const raw = String(platform || '').trim().toLowerCase();
    const href = String(url || '').trim().toLowerCase();
    if (raw === 'threads' || href.includes('threads.net')) return 'threads';
    if (raw === 'x' || raw === 'twitter-x' || /(^|\/\/)(www\.)?x\.com\b/.test(href)) return 'x';
    if (raw === 'twitter' || href.includes('twitter.com')) return 'twitter';
    if (raw && SOCIAL_ICON_BY_PLATFORM[raw]) return raw;
    return raw || 'custom';
  };
  const socialLabel = (platform: string) => {
    if (platform === 'x') return 'X';
    if (platform === 'threads') return 'Threads';
    if (!platform || platform === 'custom') return 'Social';
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };
  const dbSocialItems = (Array.isArray(c.socialItems) ? c.socialItems : [])
    .filter((item: { link?: string }) => String(item?.link || '').trim())
    .map((item: { icon?: string; label?: string; link?: string; platform?: string }) => {
      const link = String(item.link || '').trim();
      const platform = normalizeSocialPlatform(item.platform, link);
      return {
        icon: item.icon || SOCIAL_ICON_BY_PLATFORM[platform] || 'fa-brands fa-link',
        label: item.label || socialLabel(platform),
        link,
        linkNewTab: true,
      };
    });
  const socialStripStyle = {
    gap: '10px',
    iconColor: accent,
    iconBackgroundColor: `${accent}1F`,
    titleColor: 'transparent',
    iconContainerSize: '36px',
    iconSize: '14px',
    titleFontSize: '0',
    justifyContent: 'flex-start',
  } as any;
  const socialEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-fp-social`),
    `${section.id}-fp-social`,
    'trust-strip',
    { items: dbSocialItems },
    socialStripStyle
  );

  const makeColHeading = (id: string, defaultText: string): WebsiteElement =>
    section.elements?.find(e => e.id === id) || {
      id, type: 'heading',
      content: { text: defaultText, htmlTag: 'h3' as any } as any,
      style: { fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase' as any, lineHeight: '1', textAlign: 'left' as any } as any,
    };

  const quickHeadingEl = makeColHeading(`${section.id}-fp-quick-h`, c.quickTitle || 'Quick Links');
  const servicesHeadingEl = makeColHeading(`${section.id}-fp-services-h`, c.servicesTitle || 'Services');
  const contactHeadingEl = makeColHeading(`${section.id}-fp-contact-h`, c.contactTitle || 'Contact');

  const listStyle = {
    listType: 'none' as const,
    itemGap: '0.625rem',
    indent: '0px',
    color: textColor,
    fontSize: '0.875rem',
    hoverColor: accent,
    textAlign: 'left' as const,
  };

  const quickFromContent =
    Array.isArray(c.quickLinks) && c.quickLinks.length ? c.quickLinks : null;
  const quickBaseEl = section.elements?.find((e) => e.id === `${section.id}-fp-quick`);
  const quickFromEl = (quickBaseEl?.content as any)?.items;
  const resolvedQuickItems =
    quickFromContent ||
    (Array.isArray(quickFromEl) && quickFromEl.length
      ? quickFromEl
      : DEFAULT_QUICK_LINKS.map((l) => ({ title: l.label, link: l.link, linkNewTab: false })));

  const quickListEl = mergeDynamicElement(
    quickBaseEl,
    `${section.id}-fp-quick`,
    'list',
    { items: resolvedQuickItems },
    listStyle
  );

  const navSources = c.navSources || {};
  const serviceFromContent =
    Array.isArray(c.serviceLinks) && c.serviceLinks.length ? c.serviceLinks : null;
  const dbServiceItems = (Array.isArray(navSources.services) ? navSources.services : [])
    .slice(0, 12)
    .map((row: { label?: string; link?: string }) => ({
      title: row.label || '',
      link: row.link || '#',
      linkNewTab: false,
    }))
    .filter((row) => row.title);
  const defaultServiceItems = DEFAULT_SERVICE_LINKS.map((l) => ({
    title: l.label,
    link: l.link,
    linkNewTab: false,
  }));
  const servicesBaseEl = section.elements?.find((e) => e.id === `${section.id}-fp-services`);
  const serviceFromEl = (servicesBaseEl?.content as any)?.items;
  const serviceListItems =
    serviceFromContent ||
    (Array.isArray(serviceFromEl) && serviceFromEl.length
      ? serviceFromEl
      : dbServiceItems.length
        ? dbServiceItems
        : defaultServiceItems);

  const servicesListEl = mergeDynamicElement(
    servicesBaseEl,
    `${section.id}-fp-services`,
    'list',
    { items: serviceListItems },
    {
      listType: 'none',
      itemGap: '0.625rem',
      indent: '0px',
      color: textColor,
      fontSize: '0.875rem',
      hoverColor: accent,
      textAlign: 'left',
    }
  );

  const phoneEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-fp-phone`),
    `${section.id}-fp-phone`,
    'text',
    {
      text: c.phoneText || '',
      link: c.phoneLink || '',
      openInNewTab: false,
      textSize: 'base',
    },
    { color: titleColor, fontSize: '1rem', fontWeight: '700', textAlign: 'left' }
  );

  const contactRowStyle = {
    iconContainerSize: '2.25rem',
    iconBorderRadius: '0.625rem',
    iconColor: accent,
    iconBackgroundColor: `${accent}1F`,
    iconSize: '0.875rem',
    backgroundColor: 'transparent',
    borderWidth: '0',
    padding: '0',
    titleFontSize: '0.95rem',
    titleFontWeight: '700',
    descriptionColor: textColor,
    descriptionFontSize: '0.8125rem',
    descriptionFontWeight: '500',
    textAlign: 'left',
    titleAlign: 'left',
    descriptionAlign: 'left',
    gap: '0.75rem',
  };

  const makeContactRow = (
    elId: string,
    icon: string,
    title: string,
    subText: string,
    link: string,
    titleColorOverride?: string
  ) =>
    mergeDynamicElement(
      section.elements?.find((e) => e.id === elId),
      elId,
      'feature-box',
      { icon, text: title, subText, link, linkNewTab: false, iconPosition: 'left' },
      { ...contactRowStyle, titleColor: titleColorOverride || titleColor }
    );

  const phoneSub = footerContact.phoneSub || c.phoneSub || 'Available 24/7';
  const emailSub = footerContact.emailSub || c.emailSub || 'We reply within an hour';
  const hoursText = footerContact.hoursText || c.hoursText || 'Open 24/7';
  const hoursSub = footerContact.hoursSub || c.hoursSub || 'Always on call';

  const phoneRowEl = makeContactRow(
    `${section.id}-fp-row-phone`,
    'fa-phone',
    c.phoneText || '',
    phoneSub,
    c.phoneLink || '',
    titleColor
  );
  const emailRowEl = makeContactRow(
    `${section.id}-fp-row-email`,
    'fa-envelope',
    c.emailText || '',
    emailSub,
    c.emailLink || ''
  );
  const addressRowEl = makeContactRow(
    `${section.id}-fp-row-address`,
    'fa-location-dot',
    c.addressText || '',
    c.addressSub || '',
    c.addressLink || ''
  );
  const hoursRowEl = makeContactRow(
    `${section.id}-fp-row-hours`,
    'fa-clock',
    hoursText,
    hoursSub,
    '',
    accent
  );

  const ctaTitleEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-fp-cta-title`),
    `${section.id}-fp-cta-title`,
    'heading',
    { text: c.ctaTitle || '', htmlTag: 'h3' },
    {
      fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)',
      fontWeight: '800',
      lineHeight: '1.2',
      letterSpacing: '-0.01em',
      textAlign: 'left',
    }
  );
  const ctaSubEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-fp-cta-sub`),
    `${section.id}-fp-cta-sub`,
    'text',
    { text: c.ctaSubtitle || '', textSize: 'base' },
    { color: textColor, fontSize: '0.9375rem', lineHeight: '1.55', textAlign: 'left' }
  );
  const ctaBtnEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-fp-cta-btn`),
    `${section.id}-fp-cta-btn`,
    'button',
    {
      text: c.ctaButtonText || 'Book Now',
      link: c.ctaButtonLink || '/contact',
      icon: 'fa-calendar-check',
      iconPosition: 'left',
      openInNewTab: false,
    },
    {
      backgroundColor: btnBg,
      color: btnText,
      padding: '0.875rem 1.75rem',
      borderRadius: '0.5rem',
      fontWeight: '700',
      fontSize: '0.9375rem',
    }
  );

  const copyrightEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-fp-copyright`),
    `${section.id}-fp-copyright`,
    'text',
    {
      text: c.copyrightText || `© ${new Date().getFullYear()} ${c.logoText || 'Company'}. All rights reserved.`,
      textSize: 'small',
    },
    { color: textColor, fontSize: '0.8125rem', textAlign: 'left' }
  );
  const legalListEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fp-legal`) || {
    id: `${section.id}-fp-legal`, type: 'list',
    content: { items: DEFAULT_LEGAL_LINKS.map(l => ({ title: l.label, link: l.link, linkNewTab: false })) } as any,
    style: { listType: 'none', orientation: 'horizontal', columns: 1, itemGap: '1.5rem', indent: '0px', color: textColor, fontSize: '0.8125rem', hoverColor: accent, textAlign: 'left' as any } as any,
  };

  const passthrough = { onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect, selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors };

  return (
    <footer className="w-full relative" style={{ backgroundColor: bg, color: textColor, ['--gb-footer-accent' as any]: accent }}>
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-50" aria-hidden style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}18 0%, transparent 60%)` }} />
      <div className={`${innerClass} relative`} style={innerStyle}>
        {showCtaBanner && (
          <div className="rounded-2xl p-5 sm:p-6 lg:p-7 mb-10 sm:mb-12 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 lg:gap-8 items-center" style={{ backgroundColor: surfaceBg, border: `1px solid ${dividerCol}` }}>
            <div className="space-y-2">
              <ElementsSection section={{ ...section, elements: [ctaTitleEl] }} {...passthrough} />
              <ElementsSection section={{ ...section, elements: [ctaSubEl] }} {...passthrough} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5" style={{ color: titleColor }}>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: `${accent}1F`, color: 'var(--gb-footer-accent)' }} aria-hidden>
                  <i className="fa-solid fa-phone text-sm" />
                </span>
                <ElementsSection section={{ ...section, elements: [phoneEl] }} {...passthrough} />
              </div>
              <div style={{ width: 'max-content' }}>
                <ElementsSection section={{ ...section, elements: [ctaBtnEl] }} {...passthrough} />
              </div>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-8 sm:gap-10 lg:gap-12`}>
          {columnOrder.map((colKey) => {
            if (colKey === 'about') {
              return (
                <div key={colKey} className="space-y-4">
                  <div className="relative group/logo inline-block">
                    {logoMode === 'image' ? (
                      <ElementsSection section={{ ...section, elements: [logoImageEl] }} {...passthrough} />
                    ) : (
                      <ElementsSection section={{ ...section, elements: [logoTextEl] }} {...passthrough} />
                    )}
                    {isSelected && !readOnly && onSectionUpdate && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleLogoMode(); }}
                        className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-blue-600 text-white shadow-lg opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center gap-1 z-30"
                        title={logoMode === 'text' ? 'Switch to image logo' : 'Switch to text logo'}
                      >
                        <i className={`fa-solid ${logoMode === 'text' ? 'fa-image' : 'fa-font'}`} />
                        {logoMode === 'text' ? 'Use Image' : 'Use Text'}
                      </button>
                    )}
                  </div>
                  {showTaglineBlock ? (
                    <ElementsSection section={{ ...section, elements: [taglineEl] }} {...passthrough} />
                  ) : null}
                  {showSocialBlock && dbSocialItems.length > 0 ? (
                    <div className="pt-2">
                      <ElementsSection section={{ ...section, elements: [socialEl] }} {...passthrough} />
                    </div>
                  ) : null}
                </div>
              );
            }
            if (colKey === 'quickLinks') {
              return (
                <div key={colKey} className="space-y-4">
                  <ElementsSection section={{ ...section, elements: [quickHeadingEl] }} {...passthrough} />
                  <ElementsSection section={{ ...section, elements: [quickListEl] }} {...passthrough} />
                </div>
              );
            }
            if (colKey === 'services') {
              return (
                <div key={colKey} className="space-y-4">
                  <ElementsSection section={{ ...section, elements: [servicesHeadingEl] }} {...passthrough} />
                  <ElementsSection section={{ ...section, elements: [servicesListEl] }} {...passthrough} />
                </div>
              );
            }
            if (colKey === 'contact') {
              return (
                <div key={colKey} className="space-y-4">
                  <ElementsSection section={{ ...section, elements: [contactHeadingEl] }} {...passthrough} />
                  <div className="space-y-3">
                    {footerContact.showPhone !== false && String(c.phoneText || '').trim() ? (
                      <ElementsSection section={{ ...section, elements: [phoneRowEl] }} {...passthrough} />
                    ) : null}
                    {footerContact.showEmail !== false && String(c.emailText || '').trim() ? (
                      <ElementsSection section={{ ...section, elements: [emailRowEl] }} {...passthrough} />
                    ) : null}
                    {footerContact.showLocation !== false && String(c.addressText || '').trim() ? (
                      <ElementsSection section={{ ...section, elements: [addressRowEl] }} {...passthrough} />
                    ) : null}
                    {footerContact.showHours !== false ? (
                      <ElementsSection section={{ ...section, elements: [hoursRowEl] }} {...passthrough} />
                    ) : null}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        <div className="mt-10 sm:mt-12 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderTop: `1px solid ${dividerCol}` }}>
          <ElementsSection section={{ ...section, elements: [copyrightEl] }} {...passthrough} />
          <ElementsSection section={{ ...section, elements: [legalListEl] }} {...passthrough} />
        </div>
      </div>
    </footer>
  );
};

export default FooterPlumbing;
