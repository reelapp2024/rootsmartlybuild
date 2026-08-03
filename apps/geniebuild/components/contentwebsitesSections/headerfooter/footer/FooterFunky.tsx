import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  withFunkyTextStyle,
  resolveFunkyIsLight,
} from '../../funkyTheme';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: Partial<WebsiteElement>) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}

function normalizeNavItems(items: any[] | undefined, fallback: Array<{ label: string; link: string }>) {
  const raw = Array.isArray(items) && items.length ? items : fallback;
  return raw.map((item) => ({
    ...item,
    label: item?.label || item?.name || 'Link',
    link: item?.link || item?.href || item?.url || '#',
  }));
}

export const FooterFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode } = funkyTextColors(tc, isLight);
  const bg = s.backgroundColor || f.charcoal;

  const brandEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-ftr-brand`) || {
    id: `${section.id}-cw-ftr-brand`, type: 'heading',
    content: { text: c.brand || c.siteName || 'NichePop', htmlTag: 'h3' },
    style: { fontFamily: FUNKY.fonts.display, fontWeight: '800', fontSize: '1.3rem', color: f.cream },
  };
  const brandElPainted: WebsiteElement = { ...brandEl, style: { ...withFunkyTextStyle(brandEl.style as any, titleColor, isLight) } };
  const blurbEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-ftr-blurb`) || {
    id: `${section.id}-cw-ftr-blurb`, type: 'text',
    content: { text: c.blurb || 'Funky niche content for curious humans.' },
    style: { color: f.cream, opacity: 0.85 },
  };
  const blurbElPainted: WebsiteElement = { ...blurbEl, style: { ...withFunkyTextStyle(blurbEl.style as any, textColor, isLight) } };

  const existingNav = section.elements?.find(e => e.id === `${section.id}-cw-ftr-nav`);
  const existingLegal = section.elements?.find(e => e.id === `${section.id}-cw-ftr-legal`);

  const navItems = normalizeNavItems(
    (existingNav?.content as any)?.items || c.links,
    [
      { label: 'Home', link: '/' },
      { label: 'Blog', link: '/blog' },
      { label: 'About', link: '/about' },
      { label: 'Contact', link: '/contact' },
    ]
  );
  const legalItems = normalizeNavItems(
    (existingLegal?.content as any)?.items || c.legalLinks,
    [
      { label: 'Privacy', link: '/privacy' },
      { label: 'Terms', link: '/terms' },
      { label: 'Disclaimer', link: '/disclaimer' },
    ]
  );

  const navStyle = {
    orientation: 'vertical' as const,
    color: f.cream,
    hoverColor: f.accent,
    activeColor: f.accent,
    fontWeight: '600',
    fontSize: '0.85rem',
    itemGap: '0.5rem',
    indicator: 'none',
  };

  const navEl: WebsiteElement = {
    ...(existingNav || { id: `${section.id}-cw-ftr-nav`, type: 'nav-menu', style: {} }),
    type: 'nav-menu',
    content: { ...(existingNav?.content || {}), items: navItems },
    style: { ...(existingNav?.style || {}), ...navStyle },
  };
  const legalEl: WebsiteElement = {
    ...(existingLegal || { id: `${section.id}-cw-ftr-legal`, type: 'nav-menu', style: {} }),
    type: 'nav-menu',
    content: { ...(existingLegal?.content || {}), items: legalItems },
    style: { ...(existingLegal?.style || {}), ...navStyle },
  };

  const copyEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-ftr-copy`) || {
    id: `${section.id}-cw-ftr-copy`, type: 'text',
    content: {
      text: c.copyright || `© ${new Date().getFullYear()} ${c.brand || 'NichePop'}. All rights reserved.`,
    },
    style: { color: f.cream, opacity: 0.7, fontSize: '0.85rem' },
  };
  const copyElPainted: WebsiteElement = { ...copyEl, style: { ...withFunkyTextStyle(copyEl.style as any, textColor, isLight) } };

  const themeColors = { ...tc, titleColor: f.cream, textColor: f.cream };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;
  const sectionStyles = { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor };

  return (
    <footer className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div style={{ border: `2.5px solid ${f.cream}`, borderRadius: 22, padding: 28, boxShadow: '6px 6px 0 ' + f.accent }}>
          <ElementsSection section={{ ...section, styles: sectionStyles, elements: [brandElPainted] }} {...passThrough} />
          <div className="mt-2">
            <ElementsSection section={{ ...section, styles: sectionStyles, elements: [blurbElPainted] }} {...passThrough} />
          </div>
          <div className="mt-5 flex flex-wrap gap-6">
            <div className="min-w-[140px]">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: f.cream, opacity: 0.6 }}>Explore</p>
              <ElementsSection section={{ ...section, styles: sectionStyles, elements: [navEl] }} {...passThrough} />
            </div>
            <div className="min-w-[140px]">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: f.cream, opacity: 0.6 }}>Legal</p>
              <ElementsSection section={{ ...section, styles: sectionStyles, elements: [legalEl] }} {...passThrough} />
            </div>
          </div>
        </div>
        <ElementsSection section={{ ...section, styles: sectionStyles, elements: [copyElPainted] }} {...passThrough} />
      </div>
    </footer>
  );
};

export default FooterFunky;
