/**
 * Mission Section Generator
 * Returns mission line + exactly 3 sub-headings
 */

module.exports = {
  id: "mission",

  schema: {
    line: "string",
    subHeadings: ["string"]
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
You are generating an "Our Mission" section for a professional business website.

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
  "line": "Short mission line",
  "subHeadings": [
    "Sub heading one",
    "Sub heading two",
    "Sub heading three"
  ]
}

Rules (VERY IMPORTANT):

LINE:
- Must be approximately 25 characters (short impactful sentence)

SUBHEADINGS:
- Generate EXACTLY 3 strings
- Each must be 5–10 words
- No repeated words across subHeadings
- Each must be UNIQUE

GLOBAL:
- Mission must relate to ${mainCategory}
- SEO optimized
- Professional tone
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
