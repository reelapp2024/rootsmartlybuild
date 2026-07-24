/**
 * Blog listing hero — GenieBuild `blogshero` (light AI chrome only).
 * Post cards come from Blog collection via `blogslist`.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "blogshero",
  imageCount: 4,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "hero",

  schema: {
    badgeText: "string",
    blogsHeroTitle: "string",
    blogsHeroSubtitle: "string",
    title: "string",
    subtitle: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";

    return `
Generate BLOG INDEX hero copy only (no article bodies — posts come from the database).

Business: ${projectName}
Category: ${mainCategory}
Focus keyword: ${focusKeyword}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "blogsHeroTitle": "4-10 words",
  "blogsHeroSubtitle": "22-40 words — value of reading, expertise, updates",
  "title": "same as blogsHeroTitle",
  "subtitle": "same as blogsHeroSubtitle",
  "ai_image_prompt": "24-42 words: editorial desk / reading mood for ${mainCategory}; no overlaid text.",
  "non_ai_image_prompt": "3-8 words stock keywords blog desk notebook"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- Do NOT invent article titles or post cards.
- No phone/email/addresses.
- JSON only.
`;
  },
};
