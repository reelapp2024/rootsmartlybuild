/**
 * Service detail guarantee — GenieBuild `servicedetailguarantee`
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicedetailguarantee",
  imageCount: 4,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "card",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    ctaText: "string",
    ctaHref: "string",
    statCard: {
      icon: "string",
      label: "string",
      value: "string",
      description: "string",
    },
    guaranteeList: [{ icon: "string", line: "string" }],
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || project.serviceType || "";
    const focusKeyword = project.focusKeyword || "";
    const serviceName = extraData.serviceName || extraData.service_name || "";

    const locationName = location?.name || location?.areaName || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();
    const focus = serviceName || mainCategory || "this service";

    return `
Generate a service-specific GUARANTEE / promise section for "${projectName}".

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service: ${focus}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-5 words unique to ${focus}",
  "title": "5-10 word guarantee headline for ${focus}",
  "subtitle": "20-45 words trust promise for ${focus}",
  "ctaText": "2-4 word button label",
  "ctaHref": "#",
  "statCard": {
    "icon": "fa-shield-halved",
    "label": "Short metric label unique to ${focus}",
    "value": "Short metric value unique to ${focus}",
    "description": "8-16 words explaining the metric for ${projectName}"
  },
  "guaranteeList": [
    { "icon": "fa-check-circle", "line": "Concrete guarantee line for ${focus}" }
  ],
  "ai_image_prompt": "26-45 words: warranty/trust visual for ${focus}; no text.",
  "non_ai_image_prompt": "3-10 words stock keywords for guarantee trust"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- guaranteeList: 4-8 unique lines specific to ${focus}
- icon: FA6 without "fas"
- Subtle location relevance allowed once
- No phone/email/street address

statCard (CRITICAL):
- Invent a fresh metric for THIS service — do NOT copy stock "98%" / "On-time completion" / "Jobs done right"
- value + label must fit ${focus} and ${projectName}
- Forbidden exact stock pair: value "98%" + label "On-time completion"

- JSON only
`;
  },
};
