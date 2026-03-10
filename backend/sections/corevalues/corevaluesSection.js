/**
 * Core Values Section Generator
 * Returns intro text + exactly 6 core values
 */

module.exports = {
  id: "corevalues",

  schema: {
    intro: "string",
    items: [
      {
        title: "string",
        iconClass: "string",
        description: "string"
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
You are generating an "Our Core Values" section for a professional business website.

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
  "intro": "One sentence introduction",
  "items": [
    {
      "title": "Customer First",
      "iconClass": "fas fa-user-check",
      "description": "Value description"
    }
  ]
}

Rules (VERY IMPORTANT):

INTRO:
- Must be exactly ONE sentence
- Professional and SEO optimized

ITEMS:
- Generate EXACTLY 6 items
- Titles MUST be exactly:
  1. Customer First
  2. Professional Team
  3. Eco-Friendly
  4. Quality Standards
  5. Reliability
  6. Trust & Safety

- Each description must be 20–25 words
- iconClass must be valid "fas fa-..."
- Each icon must be DIFFERENT
- Descriptions must be unique
- Content must relate to ${mainCategory}

GLOBAL:
- Subtle location relevance allowed
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
