/**
 * Detect which legal document this page/section is for.
 * @returns {"privacy"|"terms"|"disclaimer"}
 */
function resolveLegalDocType({ sectionId = "", pageName = "", pageSlug = "", extraData = {} } = {}) {
  const fromExtra = String(
    extraData.legalDocType || extraData.docType || extraData.legalType || ""
  )
    .trim()
    .toLowerCase();
  if (fromExtra === "privacy" || fromExtra === "terms" || fromExtra === "disclaimer") {
    return fromExtra;
  }

  const blob = [
    sectionId,
    pageName,
    pageSlug,
    extraData.pageName,
    extraData.slug,
  ]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");

  if (/disclaimer/.test(blob)) return "disclaimer";
  if (/terms|conditions|toc\b/.test(blob)) return "terms";
  if (/privacy/.test(blob)) return "privacy";

  const id = String(sectionId || "").toLowerCase();
  if (id === "legalterms" || id === "termsbody") return "terms";
  if (id === "legaldisclaimer" || id === "disclaimerbody") return "disclaimer";
  if (id === "legalprivacy" || id === "privacybody") return "privacy";

  return "privacy";
}

function legalDocDefaults(docType) {
  if (docType === "terms") {
    return {
      badgeText: "Legal",
      heroTitle: "Terms & Conditions",
      heroSubtitle:
        "Please review these terms carefully before using our website or requesting services.",
      breadcrumbLabel: "Terms & Conditions",
      legacySectionId: "legalterms",
    };
  }
  if (docType === "disclaimer") {
    return {
      badgeText: "Legal",
      heroTitle: "Disclaimer",
      heroSubtitle:
        "Important information about the nature of this website and the limits of our content.",
      breadcrumbLabel: "Disclaimer",
      legacySectionId: "legaldisclaimer",
    };
  }
  return {
    badgeText: "Legal",
    heroTitle: "Privacy Policy",
    heroSubtitle:
      "Please read this page carefully to understand how we handle your information and your rights.",
    breadcrumbLabel: "Privacy Policy",
    legacySectionId: "legalprivacy",
  };
}

function splitLegalPayload(data = {}, docType = "privacy") {
  const defaults = legalDocDefaults(docType);
  const heroTitle = String(
    data.heroTitle || data.title || defaults.heroTitle
  ).trim();
  const heroSubtitle = String(
    data.heroSubtitle || data.subtitle || defaults.heroSubtitle
  ).trim();
  const badgeText = String(data.badgeText || defaults.badgeText).trim();
  const lastUpdatedLabel = String(
    data.lastUpdatedLabel || data.lastUpdated || ""
  ).trim();
  const breadcrumbLabel = String(
    data.breadcrumbLabel || heroTitle || defaults.breadcrumbLabel
  ).trim();

  const sections = Array.isArray(data.sections)
    ? data.sections
        .map((s) => ({
          heading: String(s?.heading || "").trim(),
          bodyHtml: String(s?.bodyHtml || s?.body || "").trim(),
        }))
        .filter((s) => s.heading || s.bodyHtml)
    : [];

  const bodyFromSections = sections
    .map((s) => {
      const h = s.heading ? `<h2>${s.heading}</h2>` : "";
      const b = s.bodyHtml || "";
      return `${h}${b}`;
    })
    .join("")
    .trim();
  const body = String(data.body || data.html || data.description || "").trim() || bodyFromSections;

  return {
    docType,
    legacySectionId: defaults.legacySectionId,
    hero: {
      badgeText,
      heroTitle,
      heroSubtitle,
      title: heroTitle,
      subtitle: heroSubtitle,
      lastUpdatedLabel:
        lastUpdatedLabel ||
        `Last updated: ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}`,
      breadcrumbLabel,
    },
    content: { sections, body },
    combined: {
      badgeText,
      heroTitle,
      heroSubtitle,
      title: heroTitle,
      subtitle: heroSubtitle,
      lastUpdatedLabel:
        lastUpdatedLabel ||
        `Last updated: ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}`,
      breadcrumbLabel,
      sections,
      body,
    },
  };
}

module.exports = {
  resolveLegalDocType,
  legalDocDefaults,
  splitLegalPayload,
};
