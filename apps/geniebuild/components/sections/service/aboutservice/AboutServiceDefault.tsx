import React from 'react';
import { Section } from '../../../../types';
import { motion } from 'motion/react';
import {
  mergeSectionContent,
  pickAboutServiceBody,
  pickAboutServiceImage,
  pickAboutServiceTitle,
  renderAboutBody,
  resolveAboutImageUrl,
} from './aboutServiceShared';

/**
 * Default service-page “about” layout — split image + copy.
 * Content is resolved from the same `service_sections` / `aboutservice` bundle
 * as the homepage / location services grid (location-scoped when the page has `locationId`).
 */
export const AboutServiceDefault: React.FC<{
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  readOnly?: boolean;
  themeColors?: any;
  isSelected?: boolean;
}> = ({ section, onTextEdit, readOnly = false }) => {
  const { styles } = section;
  const s = styles as any;
  const content = mergeSectionContent(section);
  const title = pickAboutServiceTitle(content);
  const aboutRaw = pickAboutServiceBody(content);
  const img = resolveAboutImageUrl(pickAboutServiceImage(content));

  const padT = s.paddingTop ?? 'pt-12 sm:pt-16 lg:pt-20';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16 lg:pb-20';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const bg = s.backgroundColor || '#F9FAFB';

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
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
            <h2
              className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight"
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onBlur={(e) => onTextEdit('service_name', e.currentTarget.textContent || '')}
            >
              {title}
            </h2>
            <div className="outline-none min-h-[120px]">{renderAboutBody(aboutRaw)}</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutServiceDefault;
