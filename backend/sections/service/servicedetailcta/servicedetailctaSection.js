/**
 * Service detail — multiple CTA blocks
 * Multicolor DrainCleaning: cta1..cta4 objects with title, description (and rendered in bands)
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicedetailcta",
  imageCount: 6,

  schema: {
    cta1: { title: "string", description: "string" },
    cta2: { title: "string", description: "string" },
    cta3: { title: "string", description: "string" },
    cta4: { title: "string", description: "string" },
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const serviceName = extraData.serviceName || extraData.service_name || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();

    return `
Generate FOUR distinct mid-page CTA bands for a service detail page.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service: ${serviceName || mainCategory}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "cta1": { "title": "4-10 words", "description": "20-40 words" },
  "cta2": { "title": "4-10 words", "description": "20-40 words" },
  "cta3": { "title": "4-10 words", "description": "20-40 words" },
  "cta4": { "title": "4-10 words", "description": "20-40 words" },
  "ai_image_prompt": "28-52 words: bold photoreal CTA-band imagery for ${serviceName || mainCategory} — energy, trust, speed, value, care across rotating banners; one strong key visual plus cohesive lifestyle shots, no overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${mainCategory} service urgency trust (e.g. \"technician smiling toolbox residential\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- Each title + description UNIQUE; different angles (urgency, trust, savings, guarantee, scheduling).
- No phone/email/address/URLs; say "contact us" at most once across all four.
- If location is not "none", reflect it ONLY in cta2 OR cta3 (one of them), not all.
- Output ONLY valid JSON.
`;
  }
};
