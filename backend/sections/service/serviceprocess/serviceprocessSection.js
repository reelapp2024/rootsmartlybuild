/**
 * Service detail process section
 * Multicolor service page expects: steps_process[]
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "serviceprocess",
  imageCount: 6,

  schema: {
    steps_process: [
      {
        stepName: "string",
        iconClass: "string",
        serviceDescription: "string",
      }
    ],
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
Generate service-detail process steps for one service page.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service: ${serviceName || mainCategory}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:
{
  "steps_process": [
    {
      "stepName": "2-5 words",
      "iconClass": "fas fa-magnifying-glass",
      "serviceDescription": "18-35 words explaining this step"
    }
  ],
  "ai_image_prompt": "28-52 words: step-by-step photoreal workflow visuals for ${serviceName || mainCategory} from assessment to completion and aftercare; consistent lighting/style; no overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${serviceName || mainCategory} process steps"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- steps_process must have exactly 5 to 7 objects.
- iconClass must be valid Font Awesome solid icon classes (fas fa-*), all unique.
- stepName values must be unique and ordered logically.
- serviceDescription should be practical and customer-facing.
- If location is not "none", include local relevance in one or two descriptions only.
- Do not include phone/email/address/URLs.
- Output ONLY valid JSON.
`;
  }
};
