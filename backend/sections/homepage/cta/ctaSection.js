/**
 * CTA Section Generator
 * Matches GenieBuild CTA section content structure
 */

module.exports = {
  id: "cta",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    ctaText: "string",
    phoneNumber: "string",
    phoneSubText: "string",
    contactText: "string",
    contactHref: "string",
    items: [{ label: "string", icon: "string" }],
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
  "badgeText": "2-4 words",
  "title": "Compelling headline (4-8 words)",
  "subtitle": "Supporting persuasive text (15-30 words)",
  "ctaText": "2-4 word secondary action button text (e.g. \"Book online\")",
  "phoneNumber": "A realistic local phone number in display format, e.g. (555) 123-4567",
  "phoneSubText": "6-12 words under the phone line (e.g. availability or how to book)",
  "contactText": "",
  "contactHref": "",
  "items": [
    { "label": "short credibility stat (e.g. jobs completed, rating, years)", "icon": "fa-check-double" },
    { "label": "short credibility stat", "icon": "fa-star" },
    { "label": "short credibility stat", "icon": "fa-award" }
  ]
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

PHONE SUBTEXT (phoneSubText):
- One line shown under the phone number
- Professional, specific to ${mainCategory} when possible
- No phone numbers or emails in this field

TRUST STRIP (items) — REQUIRED, exactly 3 objects:
- Each object: "label" (2-5 words, a real credibility metric for this business type) and "icon" (Font Awesome 6 icon name only, e.g. "fa-star", "fa-award", "fa-check-double")
- Examples of label style (do NOT copy verbatim unless they fit): completed jobs count, star rating, years in business, licensed & insured, same-day service
- Labels must be plausible and category-specific — not generic filler
- Icons must match the label meaning

GLOBAL:
- SEO optimized
- title OR subtitle: include ${locationName || city || "the area"} or city once for a local call-to-action
- Persuade with trade-specific outcomes; second geo mention only if wording differs (serving, near, local)
- Category-specific content
- Professional and persuasive tone
- contactText/contactHref should be empty string (backend will inject primary phone/email)
- Do NOT include physical addresses
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
