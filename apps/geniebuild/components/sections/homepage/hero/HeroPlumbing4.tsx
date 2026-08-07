import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl, toDisplayImageUrl, SECTION_IMAGE_PLACEHOLDER } from '../utils/sectionImageResolve';
import {
  resolveSectionBackground,
  resolveSectionOverlay,
} from '../../../../utils/sectionBackground';
import { motion } from 'motion/react';
import { resolveSectionElement } from '../../../../elements';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}

/**
 * HeroPlumbing4 — full-bleed hero.
 * Respects styles.background.type: color/gradient use shared resolver;
 * image (or legacy unset) keeps the cover-image layout.
 */
export const HeroPlumbing4: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor = tc?.textColor || '#E5E7EB';
  const accent = tc?.iconColor || tc?.accentColor || '#E11D48';
  const btnBg = tc?.buttonBackgroundColor || '#E11D48';
  const btnText = tc?.buttonTextColor || '#FFFFFF';

  const bgType = String(s.background?.type || '').toLowerCase();
  const useImageLayout = !bgType || bgType === 'image';

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1600&q=80';
  const bgImage = (() => {
    const fromBg = (s.background as any)?.image?.url;
    if (typeof fromBg === 'string' && fromBg.trim()) return toDisplayImageUrl(fromBg.trim());
    if (typeof s.backgroundImage === 'string' && s.backgroundImage.trim()) return toDisplayImageUrl(s.backgroundImage.trim());
    const fromContent = resolveSectionImageUrl(section, { elementId: `${section.id}-h4-bg`, elementImageUrl: content.imageUrl });
    if (fromContent && fromContent !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(fromContent);
    return FALLBACK_IMAGE;
  })();

  const overlayOpacity = (() => {
    const saved = (s.background as any)?.image?.overlay?.opacity ?? (s.background as any)?.overlay?.opacity;
    if (typeof saved === 'number') return saved;
    if (s.overlayOpacityValue !== undefined) return parseFloat(s.overlayOpacityValue);
    if (tc?.overlayOpacity !== undefined) return tc.overlayOpacity;
    return 0.6;
  })();
  const overlayColor = (s.background as any)?.image?.overlay?.color
    || (s.background as any)?.overlay?.color
    || s.overlayColor
    || tc?.overlayColor
    || '#0B0F14';
  const overlayBlend = (s.background as any)?.image?.overlay?.blendMode
    || s.overlayBlendMode
    || 'normal';

  const solidBgStyle = !useImageLayout
    ? resolveSectionBackground(s, { defaultSurface: '#0B0F14' })
    : null;
  const solidOverlay = !useImageLayout ? resolveSectionOverlay(s) : null;

  // ── Editable elements ─────────────────────────────────────────────────
  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-badge`, type: 'badge',
    content: { text: content.badgeText || 'Trusted by 5,000+ homes', icon: 'fa-shield-halved', iconPosition: 'left', iconSize: '0.7rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' as any, padding: '8px 16px', borderRadius: '9999px', textAlign: 'center' as any },
  });

  const titleEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-title`, type: 'heading',
    content: { text: content.title || `Plumbing Done <span style="color:${accent}">Right.</span> First Time.`, htmlTag: 'h1' },
    style: { fontSize: s.titleSize || 'clamp(2.25rem, 6vw, 4.5rem)', fontWeight: '900', lineHeight: '1.05', textAlign: 'center' as any, letterSpacing: '-0.02em' },
  });

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-desc`, type: 'text',
    content: { text: content.subtitle || 'Licensed, insured, and on-call 24/7. Transparent pricing, no surprises — just dependable service.', textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '600px', margin: '0 auto' },
  });

  const btn1El: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-btn1`, type: 'cta-button',
    content: { text: content.ctaText || 'Book a Plumber', link: content.ctaHref || '#' },
    style: { padding: '1rem 2rem', borderRadius: '0.625rem', fontWeight: '700', fontSize: '1rem' },
  });

  const btn2El: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-btn2`, type: 'cta-button',
    content: { text: content.secondaryCtaText || 'Call Now', link: content.secondaryCtaHref || 'tel:5551234567', buttonVariant: 'secondary' },
    style: { padding: '1rem 2rem', borderRadius: '0.625rem', fontWeight: '600', fontSize: '1rem' },
  });

  const themeColors = { ...tc, titleColor, textColor, buttonBackgroundColor: btnBg, buttonTextColor: btnText, secondaryButtonBorder: accent, secondaryButtonBg: 'transparent', secondaryButtonText: '#FFFFFF' };

  const padT = s.paddingTop || 'pt-24 sm:pt-32 lg:pt-40';
  const padB = s.paddingBottom || 'pb-24 sm:pb-32 lg:pb-40';
  const padX = s.paddingX || 'px-4 sm:px-6 lg:px-8';

  // Divider above trust strip — sidebar-editable `divider` element.
  // marginY gives breathing room above + below the line so it doesn't touch siblings.
  const dividerEl: WebsiteElement = resolveSectionElement(section, ({
    id: `${section.id}-h4-divider`, type: 'divider',
    content: { dividerStyle: 'solid', thickness: '1px', marginY: '24px' } as any,
    style: { borderColor: 'rgba(255,255,255,0.12)' } as any,
  } as WebsiteElement));

  const contentTrustStripItems = Array.isArray((content as any)?.trustStripItems)
    ? (content as any).trustStripItems
        .map((item: any) => ({
          icon: typeof item?.icon === 'string' ? item.icon.trim() : '',
          label: typeof item?.label === 'string' ? item.label.trim() : '',
        }))
        .filter((item: any) => item.icon && item.label)
        .slice(0, 3)
    : [];

  // Trust strip — single editable `trust-strip` element.
  const trustStripEl: WebsiteElement = resolveSectionElement(section, ({
    id: `${section.id}-h4-trust`, type: 'trust-strip',
    content: {
      items: contentTrustStripItems.length
        ? contentTrustStripItems
        : [
            { icon: 'fa-clock', label: '24/7 Service' },
            { icon: 'fa-medal', label: 'Licensed & Insured' },
            { icon: 'fa-star',  label: '4.9 / 5 Rating' },
          ],
    } as any,
    style: {
      iconContainerSize: '32px',
      iconSize: '14px',
      iconBorderRadius: '9999px',
      titleFontSize: '13px',
      titleFontWeight: '600',
      gap: '32px',
      padding: '0',
    } as any,
  } as WebsiteElement));

  return (
    <div className="relative w-full overflow-hidden" style={solidBgStyle || undefined}>
      {/* ── Background image (only when bg type is image / legacy) ──────── */}
      {useImageLayout ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={bgImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
            mixBlendMode: overlayBlend as any,
          }} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none" style={{
            background: `linear-gradient(to top, ${overlayColor}E6, transparent)`,
          }} />
        </div>
      ) : (
        solidOverlay ? (
          <div className="absolute inset-0 z-0 pointer-events-none" style={solidOverlay} />
        ) : null
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className={`relative z-10 w-full max-w-4xl mx-auto ${padX} ${padT} ${padB}`}>
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex justify-center mb-6 sm:mb-8">
          <ElementsSection section={{ ...section, elements: [badgeEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-5 sm:mb-7">
          <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-9 sm:mb-11 flex justify-center">
          <ElementsSection section={{ ...section, elements: [descEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Buttons */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-12 sm:mb-14">
          <div style={{ width: 'max-content', flexShrink: 0 }}>
            <ElementsSection section={{ ...section, elements: [btn1El] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
          <div style={{ width: 'max-content', flexShrink: 0 }}>
            <ElementsSection section={{ ...section, elements: [btn2El] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
        </motion.div>

        {/* Divider — real `divider` element (sidebar editable: style, thickness, color, margin) */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <ElementsSection
            section={{ ...section, elements: [dividerEl] }}
            onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})}
            onElementSelect={onElementSelect}
            selectedElementId={selectedElementId}
            readOnly={readOnly}
            isWrapped={false}
            buttonClass={buttonClass}
            themeColors={themeColors}
          />
        </motion.div>

        {/* Trust strip — single sidebar-editable element */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.45 }}>
          <ElementsSection
            section={{ ...section, elements: [trustStripEl] }}
            onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})}
            onElementSelect={onElementSelect}
            selectedElementId={selectedElementId}
            readOnly={readOnly}
            isWrapped={false}
            buttonClass={buttonClass}
            themeColors={themeColors}
          />
        </motion.div>
      </div>
    </div>
  );
};
