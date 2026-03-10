/**
 * Our Process Section Generator (Backend Only)
 * Returns 5–8 process steps WITH FontAwesome icons
 */

module.exports = {
  id: "process",

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
You are generating an "Our Process" section for a professional business website.

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
    "title": "Short step title (2–5 words)",
    "description": "Clear explanation of this step",
    "iconClass": "fas fa-search"
  }
]

Rules (IMPORTANT):

- Generate BETWEEN 5 and 8 process steps
- Each step must be UNIQUE and follow logical order
- Titles must be 2–5 words
- Descriptions must be 20–35 words
- iconClass MUST be valid FontAwesome solid icons in format "fas fa-..."
- Every step must use a DIFFERENT iconClass
- Icons must logically match the step meaning
- Steps must reflect realistic workflow for ${mainCategory}
- Make content SEO optimized
- Make content location aware when natural
- Do NOT include phone numbers
- Do NOT include email addresses
- Do NOT include physical addresses
- Do NOT mention contacting or calling
- Avoid generic filler steps
- Keep professional tone
- No markdown
- No explanations
- Output ONLY valid JSON array
`;
  }
};
