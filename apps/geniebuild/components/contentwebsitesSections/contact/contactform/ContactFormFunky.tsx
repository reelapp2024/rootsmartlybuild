import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import {
  FUNKY,
  funkyFromTheme,
  funkyTextColors,
  mergeFunkyElement,
  resolveFunkyIsLight,
  funkySurfaceColors, resolveFunkySectionChrome } from '../../funkyTheme';
import { motion } from 'motion/react';
import { getProjectIdFromUrl } from '../../../../lib/aboutUsApi';
import {
  fetchProjectDynamicForm,
  mapDynamicFormToSectionFields,
  submitDynamicFormData } from '../../../../lib/dynamicFormApi';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: Partial<WebsiteElement>) => void;
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
 * ContactFormFunky — live DynamicForm fields + submit (same API as ContactFormDefault).
 * Builder preview is non-submitting; SiteNext readOnly submits via submit_form_data.
 */
export const ContactFormFunky: React.FC<Props> = ({
  section,
  onTextEdit,
  buttonClass,
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false,
  themeColors: tc,
  projectId: projectIdProp }) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;
  const live = Boolean(readOnly);
  const f = funkyFromTheme(tc);
  const isLight = resolveFunkyIsLight(section, tc);
  const { titleColor, textColor, themeMode: funkyThemeMode, themeColors: funkyThemeBag } =
    funkyTextColors(tc, isLight);
  const surface = funkySurfaceColors(isLight, (styles as any)?.backgroundColor);
  const accent = tc?.iconColor || tc?.accentColor || f.primary;
  const bg = surface.bg;
  const { wrapperStyle, overlayStyle } = resolveFunkySectionChrome(styles, isLight);
  const padT = s.paddingTop ?? 'pt-10 sm:pt-14';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-14';
  const padX = s.paddingX ?? 'px-4 sm:px-6';

  const titleEl = mergeFunkyElement(
    section,
    `${section.id}-cw-conform-title`,
    {
      id: `${section.id}-cw-conform-title`,
      type: 'heading',
      content: {
        text: c.contactIntroHeading || c.title || 'Send a message',
        htmlTag: 'h2' },
      style: { fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
        fontWeight: '800',
        fontFamily: FUNKY.fonts.display,
        textAlign: 'center' as any } },
    { preferFallbackText: live }
  );
  const descEl = mergeFunkyElement(
    section,
    `${section.id}-cw-conform-desc`,
    {
      id: `${section.id}-cw-conform-desc`,
      type: 'text',
      content: {
        text:
          c.contactIntroBody ||
          c.subtitle ||
          c.description ||
          "Tell us what you need — we'll get back soon." },
      style: { fontFamily: FUNKY.fonts.body,
        textAlign: 'center' as any,
        maxWidth: '480px',
        margin: '0 auto',
        lineHeight: '1.65' } },
    { preferFallbackText: live }
  );
  const themeColors = {
    ...tc,
    ...funkyThemeBag,
    titleColor,
    textColor,
    buttonBackgroundColor: f.primary,
    buttonTextColor: '#fff' };
  const passThrough = {
    onTextEdit,
    onElementUpdate: onElementUpdate || (() => {}),
    onElementSelect,
    selectedElementId,
    readOnly,
    isWrapped: false,
    buttonClass,
    themeColors } as const;
  const lightStyles = {
    ...(section.styles || {}),
    themeMode: funkyThemeMode as any,
    textColor };

  const projectId = String(projectIdProp || getProjectIdFromUrl() || '').trim();
  const storedFormId = String(c.formId || '').trim();

  const fallbackFields: FormFieldView[] = useMemo(() => {
    if (Array.isArray(c.fields) && c.fields.length) {
      return c.fields.map((field: any, i: number) => ({
        name: String(field?.name || `field_${i + 1}`).trim(),
        label: String(field?.label || 'Field').trim(),
        type: String(field?.type || 'text').trim(),
        required: Boolean(field?.required),
        options: Array.isArray(field?.options) ? field.options.map(String) : [],
        placeholder: String(field?.placeholder || field?.label || '').trim() }));
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
  const [statusMsg, setStatusMsg] = useState('');
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
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    setValues((prev) => {
      const next: Record<string, string> = {};
      for (const field of fields) {
        next[field.name] = prev[field.name] ?? '';
      }
      return next;
    });
  }, [fields]);

  const onChangeField = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!live) return;
      if (!formId) {
        setStatusOk(false);
        setStatusMsg('Contact form is not set up yet. Please configure a form in admin.');
        return;
      }
      for (const field of fields) {
        if (field.required && !String(values[field.name] || '').trim()) {
          setStatusOk(false);
          setStatusMsg(`Please fill in "${field.label}".`);
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
          Object.keys(prev).forEach((k) => {
            cleared[k] = '';
          });
          return cleared;
        });
      }
    },
    [live, formId, fields, values]
  );

  const btnLabel = String(c.ctaText || c.buttonText || 'Send Message');
  const inputStyle: React.CSSProperties = {
    backgroundColor: surface.card,
    border: `2px solid ${f.ink}`,
    borderRadius: 14,
    padding: '0.75rem 1rem',
    fontSize: '0.95rem',
    width: '100%',
    outline: 'none',
    fontFamily: FUNKY.fonts.body };

  const renderField = (field: FormFieldView, i: number) => {
    const common = {
      id: `${section.id}-field-${field.name || i}`,
      name: field.name,
      required: Boolean(field.required) && live,
      placeholder: field.placeholder || field.label,
      style: inputStyle,
      disabled: !live || submitting,
      value: values[field.name] || '',
      onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        onChangeField(field.name, ev.target.value) };

    if (field.type === 'textarea') {
      return <textarea key={field.name || i} rows={4} {...common} />;
    }
    if (field.type === 'select') {
      return (
        <select key={field.name || i} {...common}>
          <option value="">{field.placeholder || `Select ${field.label}`}</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === 'checkbox') {
      return (
        <label
          key={field.name || i}
          className="flex items-center gap-2 text-sm"
          style={{ fontFamily: FUNKY.fonts.body }}
        >
          <input
            type="checkbox"
            name={field.name}
            checked={values[field.name] === 'true' || values[field.name] === '1'}
            disabled={!live || submitting}
            onChange={(ev) => onChangeField(field.name, ev.target.checked ? 'true' : '')}
          />
          {field.label}
        </label>
      );
    }
    const inputType = ['email', 'tel', 'number', 'date', 'file'].includes(field.type)
      ? field.type
      : 'text';
    return <input key={field.name || i} type={inputType} {...common} />;
  };

  return (
    <div className="w-full" style={{ ...wrapperStyle }}>
      <link rel="stylesheet" href={FUNKY.fontsHref} />
      {overlayStyle ? (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={overlayStyle} />
      ) : null}
      <div className={`max-w-xl mx-auto ${padX} ${padT} ${padB}`}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-center space-y-3"
        >
          <ElementsSection
            section={{ ...section, styles: lightStyles, elements: [titleEl] }}
            {...passThrough}
          />
          <ElementsSection
            section={{ ...section, styles: lightStyles, elements: [descEl] }}
            {...passThrough}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          style={{
            background: f.white,
            border: `2.5px solid ${f.ink}`,
            borderRadius: 24,
            boxShadow: FUNKY.shadow,
            padding: 24 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate={!live}>
            {fields.map((field, i) => (
              <div key={field.name || i} className="space-y-1.5">
                {field.type !== 'checkbox' && (
                  <label
                    className="block text-sm font-bold"
                    style={{ fontFamily: FUNKY.fonts.body }}
                    htmlFor={`${section.id}-field-${field.name || i}`}
                  >
                    {field.label}
                    {field.required ? ' *' : ''}
                  </label>
                )}
                {renderField(field, i)}
              </div>
            ))}

            {formMissing && live && (
              <p className="text-sm" style={{ fontFamily: FUNKY.fonts.body }}>
                No contact form is enabled for this project yet. Create one in Admin → Forms.
              </p>
            )}

            {statusMsg && (
              <p
                className="text-sm font-semibold"
                style={{ color: statusOk ? '#15803d' : accent, fontFamily: FUNKY.fonts.body }}
              >
                {statusMsg}
              </p>
            )}

            <div className="pt-1">
              {live ? (
                <button
                  type="submit"
                  disabled={submitting || !formId}
                  className="w-full font-extrabold transition disabled:opacity-60"
                  style={{
                    color: '#fff',
                    padding: '0.9rem 1.5rem',
                    fontSize: '1rem',
                    borderRadius: 9999,
                    border: `2.5px solid ${f.ink}`,
                    boxShadow: FUNKY.shadow,
                    fontFamily: FUNKY.fonts.display }}
                >
                  {submitting ? 'Sending…' : btnLabel}
                </button>
              ) : (
                <ElementsSection
                  section={{
                    ...section,
                    styles: lightStyles,
                    elements: [
                      {
                        id: `${section.id}-cw-conform-btn`,
                        type: 'cta-button',
                        content: { text: btnLabel, link: '#' },
                        style: { color: '#fff',
                          padding: '0.9rem 1.5rem',
                          borderRadius: '9999px',
                          fontWeight: '800',
                          fontSize: '1rem',
                          width: '100%',
                          border: `2.5px solid ${f.ink}`,
                          boxShadow: FUNKY.shadow,
                          fontFamily: FUNKY.fonts.display } as any },
                    ] }}
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

export default ContactFormFunky;
