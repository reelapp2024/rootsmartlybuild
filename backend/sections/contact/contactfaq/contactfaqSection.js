/**
 * Contact page FAQ — matches GenieBuild `contactfaq` / ContactFaqDefault
 * Phone CTA button filled from AboutUs after generation.
 */

const { faqWordCountRulesPromptBlock } = require("../../_shared/faqAnswerGuards");

module.exports = {
  id: "contactfaq",
  scope: "contact",

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
You are generating a Frequently Asked Questions (FAQ) section for the CONTACT page of a professional business website.

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
  "title": "Section heading (e.g. Contact FAQs)",
  "subtitle": "12-24 words intro about reaching the team",
  "faqCtaTitle": "Short heading inviting the customer to call (4-8 words)",
  "faqCtaDescription": "One sentence about fast, friendly phone support (18-32 words)",
  "ctaButtonText": "",
  "ctaButtonLink": "",
  "ctaButtonContactSource": "about_primary",
  "items": [
    {
      "question": "Customer-style question about contacting the business",
      "answer": "Detailed professional answer between 80 and 280 words"
    }
  ]
}

Rules (VERY IMPORTANT):

SCOPE:
- Questions about how to reach the team, response times, service area coverage, scheduling, and what to prepare before a visit
- Do NOT paste phone numbers, emails, or street addresses in answers (contact details are shown elsewhere on the page)

ITEMS:
- Generate BETWEEN 6 and 10 FAQ items
- Every question and answer must be UNIQUE
- Use keys "question" and "answer" only (not title/content)
- Make content location-aware where natural (${locationName || city || "service area"})
- No markdown or bullet points inside answers
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
