export type ContactSource = 'about_primary' | 'about_pick' | 'manual';

export const DEFAULT_CONTACT_SOURCE: ContactSource = 'about_primary';

export type AboutUsContactRow = { value?: string; is_primary?: boolean };
export type AboutUsContact = {
  phone?: string;
  phones?: AboutUsContactRow[];
  email?: string;
  emails?: AboutUsContactRow[];
};

export function telHref(value = ''): string {
  const digits = String(value).replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

export function mailtoHref(value = ''): string {
  const trimmed = String(value || '').trim();
  return trimmed ? `mailto:${trimmed}` : '';
}

function normalizePhoneList(aboutUs: AboutUsContact | null | undefined) {
  if (Array.isArray(aboutUs?.phones) && aboutUs.phones.length) {
    return aboutUs.phones
      .filter((row) => String(row?.value || '').trim())
      .map((row, idx) => ({
        value: String(row.value).trim(),
        is_primary: Boolean(row.is_primary),
        index: idx,
      }));
  }
  const legacy = String(aboutUs?.phone || '').trim();
  return legacy ? [{ value: legacy, is_primary: true, index: 0 }] : [];
}

function normalizeEmailList(aboutUs: AboutUsContact | null | undefined) {
  if (Array.isArray(aboutUs?.emails) && aboutUs.emails.length) {
    return aboutUs.emails
      .filter((row) => String(row?.value || '').trim())
      .map((row, idx) => ({
        value: String(row.value).trim(),
        is_primary: Boolean(row.is_primary),
        index: idx,
      }));
  }
  const legacy = String(aboutUs?.email || '').trim();
  return legacy ? [{ value: legacy, is_primary: true, index: 0 }] : [];
}

function pickPrimaryRow<T extends { is_primary?: boolean }>(list: T[]) {
  if (!list.length) return null;
  return list.find((r) => r.is_primary) || list[0];
}

function pickRowByIndex<T>(list: (T & { index?: number })[], pickIndex?: number) {
  const idx = Number(pickIndex);
  if (Number.isFinite(idx) && idx >= 0 && list[idx]) return list[idx];
  return pickPrimaryRow(list);
}

function normalizeSource(raw?: string): ContactSource {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'about_pick' || s === 'manual' || s === 'about_primary') return s as ContactSource;
  return DEFAULT_CONTACT_SOURCE;
}

export function resolvePhone(
  config: { source?: string; pickIndex?: number; text?: string; link?: string },
  aboutUs?: AboutUsContact | null
) {
  const source = normalizeSource(config.source);
  if (source === 'manual') {
    const text = String(config.text || '').trim();
    return {
      text,
      link: String(config.link || '').trim() || (text ? telHref(text) : ''),
      source: 'manual' as const,
    };
  }
  const list = normalizePhoneList(aboutUs);
  const row = source === 'about_pick' ? pickRowByIndex(list, config.pickIndex) : pickPrimaryRow(list);
  const text = (row as { value?: string })?.value || '';
  return {
    text,
    link: text ? telHref(text) : '',
    source: source === 'about_pick' ? ('about_pick' as const) : ('about_primary' as const),
    pickIndex: (row as { index?: number })?.index ?? 0,
  };
}

export function resolveEmail(
  config: { source?: string; pickIndex?: number; text?: string; link?: string },
  aboutUs?: AboutUsContact | null
) {
  const source = normalizeSource(config.source);
  if (source === 'manual') {
    const text = String(config.text || '').trim();
    return {
      text,
      link: String(config.link || '').trim() || (text ? mailtoHref(text) : ''),
      source: 'manual' as const,
    };
  }
  const list = normalizeEmailList(aboutUs);
  const row = source === 'about_pick' ? pickRowByIndex(list, config.pickIndex) : pickPrimaryRow(list);
  const text = (row as { value?: string })?.value || '';
  return {
    text,
    link: text ? mailtoHref(text) : '',
    source: source === 'about_pick' ? ('about_pick' as const) : ('about_primary' as const),
    pickIndex: (row as { index?: number })?.index ?? 0,
  };
}

export function inferElementContactKind(element: { id?: string; content?: Record<string, unknown> }): 'phone' | 'email' | null {
  const explicit = String(element?.content?.contactKind || '').toLowerCase();
  if (explicit === 'phone' || explicit === 'email') return explicit;
  const id = String(element.id || '').toLowerCase();
  if (id.includes('email') || id.includes('-fp-row-email')) return 'email';
  if (
    id.includes('phone') ||
    id.includes('-hp-phone') ||
    id.includes('-fp-phone') ||
    id.includes('-fp-row-phone') ||
    id.includes('-cta-btn') ||
    id.includes('-btn2')
  ) {
    return 'phone';
  }
  const link = String(element?.content?.link || '');
  if (/^mailto:/i.test(link)) return 'email';
  if (/^tel:/i.test(link)) return 'phone';
  return null;
}

export function resolveElementContactContent(
  content: Record<string, unknown>,
  kind: 'phone' | 'email',
  aboutUs?: AboutUsContact | null
) {
  const source = normalizeSource(String(content.contactSource || DEFAULT_CONTACT_SOURCE));
  const pickIndex = content.contactPickIndex as number | undefined;
  const resolved =
    kind === 'phone'
      ? resolvePhone({ source, pickIndex, text: String(content.text || ''), link: String(content.link || '') }, aboutUs)
      : resolveEmail({ source, pickIndex, text: String(content.text || ''), link: String(content.link || '') }, aboutUs);

  if (source === 'manual') {
    return { ...content, contactSource: 'manual', contactKind: kind };
  }
  return {
    ...content,
    text: resolved.text,
    link: resolved.link,
    contactSource: resolved.source,
    contactKind: kind,
    ...(resolved.source === 'about_pick' ? { contactPickIndex: resolved.pickIndex } : {}),
  };
}

export function resolveSectionPhoneFields(
  content: Record<string, unknown>,
  aboutUs?: AboutUsContact | null
) {
  const source = normalizeSource(String(content.phoneSource || DEFAULT_CONTACT_SOURCE));
  const resolved = resolvePhone(
    {
      source,
      pickIndex: content.phonePickIndex as number | undefined,
      text: String(content.phoneText || content.phoneNumber || ''),
      link: String(content.phoneLink || content.phoneHref || ''),
    },
    aboutUs
  );
  if (source === 'manual') return content;
  return {
    ...content,
    phoneText: resolved.text,
    phoneNumber: resolved.text,
    phoneLink: resolved.link,
    phoneHref: resolved.link,
    phoneSource: resolved.source,
    ...(resolved.source === 'about_pick' ? { phonePickIndex: resolved.pickIndex } : {}),
  };
}

export function resolveSectionEmailFields(
  content: Record<string, unknown>,
  aboutUs?: AboutUsContact | null
) {
  const source = normalizeSource(String(content.emailSource || DEFAULT_CONTACT_SOURCE));
  const resolved = resolveEmail(
    {
      source,
      pickIndex: content.emailPickIndex as number | undefined,
      text: String(content.emailText || ''),
      link: String(content.emailLink || ''),
    },
    aboutUs
  );
  if (source === 'manual') return content;
  return {
    ...content,
    emailText: resolved.text,
    emailLink: resolved.link,
    emailSource: resolved.source,
    ...(resolved.source === 'about_pick' ? { emailPickIndex: resolved.pickIndex } : {}),
  };
}

export function inferKindFromLink(link = ''): 'phone' | 'email' | null {
  const v = String(link || '').trim();
  if (/^mailto:/i.test(v)) return 'email';
  if (/^tel:/i.test(v)) return 'phone';
  return null;
}

const SECTION_LINK_RULES = [
  { linkKey: 'ctaButtonLink', textKey: 'ctaButtonText', sourceKey: 'ctaButtonContactSource', pickKey: 'ctaButtonContactPickIndex' },
  { linkKey: 'ctaHref', textKey: 'ctaText', sourceKey: 'ctaLinkContactSource', pickKey: 'ctaLinkContactPickIndex' },
  { linkKey: 'secondaryCtaHref', textKey: 'secondaryCtaText', sourceKey: 'secondaryPhoneSource', pickKey: 'secondaryPhonePickIndex' },
] as const;

function resolveSectionLinkRules(content: Record<string, unknown>, aboutUs?: AboutUsContact | null) {
  let c = { ...content };
  for (const rule of SECTION_LINK_RULES) {
    const linkVal = String(c[rule.linkKey] || '').trim();
    const kind = inferKindFromLink(linkVal);
    if (!kind) continue;
    const sourceKey = rule.sourceKey;
    if (!c[sourceKey]) c[sourceKey] = DEFAULT_CONTACT_SOURCE;
    const source = normalizeSource(String(c[sourceKey]));
    if (source === 'manual') continue;
    const resolved =
      kind === 'phone'
        ? resolvePhone({ source, pickIndex: c[rule.pickKey] as number, text: String(c[rule.textKey] || ''), link: linkVal }, aboutUs)
        : resolveEmail({ source, pickIndex: c[rule.pickKey] as number, text: String(c[rule.textKey] || ''), link: linkVal }, aboutUs);
    if (c[rule.textKey] !== undefined || resolved.text) c[rule.textKey] = resolved.text || c[rule.textKey];
    c[rule.linkKey] = resolved.link;
    c[sourceKey] = resolved.source;
    if (resolved.source === 'about_pick') c[rule.pickKey] = resolved.pickIndex;
  }
  return c;
}

/** Live preview: default primary phone/email; respect manual + pick list. */
export function applySectionContactForDisplay<T extends { type?: string; content?: Record<string, unknown> }>(
  section: T,
  aboutUs?: AboutUsContact | null
): T {
  if (!section || !aboutUs) return section;
  const type = String(section.type || '').toLowerCase();
  let content = { ...(section.content || {}) } as Record<string, unknown>;

  if (normalizeSource(String(content.phoneSource || '')) !== 'manual') {
    if (!content.phoneSource) content.phoneSource = DEFAULT_CONTACT_SOURCE;
    content = resolveSectionPhoneFields(content, aboutUs);
  }
  if (normalizeSource(String(content.emailSource || '')) !== 'manual') {
    if (!content.emailSource) content.emailSource = DEFAULT_CONTACT_SOURCE;
    content = resolveSectionEmailFields(content, aboutUs);
  }
  content = resolveSectionLinkRules(content, aboutUs);

  let elements = (section as { elements?: Array<{ id?: string; content?: Record<string, unknown> }> }).elements;
  if (Array.isArray(elements)) {
    elements = elements.map((el) => {
      const kind = inferElementContactKind(el);
      if (!kind) return el;
      return { ...el, content: resolveElementContactContent({ ...(el.content || {}), contactKind: kind }, kind, aboutUs) };
    });
  }

  return { ...section, content, elements } as T;
}
