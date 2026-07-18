/**
 * About page CTA — marketing copy only; phone/email injected from AboutUs (DB) live.
 */

const { aboutUniquenessRules } = require("../../_shared/aboutUniquenessPrompt");

module.exports = {
  id: "aboutcta",

  schema: {
    title: "string",
    subtitle: "string",
    ctaText: "string",
    phoneSubText: "string",
    contactText: "string",
    contactHref: "string",
    phoneSource: "string",
    items: [{ label: "string", icon: "string" }],
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const locationLabel = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are generating the About-page Call To Action for "${projectName}" (${mainCategory}).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location:
${locationLabel || "service area"}

${aboutUniquenessRules({
  projectName,
  mainCategory,
  focusKeyword,
  seoKeywords,
  locationLabel,
  pageLabel: "About CTA",
})}

Return STRICT JSON ONLY:

{
  "title": "Compelling headline (5-9 words) unique to ${projectName}",
  "subtitle": "Supporting line (20-36 words) with local trust",
  "ctaText": "2-4 word button label",
  "phoneSubText": "6-12 words under the phone (no digits)",
  "contactText": "",
  "contactHref": "",
  "phoneSource": "about_primary",
  "items": [
    { "label": "short credibility line", "icon": "fa-check-double" },
    { "label": "short credibility line", "icon": "fa-star" },
    { "label": "short credibility line", "icon": "fa-award" }
  ]
}

Rules:

TITLE / SUBTITLE:
- Unique to ${projectName}; include ${focusKeyword || mainCategory} OR ${locationLabel || "local area"} once across title+subtitle
- Not generic "Ready to Work With Us?" every time — vary the hook

CTA / PHONE SUB:
- ctaText 2-4 words
- phoneSubText has NO phone digits or emails (number comes from database)

TRUST STRIP:
- Exactly 3 items; labels 2-5 words, category-specific, UNIQUE; icons FA6 without "fas", DIFFERENT

CONTACT FIELDS:
- contactText and contactHref MUST be empty strings
- phoneSource MUST be "about_primary" (backend injects live primary phone from About Us DB)

GLOBAL:
- No physical addresses
- Output ONLY valid JSON
`;
  },
};
