import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}

const DEFAULT_FAQS = [
  { title: 'Do you serve my neighborhood?',                     content: 'We cover every neighborhood across the local area. If you\'re nearby, chances are we already serve your street — give us a quick call to confirm.' },
  { title: 'How fast can you get to me locally?',               content: 'Because we\'re based right in the area, our typical arrival time is under 60 minutes for emergencies and same-day for most standard bookings.' },
  { title: 'Are your local plumbers licensed and insured?',     content: 'Every plumber on our local team is fully licensed, background-checked and covered by comprehensive liability insurance. We\'ll gladly show credentials on arrival.' },
  { title: 'Do you provide upfront pricing before starting work?',content: 'Always. We diagnose the issue, walk you through the options and give you a firm written quote before any work begins. No surprises, no hidden fees.' },
  { title: 'What does your workmanship guarantee cover?',       content: 'All repairs and installations are backed by a 10-year workmanship guarantee. If anything we installed or repaired fails under normal use, we come back and fix it at no charge.' },
  { title: 'Do you offer 24/7 emergency service in this area?', content: 'Yes — burst pipes and major leaks don\'t wait for office hours. Our local emergency team is on call 24 hours a day, 365 days a year.' },
];

/**
 * LocationFaqDefault — full FAQ section mirroring FAQPlumbing.
 *
 * Layout: centered header (badge + heading + description) → centered accordion
 * card → support CTA row at the bottom.
 */
export const LocationFaqDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const apiBadgeText = String(c.badgeText || 'FAQ');
  const apiTitleText = String(c.title || c.heading || 'Local Service FAQs');
  const apiDescriptionText = String(
    c.subtitle ||
    c.description ||
    c.descriptionText ||
    "Everything you need to know before we show up at your door. Can't find what you're looking for? Our local support team is one call away."
  );

  const lc = tc?.light || {};
  const accent = lc.accentColor || tc?.accentColor || '#E11D48';

  const savedBg = s.backgroundColor;
  const isThemeSurface = (() => {
    if (!savedBg || typeof savedBg !== 'string') return true;
    const norm = savedBg.trim().toLowerCase();
    return PRESET_THEMES.some(t => {
      const dark = (t.elements?.surface || '').toLowerCase();
      const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
      return norm === dark || norm === light;
    });
  })();
  // FAQ is a LIGHT section. We read from the light palette (`tc.light`) and
  // fall back to safe light-mode defaults so the section never renders dark.
  const bg          = isThemeSurface ? '#FFFFFF' : savedBg;        // section bg = white
  const cardBg      = '#FFFFFF';
  const cardBorder  = 'rgba(15,23,42,0.08)';
  const titleColor  = lc.titleColor  || '#0F172A';
  const textColor   = lc.textColor   || '#475569';
  const btnBg       = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText     = (lc.buttonTextColor as string)       || tc?.buttonTextColor       || '#FFFFFF';

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6 lg:px-8';
  const innerClass = `max-w-6xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    cardBackgroundColor: cardBg,
    cardBorderColor: cardBorder,
    accordionBackgroundColor: cardBg,
    accordionBorderColor: cardBorder,
    accordionQuestionColor: titleColor,
    accordionAnswerColor: textColor,
    buttonBackgroundColor: btnBg,
    buttonTextColor: btnText,
  };

  // Badge — accent-tinted pill.
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-lfq-badge`) || {
    id: `${section.id}-lfq-badge`, type: 'badge',
    content: { text: c.badgeText || 'FAQ', icon: 'fa-circle-question', iconPosition: 'left', iconSize: '0.7rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.14em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
      backgroundColor: `${accent}1A`,
      color: accent,
    },
  };
  const badgeElResolved: WebsiteElement = {
    ...badgeEl,
    content: { ...(badgeEl.content || {}), text: apiBadgeText },
  };

  // Heading — last word highlighted with accent
  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-lfq-title`;
    const existing = section.elements?.find(e => e.id === id);
    const sourceText: string = apiTitleText.toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) {
      highlightedText = words[words.length - 1];
      textBefore = words.slice(0, -1).join(' ');
    }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { textAlign: 'center' as any, fontWeight: '800', fontSize: 'clamp(1.875rem, 4vw, 2.875rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  // Description — centered, capped width
  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-lfq-desc`) || {
    id: `${section.id}-lfq-desc`, type: 'text',
    content: {
      text: apiDescriptionText,
      textSize: 'large',
    },
    style: { textAlign: 'center' as any, maxWidth: '620px', margin: '0 auto', lineHeight: '1.65' },
  };
  const descElResolved: WebsiteElement = {
    ...descEl,
    content: { ...(descEl.content || {}), text: apiDescriptionText },
  };

  // Accordion — light-surface defaults.
  const isPlaceholderFaqItems = (rows: any[]) => {
    if (!Array.isArray(rows) || rows.length === 0) return false;
    const first = String(rows[0]?.question || rows[0]?.title || '').trim();
    return DEFAULT_FAQS.some((d) => d.title === first);
  };

  const rawFaqItems = Array.isArray(content.items) && content.items.length > 0
    ? content.items
    : readOnly
      ? []
      : (() => {
          const accordionEl = section.elements?.find(
            (e) => e.type === 'accordion' && String(e.id || '').includes('-lfq-accordion')
          );
          const fromEl = (accordionEl?.content as any)?.items;
          if (!Array.isArray(fromEl) || fromEl.length === 0) return [];
          if (isPlaceholderFaqItems(fromEl)) return [];
          return fromEl;
        })();

  const items = rawFaqItems.length > 0
    ? rawFaqItems.map((it: any, i: number) => {
        const title = String(it.question || it.title || '').trim();
        const body = String(it.answer || it.description || it.content || '').trim();
        if (!readOnly && (!title || !body)) {
          const fallback = DEFAULT_FAQS[i % DEFAULT_FAQS.length];
          return {
            title: title || fallback.title,
            content: body || fallback.content,
            openByDefault: !!it.openByDefault,
          };
        }
        return { title, content: body, openByDefault: !!it.openByDefault };
      }).filter((it) => it.title && it.content)
    : readOnly
      ? []
      : DEFAULT_FAQS.map((f, i) => ({ ...f, openByDefault: i === 0 }));

  if (readOnly && items.length === 0) {
    return null;
  }

  const savedAccordion = section.elements?.find(e => e.id === `${section.id}-lfq-accordion`);
  const accordionDefaultStyle: Record<string, any> = {
    backgroundColor: cardBg,
    borderColor: cardBorder,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '0.875rem',
    padding: '1.5rem 1.75rem',
    itemGap: '0.75rem',
    iconType: 'plus',
    iconPosition: 'right',
    iconShape: 'circle',
    iconSize: '0.875rem',
    iconColor: accent,
    iconBackgroundColor: `${accent}15`,
    titleColor,
    questionFontSize: '1.0625rem',
    questionFontWeight: '700',
    color: textColor,
    answerFontSize: '0.9375rem',
    answerLineHeight: '1.65',
    activeBackgroundColor: cardBg,
    activeBorderColor: cardBorder,
    activeTitleColor: '',
    hoverBackgroundColor: '',
    dividerColor: '',
  };
  const accordionEl: WebsiteElement = {
    id: `${section.id}-lfq-accordion`, type: 'accordion',
    content: {
      ...((savedAccordion?.content as any) || {}),
      items,
      exclusive: true,
    } as any,
    style: {
      ...accordionDefaultStyle,
      ...(savedAccordion?.style as any || {}),
      backgroundColor: cardBg,
      borderColor: cardBorder,
      activeBackgroundColor: cardBg,
      activeBorderColor: cardBorder,
    } as any,
  };

  // Support CTA
  const faqCtaTitle = String(c.faqCtaTitle || c.ctaTitle || 'Still have questions?').trim();
  const faqCtaDescription = String(
    c.faqCtaDescription ||
    c.ctaSubtitle ||
    'Talk to a real local plumber. Average pickup in under 30 seconds, available 24/7.'
  ).trim();
  const faqCtaButtonText = String(c.ctaButtonText || '').trim();
  const faqCtaButtonLink = String(c.ctaButtonLink || '').trim();

  const ctaTitleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-lfq-cta-title`) || {
    id: `${section.id}-lfq-cta-title`, type: 'heading',
    content: {
      text: faqCtaTitle,
      htmlTag: 'h3' as any,
    },
    style: {
      textAlign: 'center' as any,
      fontWeight: '800',
      fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
      lineHeight: '1.2',
      letterSpacing: '-0.01em',
    } as any,
  };

  const ctaDescEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-lfq-cta-desc`) || {
    id: `${section.id}-lfq-cta-desc`, type: 'text',
    content: {
      text: faqCtaDescription,
      textSize: 'base',
    },
    style: {
      textAlign: 'center' as any,
      maxWidth: '480px',
      margin: '0 auto',
      lineHeight: '1.6',
      color: textColor,
    } as any,
  };

  const ctaBtnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-lfq-cta-btn`) || {
    id: `${section.id}-lfq-cta-btn`, type: 'button',
    content: {
      text: faqCtaButtonText,
      link: faqCtaButtonLink,
      icon: 'fa-headset',
      iconPosition: 'left',
    } as any,
    style: {
      backgroundColor: btnBg,
      color: btnText,
      padding: '0.875rem 1.75rem',
      borderRadius: '0.5rem',
      fontWeight: '700',
      fontSize: '0.9375rem',
    } as any,
  };

  const ctaTitleElResolved: WebsiteElement = {
    ...ctaTitleEl,
    content: { ...(ctaTitleEl.content || {}), text: faqCtaTitle },
  };
  const ctaDescElResolved: WebsiteElement = {
    ...ctaDescEl,
    content: { ...(ctaDescEl.content || {}), text: faqCtaDescription },
  };
  const ctaBtnElResolved: WebsiteElement = {
    ...ctaBtnEl,
    content: {
      ...(ctaBtnEl.content || {}),
      ...(faqCtaButtonText ? { text: faqCtaButtonText } : {}),
      ...(faqCtaButtonLink ? { link: faqCtaButtonLink } : {}),
    },
  };

  const passthrough = {
    onTextEdit,
    onElementUpdate: onElementUpdate || (() => {}),
    onElementSelect,
    selectedElementId,
    readOnly,
    isWrapped: false,
    buttonClass,
    themeColors,
  };

  return (
    <div className="w-full relative overflow-hidden" style={{ backgroundColor: bg }}>
      <div className={`${innerClass} relative`} style={innerStyle}>
        {/* Header — centered */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...passthrough} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passthrough} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-10 sm:mb-12"
        >
          <ElementsSection section={{ ...section, elements: [descElResolved] }} {...passthrough} />
        </motion.div>

        {/* Accordion — wider container */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <ElementsSection section={{ ...section, elements: [accordionEl] }} {...passthrough} />
        </motion.div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.35 }}
          className="max-w-5xl mx-auto mt-10 sm:mt-12"
        >
          <div
            className="rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <ElementsSection section={{ ...section, elements: [ctaTitleElResolved] }} {...passthrough} />
            <ElementsSection section={{ ...section, elements: [ctaDescElResolved] }} {...passthrough} />
            <div style={{ width: 'max-content' }} className="mt-1">
              <ElementsSection section={{ ...section, elements: [ctaBtnElResolved] }} {...passthrough} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LocationFaqDefault;
