/**
 * Shared prompt builder for content-site legal body sections
 * (privacybody / termsbody / disclaimerbody).
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

function docRules(docType) {
  if (docType === "terms") {
    return `
- Exactly 8 sections with unique headings covering:
  1. Acceptance of Terms
  2. Use of the Website & Content
  3. Intellectual Property
  4. User Conduct
  5. Disclaimers of Warranties
  6. Limitation of Liability
  7. Third-Party Links & Affiliates
  8. Changes & Contact
- Each bodyHtml: 90–160 words of clear HTML (<p>, optional <ul><li>).
- Tone: fair, readable terms for a niche content / Pinterest-style publisher — NOT a local service contractor.
`;
  }
  if (docType === "disclaimer") {
    return `
- Exactly 7 sections covering:
  1. General Information
  2. No Professional Advice
  3. Results Not Guaranteed
  4. Affiliate / Sponsored Disclosure
  5. Third-Party Links & Products
  6. Liability Limits
  7. Changes to This Disclaimer
- Each bodyHtml: 80–140 words; calm editorial tone for a content niche site.
- Mention affiliate relationships in plain language when relevant to content sites.
`;
  }
  return `
- Exactly 8 sections covering:
  1. Information We Collect
  2. How We Use Information
  3. Cookies & Analytics
  4. Sharing & Third Parties
  5. Data Retention & Security
  6. Your Rights & Choices
  7. Children's Privacy
  8. Changes & Contact
- Each bodyHtml: 90–160 words of valid HTML.
- Content-website context (newsletter signup, contact form, analytics, ads/affiliates) — not a trades business CRM.
`;
}

/**
 * @param {"privacy"|"terms"|"disclaimer"} docType
 * @param {string} sectionId
 */
function buildContentLegalBodySection(docType, sectionId) {
  const docLabel =
    docType === "terms"
      ? "Terms & Conditions"
      : docType === "disclaimer"
        ? "Disclaimer"
        : "Privacy Policy";

  return {
    id: sectionId,
    pageScope: "contentsites/legal",
    imageCount: 0,
    schema: {
      title: "string",
      subtitle: "string",
      lastUpdatedLabel: "string",
      body: "string",
      sections: [{ heading: "string", bodyHtml: "string" }],
    },
    prompt(ctx) {
      const { project, extraData = {}, pageName = "", pageSlug = "" } = ctx;
      const projectName = project.projectName || "";
      const niche =
        project.focusKeyword || project.serviceType || extraData.nicheName || "";
      const category = project.serviceType || extraData.categoryName || "";

      return `
Generate a complete ${docLabel} DOCUMENT for a niche CONTENT WEBSITE (projectType=2).

Section id: ${sectionId}
Site / brand: ${projectName}
Niche: ${niche}
Catalog category: ${category}
Content goal: ${project.contentGoal || "Pinterest Traffic"}
Page name: ${pageName || extraData.pageName || ""}
Page slug: ${pageSlug || extraData.slug || ""}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:
{
  "title": "${docLabel}",
  "subtitle": "1 clear sentence summarizing what this page covers for ${projectName || "this site"}",
  "lastUpdatedLabel": "Last updated: Month Year",
  "sections": [
    {
      "heading": "1. Example Heading",
      "bodyHtml": "<p>Paragraph with real substance…</p><ul><li>Optional bullet</li></ul>"
    }
  ],
  "body": "<p>Optional flat HTML fallback concatenating the document — can be empty if sections are complete.</p>"
}

RULES:
${docRules(docType)}
- Write as if for a real publisher in this niche; never leave placeholder text like "Replace after generation".
- No phone numbers, emails, or physical addresses — say "use the contact form on this website".
- No invented law firm, jurisdiction, or regulation numbers unless provided in Extra.
- Escape HTML properly inside JSON strings.
- JSON only — no markdown fences.
${IMAGE_PROMPT_JSON_RULES}
`;
    },
  };
}

module.exports = {
  buildContentLegalBodySection,
  docRules,
};
