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
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";

    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are generating GUARANTEE section content for the website builder variant "GuaranteeSimple".

Layout in the UI (exactly one of each, top to bottom):
1) One icon (Font Awesome class string)
2) Optional small badge (uppercase label) — may be empty string if not needed
3) One main heading (plain text, no HTML unless you use one <span> for a highlighted phrase)
4) One body paragraph (trust / quality promise)
5) One primary button label + optional href

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location context:
${finalLocation || "No specific location"}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY (NO markdown, NO explanation):

{
  "badgeText": "TRUSTED GUARANTEE",
  "title": "5-10 word compelling guarantee headline",
  "subtitle": "20-45 words, professional, SEO-aware, category-specific",
  "statCard": {
    "icon": "fas fa-shield-halved",
    "label": "On-time completion",
    "value": "98%",
    "description": "Based on recent job performance"
  },
  "guaranteeList": [
    { "icon": "fas fa-check-circle", "line": "Line 1" },
    { "icon": "fas fa-check-circle", "line": "Line 2" },
    { "icon": "fas fa-check-circle", "line": "Line 3" }
  ]
}

================ RULES ================

badgeText:
- OPTIONAL: may be "" (empty string) if a badge would feel redundant
- If non-empty: 2–5 words, uppercase tone, no phone/email/address

title:
- REQUIRED, non-empty
- 5–10 words, strong and specific to ${mainCategory}
- You may include ONE optional highlight using HTML: last word or phrase in <span style="color: #E11D48">...</span> — or plain text only

subtitle:
- REQUIRED, non-empty
- 20-45 words, concise and strong
- Builds trust; mentions quality, satisfaction, or standing behind the work
- Location-aware only if natural; no street addresses
- NO phone numbers, emails, URLs, or "call us" / "contact us" wording

statCard:
- REQUIRED with keys: icon, label, value, description
- value should be realistic stat-style text like "98%" or "24/7"

guaranteeList:
- REQUIRED array with 4-8 objects
- each object: icon + line
- line should be 6-16 words

GLOBAL:
- Do NOT add extra keys
- Output MUST be valid JSON
- No markdown fences
`;
  },
};
