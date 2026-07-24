/**
 * Service detail why-choose — GenieBuild `servicedetailwhychoose`
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicedetailwhychoose",
  imageCount: 6,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "card",

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
Generate "Why Choose Us for This Service" cards (GenieBuild servicedetailwhychoose).

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service: ${serviceName || mainCategory}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "4-9 word heading specific to this service",
  "subtitle": "18-32 words",
  "items": [
    {
      "icon": "fa-award",
      "title": "2-6 word reason",
      "description": "20-35 words specific to ${serviceName || mainCategory}"
    }
  ],
  "ai_image_prompt": "26-48 words: trust/proof visuals for ${serviceName || mainCategory}; no text.",
  "non_ai_image_prompt": "3-10 words stock keywords for expertise quality"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- Generate EXACTLY 6 items
- Titles and descriptions UNIQUE and service-specific
- icon: FA6 without "fas"; all DIFFERENT
- title OR subtitle: mention ${locationName || city || "the area"} once when location exists
- No phone/email/address
- JSON only
`;
  },
};
