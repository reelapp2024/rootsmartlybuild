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

export const ContactFormFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode, themeColors: funkyThemeBag } = funkyTextColors(tc, isLight);
  const surface = funkySurfaceColors(isLight, (styles as any)?.backgroundColor);
  const bg = surface.bg;
  const padT = s.paddingTop ?? 'pt-10 sm:pt-14';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-14';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const formEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-conform-form`) || {
    id: `${section.id}-cw-conform-form`, type: 'contact-form',
    content: content || {},
    style: {},
  };

  const themeColors = { ...tc, ...funkyThemeBag, buttonBackgroundColor: f.primary, buttonTextColor: '#fff', titleColor, textColor };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={`max-w-xl mx-auto ${padX} ${padT} ${padB}`}>
        <div style={{ background: f.white, border: `2.5px solid ${f.ink}`, borderRadius: 24, boxShadow: FUNKY.shadow, padding: 24 }}>
          <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [formEl] }} {...passThrough} />
        </div>
      </div>
    </div>
  );
};

export default ContactFormFunky;
