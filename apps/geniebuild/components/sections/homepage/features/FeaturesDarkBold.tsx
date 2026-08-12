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
 * FeaturesDarkBold — Canvas-based "why us" feature grid matching the
 * plumbing-landing.html features block.
 *
 *   Centered head : eyebrow badge → heading → subtitle
 *   Grid          : feature-box cards with the ICON ON THE LEFT (title + desc),
 *                   laid out 2-up (responsive, stacks on mobile).
 *
 * Real editable Canvas elements; theme-driven colours (feature-box resolves its
 * own icon/card/border colours; heading auto black-on-light / white-on-dark).
 *
 * DYNAMIC (API — backend `features` already returns these):
 *   badgeText, title, subtitle, items[] ({ icon, title, description }).
 */

function buildFeatures(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;

  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';

  const badgeText = String(c.badgeText || 'Why choose us');
  const title = String(c.title || 'Built to make it painless');
  const subtitle = String(c.subtitle || c.description ||
    'Everything about how we work is designed to save you time, money and stress.');

  const items: { icon: string; title: string; desc: string }[] = (() => {
    const raw = c.items || c.features || c.cards;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 6).map((it: any, i: number) => ({
        icon: String(it?.icon || ['fa-circle-dollar-to-slot', 'fa-clock', 'fa-shield-halved', 'fa-award', 'fa-thumbs-up', 'fa-leaf'][i % 6]).replace(/^fas?\s+/, ''),
        title: String(it?.title ?? it?.name ?? '').trim(),
        desc: String(it?.description ?? it?.text ?? it?.subText ?? '').trim(),
      })).filter((it) => it.title);
    }
    return [
      { icon: 'fa-circle-dollar-to-slot', title: 'Upfront, fixed pricing', desc: 'You approve the price before we lift a tool — no hourly surprises, no hidden add-ons on the final bill.' },
      { icon: 'fa-clock', title: 'Same-day availability', desc: "Book in under a minute and we'll often be at your door the very same day — 24/7 for emergencies." },
      { icon: 'fa-shield-halved', title: 'Fully vetted pros', desc: 'Every team member is licensed, background-checked and insured — the same trusted face, every visit.' },
      { icon: 'fa-award', title: '10-year guarantee', desc: "Our workmanship is backed in writing for a full decade. If something's not right, we make it right." },
    ];
  })();

  const head: WebsiteElement = {
    id: `ft-${id}-head`, type: 'column',
    content: {
      gap: '0.9rem',
      children: [
        {
          id: `ft-${id}-badge`, type: 'badge',
          content: { text: badgeText, iconPosition: 'left' },
          style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'center' as any } as any,
          settings: {},
        },
        {
          id: `ft-${id}-title`, type: 'heading',
          content: { text: title, htmlTag: 'h2' },
          style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2.1rem, 3.6vw, 3.1rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'center' as any } as any,
          settings: {},
        },
        {
          id: `ft-${id}-subtitle`, type: 'text',
          content: { text: subtitle, textSize: 'large' },
          style: { color: textColor, textAlign: 'center' as any, maxWidth: '620px', lineHeight: '1.7', fontSize: '1.06rem' } as any,
          settings: {},
        },
      ],
    } as any,
    style: { alignItems: 'center', marginBottom: '3.5rem' } as any,
    settings: {},
  };

  // 2-up grid, icon on the LEFT of each feature-box.
  const cols = items.length >= 2 ? 2 : 1;
  const cardsRow: WebsiteElement = {
    id: `ft-${id}-cards`, type: 'row',
    content: {
      columnCount: cols, gap: '1.25rem', verticalAlign: 'stretch',
      children: items.map((it, i) => ({
        id: `ft-${id}-card-${i}`, type: 'feature-box',
        content: { icon: it.icon, text: it.title, subText: it.desc, iconPosition: 'left' } as any,
        style: {
          padding: '1.75rem', borderRadius: '1.5rem', borderWidth: '1px', borderStyle: 'solid',
          iconContainerSize: '3.25rem', iconRadius: '0.9rem',
          titleFontSize: '1.2rem', titleFontWeight: '700',
          textAlign: 'left' as any,
        } as any,
        settings: {},
      })),
    } as any,
    style: {} as any,
    settings: {},
  };

  return [head, cardsRow];
}

function buildFeaturesStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const FeaturesDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `ft-${section.id}`,
    buildElements: (s) => buildFeatures(s, tc),
    buildStyles: (s) => buildFeaturesStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default FeaturesDarkBold;
