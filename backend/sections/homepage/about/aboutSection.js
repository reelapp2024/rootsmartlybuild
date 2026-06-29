/**
 * About Section Generator
 * Matches GenieBuild about section content structure
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "about",
  imageCount: 6,

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    featureBoxes: [
      { icon: "string", heading: "string", description: "string" }
    ],
    ctaText: "string",
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
    const loc = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are generating an "About" section for a professional business website.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
SEO keywords: ${seoKeywords}
Location context: ${loc || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:
{
  "badgeText": "2-4 words (short trust/identity label)",
  "title": "4-9 words, clear and business-specific heading",
  "subtitle": "55-100 words about mission, quality, and customer value",
  "featureBoxes": [
    { "icon": "fas fa-award", "heading": "3-6 words", "description": "One clear benefit line (15-25 words)" },
    { "icon": "fas fa-shield-halved", "heading": "3-6 words", "description": "One clear benefit line (15-25 words)" }
  ],
  "ctaText": "2-5 words action text",
  "ai_image_prompt": "28-50 words: photoreal about section imagery — team collaboration, workspace, craftsmanship, customer moment; cohesive set for one hero + supporting photos for ${mainCategory}. No text in frame.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${mainCategory} team workspace trust (e.g. \"plumbing team workshop tools\")"
}

${IMAGE_PROMPT_JSON_RULES}

Rules:
- Use professional tone
- Keep content specific to ${mainCategory}
- Include ${locationName || city || "the service area"} or city in title OR subtitle once for local SEO
- One featureBox may reference the area with different phrasing (serving, homes in, properties across)
- Mix concrete local scenarios (property types, access, seasonality) with 2–3 natural geo mentions total — not in every field
- featureBoxes MUST contain exactly 2 objects
- Do NOT include phone/email/address
- Do NOT use markdown
- Output valid JSON only
`;
  }
};
