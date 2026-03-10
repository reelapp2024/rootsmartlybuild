/**
 * Guarantee Section Generator
 * Returns main text + 4 guarantee cards
 */

module.exports = {
  id: "guarantee",

  schema: {
    text: "string",
    items: [
      {
        title: "string",
        description: "string",
        iconClass: "string"
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
You are generating an "Our Guarantee" section for a professional business website.

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
  "text": "Main guarantee paragraph",
  "items": [
    {
      "title": "Guarantee title",
      "description": "Guarantee explanation",
      "iconClass": "fas fa-shield-alt"
    }
  ]
}

Rules (VERY IMPORTANT):

TEXT:
- Must be 80–90 words exactly
- Professional and trust-building
- SEO optimized
- No contact info

ITEMS:
- Generate EXACTLY 4 items
- Each title UNIQUE
- Each description 20–30 words
- Each iconClass valid "fas fa-..."
- All icons DIFFERENT
- Items must relate to quality, reliability, professionalism, and customer care

GLOBAL:
- Content must relate to ${mainCategory}
- Subtle location mention allowed
- Do NOT include phone numbers
- Do NOT include emails
- Do NOT include addresses
- Do NOT mention contacting or calling
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
