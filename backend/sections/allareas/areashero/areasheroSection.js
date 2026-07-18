/**
 * All Areas page hero — GenieBuild `areashero` / AreasHeroDefault
 * Content: badgeText, title, subtitle
 */

module.exports = {
  id: "areashero",

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
    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are generating the ALL AREAS DIRECTORY PAGE HERO for a professional business website (/areas).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Primary market context:
${finalLocation || "Multi-city service area"}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY (NO explanation, NO markdown):

{
  "badgeText": "2-4 words (e.g. Areas We Serve)",
  "title": "5-9 word areas-directory heading",
  "subtitle": "Supporting intro (22-40 words) inviting visitors to find their city"
}

================ RULES (VERY IMPORTANT) ================

BADGE TEXT:
- REQUIRED
- 2-4 words
- Examples: "Areas We Serve", "Find Your City", "Service Areas"
- Not a hard sales CTA

TITLE:
- REQUIRED
- 5-9 words
- About browsing / finding coverage locations (NOT a single-city home hero)
- Include focus keyword or ${mainCategory} naturally when it fits
- Examples: "Find ${mainCategory} Near You", "Cities We Proudly Serve", "Explore Our Service Areas"

SUBTITLE:
- REQUIRED
- 22-40 words
- Invite visitors to pick their city/neighborhood from the list/map below
- Mention local teams / coverage / booking by area without inventing fake city names

GLOBAL:
- ALL fields REQUIRED — no empty strings
- Valid JSON only
- Do NOT add extra keys
- Do NOT include phone/email/address
- No markdown, no explanations

========================================================
`;
  },
};
