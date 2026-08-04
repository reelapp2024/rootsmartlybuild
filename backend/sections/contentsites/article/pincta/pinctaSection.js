/**
 * Content-site section prompt — article / pincta
 * projectType = 2. Live article body/author prefer Blog + Author collections.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../../sectionImagePrompts");

module.exports = {
  id: "pincta",
  pageScope: "contentsites/article",
  imageCount: 0,
  schema: {
    title: "string",
    subtitle: "string",
    body: "string",
    items: [{ title: "string", description: "string", link: "string" }],
  },
  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const projectName = project.projectName || "";
    const niche = project.focusKeyword || project.serviceType || extraData.nicheName || "";
    const category = project.serviceType || extraData.categoryName || "";
    return `
Create CONTENT for a niche CONTENT WEBSITE section.

Section: pincta
Page: article
Site: ${projectName}
Niche: ${niche}
Catalog category: ${category}
Goal: ${project.contentGoal || "Pinterest Traffic"}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:
{
  "title": "short punchy heading",
  "subtitle": "1 supporting sentence",
  "body": "optional short paragraph",
  "items": [
    { "title": "card title", "description": "1 line", "link": "#" }
  ]
}

RULES:
- Match the niche voice (visual, pin-worthy, helpful).
- No phone/email. No invented URLs (use "#").
- JSON only.
${IMAGE_PROMPT_JSON_RULES}
`;
  },
};
