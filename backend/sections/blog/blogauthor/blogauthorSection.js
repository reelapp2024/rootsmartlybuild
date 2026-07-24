/**
 * Author block — prefer Author collection (queue DB hydrate).
 * OpenAI prompt kept only as last-resort seed when no Author rows exist.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "blogauthor",
  source: "blog_author",
  imageCount: 1,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "avatar",

  schema: {
    name: "string",
    jobTitle: "string",
    bio: "string",
    image: "string",
    links: [{ label: "string", url: "string" }],
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";

    return `
Create a fallback AUTHOR profile ONLY if the database has no author (seed). Prefer real Author records elsewhere.

Business: ${projectName}
Category: ${mainCategory}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "name": "First Last",
  "jobTitle": "2-6 word role",
  "bio": "40-80 words",
  "image": "",
  "links": [{ "label": "LinkedIn", "url": "#" }],
  "ai_image_prompt": "22-36 words professional headshot for ${mainCategory}; no text.",
  "non_ai_image_prompt": "3-8 words stock professional headshot"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- image MUST be "". links url "#".
- No phone/email. JSON only.
`;
  },
};
