/**
 * Service detail — grouped sub-services grid
 * Multicolor DrainCleaning: data.service.serviceGroups — [{ groupTitle, items: [{ title, iconClass }] }]
 * Location-aware when ctx.location is passed (same as fetch_service / single service page).
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicegroups",
  imageCount: 6,

  schema: {
    serviceGroups: [
      {
        groupTitle: "string",
        items: [{ title: "string", iconClass: "string" }]
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
Generate SERVICE GROUPS for a service detail page (cards UI). Icons must be Font Awesome solid classes.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service name: ${serviceName || mainCategory}
Location context (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "serviceGroups": [
    {
      "groupTitle": "4-8 words (e.g. Residential Services)",
      "items": [
        { "title": "3-8 words service line", "iconClass": "fas fa-home" }
      ]
    }
  ],
  "ai_image_prompt": "28-50 words: one anchor photo for ${serviceName || mainCategory} service family plus varied scenes — residential, commercial, equipment, crew, finished result; photoreal, no logos in frame.",
  "non_ai_image_prompt": "3-10 words stock keywords ${mainCategory} residential commercial crew tools (e.g. \"hvac rooftop commercial unit\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- serviceGroups: EXACTLY 4 groups (to match multicolor slice(0,4) layout).
- Each group: 4-5 items; titles unique; iconClass must be "fas fa-*" and vary across items.
- Items must be realistic for ${mainCategory} and "${serviceName || "the core service"}".
- If location is not "none", let ONE group title or 1-2 item titles reflect local context (e.g. seasonal, property type) without addresses.
- No phone/email/URL/street address.
- Output ONLY valid JSON.
`;
  }
};
