/**
 * Related services block — header copy only (cards come from fetch_random_services)
 * Multicolor DrainCleaningRelated: eyebrow, h2, subtitle
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "relatedservices",
  imageCount: 6,

  schema: {
    relatedServicesBadge: "string",
    relatedServicesTitle: "string",
    relatedServicesSubtitle: "string",
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
Generate SECTION HEADER copy for \"Explore Our Other Services\" / related services grid.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Current service (exclude from tone): ${serviceName || "general"}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "relatedServicesBadge": "2-5 words",
  "relatedServicesTitle": "6-14 words",
  "relatedServicesSubtitle": "18-35 words — invite browsing other services; no contact info",
  "ai_image_prompt": "26-48 words: header mosaic + varied professional scenes showing breadth of ${mainCategory} offerings — different trades or contexts, photoreal, no overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${mainCategory} services variety grid (e.g. \"home services technician tools\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- Do not list fake service names (DB fills cards).
- If location is not "none", one subtle nod in subtitle only.
- Output ONLY valid JSON.
`;
  }
};
