/**
 * Legal document body — GenieBuild `legalcontent`
 * Sections[] only. Hero chrome lives in `legalhero`.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");
const { resolveLegalDocType } = require("../../../services/legalSectionDynamics");

function docRules(docType) {
  if (docType === "terms") {
    return `
- sections: exactly 8 unique headings — Acceptance; Services Description; Payment Terms; Scheduling/Cancellations; Liability Limitations; Warranties Disclaimer; Intellectual Property; Governing Law (generic).
- bodyHtml 80-160 words per section.
- No invented law firm or state unless extraData specifies.
`;
  }
  if (docType === "disclaimer") {
    return `
- sections: exactly 7 items — General Information; No Professional Advice; Service Limitations; Results Not Guaranteed; Third-Party Links; Liability Cap; Changes to Disclaimer.
- bodyHtml 70-140 words each; calm professional tone.
- No invented regulations.
`;
  }
  return `
- sections: exactly 8 items covering: Information We Collect; Types of Information; How We Use Information; Sharing; Cookies/Tracking; Data Security; Your Rights; Contact (say "use website contact form" — NO real email/phone).
- bodyHtml per section: 80-160 words equivalent inside valid HTML string.
- Legally prudent neutral language; not jurisdiction-specific legal advice.
`;
}

module.exports = {
  id: "legalcontent",
  imageCount: 2,

  schema: {
    sections: [{ heading: "string", bodyHtml: "string" }],
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {}, pageName = "", pageSlug = "" } = ctx;
    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const docType = resolveLegalDocType({
      sectionId: "legalcontent",
      pageName: pageName || extraData.pageName || "",
      pageSlug: pageSlug || extraData.slug || "",
      extraData,
    });
    const docLabel =
      docType === "terms"
        ? "Terms & Conditions"
        : docType === "disclaimer"
          ? "Disclaimer"
          : "Privacy Policy";

    return `
Generate the ${docLabel} DOCUMENT BODY for ${projectName} (${mainCategory} business).
Hero titles are generated separately — return sections only.

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "sections": [
    { "heading": "1. Example Heading", "bodyHtml": "<p>...</p> optionally <ul><li>...</li></ul>" }
  ],
  "ai_image_prompt": "20-36 words soft abstract legal/trust accents for ${docLabel}; no text.",
  "non_ai_image_prompt": "3-8 words stock keywords legal document abstract"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
${docRules(docType)}
- No phone/email/physical address — refer to "contact page" or "website contact form".
- Output ONLY valid JSON with escaped HTML.
`;
  },
};
