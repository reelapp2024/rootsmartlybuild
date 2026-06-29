/**
 * Service detail — subServices list
 * Multicolor: data.service.subServices as string[] or comma-separated string
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "subservices",
  imageCount: 6,

  schema: {
    subServices: ["string"],
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
Generate a concise list of sub-service / add-on labels for ONE primary service.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Primary service: ${serviceName || mainCategory}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "subServices": [
    "Short label 1 (2-6 words)",
    "Short label 2",
    "... 8 to 12 total strings"
  ],
  "ai_image_prompt": "26-48 words: one strip hero + small scenes matching different add-on vibes for ${serviceName || mainCategory}; photoreal, no text.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${mainCategory} sub-services detail shots (e.g. \"drain snake pipe repair closeup\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- subServices: between 8 and 12 strings, ALL unique, no numbering prefixes.
- Phrases are customer-facing (title case optional).
- If location is not "none", make 2-4 labels subtly local (still no addresses).
- No phone/email/URLs.
- Output ONLY valid JSON.
`;
  }
};
