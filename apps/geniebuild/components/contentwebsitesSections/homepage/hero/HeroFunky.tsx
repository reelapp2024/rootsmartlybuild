import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  resolveFunkyIsLight,
  funkySurfaceColors,
  resolveFunkySectionChrome } from '../../funkyTheme';
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

/**
 * HeroFunky — funky content-site hero (GenieBuild ElementsSection compatible).
 */
export const HeroFunky: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc }) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode, themeColors: funkyThemeBag } = funkyTextColors(tc, isLight);
  const surface = funkySurfaceColors(isLight, (styles as any)?.backgroundColor);
  const accent = tc?.iconColor || tc?.accentColor || f.primary;
  const { wrapperStyle, overlayStyle } = resolveFunkySectionChrome(styles, isLight);

  const padT = s.paddingTop ?? 'pt-20 sm:pt-24 lg:pt-28';
  const padB = s.paddingBottom ?? 'pb-16 sm:pb-20';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cw-hero-badge`, type: 'badge',
    content: { text: c.badgeText || "Pin-worthy ideas", icon: 'fa-sparkles', iconPosition: 'left' },
    style: { fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' as any, padding: '8px 16px', borderRadius: '9999px' } });
  const titleEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cw-hero-title`, type: 'heading',
    content: { text: c.title || "Make it cute. Make it yours.", htmlTag: 'h1' },
    style: { fontSize: s.titleSize || 'clamp(2.2rem, 5.5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-0.03em', fontFamily: FUNKY.fonts.display } });
  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cw-hero-desc`, type: 'text',
    content: { text: c.subtitle || c.description || "Fresh niche guides, boards & how-tos that actually convert to saves.", textSize: 'large' },
    style: { maxWidth: '560px', fontFamily: FUNKY.fonts.body } });
  const themeColors = { ...tc, ...funkyThemeBag, titleColor, textColor, accentColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ ...wrapperStyle, fontFamily: FUNKY.fonts.body }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      {overlayStyle ? (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={overlayStyle} />
      ) : null}
      <div className="absolute pointer-events-none z-[1]" style={{ width: 240, height: 240, borderRadius: '40% 60% 55% 45% / 50% 40% 60% 50%', background: f.accent, opacity: 0.45, top: -60, right: -40 }} />
      <div className="absolute pointer-events-none z-[1]" style={{ width: 180, height: 180, borderRadius: '40% 60% 55% 45% / 50% 40% 60% 50%', background: f.secondary, opacity: 0.3, bottom: 20, left: -50 }} />
      <div className={`relative z-10 max-w-7xl mx-auto ${padX} ${padT} ${padB}`}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-5 text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
          <div className="inline-flex" style={{ transform: 'rotate(-2deg)', border: `2.5px solid ${f.ink}`, borderRadius: 999, boxShadow: FUNKY.shadow, background: f.sunshine, overflow: 'hidden' }}>
            <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [badgeEl] }} {...passThrough} />
          </div>
          <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [titleEl] }} {...passThrough} />
          <div className="mx-auto sm:mx-0">
            <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [descEl] }} {...passThrough} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroFunky;
