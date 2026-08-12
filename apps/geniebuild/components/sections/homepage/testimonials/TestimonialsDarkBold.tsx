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
 * TestimonialsDarkBold — Canvas reviews grid matching the html preview:
 * centered head + N testimonial cards (stars → quote → avatar + name + role).
 *
 * DYNAMIC (API — backend `testimonials`): badgeText, title, subtitle,
 *   items[] ({ description/quote, author, role, avatar, rating }).
 */

function buildTestimonials(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';
  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';

  const badgeText = String(c.badgeText || 'Loved by locals');
  const title = String(c.title || 'What your neighbours say');
  const subtitle = String(c.subtitle || c.description || 'Real reviews from real homes across the area.');

  const items: { quote: string; author: string; role: string; avatar: string; rating: number }[] = (() => {
    const raw = c.items || c.reviews || c.testimonials;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 3).map((it: any) => ({
        quote: String(it?.description ?? it?.quote ?? it?.text ?? '').trim(),
        author: String(it?.author ?? it?.name ?? '').trim(),
        role: String(it?.role ?? it?.location ?? '').trim(),
        avatar: String(it?.avatar ?? it?.image ?? '').trim(),
        rating: Number(it?.rating ?? 5) || 5,
      })).filter((it) => it.quote);
    }
    return [
      { quote: "Turned up on time, quoted before starting and left the place spotless. Fixed a leak two other plumbers couldn't.", author: 'Sarah M.', role: 'Homeowner · Riverside', avatar: 'https://i.pravatar.cc/96?img=32', rating: 5 },
      { quote: 'Booked online in under a minute and they were out the same afternoon. Honest pricing, no surprises on the bill.', author: 'James K.', role: 'Landlord · Oakfield', avatar: 'https://i.pravatar.cc/96?img=12', rating: 5 },
      { quote: 'The 10-year guarantee sold me and the work backed it up. Polite, tidy and genuinely knew their stuff.', author: 'Priya D.', role: 'Homeowner · Elm Park', avatar: 'https://i.pravatar.cc/96?img=45', rating: 5 },
    ];
  })();

  const head: WebsiteElement = {
    id: `ts-${id}-head`, type: 'column',
    content: {
      gap: '0.9rem',
      children: [
        { id: `ts-${id}-badge`, type: 'badge', content: { text: badgeText, iconPosition: 'left' }, style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'center' as any } as any, settings: {} },
        { id: `ts-${id}-title`, type: 'heading', content: { text: title, htmlTag: 'h2' }, style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2.1rem, 3.6vw, 3.1rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'center' as any } as any, settings: {} },
        { id: `ts-${id}-subtitle`, type: 'text', content: { text: subtitle, textSize: 'large' }, style: { color: textColor, textAlign: 'center' as any, maxWidth: '600px', lineHeight: '1.7', fontSize: '1.06rem' } as any, settings: {} },
      ],
    } as any,
    style: { alignItems: 'center', marginBottom: '3.5rem' } as any,
    settings: {},
  };

  const cols = Math.min(Math.max(items.length, 1), 3);
  const cardsRow: WebsiteElement = {
    id: `ts-${id}-cards`, type: 'row',
    content: {
      columnCount: cols, gap: '1.4rem', verticalAlign: 'stretch',
      children: items.map((it, i) => ({
        id: `ts-${id}-card-${i}`, type: 'testimonial-card',
        content: { quote: it.quote, author: it.author, role: it.role, avatar: it.avatar, rating: it.rating, showStars: true, showAvatar: true } as any,
        style: { padding: '2rem 1.85rem', borderRadius: '1.5rem', borderWidth: '1px', borderStyle: 'solid', starColor: accent, textAlign: 'left' as any } as any,
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

export const TestimonialsDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `ts-${section.id}`,
    buildElements: (s) => buildTestimonials(s, tc),
    buildStyles: (s) => buildStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default TestimonialsDarkBold;
