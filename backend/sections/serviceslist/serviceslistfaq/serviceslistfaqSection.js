/**
 * Services listing FAQ — GenieBuild `serviceslistfaq` / ServicesListFaqDefault
 */

const { faqWordCountRulesPromptBlock } = require("../../_shared/faqAnswerGuards");

module.exports = {
  id: "serviceslistfaq",
  scope: "serviceslist",

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
    const serviceNames = Array.isArray(extraData?.serviceNames)
      ? extraData.serviceNames.filter(Boolean)
      : [];

    const locationName = location?.name || location?.areaName || "";
    const city = location?.city || "";
    const state = location?.state || "";

    return `
You are generating FAQs for the SERVICES LISTING page (all services overview).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}
Known services: ${serviceNames.join(", ") || "general service range"}

Location:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "Section heading (e.g. Services FAQs)",
  "subtitle": "12-24 words intro",
  "faqCtaTitle": "4-8 words inviting a call",
  "faqCtaDescription": "18-32 words about helpful phone support",
  "ctaButtonText": "",
  "ctaButtonLink": "",
  "ctaButtonContactSource": "about_primary",
  "items": [
    {
      "question": "Customer-style question about services offered / booking",
      "answer": "Detailed professional answer between 80 and 280 words"
    }
  ]
}

Rules (VERY IMPORTANT):

SCOPE:
- Questions about what services are offered, bundling jobs, emergency availability, guarantees, how to request service, pricing clarity
- Align with known services when listed — do not invent unrelated trades
- Do NOT paste phone numbers, emails, or street addresses in answers

ITEMS:
- Generate BETWEEN 6 and 10 FAQ items
- Every question and answer UNIQUE
- Keys "question" and "answer" only
- Location-aware where natural (${locationName || city || "service area"})
- No markdown inside answers
${faqWordCountRulesPromptBlock()}

FAQ CTA:
- ctaButtonText and ctaButtonLink must be empty strings (backend injects primary phone)
- ctaButtonContactSource must be "about_primary"

Output ONLY valid JSON.
`;
  },
};
