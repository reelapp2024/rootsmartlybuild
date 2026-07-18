/**
 * Blog section dynamics — Blog/Author collections are source of truth.
 * OpenAI only fills chrome (hero, search, related headings, comments framing).
 */

const Blog = require("../models/blogs");
const Author = require("../models/authors");

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
    img: String(blog.coverImage?.url || "").trim(),
    image: String(blog.coverImage?.url || "").trim(),
    imageUrl: String(blog.coverImage?.url || "").trim(),
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
    blog = await Blog.findOne({ projectId, slug: slugNorm }).lean();
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
      coverImage: {
        url: String(blog.coverImage?.url || "").trim(),
        alt: String(blog.coverImage?.alt || blog.title || "").trim(),
      },
      imageUrl: String(blog.coverImage?.url || "").trim(),
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
  const html = String(blog.content || "").trim();
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
      image: String(author.image || "").trim(),
      links: Array.isArray(author.links) ? author.links : [],
      authorId: String(author._id),
      contentRef: { source: "blog_author", authorId: String(author._id) },
    },
    meta: { source: "database", authorId: String(author._id) },
  };
}

async function buildBlogRelatedItems(projectId, opts = {}) {
  const current = await resolveBlogDocument(projectId, opts);
  const currentId = current?.blog?._id ? String(current.blog._id) : "";
  const { blogs, authorById } = await loadPublishedBlogs(projectId, { limit: 12 });
  const related = blogs
    .filter((b) => String(b._id) !== currentId)
    .slice(0, 6)
    .map((b) => mapBlogToListItem(b, authorById));
  return related;
}

module.exports = {
  estimateReadTime,
  formatBlogDate,
  mapBlogToListItem,
  loadPublishedBlogs,
  resolveBlogDocument,
  buildBlogListSectionData,
  buildBlogArticleHeroData,
  buildBlogContentData,
  buildBlogAuthorData,
  buildBlogRelatedItems,
};
