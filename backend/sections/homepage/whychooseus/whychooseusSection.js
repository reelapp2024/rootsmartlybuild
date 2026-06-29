/**
 * Why Choose Us Section Generator
 * Returns 5–10 benefit cards
 */

module.exports = {
  id: "whychooseus",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    featureBoxes: [
      {
        icon: "string",
        title: "string",
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
{
  "badgeText": "2-4 words",
  "title": "4-9 words",
  "subtitle": "18-36 words",
  "featureBoxes": [
    {
      "icon": "fas fa-star",
      "title": "Short benefit title",
      "description": "Benefit explanation"
    }
  ]
}

Rules (IMPORTANT):

- Generate BETWEEN 6 and 10 featureBoxes
- Each title must be UNIQUE
- Each description must be UNIQUE
- Descriptions must be 22-38 words
- icon must be valid FontAwesome solid icons ("fas fa-...")
- Each icon must be DIFFERENT
- Content must relate directly to ${mainCategory}
- title OR subtitle: include ${locationName || city || "the area"} or city once for local SEO
- 2–3 benefits may reference local context (area, city, nearby, local properties) with varied phrasing — not the same "in X" every line
- Keep professional tone
- Make SEO optimized
- Do NOT include phone numbers
- Do NOT include emails
- Do NOT include addresses
- Do NOT mention contacting or calling
- Avoid generic filler content
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
