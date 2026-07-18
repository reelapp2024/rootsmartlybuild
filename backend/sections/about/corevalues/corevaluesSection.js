/**
 * Core Values — About page. Titles MUST be unique per business (not a fixed 6-word list).
 */

const { aboutUniquenessRules } = require("../../_shared/aboutUniquenessPrompt");

module.exports = {
  id: "corevalues",

  schema: {
    badgeText: "string",
    title: "string",
    intro: "string",
    items: [
      {
        title: "string",
        iconClass: "string",
        description: "string",
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

    return `
You are generating "Our Core Values" for the About page of "${projectName}" (${mainCategory}).

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
  pageLabel: "Core Values",
})}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "4-8 word section heading mentioning values OR ${projectName}",
  "intro": "One sentence (18-32 words) introducing how ${projectName} works",
  "items": [
    {
      "title": "Unique value title",
      "iconClass": "fas fa-user-check",
      "description": "Value description tied to ${mainCategory}"
    }
  ]
}

Rules:

HEADER:
- badgeText: 2-4 words
- title: 4-8 words, unique (avoid always "Our Core Values")
- intro: exactly ONE sentence, 18–32 words, name ${projectName} or ${focusKeyword || mainCategory} once

ITEMS:
- Generate EXACTLY 6 items
- Titles MUST be UNIQUE and ORIGINAL for this business (2–4 words each)
- Do NOT use this fixed list as titles: "Customer First", "Professional Team", "Eco-Friendly", "Quality Standards", "Reliability", "Trust & Safety" — invent better, specific titles
- Themes may cover service, craftsmanship, honesty, safety, community, accountability — but word them freshly for ${projectName}
- Each description 22–36 words, UNIQUE, related to ${mainCategory} in ${locationLabel || "the area"}
- iconClass valid "fas fa-..." and every icon DIFFERENT

GLOBAL:
- No phone/email/address
- No contact CTAs
- Output ONLY valid JSON
`;
  },
};
