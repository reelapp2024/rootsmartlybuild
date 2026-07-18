/**
 * Service detail process — GenieBuild `servicedetailprocess`
 * Output items[] for the UI (not legacy steps_process only).
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicedetailprocess",
  imageCount: 6,

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
Generate a step-by-step process for ONE service detail page (GenieBuild servicedetailprocess).

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service: ${serviceName || mainCategory}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "1-3 word process badge",
  "title": "4-8 word heading specific to this service",
  "subtitle": "18-30 word intro",
  "items": [
    {
      "icon": "fa-magnifying-glass",
      "title": "2-5 word step title",
      "description": "18-35 words explaining this step for ${serviceName || mainCategory}"
    }
  ],
  "ai_image_prompt": "28-52 words: step-by-step photoreal workflow for ${serviceName || mainCategory}; no text.",
  "non_ai_image_prompt": "3-10 words stock keywords for process steps"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- Generate BETWEEN 4 and 6 steps in logical order for this service
- Each title UNIQUE; descriptions UNIQUE
- icon: FA6 without "fas"; all DIFFERENT
- Mention ${locationName || city || "the area"} once in subtitle when location exists
- No phone/email/address
- JSON only
`;
  },
};
