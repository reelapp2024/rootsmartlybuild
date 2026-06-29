/**
 * Single service detail — hero layer copy
 * fetch_service uses: service_name, service_description, images[0], etc.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicehero",
  imageCount: 6,

  schema: {
    serviceHeroBadge: "string",
    serviceHeroTitle: "string",
    serviceHeroSubtitle: "string",
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
You are generating HERO copy for ONE service detail page.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service name (if known): ${serviceName || "Unknown — infer from category"}
Service slug hint: ${serviceSlug || "n/a"}
Location context (when user views service under a location — may be "none"): ${loc}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "serviceHeroBadge": "2-5 word premium label (e.g. Same-Day Service)",
  "serviceHeroTitle": "8-16 words; MUST include the service name or clear synonym + category",
  "serviceHeroSubtitle": "35-55 words: outcomes, who it helps, urgency; no contact info",
  "ai_image_prompt": "28-52 words: photoreal hero for ${serviceName || mainCategory} plus supporting storyboard — problem, diagnostic, work-in-progress, finished result, maintenance tip visual; consistent palette; no overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${serviceName || mainCategory} technician job site (e.g. \"electrician breaker panel repair\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- Do not invent phone/email/address.
- If service name missing, derive a plausible proper noun phrase from category only.
- If location is not "none": serviceHeroTitle MUST include the service name AND ${locationName || city || "the area"} or city once (e.g. "${serviceName || mainCategory} in ${locationName || city || "Your Area"}", "${locationName || city || "Local"} ${serviceName || mainCategory}").
- serviceHeroSubtitle: one more natural geo reference with different wording (serving, near, properties in, local) plus clear value proposition.
- Output ONLY valid JSON.
`;
  }
};
