/**
 * Blog article payload aligned with backend Blog model (blogs.js)
 * Fields: title, information, content, slug, coverImage.url/alt, seoMeta, etc.
 * Image URLs are NOT invented — use prompts for generation pipeline.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "blogarticle",
  imageCount: 6,

  schema: {
    title: "string",
    slugSuggestion: "string",
    information: "string",
    content: "string",
    coverImage: { url: "string", alt: "string" },
    seoMeta: {
      metaTitle: "string",
      metaDescription: "string",
      keywords: ["string"]
    },
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const topic = extraData.topic || extraData.blogTopic || focusKeyword || mainCategory;

    return `
You are drafting ONE blog article for publication (HTML body + SEO). Topic anchor: ${topic}

Business: ${projectName}
Category: ${mainCategory}

Extra:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "title": "Compelling title 8-14 words",
  "slugSuggestion": "lowercase-hyphen-slug-from-title-6-12-words-max",
  "information": "2-3 sentence plain teaser / meta intro (30-55 words), no HTML",
  "content": "Full article HTML as a single string. Use <h2>, <h3>, <p>, <ul><li>, <strong>. 4-6 sections, 550-850 words total. Practical, original, category-specific. No contact blocks.",
  "coverImage": {
    "url": "",
    "alt": "SEO alt text 8-20 words for cover image"
  },
  "seoMeta": {
    "metaTitle": "≤60 chars approx, include brand/category",
    "metaDescription": "140-160 chars approx, benefit-led",
    "keywords": ["5-8 short keyword phrases"]
  },
  "ai_image_prompt": "30-55 words: one detailed hero cover matching the article title + cohesive in-article figures (process shots, detail, environment) for ${topic}; photoreal editorial, no text in frame.",
  "non_ai_image_prompt": "3-10 words stock keywords for ${topic} (e.g. \"solar battery home garage install\")"
}

${IMAGE_PROMPT_JSON_RULES}

RULES:
- coverImage.url MUST be empty string "" (URL filled later by image pipeline).
- slugSuggestion: [a-z0-9-] only, no leading/trailing hyphens.
- No phone/email/street addresses in content.
- No location-specific claims unless extraData.location is set.
- Output ONLY valid JSON. Escape quotes inside HTML properly so JSON is valid.
`;
  }
};
