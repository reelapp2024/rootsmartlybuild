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
 * Default service-page “about” layout — split image + copy.
 * Title/body resolve through ElementsSection SSOT.
 */
export const AboutServiceDefault: React.FC<{
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

  const padT = s.paddingTop ?? 'pt-12 sm:pt-16 lg:pt-20';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16 lg:pb-20';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const bg = s.backgroundColor || '#F9FAFB';
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
    id: `${section.id}-asd-title`,
    type: 'heading',
    content: { text: title, htmlTag: 'h2' },
    style: { fontWeight: '700',
      fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
      letterSpacing: '-0.02em',
    },
  });

  const bodyEl = resolveSectionElement(section, {
    id: `${section.id}-asd-body`,
    type: 'text',
    content: { text: aboutText, textSize: 'large' },
    style: { lineHeight: '1.75', minHeight: '120px' },
  });

  return (
    <section className="relative w-full overflow-hidden" style={{ ...bgStyle }}>
      <div className={`max-w-7xl mx-auto ${padX} ${padT} ${padB}`}>
        {!readOnly && (
          <p className="text-[11px] text-gray-500 mb-6 border border-dashed border-gray-300 rounded-lg px-3 py-2 bg-white/80">
            Same SectionContent bundle as the homepage services card for this service. Edits here or on the homepage
            grid stay in sync. Switch variant to <strong>AboutServiceStacked</strong> to preview a different layout only.
          </p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="order-2 lg:order-1"
          >
            {img ? (
              <img
                src={img}
                alt=""
                className="w-full rounded-2xl object-cover shadow-lg max-h-[420px]"
              />
            ) : (
              <div className="w-full aspect-[4/3] rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                Service image
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="order-1 lg:order-2 space-y-4"
          >
            <ElementsSection
              section={{ ...section, elements: [{ ...titleEl, content: { ...titleEl.content, text: title, htmlTag: 'h2' } }] }}
              {...passThrough}
            />
            <ElementsSection
              section={{ ...section, elements: [{ ...bodyEl, content: { ...bodyEl.content, text: aboutText } }] }}
              {...passThrough}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutServiceDefault;
