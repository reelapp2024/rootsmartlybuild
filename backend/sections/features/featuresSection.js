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
  "subtitle": "Optional supporting text (10-20 words)",
  "items": [
    {
      "id": "feature-1",
      "icon": "⚡️",
      "title": "Feature title (2-5 words)",
      "description": "Feature description (15-25 words)"
    }
  ]
}

Rules (VERY IMPORTANT):

TITLE:
- Must be 3-6 words
- Clear and descriptive
- SEO optimized

SUBTITLE (optional):
- 10-20 words
- Can be omitted if not needed

ITEMS:
- Generate EXACTLY 4-6 feature items
- Each item MUST have unique id: "feature-1", "feature-2", etc.
- Icon must be emoji (e.g., ⚡️, 🎨, 🔒, 📱, ✨, 🚀)
- Each icon must be DIFFERENT
- Title must be 2-5 words
- Description must be 15-25 words
- All features must relate directly to ${mainCategory}
- Make SEO optimized
- Subtle location relevance allowed

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
