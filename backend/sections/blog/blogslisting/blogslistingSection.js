/**
 * Blogs index page — hero + search UX strings
 * Multicolor ListBlogs: title \"Our Blog & Articles\", subtitle, search placeholder
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "blogslisting",
  imageCount: 6,

  schema: {
    blogsHeroTitle: "string",
    blogsHeroSubtitle: "string",
    searchPlaceholder: "string",
    filterHelperText: "string",
    emptyStateMessage: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";

    return `
Generate BLOG LISTING page UX copy (hero + search/filter hints).

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "blogsHeroTitle": "4-10 words",
  "blogsHeroSubtitle": "25-45 words — value of reading, expertise, updates",
  "searchPlaceholder": "Short input placeholder (3-8 words, e.g. \"Search articles…\")",
  "filterHelperText": "12-22 words — how to use search on this page",
  "emptyStateMessage": "10-20 words — shown when no posts match",
  "ai_image_prompt": "26-48 words: editorial blog index hero — desk, notebook, laptop, coffee, soft light; plus carousel moods for tips, industry, community, behind-scenes; ${mainCategory} context; no overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords blog writing desk laptop coffee (e.g. \"business blog notebook desk\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- No location-specific claims unless extraData contains an explicit region line.
- No phone/email/addresses.
- Output ONLY valid JSON.
`;
  }
};
