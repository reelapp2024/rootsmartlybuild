/**
 * Blog SEO by mode (per AI job or env fallback):
 *   0 = manual (no AI meta / schemas)
 *   1 = basic (meta title, description, keywords/tags)
 *   2 = premium (basic + OG polish + JSON-LD schemas[])
 */
const { getSeoMode, SEO_MODE } = require("../seoprompts/seoMode");
const {
  buildBlogPremiumSchemas,
  schemasToStructuredDataString,
} = require("../seoprompts/schemaBuilders");

function normalizeBlogSeoMode(raw) {
  const n = parseInt(raw, 10);
  if (n === 0 || n === 1 || n === 2) return n;
  return getSeoMode();
}

/**
 * Build seoMeta for a Blog document from AI payload + mode.
 */
function buildBlogSeoMeta({
  mode,
  payload = {},
  title = "",
  slug = "",
  contentHtml = "",
  authorName = "",
  projectName = "",
  coverImageUrl = "",
  datePublished = null,
  dateModified = null,
} = {}) {
  const seoMode = normalizeBlogSeoMode(mode);

  if (seoMode === SEO_MODE.OFF) {
    return {
      metaTitle: "",
      metaDescription: "",
      keywords: [],
      tags: [],
      schemas: [],
      structured_data: "",
      ogTitle: "",
      ogDescription: "",
      ogType: "",
      seoMode: SEO_MODE.OFF,
    };
  }

  const keywords = Array.isArray(payload.meta_keywords)
    ? payload.meta_keywords.map((k) => String(k || "").trim()).filter(Boolean).slice(0, 12)
    : [];
  const tags = keywords.slice(0, 8);
  const metaTitle = String(payload.meta_title || title || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70);
  const metaDescription = String(
    payload.meta_description || payload.information || title || ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const seoMeta = {
    metaTitle,
    metaDescription,
    keywords,
    tags,
    schemas: [],
    structured_data: "",
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    ogType: "article",
    seoMode,
  };

  if (seoMode === SEO_MODE.PREMIUM) {
    const schemas = buildBlogPremiumSchemas({
      title: metaTitle || title,
      slug,
      description: metaDescription,
      keywords,
      contentHtml: contentHtml || payload.content_html || "",
      authorName,
      projectName,
      coverImageUrl,
      datePublished,
      dateModified,
    });
    seoMeta.schemas = schemas;
    seoMeta.structured_data = schemasToStructuredDataString(schemas);
  }

  return seoMeta;
}

module.exports = {
  normalizeBlogSeoMode,
  buildBlogSeoMeta,
  SEO_MODE,
};
