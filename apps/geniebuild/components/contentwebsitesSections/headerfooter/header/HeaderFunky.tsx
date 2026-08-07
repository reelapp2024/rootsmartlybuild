import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  resolveFunkyIsLight,
  funkySurfaceColors,
  resolveFunkySectionChrome,
} from '../../funkyTheme';
import { resolveSectionElement } from '../../../../elements';

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

export const HeaderFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode } = funkyTextColors(tc, isLight);
  const { wrapperStyle, overlayStyle } = resolveFunkySectionChrome(styles, isLight);

  const brandEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cw-hdr-brand`, type: 'heading',
    content: { text: c.brand || c.siteName || 'NichePop', htmlTag: 'h2' },
    style: { fontFamily: FUNKY.fonts.display, fontWeight: '800', fontSize: '1.4rem' },
  });

  const navId = `${section.id}-cw-hdr-nav`;
  const existingNav = section.elements?.find(e => e.id === navId);
  const navItems = normalizeNavItems(
    (existingNav?.content as any)?.items || c.links,
    [
      { label: 'Home', link: '/' },
      { label: 'Blog', link: '/blog' },
      { label: 'About', link: '/about' },
      { label: 'Contact', link: '/contact' },
    ]
  );
  const navEl: WebsiteElement = resolveSectionElement(section, {
    id: navId,
    type: 'nav-menu',
    content: { items: navItems },
    style: { orientation: 'horizontal',
      fontWeight: '700',
      fontSize: '0.9rem',
      itemGap: '1.25rem',
    },
  });

  const themeColors = { ...tc, titleColor: f.ink, textColor: f.ink };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <header className="w-full sticky top-0 z-40" style={{ ...wrapperStyle, borderBottom: `2.5px solid ${f.ink}` }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      {overlayStyle ? (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={overlayStyle} />
      ) : null}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div style={{ transform: 'rotate(-2deg)' }}>
          <ElementsSection
            section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [brandEl] }}
            {...passThrough}
          />
        </div>
        <ElementsSection
          section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [navEl] }}
          {...passThrough}
        />
      </div>
    </header>
  );
};

export default HeaderFunky;
