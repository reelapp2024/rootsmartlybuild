/**
 * Stats Section Generator
 * Returns exactly 4 statistic blocks
 */

module.exports = {
  id: "stats",

  schema: [
    {
      iconName: "string",
      value: "string",
      label: "string"
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
You are generating a "Stats" section for a professional business website.

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
    "iconName": "Briefcase",
    "value": "500+",
    "label": "Completed Projects"
  }
]

Rules (VERY IMPORTANT):

- Generate EXACTLY 4 objects
- Each iconName must be PascalCase (example: Briefcase, ChartLine, Clock, Trophy, Award, Globe)
- Each iconName must be DIFFERENT
- Each label must be DIFFERENT
- Values must look realistic for ${mainCategory} (examples: 500+, 10K+, 15+, 24/7)
- Do NOT reuse "Users"
- Make SEO optimized
- Subtle location relevance allowed
- Professional tone
- Avoid fake years or dates
- Do NOT include phone numbers
- Do NOT include emails
- Do NOT include addresses
- Do NOT mention contacting or calling
- No markdown
- No explanations
- Output ONLY valid JSON array
`;
  }
};
