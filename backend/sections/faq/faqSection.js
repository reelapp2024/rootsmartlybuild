/**
 * FAQ Section Generator
 * Matches GenieBuild FAQ section content structure
 */

module.exports = {
  id: "faq",

  schema: {
    title: "string",
    items: [
      {
        question: "string",
        answer: "string"
      }
    ]
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
You are generating a Frequently Asked Questions (FAQ) section for a professional business website.

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
  "title": "Section heading (e.g., 'Frequently Asked Questions')",
  "items": [
    {
      "question": "Customer-style question",
      "answer": "Clear helpful answer (25-50 words)"
    }
  ]
}

Rules (VERY IMPORTANT):

TITLE:
- Standard FAQ section title
- Examples: "Frequently Asked Questions", "Common Questions", "FAQ"

ITEMS:
- Generate BETWEEN 5 and 8 FAQ items
- Each item must have question and answer
- Every question must be UNIQUE
- Every answer must be UNIQUE
- Questions should reflect real customer concerns related to ${mainCategory}
- Answers should be professional, informative, and reassuring
- Answer length: 25-50 words
- Make content SEO optimized
- Make content location-aware where natural

GLOBAL:
- Professional and helpful tone
- Do NOT include phone numbers
- Do NOT include email addresses
- Do NOT include physical addresses
- Do NOT reference contacting or calling
- Avoid generic filler content
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
