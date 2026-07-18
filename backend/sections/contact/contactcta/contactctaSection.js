/**
 * Contact page CTA — matches GenieBuild `contactcta` / ContactCtaDefault
 * Marketing copy + trust strip. Real phone injected from AboutUs after generation.
 */

module.exports = {
  id: "contactcta",

  schema: {
    title: "string",
    subtitle: "string",
    ctaText: "string",
    phoneSubText: "string",
    contactText: "string",
    contactHref: "string",
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

    return `
You are generating a Contact-page Call To Action (CTA) for a professional business website.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "title": "4-8 word compelling headline",
  "subtitle": "15-30 word supporting line",
  "ctaText": "2-4 word button text (e.g. Call Us Today)",
  "phoneSubText": "6-12 words under the phone line",
  "contactText": "",
  "contactHref": "",
  "items": [
    { "label": "short credibility stat", "icon": "fa-check-double" },
    { "label": "short credibility stat", "icon": "fa-star" },
    { "label": "short credibility stat", "icon": "fa-award" }
  ]
}

Rules (VERY IMPORTANT):

TITLE / SUBTITLE:
- Invite a phone conversation after seeing contact options
- Include ${locationName || city || "the area"} once in title OR subtitle for local SEO

PHONE SUBTEXT:
- Availability / how to book — NO phone digits (phone is injected from About Us)

TRUST STRIP (items) — exactly 3:
- label: 2-5 words, category-specific credibility
- icon: FA6 token without "fas" prefix; all DIFFERENT

GLOBAL:
- contactText and contactHref MUST be empty strings (backend fills primary phone)
- Do NOT invent phone, email, or address
- No markdown, no explanations
- Output ONLY valid JSON
`;
  },
};
