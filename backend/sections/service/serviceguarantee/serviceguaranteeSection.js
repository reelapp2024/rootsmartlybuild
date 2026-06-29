/**
 * Service detail guarantee section
 * Multicolor service page expects: ourGuaranteeText + ourGuaranteeSection[]
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "serviceguarantee",
  imageCount: 6,

  schema: {
    ourGuaranteeText: "string",
    ourGuaranteeSection: [
      {
        title: "string",
        description: "string",
        iconClass: "string",
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
Generate service detail guarantee content.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service: ${serviceName || mainCategory}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:
{
  "ourGuaranteeText": "70-100 words overview text for guarantee section",
  "ourGuaranteeSection": [
    {
      "title": "2-6 words",
      "description": "18-32 words",
      "iconClass": "fas fa-shield-halved"
    }
  ],
  "ai_image_prompt": "26-48 words: trust-focused guarantee visuals for ${serviceName || mainCategory} — quality checks, skilled team, satisfied customer handoff, warranty concept; photoreal, no text overlays.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${serviceName || mainCategory} guarantee quality assurance"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- ourGuaranteeSection must contain exactly 4 objects.
- iconClass values must be valid and unique Font Awesome solid classes (fas fa-*).
- Titles and descriptions must be unique and specific to ${serviceName || mainCategory}.
- If location exists, mention location context once in ourGuaranteeText only.
- No phone/email/address/URLs.
- Output ONLY valid JSON.
`;
  }
};
