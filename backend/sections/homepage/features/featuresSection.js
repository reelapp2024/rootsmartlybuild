/**
 * Features Section Generator
 * Matches GenieBuild features section content structure
 */

module.exports = {
  id: "features",

  schema: {
    title: "string",
    subtitle: "string",
    items: [
      {
        id: "string",
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
You are generating a "Features" section for a professional business website.

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
  "title": "Section heading (3-6 words)",
  "subtitle": "Optional supporting text (18-30 words)",
  "items": [
    {
      "id": "feature-1",
      "icon": "fas fa-star",
      "title": "Feature title (2-5 words)",
      "description": "Feature description (25-40 words)"
    }
  ]
}

Rules (VERY IMPORTANT):

TITLE:
- Must be 3-6 words
- Clear and descriptive
- SEO optimized

SUBTITLE (optional):
- 18-30 words
- Can be omitted if not needed

ITEMS:
- Generate EXACTLY 4-6 feature items
- Each item MUST have unique id: "feature-1", "feature-2", etc.
- Icon must be a valid Font Awesome class (fas fa-*)
  Examples: "fas fa-bolt", "fas fa-cogs", "fas fa-shield-alt", "fas fa-mobile-alt", "fas fa-star"
- Each icon must be DIFFERENT
- Title must be 2-5 words
- Description must be 25-40 words
- All features must relate directly to ${mainCategory}
- Make SEO optimized
- title OR subtitle: include ${locationName || city || "the area"} or city once when location exists
- Vary feature angles per page; 1–2 descriptions may reference the area with different wording

GLOBAL:
- Professional tone
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