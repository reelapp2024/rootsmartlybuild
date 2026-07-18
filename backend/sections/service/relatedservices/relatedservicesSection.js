/**
 * Related services — AI generates header only.
 * Cards are filled at page resolve from location-scoped service catalog
 * (same pool as homepage/services grid), excluding the current service.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "relatedservices",
  imageCount: 6,

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";
    const serviceName = extraData.serviceName || extraData.service_name || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();

    return `
Generate SECTION HEADER copy for a Related Services grid on a SERVICE DETAIL page.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
SEO keywords: ${seoKeywords}
Current service (do NOT invent other service names — DB fills cards): ${serviceName || "general"}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify({
  pageType: extraData.pageType,
  pageName: extraData.pageName,
  serviceName,
})}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words (e.g. More Services)",
  "title": "4-9 word heading inviting visitors to browse sibling services",
  "subtitle": "16-32 words — invite browsing other ${mainCategory} services; no contact info; no fake service names",
  "ai_image_prompt": "26-48 words: header mosaic + varied professional scenes showing breadth of ${mainCategory} offerings — photoreal, no overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${mainCategory} services variety grid"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- Do NOT list or invent service names in any field (the database fills the cards for this location/home scope).
- If location is not "none", one subtle nod in subtitle only.
- Mention ${projectName} or ${focusKeyword || mainCategory} once across title/subtitle when natural.
- Output ONLY valid JSON.
`;
  },
};
