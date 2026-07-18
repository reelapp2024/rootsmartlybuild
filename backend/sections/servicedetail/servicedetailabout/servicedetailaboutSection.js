/**
 * Service detail about — GenieBuild `servicedetailabout` / ServiceDetailAboutDefault
 * Body key `about_service` is read by aboutServiceShared helpers.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicedetailabout",
  imageCount: 2,

  schema: {
    badgeText: "string",
    title: "string",
    service_name: "string",
    about_service: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || project.serviceType || "";
    const focusKeyword =
      project.focusKeyword || project.projectKeywordsText || project.serviceType || "";
    const serviceName = extraData.serviceName || extraData.service_name || "";
    const serviceSlug = extraData.serviceSlug || extraData.service_slug || "";
    const parentAreaName = extraData.parentAreaName || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const country = location?.country || "";
    const finalLocation =
      [locationName, parentAreaName, city, state, country].filter(Boolean).join(" · ") || "none";

    return `
Write the ABOUT THIS SERVICE section for a service detail page (GenieBuild servicedetailabout).

Business / brand: ${projectName}
Trade or category: ${mainCategory}
Primary SEO keyword: ${focusKeyword || serviceName || mainCategory}
Service (exact offering): ${serviceName || "Core service"}
Service slug (internal): ${serviceSlug || "n/a"}
Location stack: ${finalLocation}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words (e.g. About This Service)",
  "title": "4-10 word section heading including the service name when known",
  "service_name": "${serviceName || "About This Service"}",
  "about_service": "EXACTLY 3 paragraphs separated by \\\\n\\\\n. Total 120–220 words. Specific to this service and location. No phone/email/street/URL.",
  "ai_image_prompt": "28–48 words: photoreal scenes for this exact service in this place; no overlaid text.",
  "non_ai_image_prompt": "3–10 words: tight stock keywords only."
}

${IMAGE_PROMPT_JSON_RULES}

HARD BANS:
- No generic filler openings ("In today's world", "Look no further", "When it comes to")
- No vague "#1" / "best-in-class" without concrete local detail

MUST:
- Paragraph 1: what the service solves — mention place once
- Paragraph 2: strongest local angle (property types, seasonality, access)
- Paragraph 3: expectations (timelines, consultation, quality checks)
- Use service + place names 2–3 times total with varied phrasing
- Count words: hard minimum 120 before returning JSON
- Output ONLY valid JSON
`;
  },
};
