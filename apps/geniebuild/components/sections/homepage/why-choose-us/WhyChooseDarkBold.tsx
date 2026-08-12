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
 * WhyChooseDarkBold — Canvas "why choose us" grid matching the html preview:
 * centered head + N centered highlight cards (icon on top, title, description).
 *
 * DYNAMIC (API — backend `whychooseus`): badgeText, title, subtitle,
 *   items[] ({ icon, title, description }).
 */

function buildWhyChoose(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';

  const badgeText = String(c.badgeText || 'The difference');
  const title = String(c.title || 'Why homeowners choose us');
  const subtitle = String(c.subtitle || c.description || 'The reasons our customers keep us on speed-dial.');

  const items: { icon: string; title: string; desc: string }[] = (() => {
    const raw = c.items || c.reasons || c.cards;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 6).map((it: any, i: number) => ({
        icon: String(it?.icon || ['fa-bolt', 'fa-hand-holding-dollar', 'fa-shield-halved', 'fa-star', 'fa-clock', 'fa-thumbs-up'][i % 6]).replace(/^fas?\s+/, ''),
        title: String(it?.title ?? it?.heading ?? '').trim(),
        desc: String(it?.description ?? it?.text ?? '').trim(),
      })).filter((it) => it.title);
    }
    return [
      { icon: 'fa-bolt', title: 'Rapid response', desc: "We answer fast and arrive on time — with live tracking so you're never left waiting around." },
      { icon: 'fa-hand-holding-dollar', title: 'Fair, honest pricing', desc: "Clear quotes before we start. You'll always know exactly what you're paying and why." },
      { icon: 'fa-shield-halved', title: 'Guaranteed work', desc: 'Backed by a 10-year workmanship guarantee — we stand behind every job long after we leave.' },
    ];
  })();

  const head: WebsiteElement = {
    id: `wc-${id}-head`, type: 'column',
    content: {
      gap: '0.9rem',
      children: [
        { id: `wc-${id}-badge`, type: 'badge', content: { text: badgeText, iconPosition: 'left' }, style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'center' as any } as any, settings: {} },
        { id: `wc-${id}-title`, type: 'heading', content: { text: title, htmlTag: 'h2' }, style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2.1rem, 3.6vw, 3.1rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'center' as any } as any, settings: {} },
        { id: `wc-${id}-subtitle`, type: 'text', content: { text: subtitle, textSize: 'large' }, style: { color: textColor, textAlign: 'center' as any, maxWidth: '620px', lineHeight: '1.7', fontSize: '1.06rem' } as any, settings: {} },
      ],
    } as any,
    style: { alignItems: 'center', marginBottom: '3.5rem' } as any,
    settings: {},
  };

  const cols = Math.min(Math.max(items.length, 1), 3);
  const cardsRow: WebsiteElement = {
    id: `wc-${id}-cards`, type: 'row',
    content: {
      columnCount: cols, gap: '1.4rem', verticalAlign: 'stretch',
      children: items.map((it, i) => ({
        id: `wc-${id}-card-${i}`, type: 'feature-box',
        content: { icon: it.icon, text: it.title, subText: it.desc, iconPosition: 'top' } as any,
        style: { padding: '2.25rem 1.85rem', borderRadius: '1.5rem', borderWidth: '1px', borderStyle: 'solid', iconContainerSize: '4rem', iconRadius: '1.1rem', titleFontSize: '1.3rem', titleFontWeight: '700', textAlign: 'center' as any } as any,
        settings: {},
      })),
    } as any,
    style: {} as any,
    settings: {},
  };

  return [head, cardsRow];
}

function buildStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const WhyChooseDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `wc-${section.id}`,
    buildElements: (s) => buildWhyChoose(s, tc),
    buildStyles: (s) => buildStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default WhyChooseDarkBold;
