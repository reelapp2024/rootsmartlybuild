/**
 * Legacy combined Privacy Policy pack (hero + sections).
 * GenieBuild prefers `legalhero` + `legalcontent` — queue dual-writes both shapes.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "legalprivacy",
  imageCount: 6,

  schema: {
    badgeText: "string",
    heroTitle: "string",
    heroSubtitle: "string",
    lastUpdatedLabel: "string",
    breadcrumbLabel: "string",
    sections: [{ heading: "string", bodyHtml: "string" }],
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";

    return `
Generate a PRIVACY POLICY content pack for ${projectName} (${mainCategory} business).

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "Legal",
  "heroTitle": "Privacy Policy",
  "heroSubtitle": "18-35 words on commitment to data protection",
  "lastUpdatedLabel": "Single line e.g. \\"Last updated: April 2026\\"",
  "breadcrumbLabel": "Privacy Policy",
  "sections": [
    { "heading": "string", "bodyHtml": "<p>...</p> possibly <ul><li>...</li></ul>" }
  ],
  "ai_image_prompt": "24-45 words: abstract photoreal trust/security set for privacy; no readable text or logos.",
  "non_ai_image_prompt": "3-10 words stock keywords privacy security lock abstract"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- sections: exactly 8 items, headings unique, covering: Information We Collect; Types of Information; How We Use Information; Sharing; Cookies/Tracking; Data Security; Your Rights; Contact (contact section must say "use website contact form" — NO real email/phone invented).
- bodyHtml per section: 80-160 words equivalent inside valid HTML string.
- Legally prudent neutral language; not jurisdiction-specific legal advice.
- Output ONLY valid JSON. Escape properly for JSON strings.
`;
  },
};
