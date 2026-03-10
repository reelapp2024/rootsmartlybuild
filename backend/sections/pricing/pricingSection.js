/**
 * Pricing Section Generator
 * Matches GenieBuild pricing section content structure
 */

module.exports = {
  id: "pricing",

  schema: {
    title: "string",
    subtitle: "string",
    items: [
      {
        id: "string",
        title: "string",
        price: "string",
        description: "string",
        features: ["string"]
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
You are generating PRICING PLANS section for a professional business website.

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
  "title": "Section heading (e.g., 'Pricing Plans')",
  "subtitle": "Optional supporting text (10-20 words)",
  "items": [
    {
      "id": "plan-1",
      "title": "Plan name (e.g., 'Basic', 'Professional')",
      "price": "$29",
      "description": "Plan description (10-20 words)",
      "features": [
        "Feature 1",
        "Feature 2",
        "Feature 3"
      ]
    }
  ]
}

Rules (VERY IMPORTANT):

TITLE:
- Standard pricing section title
- Examples: "Pricing Plans", "Choose Your Plan", "Our Pricing"

SUBTITLE (optional):
- 10-20 words
- Can be omitted if not needed

ITEMS:
- Generate 2-3 pricing plan items
- Each item MUST have unique id: "plan-1", "plan-2", etc.
- Title: Plan name (Basic, Professional, Enterprise, etc.)
- Price: Format as "$XX" or "$XXX"
- Description: Brief plan description (10-20 words)
- Features: Array of 4-6 feature strings
- Features should be relevant to ${mainCategory}
- Make pricing realistic for ${mainCategory} industry

GLOBAL:
- Professional pricing structure
- SEO optimized
- Category-specific pricing
- Do NOT include phone numbers
- Do NOT include email addresses
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
