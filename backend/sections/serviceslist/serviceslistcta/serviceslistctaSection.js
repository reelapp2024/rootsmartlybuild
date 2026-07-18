/**
 * Services listing CTA — GenieBuild `serviceslistcta` / ServicesListCtaDefault
 * Phone injected from AboutUs after generation.
 */

module.exports = {
  id: "serviceslistcta",

  schema: {
    title: "string",
    subtitle: "string",
    ctaText: "string",
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
You are generating a Services-listing page Call To Action (after the services grid).

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
  "title": "4-8 word compelling headline",
  "subtitle": "15-30 word supporting line",
  "ctaText": "2-4 word button text",
  "phoneSubText": "6-12 words under the phone line",
  "contactText": "",
  "contactHref": "",
  "items": [
    { "label": "short credibility stat", "icon": "fa-check-double" },
    { "label": "short credibility stat", "icon": "fa-star" },
    { "label": "short credibility stat", "icon": "fa-award" }
  ]
}

Rules (VERY IMPORTANT):
- Invite booking / quote for one of the listed services
- Include ${locationName || city || "the area"} once in title OR subtitle when location exists
- phoneSubText: NO phone digits (About Us injects the real number)
- items: exactly 3; icons FA6 without "fas"; labels 2-5 words
- contactText and contactHref MUST be empty strings
- No street addresses
- JSON only
`;
  },
};
