/**
 * Service detail why-choose-us cards
 * Multicolor service page expects: whyChooseUsSection[]
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicewhychooseus",
  imageCount: 6,

  schema: {
    whyChooseUsSection: [
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
Generate "Why Choose Us" cards for a single service detail page.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service: ${serviceName || mainCategory}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:
{
  "whyChooseUsSection": [
    {
      "title": "2-6 words",
      "description": "20-35 words",
      "iconClass": "fas fa-award"
    }
  ],
  "ai_image_prompt": "26-48 words: premium service proof visuals for ${serviceName || mainCategory} — certified team, modern tools, safe process, customer satisfaction moments; photoreal style and consistent palette.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${serviceName || mainCategory} trust expertise quality"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- whyChooseUsSection must contain exactly 4 objects.
- title, description, and iconClass must be unique across cards.
- iconClass must be valid Font Awesome solid classes (fas fa-*).
- Keep copy specific to ${serviceName || mainCategory}, not generic.
- If location exists: title OR one description should mention ${locationName || city || "the area"} or city; 1–2 other cards may use varied local phrasing (serving, nearby, local) — not identical "in X" every line.
- Do not include phone/email/address/URLs.
- Output ONLY valid JSON.
`;
  }
};
