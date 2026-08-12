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
 * FAQDarkBold — Canvas FAQ matching the html preview: centered head + an
 * accordion of question/answer items.
 *
 * DYNAMIC (API — backend `faq`): badgeText, title, subtitle,
 *   items[] ({ question, answer }).
 */

function buildFAQ(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;
  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';

  const badgeText = String(c.badgeText || 'Questions');
  const title = String(c.title || 'Frequently asked questions');
  const subtitle = String(c.subtitle || c.description || 'Everything you need to know before you book.');

  const faqs: { title: string; content: string; openByDefault?: boolean }[] = (() => {
    const raw = c.items || c.faqs || c.questions;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((it: any, i: number) => ({
        title: String(it?.question ?? it?.title ?? it?.q ?? '').trim(),
        content: String(it?.answer ?? it?.content ?? it?.a ?? '').trim(),
        openByDefault: i === 0, // first item open, like the html reference
      })).filter((it) => it.title);
    }
    return [
      { title: 'How quickly can you come out?', content: 'For most jobs we offer same-day or next-day slots, and we run a 24/7 line for genuine emergencies like burst pipes or major leaks.', openByDefault: true },
      { title: 'Do you charge a call-out fee?', content: 'No call-out fee on booked jobs. We give you a fixed, written quote before any work starts, so there are no surprises.' },
      { title: 'Are your team licensed and insured?', content: 'Absolutely. Everyone is fully licensed, background-checked and insured, and all our work is covered by a 10-year guarantee.' },
      { title: 'What areas do you cover?', content: "We serve the whole city and surrounding towns. If your area isn't listed, give us a call — we can almost always help." },
    ];
  })();

  // Bottom "still have a question?" line (dynamic: faqCtaTitle + phone).
  const ctaLine = String(c.faqCtaTitle || 'Still have a question?');
  const phoneNumber = String(c.phoneNumber || c.faqCtaPhone || '(555) 123-4567');

  const head: WebsiteElement = {
    id: `fq-${id}-head`, type: 'column',
    content: {
      gap: '0.9rem',
      children: [
        { id: `fq-${id}-badge`, type: 'badge', content: { text: badgeText, iconPosition: 'left' }, style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'center' as any } as any, settings: {} },
        { id: `fq-${id}-title`, type: 'heading', content: { text: title, htmlTag: 'h2' }, style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2.1rem, 3.6vw, 3.1rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'center' as any } as any, settings: {} },
        { id: `fq-${id}-subtitle`, type: 'text', content: { text: subtitle, textSize: 'large' }, style: { color: textColor, textAlign: 'center' as any, maxWidth: '600px', lineHeight: '1.7', fontSize: '1.06rem' } as any, settings: {} },
      ],
    } as any,
    style: { alignItems: 'center', marginBottom: '3rem' } as any,
    settings: {},
  };

  const accordion: WebsiteElement = {
    id: `fq-${id}-accordion`, type: 'accordion',
    content: { items: faqs, exclusive: true } as any,
    // No hardcoded item background/text colours — the accordion resolves those
    // from the theme at RENDER time (light-aware), so it matches whichever
    // light/dark the section is, even after a theme switch. (Seeding once could
    // otherwise bake in a stale colour.)
    // Spacious card layout matching the html: roomy padding, a rounded-square
    // accent "+" chip, larger question type and a soft divider before the answer.
    style: {
      itemGap: '0.9rem',
      iconType: 'plus', iconPosition: 'right', iconColor: accent,
      iconShape: 'square', iconBackgroundColor: `${accent}1a`, iconSize: '0.9rem',
      borderWidth: '1px', borderStyle: 'solid', borderRadius: '1rem',
      padding: '1.4rem 1.6rem',
      questionFontSize: '1.05rem', questionFontWeight: '700',
      answerFontSize: '1rem', answerLineHeight: '1.7',
      dividerColor: 'rgba(15,23,42,0.08)',
      maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto',
    } as any,
    settings: {},
  };

  // Bottom line: "Still have a question? Call us on <phone>" — phone in accent.
  const ctaFoot: WebsiteElement = {
    id: `fq-${id}-foot`, type: 'text',
    content: { text: `${ctaLine} <a href="tel:${phoneNumber.replace(/[^0-9+]/g, '')}" style="color:${accent};font-weight:700;">Call us on ${phoneNumber}</a>` },
    style: { color: textColor, textAlign: 'center' as any, fontSize: '1rem', marginTop: '2.25rem' } as any,
    settings: {},
  };

  return [head, accordion, ctaFoot];
}

function buildStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const FAQDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `fq-${section.id}`,
    buildElements: (s) => buildFAQ(s, tc),
    buildStyles: (s) => buildStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default FAQDarkBold;
