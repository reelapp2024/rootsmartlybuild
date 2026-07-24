/**
 * Service detail sub-services / what's included —
 * GenieBuild `servicedetailservices` / ServiceDetailServicesDefault
 * UI expects items[{ icon, title, description }].
 * Optional subServices string[] kept for legacy multicolor consumers.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicedetailservices",
  imageCount: 6,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "card",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    items: [
      {
        icon: "string",
        title: "string",
        description: "string",
      },
    ],
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
    const knownSubs = Array.isArray(extraData.subServices)
      ? extraData.subServices.filter(Boolean)
      : Array.isArray(extraData.subServiceNames)
        ? extraData.subServiceNames.filter(Boolean)
        : [];

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();

    return `
Generate "What's Included" / sub-service cards for ONE service detail page.

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Primary service: ${serviceName || mainCategory}
Known sub-service labels from admin/DB (prefer these titles when provided): ${knownSubs.join(", ") || "none — invent realistic add-ons for this service"}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "4-8 word heading (e.g. What's Included)",
  "subtitle": "16-28 words describing coverage at a glance",
  "items": [
    {
      "icon": "fa-clipboard-check",
      "title": "2-6 word card title",
      "description": "18-32 words explaining this inclusion/add-on"
    }
  ],
  "subServices": ["same titles as items, in order"],
  "ai_image_prompt": "26-48 words: photoreal strip matching different add-on vibes for ${serviceName || mainCategory}; no text.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${mainCategory} detail shots"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- Generate BETWEEN 6 and 10 items (use known sub-service titles when provided; never invent unrelated trades)
- Every title and description UNIQUE
- icon: FA6 without "fas" prefix; all DIFFERENT
- subServices array MUST list the same titles as items (same order)
- If location is not "none", make 1-2 descriptions subtly local (no street addresses)
- No phone/email/URLs
- Output ONLY valid JSON
`;
  },
};
