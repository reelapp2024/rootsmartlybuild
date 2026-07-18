/**
 * Post-AI enrichment for GenieBuild Contact page sections.
 * - Injects real phone/email/address from AboutUs
 * - Attaches enabled DynamicForm fields + formId for contactform
 */

const AboutUs = require("../models/aboutus");
const DynamicForm = require("../models/dynamicForm");
const {
  SOURCE,
  resolvePhone,
  resolveEmail,
  telHref,
  mailtoHref,
} = require("./contactResolver");

function primaryPhone(aboutUs) {
  const resolved = resolvePhone({ source: SOURCE.ABOUT_PRIMARY }, aboutUs);
  return String(resolved.text || "").trim();
}

function primaryEmail(aboutUs) {
  const resolved = resolveEmail({ source: SOURCE.ABOUT_PRIMARY }, aboutUs);
  return String(resolved.text || "").trim();
}

function addressText(aboutUs) {
  return String(aboutUs?.address || aboutUs?.mainLocation || "").trim();
}

function hoursTextFromAboutUs(aboutUs) {
  if (!aboutUs?.businessHours) return "";
  try {
    const { formatBusinessHoursText } = require("./businessHours");
    return formatBusinessHoursText(aboutUs.businessHours);
  } catch {
    return "";
  }
}

function joinValueAndHelper(value, helper) {
  const v = String(value || "").trim();
  const h = String(helper || "").trim();
  if (v && h) return `${v} — ${h}`;
  return v || h || "";
}

/**
 * Map AI contactinfo payload → UI items with real contact details in `description`.
 */
function enrichContactInfoContent(data = {}, aboutUs = null) {
  const out = { ...(data || {}) };
  const phone = primaryPhone(aboutUs);
  const email = primaryEmail(aboutUs);
  const address = addressText(aboutUs);
  const hoursLine = hoursTextFromAboutUs(aboutUs);

  const rawItems = Array.isArray(out.items) ? out.items : [];
  const byKind = {};
  for (const it of rawItems) {
    const kind = String(it?.kind || "").toLowerCase().trim();
    if (kind) byKind[kind] = it;
  }

  const defaults = [
    { kind: "phone", icon: "fa-phone", title: "Call Us", helperText: "Available for bookings and emergencies." },
    { kind: "email", icon: "fa-envelope", title: "Email Us", helperText: "We reply as soon as we can." },
    { kind: "address", icon: "fa-location-dot", title: "Visit Us", helperText: "" },
    { kind: "hours", icon: "fa-clock", title: "Office Hours", helperText: "" },
  ];

  out.items = defaults.map((def) => {
    const src = byKind[def.kind] || {};
    const icon = String(src.icon || src.iconClass || def.icon)
      .replace(/^fas?\s+/, "")
      .trim() || def.icon;
    const title = String(src.title || def.title).trim();
    // Hours: structured AboutUs wins; AI helper is only a soft note when hours missing
    let helper = String(src.helperText || "").trim();
    if (def.kind === "hours" && hoursLine) {
      helper = String(aboutUs?.businessHours?.note || "").trim();
    } else if (def.kind === "hours" && !helper) {
      helper = String(src.description || def.helperText || "").trim();
    } else if (def.kind !== "hours") {
      helper = String(src.helperText || src.description || def.helperText || "").trim();
    }

    let description = helper;
    if (def.kind === "phone") description = joinValueAndHelper(phone, helper);
    else if (def.kind === "email") description = joinValueAndHelper(email, helper);
    else if (def.kind === "address") description = joinValueAndHelper(address, helper);
    else if (def.kind === "hours") description = hoursLine || helper || "";

    return {
      icon,
      iconClass: icon,
      title,
      kind: def.kind,
      helperText: helper,
      description,
      value:
        def.kind === "phone"
          ? phone
          : def.kind === "email"
            ? email
            : def.kind === "address"
              ? address
              : def.kind === "hours"
                ? hoursLine
                : "",
    };
  });

  out.phoneText = phone;
  out.phoneNumber = phone;
  out.phoneLink = phone ? telHref(phone) : "";
  out.phoneHref = out.phoneLink;
  out.phoneSource = SOURCE.ABOUT_PRIMARY;
  out.emailText = email;
  out.emailLink = email ? mailtoHref(email) : "";
  out.emailSource = SOURCE.ABOUT_PRIMARY;
  out.addressText = address;
  out.hoursText = hoursLine;

  return out;
}

function enrichContactCtaContent(data = {}, aboutUs = null) {
  const out = { ...(data || {}) };
  const phone = primaryPhone(aboutUs);
  const email = primaryEmail(aboutUs);

  if (phone) {
    out.contactText = phone;
    out.phoneNumber = phone;
    out.phoneText = phone;
    out.contactHref = telHref(phone);
    out.phoneHref = out.contactHref;
    out.phoneLink = out.contactHref;
    out.phoneSource = SOURCE.ABOUT_PRIMARY;
  } else if (email) {
    out.contactText = email;
    out.contactHref = mailtoHref(email);
    out.emailText = email;
    out.emailLink = out.contactHref;
    out.emailSource = SOURCE.ABOUT_PRIMARY;
  } else {
    out.contactText = "";
    out.contactHref = "";
  }

  const rawTrust = Array.isArray(out.items) ? out.items : [];
  const trustItems = rawTrust
    .slice(0, 3)
    .map((it) => {
      const iconRaw = String(it?.icon || it?.iconClass || "fa-check-circle").trim();
      const icon = iconRaw.startsWith("fa-")
        ? iconRaw
        : iconRaw.replace(/^fas\s+fa-/, "fa-").replace(/^fa\s+/, "fa-") || "fa-check-circle";
      return {
        label: String(it?.label || it?.title || it?.line || it?.description || "").trim(),
        icon,
        title: String(it?.title || it?.label || "").trim(),
      };
    })
    .filter((it) => it.label);
  while (trustItems.length < 3) {
    const fallbacks = [
      { label: "Licensed & Insured", icon: "fa-shield-halved" },
      { label: "Upfront Pricing", icon: "fa-tag" },
      { label: "Satisfaction Guaranteed", icon: "fa-circle-check" },
    ];
    trustItems.push(fallbacks[trustItems.length]);
  }
  out.items = trustItems.slice(0, 3);
  out.phoneSubText = String(
    out.phoneSubText || out.phoneSub || "Call now — we're happy to help"
  ).trim();

  return out;
}

function enrichContactFaqContent(data = {}, aboutUs = null) {
  const out = { ...(data || {}) };
  const phoneSource = String(out.ctaButtonContactSource || SOURCE.ABOUT_PRIMARY).trim();
  if (phoneSource !== SOURCE.MANUAL) {
    const resolved = resolvePhone(
      {
        source: phoneSource,
        pickIndex: out.ctaButtonContactPickIndex,
        text: out.ctaButtonText,
        link: out.ctaButtonLink,
      },
      aboutUs
    );
    if (resolved.text) {
      const display = /^call\b/i.test(resolved.text) ? resolved.text : `Call ${resolved.text}`;
      out.ctaButtonText = display;
      out.ctaButtonLink = resolved.link;
      out.ctaButtonContactSource = resolved.source;
      if (resolved.source === SOURCE.ABOUT_PICK) {
        out.ctaButtonContactPickIndex = resolved.pickIndex;
      }
    } else {
      out.ctaButtonText = "";
      out.ctaButtonLink = "";
      out.ctaButtonContactSource = SOURCE.ABOUT_PRIMARY;
    }
  }
  return out;
}

function mapDynamicFormFields(form) {
  const fields = Array.isArray(form?.fields) ? form.fields : [];
  return fields
    .filter((f) => f && String(f.label || "").trim())
    .map((f) => ({
      name: String(f.name || "").trim(),
      label: String(f.label || "").trim(),
      type: String(f.type || "text").trim(),
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? f.options : [],
      placeholder: String(f.placeholder || f.label || "").trim(),
      _id: f._id ? String(f._id) : undefined,
    }));
}

/**
 * Attach project's enabled DynamicForm (admin Forms Management) onto contactform content.
 */
async function enrichContactFormContent(data = {}, projectId) {
  const out = { ...(data || {}) };
  if (!projectId) {
    out.formId = out.formId || "";
    out.fields = Array.isArray(out.fields) ? out.fields : [];
    out.formSource = "none";
    return out;
  }

  let form =
    (await DynamicForm.findOne({ projectId, isEnabled: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()) ||
    (await DynamicForm.findOne({ projectId }).sort({ updatedAt: -1, createdAt: -1 }).lean());

  if (!form) {
    out.formId = "";
    out.fields = [];
    out.formName = "";
    out.formSource = "none";
    out.formMissing = true;
    return out;
  }

  out.formId = String(form._id);
  out.formName = String(form.name || "");
  out.fields = mapDynamicFormFields(form);
  out.formSource = "dynamic_form";
  out.formMissing = false;
  // Keep AI copy; never let leftover template fields override DB form
  return out;
}

async function fetchAboutUsForContactPage(projectId) {
  if (!projectId) return null;
  return AboutUs.findOne({ projectId })
    .select("phone phones email emails address mainLocation socialLinks businessHours")
    .lean();
}

/**
 * Apply Contact-page enrichment after OpenAI generation.
 * @returns {Promise<object>} mutated/enriched section data
 */
async function applyContactPageSectionDynamics(sectionId, data, projectId) {
  const id = String(sectionId || "")
    .trim()
    .toLowerCase();
  if (!id) return data;

  if (id === "contactform") {
    return enrichContactFormContent(data, projectId);
  }

  const aboutUs = await fetchAboutUsForContactPage(projectId);

  if (id === "contactinfo") {
    return enrichContactInfoContent(data, aboutUs);
  }
  if (
    id === "contactcta" ||
    id === "aboutcta" ||
    id === "serviceslistcta" ||
    id === "servicedetailcta"
  ) {
    return enrichContactCtaContent(data, aboutUs);
  }
  if (
    id === "contactfaq" ||
    id === "aboutfaq" ||
    id === "faq" ||
    id === "serviceslistfaq" ||
    id === "servicedetailfaq"
  ) {
    return enrichContactFaqContent(data, aboutUs);
  }
  return data;
}

module.exports = {
  enrichContactInfoContent,
  enrichContactCtaContent,
  enrichContactFaqContent,
  enrichContactFormContent,
  applyContactPageSectionDynamics,
  fetchAboutUsForContactPage,
  mapDynamicFormFields,
};
