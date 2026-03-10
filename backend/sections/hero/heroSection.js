/**
 * Hero Section Generator
 * Matches GenieBuild hero section content structure
 */

module.exports = {
  id: "hero",

  schema: {
    title: "string",
    subtitle: "string",
    ctaText: "string",
    badgeText: "string",
    coverImagePrompt: "string",
    otherImagesPrompt: "string"
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
You are generating HERO SECTION content for a professional business website.

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
  "title": "Powerful 5-8 word hero heading",
  "subtitle": "Supporting subheading (15-25 words)",
  "ctaText": "2-4 word call to action button text",
  "badgeText": "Short badge text (2-5 words)",
  "coverImagePrompt": "Detailed prompt for hero cover image generation (15-30 words describing the main hero image)",
  "otherImagesPrompt": "Detailed prompt for other section images generation (15-30 words describing images for features, testimonials, etc.)"
}

Rules (VERY IMPORTANT):

TITLE:
- Must be 5-8 words
- Compelling and action-oriented
- SEO optimized with focus keyword
- Location-aware when relevant

SUBTITLE:
- Must be 15-25 words
- Clear value proposition
- Professional and engaging
- Category-specific

CTA TEXT:
- Must be 2-4 words
- Action-oriented (e.g., "Get Started", "Learn More", "Contact Us")
- Clear and direct

BADGE TEXT:
- Must be 2-5 words
- Short, catchy label (e.g., "New", "Featured", "Popular", "Award Winning")
- Optional: Can be empty string "" if not needed
- Professional and attention-grabbing
- Category or feature-specific when relevant

COVER IMAGE PROMPT:
- Must be 15-30 words
- Detailed description for hero section cover image
- Relevant to ${mainCategory} and business type
- Professional, high-quality image description
- Should describe the main visual element for the hero section

OTHER IMAGES PROMPT:
- Must be 15-30 words
- Detailed description for other section images (features, testimonials, etc.)
- Relevant to ${mainCategory} and business type
- Professional, high-quality image description
- Should describe images suitable for various website sections

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
