/**
 * Services listing Why Choose Us — GenieBuild `serviceslistwhychoose`
 */

module.exports = {
  id: "serviceslistwhychoose",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    items: [
      {
        icon: "string",
        title: "string",
        description: "string",
      },
    ],
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
You are generating a Services-listing page "Why Choose Us" section.

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
  "title": "4-9 word section heading",
  "subtitle": "18-36 word supporting line",
  "items": [
    {
      "icon": "fa-medal",
      "title": "Short reason title",
      "description": "Reason explanation"
    }
  ]
}

Rules (IMPORTANT):
- Generate EXACTLY 6 items
- Each title and description UNIQUE
- Descriptions 18–30 words
- icon: FA6 token without "fas" prefix; all DIFFERENT
- Focus on why customers should choose THIS ${mainCategory} company's services (skills, reliability, pricing clarity, guarantee, local trust)
- title OR subtitle: mention ${locationName || city || "the area"} once when location exists
- No phone/email/address; no "call us"
- No markdown — JSON only
`;
  },
};
