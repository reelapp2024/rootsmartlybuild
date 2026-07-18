/**
 * Service detail FAQ — GenieBuild `servicedetailfaq`
 */

const { faqWordCountRulesPromptBlock } = require("../../_shared/faqAnswerGuards");

module.exports = {
  id: "servicedetailfaq",
  scope: "servicedetail",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    faqCtaTitle: "string",
    faqCtaDescription: "string",
    ctaButtonText: "string",
    ctaButtonLink: "string",
    ctaButtonContactSource: "string",
    items: [{ question: "string", answer: "string" }],
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || project.serviceType || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";
    const serviceName = String(extraData.serviceName || extraData.service_name || "").trim();

    const locationName = location?.name || location?.areaName || "";
    const city = location?.city || "";
    const state = location?.state || "";

    return `
You are generating FAQs for a SERVICE DETAIL page (GenieBuild servicedetailfaq).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Service Name: ${serviceName || mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location (shape Q&A for this area):
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "Section heading (e.g. Service FAQs)",
  "subtitle": "12-24 words intro about this specific service",
  "faqCtaTitle": "4-8 words inviting a call",
  "faqCtaDescription": "18-32 words about helpful phone support for this service",
  "ctaButtonText": "",
  "ctaButtonLink": "",
  "ctaButtonContactSource": "about_primary",
  "items": [
    {
      "question": "Customer-style question about ${serviceName || mainCategory}",
      "answer": "Detailed professional answer between 80 and 280 words"
    }
  ]
}

Rules (VERY IMPORTANT):

SCOPE:
- Questions about this specific service: process, duration, pricing clarity, prep, guarantee, emergency options
- Location-aware where natural (${locationName || city || "service area"})
- Do NOT paste phone numbers, emails, or street addresses in answers

ITEMS:
- Generate BETWEEN 6 and 10 FAQ items
- Every question and answer UNIQUE
- Keys "question" and "answer" only
- No markdown inside answers
${faqWordCountRulesPromptBlock()}

FAQ CTA:
- ctaButtonText and ctaButtonLink must be empty strings (backend injects primary phone)
- ctaButtonContactSource must be "about_primary"

Output ONLY valid JSON.
`;
  },
};
