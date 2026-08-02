import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionBackground, resolveSectionOverlay, sectionBgHasImage } from '../utils/sectionBackground';
import { motion } from 'motion/react';

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
 * HeroAurora — 2026 trend: animated "aurora" gradient hero.
 *
 * SAME content, theme colors and editable elements as the other hero variants.
 * LAYOUT: no image — a full animated aurora/mesh gradient background (built from
 * the theme accent) with big centered typography, an oversized gradient headline,
 * pill buttons and the trust strip. Bold, minimal, motion-first.
 *
 * Element ids reuse the `h4-` prefix so content carries over on variant switch.
 */
export const HeroAurora: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor  = tc?.textColor  || '#E5E7EB';
  const accent     = tc?.iconColor || tc?.accentColor || '#E11D48';
  const btnBg      = tc?.buttonBackgroundColor || '#E11D48';
  const btnText    = tc?.buttonTextColor || '#FFFFFF';

  const bg = s.backgroundColor || tc?.backgroundColor || '#08090D';
  // Section background: honor user color / gradient / image (image-only overlay); default = the dark bg.
  const sectionBg = resolveSectionBackground(s, { defaultSurface: bg });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const padT = s.paddingTop  || 'pt-28 sm:pt-32 lg:pt-40';
  const padB = s.paddingBottom || 'pb-28 sm:pb-32 lg:pb-40';
  const padX = s.paddingX || 'px-4 sm:px-6 lg:px-8';

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-badge`) || {
    id: `${section.id}-h4-badge`, type: 'badge',
    content: { text: content.badgeText || 'Trusted by 5,000+ homes', icon: 'fa-sparkles', iconPosition: 'left', iconSize: '0.7rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase' as any, padding: '9px 18px', borderRadius: '9999px', textAlign: 'center' as any },
  };

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-title`) || {
    id: `${section.id}-h4-title`, type: 'heading',
    content: { text: content.title || `Plumbing Done <span style="color:${accent}">Right.</span> First Time.`, htmlTag: 'h1' },
    style: { color: titleColor, fontSize: s.titleSize || 'clamp(2.75rem, 8vw, 6rem)', fontWeight: '900', lineHeight: '1.0', textAlign: 'center' as any, letterSpacing: '-0.04em' },
  };

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-desc`) || {
    id: `${section.id}-h4-desc`, type: 'text',
    content: { text: content.subtitle || 'Licensed, insured, and on-call 24/7. Transparent pricing, no surprises — just dependable service.', textSize: 'large' },
    style: { color: textColor, textAlign: 'center' as any, maxWidth: '640px', margin: '0 auto' },
  };

  const btn1El: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-btn1`) || {
    id: `${section.id}-h4-btn1`, type: 'cta-button',
    content: { text: content.ctaText || 'Book a Plumber', link: content.ctaHref || '#' },
    style: { backgroundColor: btnBg, color: btnText, padding: '1rem 2.25rem', borderRadius: '9999px', fontWeight: '700', fontSize: '1rem' },
  };

  const btn2El: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-btn2`) || {
    id: `${section.id}-h4-btn2`, type: 'cta-button',
    content: { text: content.secondaryCtaText || 'Call Now', link: content.secondaryCtaHref || 'tel:5551234567', buttonVariant: 'secondary' },
    style: { backgroundColor: 'rgba(255,255,255,0.06)', padding: '1rem 2.25rem', borderRadius: '9999px', fontWeight: '600', fontSize: '1rem' },
  };

  const contentTrustStripItems = Array.isArray((content as any)?.trustStripItems)
    ? (content as any).trustStripItems
        .map((item: any) => ({ icon: typeof item?.icon === 'string' ? item.icon.trim() : '', label: typeof item?.label === 'string' ? item.label.trim() : '' }))
        .filter((item: any) => item.icon && item.label)
        .slice(0, 3)
    : [];

  const trustStripEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-trust`) || ({
    id: `${section.id}-h4-trust`, type: 'trust-strip',
    content: {
      items: contentTrustStripItems.length ? contentTrustStripItems : [
        { icon: 'fa-clock', label: '24/7 Service' },
        { icon: 'fa-medal', label: 'Licensed & Insured' },
        { icon: 'fa-star',  label: '4.9 / 5 Rating' },
      ],
    } as any,
    style: {
      iconColor: accent, iconBackgroundColor: `${accent}25`, iconContainerSize: '32px',
      iconSize: '14px', iconBorderRadius: '9999px', titleColor: titleColor,
      titleFontSize: '13px', titleFontWeight: '600', gap: '32px', padding: '0',
    } as any,
  } as WebsiteElement);

  const themeColors = { ...tc, titleColor, textColor, buttonBackgroundColor: btnBg, buttonTextColor: btnText, secondaryButtonBorder: accent, secondaryButtonBg: 'transparent', secondaryButtonText: titleColor };

  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none z-[1]" style={bgOverlay} />}
      {/* Animated aurora gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[-20%] left-[10%] w-[45rem] h-[45rem] rounded-full blur-[130px]"
          style={{ backgroundColor: `${accent}33` }}
          animate={{ x: [0, 60, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-25%] right-[5%] w-[40rem] h-[40rem] rounded-full blur-[140px]"
          style={{ backgroundColor: `${accent}22` }}
          animate={{ x: [0, -50, 40, 0], y: [0, 40, -30, 0], scale: [1, 0.9, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[30%] right-[30%] w-[28rem] h-[28rem] rounded-full blur-[120px]"
          style={{ backgroundColor: `${accent}1A` }}
          animate={{ x: [0, 30, -40, 0], y: [0, 30, 20, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* subtle grain/grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(${textColor} 1px, transparent 1px)`, backgroundSize: '38px 38px' }} />
      </div>

      <div className={`relative z-10 w-full max-w-4xl mx-auto ${padX} ${padT} ${padB}`}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center text-center gap-7 sm:gap-8"
        >
          <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
          <ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} />

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <div style={{ width: 'max-content', flexShrink: 0 }}>
              <ElementsSection section={{ ...section, elements: [btn1El] }} {...passThrough} />
            </div>
            <div style={{ width: 'max-content', flexShrink: 0 }}>
              <ElementsSection section={{ ...section, elements: [btn2El] }} {...passThrough} />
            </div>
          </div>

          <div className="pt-3">
            <ElementsSection section={{ ...section, elements: [trustStripEl] }} {...passThrough} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroAurora;
