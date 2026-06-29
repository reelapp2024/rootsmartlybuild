/**
 * Services listing page hero copy
 * Multicolor Services.tsx uses: projectCategory, projectDescriptions[2], phone (static), side image from images[4]
 * Output parallels descriptions slot + hero lines for CMS mapping.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "serviceshero",
  imageCount: 6,

  schema: {
    servicesHeroBadge: "string",
    servicesHeroTitle: "string",
    servicesPageDescription: "string",
    trustHighlights: ["string"],
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
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
    const locHint = finalLocation || "none (global / non-location services page)";

    return `
You are generating SERVICES PAGE hero marketing copy (not individual service records).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}
Location context (same pattern as hero section — may be empty): ${locHint}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "servicesHeroBadge": "3-6 word pill label (e.g. Licensed & Insured)",
  "servicesHeroTitle": "One line (12-22 words) like: Professional {Category} Services {optional in Location}",
  "servicesPageDescription": "100-150 words. This replaces the long subheading under the H1 (similar to multicolor projectDescriptions[2]). Clear benefits, who it is for, urgency without hype. No contact info.",
  "trustHighlights": [
    "Short trust chip 1 (3-6 words)",
    "Short trust chip 2",
    "Short trust chip 3"
  ],
  "ai_image_prompt": "28-50 words: photoreal services-hero scene for ${mainCategory} — technician or team, tools, vehicle or job site, strong light; same visual language for a small set of supporting marketing images (detail shot, equipment close-up, finished work, residential vs commercial). No overlaid text.",
  "non_ai_image_prompt": "3-10 words keyword stock query for ${mainCategory} services hero and gallery (e.g. \"hvac maintenance van technician\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- trustHighlights: exactly 3 strings, each unique.
- No phone/email/address/URLs.
- If a non-empty location is provided above, you MUST naturally mention that service area in servicesHeroTitle or the first sentence of servicesPageDescription (not both in a spammy way).
- If location is "none", write generically with no fake city names.
- Output ONLY valid JSON.
`;
  }
};
