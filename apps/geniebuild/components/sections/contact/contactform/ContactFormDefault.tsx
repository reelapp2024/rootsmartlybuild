import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { getProjectIdFromUrl } from '../../../../lib/aboutUsApi';
import { resolveSectionBackground } from '../../../../utils/sectionBackground';
import {
  fetchProjectDynamicForm,
  mapDynamicFormToSectionFields,
  submitDynamicFormData,
} from '../../../../lib/dynamicFormApi';
import { resolveSectionElement, elementFromExistingOrDna } from '../../../../elements';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  projectId?: string;
}

type FormFieldView = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

/**
 * ContactFormDefault — marketing copy via ElementsSection; fields from admin
 * DynamicForm (fetch_dynamic_forms / submit_form_data). Builder = preview;
 * live readOnly = interactive submit.
 */
export const ContactFormDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc, projectId: projectIdProp,
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
  const bgStyle = resolveSectionBackground(s, { defaultSurface: bg });

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

  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cf-badge`, type: 'badge',
    content: { text: content.badgeText || 'Send a Message', icon: 'fa-paper-plane', iconPosition: 'left', iconSize: '0.65rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  });

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-cf-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const sourceText: string = (cc.text || c.contactIntroHeading || content.title || 'Send Us a Message').toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { textAlign: 'center' as any, fontWeight: '800', fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    });
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          htmlTag: (existing.content as any)?.htmlTag || 'h2',
        },
        style: { ...(base.style as any), ...(existing.style as any) },
      } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cf-desc`, type: 'text',
    content: { text: String(c.contactIntroBody || content.subtitle || 'Tell us a little about what you need and the best way to reach you. We\'ll get back to you as soon as possible.'), textSize: 'base' },
    style: { textAlign: 'center' as any, maxWidth: '520px', margin: '0 auto', lineHeight: '1.65' },
  });

  const projectId = String(projectIdProp || getProjectIdFromUrl() || '').trim();
  const storedFormId = String(c.formId || '').trim();

  const fallbackFields: FormFieldView[] = useMemo(() => {
    if (Array.isArray(c.fields) && c.fields.length) {
      return c.fields.map((f: any, i: number) => ({
        name: String(f?.name || `field_${i + 1}`).trim(),
        label: String(f?.label || 'Field').trim(),
        type: String(f?.type || 'text').trim(),
        required: Boolean(f?.required),
        options: Array.isArray(f?.options) ? f.options.map(String) : [],
        placeholder: String(f?.placeholder || f?.label || '').trim(),
      }));
    }
    return [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'email_address', label: 'Email Address', type: 'email', required: true },
      { name: 'phone_number', label: 'Phone Number', type: 'tel' },
      { name: 'your_message', label: 'Your Message', type: 'textarea', required: true },
    ];
  }, [c.fields]);

  const [formId, setFormId] = useState(storedFormId);
  const [fields, setFields] = useState<FormFieldView[]>(fallbackFields);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [statusOk, setStatusOk] = useState<boolean | null>(null);
  const [formMissing, setFormMissing] = useState(Boolean(c.formMissing));

  useEffect(() => {
    setFields(fallbackFields);
    setFormId(storedFormId);
  }, [fallbackFields, storedFormId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectId) return;
      const form = await fetchProjectDynamicForm(projectId);
      if (cancelled) return;
      if (!form?._id) {
        setFormMissing(true);
        return;
      }
      const mapped = mapDynamicFormToSectionFields(form);
      setFormId(String(form._id));
      if (mapped.length) setFields(mapped);
      setFormMissing(false);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    setValues((prev) => {
      const next: Record<string, string> = {};
      for (const f of fields) {
        next[f.name] = prev[f.name] ?? '';
      }
      return next;
    });
  }, [fields]);

  const onChangeField = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readOnly) return; // builder preview — no submit
    if (!formId) {
      setStatusOk(false);
      setStatusMsg('Contact form is not set up yet. Please configure a form in admin.');
      return;
    }
    for (const f of fields) {
      if (f.required && !String(values[f.name] || '').trim()) {
        setStatusOk(false);
        setStatusMsg(`Please fill in "${f.label}".`);
        return;
      }
    }
    setSubmitting(true);
    setStatusMsg('');
    const result = await submitDynamicFormData(formId, values);
    setSubmitting(false);
    setStatusOk(result.ok);
    setStatusMsg(result.message);
    if (result.ok) {
      setValues((prev) => {
        const cleared: Record<string, string> = {};
        Object.keys(prev).forEach((k) => { cleared[k] = ''; });
        return cleared;
      });
    }
  }, [readOnly, formId, fields, values]);

  const btnLabel = content.ctaText || 'Send Message';
  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: '0.625rem',
    padding: '0.75rem 1rem',
    fontSize: '0.95rem',
    
    width: '100%',
    outline: 'none'};

  const renderField = (f: FormFieldView, i: number) => {
    const common = {
      id: `${section.id}-field-${f.name || i}`,
      name: f.name,
      required: Boolean(f.required) && readOnly,
      placeholder: f.placeholder || f.label,
      style: inputStyle,
      disabled: !readOnly || submitting,
      value: values[f.name] || '',
      onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        onChangeField(f.name, ev.target.value),
    };

    if (f.type === 'textarea') {
      return <textarea key={f.name || i} rows={4} {...common} />;
    }
    if (f.type === 'select') {
      return (
        <select key={f.name || i} {...common}>
          <option value="">{f.placeholder || `Select ${f.label}`}</option>
          {(f.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (f.type === 'checkbox') {
      return (
        <label key={f.name || i} className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
          <input
            type="checkbox"
            name={f.name}
            checked={values[f.name] === 'true' || values[f.name] === '1'}
            disabled={!readOnly || submitting}
            onChange={(ev) => onChangeField(f.name, ev.target.checked ? 'true' : '')}
          />
          {f.label}
        </label>
      );
    }
    const inputType = ['email', 'tel', 'number', 'date', 'file'].includes(f.type) ? f.type : 'text';
    return <input key={f.name || i} type={inputType} {...common} />;
  };

  return (
    <div className="w-full" style={{ ...bgStyle }}>
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

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="rounded-2xl p-6 sm:p-8 space-y-4"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 12px 32px -16px ${accent}20` }}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate={!readOnly}>
            {fields.map((f, i) => (
              <div key={f.name || i} className="space-y-1.5">
                {f.type !== 'checkbox' && (
                  <label className="block text-sm font-semibold" style={{ color: textColor }} htmlFor={`${section.id}-field-${f.name || i}`}>
                    {f.label}{f.required ? ' *' : ''}
                  </label>
                )}
                {renderField(f, i)}
              </div>
            ))}

            {formMissing && readOnly && (
              <p className="text-sm" style={{ color: textColor }}>
                No dynamic form is enabled for this project yet. Create one in Admin → Forms.
              </p>
            )}

            {statusMsg && (
              <p className="text-sm font-medium" style={{ color: statusOk ? '#15803d' : accent }}>
                {statusMsg}
              </p>
            )}

            <div className="pt-2">
              {readOnly ? (
                <button
                  type="submit"
                  disabled={submitting || !formId}
                  className="w-full font-bold rounded-lg transition opacity-100 disabled:opacity-60"
                  style={{
                    padding: '0.875rem 2rem',
                    fontSize: '0.95rem',
                  }}
                >
                  {submitting ? 'Sending…' : btnLabel}
                </button>
              ) : (
                <ElementsSection
                  section={{
                    ...section,
                    elements: [{
                      id: `${section.id}-cf-btn`,
                      type: 'cta-button',
                      content: { text: btnLabel, link: '#' },
                      style: { padding: '0.875rem 2rem',
                        borderRadius: '0.5rem',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        width: '100%'} as any,
                    }],
                  }}
                  {...passThrough}
                />
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactFormDefault;
