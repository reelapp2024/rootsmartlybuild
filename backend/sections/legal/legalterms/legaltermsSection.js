/**
 * Legacy combined Terms pack (hero + sections).
 * GenieBuild prefers `legalhero` + `legalcontent` — queue dual-writes both shapes.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "legalterms",
  imageCount: 6,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "thumbnail",

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
Generate TERMS & CONDITIONS for ${projectName} (${mainCategory}).

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "Legal",
  "heroTitle": "Terms & Conditions",
  "heroSubtitle": "18-35 words",
  "lastUpdatedLabel": "Last updated line",
  "breadcrumbLabel": "Terms & Conditions",
  "sections": [
    { "heading": "string", "bodyHtml": "string" }
  ],
  "ai_image_prompt": "24-42 words: professional agreement / terms moodboard; no readable contract text.",
  "non_ai_image_prompt": "3-10 words stock keywords terms contract document abstract"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- sections: exactly 8 unique headings, e.g. Acceptance; Services Description; Payment Terms; Scheduling/Cancellations; Liability Limitations; Warranties Disclaimer; Intellectual Property; Governing Law (generic).
- No invented law firm or state unless extraData specifies.
- No phone/email/physical address — refer to "contact page".
- bodyHtml 80-160 words per section.
- Output ONLY valid JSON with escaped HTML.
`;
  },
};
