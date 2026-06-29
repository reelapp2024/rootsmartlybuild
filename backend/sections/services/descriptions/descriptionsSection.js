/**
 * Descriptions Section Generator
 * Returns exactly 5 SEO optimized paragraphs
 */

module.exports = {
  id: "descriptions",

  schema: ["string"],

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
You are generating multiple homepage description paragraphs for a professional business website.

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
  "Paragraph one",
  "Paragraph two",
  "Paragraph three",
  "Paragraph four",
  "Paragraph five"
]

Rules (VERY IMPORTANT):

- Generate EXACTLY 5 paragraphs
- Each paragraph must be 80–90 words
- Each paragraph must be UNIQUE
- SEO optimized
- Must relate directly to ${mainCategory}
- Subtle location relevance allowed
- Professional tone
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
