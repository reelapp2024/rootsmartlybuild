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
 * AboutDarkBold — Canvas-based split "about" section matching the
 * plumbing-landing.html about block.
 *
 *   Left  : eyebrow badge → heading → subtitle → benefit cards → CTA button.
 *   Right : image + a floating "experience" stat card (years in the trade).
 *
 * Real editable Canvas elements; theme-driven colours (heading auto
 * black-on-light / white-on-dark). Accent only on the CTA + stat number.
 *
 * DYNAMIC (API — backend `about` already returns these):
 *   badgeText, title, subtitle, items[] ({ icon, heading, description }),
 *   ctaText, image (content.images[0]).
 * STATIC (documented — wire later): the "15+ yrs" experience value.
 */

function buildAbout(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;

  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';
  const btnBg = tc?.buttonBackgroundColor || accent;
  const btnText = tc?.buttonTextColor || '#1A1206';
  const line = tc?.cardBorderColor || tc?.borderColor || 'rgba(255,255,255,0.14)';

  const badgeText = String(c.badgeText || 'About us');
  const title = String(c.title || 'Your trusted local team');
  const subtitle = String(c.subtitle || c.description ||
    'We started with one goal — to take the stress out of hiring a pro. Honest advice, fair prices and clean, careful work in every home we visit.');
  const ctaText = String(c.ctaText || 'Meet the team');
  const ctaHref = String(c.ctaHref || '#contact');
  const expValue = String(c.experienceValue || c.experience || '15+');
  const expLabel = String(c.experienceLabel || 'Years in the trade');

  const aboutImg = (() => {
    const arr = collectSectionImageUrls(c, section.styles as any, true).map(toDisplayImageUrl);
    return arr[0] || 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80';
  })();

  // Benefit items → small feature-box "checklist" cards (icon left).
  const items: { icon: string; heading: string; desc: string }[] = (() => {
    const raw = c.items || c.points || c.highlights;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 4).map((it: any, i: number) => ({
        icon: String(it?.icon || ['fa-shield-halved', 'fa-clock', 'fa-thumbs-up', 'fa-award'][i % 4]).replace(/^fas?\s+/, ''),
        heading: String(it?.heading ?? it?.title ?? '').trim(),
        desc: String(it?.description ?? it?.text ?? '').trim(),
      })).filter((it) => it.heading);
    }
    return [
      { icon: 'fa-shield-halved', heading: 'Licensed & insured', desc: 'Fully certified professionals you can trust in your home.' },
      { icon: 'fa-clock', heading: '24/7 emergency service', desc: "We're available day or night for your urgent needs." },
    ];
  })();

  const leftChildren: WebsiteElement[] = [
    {
      id: `ab-${id}-badge`, type: 'badge',
      content: { text: badgeText, iconPosition: 'left' },
      style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'left' as any } as any,
      settings: {},
    },
    {
      id: `ab-${id}-title`, type: 'heading',
      content: { text: title, htmlTag: 'h2' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 3.4vw, 2.9rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'left' as any, marginTop: '0.9rem' } as any,
      settings: {},
    },
    {
      id: `ab-${id}-subtitle`, type: 'text',
      content: { text: subtitle, textSize: 'large' },
      style: { color: textColor, textAlign: 'left' as any, maxWidth: '520px', lineHeight: '1.7', fontSize: '1.06rem', marginTop: '0.9rem' } as any,
      settings: {},
    },
    {
      id: `ab-${id}-benefits`, type: 'row',
      content: {
        columnCount: items.length >= 2 ? 2 : 1, gap: '1rem', verticalAlign: 'stretch',
        children: items.map((it, i) => ({
          id: `ab-${id}-benefit-${i}`, type: 'feature-box',
          content: { icon: it.icon, text: it.heading, subText: it.desc, iconPosition: 'left' } as any,
          style: { padding: '1.2rem', borderRadius: '1rem', borderWidth: '1px', borderStyle: 'solid', iconContainerSize: '2.5rem', iconRadius: '0.7rem', titleFontSize: '1rem', titleFontWeight: '700', textAlign: 'left' as any } as any,
          settings: {},
        })),
      } as any,
      style: { marginTop: '1.75rem' } as any,
      settings: {},
    },
    {
      id: `ab-${id}-cta`, type: 'cta-button',
      content: { text: ctaText, link: ctaHref, buttonVariant: 'primary', icon: 'fa-arrow-right', iconPosition: 'right' },
      style: { buttonVariant: 'primary', backgroundColor: btnBg, color: btnText, padding: '0 2rem', height: '3.4rem', borderRadius: '0.85rem', fontWeight: '700', fontSize: '0.95rem', marginTop: '1.75rem' } as any,
      settings: {},
    },
  ];

  const rightChildren: WebsiteElement[] = [
    {
      id: `ab-${id}-image`, type: 'image',
      content: { imageUrl: aboutImg, imageAlt: 'Our team' },
      style: { width: '100%', borderRadius: '2rem', aspectRatio: '5 / 4', objectFit: 'cover', borderWidth: '1px', borderStyle: 'solid', borderColor: line, boxShadow: '0 40px 80px -30px rgba(0,0,0,0.7)' } as any,
      settings: {},
    },
    {
      // Floating experience badge (value dynamic, styling accent)
      id: `ab-${id}-exp`, type: 'stat-card',
      content: { value: expValue, text: expLabel, icon: 'fa-medal' } as any,
      // Sits cleanly BELOW the image (a negative-margin float gets clipped behind
      // the image in the Canvas grid, so we keep it in normal flow).
      style: { padding: '1.15rem 1.5rem', borderRadius: '1.1rem', backgroundColor: btnBg, titleColor: btnText, titleFontSize: '2rem', titleFontWeight: '800', descriptionColor: btnText, descriptionFontSize: '0.78rem', descriptionFontWeight: '700', iconColor: btnText, textAlign: 'left' as any, boxShadow: '0 20px 44px -16px rgba(0,0,0,0.5)', marginTop: '1rem' } as any,
      settings: {},
    },
  ];

  return [
    {
      id: `ab-${id}-row`, type: 'row',
      content: {
        columnCount: 2, gap: '3.75rem', verticalAlign: 'center',
        children: [
          { id: `ab-${id}-colL`, type: 'column', content: { gap: '0', children: leftChildren } as any, style: { alignItems: 'flex-start' } as any, settings: {} },
          { id: `ab-${id}-colR`, type: 'column', content: { gap: '0', children: rightChildren } as any, style: { alignItems: 'stretch' } as any, settings: {} },
        ],
      } as any,
      style: {} as any,
      settings: {},
    },
  ];
}

function buildAboutStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const AboutDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `ab-${section.id}`,
    buildElements: (s) => buildAbout(s, tc),
    buildStyles: (s) => buildAboutStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default AboutDarkBold;
