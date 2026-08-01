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

export const PinCtaFunky: React.FC<Props> = ({
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
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-pincta-title`) || {
    id: `${section.id}-cw-pincta-title`, type: 'heading',
    content: { text: c.title || "Love this? Pin it.", htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display, textAlign: 'center' as any },
  };
  const titleElPainted: WebsiteElement = { ...titleEl, style: { ...withFunkyTextStyle(titleEl.style as any, titleColor, isLight) } };
  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-pincta-desc`) || {
    id: `${section.id}-cw-pincta-desc`, type: 'text',
    content: { text: c.subtitle || c.description || "Help your future self (and our little site)." },
    style: { color: textColor, textAlign: 'center' as any, fontFamily: FUNKY.fonts.body },
  };
  const descElPainted: WebsiteElement = { ...descEl, style: { ...withFunkyTextStyle(descEl.style as any, textColor, isLight) } };
  const btnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-pincta-btn`) || {
    id: `${section.id}-cw-pincta-btn`, type: 'cta-button',
    content: { text: c.ctaText || c.buttonText || "Save to Pinterest", href: c.ctaHref || '#' },
    style: { backgroundColor: f.primary, color: '#fff', fontWeight: '800', borderRadius: '9999px', padding: '14px 22px', border: `2.5px solid ${f.ink}`, boxShadow: FUNKY.shadow, fontFamily: FUNKY.fonts.display },
  };

  const themeColors = { ...tc, ...funkyThemeBag, titleColor, textColor, buttonBackgroundColor: f.primary, buttonTextColor: '#fff' };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={`max-w-7xl mx-auto ${padX} ${padT} ${padB}`}>
        <div style={{ background: f.primary, border: `2.5px solid ${f.ink}`, borderRadius: 24, boxShadow: FUNKY.shadowLg, padding: '36px 28px', textAlign: 'center' }}>
          <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [titleElPainted] }} {...passThrough} />
          <div className="mt-3 max-w-xl mx-auto"><ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [descElPainted] }} {...passThrough} /></div>
          <div className="mt-6 inline-flex"><ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [btnEl] }} {...passThrough} /></div>
        </div>
      </div>
    </div>
  );
};

export default PinCtaFunky;
