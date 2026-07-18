/**
 * About page FAQ — matches GenieBuild `aboutfaq` / AboutFaqDefault
 * Company/trust FAQs (not contact-routing FAQs). Phone CTA from AboutUs after generation.
 */

const { faqWordCountRulesPromptBlock } = require("../../_shared/faqAnswerGuards");
const { aboutUniquenessRules } = require("../../_shared/aboutUniquenessPrompt");

module.exports = {
  id: "aboutfaq",
  scope: "about",

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
    const locationLabel = `${locationName || city || ""} ${state || ""}`.trim();
    const serviceNames = Array.isArray(extraData?.serviceNames)
      ? extraData.serviceNames.filter(Boolean).slice(0, 12)
      : [];

    return `
You are generating a Frequently Asked Questions (FAQ) section for the ABOUT US page of a professional business website.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}
Known Services (for context only — do NOT turn this into a service-repair FAQ): ${
      serviceNames.length ? serviceNames.join(", ") : "not listed"
    }

Location:
${locationLabel || "service area"}

Extra context:
${JSON.stringify({
      pageType: extraData.pageType || "about",
      pageName: extraData.pageName || "about",
      servicesCount: extraData.servicesCount,
    })}

${aboutUniquenessRules({
  projectName,
  mainCategory,
  focusKeyword,
  seoKeywords,
  locationLabel,
  pageLabel: "About Us FAQ",
})}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words unique to ${projectName}",
  "title": "4-9 word FAQ heading (not the generic phrase 'Frequently Asked Questions' alone — vary it)",
  "subtitle": "15-28 words about learning ${projectName}'s story, team, or approach",
  "faqCtaTitle": "4-8 word invite to call (no digits)",
  "faqCtaDescription": "18-32 words about talking with the ${projectName} team (no phone/email)",
  "ctaButtonText": "",
  "ctaButtonLink": "",
  "ctaButtonContactSource": "about_primary",
  "items": [
    {
      "question": "Customer-style question about the company",
      "answer": "Detailed professional answer between 80 and 280 words"
    }
  ]
}

Rules (VERY IMPORTANT):

SCOPE:
- Questions about ${projectName}: history/experience, team, service area, values, licensing/insurance, estimates, guarantees, what makes the company different
- NOT service-specific repair how-tos and NOT "how do I dial you" logistics (Contact page covers that)
- Answers must sound like a real operator in ${mainCategory} serving ${locationLabel || "the area"}

ITEMS:
- Generate BETWEEN 6 and 10 FAQ items
- Every question and answer must be UNIQUE
- Use keys "question" and "answer" only
- Make content location-aware where natural
- No markdown or bullet points inside answers
- Do NOT include phone numbers, emails, or physical addresses
- Do NOT tell readers to "call us at …" inside answers (FAQ CTA handles calling)
${faqWordCountRulesPromptBlock()}

FAQ CTA:
- ctaButtonText and ctaButtonLink must be empty strings (backend injects primary business phone from DB)
- ctaButtonContactSource must be "about_primary"

GLOBAL:
- Professional tone; SEO with ${focusKeyword} and related keywords without stuffing
- Output ONLY valid JSON

CRITICAL:
Before returning JSON, verify EVERY answer is 80-280 words. Regenerate any short answer.
`;
  },
};
