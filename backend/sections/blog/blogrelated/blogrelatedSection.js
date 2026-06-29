/**
 * \"Related blogs\" section — heading + microcopy
 * Multicolor RelatedBlogs component uses API; this seeds CMS heading text.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "blogrelated",
  imageCount: 6,

  schema: {
    relatedTitle: "string",
    relatedSubtitle: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const articleTitle = extraData.articleTitle || extraData.title || "";

    return `
Generate RELATED ARTICLES section header copy.

Business: ${projectName}
Category: ${mainCategory}
Current article title (context only): ${articleTitle || "not specified"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "relatedTitle": "4-12 words",
  "relatedSubtitle": "18-32 words — encourage further reading",
  "ai_image_prompt": "24-42 words: soft editorial backgrounds + thumbnail-style cohesive photos for related ${mainCategory} articles grid; inclusive, professional, no text in frame.",
  "non_ai_image_prompt": "3-10 words stock keywords related articles reading laptop (e.g. \"blog thumbnails desk reading\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- No phone/email/addresses.
- Output ONLY valid JSON.
`;
  }
};
