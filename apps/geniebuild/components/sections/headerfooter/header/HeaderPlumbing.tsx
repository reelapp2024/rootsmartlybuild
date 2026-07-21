import React, { useEffect, useState } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
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
  sitePathname?: string;
  sitePageType?: string;
}

const DEFAULT_NAV_ITEMS = [
  { label: 'Home', link: '/', linkNewTab: false },
  { label: 'About', link: '/#about', linkNewTab: false },
  { label: 'Services', link: '/services', selectSource: 'services', viewAllLabel: 'View All Services', viewAllLink: '/services', linkNewTab: false },
  { label: 'Areas', link: '/areas', selectSource: 'locations', viewAllLabel: 'View All Areas', viewAllLink: '/areas', linkNewTab: false },
  { label: 'Contact', link: '/#contact', linkNewTab: false },
];

export const HeaderPlumbing: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId,   readOnly = false, themeColors: tc,
  isSelected = false, onSectionUpdate,
  sitePathname, sitePageType,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const lc = tc?.light || {};
  const accent = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = lc.titleColor || '#0F172A';
  const textColor = lc.textColor || '#475569';
  const cardBorder = lc.cardBorderColor || 'rgba(15,23,42,0.08)';
  const btnBg = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText = (lc.buttonTextColor as string) || tc?.buttonTextColor || '#FFFFFF';

  const savedBg = s.backgroundColor;
  const isThemeSurface = (() => {
    if (!savedBg || typeof savedBg !== 'string') return true;
    const norm = savedBg.trim().toLowerCase();
    return PRESET_THEMES.some((t) => {
      const dark = (t.elements?.surface || '').toLowerCase();
      const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
      return norm === dark || norm === light;
    });
  })();
  const bg = isThemeSurface ? '#FFFFFF' : savedBg;

  const sticky: boolean = c.sticky !== false;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sticky]);

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padX = s.paddingX ?? 'px-4 sm:px-6 lg:px-8';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
  };

  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    buttonBackgroundColor: btnBg,
    buttonTextColor: btnText,
  };

  const logoMode: 'text' | 'image' = c.logoMode === 'image' ? 'image' : 'text';
  const logoTextEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-hp-logo-text`),
    `${section.id}-hp-logo-text`,
    'heading',
    { text: c.logoText || 'Logo', htmlTag: 'div', link: c.logoLink || '/' },
    { fontSize: '1.375rem', fontWeight: '900', letterSpacing: '-0.01em', lineHeight: '1' }
  );
  const logoImageEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-hp-logo-image`),
    `${section.id}-hp-logo-image`,
    'image',
    {
      imageUrl: c.logoUrl || '',
      imageAlt: c.logoAlt || c.logoText || 'Logo',
      link: c.logoLink || '/',
      openInNewTab: false,
    },
    { width: '120px', height: 'auto', objectFit: 'contain' }
  );
  const toggleLogoMode = () => {
    if (readOnly || !onSectionUpdate) return;
    onSectionUpdate(section.id, { content: { ...content, logoMode: logoMode === 'text' ? 'image' : 'text' } });
  };

  const navSources = c.navSources || {};
  const menuFromSection =
    (Array.isArray(c.menuItems) && c.menuItems.length ? c.menuItems : null) ||
    (Array.isArray(c.navItems) && c.navItems.length ? c.navItems : null);
  const baseNavEl = section.elements?.find(e => e.id === `${section.id}-hp-nav`);
  const navItemsFromEl = (baseNavEl?.content as any)?.items;
  const resolvedNavItems =
    menuFromSection ||
    (Array.isArray(navItemsFromEl) && navItemsFromEl.length ? navItemsFromEl : DEFAULT_NAV_ITEMS);
  const navEl: WebsiteElement = baseNavEl
    ? {
        ...baseNavEl,
        content: {
          ...(baseNavEl.content as any),
          items: resolvedNavItems,
          navSources,
        },
      }
    : {
        id: `${section.id}-hp-nav`,
        type: 'nav-menu',
        content: { items: resolvedNavItems, navSources } as any,
        style: {
          orientation: 'horizontal',
          justifyContent: 'center',
          indicator: 'underline',
          mobileBreakpoint: 'lg',
          itemGap: '1.75rem',
          itemPadding: '0.5rem 0.25rem',
          color: titleColor,
          hoverColor: accent,
          fontSize: '0.9375rem',
          fontWeight: '600',
        } as any,
      };
  const phoneEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-hp-phone`),
    `${section.id}-hp-phone`,
    'text',
    {
      text: c.phoneText || '',
      link: c.phoneLink || '',
      openInNewTab: false,
      textSize: 'small',
    },
    { color: titleColor, fontWeight: '700', fontSize: '0.9375rem' }
  );
  const btnEl = mergeDynamicElement(
    section.elements?.find((e) => e.id === `${section.id}-hp-cta`),
    `${section.id}-hp-cta`,
    'button',
    {
      text: c.ctaText || 'Book Now',
      link: c.ctaLink || '/contact',
      icon: 'fa-calendar-check',
      iconPosition: 'left',
      openInNewTab: false,
    },
    {
      backgroundColor: btnBg,
      color: btnText,
      padding: '0.625rem 1.25rem',
      borderRadius: '0.5rem',
      fontWeight: '700',
      fontSize: '0.875rem',
    }
  );

  const passthrough = {
    onTextEdit,
    onElementUpdate: onElementUpdate || (() => {}),
    onElementSelect,
    selectedElementId,
    readOnly,
    isWrapped: false,
    buttonClass,
    themeColors,
    sitePathname,
    sitePageType,
  };
  const verticalPad = scrolled ? 'py-2.5' : 'py-3.5 sm:py-4';

  return (
    <header
      className={`w-full transition-all duration-200 relative z-[100] ${sticky ? 'sticky top-0' : ''} ${scrolled ? 'shadow-sm' : ''}`}
      style={{ backgroundColor: bg, borderBottom: scrolled ? 'none' : `1px solid ${cardBorder}` }}
    >
      <div className={`${innerClass} ${verticalPad} flex items-center gap-4`} style={innerStyle}>
        <div className="flex-none relative group/logo">
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

        <div className="flex-1 min-w-0 overflow-visible relative z-[110]">
          <ElementsSection section={{ ...section, elements: [navEl] }} {...passthrough} />
        </div>

        <div className="hidden md:flex flex-none items-center gap-2" style={{ color: titleColor }}>
          <i className="fa-solid fa-phone text-xs" style={{ color: accent }} aria-hidden />
          <ElementsSection section={{ ...section, elements: [phoneEl] }} {...passthrough} />
        </div>

        <div className="flex-none">
          <ElementsSection section={{ ...section, elements: [btnEl] }} {...passthrough} />
        </div>
      </div>
    </header>
  );
};

export default HeaderPlumbing;
