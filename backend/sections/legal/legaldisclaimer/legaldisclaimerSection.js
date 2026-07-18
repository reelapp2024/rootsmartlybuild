/**
 * Legacy combined Disclaimer pack (hero + sections).
 * GenieBuild prefers `legalhero` + `legalcontent` — queue dual-writes both shapes.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "legaldisclaimer",
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
Generate a DISCLAIMER page for ${projectName} (${mainCategory}).

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "Legal",
  "heroTitle": "Disclaimer",
  "heroSubtitle": "18-35 words on informational nature of site",
  "lastUpdatedLabel": "Last updated line",
  "breadcrumbLabel": "Disclaimer",
  "sections": [
    { "heading": "string", "bodyHtml": "string" }
  ],
  "ai_image_prompt": "24-42 words: neutral abstract disclaimer mood; no overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords disclaimer legal abstract scales"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- sections: exactly 7 items — General Information; No Professional Advice; Service Limitations; Results Not Guaranteed; Third-Party Links; Liability Cap; Changes to Disclaimer.
- bodyHtml 70-140 words each; calm professional tone.
- No invented regulations; no phone/email/street address.
- Output ONLY valid JSON.
`;
  },
};
