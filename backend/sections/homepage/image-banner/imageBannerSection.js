/**
 * Image Banner Section Generator
 * Matches GenieBuild image-banner section content structure
 */

module.exports = {
  id: "image-banner",

  schema: {
    title: "string",
    subtitle: "string",
    ctaText: "string",
    imageUrl: "string"
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
You are generating IMAGE BANNER section content for a professional business website.

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
  "title": "Banner headline (4-8 words)",
  "subtitle": "Supporting text (15-25 words)",
  "ctaText": "2-4 word call to action",
  "imageUrl": "https://images.unsplash.com/photo-[relevant-image]?q=80&w=2070&auto=format&fit=crop"
}

Rules (VERY IMPORTANT):

TITLE:
- Must be 4-8 words
- Compelling banner headline
- SEO optimized
- Action-oriented

SUBTITLE:
- Must be 15-25 words
- Clear value proposition
- Professional and engaging

CTA TEXT:
- Must be 2-4 words
- Action-oriented (e.g., "Learn More", "Get Started")
- Clear and direct

IMAGE URL:
- Use Unsplash URLs for professional business images
- Relevant to ${mainCategory}
- Format: https://images.unsplash.com/photo-[id]?q=80&w=2070&auto=format&fit=crop
- Use high-quality, professional banner images

GLOBAL:
- SEO optimized
- Location-aware when natural
- Category-specific content
- Professional tone
- Do NOT include phone numbers
- Do NOT include email addresses
- Do NOT include physical addresses
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
