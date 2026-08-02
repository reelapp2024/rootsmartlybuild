import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { CanvasFreeform } from '../../canvas/CanvasFreeform';
import { useCanvasVariantSeed } from '../../canvas/useCanvasVariantSeed';

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
 * HeroCanvas — a HERO variant built entirely on the new freeform Canvas section.
 *
 * It seeds a clean, modern, centered hero design (badge → big heading →
 * sub-heading → two buttons → image) as real, individually-editable Canvas
 * elements, then renders them through CanvasFreeform. The user edits each piece
 * (content + style) and can delete/reorder them — but there is no fixed/legacy
 * hero layout: the whole thing IS Canvas elements, so it stays fully editable.
 *
 * Nothing from the old hero variants is reused. Colours come from the theme
 * (elements resolve them at render); the hex here are only seed fallbacks.
 */

/** Build the default hero element set for a section (only used until the user edits). */
function buildHeroElements(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const accent = tc?.accentColor || tc?.light?.accentColor || '#E11D48';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#0F172A';
  const textColor = tc?.textColor || tc?.light?.textColor || '#475569';
  const mutedColor = tc?.textColorMuted || tc?.muted || tc?.light?.muted || '#6B7280';
  const btnBg = tc?.buttonBackgroundColor || tc?.light?.buttonBackgroundColor || accent;
  const btnText = tc?.buttonTextColor || tc?.light?.buttonTextColor || '#FFFFFF';
  const cardBorder = tc?.cardBorderColor || tc?.light?.cardBorderColor || 'rgba(0,0,0,0.08)';

  return [
    {
      id: `hc-${id}-badge`, type: 'badge',
      content: { text: 'Trusted local experts', icon: 'fa-star', iconPosition: 'left', iconSize: '0.65rem' },
      style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px', textAlign: 'center' as any, backgroundColor: cardBorder, color: mutedColor },
      settings: {},
    },
    {
      id: `hc-${id}-heading`, type: 'heading',
      content: { text: 'Quality work, done right the first time.', htmlTag: 'h1' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', lineHeight: '1.08', letterSpacing: '-0.03em', textAlign: 'center' as any },
      settings: {},
    },
    {
      id: `hc-${id}-subtext`, type: 'text',
      content: { text: 'Friendly, fully-licensed and fairly priced. We turn up on time, quote before we start, and stand behind every job.', textSize: 'large' },
      style: { color: textColor, textAlign: 'center' as any, maxWidth: '620px', margin: '0 auto', lineHeight: '1.7' },
      settings: {},
    },
    {
      // Two buttons side-by-side inside a 2-column row.
      id: `hc-${id}-btn-row`, type: 'row',
      content: {
        columnCount: 2,
        gap: '0.75rem',
        verticalAlign: 'center',
        children: [
          {
            id: `hc-${id}-btn-primary`, type: 'cta-button',
            content: { text: 'Get a free quote', link: '#', buttonVariant: 'primary' },
            style: { buttonVariant: 'primary', backgroundColor: btnBg, color: btnText, padding: '0 1.9rem', height: '3.1rem', borderRadius: '0.7rem', fontWeight: '600', fontSize: '0.95rem', width: '100%' } as any,
            settings: {},
          },
          {
            id: `hc-${id}-btn-secondary`, type: 'cta-button',
            content: { text: 'See our work', link: '#', buttonVariant: 'secondary' },
            style: { buttonVariant: 'secondary', padding: '0 1.9rem', height: '3.1rem', borderRadius: '0.7rem', fontWeight: '500', fontSize: '0.95rem', width: '100%' } as any,
            settings: {},
          },
        ],
      } as any,
      style: { maxWidth: '440px', margin: '0.5rem auto 0' } as any,
      settings: {},
    },
    {
      id: `hc-${id}-image`, type: 'image',
      content: { imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80', imageAlt: 'Hero image' },
      style: { width: '100%', maxWidth: '960px', margin: '1.5rem auto 0', borderRadius: '1.25rem', aspectRatio: '16 / 9', objectFit: 'cover' } as any,
      settings: {},
    },
  ];
}

export const HeroCanvas: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  // Seed this variant's design; re-seeds if the section holds a DIFFERENT
  // Canvas variant's elements (so switching to HeroCanvas shows HeroCanvas).
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `hc-${section.id}`,
    buildElements: (s) => buildHeroElements(s, tc),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default HeroCanvas;
