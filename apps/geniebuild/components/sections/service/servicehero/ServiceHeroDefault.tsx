import React from 'react';
import { Section } from '../../../../types';
import { motion } from 'motion/react';
import { mergeSectionContent, pickAboutServiceImage, resolveAboutImageUrl } from '../aboutservice/aboutServiceShared';

/**
 * Service detail hero — copy from `service_sections.servicehero` in Mongo
 * (independent layout from homepage; content is still per service + location).
 */
export const ServiceHeroDefault: React.FC<{
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  readOnly?: boolean;
  themeColors?: any;
  isSelected?: boolean;
}> = ({ section, onTextEdit, readOnly = false }) => {
  const { styles } = section;
  const s = styles as any;
  const c = mergeSectionContent(section);

  const badge = String(c.serviceHeroBadge || c.badgeText || 'Service').trim();
  const title = String(c.serviceHeroTitle || c.title || 'Our service').trim();
  const subtitle = String(c.serviceHeroSubtitle || c.subtitle || c.description || '').trim();
  const img = resolveAboutImageUrl(pickAboutServiceImage(c));

  const padT = s.paddingTop ?? 'pt-16 sm:pt-20';
  const padB = s.paddingBottom ?? 'pb-16 sm:pb-20';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const bg = s.backgroundColor || '#0f172a';
  const titleColor = s.titleColor || '#f8fafc';
  const textColor = s.textColor || '#cbd5e1';

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      {img ? (
        <div className="absolute inset-0">
          <img src={img} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}
      <div className={`relative max-w-5xl mx-auto ${padX} ${padT} ${padB}`}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <span
            className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/15"
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onBlur={(e) => onTextEdit('serviceHeroBadge', e.currentTarget.textContent || '')}
          >
            {badge}
          </span>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight"
            style={{ color: titleColor }}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onBlur={(e) => onTextEdit('serviceHeroTitle', e.currentTarget.textContent || '')}
          >
            {title}
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl leading-relaxed"
            style={{ color: textColor }}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onBlur={(e) => onTextEdit('serviceHeroSubtitle', e.currentTarget.textContent || '')}
          >
            {subtitle}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ServiceHeroDefault;
