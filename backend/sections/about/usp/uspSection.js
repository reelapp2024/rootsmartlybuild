/**
 * About page USP / What Makes Us Different
 */

const { aboutUniquenessRules } = require("../../_shared/aboutUniquenessPrompt");

module.exports = {
  id: "usp",

  schema: {
    badgeText: "string",
    title: "string",
    intro: "string",
    items: [
      {
        title: "string",
        description: "string",
        iconClass: "string",
      },
    ],
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
    const serviceNames = Array.isArray(extraData?.serviceNames)
      ? extraData.serviceNames.filter(Boolean).slice(0, 8)
      : [];

    return `
You are generating a USP ("What Makes Us Different") section for the About page of "${projectName}".

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}
Services (context): ${serviceNames.length ? serviceNames.join(", ") : "not listed"}

Location:
${locationLabel || "service area"}

${aboutUniquenessRules({
  projectName,
  mainCategory,
  focusKeyword,
  seoKeywords,
  locationLabel,
  pageLabel: "USP / Difference",
})}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "4-8 word section heading unique to ${projectName}",
  "intro": "One sentence introduction (18-32 words)",
  "items": [
    {
      "title": "Unique differentiator",
      "description": "Explanation",
      "iconClass": "fa-bolt"
    }
  ]
}

Rules:

BADGE / TITLE / INTRO:
- badgeText 2-4 words (vary — not always "Why We're Different")
- title 4-8 words; may include ${projectName} or ${focusKeyword || mainCategory}
- intro ONE sentence 18–32 words; local SEO once for ${locationLabel || "the area"} if natural

ITEMS:
- EXACTLY 6 objects — all titles UNIQUE, all descriptions UNIQUE (22–36 words)
- iconClass FA6 token WITHOUT "fas" prefix; all icons DIFFERENT
- Differentiate on real ${mainCategory} angles (response, craftsmanship, pricing clarity, warranty, local crew, communication) — never interchangeable filler
- Do NOT copy stock titles like "Upfront Pricing" on every site; rephrase uniquely for ${projectName}

GLOBAL:
- No phone/email/address
- No calling instructions
- Output ONLY valid JSON
`;
  },
};
