/**
 * Blog search / filter chrome — GenieBuild `blogssearch` (light AI only).
 */

module.exports = {
  id: "blogssearch",

  schema: {
    searchPlaceholder: "string",
    filterHelperText: "string",
    emptyStateMessage: "string",
    categories: ["string"],
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";

    return `
Generate search/filter UX strings for a blog index page (no posts).

Business: ${projectName}
Category: ${mainCategory}

Extra:
${JSON.stringify(extraData)}

RULES:
- categories: 4-6 short labels suitable for ${mainCategory}; first must be "All".
- No phone/email. JSON only.

Return STRICT JSON ONLY:

{
  "searchPlaceholder": "3-8 words (e.g. Search articles…)",
  "filterHelperText": "10-20 words about browsing topics",
  "emptyStateMessage": "8-16 words when no posts match",
  "categories": ["All", "Tips & Guides", "How-To", "Industry News", "Community"]
}
`;
  },
};
