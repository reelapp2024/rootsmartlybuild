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

export const BrandVoiceFunky: React.FC<Props> = ({
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

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-voice-title`) || {
    id: `${section.id}-cw-voice-title`, type: 'heading',
    content: { text: c.title || "Brand voice", htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display },
  };
  const titleElPainted: WebsiteElement = { ...titleEl, style: { ...withFunkyTextStyle(titleEl.style as any, titleColor, isLight) } };
  const bodyEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-voice-body`) || {
    id: `${section.id}-cw-voice-body`, type: 'text',
    content: { text: c.body || c.description || c.html || "Tone: warm expert · playful · clear. Do: show receipts, talk like a human, lead with visuals. Don’t: keyword spam, fake urgency, generic fluff.", textSize: 'large' },
    style: { color: textColor, lineHeight: '1.7', fontFamily: FUNKY.fonts.body },
  };
  const bodyElPainted: WebsiteElement = { ...bodyEl, style: { ...withFunkyTextStyle(bodyEl.style as any, textColor, isLight) } };

  const themeColors = { ...tc, ...funkyThemeBag, titleColor, textColor };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={`max-w-3xl mx-auto ${padX} ${padT} ${padB}`}>
        <div style={{ background: f.white, border: `2.5px solid ${f.ink}`, borderRadius: 24, boxShadow: FUNKY.shadow, padding: 28 }}>
          <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [titleElPainted] }} {...passThrough} />
          <div className="mt-4"><ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [bodyElPainted] }} {...passThrough} /></div>
        </div>
      </div>
    </div>
  );
};

export default BrandVoiceFunky;
