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
 * CTADarkBold — the closing call-to-action card from the html preview:
 * a dark rounded card with a soft amber glow, a big white heading, a grey
 * subtitle and two centered buttons (amber "call" + outline "book online").
 *
 * DYNAMIC (API — backend `cta`): title, subtitle, ctaText, phoneNumber.
 */

function buildCTA(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;

  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';
  const btnBg = tc?.buttonBackgroundColor || accent;
  const btnText = tc?.buttonTextColor || '#1A1206';

  const title = String(c.title || "Got a plumbing problem? Let's fix it today.");
  const subtitle = String(c.subtitle || c.description ||
    'Free quotes, upfront pricing and a written guarantee. Talk to a real local plumber in minutes.');
  const ctaText = String(c.ctaText || 'Book online');
  const ctaHref = String(c.ctaHref || '#contact');
  const phoneNumber = String(c.phoneNumber || '(555) 123-4567');
  const phoneHref = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`;

  // Card content: heading → subtitle → button row (call + book).
  const cardChildren: WebsiteElement[] = [
    {
      id: `ct-${id}-title`, type: 'heading',
      content: { text: title, htmlTag: 'h2' },
      style: { color: '#FFFFFF', fontWeight: '800', fontSize: 'clamp(2.1rem, 3.8vw, 3rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'center' as any } as any,
      settings: {},
    },
    {
      id: `ct-${id}-subtitle`, type: 'text',
      content: { text: subtitle, textSize: 'large' },
      style: { color: '#94A3B8', textAlign: 'center' as any, maxWidth: '540px', lineHeight: '1.7', fontSize: '1.1rem', marginTop: '1rem', marginLeft: 'auto', marginRight: 'auto' } as any,
      settings: {},
    },
    {
      // Buttons sit inline (auto width, no stretch) and never wrap — like the html.
      id: `ct-${id}-btnrow`, type: 'row',
      content: {
        columnCount: 2, gap: '0.85rem', verticalAlign: 'center', stackOnMobile: false,
        children: [
          {
            id: `ct-${id}-call`, type: 'cta-button',
            content: { text: `Call ${phoneNumber}`, link: phoneHref, buttonVariant: 'primary', icon: 'fa-phone', iconPosition: 'left' },
            style: { buttonVariant: 'primary', backgroundColor: btnBg, color: btnText, padding: '0 1.9rem', height: '3.4rem', borderRadius: '0.85rem', fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap' } as any,
            settings: {},
          },
          {
            id: `ct-${id}-book`, type: 'cta-button',
            content: { text: ctaText, link: ctaHref, buttonVariant: 'secondary' },
            style: { buttonVariant: 'secondary', backgroundColor: 'rgba(255,255,255,0.06)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.16)', borderWidth: '1px', borderStyle: 'solid', padding: '0 1.9rem', height: '3.4rem', borderRadius: '0.85rem', fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap' } as any,
            settings: {},
          },
        ],
      } as any,
      style: { maxWidth: '480px', marginTop: '2rem', marginLeft: 'auto', marginRight: 'auto' } as any,
      settings: {},
    },
  ];

  // The dark glow card wrapper (a column with its own dark bg + accent glow).
  return [
    {
      id: `ct-${id}-card`, type: 'column',
      content: { gap: '0', children: cardChildren } as any,
      style: {
        alignItems: 'center',
        backgroundColor: '#12100A',
        backgroundImage: `radial-gradient(60% 90% at 50% 0%, ${accent}22, transparent 70%)`,
        borderRadius: '2rem', padding: '4.5rem 2.5rem',
        borderWidth: '1px', borderStyle: 'solid', borderColor: `${accent}33`,
      } as any,
      settings: {},
    },
  ];
}

function buildStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const CTADarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `ct-${section.id}`,
    buildElements: (s) => buildCTA(s, tc),
    buildStyles: (s) => buildStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default CTADarkBold;
