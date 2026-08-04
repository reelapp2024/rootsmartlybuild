/**
 * Content-site ARTICLE BODY prompt — listicle / guide HTML for Blog CMS.
 *
 * Architecture (future-proof):
 *   - Source of truth = Blog collection (HTML content + authorId + SEO + slug)
 *   - GenieBuild article template = chrome (hero, author box, related, pin CTA)
 *   - This prompt generates Blog.content HTML (tables, TOC, numbered ideas, Also See)
 *
 * Style targets examples like:
 *   - "23 Divine Feminine Tattoo Ideas…" (numbered listicle + TOC + sources)
 *   - "Best Season to Get a New Tattoo…" (guide + comparison table + related)
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../../sectionImagePrompts");

module.exports = {
  id: "articlebody",
  pageScope: "contentsites/article",
  source: "blog_content",
  imageCount: 0,
  schema: {
    title: "string",
    excerpt: "string",
    html: "string",
    toc: [{ id: "string", label: "string" }],
    tableOfContentsTitle: "string",
  },

  /**
   * Generate full article HTML for Blog.content (not GenieBuild section JSON alone).
   */
  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const projectName = project.projectName || "";
    const niche = project.focusKeyword || extraData.nicheName || "";
    const category = project.serviceType || extraData.categoryName || "";
    const primaryKeyword =
      extraData.primaryKeyword || extraData.pillarKeyword || niche || "topic";
    const articleType = extraData.articleType || "listicle"; // listicle | guide
    const itemCount = Number(extraData.itemCount || (articleType === "listicle" ? 12 : 0));
    const authorName = extraData.authorName || "Editor";

    return `
You are a senior niche content writer for a Pinterest / SEO CONTENT website (2026).

Write ONE complete article as HTML for the Blog CMS (stored on Blog.content).

Site: ${projectName}
Niche: ${niche}
Catalog category: ${category}
Primary keyword / angle: "${primaryKeyword}"
Author byline name: ${authorName}
Article type: ${articleType}
${articleType === "listicle" ? `Target listicle count: about ${itemCount} numbered ideas (8–23 is fine).` : "Write a clear how-to / explainer guide."}

Return STRICT JSON ONLY:
{
  "title": "SEO title — specific, curiosity + benefit (like the examples)",
  "excerpt": "2–3 sentence intro teaser",
  "tableOfContentsTitle": "Table of Contents",
  "toc": [{ "id": "slug-id", "label": "Visible TOC label" }],
  "html": "<full article HTML body — see rules>"
}

HTML STRUCTURE RULES (match pro blog examples):

1) OPENING
   - 2–4 short paragraphs after title context (title itself is separate field).
   - Conversational, specific, zero fluff. Soft CTA to save / keep reading.

2) TABLE OF CONTENTS (listicles & long guides)
   - <nav class="article-toc"><h2>Table of Contents</h2><ol>…</ol></nav>
   - Each <li><a href="#slug-id">Label</a></li> matches heading ids.

3) LISTICLE ITEMS (when articleType=listicle)
   - For each idea: <h2 id="slug-id">N. Idea Title</h2>
   - Optional: <figure> with <img> placeholder src="" alt="…" and <figcaption>Source: @handle Platform</figcaption>
   - 1–3 rich paragraphs analyzing composition / emotion / placement — NOT generic filler.
   - Occasionally insert <p class="also-see"><strong>Also See:</strong> <a href="#">Related article title</a></p>

4) GUIDE ARTICLES (when articleType=guide)
   - Clear H2 sections, short paragraphs, rhetorical questions OK.
   - Include at least ONE comparison <table class="article-table"> with <thead>/<tbody>, emoji season labels OK.
   - Optional "Related" callouts as <aside class="related-card">…</aside>
   - End with ranked verdict or final takeaway.

5) TABLES
   - Use semantic HTML tables only (not images of tables).
   - class="article-table" on <table>.
   - Keep cells short; mobile-friendly columns (3–5 max).

6) STYLE
   - No <html>/<body>/<head>. Fragment HTML only.
   - No inline scripts. Minimal inline styles.
   - Do NOT invent real external URLs; use href="#" for Also See / related.
   - img src must be "" (empty) — images filled later.
   - Voice: helpful expert friend, modern, visual-first niche writing.

7) AUTHOR is NOT inside html — author box is separate (Author collection).

${IMAGE_PROMPT_JSON_RULES}

JSON only. No markdown fences.
`;
  },
};
