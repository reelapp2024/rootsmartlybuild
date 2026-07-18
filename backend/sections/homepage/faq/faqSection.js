/**
 * FAQ Section Generator — homepage and general pages.
 */

const { faqWordCountRulesPromptBlock } = require("../../_shared/faqAnswerGuards");

module.exports = {
  id: "faq",
  scope: "homepage",

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
    const { project, location, extraData = {}, pageName = "" } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const isAreasListing =
      String(pageName || extraData?.pageName || "")
        .toLowerCase()
        .trim() === "areas";

    const areasHint = isAreasListing
      ? `
PAGE CONTEXT: ALL AREAS DIRECTORY (/areas)
- Questions should be about coverage, which cities you serve, travel/scheduling by area, and how to pick a location page.
`
      : "";

    return `
You are generating a Frequently Asked Questions (FAQ) section for a professional business website (homepage or general page).
${areasHint}
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
  "subtitle": "12-24 words section intro",
  "faqCtaTitle": "Short heading inviting the customer to call (4-8 words)",
  "faqCtaDescription": "One sentence about fast, friendly phone support (18-32 words)",
  "ctaButtonText": "",
  "ctaButtonLink": "",
  "ctaButtonContactSource": "about_primary",
  "items": [
    {
      "question": "Customer-style question",
      "answer": "Detailed professional answer between 90 and 220 words"
    }
  ]
}

Rules (VERY IMPORTANT):

HEADING:
- Use a professional FAQ heading with local SEO when location exists
- Examples: "Frequently Asked Questions", "${mainCategory} FAQs — ${locationName || city || "Your Area"}", "Common Questions for ${locationName || city || "Local"} Customers"

FAQ CTA (bottom support card below the accordion):
- faqCtaTitle: e.g. "Still have questions?"
- faqCtaDescription: reassuring line about talking to a real ${mainCategory} professional, average pickup time, 24/7 availability — NO phone number in this text
- ctaButtonText and ctaButtonLink must be empty strings (backend injects primary business phone)
- ctaButtonContactSource must be "about_primary"

ITEMS:
- Generate BETWEEN 6 and 10 FAQ items
- Every question and answer must be UNIQUE
- Use keys "question" and "answer" only (not title/content)
- Questions should reflect REAL customer concerns related to ${mainCategory}
- Include ${locationName || city || "the area"} in heading OR descriptionText once
- 3–5 FAQ answers should mention the area or city naturally; at most 2 questions should include the place name — never every item
- Vary phrasing: "serving ${locationName || city || "the area"}", "local homes", city name, not identical "in X" on every line
- No markdown or bullet points inside answers
- Do NOT include phone numbers, emails, or physical addresses in FAQ answers
- Do NOT reference contacting or calling inside FAQ answers (the FAQ CTA handles that)
${faqWordCountRulesPromptBlock()}

GLOBAL:
- Professional and helpful tone
- SEO optimized using ${focusKeyword} and ${seoKeywords}
- Output ONLY valid JSON object

CRITICAL:
Before returning JSON, verify EVERY answer is 90-220 words (minimum 50 words each or regeneration fails). Expand any short answer with useful detail before returning.
`;
  },
};
