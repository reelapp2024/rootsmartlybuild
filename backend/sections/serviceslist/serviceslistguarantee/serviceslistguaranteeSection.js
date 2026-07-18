/**
 * Services listing guarantee — GenieBuild `serviceslistguarantee`
 */

module.exports = {
  id: "serviceslistguarantee",

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
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || project.serviceType || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";

    const locationName = location?.name || location?.areaName || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are generating a Services-listing GUARANTEE / promise section for "${projectName}" (${mainCategory}).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location:
${finalLocation || "service area"}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-5 words unique to ${projectName}",
  "title": "5-10 word guarantee headline",
  "subtitle": "20-45 words trust / quality promise",
  "ctaText": "2-4 word button label",
  "ctaHref": "#",
  "statCard": {
    "icon": "fa-shield-halved",
    "label": "Short metric label unique to this business",
    "value": "Short metric value unique to this business",
    "description": "8-16 words explaining the metric for ${projectName}"
  },
  "guaranteeList": [
    { "icon": "fa-check-circle", "line": "Concrete guarantee line" }
  ]
}

Rules:
- guaranteeList: 4-8 unique lines specific to ${mainCategory} / ${projectName}
- icon: FA6 without "fas" prefix
- No phone/email/street address; no hard "call now" in subtitle
- Subtle location relevance allowed once

statCard (CRITICAL):
- Invent a fresh metric for THIS business — do NOT copy stock "98%" / "On-time completion"
- value + label + description must fit ${mainCategory}
- Forbidden exact stock pair: value "98%" + label "On-time completion"

- JSON only
`;
  },
};
