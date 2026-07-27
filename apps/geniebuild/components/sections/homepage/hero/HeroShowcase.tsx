import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl, toDisplayImageUrl, SECTION_IMAGE_PLACEHOLDER } from '../utils/sectionImageResolve';
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
 * HeroShowcase — third `hero` variant.
 *
 * SAME content, SAME theme colors, SAME editable elements as HeroPlumbing4 /
 * HeroSplit (badge, title, subtitle, two buttons, trust strip, image). Only the
 * LAYOUT differs: centered copy stacked at the top, then a large framed image
 * "showcase" below — a product-launch / SaaS-style hero.
 *
 * Element ids reuse the `h4-` prefix so content carries over when the user
 * switches/refreshes the variant.
 */
export const HeroShowcase: React.FC<Props> = ({
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

  const bg = s.backgroundColor || tc?.backgroundColor || '#0C1015';

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1400&q=80';
  const heroImage = (() => {
    const fromBg = (s.background as any)?.image?.url;
    if (typeof fromBg === 'string' && fromBg.trim()) return toDisplayImageUrl(fromBg.trim());
    if (typeof s.backgroundImage === 'string' && s.backgroundImage.trim()) return toDisplayImageUrl(s.backgroundImage.trim());
    const fromContent = resolveSectionImageUrl(section, { elementId: `${section.id}-h4-bg`, elementImageUrl: content.imageUrl });
    if (fromContent && fromContent !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(fromContent);
    return FALLBACK_IMAGE;
  })();

  const padT = s.paddingTop  || 'pt-24 sm:pt-28 lg:pt-32';
  const padB = s.paddingBottom || 'pb-0';
  const padX = s.paddingX || 'px-4 sm:px-6 lg:px-8';

  // ── Editable elements (same ids/content as HeroPlumbing4, centered) ──
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-badge`) || {
    id: `${section.id}-h4-badge`, type: 'badge',
    content: { text: content.badgeText || 'Trusted by 5,000+ homes', icon: 'fa-shield-halved', iconPosition: 'left', iconSize: '0.7rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' as any, padding: '8px 16px', borderRadius: '9999px', textAlign: 'center' as any },
  };

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-title`) || {
    id: `${section.id}-h4-title`, type: 'heading',
    content: { text: content.title || `Plumbing Done <span style="color:${accent}">Right.</span> First Time.`, htmlTag: 'h1' },
    style: { color: titleColor, fontSize: s.titleSize || 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '900', lineHeight: '1.05', textAlign: 'center' as any, letterSpacing: '-0.02em' },
  };

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-desc`) || {
    id: `${section.id}-h4-desc`, type: 'text',
    content: { text: content.subtitle || 'Licensed, insured, and on-call 24/7. Transparent pricing, no surprises — just dependable service.', textSize: 'large' },
    style: { color: textColor, textAlign: 'center' as any, maxWidth: '620px', margin: '0 auto' },
  };

  const btn1El: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-btn1`) || {
    id: `${section.id}-h4-btn1`, type: 'cta-button',
    content: { text: content.ctaText || 'Book a Plumber', link: content.ctaHref || '#' },
    style: { backgroundColor: btnBg, color: btnText, padding: '1rem 2rem', borderRadius: '0.625rem', fontWeight: '700', fontSize: '1rem' },
  };

  const btn2El: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-btn2`) || {
    id: `${section.id}-h4-btn2`, type: 'cta-button',
    content: { text: content.secondaryCtaText || 'Call Now', link: content.secondaryCtaHref || 'tel:5551234567', buttonVariant: 'secondary' },
    style: { backgroundColor: 'transparent', padding: '1rem 2rem', borderRadius: '0.625rem', fontWeight: '600', fontSize: '1rem' },
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

  const themeColors = { ...tc, titleColor, textColor, buttonBackgroundColor: btnBg, buttonTextColor: btnText, secondaryButtonBorder: accent, secondaryButtonBg: 'transparent', secondaryButtonText: '#FFFFFF' };

  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      {/* Ambient accent glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-[150px]" style={{ backgroundColor: `${accent}1A` }} />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(${textColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <div className={`relative z-10 w-full max-w-5xl mx-auto ${padX} ${padT} ${padB}`}>
        {/* Centered copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center gap-6 sm:gap-7"
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

          <div className="pt-2">
            <ElementsSection section={{ ...section, elements: [trustStripEl] }} {...passThrough} />
          </div>
        </motion.div>

        {/* Large framed image showcase below (overlaps into next section) */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mt-12 sm:mt-16"
          style={{ marginBottom: '-4rem' }}
        >
          <div className="relative rounded-3xl overflow-hidden border mx-auto max-w-4xl"
            style={{ borderColor: `${accent}22`, boxShadow: `0 40px 80px -30px ${accent}55` }}>
            <img src={heroImage} alt="" className="w-full h-full object-cover" style={{ aspectRatio: '16/8' }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroShowcase;
