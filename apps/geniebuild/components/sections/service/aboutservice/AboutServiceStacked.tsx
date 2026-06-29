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
 * Alternate layout for the same bundle-backed about copy — use Design → variant
 * to confirm content stays identical while only presentation changes.
 */
export const AboutServiceStacked: React.FC<{
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

  const padT = s.paddingTop ?? 'pt-12 sm:pt-16';
  const padB = s.paddingBottom ?? 'pb-12 sm:pb-16';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const bg = s.backgroundColor || '#ffffff';

  return (
    <section className="relative w-full" style={{ backgroundColor: bg }}>
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
          <h2
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4"
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onBlur={(e) => onTextEdit('service_name', e.currentTarget.textContent || '')}
          >
            {title}
          </h2>
          <div className="text-left outline-none">{renderAboutBody(aboutRaw)}</div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutServiceStacked;
