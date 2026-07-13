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

/**
 * ContactFormDefault — a contact form card. The builder has no dedicated form
 * element, so the heading, intro, trust bullets and submit BUTTON are real
 * editable ElementsSection elements, while the input fields are theme-styled
 * visual placeholders (labels editable via the field list). Colors come from
 * tc.light so the section stays theme-consistent, like the homepage sections.
 */
export const ContactFormDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const cardBg     = fb.background || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border     || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';
  const btnBg      = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText    = (lc.buttonTextColor as string)       || tc?.buttonTextColor       || '#FFFFFF';
  const inputBg    = (lc as any).inputBg || '#F9FAFB';
  const inputBorder= (lc as any).inputBorder || 'rgba(0,0,0,0.12)';

  const savedBg = s.backgroundColor;
  const isThemeSurface = (() => {
    if (!savedBg || typeof savedBg !== 'string') return true;
    const norm = savedBg.trim().toLowerCase();
    return PRESET_THEMES.some(t => {
      const dark  = (t.elements?.surface || '').toLowerCase();
      const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
      return norm === dark || norm === light;
    });
  })();
  const bg = isThemeSurface ? '#FFFFFF' : savedBg;

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-2xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const themeColors = {
    ...tc,
    titleColor, textColor, accentColor: accent,
    secondaryHeadingColor: accent,
    buttonBackgroundColor: btnBg, buttonTextColor: btnText,
  };

  const passThrough = {
    onTextEdit,
    onElementUpdate: onElementUpdate || (() => {}),
    onElementSelect,
    selectedElementId,
    readOnly,
    isWrapped: false,
    buttonClass,
    themeColors,
  } as const;

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cf-badge`) || {
    id: `${section.id}-cf-badge`, type: 'badge',
    content: { text: content.badgeText || 'Send a Message', icon: 'fa-paper-plane', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-cf-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const sourceText: string = (cc.text || c.contactIntroHeading || content.title || 'Send Us a Message').toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { textAlign: 'center' as any, fontWeight: '800', fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cf-desc`) || {
    id: `${section.id}-cf-desc`, type: 'text',
    content: { text: String(c.contactIntroBody || content.subtitle || 'Tell us a little about what you need and the best way to reach you. We\'ll get back to you as soon as possible.'), textSize: 'base' },
    style: { textAlign: 'center' as any, maxWidth: '520px', margin: '0 auto', lineHeight: '1.65' },
  };

  const btnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cf-btn`) || {
    id: `${section.id}-cf-btn`, type: 'button',
    content: { text: content.ctaText || 'Send Message', link: content.ctaHref || '#' },
    style: { backgroundColor: btnBg, color: btnText, padding: '0.875rem 2rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.95rem', width: '100%' } as any,
  };
  const btnElResolved: WebsiteElement = { ...btnEl, content: { ...(btnEl.content || {}), text: content.ctaText || 'Send Message', link: content.ctaHref || '#' } };

  // Visual form fields (no builder form element exists). Labels are configurable
  // via content.fields; defaults cover Name / Email / Phone / Message.
  const fields: Array<{ label: string; type: string }> = Array.isArray(c.fields) && c.fields.length
    ? c.fields.map((f: any) => ({ label: String(f?.label || 'Field'), type: String(f?.type || 'text') }))
    : [
        { label: 'Full Name', type: 'text' },
        { label: 'Email Address', type: 'email' },
        { label: 'Phone Number', type: 'tel' },
        { label: 'Your Message', type: 'textarea' },
      ];

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: '0.625rem',
    padding: '0.75rem 1rem',
    fontSize: '0.95rem',
    color: titleColor,
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="flex justify-center mb-8 sm:mb-10">
          <ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} />
        </motion.div>

        {/* Form card */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="rounded-2xl p-6 sm:p-8 space-y-4"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 12px 32px -16px ${accent}20` }}
        >
          {fields.map((f, i) => (
            <div key={i} className="space-y-1.5">
              <label className="block text-sm font-semibold" style={{ color: textColor }}>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea rows={4} placeholder={f.label} style={inputStyle} disabled={readOnly} />
              ) : (
                <input type={f.type} placeholder={f.label} style={inputStyle} disabled={readOnly} />
              )}
            </div>
          ))}
          <div className="pt-2">
            <ElementsSection section={{ ...section, elements: [btnElResolved] }} {...passThrough} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactFormDefault;
