/**
 * Service detail hero — GenieBuild `servicedetailhero` / ServiceDetailHeroDefault
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicedetailhero",
  imageCount: 6,

  schema: {
    badgeText: "string",
    serviceHeroBadge: "string",
    serviceHeroTitle: "string",
    serviceHeroSubtitle: "string",
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
    const serviceName = extraData.serviceName || extraData.service_name || "";
    const serviceSlug = extraData.serviceSlug || extraData.slug || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();
    const loc = finalLocation || "none";

    return `
You are generating HERO copy for ONE service detail page (GenieBuild servicedetailhero).

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service name: ${serviceName || "Unknown — infer from category"}
Service slug hint: ${serviceSlug || "n/a"}
Location context: ${loc}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-5 word premium label",
  "serviceHeroBadge": "same idea as badgeText",
  "serviceHeroTitle": "8-16 words; MUST include the service name or clear synonym",
  "serviceHeroSubtitle": "35-55 words: outcomes, who it helps, urgency; no contact info",
  "title": "same as serviceHeroTitle",
  "subtitle": "same as serviceHeroSubtitle",
  "ai_image_prompt": "28-52 words: photoreal hero for ${serviceName || mainCategory} plus supporting storyboard; no overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${serviceName || mainCategory} job site"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- badgeText and serviceHeroBadge should match (or be near-identical)
- Do not invent phone/email/address
- If location is not "none": serviceHeroTitle MUST include service name AND ${locationName || city || "the area"} once
- serviceHeroSubtitle: one more natural geo reference with different wording
- Output ONLY valid JSON
`;
  },
};
