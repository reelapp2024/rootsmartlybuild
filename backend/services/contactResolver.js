/**
 * Resolves phone/email for sections and elements from About Us.
 * Default: about_primary (updates when primary changes in About Us).
 * manual: user override — never overwritten by sync/fetch.
 */

const AboutUs = require("../models/aboutus");

const SOURCE = {
  ABOUT_PRIMARY: "about_primary",
  ABOUT_PICK: "about_pick",
  MANUAL: "manual",
};

const DEFAULT_SOURCE = SOURCE.ABOUT_PRIMARY;

function telHref(value = "") {
  const digits = String(value).replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function mailtoHref(value = "") {
  const trimmed = String(value || "").trim();
  return trimmed ? `mailto:${trimmed}` : "";
}

function normalizePhoneList(aboutUs = {}) {
  if (Array.isArray(aboutUs.phones) && aboutUs.phones.length) {
    return aboutUs.phones
      .filter((row) => String(row?.value || "").trim())
      .map((row, idx) => ({
        value: String(row.value).trim(),
        is_primary: Boolean(row.is_primary),
        index: idx,
      }));
  }
  const legacy = String(aboutUs.phone || "").trim();
  return legacy ? [{ value: legacy, is_primary: true, index: 0 }] : [];
}

function normalizeEmailList(aboutUs = {}) {
  if (Array.isArray(aboutUs.emails) && aboutUs.emails.length) {
    return aboutUs.emails
      .filter((row) => String(row?.value || "").trim())
      .map((row, idx) => ({
        value: String(row.value).trim(),
        is_primary: Boolean(row.is_primary),
        index: idx,
      }));
  }
  const legacy = String(aboutUs.email || "").trim();
  return legacy ? [{ value: legacy, is_primary: true, index: 0 }] : [];
}

function pickPrimaryRow(list = []) {
  if (!list.length) return null;
  return list.find((r) => r.is_primary) || list[0];
}

function pickRowByIndex(list = [], pickIndex) {
  const idx = Number(pickIndex);
  if (Number.isFinite(idx) && idx >= 0 && list[idx]) {
    return list[idx];
  }
  return pickPrimaryRow(list);
}

function normalizeSource(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (s === SOURCE.ABOUT_PICK || s === SOURCE.MANUAL || s === SOURCE.ABOUT_PRIMARY) {
    return s;
  }
  return DEFAULT_SOURCE;
}

/**
 * @param {{ source?: string, pickIndex?: number }} config
 * @param {object} aboutUs
 */
function resolvePhone(config = {}, aboutUs = null) {
  const source = normalizeSource(config.source);
  if (source === SOURCE.MANUAL) {
    return {
      text: String(config.text || "").trim(),
      link: String(config.link || "").trim() || (config.text ? telHref(config.text) : ""),
      source,
    };
  }
  const list = normalizePhoneList(aboutUs || {});
  const row =
    source === SOURCE.ABOUT_PICK
      ? pickRowByIndex(list, config.pickIndex)
      : pickPrimaryRow(list);
  const text = row?.value || "";
  return {
    text,
    link: text ? telHref(text) : "",
    source: source === SOURCE.ABOUT_PICK ? SOURCE.ABOUT_PICK : SOURCE.ABOUT_PRIMARY,
    pickIndex: row?.index ?? 0,
  };
}

function resolveEmail(config = {}, aboutUs = null) {
  const source = normalizeSource(config.source);
  if (source === SOURCE.MANUAL) {
    const text = String(config.text || "").trim();
    return {
      text,
      link: String(config.link || "").trim() || (text ? mailtoHref(text) : ""),
      source,
    };
  }
  const list = normalizeEmailList(aboutUs || {});
  const row =
    source === SOURCE.ABOUT_PICK
      ? pickRowByIndex(list, config.pickIndex)
      : pickPrimaryRow(list);
  const text = row?.value || "";
  return {
    text,
    link: text ? mailtoHref(text) : "",
    source: source === SOURCE.ABOUT_PICK ? SOURCE.ABOUT_PICK : SOURCE.ABOUT_PRIMARY,
    pickIndex: row?.index ?? 0,
  };
}

function resolvePhoneFieldsOnContent(content = {}, aboutUs = null) {
  const c = { ...content };
  const source = normalizeSource(c.phoneSource);
  const resolved = resolvePhone(
    {
      source,
      pickIndex: c.phonePickIndex,
      text: c.phoneText,
      link: c.phoneLink,
    },
    aboutUs
  );
  if (source !== SOURCE.MANUAL) {
    c.phoneText = resolved.text;
    c.phoneLink = resolved.link;
    c.phoneSource = resolved.source;
    if (resolved.source === SOURCE.ABOUT_PICK) {
      c.phonePickIndex = resolved.pickIndex;
    }
  }
  return c;
}

function resolveEmailFieldsOnContent(content = {}, aboutUs = null) {
  const c = { ...content };
  const source = normalizeSource(c.emailSource);
  const resolved = resolveEmail(
    {
      source,
      pickIndex: c.emailPickIndex,
      text: c.emailText,
      link: c.emailLink,
    },
    aboutUs
  );
  if (source !== SOURCE.MANUAL) {
    c.emailText = resolved.text;
    c.emailLink = resolved.link;
    c.emailSource = resolved.source;
    if (resolved.source === SOURCE.ABOUT_PICK) {
      c.emailPickIndex = resolved.pickIndex;
    }
  }
  return c;
}

/** Hero call button, CTA phone line, areas phone button */
function resolveSecondaryPhoneOnContent(content = {}, aboutUs = null) {
  const c = { ...content };
  const source = normalizeSource(c.secondaryPhoneSource || c.phoneSource);
  const resolved = resolvePhone(
    {
      source,
      pickIndex: c.secondaryPhonePickIndex ?? c.phonePickIndex,
      text: c.secondaryCtaText || c.phoneText,
      link: c.secondaryCtaHref || c.phoneLink || c.phoneHref,
    },
    aboutUs
  );
  if (source !== SOURCE.MANUAL) {
    c.secondaryCtaText = resolved.text || c.secondaryCtaText || "Call Now";
    c.secondaryCtaHref = resolved.link;
    c.secondaryPhoneSource = resolved.source;
    if (resolved.source === SOURCE.ABOUT_PICK) {
      c.secondaryPhonePickIndex = resolved.pickIndex;
    }
  }
  return c;
}

function resolveCtaPhoneOnContent(content = {}, aboutUs = null) {
  const c = { ...content };
  const source = normalizeSource(c.phoneSource);
  const resolved = resolvePhone(
    {
      source,
      pickIndex: c.phonePickIndex,
      text: c.phoneNumber || c.phoneText,
      link: c.phoneLink || c.phoneHref,
    },
    aboutUs
  );
  if (source !== SOURCE.MANUAL) {
    c.phoneNumber = resolved.text;
    c.phoneText = resolved.text;
    c.phoneLink = resolved.link;
    c.phoneHref = resolved.link;
    c.phoneSource = resolved.source;
    if (resolved.source === SOURCE.ABOUT_PICK) {
      c.phonePickIndex = resolved.pickIndex;
    }
  }
  return c;
}

/** Section content keys paired with tel:/mailto: links (FAQ CTA, hero call, etc.) */
const SECTION_LINK_RULES = [
  {
    linkKey: "ctaButtonLink",
    textKey: "ctaButtonText",
    sourceKey: "ctaButtonContactSource",
    pickKey: "ctaButtonContactPickIndex",
  },
  {
    linkKey: "ctaHref",
    textKey: "ctaText",
    sourceKey: "ctaLinkContactSource",
    pickKey: "ctaLinkContactPickIndex",
  },
  {
    linkKey: "secondaryCtaHref",
    textKey: "secondaryCtaText",
    sourceKey: "secondaryPhoneSource",
    pickKey: "secondaryPhonePickIndex",
  },
];

function inferKindFromLink(link = "") {
  const v = String(link || "").trim();
  if (/^mailto:/i.test(v)) return "email";
  if (/^tel:/i.test(v)) return "phone";
  return null;
}

function resolveSectionLinkRules(content = {}, aboutUs = null) {
  let c = { ...content };
  for (const rule of SECTION_LINK_RULES) {
    const linkVal = String(c[rule.linkKey] || "").trim();
    const kind = inferKindFromLink(linkVal);
    if (!kind) continue;
    if (!c[rule.sourceKey]) c[rule.sourceKey] = DEFAULT_SOURCE;
    const source = normalizeSource(c[rule.sourceKey]);
    if (source === SOURCE.MANUAL) continue;
    const resolved =
      kind === "phone"
        ? resolvePhone(
            {
              source,
              pickIndex: c[rule.pickKey],
              text: c[rule.textKey],
              link: linkVal,
            },
            aboutUs
          )
        : resolveEmail(
            {
              source,
              pickIndex: c[rule.pickKey],
              text: c[rule.textKey],
              link: linkVal,
            },
            aboutUs
          );
    if (c[rule.textKey] !== undefined || resolved.text) {
      c[rule.textKey] = resolved.text || c[rule.textKey];
    }
    c[rule.linkKey] = resolved.link;
    c[rule.sourceKey] = resolved.source;
    if (resolved.source === SOURCE.ABOUT_PICK) {
      c[rule.pickKey] = resolved.pickIndex;
    }
  }
  return c;
}

function inferElementContactKind(element = {}) {
  const explicit = String(element?.content?.contactKind || "").toLowerCase();
  if (explicit === "phone" || explicit === "email") return explicit;
  const id = String(element.id || "").toLowerCase();
  if (id.includes("email") || id.includes("-fp-row-email")) return "email";
  if (
    id.includes("phone") ||
    id.includes("-hp-phone") ||
    id.includes("-fp-phone") ||
    id.includes("-fp-row-phone") ||
    id.includes("-cta-btn") ||
    id.includes("-btn2")
  ) {
    return "phone";
  }
  return inferKindFromLink(element?.content?.link);
}

function resolveElementContact(element = {}, aboutUs = null) {
  const kind = inferElementContactKind(element);
  if (!kind) return element;

  const content = { ...(element.content || {}) };
  if (!content.contactKind) content.contactKind = kind;
  const source = normalizeSource(content.contactSource || DEFAULT_SOURCE);
  const pickIndex = content.contactPickIndex;

  if (kind === "phone") {
    const resolved = resolvePhone(
      {
        source,
        pickIndex,
        text: content.text,
        link: content.link,
      },
      aboutUs
    );
    if (source !== SOURCE.MANUAL) {
      content.text = resolved.text;
      content.link = resolved.link;
      content.contactSource = resolved.source;
      content.contactKind = "phone";
      if (resolved.source === SOURCE.ABOUT_PICK) {
        content.contactPickIndex = resolved.pickIndex;
      }
    } else {
      content.contactSource = SOURCE.MANUAL;
      content.contactKind = "phone";
    }
  } else if (kind === "email") {
    const resolved = resolveEmail(
      {
        source,
        pickIndex,
        text: content.text,
        link: content.link,
      },
      aboutUs
    );
    if (source !== SOURCE.MANUAL) {
      content.text = resolved.text;
      content.link = resolved.link;
      content.contactSource = resolved.source;
      content.contactKind = "email";
      if (resolved.source === SOURCE.ABOUT_PICK) {
        content.contactPickIndex = resolved.pickIndex;
      }
    } else {
      content.contactSource = SOURCE.MANUAL;
      content.contactKind = "email";
    }
  }

  return { ...element, content };
}

function applySectionContactContent(content = {}, sectionType = "", aboutUs = null) {
  let c = { ...(content || {}) };
  if (!aboutUs) return c;

  if (normalizeSource(c.phoneSource) !== SOURCE.MANUAL) {
    if (!c.phoneSource) c.phoneSource = DEFAULT_SOURCE;
    c = resolvePhoneFieldsOnContent(c, aboutUs);
  }
  if (normalizeSource(c.emailSource) !== SOURCE.MANUAL) {
    if (!c.emailSource) c.emailSource = DEFAULT_SOURCE;
    c = resolveEmailFieldsOnContent(c, aboutUs);
  }

  const type = String(sectionType || "").toLowerCase();
  if (type === "hero") {
    c = resolveSecondaryPhoneOnContent(c, aboutUs);
  }
  if (type === "cta" || type === "contactcta" || type === "aboutcta" || type === "serviceslistcta") {
    c = resolveCtaPhoneOnContent(c, aboutUs);
  }
  if (type === "areas") {
    if (c.phoneHref && !c.phoneLink) c.phoneLink = c.phoneHref;
    if (c.phoneLink && !c.phoneHref) c.phoneHref = c.phoneLink;
  }
  if (type === "contactinfo") {
    c = enrichContactInfoItemsOnContent(c, aboutUs);
  }

  c = resolveSectionLinkRules(c, aboutUs);
  return c;
}

function joinValueAndHelper(value, helper) {
  const v = String(value || "").trim();
  const h = String(helper || "").trim();
  if (v && h) return `${v} — ${h}`;
  return v || h || "";
}

/** Live-resolve contactinfo card descriptions from AboutUs (no AI invention). */
function enrichContactInfoItemsOnContent(content = {}, aboutUs = null) {
  const c = { ...(content || {}) };
  const phone = resolvePhone({ source: DEFAULT_SOURCE }, aboutUs).text;
  const email = resolveEmail({ source: DEFAULT_SOURCE }, aboutUs).text;
  const address = String(aboutUs?.address || aboutUs?.mainLocation || "").trim();
  let hoursLine = "";
  try {
    const { formatBusinessHoursText } = require("./businessHours");
    hoursLine = formatBusinessHoursText(aboutUs?.businessHours);
  } catch {
    hoursLine = "";
  }
  const items = Array.isArray(c.items) ? c.items : [];
  if (!items.length) {
    c.phoneText = phone;
    c.phoneNumber = phone;
    c.emailText = email;
    c.addressText = address;
    c.hoursText = hoursLine;
    return c;
  }

  c.items = items.map((it) => {
    const kind = String(it?.kind || "").toLowerCase();
    const helper = String(it?.helperText || "").trim();
    if (kind === "phone" && phone) {
      return { ...it, value: phone, description: joinValueAndHelper(phone, helper) };
    }
    if (kind === "email" && email) {
      return { ...it, value: email, description: joinValueAndHelper(email, helper) };
    }
    if (kind === "address" && address) {
      return { ...it, value: address, description: joinValueAndHelper(address, helper) };
    }
    if (kind === "hours" && hoursLine) {
      return {
        ...it,
        value: hoursLine,
        helperText: String(aboutUs?.businessHours?.note || "").trim(),
        description: hoursLine,
      };
    }
    return it;
  });
  c.phoneText = phone;
  c.phoneNumber = phone;
  c.phoneLink = phone ? telHref(phone) : c.phoneLink;
  c.phoneHref = c.phoneLink;
  c.emailText = email;
  c.emailLink = email ? mailtoHref(email) : c.emailLink;
  c.addressText = address;
  c.hoursText = hoursLine;
  return c;
}

function applySectionContactDynamics(section = {}, aboutUs = null) {
  if (!section) return section;
  const type = String(section.type || "").toLowerCase();
  const content = applySectionContactContent(
    section.content || section.data || {},
    type,
    aboutUs
  );

  let elements = section.elements;
  if (Array.isArray(elements) && elements.length) {
    elements = elements.map((el) => resolveElementContact(el, aboutUs));
  }

  const elementsById = section.elementsById;
  let nextById = elementsById;
  if (elementsById && typeof elementsById === "object") {
    nextById = {};
    Object.entries(elementsById).forEach(([id, el]) => {
      nextById[id] = resolveElementContact({ ...el, id }, aboutUs);
    });
  }

  return {
    ...section,
    content,
    data: content,
    elements,
    elementsById: nextById,
  };
}

async function fetchAboutUsForContact(projectId) {
  if (!projectId) return null;
  return AboutUs.findOne({ projectId })
    .select("phone phones email emails address mainLocation socialLinks businessHours")
    .lean();
}

async function applyContactDynamicsToAllSections(sections = [], projectId) {
  if (!projectId || !Array.isArray(sections) || !sections.length) return sections;
  const aboutUs = await fetchAboutUsForContact(projectId);
  if (!aboutUs) return sections;

  return sections.map((section) => applySectionContactDynamics(section, aboutUs));
}

module.exports = {
  SOURCE,
  DEFAULT_SOURCE,
  telHref,
  mailtoHref,
  normalizePhoneList,
  normalizeEmailList,
  resolvePhone,
  resolveEmail,
  resolvePhoneFieldsOnContent,
  resolveEmailFieldsOnContent,
  resolveElementContact,
  applySectionContactContent,
  applySectionContactDynamics,
  applyContactDynamicsToAllSections,
  fetchAboutUsForContact,
  inferElementContactKind,
  inferKindFromLink,
  SECTION_LINK_RULES,
  resolveSectionLinkRules,
};
