import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { motion } from 'motion/react';
import { resolveSectionBackground } from '../../../../utils/sectionBackground';
import { resolveSectionElement } from '../../../../elements';
import {
  mergeSectionContent,
  pickAboutServiceBody,
  pickAboutServiceImage,
  pickAboutServiceTitle,
  resolveAboutImageUrl,
} from './aboutServiceShared';

/**
 * Alternate layout for the same bundle-backed about copy.
 * Title/body resolve through ElementsSection SSOT.
 */
export const AboutServiceStacked: React.FC<{
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  isSelected?: boolean;
}> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { styles } = section;
  const s = styles as any;
  const content = mergeSectionContent(section);
  const title = pickAboutServiceTitle(content);
  const aboutText = pickAboutServiceBody(content);
  const img = resolveAboutImageUrl(pickAboutServiceImage(content));

  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const bg = s.backgroundColor || '#ffffff';
  const bgStyle = resolveSectionBackground(s, { defaultSurface: bg });

  const titleColor = tc?.titleColor || '#0F172A';
  const textColor = tc?.textColor || '#475569';
  const themeColors = { ...tc, titleColor, textColor };

  const passThrough = {
    onTextEdit,
    onElementUpdate: onElementUpdate || (() => {}),
    onElementSelect,
    selectedElementId,
    readOnly,
    isWrapped: false,
    buttonClass,
    themeColors,
  } as const;

  const titleEl = resolveSectionElement(section, {
    id: `${section.id}-ass-title`,
    type: 'heading',
    content: { text: title, htmlTag: 'h2' },
    style: { fontWeight: '700',
      fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
      textAlign: 'center' as any,
    },
  });

  const bodyEl = resolveSectionElement(section, {
    id: `${section.id}-ass-body`,
    type: 'text',
    content: { text: aboutText, textSize: 'large' },
    style: { lineHeight: '1.75', textAlign: 'left' as any },
  });

  return (
    <section className="relative w-full" style={{ ...bgStyle }}>
      <div className={`max-w-3xl mx-auto ${padX} ${padT} ${padB} text-center`}>
        {!readOnly && (
          <p className="text-[10px] text-amber-800 mb-4 px-2 py-1 rounded bg-amber-50 border border-amber-200 inline-block">
            Stacked variant — same data as <strong>AboutServiceDefault</strong>
          </p>
        )}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          {img ? (
            <img src={img} alt="" className="w-full max-h-72 object-cover rounded-xl mx-auto mb-8 shadow-md" />
          ) : null}
          <ElementsSection
            section={{ ...section, elements: [{ ...titleEl, content: { ...titleEl.content, text: title, htmlTag: 'h2' } }] }}
            {...passThrough}
          />
          <div className="mt-4">
            <ElementsSection
              section={{ ...section, elements: [{ ...bodyEl, content: { ...bodyEl.content, text: aboutText } }] }}
              {...passThrough}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutServiceStacked;
