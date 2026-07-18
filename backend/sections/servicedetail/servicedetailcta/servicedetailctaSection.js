/**
 * Service detail CTA — GenieBuild `servicedetailcta` / ServiceDetailCtaDefault
 * Single band matching contact/serviceslist CTA shape (phone from AboutUs).
 * Also keeps optional cta1..cta4 for legacy multicolor consumers.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "servicedetailcta",
  imageCount: 6,

  schema: {
    title: "string",
    subtitle: "string",
    ctaText: "string",
    phoneSubText: "string",
    contactText: "string",
    contactHref: "string",
    items: [{ label: "string", icon: "string" }],
    cta1: { title: "string", description: "string" },
    cta2: { title: "string", description: "string" },
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
Generate a Service Detail Call To Action band (GenieBuild servicedetailcta).

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}
Service: ${serviceName || mainCategory}
Location (optional): ${finalLocation || "none"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "title": "4-8 word compelling headline about booking this service",
  "subtitle": "15-30 word supporting line",
  "ctaText": "2-4 word button text",
  "phoneSubText": "6-12 words under the phone line",
  "contactText": "",
  "contactHref": "",
  "items": [
    { "label": "short credibility stat", "icon": "fa-check-double" },
    { "label": "short credibility stat", "icon": "fa-star" },
    { "label": "short credibility stat", "icon": "fa-award" }
  ],
  "cta1": { "title": "4-10 words", "description": "20-40 words — early-page CTA variant" },
  "cta2": { "title": "4-10 words", "description": "20-40 words — late-page CTA variant, different hook" },
  "ai_image_prompt": "26-48 words: conversion-focused photoreal for ${serviceName || mainCategory}; no text.",
  "non_ai_image_prompt": "3-10 words stock keywords for booking service"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- Primary title/subtitle/ctaText power the GenieBuild CTA band
- contactText/contactHref MUST be empty (About Us injects phone)
- phoneSubText: NO phone digits
- items: exactly 3 trust-strip rows
- cta1 and cta2 must be DISTINCT hooks (for pages that place two CTAs)
- Include ${locationName || city || "the area"} once in title OR subtitle when location exists
- JSON only
`;
  },
};
