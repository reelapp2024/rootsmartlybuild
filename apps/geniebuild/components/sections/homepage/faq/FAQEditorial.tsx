import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionBackground, resolveSectionOverlay, sectionBgHasImage } from '../utils/sectionBackground';
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

/**
 * FAQEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * A two-column layout: a sticky left column (badge + neutral heading + intro +
 * a compact "still have questions?" support CTA), and a right column holding
 * the accordion of Q&A. Industry-neutral, light section.
 *
 * Fully dynamic keys: badgeText, title/heading, subtitle/description,
 * items[]{question,answer,openByDefault}, faqCtaTitle, faqCtaDescription,
 * ctaButtonText, ctaButtonLink. No images. Element ids reuse the `fqp-` prefix
 * (`fqp-badge/title/desc/accordion/cta-title/cta-desc/cta-btn`) so content
 * carries over on variant switch.
 */
const DEFAULT_FAQS = [
  { title: 'Do you offer emergency callouts?',            content: "Yes. Some jobs can't wait for office hours, so our emergency team is on call and aims to be with you fast." },
  { title: 'Are you fully licensed and insured?',         content: "Every member of the team is fully licensed, background-checked and covered by liability insurance. We're happy to show credentials on arrival." },
  { title: 'Do you give upfront pricing before starting?', content: 'Always. We look at the job, walk you through the options and give a firm written quote before any work begins. No surprises.' },
  { title: 'What does your guarantee cover?',             content: 'Our work is backed in writing. If something we installed or repaired fails under normal use, we come back and put it right at no charge.' },
  { title: 'Do you handle both homes and businesses?',    content: 'From a single small job at home to larger commercial fit-outs, our team has the tools and experience to deliver.' },
  { title: 'Do you provide free estimates for big jobs?', content: 'For larger projects we provide a free estimate with a clear scope, materials and timeline so you can compare with confidence.' },
];

export const FAQEditorial: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const apiBadgeText = String(c.badgeText || 'FAQ');
  const apiTitleText = String(c.title || c.heading || 'Frequently asked questions');
  const apiDescriptionText = String(c.subtitle || c.description || c.descriptionText || "Everything you need to know before we start. Can't find your answer? Our team is one call away.");

  const lc = tc?.light || {};
  const accent = lc.accentColor || tc?.accentColor || '#E11D48';

  // Section background: honor the user's color / gradient / image choice (with
  // image-only overlay) via the shared resolver. Default surface = theme light
  // surface (white fallback) when nothing explicit is set.
  const defaultSurface = lc.surface || (lc as any).cardBackgroundColor || '#FFFFFF';
  const sectionBg = resolveSectionBackground(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);
  const cardBg     = '#FFFFFF';
  const cardBorder = 'rgba(15,23,42,0.08)';
  const titleColor = lc.titleColor || '#0F172A';
  const textColor  = lc.textColor  || '#475569';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';
  const btnBg      = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText    = (lc.buttonTextColor as string) || tc?.buttonTextColor || '#FFFFFF';

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1240px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent,
    cardBackgroundColor: cardBg, cardBorderColor: cardBorder,
    accordionBackgroundColor: cardBg, accordionBorderColor: cardBorder,
    accordionQuestionColor: titleColor, accordionAnswerColor: textColor,
    buttonBackgroundColor: btnBg, buttonTextColor: btnText,
  };

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-badge`) || {
    id: `${section.id}-fqp-badge`, type: 'badge',
    content: { text: c.badgeText || 'FAQ', iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase' as any, padding: '0', borderRadius: '0', textAlign: 'left' as any, backgroundColor: 'transparent', color: mutedColor },
  };
  const badgeElResolved: WebsiteElement = { ...badgeEl, content: { ...(badgeEl.content || {}), text: apiBadgeText } };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-fqp-title`;
    const existing = section.elements?.find(e => e.id === id);
    const src = String((existing?.content as any)?.text || apiTitleText).replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { textAlign: 'left' as any, color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 2.875rem)', lineHeight: '1.12', letterSpacing: '-0.03em' },
    };
    if (existing) {
      return { ...existing, type: 'heading', content: { ...(existing.content || {}), htmlTag: (existing.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), ...(existing.style as any) } } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-desc`) || {
    id: `${section.id}-fqp-desc`, type: 'text',
    content: { text: apiDescriptionText, textSize: 'large' },
    style: { textAlign: 'left' as any, maxWidth: '420px', lineHeight: '1.7', color: textColor },
  };
  const descElResolved: WebsiteElement = { ...descEl, content: { ...(descEl.content || {}), text: apiDescriptionText } };

  const sourceItems: any[] = Array.isArray(content.items) && content.items.length > 0 ? content.items : [];
  const items = (sourceItems.length > 0 ? sourceItems : DEFAULT_FAQS).map((it: any, i: number) => {
    const fallback = DEFAULT_FAQS[i % DEFAULT_FAQS.length];
    const title = String(it.question || it.title || '').trim() || fallback.title;
    const body = String(it.answer || it.description || it.content || '').trim() || fallback.content;
    return { title, content: body, openByDefault: Boolean(it.openByDefault) || (sourceItems.length === 0 && i === 0) };
  }).filter((it: any) => it.title && it.content);

  const savedAccordion = section.elements?.find(e => e.id === `${section.id}-fqp-accordion`);
  const accordionDefaultStyle: Record<string, any> = {
    backgroundColor: cardBg, borderColor: cardBorder, borderWidth: '1px', borderStyle: 'solid',
    borderRadius: '0.875rem', padding: '1.35rem 1.6rem', itemGap: '0.75rem',
    iconType: 'plus', iconPosition: 'right', iconShape: 'circle', iconSize: '0.875rem',
    iconColor: accent, iconBackgroundColor: `${accent}15`,
    titleColor, questionFontSize: '1.0625rem', questionFontWeight: '700',
    color: textColor, answerFontSize: '0.9375rem', answerLineHeight: '1.65',
    activeBackgroundColor: cardBg, activeBorderColor: cardBorder, activeTitleColor: '', hoverBackgroundColor: '', dividerColor: '',
  };
  const accordionEl: WebsiteElement = {
    id: `${section.id}-fqp-accordion`, type: 'accordion',
    content: { ...((savedAccordion?.content as any) || {}), items, exclusive: true } as any,
    style: { ...accordionDefaultStyle, ...(savedAccordion?.style as any || {}), backgroundColor: cardBg, borderColor: cardBorder, activeBackgroundColor: cardBg } as any,
  };

  const faqCtaTitle = String(c.faqCtaTitle || c.ctaTitle || 'Still have questions?').trim();
  const faqCtaDescription = String(c.faqCtaDescription || c.ctaSubtitle || 'Talk to a real person. We usually pick up in under 30 seconds.').trim();
  const faqCtaButtonText = String(c.ctaButtonText || '').trim();
  const faqCtaButtonLink = String(c.ctaButtonLink || '').trim();

  const ctaTitleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-cta-title`) || {
    id: `${section.id}-fqp-cta-title`, type: 'heading',
    content: { text: faqCtaTitle, htmlTag: 'h3' as any },
    style: { textAlign: 'left' as any, fontWeight: '800', fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)', lineHeight: '1.2', letterSpacing: '-0.01em' } as any,
  };
  const ctaDescEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-cta-desc`) || {
    id: `${section.id}-fqp-cta-desc`, type: 'text',
    content: { text: faqCtaDescription, textSize: 'base' },
    style: { textAlign: 'left' as any, maxWidth: '360px', lineHeight: '1.6', color: textColor } as any,
  };
  const ctaBtnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-fqp-cta-btn`) || {
    id: `${section.id}-fqp-cta-btn`, type: 'cta-button',
    content: { text: faqCtaButtonText, link: faqCtaButtonLink, icon: 'fa-headset', iconPosition: 'left' } as any,
    style: { backgroundColor: btnBg, color: btnText, padding: '0 1.6rem', height: '2.9rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.9rem' } as any,
  };
  const ctaTitleElResolved: WebsiteElement = { ...ctaTitleEl, content: { ...(ctaTitleEl.content || {}), text: faqCtaTitle } };
  const ctaDescElResolved: WebsiteElement = { ...ctaDescEl, content: { ...(ctaDescEl.content || {}), text: faqCtaDescription } };
  const ctaBtnElResolved: WebsiteElement = { ...ctaBtnEl, content: { ...(ctaBtnEl.content || {}), ...(faqCtaButtonText ? { text: faqCtaButtonText } : {}), ...(faqCtaButtonLink ? { link: faqCtaButtonLink } : {}) } };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full relative overflow-hidden" style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />}
      <div className={`relative z-10 ${innerClass}`} style={innerStyle}>
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16">

          {/* Left — header + support CTA (sticky) */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:sticky lg:top-24 self-start">
            <div className="inline-flex items-center gap-2.5">
              <span aria-hidden className="h-px w-8" style={{ backgroundColor: cardBorder }} />
              <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...pass} />
            </div>
            <div className="mt-5"><ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} /></div>
            <div className="mt-5"><ElementsSection section={{ ...section, elements: [descElResolved] }} {...pass} /></div>

            <div className="mt-8 rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
              <ElementsSection section={{ ...section, elements: [ctaTitleElResolved] }} {...pass} />
              <div className="mt-2"><ElementsSection section={{ ...section, elements: [ctaDescElResolved] }} {...pass} /></div>
              <div className="mt-5" style={{ width: 'max-content' }}><ElementsSection section={{ ...section, elements: [ctaBtnElResolved] }} {...pass} /></div>
            </div>
          </motion.div>

          {/* Right — accordion */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
            <ElementsSection section={{ ...section, elements: [accordionEl] }} {...pass} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FAQEditorial;
