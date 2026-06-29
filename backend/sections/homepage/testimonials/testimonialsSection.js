/**
 * Testimonials Section Generator
 * Matches GenieBuild testimonials section content structure
 */

module.exports = {
  id: "testimonials",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    items: [
      {
        id: "string",
        description: "string",
        author: "string",
        role: "string",
        avatar: "string"
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
You are generating customer testimonials for a professional business website.

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
  "title": "Section heading (e.g., 'What Our Customers Say')",
  "subtitle": "Optional supporting text (12-24 words)",
  "items": [
    {
      "id": "testimonial-1",
      "description": "Authentic customer review quote (35-60 words)",
      "author": "Customer first name",
      "role": "Customer role or title",
      "avatar": "https://randomuser.me/api/portraits/[men/women]/[1-10].jpg"
    }
  ]
}

Rules (VERY IMPORTANT):

HEADING:
- Standard testimonials section title
- Examples: "What Our Customers Say", "Client Testimonials", "Reviews"

DESCRIPTION:
- 12-24 words

ITEMS:
- Generate BETWEEN 3 and 6 testimonial items
- Each item MUST have unique id: "testimonial-1", "testimonial-2", etc.
- Description must be 35-60 words
- Author must be realistic first name only (no surnames)
- Role should be relevant (e.g., "Customer", "Client", "Homeowner", "Business Owner")
- Avatar must be valid randomuser.me URL format
- Every review must be UNIQUE
- Reviews must sound natural and human
- Reviews must relate directly to ${mainCategory}
- subtitle may mention ${locationName || city || "the area"} once
- 1–2 reviews may reference the area or city naturally; every review must still sound unique — not the same quote with only the neighborhood swapped

AVATAR URLS:
- Use randomuser.me API format
- Examples:
  - "https://randomuser.me/api/portraits/men/1.jpg"
  - "https://randomuser.me/api/portraits/women/2.jpg"
- Mix men and women
- Use numbers 1-10

GLOBAL:
- Professional and authentic tone
- Do NOT include phone numbers
- Do NOT include email addresses
- Do NOT include physical addresses
- Do NOT reference calling or contacting
- Avoid overly marketing language
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
