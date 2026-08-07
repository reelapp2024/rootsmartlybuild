import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  mergeFunkyElement,
  resolveFunkyIsLight,
  funkySurfaceColors, resolveFunkySectionChrome } from '../../funkyTheme';
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

export const CategoryFilterFunky: React.FC<Props> = ({
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
  const colors = surface.cardAlts;
  const live = Boolean(readOnly);

  const titleEl = mergeFunkyElement(section, `${section.id}-cw-catfilter-title`, {
    id: `${section.id}-cw-catfilter-title`, type: 'heading',
    content: { text: c.title || "Filter by vibe", htmlTag: 'h2' },
    style: { fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display } }, { preferFallbackText: live });
  const items: any[] = Array.isArray(c.items) && c.items.length ? c.items : [{"title":"All","description":"Everything","link":"/blog"},{"title":"DIY","description":"Projects"},{"title":"Printables","description":"Downloads"},{"title":"Guides","description":"How-tos"}];

  const themeColors = { ...tc, ...funkyThemeBag, titleColor, textColor };
  const lightStyles = { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ ...wrapperStyle }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      {overlayStyle ? (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={overlayStyle} />
      ) : null}
      <div className={`max-w-7xl mx-auto ${padX} ${padT} ${padB}`}>
        <div className="mb-8"><ElementsSection section={{ ...section, styles: lightStyles, elements: [titleEl] }} {...passThrough} /></div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {items.map((item, i) => {
            const itemTitle = mergeFunkyElement(section, `${section.id}-cw-catfilter-item-${i}-title`, {
              id: `${section.id}-cw-catfilter-item-${i}-title`, type: 'heading',
              content: { text: item.title || item.name || 'Item', htmlTag: 'h3' },
              style: { fontSize: '1rem', fontWeight: '800', fontFamily: FUNKY.fonts.display } }, { preferFallbackText: live });
            const href = String(item.link || item.href || '').trim();
            const chip = (
              <div
                style={{
                  background: colors[i % colors.length],
                  border: `2.5px solid ${f.ink}`,
                  borderRadius: 999,
                  boxShadow: FUNKY.shadow,
                  padding: '10px 18px',
                  minWidth: 100 }}
              >
                <ElementsSection section={{ ...section, styles: lightStyles, elements: [itemTitle] }} {...passThrough} />
                {(item.description || item.subtitle) ? (
                  <div className="text-xs mt-0.5 opacity-80" style={{ fontFamily: FUNKY.fonts.body }}>
                    {item.description || item.subtitle}
                  </div>
                ) : null}
              </div>
            );
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                {href && readOnly ? (
                  <a href={href} className="block no-underline text-inherit">{chip}</a>
                ) : chip}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilterFunky;
