/**
 * What Makes Us Different Section Generator
 * Returns exactly 6 differentiation points
 */

module.exports = {
  id: "difference",

  schema: [
    {
      title: "string",
      description: "string",
      iconClass: "string"
    }
  ],

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
You are generating a "What Makes Us Different" section for a professional business website.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

[
  {
    "title": "Unique differentiator",
    "description": "Explanation",
    "iconClass": "fas fa-bolt"
  }
]

Rules (VERY IMPORTANT):

- Generate EXACTLY 6 objects
- Every title must be UNIQUE
- Descriptions must be 20–25 words each
- iconClass must be valid "fas fa-..."
- All icons must be DIFFERENT
- Content must highlight differentiation within ${mainCategory}
- SEO optimized
- Professional tone
- Subtle location relevance allowed
- Do NOT include phone numbers
- Do NOT include emails
- Do NOT include addresses
- Do NOT mention contacting or calling
- Avoid generic filler
- No markdown
- No explanations
- Output ONLY valid JSON array
`;
  }
};
