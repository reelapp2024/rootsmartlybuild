/**
 * Content-site AUTHOR BOX — prefer Author collection (project.defaultAuthorId).
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../../sectionImagePrompts");

module.exports = {
  id: "authorbox",
  pageScope: "contentsites/article",
  source: "blog_author",
  imageCount: 1,
  imageRole: "avatar",
  schema: {
    title: "string",
    name: "string",
    jobTitle: "string",
    bio: "string",
    image: "string",
    authorId: "string",
    links: [{ label: "string", url: "string" }],
  },
  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const niche = project.focusKeyword || extraData.nicheName || project.projectName || "this niche";
    return `
Create a fallback AUTHOR card ONLY if the database has no Author for this content site.

Niche: ${niche}
Site: ${project.projectName || ""}

Return STRICT JSON ONLY:
{
  "title": "Written by",
  "name": "First Last",
  "jobTitle": "Blogger & Creative Designer",
  "bio": "40-80 words first-person bio matching the niche (like Blake's tattoo bio tone).",
  "image": "",
  "authorId": "",
  "links": [],
  "ai_image_prompt": "22-36 words friendly headshot for ${niche} blogger; no text.",
  "non_ai_image_prompt": "3-8 words stock writer headshot"
}

${IMAGE_PROMPT_JSON_RULES}

RULES: Prefer real Author records. image "". JSON only.
`;
  },
};
