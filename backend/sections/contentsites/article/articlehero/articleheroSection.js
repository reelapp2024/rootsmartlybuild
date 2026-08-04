/**
 * Content-site ARTICLE HERO — title, byline, date (Blog fields hydrate live).
 */

module.exports = {
  id: "articlehero",
  pageScope: "contentsites/article",
  source: "blog_article_hero",
  imageCount: 1,
  imageRole: "hero",
  schema: {
    title: "string",
    authorName: "string",
    publishedAt: "string",
    excerpt: "string",
    coverImage: "string",
  },
  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const kw = extraData.primaryKeyword || project.focusKeyword || "topic";
    return `
Create ARTICLE HERO fields for a content website.

Site: ${project.projectName || ""}
Keyword: ${kw}

Return STRICT JSON ONLY:
{
  "title": "Full article title targeting the keyword",
  "authorName": "Editor",
  "publishedAt": "",
  "excerpt": "1–2 sentence hook",
  "coverImage": ""
}

RULES: publishedAt and coverImage "". JSON only.
`;
  },
};
