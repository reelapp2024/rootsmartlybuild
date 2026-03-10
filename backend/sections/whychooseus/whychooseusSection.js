/**
 * Why Choose Us Section Generator
 * Returns 5–10 benefit cards
 */

module.exports = {
  id: "whychooseus",

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
You are generating a "Why Choose Us" section for a professional business website.

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
    "title": "Short benefit title",
    "description": "Benefit explanation",
    "iconClass": "fas fa-star"
  }
]

Rules (IMPORTANT):

- Generate BETWEEN 5 and 10 objects
- Each title must be UNIQUE
- Each description must be UNIQUE
- Descriptions must be 20–35 words
- iconClass must be valid FontAwesome solid icons ("fas fa-...")
- Each icon must be DIFFERENT
- Content must relate directly to ${mainCategory}
- Include subtle location relevance when natural
- Keep professional tone
- Make SEO optimized
- Do NOT include phone numbers
- Do NOT include emails
- Do NOT include addresses
- Do NOT mention contacting or calling
- Avoid generic filler content
- No markdown
- No explanations
- Output ONLY valid JSON array
`;
  }
};
