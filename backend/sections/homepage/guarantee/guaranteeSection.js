/**
 * Guarantee section — GenieBuild `GuaranteeSimple` variant.
 * Single column: one icon, optional badge, one heading, one body paragraph, one CTA.
 */

module.exports = {
  id: "guarantee",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    statCard: {
      icon: "string",
      label: "string",
      value: "string",
      description: "string"
    },
    guaranteeList: [{ icon: "string", line: "string" }]
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
You are generating GUARANTEE section content for "${projectName}" (${mainCategory}).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location context:
${finalLocation || "service area"}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY (NO markdown, NO explanation):

{
  "badgeText": "2-5 word badge unique to ${projectName}",
  "title": "5-10 word guarantee headline naming ${projectName} or ${mainCategory}",
  "subtitle": "20-45 words trust promise specific to this business",
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

================ RULES ================

badgeText:
- OPTIONAL: may be "" if redundant
- If set: 2–5 words, no phone/email/address

title:
- REQUIRED, 5–10 words, specific to ${mainCategory} / ${projectName}

subtitle:
- REQUIRED, 20-45 words
- Builds trust for ${projectName}; location-aware once if natural
- NO phone, email, URL, or "call us"

statCard (CRITICAL — must be unique per project):
- REQUIRED keys: icon, label, value, description
- value: short punchy metric (examples of STYLE only — invent a fresh one): percentages, years, "24/7", "Same-day", "4.9★", "100%"
- label: 2–4 words describing what the value means for THIS ${mainCategory} business
- description: 8–16 words, mention ${projectName} or ${mainCategory} naturally
- FORBIDDEN stock defaults — never output exactly:
  - value "98%" with label "On-time completion"
  - value "10" with label "Year Guarantee"
  - generic copy reused across unrelated businesses
- Pick a metric that fits ${mainCategory} (response time, satisfaction, warranty years, availability, local jobs completed, rating, etc.)

guaranteeList:
- 4–8 objects { icon, line }
- Each line 6–16 words, UNIQUE, specific to ${projectName} / ${mainCategory}
- icon = FA6 token without "fas" (e.g. fa-check-circle)

GLOBAL:
- Do NOT add extra keys
- Output MUST be valid JSON only
`;
  },
};
