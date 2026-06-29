/**
 * Our Process Section Generator (Backend Only)
 * Returns 5–8 process steps WITH FontAwesome icons
 */

module.exports = {
  id: "process",

  schema: {
    badge: "string",
    title: "string",
    description: "string",
    data: [
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
{
  "badge": "SHORT DYNAMIC BADGE (example: Client Journey, Service Flow, Creative Steps)",
  "title": "DYNAMIC SECTION TITLE FOR THE BUSINESS (example: How Our Tattoo Studio Works)",
  "description": "DYNAMIC INTRO SENTENCE FOR THIS BUSINESS PROCESS",
  "data": [
    {
      "title": "Short step title (2–5 words)",
      "description": "Clear explanation of this step",
      "iconClass": "fas fa-search"
    }
  ]
}

Rules (IMPORTANT):

- Generate BETWEEN 5 and 8 process steps
- Each step must be UNIQUE and follow logical order
- badge must be short (1–3 words), professional, and relevant to the process
- title must be a clear section heading (2–6 words), e.g. "Our Process" or "How We Work"
- description must be a concise section intro sentence (18-30 words)
- badge and title must be SPECIFIC to ${mainCategory || "the business"} and must NOT be generic placeholders
- NEVER output badge as "Workflow"
- NEVER output title as "Our Process"
- NEVER output title as "How We Work"
- Titles must be 2–5 words
- Descriptions must be 25-45 words
- iconClass MUST be valid FontAwesome solid icons in format "fas fa-..."
- Every step must use a DIFFERENT iconClass
- Icons must logically match the step meaning
- Steps must reflect realistic workflow for ${mainCategory}
- Make content SEO optimized
- description intro: mention ${locationName || city || "the area"} or city once when location exists
- Steps reflect real workflow; at most 1–2 steps may reference local on-site realities — not "in X" on every step title
- Do NOT include phone numbers
- Do NOT include email addresses
- Do NOT include physical addresses
- Do NOT mention contacting or calling
- Avoid generic filler steps
- Keep professional tone
- No markdown
- No explanations
- Output ONLY valid JSON object matching the schema
`;
  }
};
