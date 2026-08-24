import React, { useState } from 'react';
import { submitDynamicFormData } from '../../lib/dynamicFormApi';

interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'number';
  required?: boolean;
  placeholder?: string;
}

interface CanvasFormElementProps {
  content: any;
  style: any;
  theme: any;
  readOnly: boolean;
  /** Form id to submit to (project's dynamic form). Empty in edit mode. */
  formId?: string;
}

/**
 * Canvas 'form' element (Elementor-style Form widget). Renders configurable
 * fields + submit button. On the live site it POSTs to the project's dynamic
 * form endpoint; in the editor it's inert. All visual props read from `style`
 * with theme fallbacks so it's fully editable.
 */
export const CanvasFormElement: React.FC<CanvasFormElementProps> = ({
  content, style, theme, readOnly, formId,
}) => {
  const s = style || {};
  const fields: FormField[] = Array.isArray(content?.fields) && content.fields.length
    ? content.fields
    : [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea' },
      ];

  const accent = s.accentColor || theme?.accentColor || '#6366f1';
  const labelColor = s.labelColor || theme?.titleColor || '#0F172A';
  const inputBg = s.inputBackgroundColor || theme?.cardBackgroundColor || '#FFFFFF';
  const inputBorder = s.inputBorderColor || theme?.cardBorderColor || '#D1D5DB';
  const inputText = s.inputTextColor || theme?.textColor || '#111827';
  const btnBg = s.buttonBackgroundColor || accent;
  const btnText = s.buttonTextColor || '#FFFFFF';
  const radius = s.inputRadius || '0.5rem';
  const gap = s.fieldGap || '0.85rem';

  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readOnly) return; // inert while editing
    if (!formId) { setStatus('error'); setMsg('Form is not connected yet.'); return; }
    setStatus('sending'); setMsg('');
    try {
      const res = await submitDynamicFormData(formId, values);
      if (res.ok) {
        setStatus('ok');
        setMsg(content?.successMessage || res.message || 'Thanks! We’ll be in touch.');
        setValues({});
      } else {
        setStatus('error'); setMsg(res.message || 'Something went wrong.');
      }
    } catch {
      setStatus('error'); setMsg('Could not send. Please try again.');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: radius,
    backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: inputText,
    fontSize: '0.95rem', outline: 'none',
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap, width: '100%' }}>
      {content?.heading && (
        <div style={{ fontSize: s.headingFontSize || '1.4rem', fontWeight: 700, color: labelColor }}>
          {content.heading}
        </div>
      )}
      {content?.subheading && (
        <div style={{ fontSize: '0.9rem', color: theme?.textColor || '#6B7280', opacity: 0.85, marginBottom: '0.25rem' }}>
          {content.subheading}
        </div>
      )}
      {fields.map((f) => (
        <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: labelColor }}>
            {f.label}{f.required ? <span style={{ color: accent }}> *</span> : null}
          </span>
          {f.type === 'textarea' ? (
            <textarea
              rows={4}
              required={!!f.required}
              placeholder={f.placeholder || ''}
              value={values[f.name] || ''}
              disabled={!readOnly}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          ) : (
            <input
              type={f.type || 'text'}
              required={!!f.required}
              placeholder={f.placeholder || ''}
              value={values[f.name] || ''}
              disabled={!readOnly}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              style={inputStyle}
            />
          )}
        </label>
      ))}
      <button
        type="submit"
        disabled={!readOnly || status === 'sending'}
        style={{
          marginTop: '0.35rem', padding: s.buttonPadding || '0.75rem 1.25rem',
          borderRadius: s.buttonRadius || radius, border: 'none', cursor: readOnly ? 'pointer' : 'default',
          backgroundColor: btnBg, color: btnText, fontWeight: 700, fontSize: '0.95rem',
          opacity: status === 'sending' ? 0.7 : 1, transition: 'opacity .2s',
        }}
      >
        {status === 'sending' ? 'Sending…' : (content?.buttonText || 'Submit')}
      </button>
      {status === 'ok' && <div style={{ color: '#16A34A', fontSize: '0.85rem' }}>{msg}</div>}
      {status === 'error' && <div style={{ color: '#DC2626', fontSize: '0.85rem' }}>{msg}</div>}
    </form>
  );
};
