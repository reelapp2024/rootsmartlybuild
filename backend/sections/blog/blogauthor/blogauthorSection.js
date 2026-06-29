/**
 * Author block — aligns with apps Author type + backend authors.js
 * name, jobTitle, bio, image (URL empty), links[]
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "blogauthor",
  imageCount: 1,

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
Create a plausible expert AUTHOR profile for ${mainCategory} content on behalf of ${projectName}.

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "name": "First Last",
  "jobTitle": "Realistic role 2-6 words",
  "bio": "45-90 words — credentials, perspective, specialty; no fake awards with dates",
  "image": "",
  "links": [
    { "label": "LinkedIn", "url": "#" },
    { "label": "Website", "url": "#" }
  ],
  "ai_image_prompt": "22-38 words: ONE professional headshot for this expert — inclusive, soft studio light, neutral background, confident expression, ${mainCategory} industry styling, no text.",
  "non_ai_image_prompt": "3-8 words stock keywords professional headshot portrait studio (e.g. \"professional woman headshot studio\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- image MUST be "" (empty). links[].url use \"#\" only — replace in CMS.
- No phone/email in bio.
- links: 2 or 3 items, labels unique.
- Output ONLY valid JSON.
`;
  }
};
