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

export const FooterFunky: React.FC<Props> = ({
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
  const bg = s.backgroundColor || f.charcoal;

  const brandEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-ftr-brand`) || {
    id: `${section.id}-cw-ftr-brand`, type: 'heading',
    content: { text: c.brand || 'NichePop', htmlTag: 'h3' },
    style: { fontFamily: FUNKY.fonts.display, fontWeight: '800', fontSize: '1.3rem', color: f.cream },
  };
  const brandElPainted: WebsiteElement = { ...brandEl, style: { ...withFunkyTextStyle(brandEl.style as any, titleColor, isLight) } };
  const blurbEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-ftr-blurb`) || {
    id: `${section.id}-cw-ftr-blurb`, type: 'text',
    content: { text: c.blurb || 'Funky niche content for curious humans.' },
    style: { color: f.cream, opacity: 0.85 },
  };
  const blurbElPainted: WebsiteElement = { ...blurbEl, style: { ...withFunkyTextStyle(blurbEl.style as any, textColor, isLight) } };

  const themeColors = { ...tc, titleColor: f.cream, textColor: f.cream };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <footer className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div style={{ border: `2.5px solid ${f.cream}`, borderRadius: 22, padding: 28, boxShadow: '6px 6px 0 ' + f.accent }}>
          <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [brandElPainted] }} {...passThrough} />
          <div className="mt-2"><ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [blurbElPainted] }} {...passThrough} /></div>
        </div>
      </div>
    </footer>
  );
};

export default FooterFunky;
