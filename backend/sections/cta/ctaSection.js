/**
 * CTA Section Generator
 * Matches GenieBuild CTA section content structure
 */

module.exports = {
  id: "cta",

  schema: {
    title: "string",
    subtitle: "string",
    ctaText: "string"
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
You are generating a Call To Action (CTA) section for a professional business website.

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
  "title": "Compelling headline (4-8 words)",
  "subtitle": "Supporting persuasive text (15-30 words)",
  "ctaText": "2-4 word action button text"
}

Rules (VERY IMPORTANT):

TITLE:
- Must be 4-8 words
- Compelling and action-oriented
- Creates urgency or value proposition
- SEO optimized

SUBTITLE:
- Must be 15-30 words
- Persuasive and clear
- Reinforces the value proposition
- Professional tone

CTA TEXT:
- Must be 2-4 words
- Action-oriented (e.g., "Get Started", "Contact Us", "Learn More")
- Clear and direct
- Matches the section's purpose

GLOBAL:
- SEO optimized
- Location-aware when relevant
- Category-specific content
- Professional and persuasive tone
- Do NOT include phone numbers
- Do NOT include email addresses
- Do NOT include physical addresses
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
