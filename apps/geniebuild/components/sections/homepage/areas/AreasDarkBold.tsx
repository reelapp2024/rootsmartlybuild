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
 * AreasDarkBold — Canvas coverage section matching the html preview:
 *   Left  : eyebrow badge → heading → subtitle → CTA button
 *   Right : a grid of area "chips" (location pin + area name).
 *
 * DYNAMIC (API — backend `areas`): badgeText, title, subtitle, ctaText,
 *   items[] (each an area, read as title|city|name|label).
 */

function buildAreas(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;
  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';
  const btnBg = tc?.buttonBackgroundColor || accent;
  const btnText = tc?.buttonTextColor || '#1A1206';

  const badgeText = String(c.badgeText || 'Coverage');
  const title = String(c.title || 'Proudly serving your whole neighbourhood');
  const subtitle = String(c.subtitle || c.description ||
    'Fast, local pros across the city and surrounding towns. Not sure if we cover you? Just ask — we probably do.');
  const ctaText = String(c.ctaText || 'Check your area');
  const ctaHref = String(c.ctaHref || '#contact');

  const areas: string[] = (() => {
    const raw = c.items || c.areas || c.cities;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((it: any) => String(it?.title ?? it?.city ?? it?.name ?? it?.label ?? it ?? '').trim()).filter(Boolean).slice(0, 12);
    }
    return ['Riverside', 'Oakfield', 'Elm Park', 'Hillcrest', 'Maple Heights', 'Fairview', 'Brookside', 'Westgate'];
  })();

  const leftChildren: WebsiteElement[] = [
    { id: `ar-${id}-badge`, type: 'badge', content: { text: badgeText, iconPosition: 'left' }, style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'left' as any } as any, settings: {} },
    { id: `ar-${id}-title`, type: 'heading', content: { text: title, htmlTag: 'h2' }, style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 3.4vw, 2.9rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'left' as any, marginTop: '0.85rem' } as any, settings: {} },
    { id: `ar-${id}-subtitle`, type: 'text', content: { text: subtitle, textSize: 'large' }, style: { color: textColor, textAlign: 'left' as any, maxWidth: '480px', lineHeight: '1.7', fontSize: '1.06rem', marginTop: '0.9rem' } as any, settings: {} },
    { id: `ar-${id}-cta`, type: 'cta-button', content: { text: ctaText, link: ctaHref, buttonVariant: 'primary', icon: 'fa-arrow-right', iconPosition: 'right' }, style: { buttonVariant: 'primary', backgroundColor: btnBg, color: btnText, padding: '0 2rem', height: '3.4rem', borderRadius: '0.85rem', fontWeight: '700', fontSize: '0.95rem', marginTop: '1.75rem' } as any, settings: {} },
  ];

  // Right: area chips as an icon-box list, 2 columns.
  const chipsRow: WebsiteElement = {
    id: `ar-${id}-chips`, type: 'row',
    content: {
      columnCount: 2, gap: '0.85rem', verticalAlign: 'stretch',
      children: areas.map((name, i) => ({
        id: `ar-${id}-chip-${i}`, type: 'feature-box',
        content: { icon: 'fa-location-dot', text: name, iconPosition: 'left' } as any,
        style: { padding: '0.9rem 1.1rem', borderRadius: '0.85rem', borderWidth: '1px', borderStyle: 'solid', iconContainerSize: '2rem', iconRadius: '0.6rem', titleFontSize: '0.98rem', titleFontWeight: '600', textAlign: 'left' as any } as any,
        settings: {},
      })),
    } as any,
    style: {} as any,
    settings: {},
  };

  return [
    {
      id: `ar-${id}-row`, type: 'row',
      content: {
        columnCount: 2, gap: '3.5rem', verticalAlign: 'center',
        children: [
          { id: `ar-${id}-colL`, type: 'column', content: { gap: '0', children: leftChildren } as any, style: { alignItems: 'flex-start' } as any, settings: {} },
          { id: `ar-${id}-colR`, type: 'column', content: { gap: '0', children: [chipsRow] } as any, style: { alignItems: 'stretch' } as any, settings: {} },
        ],
      } as any,
      style: {} as any,
      settings: {},
    },
  ];
}

function buildStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const AreasDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `ar-${section.id}`,
    buildElements: (s) => buildAreas(s, tc),
    buildStyles: (s) => buildStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default AreasDarkBold;
