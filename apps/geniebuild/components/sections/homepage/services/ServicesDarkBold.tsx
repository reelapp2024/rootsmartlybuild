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
 * ServicesDarkBold — Canvas-based services grid matching the "Dark & Bold"
 * plumbing-landing.html services section.
 *
 *   Centered head : eyebrow badge → heading → subtitle
 *   Grid          : N feature-box cards (gradient icon → title → description),
 *                   in a responsive row that stacks on mobile.
 *
 * Everything is a real, editable Canvas element. Colours/fonts come from the
 * theme (feature-box resolves its own theme-aware icon/card/border colours).
 *
 * DYNAMIC (API — backend `services` already returns these):
 *   badgeText, title, subtitle/description, items[] ({ icon, title, description }).
 */

function buildServices(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;

  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';

  const badgeText = String(c.badgeText || 'What we do');
  const title = String(c.title || 'Every job, done right the first time');
  const subtitle = String(c.subtitle || c.description ||
    'From quick fixes to full projects — our licensed team handles it with clean, guaranteed workmanship.');

  // Service cards from the API `items[]` (icon + title + description).
  const items: { icon: string; title: string; desc: string }[] = (() => {
    const raw = c.items || c.services || c.cards;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 6).map((it: any, i: number) => ({
        icon: String(it?.icon || ['fa-wrench', 'fa-fire', 'fa-shower', 'fa-faucet', 'fa-screwdriver-wrench', 'fa-house'][i % 6]).replace(/^fas?\s+/, ''),
        title: String(it?.title ?? it?.name ?? '').trim(),
        desc: String(it?.description ?? it?.text ?? it?.subText ?? '').trim(),
      })).filter((it) => it.title);
    }
    return [
      { icon: 'fa-wrench', title: 'Leak & drain repair', desc: 'Fast detection and lasting fixes for leaks, blocked drains and burst pipes — no mess left behind.' },
      { icon: 'fa-fire', title: 'Water heater install', desc: 'Supply, install and service of tankless and storage heaters, sized right for your home and budget.' },
      { icon: 'fa-shower', title: 'Bathroom & kitchen', desc: 'Full fit-outs and remodels — fixtures, taps, toilets and pipework installed to a spotless finish.' },
    ];
  })();

  // Centered head (a column so badge/title/subtitle stack + center).
  const head: WebsiteElement = {
    id: `sv-${id}-head`, type: 'column',
    content: {
      gap: '0.9rem',
      children: [
        {
          id: `sv-${id}-badge`, type: 'badge',
          content: { text: badgeText, iconPosition: 'left' },
          style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'center' as any } as any,
          settings: {},
        },
        {
          id: `sv-${id}-title`, type: 'heading',
          content: { text: title, htmlTag: 'h2' },
          style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2.1rem, 3.6vw, 3.1rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'center' as any } as any,
          settings: {},
        },
        {
          id: `sv-${id}-subtitle`, type: 'text',
          content: { text: subtitle, textSize: 'large' },
          style: { color: textColor, textAlign: 'center' as any, maxWidth: '640px', lineHeight: '1.7', fontSize: '1.06rem' } as any,
          settings: {},
        },
      ],
    } as any,
    style: { alignItems: 'center', marginBottom: '3.5rem' } as any,
    settings: {},
  };

  // Cards grid — feature-box per service (icon top). Row cols follow item count.
  const cols = Math.min(Math.max(items.length, 1), 3);
  const cardsRow: WebsiteElement = {
    id: `sv-${id}-cards`, type: 'row',
    content: {
      columnCount: cols, gap: '1.4rem', verticalAlign: 'stretch',
      children: items.map((it, i) => ({
        id: `sv-${id}-card-${i}`, type: 'feature-box',
        content: { icon: it.icon, text: it.title, subText: it.desc, iconPosition: 'top' } as any,
        style: {
          padding: '2rem 1.85rem', borderRadius: '1.5rem', borderWidth: '1px', borderStyle: 'solid',
          iconContainerSize: '3.5rem', iconRadius: '1rem',
          titleFontSize: '1.4rem', titleFontWeight: '700',
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

function buildServicesStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const ServicesDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `sv-${section.id}`,
    buildElements: (s) => buildServices(s, tc),
    buildStyles: (s) => buildServicesStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default ServicesDarkBold;
