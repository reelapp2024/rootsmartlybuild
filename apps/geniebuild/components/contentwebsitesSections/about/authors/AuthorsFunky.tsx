import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  mergeFunkyElement,
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

export const AboutAuthorsFunky: React.FC<Props> = ({
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
  const colors = surface.cardAlts;

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cw-abauthors-title`) || {
    id: `${section.id}-cw-abauthors-title`, type: 'heading',
    content: { text: c.title || "The crew", htmlTag: 'h2' },
    style: { color: titleColor, fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', fontWeight: '800', fontFamily: FUNKY.fonts.display },
  };
  const titleElPainted: WebsiteElement = { ...titleEl, style: { ...withFunkyTextStyle(titleEl.style as any, titleColor, isLight) } };

  const items: any[] = Array.isArray(c.items) && c.items.length ? c.items : [{"title":"Alex","description":"Editor"},{"title":"Sam","description":"Designer"},{"title":"Jordan","description":"SEO"}];

  const themeColors = { ...tc, ...funkyThemeBag, titleColor, textColor };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      <div className={`max-w-7xl mx-auto ${padX} ${padT} ${padB}`}>
        <div className="mb-8"><ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [titleElPainted] }} {...passThrough} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const itemTitle = mergeFunkyElement(section, `${section.id}-cw-abauthors-item-${i}-title`, {
              id: `${section.id}-cw-abauthors-item-${i}-title`, type: 'heading',
              content: { text: item.title || item.name || 'Item', htmlTag: 'h3' },
              style: { color: titleColor, fontSize: '1.15rem', fontWeight: '800', fontFamily: FUNKY.fonts.display },
            });
            const itemDesc = mergeFunkyElement(section, `${section.id}-cw-abauthors-item-${i}-desc`, {
              id: `${section.id}-cw-abauthors-item-${i}-desc`, type: 'text',
              content: { text: item.description || item.subtitle || item.tag || '' },
              style: { color: textColor, fontFamily: FUNKY.fonts.body },
            });
            const itemTitlePainted: WebsiteElement = {
              ...itemTitle,
              style: { ...withFunkyTextStyle(itemTitle.style as any, titleColor, isLight) },
            };
            const itemDescPainted: WebsiteElement = {
              ...itemDesc,
              style: { ...withFunkyTextStyle(itemDesc.style as any, textColor, isLight) },
            };
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                style={{ background: colors[i % colors.length], border: `2.5px solid ${f.ink}`, borderRadius: 22, boxShadow: FUNKY.shadow, transform: i % 2 ? 'rotate(1.2deg)' : 'rotate(-1.2deg)', overflow: 'hidden', padding: 16 }}>
                {item.image ? <img src={item.image} alt="" className="w-full h-40 object-cover rounded-xl mb-3" style={{ border: `2px solid ${f.ink}` }} /> : null}
                <ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [itemTitlePainted] }} {...passThrough} />
                <div className="mt-2"><ElementsSection section={{ ...section, styles: { ...(section.styles || {}), themeMode: funkyThemeMode as any, titleColor, textColor }, elements: [itemDescPainted] }} {...passThrough} /></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AboutAuthorsFunky;
