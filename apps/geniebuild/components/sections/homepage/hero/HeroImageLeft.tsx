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
 * HeroImageLeft — fourth `hero` variant.
 *
 * SAME content, theme colors and editable elements as the other hero variants.
 * Only the LAYOUT differs: a two-column split with the IMAGE on the LEFT and the
 * copy on the RIGHT, plus a small floating "stat" card overlapping the image
 * corner. Mirror of HeroSplit with an extra visual accent.
 *
 * Element ids reuse the `h4-` prefix so content carries over on variant switch.
 */
export const HeroImageLeft: React.FC<Props> = ({
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
  const cardBorder = tc?.cardBorder || 'rgba(255,255,255,0.12)';

  const bg = s.backgroundColor || tc?.backgroundColor || '#0C1015';
  // Section background: honor user color / gradient / image (image-only overlay); default = dark bg.
  const sectionBg = resolveSectionBackground(s, { defaultSurface: bg });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=80';
  const heroImage = (() => {
    const fromBg = (s.background as any)?.image?.url;
    if (typeof fromBg === 'string' && fromBg.trim()) return toDisplayImageUrl(fromBg.trim());
    if (typeof s.backgroundImage === 'string' && s.backgroundImage.trim()) return toDisplayImageUrl(s.backgroundImage.trim());
    const fromContent = resolveSectionImageUrl(section, { elementId: `${section.id}-h4-bg`, elementImageUrl: content.imageUrl });
    if (fromContent && fromContent !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(fromContent);
    return FALLBACK_IMAGE;
  })();

  // Optional stat overlay (from content, else a sensible default).
  const statValue = String((content as any).statValue || (content as any)?.statCard?.value || '20+');
  const statLabel = String((content as any).statLabel || (content as any)?.statCard?.label || 'Years of Experience');

  const padT = s.paddingTop  || 'pt-24 sm:pt-28 lg:pt-32';
  const padB = s.paddingBottom || 'pb-20 sm:pb-24 lg:pb-32';
  const padX = s.paddingX || 'px-4 sm:px-6 lg:px-8';

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-badge`) || {
    id: `${section.id}-h4-badge`, type: 'badge',
    content: { text: content.badgeText || 'Trusted by 5,000+ homes', icon: 'fa-shield-halved', iconPosition: 'left', iconSize: '0.7rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' as any, padding: '8px 16px', borderRadius: '9999px', textAlign: 'left' as any },
  };

  const titleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-title`) || {
    id: `${section.id}-h4-title`, type: 'heading',
    content: { text: content.title || 'Plumbing Done Right. First Time.', htmlTag: 'h1' },
    style: { color: titleColor, fontSize: s.titleSize || 'clamp(2.25rem, 5vw, 3.75rem)', fontWeight: '900', lineHeight: '1.08', textAlign: 'left' as any, letterSpacing: '-0.02em' },
  };

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-desc`) || {
    id: `${section.id}-h4-desc`, type: 'text',
    content: { text: content.subtitle || 'Licensed, insured, and on-call 24/7. Transparent pricing, no surprises — just dependable service.', textSize: 'large' },
    style: { color: textColor, textAlign: 'left' as any, maxWidth: '540px' },
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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-32 w-[34rem] h-[34rem] rounded-full blur-[130px]" style={{ backgroundColor: cardBorder }} />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(${textColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <div className={`relative z-10 w-full max-w-7xl mx-auto ${padX} ${padT} ${padB}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* LEFT — image with floating stat card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="relative order-1"
          >
            <div className="relative rounded-3xl overflow-hidden border" style={{ borderColor: cardBorder, boxShadow: '0 30px 60px -30px rgba(0,0,0,0.55)' }}>
              <img src={heroImage} alt="" className="w-full h-full object-cover" style={{ aspectRatio: '4/3' }} />
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-5 -right-3 sm:-right-5 rounded-2xl px-5 py-4 backdrop-blur"
              style={{ backgroundColor: `${accent}`, color: btnText, boxShadow: `0 20px 40px -18px ${accent}88` }}>
              <div className="text-2xl sm:text-3xl font-black leading-none">{statValue}</div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-wider opacity-90 mt-1">{statLabel}</div>
            </div>
          </motion.div>

          {/* RIGHT — copy */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-left space-y-6 sm:space-y-7 order-2"
          >
            <div className="flex">
              <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
            </div>
            <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
            <ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} />

            <div className="flex flex-wrap gap-3 pt-1">
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
    </div>
  );
};

export default HeroImageLeft;
