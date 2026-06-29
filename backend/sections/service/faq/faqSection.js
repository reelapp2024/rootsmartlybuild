/**
 * FAQ Section Generator — single service detail pages (service_sections bundle).
 */

const { faqWordCountRulesPromptBlock } = require("../../_shared/faqAnswerGuards");

module.exports = {
  id: "faq",
  scope: "service",

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
    const serviceName = String(extraData.serviceName || extraData.service_name || "").trim();

    return `
You are generating a Frequently Asked Questions (FAQ) section for a SERVICE page on a professional business website.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Service Name: ${serviceName || mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location (must shape questions/answers for this area):
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "Section heading (service-specific)",
  "subtitle": "12-24 words intro about this service in this location",
  "faqCtaTitle": "Short heading inviting the customer to call (4-8 words)",
  "faqCtaDescription": "One sentence about fast phone support for this service (18-32 words)",
  "ctaButtonText": "",
  "ctaButtonLink": "",
  "ctaButtonContactSource": "about_primary",
  "items": [
    {
      "question": "Customer-style question about this service",
      "answer": "Detailed professional answer between 80 and 280 words"
    }
  ]
}

Rules (VERY IMPORTANT):

SCOPE:
- ALL questions and answers must be about "${serviceName || mainCategory}" specifically
- Include ${locationName || city || "the service area"} in heading OR descriptionText once for local SEO
- 3–5 answers should mention the area or city naturally; at most 2 questions should include the place name
- Vary phrasing across items — not identical "in ${locationName || city || "X"}" on every line

HEADING:
- Professional FAQ heading (e.g. "${serviceName || mainCategory} FAQs — ${locationName || city || "Your Area"}", "Questions About ${serviceName || mainCategory} in ${locationName || city || "Your Area"}")

FAQ CTA (bottom support card):
- faqCtaTitle: e.g. "Still have questions?" or "Need help with ${serviceName || mainCategory}?"
- faqCtaDescription: reassuring line about speaking to a real ${mainCategory} professional, fast response, 24/7 if applicable
- Do NOT put a phone number in faqCtaDescription
- ctaButtonText and ctaButtonLink must be empty strings (system injects primary phone)
- ctaButtonContactSource must be "about_primary"

ITEMS:
- Generate BETWEEN 6 and 10 FAQ items
- Every question and answer must be UNIQUE
- Use keys "question" and "answer" only (not title/content)
- Questions should reflect REAL customer concerns for this service (scope, timing, materials, safety, follow-up)
- No markdown, no bullet points inside answers
- Do NOT include phone numbers, emails, or addresses inside FAQ answers
- Do NOT tell users to "call us" inside FAQ answers (use the FAQ CTA block for that)
${faqWordCountRulesPromptBlock()}

GLOBAL:
- Professional and helpful tone
- SEO optimized using ${focusKeyword} and ${seoKeywords}
- Output ONLY valid JSON object

CRITICAL:
Before returning JSON, verify EVERY answer is 80-280 words. Regenerate any short answer.
`;
  },
};
