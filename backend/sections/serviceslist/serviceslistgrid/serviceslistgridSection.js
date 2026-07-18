/**
 * Services listing grid — GenieBuild `serviceslistgrid` / ServicesListGridDefault
 * Cards come from DB (Service + page bundles). AI writes header + per-card teasers
 * via the shared homepage gridCopyPrompt (same path as home servicesgrid).
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");
const { gridCopyPrompt } = require("../../homepage/services/servicesSection");

module.exports = {
  id: "serviceslistgrid",
  imageCount: 6,

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    description: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  /**
   * Header-only prompt (fallback). Primary generation path uses gridCopyPrompt
   * inside the DB-backed services grid builder in sectionGeneration.queue.js.
   */
  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const serviceNames = Array.isArray(extraData?.serviceNames)
      ? extraData.serviceNames.filter(Boolean)
      : [];
    const serviceList = serviceNames.length ? serviceNames.join(", ") : "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const loc = `${locationName || city || ""} ${state || ""}`.trim() || "none";

    return `
You are writing the SECTION HEADER for the Services listing page grid (cards are filled from the database).

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Location context: ${loc}
User-created services from admin (MUST use these, never invent): ${serviceList || "none provided"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-5 word clean label",
  "title": "6-14 words, must include ${mainCategory}",
  "subtitle": "30-55 words explaining service range (no contact info)",
  "description": "same as subtitle",
  "ai_image_prompt": "28-50 words: photoreal service-range scenes for ${serviceList || mainCategory}. No text in images.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${mainCategory} services listing"
}

STRICT RULES:
- No phone/email/address.
- Do NOT generate a services items/cards array (cards come from DB).
- MUST align with provided services if available.
- NEVER introduce new services.
${IMAGE_PROMPT_JSON_RULES}
- STRICT JSON only.
`;
  },

  gridCopyPrompt,
};
