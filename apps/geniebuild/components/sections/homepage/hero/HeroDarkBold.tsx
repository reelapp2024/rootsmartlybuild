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
 * HeroDarkBold — Canvas-based hero that mirrors, 1:1, the hero from the
 * plumbing-landing.html "Dark & Bold" preview.
 *
 *   Left  : eyebrow badge → big heading (accent gradient tail) → subtitle →
 *           [amber CTA + ghost call button] → avatars + 5 stars + rating text.
 *   Right : a framed hero image with a live "Available today" badge and two
 *           floating stat cards (10-yr guarantee, 12,000+ jobs).
 *
 * Everything is a REAL editable Canvas element — the user can edit every piece
 * of text, swap images, change colours, reorder or delete. Colours come from
 * the global theme (Dark & Bold: #0A0E17 base, amber #FBBF24 accent); the hex
 * fallbacks below only apply when a theme token is missing.
 *
 * DYNAMIC (API): badgeText, title, subtitle, ctaText/ctaHref, phoneNumber,
 *   hero image (content.images[0]).
 * STATIC (documented — wire to API later): avatar strip, rating value + review
 *   count, "Available today" badge, and the two floating stat values.
 */

function buildHero(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;

  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';
  const mutedColor = tc?.textColorMuted || tc?.muted || '#64748B';
  const btnBg = tc?.buttonBackgroundColor || tc?.light?.buttonBackgroundColor || accent;
  const btnText = tc?.buttonTextColor || tc?.light?.buttonTextColor || '#1A1206';
  const surface = tc?.cardBackgroundColor || '#131A28';
  const line = tc?.cardBorderColor || tc?.borderColor || 'rgba(255,255,255,0.14)';

  const badgeText = String(c.badgeText || 'Licensed · Insured · Local');
  const title = String(c.title || 'Fast, honest plumbing you can actually rely on.');
  const subtitle = String(c.subtitle || c.description ||
    'Upfront pricing, on-time arrival and a written guarantee on every job. Book a fully-vetted local plumber in under 60 seconds.');
  const ctaText = String(c.ctaText || 'Get a free quote');
  const ctaHref = String(c.ctaHref || '#contact');
  const phoneText = String(c.phoneText || c.phoneNumber || 'Call now');
  const phoneHref = String(c.phoneHref || (c.phoneNumber ? `tel:${String(c.phoneNumber).replace(/[^0-9+]/g, '')}` : '#'));

  const heroImg = (() => {
    const arr = collectSectionImageUrls(c, section.styles as any, true).map(toDisplayImageUrl);
    return arr[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=80';
  })();

  // ---- Dynamic proof / stats (fall back to sensible defaults) --------------
  const ratingText = String(c.ratingText || c.reviewText || '4.9/5 from 500+ reviews');
  const reviewAvatars: { src: string; alt?: string }[] = (() => {
    const raw = c.reviewAvatars || c.avatars;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 5).map((a: any, i: number) => ({
        src: String(a?.src || a?.url || a || ''), alt: String(a?.alt || `Customer ${i + 1}`),
      })).filter((a) => a.src);
    }
    return [
      { src: 'https://i.pravatar.cc/80?img=12', alt: 'Customer' },
      { src: 'https://i.pravatar.cc/80?img=32', alt: 'Customer' },
      { src: 'https://i.pravatar.cc/80?img=45', alt: 'Customer' },
      { src: 'https://i.pravatar.cc/80?img=5',  alt: 'Customer' },
    ];
  })();
  // Two floating stat cards over the image. API can supply heroStats[]; else default.
  const heroStats: { value: string; label: string; icon: string }[] = (() => {
    const raw = c.heroStats;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 2).map((s: any, i: number) => ({
        value: String(s?.value ?? s?.number ?? ''),
        label: String(s?.label ?? s?.text ?? ''),
        icon: String(s?.icon || ['fa-shield-halved', 'fa-wrench'][i % 2]),
      })).filter((s) => s.value);
    }
    return [
      { value: '10-yr', label: 'Workmanship guarantee', icon: 'fa-shield-halved' },
      { value: '12,000+', label: 'Jobs completed', icon: 'fa-wrench' },
    ];
  })();

  // ---- LEFT column ---------------------------------------------------------
  const leftChildren: WebsiteElement[] = [
    {
      // Colours intentionally omitted — the badge element resolves its own
      // theme-aware background/text, so it follows the active theme (Dark & Bold,
      // Crimson Jet, …) instead of staying frozen on a hardcoded colour.
      id: `hb-${id}-badge`, type: 'badge',
      content: { text: badgeText, icon: 'fa-circle-check', iconPosition: 'left', iconSize: '0.7rem' },
      style: {
        fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' as any,
        padding: '8px 15px', borderRadius: '9999px', textAlign: 'left' as any,
      } as any,
      settings: {},
    },
    {
      id: `hb-${id}-title`, type: 'heading',
      content: { text: title, htmlTag: 'h1' },
      style: {
        color: titleColor, fontWeight: '800', fontSize: 'clamp(2.9rem, 5.4vw, 4.6rem)',
        lineHeight: '1.04', letterSpacing: '-0.03em', textAlign: 'left' as any,
        marginTop: '1.4rem', marginBottom: '1.3rem',
      } as any,
      settings: {},
    },
    {
      id: `hb-${id}-subtitle`, type: 'text',
      content: { text: subtitle, textSize: 'large' },
      style: { color: textColor, textAlign: 'left' as any, maxWidth: '520px', lineHeight: '1.7', fontSize: '1.18rem' } as any,
      settings: {},
    },
    {
      id: `hb-${id}-btnrow`, type: 'row',
      content: {
        columnCount: 2, gap: '0.85rem', verticalAlign: 'center', stackOnMobile: false,
        children: [
          {
            id: `hb-${id}-cta`, type: 'cta-button',
            content: { text: ctaText, link: ctaHref, buttonVariant: 'primary', icon: 'fa-arrow-right', iconPosition: 'right' },
            style: { buttonVariant: 'primary', backgroundColor: btnBg, color: btnText, padding: '0 2rem', height: '3.5rem', borderRadius: '0.875rem', fontWeight: '700', fontSize: '0.95rem', width: '100%' } as any,
            settings: {},
          },
          {
            id: `hb-${id}-phone`, type: 'cta-button',
            content: { text: phoneText, link: phoneHref, icon: 'fa-phone', iconPosition: 'left', buttonVariant: 'secondary' },
            style: { buttonVariant: 'secondary', backgroundColor: 'rgba(255,255,255,0.05)', color: titleColor, borderColor: line, borderWidth: '1px', borderStyle: 'solid', padding: '0 1.6rem', height: '3.5rem', borderRadius: '0.875rem', fontWeight: '700', fontSize: '0.95rem', width: '100%' } as any,
            settings: {},
          },
        ],
      } as any,
      style: { maxWidth: '470px', marginTop: '2.1rem' } as any,
      settings: {},
    },
    // proof: avatar stack + stars + text
    {
      id: `hb-${id}-proof`, type: 'row',
      content: {
        columnCount: 3, gap: '1rem', verticalAlign: 'center', stackOnMobile: false,
        children: [
          {
            id: `hb-${id}-avatars`, type: 'user-avatars',
            content: { showCount: false, items: reviewAvatars } as any,
            style: { avatarSize: '40px', avatarOverlap: '12px', ringColor: surface, ringWidth: '3px', justifyContent: 'flex-start' } as any,
            settings: {},
          },
          {
            id: `hb-${id}-stars`, type: 'star-rating',
            content: { rating: 5, maxRating: 5 } as any,
            style: { starColor: accent, starSize: '1.05rem', gap: '2px' } as any,
            settings: {},
          },
          {
            id: `hb-${id}-prooftext`, type: 'text',
            content: { text: ratingText },
            style: { color: textColor, fontSize: '0.9rem', fontWeight: '600', textAlign: 'left' as any } as any,
            settings: {},
          },
        ],
      } as any,
      style: { maxWidth: '520px', marginTop: '1.9rem' } as any,
      settings: {},
    },
  ];

  // ---- RIGHT column: framed image + floating cards ------------------------
  const rightChildren: WebsiteElement[] = [
    {
      id: `hb-${id}-image`, type: 'image',
      content: { imageUrl: heroImg, imageAlt: 'Professional at work' },
      style: { width: '100%', borderRadius: '2rem', aspectRatio: '4 / 4.4', objectFit: 'cover', borderWidth: '1px', borderStyle: 'solid', borderColor: line, boxShadow: '0 50px 90px -30px rgba(0,0,0,0.8)' } as any,
      settings: {},
    },
    {
      // two floating stat cards, overlapping the image bottom
      id: `hb-${id}-floatrow`, type: 'row',
      content: {
        columnCount: 2, gap: '0.85rem', verticalAlign: 'stretch',
        children: heroStats.map((st, i) => ({
          id: `hb-${id}-float-${i + 1}`, type: 'stat-card',
          content: { value: st.value, text: st.label, icon: st.icon } as any,
          style: { padding: '1rem 1.1rem', borderRadius: '1.1rem', backgroundColor: surface, borderWidth: '1px', borderStyle: 'solid', borderColor: line, titleColor: titleColor, titleFontSize: '1.35rem', titleFontWeight: '800', descriptionColor: mutedColor, descriptionFontSize: '0.72rem', descriptionFontWeight: '600', iconColor: accent, textAlign: 'left' as any, boxShadow: '0 24px 48px -18px rgba(0,0,0,0.7)' } as any,
          settings: {},
        })),
      } as any,
      style: { marginTop: '-2.6rem', position: 'relative' as any, zIndex: 4, paddingLeft: '0.5rem', paddingRight: '0.5rem' } as any,
      settings: {},
    },
  ];

  return [
    {
      id: `hb-${id}-row`, type: 'row',
      content: {
        columnCount: 2, gap: '3.5rem', verticalAlign: 'center',
        children: [
          { id: `hb-${id}-colL`, type: 'column', content: { gap: '0', children: leftChildren } as any, style: { alignItems: 'flex-start' } as any, settings: {} },
          { id: `hb-${id}-colR`, type: 'column', content: { gap: '0', children: rightChildren } as any, style: { alignItems: 'stretch' } as any, settings: {} },
        ],
      } as any,
      style: {} as any,
      settings: {},
    },
  ];
}

/**
 * Hero section styles: just a min-height + the reusable "Grid + Glow" background
 * pattern (see Design tab → Background Pattern). The pattern itself is rendered
 * theme-driven by CanvasFreeform, so it's not baked in here and can be swapped /
 * reused on any section. A user can change or remove it from the Design tab.
 */
function buildHeroStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return {
    ...prev,
    minHeight: prev.minHeight || '620px',
    bgPattern: prev.bgPattern || 'grid-glow',
  };
}

export const HeroDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `hb-${section.id}`,
    buildElements: (s) => buildHero(s, tc),
    buildStyles: (s) => buildHeroStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default HeroDarkBold;
