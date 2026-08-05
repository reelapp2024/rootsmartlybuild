/**
 * Blog section dynamics — Blog/Author/Review collections are source of truth.
 * Shapes match GenieBuild blog sections (hero, content, author, related, comments, list).
 * OpenAI only fills chrome (hero/search headings, comments framing) at generation time.
 */

const Blog = require("../models/blogs");
const Author = require("../models/authors");
const Review = require("../models/reviews");
const { normalizeAuthorLinks } = require("../additional/authorLinks");

/**
 * Pull a real URL string out of coverImage / image fields.
 * Never coerce objects with String() — that becomes "[object Object]".
 */
function extractMediaUrl(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (!s || /^\[object\s+object\]$/i.test(s)) return "";
    // JSON-encoded { url } from FormData
    if (
      (s.startsWith("{") && s.endsWith("}")) ||
      (s.startsWith("[") && s.endsWith("]"))
    ) {
      try {
        return extractMediaUrl(JSON.parse(s));
      } catch {
        return "";
      }
    }
    return s;
  }
  if (typeof value === "object") {
    const keys = ["url", "src", "href", "path", "image", "imageUrl", "secure_url", "location"];
    for (const key of keys) {
      const nested = value[key];
      if (typeof nested === "string") {
        const s = nested.trim();
        if (s && !/^\[object\s+object\]$/i.test(s)) {
          // Recurse in case nested string is JSON
          const inner = extractMediaUrl(s);
          if (inner) return inner;
        }
      }
      if (nested && typeof nested === "object") {
        const deeper = extractMediaUrl(nested);
        if (deeper) return deeper;
      }
    }
  }
  return "";
}

/** Absolute media URL for relative upload paths stored in Blog/Author. */
function absolutizeMediaUrl(value) {
  const u = extractMediaUrl(value);
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || /^data:/i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  const base = String(
    process.env.MEDIA_BASE_URL ||
      process.env.BASE_URL ||
      process.env.BACKEND_PUBLIC_URL ||
      "http://localhost:1111"
  )
    .trim()
    .replace(/\/+$/, "");
  try {
    const parsed = new URL(base.includes("://") ? base : `http://${base}`);
    const origin = `${parsed.protocol}//${parsed.host}`;
    return `${origin}${u.startsWith("/") ? "" : "/"}${u}`;
  } catch {
    return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
  }
}

/** Normalize Blog.coverImage for API responses: always { url, alt } with string url. */
function normalizeCoverImage(cover, title = "") {
  const url = absolutizeMediaUrl(
    extractMediaUrl(cover?.url) || extractMediaUrl(cover)
  );
  const alt = String(
    (cover && typeof cover === "object" ? cover.alt || cover.caption : "") ||
      title ||
      ""
  ).trim();
  return { url, alt };
}

/** First <img src> from article HTML — used when coverImage.url was never saved. */
function extractFirstImageFromHtml(html) {
  const raw = String(html || "");
  if (!raw) return "";
  const match =
    raw.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i) ||
    raw.match(/<img\b[^>]*\bsrc\s*=\s*([^\s>]+)/i);
  if (!match) return "";
  return extractMediaUrl(match[1].replace(/^['"]|['"]$/g, ""));
}

/**
 * Admin RichTextEditor stores a full HTML document. SiteNextJS must render only
 * the article body (main#root / body) so links and markup survive.
 */
function extractBlogBodyHtml(html) {
  const raw = String(html || "").trim();
  if (!raw) return "";

  const stripNoise = (s) =>
    String(s || "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .trim();

  if (!/<!doctype|<html[\s>]/i.test(raw)) {
    return stripNoise(raw);
  }

  const mainMatch = raw.match(
    /<main\b[^>]*\bid=["']root["'][^>]*>([\s\S]*?)<\/main>/i
  );
  if (mainMatch) return stripNoise(mainMatch[1]);

  const bodyMatch = raw.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return stripNoise(bodyMatch[1].replace(/<\/?main\b[^>]*>/gi, ""));
  }

  return stripNoise(raw);
}

/**
 * Resolve cover for a blog document: coverImage field, then first body image.
 */
function resolveBlogCover(blog) {
  const fromField = normalizeCoverImage(blog?.coverImage, blog?.title);
  if (fromField.url) return fromField;
  const fromHtml = absolutizeMediaUrl(extractFirstImageFromHtml(blog?.content));
  if (fromHtml) {
    return {
      url: fromHtml,
      alt: String(blog?.title || "").trim(),
    };
  }
  return { url: "", alt: String(blog?.title || "").trim() };
}

/**
 * Normalize cover from create/update body (JSON object, string, or FormData flat keys).
 * Returns { url, alt } or null when no url.
 */
function normalizeCoverImageForSave(coverImage, body = {}) {
  let url = "";
  let alt = "";

  if (typeof coverImage === "string" && coverImage.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(coverImage);
      url = extractMediaUrl(parsed);
      alt = String(parsed?.alt || parsed?.caption || "").trim();
    } catch {
      url = extractMediaUrl(coverImage);
    }
  } else {
    url = extractMediaUrl(coverImage?.url) || extractMediaUrl(coverImage);
    if (coverImage && typeof coverImage === "object" && !Array.isArray(coverImage)) {
      alt = String(coverImage.alt || coverImage.caption || "").trim();
    }
  }

  // express-fileupload / FormData flat keys (extended:false does not nest them)
  if (!url) {
    url = extractMediaUrl(
      body["coverImage.url"] ||
        body.coverImageUrl ||
        body.cover_url ||
        body.coverUrl ||
        body.cover
    );
  }
  if (!alt) {
    alt = String(
      body["coverImage.alt"] || body.coverImageAlt || body.cover_alt || ""
    ).trim();
  }
  if (!url) return null;
  return { url, alt };
}

function estimateReadTime(htmlOrText = "") {
  const plain = String(htmlOrText || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plain ? plain.split(" ").length : 0;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function formatBlogDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function mapBlogToListItem(blog, authorById = new Map()) {
  const author = authorById.get(String(blog.authorId || "")) || null;
  const excerpt = String(blog.information || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  const cover = resolveBlogCover(blog);
  return {
    id: String(blog._id),
    blogId: String(blog._id),
    slug: String(blog.slug || "").trim(),
    link: blog.slug ? `/blog/${blog.slug}` : "#",
    title: String(blog.title || "").trim(),
    excerpt,
    description: excerpt,
    category: String(blog.type || "Article").trim(),
    date: formatBlogDate(blog.createdAt || blog.updatedAt),
    read: estimateReadTime(blog.content || blog.information || ""),
    readTime: estimateReadTime(blog.content || blog.information || ""),
    img: cover.url,
    image: cover.url,
    imageUrl: cover.url,
    coverImage: cover,
    authorName: String(author?.name || "").trim(),
  };
}

async function loadPublishedBlogs(projectId, { limit = 24, page = 1, search = "", type = "" } = {}) {
  const filter = {
    projectId,
    status: 1,
  };
  const typeNorm = String(type || "").trim();
  if (typeNorm && !/^all$/i.test(typeNorm)) {
    filter.type = { $regex: new RegExp(`^${escapeRegex(typeNorm)}$`, "i") };
  }
  const searchNorm = String(search || "").trim();
  if (searchNorm) {
    const rx = new RegExp(escapeRegex(searchNorm), "i");
    filter.$or = [{ title: rx }, { information: rx }, { content: rx }, { type: rx }];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(48, Math.max(1, Number(limit) || 9));
  const skip = (pageNum - 1) * limitNum;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Blog.countDocuments(filter),
  ]);

  const authorIds = [
    ...new Set(blogs.map((b) => String(b.authorId || "")).filter(Boolean)),
  ];
  const authors = authorIds.length
    ? await Author.find({ _id: { $in: authorIds } }).lean()
    : [];
  const authorById = new Map(authors.map((a) => [String(a._id), a]));
  return {
    blogs,
    authorById,
    page: pageNum,
    limit: limitNum,
    total,
    pages: Math.max(1, Math.ceil(total / limitNum) || 1),
  };
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function buildBlogListSectionData(projectId, opts = {}) {
  const { blogs, authorById, page, limit, total, pages } = await loadPublishedBlogs(
    projectId,
    { limit: opts.limit || 24, page: opts.page || 1, search: opts.search, type: opts.type }
  );
  const items = blogs.map((b) => mapBlogToListItem(b, authorById));
  return {
    data: {
      badgeText: "Latest Posts",
      title: "From Our Blog",
      subtitle: items.length
        ? "Practical guides and updates from our team."
        : "New articles are on the way — check back soon.",
      emptyStateMessage: "No blogs found",
      items,
      pagination: { page, limit, total, pages },
      contentRef: { source: "blog_collection" },
    },
    meta: {
      source: "database",
      blogIds: items.map((it) => it.blogId),
      pagination: { page, limit, total, pages },
    },
  };
}

async function resolveBlogDocument(projectId, { blogId, slug } = {}) {
  const sid = String(blogId || "").trim();
  const slugNorm = String(slug || "").trim().toLowerCase();
  let blog = null;
  if (sid) {
    blog = await Blog.findOne({ _id: sid, projectId }).lean();
  }
  if (!blog && slugNorm) {
    blog = await Blog.findOne({
      projectId,
      $or: [{ slug: slugNorm }, { oldSlugs: slugNorm }],
    }).lean();
  }
  if (!blog) {
    // Seed/template: newest published post
    blog = await Blog.findOne({ projectId, status: 1 })
      .sort({ createdAt: -1 })
      .lean();
  }
  if (!blog) return null;
  const author = blog.authorId
    ? await Author.findById(blog.authorId).lean()
    : null;
  return { blog, author };
}

async function buildBlogArticleHeroData(projectId, opts = {}) {
  const resolved = await resolveBlogDocument(projectId, opts);
  if (!resolved?.blog) {
    return {
      data: {
        title: "",
        category: "",
        authorName: "",
        date: "",
        readTime: "",
        coverImage: { url: "", alt: "" },
        contentRef: { source: "blog_document" },
      },
      meta: { source: "database", empty: true },
    };
  }
  const { blog, author } = resolved;
  const cover = resolveBlogCover(blog);
  return {
    data: {
      category: String(blog.type || "Article").trim(),
      badgeText: String(blog.type || "Article").trim(),
      title: String(blog.title || "").trim(),
      authorName: String(author?.name || "").trim(),
      author: String(author?.name || "").trim(),
      date: formatBlogDate(blog.createdAt || blog.updatedAt),
      readTime: estimateReadTime(blog.content || ""),
      read: estimateReadTime(blog.content || ""),
      coverImage: cover,
      imageUrl: cover.url,
      slug: String(blog.slug || "").trim(),
      blogId: String(blog._id),
      contentRef: { source: "blog_document", blogId: String(blog._id) },
    },
    meta: { source: "database", blogId: String(blog._id) },
  };
}

async function buildBlogContentData(projectId, opts = {}) {
  const resolved = await resolveBlogDocument(projectId, opts);
  if (!resolved?.blog) {
    return {
      data: { content: "", body: "", contentRef: { source: "blog_document" } },
      meta: { source: "database", empty: true },
    };
  }
  const { blog } = resolved;
  const html = extractBlogBodyHtml(String(blog.content || "").trim());
  return {
    data: {
      content: html,
      body: html,
      title: String(blog.title || "").trim(),
      information: String(blog.information || "").trim(),
      slug: String(blog.slug || "").trim(),
      blogId: String(blog._id),
      contentRef: { source: "blog_document", blogId: String(blog._id) },
    },
    meta: { source: "database", blogId: String(blog._id) },
  };
}

async function buildBlogAuthorData(projectId, opts = {}) {
  const resolved = await resolveBlogDocument(projectId, opts);
  const author = resolved?.author;
  if (!author) {
    return {
      data: {
        name: "",
        jobTitle: "",
        bio: "",
        image: "",
        links: [],
        contentRef: { source: "blog_author" },
      },
      meta: { source: "database", empty: true },
    };
  }
  return {
    data: {
      name: String(author.name || "").trim(),
      jobTitle: String(author.jobTitle || "").trim(),
      bio: String(author.bio || "").trim(),
      image: absolutizeMediaUrl(extractMediaUrl(author.image)),
      avatar: absolutizeMediaUrl(extractMediaUrl(author.image)),
      // Full link set from DB — never drop “other” / custom links
      links: normalizeAuthorLinks(author.links),
      authorId: String(author._id),
      contentRef: { source: "blog_author", authorId: String(author._id) },
    },
    meta: { source: "database", authorId: String(author._id) },
  };
}

async function buildBlogRelatedItems(projectId, opts = {}) {
  const current = await resolveBlogDocument(projectId, opts);
  const currentId = current?.blog?._id ? String(current.blog._id) : "";
  const currentType = String(current?.blog?.type || "").trim();
  const { blogs, authorById } = await loadPublishedBlogs(projectId, { limit: 24 });
  const others = blogs.filter((b) => String(b._id) !== currentId);
  const sameType = currentType
    ? others.filter((b) => String(b.type || "").toLowerCase() === currentType.toLowerCase())
    : [];
  const ordered = [
    ...sameType,
    ...others.filter((b) => !sameType.some((s) => String(s._id) === String(b._id))),
  ];
  return ordered.slice(0, Math.min(6, Number(opts.limit) || 6)).map((b) =>
    mapBlogToListItem(b, authorById)
  );
}

function formatRelativeCommentDate(value) {
  if (!value) return "";
  try {
    const then = new Date(value).getTime();
    if (!Number.isFinite(then)) return formatBlogDate(value);
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
    return formatBlogDate(value);
  } catch {
    return formatBlogDate(value);
  }
}

/**
 * Map Review docs → GenieBuild blogcomments `comments[]` shape:
 * { name, avatar, date, text, rating? }
 */
function mapReviewToComment(review) {
  const user = review?.user || {};
  const name =
    String(user.fullName || user.name || user.email || "Reader").trim() || "Reader";
  const avatar = String(user.image || review.image || "").trim();
  return {
    name,
    // Leave avatar empty for initials — UI paints theme accent (not hardcoded red)
    avatar: absolutizeMediaUrl(avatar) || "",
    date: formatRelativeCommentDate(review.createdAt || review.updatedAt),
    text: String(review.reviewText || "").trim(),
    rating: Number(review.rating) || undefined,
  };
}

async function buildBlogCommentsData(projectId, opts = {}) {
  const resolved = await resolveBlogDocument(projectId, opts);
  const blogId = resolved?.blog?._id ? String(resolved.blog._id) : "";
  if (!blogId) {
    return {
      data: {
        commentSectionTitle: "Join the Conversation",
        commentSectionSubtitle: "Share your thoughts — we'd love to hear from you.",
        ctaText: "Post Comment",
        comments: [],
        contentRef: { source: "blog_reviews" },
      },
      meta: { source: "database", empty: true },
    };
  }

  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 20));
  const reviews = await Review.find({ blog: blogId, status: 1 })
    .populate("user", "fullName email image type")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const comments = (reviews || [])
    .map(mapReviewToComment)
    .filter((c) => c.text);

  return {
    data: {
      commentSectionTitle: "Join the Conversation",
      commentSectionSubtitle: "Share your thoughts — we'd love to hear from you.",
      ctaText: "Post Comment",
      comments,
      blogId,
      contentRef: { source: "blog_reviews", blogId },
    },
    meta: {
      source: "database",
      blogId,
      count: comments.length,
    },
  };
}

async function listPublishedBlogCategories(projectId) {
  const types = await Blog.distinct("type", { projectId, status: 1 });
  const cleaned = (types || [])
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  return ["All", ...cleaned];
}

/**
 * FAQ Q&As for a published article — prefer keyword research faqKeywords
 * linked via articleId / searchIntentSlug / primaryKeyword.
 */
async function buildBlogFaqItems(projectId, blog) {
  try {
    const ProjectKeywords = require("../models/projectKeywords");
    const blogId = blog?._id;
    const slug = String(blog?.slug || "")
      .trim()
      .toLowerCase();
    const title = String(blog?.title || "")
      .trim()
      .toLowerCase();

    const or = [];
    if (blogId) or.push({ articleId: blogId });
    if (slug) {
      or.push({ searchIntentSlug: slug });
      or.push({ searchIntentSlug: `blog/${slug}` });
    }
    if (title) or.push({ primaryKeyword: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });

    let kw = null;
    if (or.length) {
      kw = await ProjectKeywords.findOne({
        projectId,
        status: "active",
        $or: or,
      })
        .select("faqKeywords primaryKeyword")
        .lean();
    }

    const questions = Array.isArray(kw?.faqKeywords) ? kw.faqKeywords : [];
    const items = questions
      .map((q) => {
        const question = String(q || "").trim();
        if (!question) return null;
        return {
          title: question,
          question,
          description: `Here's a clear answer about “${question.replace(/\?$/, "")}” related to ${String(blog?.title || "this article").trim()}.`,
          answer: `Here's a clear answer about “${question.replace(/\?$/, "")}” related to ${String(blog?.title || "this article").trim()}.`,
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    if (items.length) return items;

    // Fallback: a few article-scoped prompts so FAQ section isn't empty
    const topic = String(blog?.title || "this topic").trim();
    return [
      {
        title: `What is ${topic} about?`,
        question: `What is ${topic} about?`,
        description: String(blog?.information || "").trim() || `A practical guide covering ${topic}.`,
        answer: String(blog?.information || "").trim() || `A practical guide covering ${topic}.`,
      },
      {
        title: "Who is this article for?",
        question: "Who is this article for?",
        description: "Anyone looking for clear, actionable tips on this topic.",
        answer: "Anyone looking for clear, actionable tips on this topic.",
      },
      {
        title: "Where can I read more?",
        question: "Where can I read more?",
        description: "Browse related articles below or explore categories from the homepage.",
        answer: "Browse related articles below or explore categories from the homepage.",
      },
    ];
  } catch (err) {
    console.warn("[buildBlogFaqItems]", err?.message || err);
    return [];
  }
}

/**
 * Full live payload for GenieBuild blog detail sections (one request).
 * Keys match section.content shapes used by blogarticlehero / blogcontent /
 * blogauthor / blogrelated / blogcomments.
 */
async function buildPublishedBlogDetailPayload(projectId, opts = {}) {
  const slugNorm = String(opts.slug || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^blog\//, "");
  const blogId = String(opts.blogId || "").trim();

  let blog = null;
  if (blogId) {
    blog = await Blog.findOne({ _id: blogId, projectId, status: 1 }).lean();
  }
  if (!blog && slugNorm) {
    blog = await Blog.findOne({
      projectId,
      status: 1,
      $or: [{ slug: slugNorm }, { oldSlugs: slugNorm }],
    }).lean();
  }
  if (!blog) return null;

  const author = blog.authorId
    ? await Author.findById(blog.authorId).lean()
    : null;

  const resolvedOpts = { blogId: String(blog._id), slug: String(blog.slug || "") };
  const [heroWrap, contentWrap, authorWrap, relatedItems, commentsWrap, faqItems] =
    await Promise.all([
      buildBlogArticleHeroData(projectId, resolvedOpts),
      buildBlogContentData(projectId, resolvedOpts),
      buildBlogAuthorData(projectId, resolvedOpts),
      buildBlogRelatedItems(projectId, { ...resolvedOpts, limit: 3 }),
      buildBlogCommentsData(projectId, resolvedOpts),
      buildBlogFaqItems(projectId, blog),
    ]);

  // Always prefer the live Author document for identity + ALL links
  const authorData = { ...(authorWrap?.data || {}) };
  if (author) {
    authorData.name = String(author.name || authorData.name || "").trim();
    authorData.jobTitle = String(author.jobTitle || authorData.jobTitle || "").trim();
    authorData.bio = String(author.bio || authorData.bio || "").trim();
    authorData.image =
      absolutizeMediaUrl(extractMediaUrl(author.image)) ||
      String(authorData.image || authorData.avatar || "").trim();
    authorData.avatar = authorData.image;
    authorData.links = normalizeAuthorLinks(author.links);
    authorData.authorId = String(author._id);
    authorData.contentRef = { source: "blog_author", authorId: String(author._id) };
  }

  const seo = blog.seoMeta || {};
  return {
    blogId: String(blog._id),
    slug: String(blog.slug || "").trim(),
    link: blog.slug ? `/blog/${blog.slug}` : "#",
    currentSlug: String(blog.slug || "").trim(),
    /** GenieBuild section.content maps */
    hero: heroWrap?.data || {},
    content: contentWrap?.data || {},
    author: authorData,
    related: {
      badgeText: "Keep Reading",
      relatedTitle: "Related Articles",
      title: "Related Articles",
      items: relatedItems,
      contentRef: { source: "blog_collection", blogId: String(blog._id) },
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: `Common questions about ${String(blog.title || "this article").trim()}`,
      items: faqItems,
    },
    comments: commentsWrap?.data || { comments: [] },
    /** Flat convenience fields (same as hero/content) */
    title: String(blog.title || "").trim(),
    information: String(blog.information || "").trim(),
    type: String(blog.type || "").trim(),
    category: String(blog.type || "Article").trim(),
    coverImage: resolveBlogCover(blog),
    seo: {
      metaTitle: String(seo.metaTitle || blog.title || "").trim(),
      metaDescription: String(seo.metaDescription || blog.information || "").trim(),
      keywords: Array.isArray(seo.keywords) ? seo.keywords : [],
      tags: Array.isArray(seo.tags) ? seo.tags : [],
      seoMode: Number.isFinite(Number(seo.seoMode)) ? Number(seo.seoMode) : undefined,
      ogTitle: String(seo.ogTitle || seo.metaTitle || blog.title || "").trim(),
      ogDescription: String(
        seo.ogDescription || seo.metaDescription || blog.information || ""
      ).trim(),
      ogType: String(seo.ogType || "article").trim(),
      schemas: Array.isArray(seo.schemas) ? seo.schemas : [],
      structured_data: String(seo.structured_data || "").trim(),
    },
  };
}

module.exports = {
  estimateReadTime,
  formatBlogDate,
  extractMediaUrl,
  extractFirstImageFromHtml,
  extractBlogBodyHtml,
  absolutizeMediaUrl,
  normalizeCoverImage,
  normalizeCoverImageForSave,
  resolveBlogCover,
  mapBlogToListItem,
  mapReviewToComment,
  loadPublishedBlogs,
  resolveBlogDocument,
  buildBlogListSectionData,
  buildBlogArticleHeroData,
  buildBlogContentData,
  buildBlogAuthorData,
  buildBlogRelatedItems,
  buildBlogCommentsData,
  listPublishedBlogCategories,
  buildBlogFaqItems,
  buildPublishedBlogDetailPayload,
};
