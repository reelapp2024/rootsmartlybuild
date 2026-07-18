/**
 * Services listing process — GenieBuild `serviceslistprocess` / ServicesListProcessDefault
 * Output items[] with icon/title/description (not homepage legacy data[]).
 */

module.exports = {
  id: "serviceslistprocess",

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
You are generating a Services-listing "How Our Process Works" section.

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
  "badgeText": "1-3 word process badge",
  "title": "4-8 word section heading",
  "subtitle": "18-30 word intro",
  "items": [
    {
      "icon": "fa-phone",
      "title": "2-5 word step title",
      "description": "Clear explanation of this step"
    }
  ]
}

Rules (IMPORTANT):
- Generate BETWEEN 4 and 6 process steps in logical order
- Each title UNIQUE (2-5 words); descriptions 22-40 words and UNIQUE
- icon: FA6 without "fas"; all DIFFERENT; match step meaning
- Reflect a realistic ${mainCategory} booking → diagnosis → work → satisfaction flow
- Mention ${locationName || city || "the area"} once in subtitle when location exists
- No phone digits / email / address in copy
- JSON only
`;
  },
};
