/**
 * Legacy standalone vision generator.
 * Prefer About-page combined `missionvision` (GenieBuild MissionVisionDefault).
 * Kept for older pipelines that still request `vision` alone.
 */

module.exports = {
  id: "vision",

  schema: {
    line: "string",
    subHeadings: ["string"],
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
You are generating an "Our Vision" section for a professional business website.

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
  "line": "Short vision line",
  "subHeadings": [
    "Sub heading one",
    "Sub heading two",
    "Sub heading three"
  ]
}

Rules (VERY IMPORTANT):

LINE:
- Must be approximately 25–45 characters

SUBHEADINGS:
- Generate EXACTLY 3 strings
- Each must be 5–10 words
- No repeated words across subHeadings
- Each must be UNIQUE

GLOBAL:
- Vision must relate to ${mainCategory}
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

NOTE: For the About page prefer the combined section id "missionvision".
`;
  },
};
