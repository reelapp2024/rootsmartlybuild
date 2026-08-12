import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { CanvasFreeform } from '../../canvas/CanvasFreeform';
import { useCanvasVariantSeed } from '../../canvas/useCanvasVariantSeed';
import { collectSectionImageUrls, toDisplayImageUrl } from '../utils/sectionImageResolve';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  isSelected?: boolean;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

/**
 * HeroCanvasSpotlight — a premium, image-driven hero on the Canvas section.
 *
 * Blueprint (ui-ux-pro-max → "Trust & Authority + Conversion"):
 *   Left  : badge → big display heading → subtitle → [primary CTA + phone] →
 *           live star-rating proof.
 *   Right : an IMAGE COLLAGE — one large hero photo plus two smaller
 *           supporting photos overlapping it, a floating rating card and a
 *           floating "available today" pill (depth, not a flat single image).
 *   Below : full-width dynamic trust-strip + three proof stat cards.
 *
 * Why it isn't the flat/boring hero: it consumes the MULTIPLE images the
 * backend actually returns for a hero (main + crew/tools/finished-work) as a
 * layered collage, uses a soft warm gradient glow for depth, and reserves the
 * accent colour strictly for the primary CTA and the numbers.
 *
 * DYNAMIC (from API): badgeText, title, subtitle, ctaText/ctaHref,
 *   phoneNumber/phoneText, trustStripItems[], and up to 3 images
 *   (content.data.images / content.images — collage slots 0,1,2).
 * STATIC (documented, wire to API later): rating value + review count, the
 *   "available today" pill text, and the 3 proof-stat values.
 */

function buildSpotlightHero(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;

  // Theme tokens (accent reserved for CTA + numbers, per blueprint).
  const accent = tc?.accentColor || tc?.light?.accentColor || '#2563EB';
  const primary = tc?.buttonBackgroundColor || tc?.light?.buttonBackgroundColor || accent;
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#0F172A';
  const textColor = tc?.textColor || tc?.light?.textColor || '#475569';
  const mutedColor = tc?.textColorMuted || tc?.muted || tc?.light?.muted || '#64748B';
  const btnText = tc?.buttonTextColor || tc?.light?.buttonTextColor || '#FFFFFF';
  const cardBg = tc?.cardBackgroundColor || tc?.light?.cardBackgroundColor || '#FFFFFF';
  const cardBorder = tc?.cardBorderColor || tc?.light?.cardBorderColor || 'rgba(15,23,42,0.08)';
  const headingFont = tc?.headingFontFamily || tc?.light?.headingFontFamily || 'Calistoga, Georgia, serif';

  const badgeText = String(c.badgeText || 'Trusted local experts');
  const title = String(c.title || 'Fast, honest service you can actually rely on.');
  const subtitle = String(c.subtitle || c.description ||
    'Upfront pricing, on-time arrival and a written guarantee on every job. Book a fully-vetted local pro in under 60 seconds.');
  const ctaText = String(c.ctaText || 'Get a free quote');
  const ctaHref = String(c.ctaHref || '#');
  const phoneNumber = String(c.phoneNumber || '(555) 123-4567');
  const phoneText = String(c.phoneText || phoneNumber);
  const phoneHref = String(c.phoneHref || (c.phoneNumber ? `tel:${String(c.phoneNumber).replace(/[^0-9+]/g, '')}` : '#'));

  // Up to 3 real images for the collage (main + two supporting). Background
  // image is excluded so it never gets pulled into the collage.
  const imgs = collectSectionImageUrls(c, section.styles as any, true).slice(0, 3).map(toDisplayImageUrl);
  const fallbacks = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=80',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80',
  ];
  const mainImg = imgs[0] || fallbacks[0];
  const img2 = imgs[1] || fallbacks[1];
  const img3 = imgs[2] || fallbacks[2];

  const trustItems: { icon: string; label: string }[] = (() => {
    const raw = c.trustStripItems;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 3).map((it: any, i: number) => ({
        icon: String(it?.icon || ['fa-shield-halved', 'fa-clock', 'fa-star'][i % 3]),
        label: String(it?.label ?? it?.text ?? it ?? '').trim(),
      })).filter((t) => t.label);
    }
    return [
      { icon: 'fa-shield-halved', label: 'Licensed & insured' },
      { icon: 'fa-clock', label: 'On-time, every time' },
      { icon: 'fa-file-invoice-dollar', label: 'Upfront written quotes' },
    ];
  })();

  const mkStat = (sid: string, value: string, label: string, icon: string): WebsiteElement => ({
    id: `hs-${id}-${sid}`, type: 'stat-card',
    content: { value, text: label, icon } as any,
    style: {
      padding: '1.15rem 1.35rem', borderRadius: '1rem', backgroundColor: cardBg,
      borderWidth: '1px', borderStyle: 'solid', borderColor: cardBorder,
      titleColor: accent, titleFontSize: '1.95rem', titleFontWeight: '800',
      descriptionColor: mutedColor, descriptionFontSize: '0.78rem', descriptionFontWeight: '600',
      iconColor: accent, textAlign: 'left' as any,
    } as any,
    settings: {},
  });

  // ---- LEFT column ---------------------------------------------------------
  const leftChildren: WebsiteElement[] = [
    {
      id: `hs-${id}-badge`, type: 'badge',
      content: { text: badgeText, icon: 'fa-circle-check', iconPosition: 'left', iconSize: '0.7rem' },
      style: {
        fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' as any,
        padding: '7px 14px', borderRadius: '9999px', textAlign: 'center' as any,
        backgroundColor: `${accent}14`, color: accent,
      } as any,
      settings: {},
    },
    {
      id: `hs-${id}-title`, type: 'heading',
      content: { text: title, htmlTag: 'h1' },
      style: {
        color: titleColor, fontWeight: '700', fontSize: 'clamp(2.4rem, 4.6vw, 3.9rem)',
        lineHeight: '1.05', letterSpacing: '-0.02em', textAlign: 'left' as any, fontFamily: headingFont,
      } as any,
      settings: {},
    },
    {
      id: `hs-${id}-subtitle`, type: 'text',
      content: { text: subtitle, textSize: 'large' },
      style: { color: textColor, textAlign: 'left' as any, maxWidth: '500px', lineHeight: '1.7', fontSize: '1.075rem' } as any,
      settings: {},
    },
    {
      id: `hs-${id}-btnrow`, type: 'row',
      content: {
        columnCount: 2, gap: '0.75rem', verticalAlign: 'center',
        children: [
          {
            id: `hs-${id}-cta`, type: 'cta-button',
            content: { text: ctaText, link: ctaHref, buttonVariant: 'primary', icon: 'fa-arrow-right', iconPosition: 'right' },
            style: { buttonVariant: 'primary', backgroundColor: primary, color: btnText, padding: '0 2rem', height: '3.5rem', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', width: '100%' } as any,
            settings: {},
          },
          {
            id: `hs-${id}-phone`, type: 'cta-button',
            content: { text: phoneText, link: phoneHref, icon: 'fa-phone', iconPosition: 'left', buttonVariant: 'secondary' },
            style: { buttonVariant: 'secondary', backgroundColor: 'transparent', color: titleColor, borderColor: cardBorder, borderWidth: '1px', borderStyle: 'solid', padding: '0 1.5rem', height: '3.5rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '0.95rem', width: '100%' } as any,
            settings: {},
          },
        ],
      } as any,
      style: { maxWidth: '470px', marginTop: '0.5rem' } as any,
      settings: {},
    },
    // Live rating proof: stars + "rated ... by 500+ customers"
    {
      id: `hs-${id}-ratingrow`, type: 'row',
      content: {
        columnCount: 2, gap: '0.9rem', verticalAlign: 'center',
        children: [
          {
            id: `hs-${id}-stars`, type: 'star-rating',
            content: { rating: 5, max: 5 } as any,
            style: { starColor: '#F59E0B', starSize: '1.05rem', gap: '3px' } as any,
            settings: {},
          },
          {
            id: `hs-${id}-ratingtext`, type: 'text',
            content: { text: 'Rated 4.9/5 by 500+ local customers' },
            style: { color: mutedColor, fontSize: '0.9rem', fontWeight: '600', textAlign: 'left' as any } as any,
            settings: {},
          },
        ],
      } as any,
      style: { maxWidth: '470px', marginTop: '1rem' } as any,
      settings: {},
    },
  ];

  // ---- RIGHT column: image collage with floating cards --------------------
  const rightChildren: WebsiteElement[] = [
    {
      // Main hero photo
      id: `hs-${id}-img-main`, type: 'image',
      content: { imageUrl: mainImg, imageAlt: 'Our team at work' },
      style: { width: '100%', borderRadius: '1.5rem', aspectRatio: '4 / 5', objectFit: 'cover', boxShadow: '0 30px 60px -20px rgba(15,23,42,0.35)' } as any,
      settings: {},
    },
    {
      // Two supporting photos side-by-side, overlapping upward into the main image
      id: `hs-${id}-img-row`, type: 'row',
      content: {
        columnCount: 2, gap: '0.85rem', verticalAlign: 'stretch',
        children: [
          {
            id: `hs-${id}-img-2`, type: 'image',
            content: { imageUrl: img2, imageAlt: 'Finished work' },
            style: { width: '100%', borderRadius: '1rem', aspectRatio: '1 / 1', objectFit: 'cover', borderWidth: '4px', borderStyle: 'solid', borderColor: cardBg, boxShadow: '0 18px 40px -18px rgba(15,23,42,0.4)' } as any,
            settings: {},
          },
          {
            id: `hs-${id}-img-3`, type: 'image',
            content: { imageUrl: img3, imageAlt: 'Tools & detail' },
            style: { width: '100%', borderRadius: '1rem', aspectRatio: '1 / 1', objectFit: 'cover', borderWidth: '4px', borderStyle: 'solid', borderColor: cardBg, boxShadow: '0 18px 40px -18px rgba(15,23,42,0.4)' } as any,
            settings: {},
          },
        ],
      } as any,
      style: { maxWidth: '78%', marginTop: '-3.25rem', marginLeft: 'auto', marginRight: '0.5rem', position: 'relative' as any, zIndex: 2 } as any,
      settings: {},
    },
    {
      // Floating "available today" pill (STATIC — wire to API later)
      id: `hs-${id}-pill`, type: 'badge',
      content: { text: 'Available today', icon: 'fa-bolt', iconPosition: 'left', iconSize: '0.7rem' } as any,
      style: {
        fontSize: '0.78rem', fontWeight: '700', padding: '9px 16px', borderRadius: '9999px', textAlign: 'center' as any,
        backgroundColor: cardBg, color: titleColor, borderWidth: '1px', borderStyle: 'solid', borderColor: cardBorder,
        boxShadow: '0 16px 34px -14px rgba(15,23,42,0.45)',
        marginTop: '-13rem', marginLeft: '0.75rem', maxWidth: '160px',
      } as any,
      settings: {},
    },
  ];

  return [
    {
      id: `hs-${id}-row`, type: 'row',
      content: {
        columnCount: 2, gap: '3.5rem', verticalAlign: 'center',
        children: [
          { id: `hs-${id}-colL`, type: 'column', content: { gap: '1.15rem', children: leftChildren } as any, style: { alignItems: 'flex-start' } as any, settings: {} },
          { id: `hs-${id}-colR`, type: 'column', content: { gap: '0', children: rightChildren } as any, style: { alignItems: 'stretch' } as any, settings: {} },
        ],
      } as any,
      style: {} as any,
      settings: {},
    },
    // Dynamic trust-strip
    {
      id: `hs-${id}-trust`, type: 'trust-strip',
      content: { items: trustItems } as any,
      style: {
        iconColor: accent, iconBackgroundColor: `${accent}15`, iconContainerSize: '30px', iconSize: '13px',
        titleColor: mutedColor, titleFontSize: '13px', titleFontWeight: '600', gap: '30px', justifyContent: 'center',
        marginTop: '2.75rem',
      } as any,
      settings: {},
    },
    // Proof stats (STATIC — wire to API later)
    {
      id: `hs-${id}-statsrow`, type: 'row',
      content: {
        columnCount: 3, gap: '1rem', verticalAlign: 'stretch',
        children: [
          mkStat('stat1', '12,000+', 'Jobs completed', 'fa-wrench'),
          mkStat('stat2', '4.9 / 5', 'Average rating', 'fa-star'),
          mkStat('stat3', '15+ yrs', 'Serving the area', 'fa-medal'),
        ],
      } as any,
      style: { marginTop: '1.5rem', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: cardBorder, paddingTop: '2rem' } as any,
      settings: {},
    },
  ];
}

/** Soft warm gradient glow behind the hero (theme-driven, depth). */
function buildSpotlightStyles(section: Section, tc: any): any {
  const accent = tc?.accentColor || tc?.light?.accentColor || '#2563EB';
  const surface = tc?.backgroundColor || tc?.light?.backgroundColor || '#FFF7ED';
  const prev = (section.styles || {}) as any;
  return {
    ...prev,
    minHeight: prev.minHeight || '640px',
    // Soft radial glow → fades into the surface. The renderer draws a centered
    // `radial-gradient(circle, ...)`, so we keep a tight accent core that melts
    // into the page surface for depth without washing out the content.
    background: {
      type: 'gradient',
      gradient: {
        type: 'radial',
        stops: [
          { color: `${accent}14`, position: 0 },
          { color: `${accent}08`, position: 32 },
          { color: surface, position: 70 },
        ],
      },
    },
  };
}

export const HeroCanvasSpotlight: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `hs-${section.id}`,
    buildElements: (s) => buildSpotlightHero(s, tc),
    buildStyles: (s) => buildSpotlightStyles(s, tc),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default HeroCanvasSpotlight;
