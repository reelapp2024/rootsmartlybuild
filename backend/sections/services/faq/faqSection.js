/**
 * FAQ Section Generator — All Services listing page.
 */

const { faqWordCountRulesPromptBlock } = require("../../_shared/faqAnswerGuards");

module.exports = {
  id: "faq",
  scope: "services",

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

    const locationName = location?.name || location?.areaName || "";
    const city = location?.city || "";
    const state = location?.state || "";

    return `
You are generating a Frequently Asked Questions (FAQ) section for the ALL SERVICES listing page of a professional business website.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "Section heading",
  "subtitle": "12-24 words intro about services offered in this area",
  "faqCtaTitle": "Short heading inviting the customer to call (4-8 words)",
  "faqCtaDescription": "One sentence about fast, friendly phone support (18-32 words)",
  "ctaButtonText": "",
  "ctaButtonLink": "",
  "ctaButtonContactSource": "about_primary",
  "items": [
    {
      "question": "Customer-style question about services offered",
      "answer": "Detailed professional answer between 80 and 280 words"
    }
  ]
}

Rules (VERY IMPORTANT):

SCOPE:
- Questions about the range of ${mainCategory} services, how to choose the right service, coverage area, and general pricing/process expectations
- Do NOT focus on a single named service — this page lists all services

ITEMS:
- Generate BETWEEN 6 and 10 FAQ items
- Every question and answer must be UNIQUE
- Use keys "question" and "answer" only (not title/content)
- Make content location-aware where natural (${locationName || city || "service area"})
- No markdown or bullet points inside answers
- Do NOT include phone numbers, emails, or physical addresses in FAQ answers
${faqWordCountRulesPromptBlock()}

FAQ CTA:
- ctaButtonText and ctaButtonLink must be empty strings (backend injects primary business phone)
- ctaButtonContactSource must be "about_primary"

GLOBAL:
- Professional and helpful tone
- SEO optimized using ${focusKeyword} and ${seoKeywords}
- Output ONLY valid JSON object

CRITICAL:
Before returning JSON, verify EVERY answer is 80-280 words. Regenerate any short answer.
`;
  },
};
