/**
 * Contact page — hero + supporting copy (not dynamic form fields)
 * Multicolor Contact: hero imagery from projectInfo.images; SEO from useSEO
 * No location integration — business-wide only.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "contactpage",
  imageCount: 6,

  schema: {
    contactHeroTitle: "string",
    contactHeroSubtitle: "string",
    contactIntroHeading: "string",
    contactIntroBody: "string",
    trustBullets: ["string"],
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";

    return `
You are generating CONTACT PAGE marketing copy (hero + intro). Do NOT include city/region-specific claims unless extraData explicitly provides a service area tagline.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
SEO keywords: ${seoKeywords}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "contactHeroTitle": "4-10 words — H1 style (e.g. Get In Touch)",
  "contactHeroSubtitle": "20-40 words — invite contact, set expectations on response time",
  "contactIntroHeading": "4-12 words above form area",
  "contactIntroBody": "40-70 words — what to include in a message, privacy reassurance, no PII requests",
  "trustBullets": [
    "3-8 words",
    "3-8 words",
    "3-8 words"
  ],
  "ai_image_prompt": "28-50 words: warm photoreal contact-page set — reception or desk, staff helping customer, scheduling, mobile crew vehicle, calm office; all on-brand for ${mainCategory}. No overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${mainCategory} contact office customer service (e.g. \"customer service desk handshake\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- trustBullets: exactly 3 unique strings.
- No phone numbers, email addresses, or street addresses (UI shows those from aboutUs).
- No fake "visit us at" locations.
- Output ONLY valid JSON.
`;
  }
};
