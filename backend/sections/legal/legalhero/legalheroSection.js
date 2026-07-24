/**
 * Legal page hero — GenieBuild `legalhero`
 * Doc type (privacy / terms / disclaimer) comes from page name or extraData.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");
const {
  resolveLegalDocType,
  legalDocDefaults,
} = require("../../../services/legalSectionDynamics");

module.exports = {
  id: "legalhero",
  imageCount: 4,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "hero",

  schema: {
    badgeText: "string",
    heroTitle: "string",
    heroSubtitle: "string",
    title: "string",
    subtitle: "string",
    lastUpdatedLabel: "string",
    breadcrumbLabel: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {}, pageName = "", pageSlug = "" } = ctx;
    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const docType = resolveLegalDocType({
      sectionId: "legalhero",
      pageName: pageName || extraData.pageName || "",
      pageSlug: pageSlug || extraData.slug || "",
      extraData,
    });
    const defaults = legalDocDefaults(docType);
    const docLabel =
      docType === "terms"
        ? "Terms & Conditions"
        : docType === "disclaimer"
          ? "Disclaimer"
          : "Privacy Policy";

    return `
Generate LEGAL PAGE HERO copy only (document body is a separate section).

Business: ${projectName}
Category: ${mainCategory}
Document type: ${docLabel}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "Legal",
  "heroTitle": "${defaults.heroTitle}",
  "heroSubtitle": "18-35 words introducing this ${docLabel} page",
  "title": "same as heroTitle",
  "subtitle": "same as heroSubtitle",
  "lastUpdatedLabel": "Last updated: Month Year (current or from extraData)",
  "breadcrumbLabel": "${defaults.breadcrumbLabel}",
  "ai_image_prompt": "22-40 words: abstract trust/legal visual for ${docLabel}; no readable text.",
  "non_ai_image_prompt": "3-8 words stock keywords legal document abstract"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- heroTitle should match the document type (${docLabel}) unless extraData overrides.
- Do NOT invent phone, email, or street address.
- Do NOT write policy body sections here.
- JSON only.
`;
  },
};
