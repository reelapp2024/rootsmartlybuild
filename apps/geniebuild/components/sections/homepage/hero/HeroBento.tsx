import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl, toDisplayImageUrl, SECTION_IMAGE_PLACEHOLDER } from '../utils/sectionImageResolve';
import { resolveSectionBackground, resolveSectionOverlay, sectionBgHasImage } from '../utils/sectionBackground';
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
 * HeroBento — modern "bento grid + glassmorphism" hero (2025 trend).
 *
 * SAME content, theme colors and editable elements as the other hero variants
 * (badge, title, subtitle, two buttons, trust strip, image). LAYOUT: copy on the
 * left; on the right an asymmetric bento grid of frosted-glass cards — a large
 * image tile, a stat tile, a rating tile — for a Linear/Vercel-style look.
 *
 * Element ids reuse the `h4-` prefix so content carries over on variant switch.
 */
export const HeroBento: React.FC<Props> = ({
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

  const bg = s.backgroundColor || tc?.backgroundColor || '#0A0D12';
  // Section background: honor user color / gradient / image (image-only overlay); default = dark bg.
  const sectionBg = resolveSectionBackground(s, { defaultSurface: bg });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1000&q=80';
  const heroImage = (() => {
    const fromBg = (s.background as any)?.image?.url;
    if (typeof fromBg === 'string' && fromBg.trim()) return toDisplayImageUrl(fromBg.trim());
    if (typeof s.backgroundImage === 'string' && s.backgroundImage.trim()) return toDisplayImageUrl(s.backgroundImage.trim());
    const fromContent = resolveSectionImageUrl(section, { elementId: `${section.id}-h4-bg`, elementImageUrl: content.imageUrl });
    if (fromContent && fromContent !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(fromContent);
    return FALLBACK_IMAGE;
  })();

  const statValue = String((content as any).statValue || (content as any)?.statCard?.value || '20+');
  const statLabel = String((content as any).statLabel || (content as any)?.statCard?.label || 'Years Experience');
  const ratingValue = String((content as any).ratingValue || '4.9');

  const padT = s.paddingTop  || 'pt-24 sm:pt-28 lg:pt-32';
  const padB = s.paddingBottom || 'pb-20 sm:pb-24 lg:pb-32';
  const padX = s.paddingX || 'px-4 sm:px-6 lg:px-8';

  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-badge`, type: 'badge',
    content: { text: content.badgeText || 'Trusted by 5,000+ homes', icon: 'fa-shield-halved', iconPosition: 'left', iconSize: '0.7rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' as any, padding: '8px 16px', borderRadius: '9999px', textAlign: 'left' as any },
  });

  const titleEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-title`, type: 'heading',
    content: { text: content.title || `Plumbing Done <span style="color:${accent}">Right.</span> First Time.`, htmlTag: 'h1' },
    style: { fontSize: s.titleSize || 'clamp(2.25rem, 5vw, 4rem)', fontWeight: '900', lineHeight: '1.05', textAlign: 'left' as any, letterSpacing: '-0.03em' },
  });

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-desc`, type: 'text',
    content: { text: content.subtitle || 'Licensed, insured, and on-call 24/7. Transparent pricing, no surprises — just dependable service.', textSize: 'large' },
    style: { textAlign: 'left' as any, maxWidth: '520px' },
  });

  const btn1El: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-btn1`, type: 'cta-button',
    content: { text: content.ctaText || 'Book a Plumber', link: content.ctaHref || '#' },
    style: { padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem' },
  });

  const btn2El: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-h4-btn2`, type: 'cta-button',
    content: { text: content.secondaryCtaText || 'Call Now', link: content.secondaryCtaHref || 'tel:5551234567', buttonVariant: 'secondary' },
    style: { padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '1rem' },
  });

  const contentTrustStripItems = Array.isArray((content as any)?.trustStripItems)
    ? (content as any).trustStripItems
        .map((item: any) => ({ icon: typeof item?.icon === 'string' ? item.icon.trim() : '', label: typeof item?.label === 'string' ? item.label.trim() : '' }))
        .filter((item: any) => item.icon && item.label)
        .slice(0, 3)
    : [];

  const trustStripEl: WebsiteElement = resolveSectionElement(section, ({
    id: `${section.id}-h4-trust`, type: 'trust-strip',
    content: {
      items: contentTrustStripItems.length ? contentTrustStripItems : [
        { icon: 'fa-clock', label: '24/7 Service' },
        { icon: 'fa-medal', label: 'Licensed & Insured' },
        { icon: 'fa-star',  label: '4.9 / 5 Rating' },
      ],
    } as any,
    style: { iconContainerSize: '32px',
      iconSize: '14px', iconBorderRadius: '9999px', 
      titleFontSize: '13px', titleFontWeight: '600', gap: '24px', padding: '0'} as any,
  } as WebsiteElement));

  const themeColors = { ...tc, titleColor, textColor, buttonBackgroundColor: btnBg, buttonTextColor: btnText, secondaryButtonBorder: accent, secondaryButtonBg: 'transparent', secondaryButtonText: titleColor };

  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  // Frosted-glass card style helper
  const glass: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.12)',
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none z-[1]" style={bgOverlay} />}
      {/* Gradient mesh background (trending) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-56 -left-24 w-[40rem] h-[40rem] rounded-full blur-[150px]" style={{ backgroundColor: `${accent}22` }} />
        <div className="absolute -bottom-40 right-0 w-[36rem] h-[36rem] rounded-full blur-[150px]" style={{ backgroundColor: `${accent}14` }} />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`, backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse at center, black, transparent 75%)' }} />
      </div>

      <div className={`relative z-10 w-full max-w-7xl mx-auto ${padX} ${padT} ${padB}`}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">

          {/* LEFT — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left space-y-6 sm:space-y-7 order-2 lg:order-1"
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

            <div className="pt-2">
              <ElementsSection section={{ ...section, elements: [trustStripEl] }} {...passThrough} />
            </div>
          </motion.div>

          {/* RIGHT — bento grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="order-1 lg:order-2 grid grid-cols-2 grid-rows-[auto_auto] gap-3 sm:gap-4"
          >
            {/* Big image tile (spans 2 cols) */}
            <div className="col-span-2 rounded-3xl overflow-hidden relative" style={{ ...glass, padding: '6px' }}>
              <div className="rounded-[1.25rem] overflow-hidden">
                <img src={heroImage} alt="" className="w-full h-full object-cover" style={{ aspectRatio: '16/9' }} />
              </div>
            </div>

            {/* Stat tile */}
            <div className="rounded-3xl p-5 sm:p-6 flex flex-col justify-center" style={glass}>
              <div className="text-3xl sm:text-4xl font-black leading-none" style={{ color: accent }}>{statValue}</div>
              <div className="text-xs font-semibold uppercase tracking-wider mt-2" style={{ color: textColor }}>{statLabel}</div>
            </div>

            {/* Rating tile */}
            <div className="rounded-3xl p-5 sm:p-6 flex flex-col justify-center" style={glass}>
              <div className="flex items-center gap-1.5">
                <span className="text-3xl sm:text-4xl font-black leading-none" style={{ color: titleColor }}>{ratingValue}</span>
                <i className="fas fa-star text-lg" style={{ color: accent }} aria-hidden="true" />
              </div>
              <div className="flex items-center gap-0.5 mt-2">
                {[0,1,2,3,4].map(i => <i key={i} className="fas fa-star text-[0.7rem]" style={{ color: accent }} aria-hidden="true" />)}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider mt-2" style={{ color: textColor }}>Rated by Customers</div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default HeroBento;
