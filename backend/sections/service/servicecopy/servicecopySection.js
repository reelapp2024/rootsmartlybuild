/**
 * Extra service copy fields
 * Multicolor fetch_service: whyChooseUsHeading, customSolutionText, comprehensiveCoverageText
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicecopy",
  imageCount: 6,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "feature",

  schema: {
    whyChooseUsHeading: "string",
    customSolutionText: "string",
    comprehensiveCoverageText: "string",
    whyChooseUsSection: [
      { title: "string", description: "string", iconClass: "string" }
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
Generate supporting marketing copy blocks for a service detail page.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service: ${serviceName || mainCategory}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY with EXACTLY these keys:
whyChooseUsHeading, customSolutionText, comprehensiveCoverageText, whyChooseUsSection, ai_image_prompt, non_ai_image_prompt

Shape:
{
  "whyChooseUsHeading": "6-14 words — section heading above why-choose cards",
  "customSolutionText": "45-70 words — tailored approach / custom solution paragraph",
  "comprehensiveCoverageText": "45-70 words — breadth of coverage, thoroughness, what is included",
  "whyChooseUsSection": [
    {
      "title": "2-6 words",
      "description": "20-35 words",
      "iconClass": "fas fa-shield-halved"
    }
  ],
  "ai_image_prompt": "26-48 words: consultation, planning, execution, QC, follow-up photoreal set for ${serviceName || mainCategory}; banner + supporting scenes, no text in image.",
  "non_ai_image_prompt": "3-10 words stock keywords service process consultation crew (e.g. \"home renovation consultation laptop\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- If location is not "none", include area or city in 2 text fields with different wording (e.g. title + one body block) — natural local SEO, not repeated in every field.
- whyChooseUsSection: exactly 4 objects; each iconClass must be valid and unique Font Awesome solid icon ("fas fa-*").
- No phone/email/street address/URLs.
- Output ONLY valid JSON.
`;
  }
};
