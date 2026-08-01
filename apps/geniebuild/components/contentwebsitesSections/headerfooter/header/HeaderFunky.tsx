import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  withFunkyTextStyle,
  resolveFunkyIsLight,
  funkySurfaceColors
} from '../../funkyTheme';
import { motion } from 'motion/react';

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

export const HeaderFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode, themeColors: funkyThemeBag } = funkyTextColors(tc, isLight);
  const surface = funkySurfaceColors(isLight, (styles as any)?.backgroundColor);
  const bg = surface.bg;

  const brandEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-hdr-brand`) || {
    id: `${section.id}-cw-hdr-brand`, type: 'heading',
    content: { text: c.brand || c.siteName || 'NichePop', htmlTag: 'h2' },
    style: { fontFamily: FUNKY.fonts.display, fontWeight: '800', fontSize: '1.4rem', color: f.ink },
  };
  const brandElPainted: WebsiteElement = { ...brandEl, style: { ...withFunkyTextStyle(brandEl.style as any, titleColor, isLight) } };
  const navEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-hdr-nav`) || {
    id: `${section.id}-cw-hdr-nav`, type: 'navigation',
    content: { items: c.links || [{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }] },
    style: {},
  };

  const themeColors = { ...tc, titleColor: f.ink, textColor: f.ink };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <header className="w-full sticky top-0 z-40" style={{ backgroundColor: bg, borderBottom: `2.5px solid ${f.ink}` }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div style={{ transform: 'rotate(-2deg)' }}><ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [brandElPainted] }} {...passThrough} /></div>
        <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [navEl] }} {...passThrough} />
      </div>
    </header>
  );
};

export default HeaderFunky;
