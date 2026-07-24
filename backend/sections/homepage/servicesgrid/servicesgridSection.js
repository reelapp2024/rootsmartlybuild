/**
 * Services grid — section header only (cards from DB).
 * Multicolor / GenieBuild: eyebrow, title, subtitle + image pipeline prompts.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");
const { gridCopyPrompt } = require("../services/servicesSection");

module.exports = {
  id: "servicesgrid",
  imageCount: 6,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "card",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

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
You are writing the SECTION HEADER for a services grid (cards will be filled from database).

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Location context (optional — matches single-service / hero location injection): ${loc}
User-created services from Step 4 (MUST use these, never invent): ${serviceList || "none provided"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-5 word clean label (not spammy caps)",
  "title": "6-14 words, must include ${mainCategory}",
  "subtitle": "30-55 words explaining service range, professionalism, and outcomes (no contact info)",
  "ai_image_prompt": "28-50 words: one PRIMARY photoreal highlight for the top service in ${serviceList || mainCategory}, plus a cohesive set of varied scenes (close-up tools, wide job site, human action, equipment, finished result). All scenes must map to provided services when present. No text in images.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${mainCategory} services grid hero (e.g. \"hvac technician tools van residential\")"
}

STRICT RULES:

COPY:
- No phone/email/address.
- If location is not "none", mention area or city ONCE in title OR subtitle — vary headline shape per neighborhood.
- This header must NOT read like other locations' services sections — change hook and emphasis.
- MUST align with provided services if available.
- NEVER introduce new services.

${IMAGE_PROMPT_JSON_RULES}

IMAGE STYLE:
- Realistic, high-quality, stock-photo style.
- No illustrations, no icons, no text overlays.

OUTPUT:
- STRICT JSON only.
`;
  },

  gridCopyPrompt,
};
