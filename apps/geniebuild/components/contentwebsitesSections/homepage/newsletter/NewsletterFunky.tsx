import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  resolveFunkyIsLight,
  funkySurfaceColors, resolveFunkySectionChrome } from '../../funkyTheme';
import { motion } from 'motion/react';
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

export const NewsletterFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc }) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode, themeColors: funkyThemeBag } = funkyTextColors(tc, isLight);
  const surface = funkySurfaceColors(isLight, (styles as any)?.backgroundColor);
  const bg = surface.bg;
  const { wrapperStyle, overlayStyle } = resolveFunkySectionChrome(styles, isLight);
  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const titleEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cw-news-title`, type: 'heading',
    content: { text: c.title || 'Inbox, but make it spicy', htmlTag: 'h2' },
    style: { fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display, textAlign: 'center' as any } });
  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cw-news-desc`, type: 'text',
    content: { text: c.subtitle || 'Weekly niche drops. Zero boring.' },
    style: { textAlign: 'center' as any } });
  const formEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cw-news-form`, type: 'newsletter',
    content: { placeholder: c.placeholder || 'you@email.com', buttonText: c.ctaText || 'Join the list' },
    style: {} });

  const themeColors = { ...tc, titleColor, textColor, buttonBackgroundColor: f.ink, buttonTextColor: f.cream };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors } as const;

  return (
    <div className="w-full" style={{ ...wrapperStyle }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      {overlayStyle ? (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={overlayStyle} />
      ) : null}
      <div className={`max-w-2xl mx-auto ${padX} ${padT} ${padB}`}>
        <div style={{ background: f.accent, border: `2.5px solid ${f.ink}`, borderRadius: 24, boxShadow: FUNKY.shadowLg, padding: 32, textAlign: 'center' }}>
          <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [titleEl] }} {...passThrough} />
          <div className="mt-2"><ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [descEl] }} {...passThrough} /></div>
          <div className="mt-5"><ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [formEl] }} {...passThrough} /></div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterFunky;
