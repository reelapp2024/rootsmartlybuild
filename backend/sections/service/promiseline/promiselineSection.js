/**
 * Promise line — projectInfo or service.promiseLine (string)
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "promiseline",
  imageCount: 6,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "banner",

  schema: {
    promiseLine: "string",
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
Write one high-trust PROMISE LINE (tagline under guarantee / hero band).

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service focus (optional): ${serviceName || "whole business"}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "promiseLine": "One sentence, 18-32 words. Confident, specific to outcomes. No contact info.",
  "ai_image_prompt": "24-45 words: trust carousel for ${serviceName || mainCategory} — handshake abstract, crew, tools, finished result, caring interaction; photoreal, no logos in frame.",
  "non_ai_image_prompt": "3-10 words stock keywords trust handshake shield service (e.g. \"contractor handshake homeowner\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- If location is not "none", mention the area once naturally in promiseLine.
- No phone/email/address.
- Output ONLY valid JSON.
`;
  }
};
