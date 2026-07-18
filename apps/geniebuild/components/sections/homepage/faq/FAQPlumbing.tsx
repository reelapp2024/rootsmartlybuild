import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
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
  { title: 'Do you offer 24/7 emergency plumbing services?',     content: 'Yes — burst pipes, major leaks and blocked drains don\'t wait for office hours. Our emergency team is on call 24 hours a day, 365 days a year with a typical arrival time of under 60 minutes.' },
  { title: 'Are your plumbers fully licensed and insured?',       content: 'Every plumber on our team is fully licensed, background-checked and covered by comprehensive liability insurance. We\'ll gladly show credentials on arrival.' },
  { title: 'Do you provide upfront pricing before starting work?',content: 'Always. We diagnose the issue, walk you through the options and give you a firm written quote before any work begins. No surprises, no hidden fees.' },
  { title: 'What does your workmanship guarantee cover?',         content: 'All repairs and installations are backed by a 10-year workmanship guarantee. If anything we installed or repaired fails under normal use, we come back and fix it at no charge.' },
  { title: 'Can you handle both residential and commercial jobs?',content: 'From a single leaking faucet in a family home to full commercial bathroom and kitchen fit-outs, our team has the tools and experience to deliver.' },
  { title: 'Do you offer free estimates for larger projects?',    content: 'For renovations, repiping and new installations, we provide free in-home estimates with detailed scope, materials and timeline so you can compare with confidence.' },
];

/**
 * FAQPlumbing — full redesign.
 *
 * Layout: centered header (badge + heading + description) → centered accordion
 * card (full-width on desktop, with a max width for readability) → support CTA
 * row at the bottom.
 *
 * Elements used (all sidebar-editable):
 *   • badge          – "FAQ" pill with accent tint (theme-aware)
 *   • heading        – section title with highlighted last word
 *   • text           – section subtitle
 *   • accordion      – the question list with rich icon/state styling now
 *                       supported in the sidebar (icon type, position, shape;
 *                       open/hover state colors; question/answer typography;
 *                       per-item open-by-default toggle)
 *   • call-to-action – support CTA at the bottom (icon + title + subtitle + button)
 */
export const FAQPlumbing: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const apiBadgeText = String(c.badgeText || 'FAQ');
  const apiTitleText = String(c.title || c.heading || 'Frequently Asked Questions');
  const apiDescriptionText = String(
    c.subtitle ||
    c.description ||
    c.descriptionText ||
    "Everything you need to know before we show up at your door. Can't find what you're looking for? Our support team is one call away."
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
  // fall back to safe light-mode defaults so the section never renders dark
  // even if a theme leaves a token missing.
  const bg          = isThemeSurface ? '#FFFFFF' : savedBg;        // section bg = white
  // Card surface for FAQ items — force white + neutral border. Themes that
  // tint their light palette (e.g. Crimson Jet sets cardBackground to a pink
  // wash) would otherwise leak into the FAQ items, which the design wants
  // strictly white.
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

  // Badge — accent-tinted pill, matches the convention across other sections.
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-badge`) || {
    id: `${section.id}-fqp-badge`, type: 'badge',
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
    const id = `${section.id}-fqp-title`;
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
  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-desc`) || {
    id: `${section.id}-fqp-desc`, type: 'text',
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

  // Accordion — uses all the new sidebar-editable knobs (icon plus/minus,
  // chip background, active state colors, item gap, etc.). Defaults look
  // clean on a light surface.

  // Items driven by content.items — same pattern as testimonials/reviews.
  // When empty, fall back to DEFAULT_FAQS so demo/readOnly pages are never blank.
  const sourceItems: any[] =
    Array.isArray(content.items) && content.items.length > 0 ? content.items : [];

  const items = (sourceItems.length > 0 ? sourceItems : DEFAULT_FAQS).map((it: any, i: number) => {
    const fallback = DEFAULT_FAQS[i % DEFAULT_FAQS.length];
    const title = String(it.question || it.title || '').trim() || fallback.title;
    const body = String(it.answer || it.description || it.content || '').trim() || fallback.content;
    return {
      title,
      content: body,
      openByDefault: Boolean(it.openByDefault) || (sourceItems.length === 0 && i === 0),
    };
  }).filter((it: any) => it.title && it.content);

  // Build accordion element. We DON'T just `find` an existing one here, because
  // that no longer match the design (white-only). We always start from the
  // current default style and let any user-customized keys override on top.
  const savedAccordion = section.elements?.find(e => e.id === `${section.id}-fqp-accordion`);
  const accordionDefaultStyle: Record<string, any> = {
    // Item card chrome — pure white card, neutral border
    backgroundColor: cardBg,
    borderColor: cardBorder,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '0.875rem',
    padding: '1.5rem 1.75rem',
    itemGap: '0.75rem',
    // Icon — plus/minus chip on the right
    iconType: 'plus',
    iconPosition: 'right',
    iconShape: 'circle',
    iconSize: '0.875rem',
    iconColor: accent,
    iconBackgroundColor: `${accent}15`,
    // Question text in neutral title color, answer body in muted text.
    titleColor,
    questionFontSize: '1.0625rem',
    questionFontWeight: '700',
    color: textColor,
    answerFontSize: '0.9375rem',
    answerLineHeight: '1.65',
    // Open / hover state — explicitly neutral so old saves can't bleed accent
    activeBackgroundColor: cardBg,
    activeBorderColor: cardBorder,
    activeTitleColor: '',
    hoverBackgroundColor: '',
    dividerColor: '',
  };
  const accordionEl: WebsiteElement = {
    id: `${section.id}-fqp-accordion`, type: 'accordion',
    content: {
      ...((savedAccordion?.content as any) || {}),
      items,
      exclusive: true,
    } as any,
    style: {
      ...accordionDefaultStyle,
      ...(savedAccordion?.style as any || {}),
      // Force these keys to current defaults — overrides any stale accent values.
      backgroundColor: cardBg,
      borderColor: cardBorder,
      activeBackgroundColor: cardBg,
      activeBorderColor: cardBorder,
    } as any,
  };

  // Support CTA — composed from individual editable elements:
  //   • heading "Still have questions?"
  //   • text    subtitle / availability note
  //   • button  the actual CTA action
  // Wrapped in a white card with accent border to match the section.
  const faqCtaTitle = String(c.faqCtaTitle || c.ctaTitle || 'Still have questions?').trim();
  const faqCtaDescription = String(
    c.faqCtaDescription ||
    c.ctaSubtitle ||
    'Talk to a real plumber. Average pickup in under 30 seconds, available 24/7.'
  ).trim();
  const faqCtaButtonText = String(c.ctaButtonText || '').trim();
  const faqCtaButtonLink = String(c.ctaButtonLink || '').trim();

  const ctaTitleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-cta-title`) || {
    id: `${section.id}-fqp-cta-title`, type: 'heading',
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
      // No explicit color — render falls through to global heading color → theme.titleColor.
    } as any,
  };

  const ctaDescEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-cta-desc`) || {
    id: `${section.id}-fqp-cta-desc`, type: 'text',
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

  const ctaBtnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-cta-btn`) || {
    id: `${section.id}-fqp-cta-btn`, type: 'button',
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

        {/* Accordion — wider container, white wrapper card around the items */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <ElementsSection section={{ ...section, elements: [accordionEl] }} {...passthrough} />
        </motion.div>

        {/* Support CTA — heading + text + real button element, wrapped in a white card */}
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
