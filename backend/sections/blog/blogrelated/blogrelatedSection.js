/**
 * Related articles — light AI for headings; cards from Blog collection (queue merges).
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "blogrelated",
  imageCount: 4,
  source: "blog_related",

  schema: {
    badgeText: "string",
    relatedTitle: "string",
    relatedSubtitle: "string",
    title: "string",
    subtitle: "string",
    items: [
      {
        title: "string",
        excerpt: "string",
        slug: "string",
        img: "string",
      },
    ],
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const articleTitle = extraData.articleTitle || extraData.title || "";

    return `
Generate RELATED ARTICLES section header copy ONLY (cards come from the Blog database).

Business: ${projectName}
Category: ${mainCategory}
Current article title (context): ${articleTitle || "not specified"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "relatedTitle": "4-12 words",
  "relatedSubtitle": "14-28 words",
  "title": "same as relatedTitle",
  "subtitle": "same as relatedSubtitle",
  "items": [],
  "ai_image_prompt": "20-36 words soft editorial thumbnails mood for ${mainCategory}; no text.",
  "non_ai_image_prompt": "3-8 words stock blog reading"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- items MUST be an empty array (backend fills from Blog).
- No phone/email. JSON only.
`;
  },
};
