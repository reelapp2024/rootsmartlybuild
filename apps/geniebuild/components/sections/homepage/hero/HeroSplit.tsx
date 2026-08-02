import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl, toDisplayImageUrl, SECTION_IMAGE_PLACEHOLDER } from '../utils/sectionImageResolve';
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
 * HeroSplit — alternate `hero` variant.
 *
 * SAME content, SAME theme colors, SAME editable elements as HeroPlumbing4
 * (badge, title, subtitle, two buttons, trust strip, image). Only the LAYOUT
 * differs: a two-column split — copy on the LEFT (left-aligned), image on the
 * RIGHT — instead of a full-bleed background image with centered content.
 *
 * Element ids reuse the `h4-` prefix so content edited on one variant carries
 * over when the user refreshes/switches the variant.
 */
export const HeroSplit: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  // Same theme tokens as HeroPlumbing4.
  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor  = tc?.textColor  || '#E5E7EB';
  const accent     = tc?.iconColor || tc?.accentColor || '#E11D48';
  const btnBg      = tc?.buttonBackgroundColor || '#E11D48';
  const btnText    = tc?.buttonTextColor || '#FFFFFF';

  // Dark surface background (theme-driven, works on theme-switch).
  const bg = s.backgroundColor || tc?.backgroundColor || '#0C1015';
  // Section background: honor user color / gradient / image (image-only overlay); default = dark bg.
  const sectionBg = resolveSectionBackground(s, { defaultSurface: bg });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);
  const line       = tc?.navBorderColor || 'rgba(255,255,255,0.10)';
  const surface    = tc?.surface || 'rgba(255,255,255,0.03)';
  const mutedColor = tc?.textColorMuted || (tc as any)?.muted || 'rgba(255,255,255,0.55)';

  // Image (same resolution chain as HeroPlumbing4).
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=80';
  const heroImage = (() => {
    const fromBg = (s.background as any)?.image?.url;
    if (typeof fromBg === 'string' && fromBg.trim()) return toDisplayImageUrl(fromBg.trim());
    if (typeof s.backgroundImage === 'string' && s.backgroundImage.trim()) return toDisplayImageUrl(s.backgroundImage.trim());
    const fromContent = resolveSectionImageUrl(section, { elementId: `${section.id}-h4-bg`, elementImageUrl: content.imageUrl });
    if (fromContent && fromContent !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(fromContent);
    return FALLBACK_IMAGE;
  })();

  const padT = s.paddingTop  || 'pt-24 sm:pt-28 lg:pt-32';
  const padB = s.paddingBottom || 'pb-20 sm:pb-24 lg:pb-32';
  const padX = s.paddingX || 'px-4 sm:px-6 lg:px-8';

  // ── Editable elements (same ids/content as HeroPlumbing4, left-aligned) ──
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-badge`) || {
    id: `${section.id}-h4-badge`, type: 'badge',
    content: { text: content.badgeText || 'Trusted by 5,000+ homes', icon: 'fa-shield-halved', iconPosition: 'left', iconSize: '0.7rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' as any, padding: '8px 16px', borderRadius: '9999px', textAlign: 'left' as any, backgroundColor: surface, color: mutedColor },
  };

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-title`) || {
    id: `${section.id}-h4-title`, type: 'heading',
    content: { text: content.title || `Plumbing Done Right. First Time.`, htmlTag: 'h1' },
    style: { color: titleColor, fontSize: s.titleSize || 'clamp(2.25rem, 5vw, 3.75rem)', fontWeight: '900', lineHeight: '1.08', textAlign: 'left' as any, letterSpacing: '-0.02em' },
  };

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-desc`) || {
    id: `${section.id}-h4-desc`, type: 'text',
    content: { text: content.subtitle || 'Licensed, insured, and on-call 24/7. Transparent pricing, no surprises — just dependable service.', textSize: 'large' },
    style: { color: textColor, textAlign: 'left' as any, maxWidth: '540px' },
  };

  const btn1El: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-btn1`) || {
    id: `${section.id}-h4-btn1`, type: 'cta-button',
    content: { text: content.ctaText || 'Book a Plumber', link: content.ctaHref || '#', buttonVariant: 'primary' },
    style: { buttonVariant: 'primary', padding: '1rem 2rem', borderRadius: '0.625rem', fontWeight: '700', fontSize: '1rem' } as any,
  };

  const btn2El: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-btn2`) || {
    id: `${section.id}-h4-btn2`, type: 'cta-button',
    content: { text: content.secondaryCtaText || 'Call Now', link: content.secondaryCtaHref || 'tel:5551234567', buttonVariant: 'secondary' },
    style: { buttonVariant: 'secondary', padding: '1rem 2rem', borderRadius: '0.625rem', fontWeight: '600', fontSize: '1rem' } as any,
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
      titleFontSize: '13px', titleFontWeight: '600', gap: '28px', padding: '0',
    } as any,
  } as WebsiteElement);

  const themeColors = { ...tc, titleColor, textColor, buttonBackgroundColor: btnBg, buttonTextColor: btnText, secondaryButtonBorder: accent, secondaryButtonBg: 'transparent', secondaryButtonText: '#FFFFFF' };

  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="relative w-full overflow-hidden" style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none z-[1]" style={bgOverlay} />}
      {/* Subtle accent glow (keeps the dark hero premium without a full-bleed image) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full blur-[130px]" style={{ backgroundColor: `${accent}18` }} />
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(${textColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <div className={`relative z-10 w-full max-w-7xl mx-auto ${padX} ${padT} ${padB}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* LEFT — copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left space-y-6 sm:space-y-7 order-2 lg:order-1"
          >
            <div className="flex">
              <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
            </div>
            <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
            <ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} />

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <div style={{ width: 'max-content', flexShrink: 0 }}>
                <ElementsSection section={{ ...section, elements: [btn1El] }} {...passThrough} />
              </div>
              <div style={{ width: 'max-content', flexShrink: 0 }}>
                <ElementsSection section={{ ...section, elements: [btn2El] }} {...passThrough} />
              </div>
            </div>

            {/* Trust strip */}
            <div className="pt-3">
              <ElementsSection section={{ ...section, elements: [trustStripEl] }} {...passThrough} />
            </div>
          </motion.div>

          {/* RIGHT — image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative rounded-3xl overflow-hidden border" style={{ borderColor: line, boxShadow: `0 30px 60px -30px ${bg}` }}>
              <img src={heroImage} alt="" className="w-full h-full object-cover" style={{ aspectRatio: '4/3' }} />
              {/* soft neutral corner accent */}
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-2xl" style={{ backgroundColor: surface }} />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default HeroSplit;
