import React, { useCallback, useEffect, useState } from 'react';
import { SelectInput, TextInput } from '../inputs';
import { useAboutUsContact } from '../context/AboutUsContactContext';
import { fetchProjectAboutUs, getProjectIdFromUrl } from '../../../lib/aboutUsApi';
import {
  AboutUsContact,
  DEFAULT_CONTACT_SOURCE,
  ContactSource,
  resolveEmail,
  resolvePhone,
} from '../../../lib/contactResolver';

type Kind = 'phone' | 'email';

export type ContactFieldKeys = {
  source: string;
  pick: string;
  text: string;
  link: string;
};

const DEFAULT_FIELD_KEYS: Record<'element' | 'section_phone' | 'section_email', ContactFieldKeys> = {
  element: { source: 'contactSource', pick: 'contactPickIndex', text: 'text', link: 'link' },
  section_phone: { source: 'phoneSource', pick: 'phonePickIndex', text: 'phoneText', link: 'phoneLink' },
  section_email: { source: 'emailSource', pick: 'emailPickIndex', text: 'emailText', link: 'emailLink' },
};

export interface ContactSourceFieldsProps {
  kind: Kind;
  mode?: 'element' | 'section';
  /** Override storage keys (e.g. hero secondary CTA, FAQ call button). */
  fieldKeys?: ContactFieldKeys;
  content: Record<string, unknown>;
  onContentUpdate: (updates: Record<string, unknown>) => void;
}

export const ContactSourceFields: React.FC<ContactSourceFieldsProps> = ({
  kind,
  mode = 'element',
  fieldKeys: fieldKeysProp,
  content,
  onContentUpdate,
}) => {
  const ctx = useAboutUsContact();
  const [aboutUs, setAboutUs] = useState<AboutUsContact | null>(ctx.aboutUs);
  const [loading, setLoading] = useState(ctx.loading);

  const fieldKeys =
    fieldKeysProp ||
    (mode === 'section'
      ? kind === 'phone'
        ? DEFAULT_FIELD_KEYS.section_phone
        : DEFAULT_FIELD_KEYS.section_email
      : DEFAULT_FIELD_KEYS.element);

  const sourceKey = fieldKeys.source;
  const pickKey = fieldKeys.pick;
  const textKey = fieldKeys.text;
  const linkKey = fieldKeys.link;

  const source = (String(content[sourceKey] || DEFAULT_CONTACT_SOURCE) as ContactSource) || DEFAULT_CONTACT_SOURCE;
  const pickIndex = content[pickKey] as number | undefined;

  const loadAboutUs = useCallback(async () => {
    if (ctx.aboutUs) {
      setAboutUs(ctx.aboutUs);
      return;
    }
    const projectId = getProjectIdFromUrl();
    if (!projectId) return;
    setLoading(true);
    try {
      setAboutUs(await fetchProjectAboutUs(projectId));
    } finally {
      setLoading(false);
    }
  }, [ctx.aboutUs]);

  useEffect(() => {
    loadAboutUs();
  }, [loadAboutUs]);

  useEffect(() => {
    setAboutUs(ctx.aboutUs);
    setLoading(ctx.loading);
  }, [ctx.aboutUs, ctx.loading]);

  const phoneList = aboutUs?.phones?.length
    ? aboutUs.phones.filter((p) => p?.value).map((p, i) => ({ value: String(p.value), is_primary: p.is_primary, index: i }))
    : aboutUs?.phone
      ? [{ value: aboutUs.phone, is_primary: true, index: 0 }]
      : [];

  const emailList = aboutUs?.emails?.length
    ? aboutUs.emails.filter((e) => e?.value).map((e, i) => ({ value: String(e.value), is_primary: e.is_primary, index: i }))
    : aboutUs?.email
      ? [{ value: aboutUs.email, is_primary: true, index: 0 }]
      : [];

  const list = kind === 'phone' ? phoneList : emailList;

  const applyResolved = (nextSource: ContactSource, nextPick?: number) => {
    const cfg = {
      source: nextSource,
      pickIndex: nextPick ?? pickIndex,
      text: String(content[textKey] || ''),
      link: String(content[linkKey] || ''),
    };
    const resolved = kind === 'phone' ? resolvePhone(cfg, aboutUs) : resolveEmail(cfg, aboutUs);
    const updates: Record<string, unknown> = {
      [sourceKey]: resolved.source,
      contactKind: kind,
    };
    if (resolved.source === 'about_pick') updates[pickKey] = resolved.pickIndex;
    if (nextSource !== 'manual') {
      updates[textKey] = resolved.text;
      updates[linkKey] = resolved.link;
      if (textKey === 'phoneText' || textKey === 'phoneNumber') {
        updates.phoneNumber = resolved.text;
        updates.phoneHref = resolved.link;
      }
    }
    onContentUpdate(updates);
  };

  return (
    <div className="pt-3 border-t border-white/5 space-y-3">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {kind === 'phone' ? 'Phone' : 'Email'} source
      </h4>
      <SelectInput
        label="Source"
        value={source}
        options={[
          { label: 'About Us — primary (default)', value: 'about_primary' },
          { label: 'About Us — pick from list', value: 'about_pick' },
          { label: 'Manual override', value: 'manual' },
        ]}
        onChange={(v) => applyResolved(v as ContactSource, pickIndex)}
      />
      {source === 'about_pick' && (
        <SelectInput
          label={loading ? 'Loading…' : `Choose ${kind}`}
          value={String(pickIndex ?? 0)}
          options={
            list.length
              ? list.map((row, idx) => ({
                  label: `${row.value}${row.is_primary ? ' (primary)' : ''}`,
                  value: String(idx),
                }))
              : [{ label: 'No entries in About Us', value: '0' }]
          }
          onChange={(v) => applyResolved('about_pick', Number(v))}
        />
      )}
      {source === 'manual' && (
        <>
          <TextInput
            label="Display text"
            value={String(content[textKey] || '')}
            onChange={(v) => onContentUpdate({ [textKey]: v, [sourceKey]: 'manual', contactKind: kind })}
            placeholder={kind === 'phone' ? '(555) 123-4567' : 'hello@example.com'}
          />
          <TextInput
            label="Link"
            value={String(content[linkKey] || '')}
            onChange={(v) => onContentUpdate({ [linkKey]: v, [sourceKey]: 'manual', contactKind: kind })}
            placeholder={kind === 'phone' ? 'tel:+15551234567' : 'mailto:hello@example.com'}
          />
        </>
      )}
      {source !== 'manual' && (
        <p className="text-[10px] text-white/40 leading-relaxed">
          Shows the primary {kind} from About Us by default. Change primary in About Us to update everywhere, or pick
          another entry / use manual override here.
        </p>
      )}
    </div>
  );
};

export { clearProjectAboutUsCache as clearAboutUsContactCache } from '../../../lib/aboutUsApi';
