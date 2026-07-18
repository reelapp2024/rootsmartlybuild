/**
 * About page Why Choose Us
 */

const { aboutUniquenessRules } = require("../../_shared/aboutUniquenessPrompt");

module.exports = {
  id: "aboutwhychoose",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    items: [
      {
        icon: "string",
        title: "string",
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
You are generating "Why Choose Us" for the About page of "${projectName}" (${mainCategory}).

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
  pageLabel: "Why Choose Us",
})}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "4-9 word heading (mention ${projectName} OR ${focusKeyword || mainCategory})",
  "subtitle": "20-40 word supporting line for local customers",
  "items": [
    {
      "icon": "fa-medal",
      "title": "Short reason title",
      "description": "Reason explanation"
    }
  ]
}

Rules:

HEADER:
- badgeText 2-4 words (unique, not always "Why Choose Us")
- title 4-9 words
- subtitle 20–40 words; include ${locationLabel || "the area"} once for local SEO
- Name ${projectName} in title OR subtitle

ITEMS:
- EXACTLY 6 items; titles UNIQUE (2–5 words); descriptions UNIQUE (22–36 words)
- icon = FA6 token without "fas"; all DIFFERENT
- Cover trust angles (experience, credentials, honesty, care, results, guarantee) but WORD them uniquely for ${projectName} — do not clone stock phrases like "Licensed & Insured" on every card title
- 1–2 items may reference community / ${locationLabel || "local"} with varied phrasing

GLOBAL:
- No phone/email/address
- No "call now"
- Output ONLY valid JSON
`;
  },
};
