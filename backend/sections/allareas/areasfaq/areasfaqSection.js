/**
 * All Areas page FAQ — GenieBuild `areasfaq` / AreasFaqDefault
 */

const { faqWordCountRulesPromptBlock } = require("../../_shared/faqAnswerGuards");

module.exports = {
  id: "areasfaq",
  scope: "allareas",

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
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";

    return `
You are generating the FAQ section for an ALL AREAS DIRECTORY page (/areas).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Primary market:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "FAQ",
  "title": "Areas FAQ heading (4-8 words)",
  "subtitle": "Short intro about coverage questions (18-30 words)",
  "faqCtaTitle": "Still unsure about coverage?",
  "faqCtaDescription": "1 short sentence inviting a call/contact",
  "ctaButtonText": "Contact Us",
  "ctaButtonLink": "/contact",
  "ctaButtonContactSource": "page",
  "items": [
    { "question": "...", "answer": "..." }
  ]
}

RULES:
- Exactly 5-7 FAQ items
- Focus on: which areas you serve, booking by city, travel/response by area, missing city, pricing by area, finding the closest team
- Do NOT invent a specific unverified city list beyond general coverage language
- Do NOT include phone/email strings
${faqWordCountRulesPromptBlock()}
- Valid JSON only, no markdown
`;
  },
};
