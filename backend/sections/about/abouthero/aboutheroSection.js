/**
 * About page hero — matches GenieBuild `abouthero` / AboutHeroDefault
 */

const { aboutUniquenessRules } = require("../../_shared/aboutUniquenessPrompt");

module.exports = {
  id: "abouthero",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
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
You are generating the ABOUT PAGE HERO for "${projectName}" — a professional ${mainCategory} business.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}
Services (context): ${serviceNames.length ? serviceNames.join(", ") : "not listed"}

Location Context:
${locationLabel || "No specific location"}

${aboutUniquenessRules({
  projectName,
  mainCategory,
  focusKeyword,
  seoKeywords,
  locationLabel,
  pageLabel: "About Hero",
})}

Return STRICT JSON ONLY (NO explanation, NO markdown):

{
  "badgeText": "2-4 words unique eyebrow (not always 'About Us')",
  "title": "5-10 word about-page heading that names ${projectName} OR clearly ties to ${focusKeyword || mainCategory}",
  "subtitle": "Supporting about intro (28-48 words) — story, experience, and local trust"
}

================ RULES ================

BADGE TEXT:
- 2-4 words, professional, varied (Our Story / Who We Are / Local Roots / Since Day One — pick what fits)

TITLE:
- About-page focused (company story / who we are), NOT a hard sales CTA
- Prefer including "${projectName}" OR a natural "${focusKeyword || mainCategory}" phrase
- If location exists: put ${locationName || city || "the area"} in title OR subtitle (exactly one place)

SUBTITLE:
- 28-48 words
- Warm, specific intro to the company — not a generic plumbing brochure
- Different local angle than the title if place is already named there

GLOBAL:
- ALL fields REQUIRED
- Do NOT include phone/email/address/hours
- Do NOT push "call now"
- Valid JSON only
`;
  },
};
