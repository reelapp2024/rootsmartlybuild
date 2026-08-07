import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { motion } from 'motion/react';
import { mergeSectionContent, pickAboutServiceImage, resolveAboutImageUrl } from '../aboutservice/aboutServiceShared';
import { resolveSectionBackground } from '../../../../utils/sectionBackground';
import { resolveSectionElement } from '../../../../elements';

/**
 * Service detail hero — copy from `service_sections.servicehero` in Mongo.
 * All text elements go through ElementsSection + resolveSectionElement (SSOT).
 */
export const ServiceHeroDefault: React.FC<{
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
  const c = mergeSectionContent(section);

  const badgeText = String(c.serviceHeroBadge || c.badgeText || 'Service').trim();
  const titleText = String(c.serviceHeroTitle || c.title || 'Our service').trim();
  const descText = String(c.serviceHeroSubtitle || c.subtitle || c.description || '').trim();
  const img = resolveAboutImageUrl(pickAboutServiceImage(c));

  const padT = s.paddingTop ?? 'pt-16 sm:pt-20';
  const padB = s.paddingBottom ?? 'pb-16 sm:pb-20';
  const padX = s.paddingX ?? 'px-4 sm:px-6';
  const bg = s.backgroundColor || tc?.backgroundColor || '#0f172a';
  const bgStyle = resolveSectionBackground(s, { defaultSurface: bg });

  const titleColor = tc?.titleColor || s.titleColor || '#f8fafc';
  const textColor = tc?.textColor || s.textColor || '#cbd5e1';
  const accent = tc?.iconColor || tc?.accentColor || '#E11D48';

  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    iconColor: accent,
  };

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

  const badgeEl = resolveSectionElement(section, {
    id: `${section.id}-shd-badge`,
    type: 'badge',
    content: { text: badgeText, icon: 'fa-screwdriver-wrench', iconPosition: 'left', iconSize: '0.7rem' },
    style: { fontSize: '0.72rem',
      fontWeight: '700',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as any,
      padding: '8px 16px',
      borderRadius: '9999px',
    },
  });

  const titleEl = resolveSectionElement(section, {
    id: `${section.id}-shd-title`,
    type: 'heading',
    content: { text: titleText, htmlTag: 'h1' },
    style: { fontWeight: '900',
      fontSize: s.titleSize || 'clamp(1.875rem, 4vw, 3rem)',
      lineHeight: '1.15',
      letterSpacing: '-0.02em',
    },
  });

  const descEl = resolveSectionElement(section, {
    id: `${section.id}-shd-desc`,
    type: 'text',
    content: { text: descText, textSize: 'large' },
    style: { lineHeight: '1.7', maxWidth: '42rem' },
  });

  return (
    <section className="relative w-full overflow-hidden" style={{ ...bgStyle }}>
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
          <ElementsSection section={{ ...section, elements: [{ ...badgeEl, content: { ...badgeEl.content, text: badgeText } }] }} {...passThrough} />
          <ElementsSection section={{ ...section, elements: [{ ...titleEl, content: { ...titleEl.content, text: titleText, htmlTag: 'h1' } }] }} {...passThrough} />
          {descText ? (
            <ElementsSection section={{ ...section, elements: [{ ...descEl, content: { ...descEl.content, text: descText } }] }} {...passThrough} />
          ) : null}
        </motion.div>
      </div>
    </section>
  );
};

export default ServiceHeroDefault;
