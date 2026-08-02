import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { CanvasFreeform } from '../../canvas/CanvasFreeform';
import { useCanvasVariantSeed } from '../../canvas/useCanvasVariantSeed';
import { toDisplayImageUrl } from '../utils/sectionImageResolve';

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
 * HeroCanvasTrust — a "Trust & Authority + Conversion" hero on the Canvas section.
 *
 * Design blueprint (ui-ux-pro-max, service/plumbing):
 *   Pattern:   mission/credibility → proof (stats) → strong single CTA
 *   Layout:    split — left content, right image; a proof-stats bar spans below
 *   Type:      bold heading, calm body; accent reserved for the ONE primary CTA
 *   Structure: badge → heading → subtitle → [primary CTA + phone] → trust chips
 *              | right: image | full-width: 3 proof stats (jobs / rating / years)
 *
 * Everything is a real, editable Canvas element. Colours are theme-driven
 * (accent used only on the primary CTA + stat numbers, per the blueprint).
 *
 * DYNAMIC: badgeText, title, subtitle, ctaText/ctaHref, phoneNumber/phoneText,
 * trustStripItems[], hero image (content.data.images[0]).
 * STATIC (see doc): the 3 proof-stat values (jobs done / rating / years) +
 * the floating "licensed" seal — make dynamic when the API provides them.
 */

function buildTrustHero(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;

  const accent = tc?.accentColor || tc?.light?.accentColor || '#B45309';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#0F172A';
  const textColor = tc?.textColor || tc?.light?.textColor || '#475569';
  const mutedColor = tc?.textColorMuted || tc?.muted || tc?.light?.muted || '#64748B';
  const btnBg = tc?.buttonBackgroundColor || tc?.light?.buttonBackgroundColor || accent;
  const btnText = tc?.buttonTextColor || tc?.light?.buttonTextColor || '#FFFFFF';
  const cardBorder = tc?.cardBorderColor || tc?.light?.cardBorderColor || 'rgba(15,23,42,0.10)';
  const cardBg = tc?.cardBackgroundColor || tc?.light?.cardBackgroundColor || '#FFFFFF';

  const badgeText = String(c.badgeText || 'Licensed · Insured · Local');
  const title = String(c.title || 'Reliable plumbing, backed by real guarantees.');
  const subtitle = String(c.subtitle || c.description ||
    'Upfront pricing, on-time arrival and a written workmanship guarantee. Book a fully-vetted plumber in under 60 seconds.');
  const ctaText = String(c.ctaText || 'Get a free quote');
  const ctaHref = String(c.ctaHref || '#');
  const phoneNumber = String(c.phoneNumber || '(555) 123-4567');
  const phoneText = String(c.phoneText || phoneNumber);
  const phoneHref = String(c.phoneHref || (c.phoneNumber ? `tel:${String(c.phoneNumber).replace(/[^0-9+]/g, '')}` : '#'));

  const heroImage = (() => {
    const imgs = c?.data?.images;
    const url = Array.isArray(imgs) && imgs.length ? (imgs[0]?.url || imgs[0]?.src) : (c.imageUrl || '');
    return url ? toDisplayImageUrl(String(url)) : 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1100&q=80';
  })();

  const trustItems: { icon: string; label: string }[] = (() => {
    const raw = c.trustStripItems;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 3).map((it: any, i: number) => ({
        icon: String(it?.icon || ['fa-shield-halved', 'fa-clock', 'fa-star'][i % 3]),
        label: String(it?.label ?? it?.text ?? it ?? '').trim(),
      })).filter((t) => t.label);
    }
    return [
      { icon: 'fa-file-invoice-dollar', label: 'Upfront written quotes' },
      { icon: 'fa-clock', label: 'On-time or money off' },
      { icon: 'fa-shield-halved', label: 'Guaranteed workmanship' },
    ];
  })();

  // Proof stat (STATIC — make dynamic later)
  const mkStat = (sid: string, value: string, label: string, icon: string): WebsiteElement => ({
    id: `ht-${id}-${sid}`, type: 'stat-card',
    content: { value, text: label, icon } as any,
    style: { padding: '1.1rem 1.25rem', borderRadius: '0.9rem', backgroundColor: cardBg, borderWidth: '1px', borderStyle: 'solid', borderColor: cardBorder, titleColor: accent, titleFontSize: '1.9rem', titleFontWeight: '800', descriptionColor: mutedColor, descriptionFontSize: '0.78rem', descriptionFontWeight: '600', iconColor: accent, textAlign: 'left' as any } as any,
    settings: {},
  });

  // LEFT column
  const leftChildren: WebsiteElement[] = [
    {
      id: `ht-${id}-badge`, type: 'badge',
      content: { text: badgeText, icon: 'fa-circle-check', iconPosition: 'left', iconSize: '0.7rem' },
      style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'center' as any, backgroundColor: `${accent}14`, color: accent } as any,
      settings: {},
    },
    {
      id: `ht-${id}-title`, type: 'heading',
      content: { text: title, htmlTag: 'h1' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2.25rem, 4.2vw, 3.5rem)', lineHeight: '1.08', letterSpacing: '-0.03em', textAlign: 'left' as any, fontFamily: 'Poppins, sans-serif' } as any,
      settings: {},
    },
    {
      id: `ht-${id}-subtitle`, type: 'text',
      content: { text: subtitle, textSize: 'large' },
      style: { color: textColor, textAlign: 'left' as any, maxWidth: '520px', lineHeight: '1.7', fontSize: '1.075rem' } as any,
      settings: {},
    },
    {
      id: `ht-${id}-btnrow`, type: 'row',
      content: {
        columnCount: 2, gap: '0.75rem', verticalAlign: 'center',
        children: [
          {
            id: `ht-${id}-cta`, type: 'cta-button',
            content: { text: ctaText, link: ctaHref, buttonVariant: 'primary', icon: 'fa-arrow-right', iconPosition: 'right' },
            style: { buttonVariant: 'primary', backgroundColor: btnBg, color: btnText, padding: '0 2rem', height: '3.4rem', borderRadius: '0.7rem', fontWeight: '700', fontSize: '1rem', width: '100%' } as any,
            settings: {},
          },
          {
            id: `ht-${id}-phone`, type: 'cta-button',
            content: { text: phoneText, link: phoneHref, icon: 'fa-phone', iconPosition: 'left', buttonVariant: 'secondary' },
            style: { buttonVariant: 'secondary', backgroundColor: 'transparent', color: titleColor, borderColor: cardBorder, borderWidth: '1px', borderStyle: 'solid', padding: '0 1.6rem', height: '3.4rem', borderRadius: '0.7rem', fontWeight: '600', fontSize: '0.95rem', width: '100%' } as any,
            settings: {},
          },
        ],
      } as any,
      style: { maxWidth: '480px', marginTop: '0.5rem' } as any,
      settings: {},
    },
    {
      id: `ht-${id}-trust`, type: 'trust-strip',
      content: { items: trustItems } as any,
      style: { iconColor: accent, iconBackgroundColor: `${accent}15`, iconContainerSize: '26px', iconSize: '12px', titleColor: mutedColor, titleFontSize: '13px', titleFontWeight: '600', gap: '22px', justifyContent: 'flex-start', marginTop: '0.75rem' } as any,
      settings: {},
    },
  ];

  // RIGHT column: image + floating "licensed" seal
  const rightChildren: WebsiteElement[] = [
    {
      id: `ht-${id}-image`, type: 'image',
      content: { imageUrl: heroImage, imageAlt: 'Professional plumber at work' },
      style: { width: '100%', borderRadius: '1.5rem', aspectRatio: '4 / 5', objectFit: 'cover' } as any,
      settings: {},
    },
    {
      // STATIC seal — make dynamic later
      id: `ht-${id}-seal`, type: 'stat-card',
      content: { value: '10-yr', text: 'Workmanship guarantee', icon: 'fa-award' } as any,
      style: { padding: '1rem 1.2rem', borderRadius: '1rem', backgroundColor: cardBg, borderWidth: '1px', borderStyle: 'solid', borderColor: cardBorder, titleColor: titleColor, titleFontSize: '1.6rem', titleFontWeight: '800', descriptionColor: mutedColor, descriptionFontSize: '0.76rem', iconColor: accent, maxWidth: '240px', marginTop: '-2.75rem', marginLeft: 'auto', marginRight: '1rem' } as any,
      settings: {},
    },
  ];

  return [
    {
      id: `ht-${id}-row`, type: 'row',
      content: {
        columnCount: 2, gap: '3.5rem', verticalAlign: 'center',
        children: [
          { id: `ht-${id}-colL`, type: 'column', content: { gap: '1.25rem', children: leftChildren } as any, style: { alignItems: 'flex-start' } as any, settings: {} },
          { id: `ht-${id}-colR`, type: 'column', content: { gap: '0', children: rightChildren } as any, style: { alignItems: 'stretch' } as any, settings: {} },
        ],
      } as any,
      style: {} as any,
      settings: {},
    },
    // Proof stats bar (full width, below)
    {
      id: `ht-${id}-statsrow`, type: 'row',
      content: {
        columnCount: 3, gap: '1rem', verticalAlign: 'stretch',
        children: [
          mkStat('stat1', '12,000+', 'Jobs completed', 'fa-wrench'),
          mkStat('stat2', '4.9 / 5', 'Average rating', 'fa-star'),
          mkStat('stat3', '15+ yrs', 'Serving the area', 'fa-medal'),
        ],
      } as any,
      style: { marginTop: '3rem', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: cardBorder, paddingTop: '2rem' } as any,
      settings: {},
    },
  ];
}

export const HeroCanvasTrust: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `ht-${section.id}`,
    buildElements: (s) => buildTrustHero(s, tc),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default HeroCanvasTrust;
