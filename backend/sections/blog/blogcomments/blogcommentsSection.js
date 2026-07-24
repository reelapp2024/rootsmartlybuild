/**
 * Blog comments — moderation seed / engagement copy (optional use in admin)
 * Does not replace user comments API; supplies guidelines + example construct.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "blogcomments",
  imageCount: 6,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "thumbnail",

  schema: {
    commentSectionTitle: "string",
    commentSectionSubtitle: "string",
    communityGuidelinesHtml: "string",
    moderationNote: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";

    return `
Generate blog COMMENTS area framing content.

Business: ${projectName}
Category: ${mainCategory}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "commentSectionTitle": "3-8 words",
  "commentSectionSubtitle": "15-30 words — invite respectful discussion",
  "communityGuidelinesHtml": "One string of compact HTML (<p>, <ul><li>) 80-130 words on civility, no hate, no spam, stay on-topic",
  "moderationNote": "1-2 sentences on review timing / policy",
  "ai_image_prompt": "22-40 words: neutral community discussion mood — diverse faces in conversation, inclusive professional setting, soft abstract companion visuals; no overlaid text.",
  "non_ai_image_prompt": "3-10 words stock keywords community discussion diverse meeting (e.g. \"diverse team meeting discussion\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- No phone/email/addresses.
- Output ONLY valid JSON. Escape characters for valid JSON if using quotes in HTML.
`;
  }
};
