/**
 * Content-site browse taxonomy (projectType = 2).
 *
 * Catalog (wizard only): PinterestCategory → PinterestNiche
 * Site tree (browseable):
 *   Category  = root ProjectCluster (parentClusterId = null)
 *   Subcategory = child ProjectCluster (parentClusterId = parent)
 *   Article   = ProjectKeyword under that cluster → Blog (when generated)
 *
 * Live cards prefer published Blog title/slug/excerpt when articleId is linked,
 * so /blog/{slug} resolves to a real post.
 */

const mongoose = require('mongoose');
const ProjectClusters = require('../models/projectClusters');
const ProjectKeywords = require('../models/projectKeywords');
const UserProject = require('../models/userProjects');
const WebsitePage = require('../models/WebsitePage');
const WebsiteDesignsData = require('../models/WebsiteDesignsData');
const Blog = require('../models/blogs');

const LOG = '[ContentTaxonomy]';

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function articleHref(kw, blog = null) {
  const slug = String(
    blog?.slug ||
      kw.blogSlug ||
      kw.metadata?.blogSlug ||
      kw.searchIntentSlug ||
      slugify(kw.primaryKeyword) ||
      'article'
  ).trim();
  return `/blog/${slug}`;
}

function categoryHref(cluster) {
  const slug = String(cluster.clusterSlug || slugify(cluster.clusterName) || 'category').trim();
  return `/category/${slug}`;
}

function resolveBlogForKeyword(kw, blogById, blogByTitle) {
  if (!kw) return null;
  if (kw.articleId && blogById.has(String(kw.articleId))) {
    return blogById.get(String(kw.articleId));
  }
  const titleKey = String(kw.primaryKeyword || '')
    .toLowerCase()
    .trim();
  if (titleKey && blogByTitle.has(titleKey)) return blogByTitle.get(titleKey);
  return null;
}

function toArticleCard(kw, cluster = null, blog = null) {
  const title = String(blog?.title || kw.primaryKeyword || 'Article').trim();
  const href = articleHref(kw, blog);
  const excerpt = String(
    blog?.information ||
      (kw.relatedKeywords || []).slice(0, 2).join(' · ') ||
      kw.keywordType ||
      'Article'
  ).trim();
  const image =
    (blog?.coverImage && (blog.coverImage.url || blog.coverImage)) ||
    kw.metadata?.coverImage ||
    '';
  const faqKeywords = Array.isArray(kw.faqKeywords)
    ? kw.faqKeywords.map((q) => String(q || '').trim()).filter(Boolean)
    : [];

  return {
    id: String(kw._id),
    title,
    name: title,
    description: excerpt,
    slug: String(blog?.slug || kw.searchIntentSlug || slugify(kw.primaryKeyword)).trim(),
    link: href,
    href,
    image: typeof image === 'string' ? image : '',
    keywordType: kw.keywordType || 'main',
    clusterId: kw.clusterId ? String(kw.clusterId) : null,
    clusterName: cluster?.clusterName || null,
    clusterSlug: cluster?.clusterSlug || null,
    articleCreated: Boolean(kw.articleCreated || blog),
    published: Boolean(blog),
    blogId: blog?._id ? String(blog._id) : kw.articleId ? String(kw.articleId) : null,
    faqKeywords,
    volume: kw.volume || null,
    trend: kw.trend || null,
  };
}

function toCategoryCard(cluster, { articleCount = 0, childCount = 0 } = {}) {
  const hasChildren = childCount > 0;
  return {
    id: String(cluster._id),
    title: cluster.clusterName,
    name: cluster.clusterName,
    slug: cluster.clusterSlug,
    link: categoryHref(cluster),
    href: categoryHref(cluster),
    description: hasChildren
      ? `${childCount} subcategor${childCount === 1 ? 'y' : 'ies'}`
      : `${articleCount} article${articleCount === 1 ? '' : 's'}`,
    articleCount,
    childCount,
    hasChildren,
    parentClusterId: cluster.parentClusterId ? String(cluster.parentClusterId) : null,
    nodeType: cluster.parentClusterId ? 'subcategory' : 'category',
  };
}

function toBlogOnlyCard(blog, cluster = null) {
  const title = String(blog.title || 'Article').trim();
  const slug = String(blog.slug || slugify(title)).trim();
  const href = `/blog/${slug}`;
  const image =
    (blog.coverImage && (blog.coverImage.url || blog.coverImage)) || '';
  return {
    id: `blog_${blog._id}`,
    title,
    name: title,
    description: String(blog.information || '').trim() || 'Article',
    slug,
    link: href,
    href,
    image: typeof image === 'string' ? image : '',
    keywordType: 'main',
    clusterId: cluster?._id ? String(cluster._id) : null,
    clusterName: cluster?.clusterName || null,
    clusterSlug: cluster?.clusterSlug || null,
    articleCreated: true,
    published: true,
    blogId: String(blog._id),
  };
}

/**
 * Full tree for a content project.
 */
async function getContentTaxonomy(projectId) {
  if (!projectId || !mongoose.isValidObjectId(projectId)) {
    return { categories: [], featuredArticles: [], trendingArticles: [], allArticles: [] };
  }

  const [clusters, keywords, blogs] = await Promise.all([
    ProjectClusters.find({ projectId, status: 'active' }).sort({ createdAt: 1 }).lean(),
    ProjectKeywords.find({ projectId, status: 'active', clusterId: { $ne: null } })
      .sort({ createdAt: 1 })
      .lean(),
    Blog.find({ projectId, status: 1 })
      .select('_id title slug information coverImage createdAt')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const blogById = new Map((blogs || []).map((b) => [String(b._id), b]));
  const blogByTitle = new Map(
    (blogs || []).map((b) => [String(b.title || '').toLowerCase().trim(), b])
  );
  const linkedBlogIds = new Set();

  const byClusterId = new Map();
  for (const kw of keywords) {
    const cid = String(kw.clusterId);
    if (!byClusterId.has(cid)) byClusterId.set(cid, []);
    byClusterId.get(cid).push(kw);
  }

  const childrenByParent = new Map();
  const roots = [];
  for (const c of clusters) {
    if (c.parentClusterId) {
      const pid = String(c.parentClusterId);
      if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
      childrenByParent.get(pid).push(c);
    } else {
      roots.push(c);
    }
  }

  const clusterById = new Map(clusters.map((c) => [String(c._id), c]));

  const cardForKw = (kw, cluster) => {
    const blog = resolveBlogForKeyword(kw, blogById, blogByTitle);
    if (blog?._id) linkedBlogIds.add(String(blog._id));
    return toArticleCard(kw, cluster, blog);
  };

  const categories = roots.map((root) => {
    const children = childrenByParent.get(String(root._id)) || [];
    const ownKws = byClusterId.get(String(root._id)) || [];
    const childCards = children.map((ch) => {
      const chKws = byClusterId.get(String(ch._id)) || [];
      return {
        ...toCategoryCard(ch, { articleCount: chKws.length, childCount: 0 }),
        articles: chKws.map((kw) => cardForKw(kw, ch)),
        children: [],
      };
    });

    const childArticleCount = childCards.reduce((n, ch) => n + (ch.articles?.length || 0), 0);
    const ownArticles = ownKws.map((kw) => cardForKw(kw, root));
    // Leaf category: own articles. Parent with children: keep direct articles too if any,
    // and expose aggregated list for grids that need "all under this silo".
    const aggregatedArticles = children.length
      ? [...ownArticles, ...childCards.flatMap((ch) => ch.articles || [])]
      : ownArticles;
    const articleCount = children.length
      ? childArticleCount + ownArticles.length
      : ownArticles.length;

    return {
      ...toCategoryCard(root, {
        articleCount,
        childCount: children.length,
      }),
      children: childCards,
      articles: children.length ? ownArticles : ownArticles,
      aggregatedArticles,
    };
  });

  const allArticles = keywords.map((kw) =>
    cardForKw(kw, clusterById.get(String(kw.clusterId)) || null)
  );

  // Orphan published blogs (not linked to a keyword) still appear on the site
  for (const blog of blogs || []) {
    if (linkedBlogIds.has(String(blog._id))) continue;
    allArticles.push(toBlogOnlyCard(blog, null));
  }

  const featuredArticles = [];
  const trendingArticles = [];
  for (const root of roots) {
    const order = Array.isArray(root.publishOrder) ? root.publishOrder : [];
    const own = byClusterId.get(String(root._id)) || [];
    const byNorm = new Map(
      own.map((k) => [String(k.primaryKeyword || '').toLowerCase().trim(), k])
    );
    for (const phrase of order) {
      const hit = byNorm.get(String(phrase).toLowerCase().trim());
      if (hit) featuredArticles.push(cardForKw(hit, root));
    }
    for (const ch of childrenByParent.get(String(root._id)) || []) {
      const chOwn = byClusterId.get(String(ch._id)) || [];
      for (const phrase of ch.publishOrder || []) {
        const hit = chOwn.find(
          (k) =>
            String(k.primaryKeyword).toLowerCase().trim() ===
            String(phrase).toLowerCase().trim()
        );
        if (hit) featuredArticles.push(cardForKw(hit, ch));
      }
    }
  }
  if (!featuredArticles.length) {
    // Prefer published blogs first
    const published = allArticles.filter((a) => a.published);
    featuredArticles.push(...(published.length ? published : allArticles).slice(0, 6));
  }
  const featuredIds = new Set(featuredArticles.map((a) => a.id));
  for (const a of allArticles) {
    if (!featuredIds.has(a.id)) trendingArticles.push(a);
  }
  if (!trendingArticles.length) {
    trendingArticles.push(...featuredArticles.slice().reverse());
  }

  return {
    categories,
    featuredArticles: featuredArticles.slice(0, 8),
    trendingArticles: trendingArticles.slice(0, 8),
    allArticles,
    publishedBlogCount: (blogs || []).length,
    /** Flat FAQ question pool from keyword research (for page FAQ sections) */
    faqPool: collectFaqPool(keywords),
  };
}

function collectFaqPool(keywords = []) {
  const seen = new Set();
  const out = [];
  for (const kw of keywords || []) {
    for (const q of kw.faqKeywords || []) {
      const question = String(q || '').trim();
      if (!question) continue;
      const key = question.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        question,
        primaryKeyword: kw.primaryKeyword || '',
        clusterId: kw.clusterId ? String(kw.clusterId) : null,
      });
    }
  }
  return out;
}

/**
 * Resolve which category node a page slug maps to (e.g. /category/air-fryer).
 */
function matchCategoryFromSlug(taxonomy, pageSlug = '', pageName = '') {
  const raw = String(pageSlug || '')
    .replace(/^\/+/, '')
    .toLowerCase();
  const parts = raw.split('/').filter(Boolean);
  let catSlug = '';
  if (parts[0] === 'category' && parts[1]) catSlug = parts[1];
  else if (parts.length === 1 && String(pageName || '').startsWith('category__')) {
    catSlug = parts[0];
  } else if (String(pageName || '').startsWith('category__')) {
    catSlug = String(pageName).replace(/^category__/, '');
  }

  if (!catSlug) return null;

  for (const cat of taxonomy.categories || []) {
    if (cat.slug === catSlug) return { node: cat, parent: null };
    for (const child of cat.children || []) {
      if (child.slug === catSlug) return { node: child, parent: cat };
    }
  }
  return null;
}

function mapArticleItems(list = []) {
  return (list || []).map((a) => ({
    title: a.title,
    name: a.title,
    description: a.description,
    link: a.link || a.href,
    href: a.href || a.link,
    image: a.image || '',
    tag: a.clusterName || undefined,
    published: Boolean(a.published),
  }));
}

function mapCategoryItems(list = []) {
  return (list || []).map((c) => ({
    title: c.title,
    name: c.name || c.title,
    description: c.description,
    link: c.link || c.href,
    href: c.href || c.link,
    slug: c.slug,
  }));
}

function mapFaqItems(questions = [], pageLabel = '') {
  return (questions || [])
    .map((q) => {
      const question =
        typeof q === 'string'
          ? q.trim()
          : String(q?.question || q?.title || '').trim();
      if (!question) return null;
      const answer = String(
        q?.answer ||
          q?.description ||
          `Here's a clear, helpful answer about "${question.replace(/\?$/, '')}" for this ${pageLabel || 'page'}. Explore our guides for more detail.`
      ).trim();
      return {
        title: question,
        question,
        description: answer,
        answer,
        link: '#',
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

function resolvePageFaqQuestions(taxonomy, matched, pageMeta = {}) {
  const pageName = String(pageMeta?.name || '')
    .toLowerCase()
    .trim();
  const pageType = String(pageMeta?.pageType || '')
    .toLowerCase()
    .trim();
  const pool = Array.isArray(taxonomy.faqPool) ? taxonomy.faqPool : [];

  const fromArticles = (articles = []) => {
    const out = [];
    for (const a of articles) {
      for (const q of a.faqKeywords || []) {
        if (q) out.push({ question: String(q), answer: '' });
      }
    }
    return out;
  };

  if (pageName === 'contact' || pageType === 'contact') {
    return [
      {
        question: 'How do I get in touch?',
        answer: 'Use the contact form on this page — we read every message.',
      },
      {
        question: 'How long until I hear back?',
        answer: 'We usually reply within 1–2 business days.',
      },
      {
        question: 'Can I suggest a topic or collaboration?',
        answer: 'Yes — tell us your idea in the message field and we will follow up.',
      },
      {
        question: 'Where can I find your latest articles?',
        answer: 'Visit the Blog page for our newest guides and ideas.',
      },
      ...pool.slice(0, 4),
    ];
  }

  if (matched?.node) {
    const localArticles =
      matched.node.aggregatedArticles || matched.node.articles || [];
    const local = fromArticles(localArticles);
    if (local.length) return local;
    const cid = String(matched.node.id || '');
    const scoped = pool.filter((p) => !cid || String(p.clusterId || '') === cid);
    if (scoped.length) return scoped;
  }

  if (pageName === 'blog' || pageType === 'blog') {
    return [
      {
        question: 'How often do you publish new articles?',
        answer: 'We publish regularly — check Featured and Latest posts on this page.',
      },
      {
        question: 'Can I filter posts by category?',
        answer: 'Yes — use the category filters above to jump into a topic silo.',
      },
      ...pool.slice(0, 6),
    ];
  }

  if (pageName === 'about' || pageType === 'about') {
    return [
      {
        question: 'Who writes for this site?',
        answer: 'Our editors and contributors focus on practical, niche-first guides.',
      },
      {
        question: 'What is this site about?',
        answer: 'We publish helpful content and inspiration for this niche community.',
      },
      ...pool.slice(0, 5),
    ];
  }

  // Homepage / default / home
  if (
    !pageName ||
    pageName === 'home' ||
    pageName === 'homepage' ||
    pageType === 'home' ||
    pageType === 'homepage' ||
    pageType === 'default' ||
    pageType === ''
  ) {
    const fromFeat = fromArticles(taxonomy.featuredArticles || []);
    if (fromFeat.length) return fromFeat;
    if (pool.length) return pool;
    return fromArticles(taxonomy.allArticles || []);
  }

  if (pool.length) return pool;
  return fromArticles(taxonomy.allArticles || taxonomy.featuredArticles || []);
}

function patchSectionLiveContent(sec, contentPatch = {}) {
  const prevData =
    sec?.data && typeof sec.data === 'object' && !Array.isArray(sec.data) ? sec.data : {};
  const prevContent =
    sec?.content && typeof sec.content === 'object' && !Array.isArray(sec.content)
      ? sec.content
      : {};
  const merged = {
    ...prevData,
    ...prevContent,
    ...contentPatch,
  };
  return {
    ...sec,
    content: merged,
    data: merged,
  };
}

/**
 * Inject live taxonomy into GenieBuild section content for content websites.
 * Writes BOTH `content` and `data` so SiteNext hydration shows live cards (not AI stubs).
 */
function applyContentTaxonomyToSections(sections = [], taxonomy, pageMeta = {}) {
  if (!Array.isArray(sections) || !sections.length || !taxonomy) return sections;

  const pageSlug = String(pageMeta?.slug || '');
  const pageName = String(pageMeta?.name || '');
  const matched = matchCategoryFromSlug(taxonomy, pageSlug, pageName);
  const categoryNodes = mapCategoryItems(taxonomy.categories || []);
  const pageLabel =
    matched?.node?.title || pageName || String(pageMeta?.pageType || 'page');

  return sections.map((sec) => {
    const type = String(sec?.type || '').toLowerCase().replace(/[_-]/g, '');
    const patch = {};

    if (
      type === 'categoriesgrid' ||
      type === 'categoryfilter' ||
      type === 'relatedcategories'
    ) {
      if (matched?.node?.hasChildren && (matched.node.children || []).length) {
        patch.items = mapCategoryItems(matched.node.children);
        patch.title = 'Browse subcategories';
      } else if (matched?.parent) {
        const siblings = (matched.parent.children || []).filter(
          (c) => c.slug !== matched.node.slug
        );
        const related = [
          {
            title: matched.parent.title,
            name: matched.parent.name,
            description: 'Parent category',
            link: matched.parent.link,
            href: matched.parent.href,
            slug: matched.parent.slug,
          },
          ...mapCategoryItems(siblings),
        ];
        patch.items = related.length ? related : categoryNodes;
        patch.title = 'Related categories';
      } else if (categoryNodes.length) {
        patch.items = categoryNodes;
        patch.title = 'Popular categories';
      }
    }

    if (
      type === 'featuredposts' ||
      type === 'trendingpins' ||
      type === 'popularposts' ||
      type === 'seasonalspotlight' ||
      type === 'relatedposts'
    ) {
      let pool =
        type === 'trendingpins' || type === 'popularposts'
          ? taxonomy.trendingArticles
          : taxonomy.featuredArticles;

      if (type === 'relatedposts' && matched?.node) {
        const local =
          matched.node.aggregatedArticles || matched.node.articles || [];
        pool = local.length ? local : taxonomy.allArticles;
      }

      if (pool?.length) {
        const published = pool.filter((a) => a.published);
        patch.items = mapArticleItems(published.length ? published : pool);
        if (type === 'featuredposts') patch.title = 'Featured posts';
        if (type === 'popularposts') patch.title = 'Popular posts';
        if (type === 'trendingpins') patch.title = 'Trending now';
      }
    }

    if (type === 'postgrid') {
      if (matched?.node) {
        if (matched.node.hasChildren && matched.node.children?.length) {
          patch.items = mapCategoryItems(matched.node.children);
          patch.gridMode = 'subcategories';
          patch.title = 'Subcategories';
          patch.articles = mapArticleItems(
            matched.node.aggregatedArticles || matched.node.articles || []
          );
        } else if ((matched.node.articles || []).length) {
          const arts = matched.node.articles;
          const published = arts.filter((a) => a.published);
          patch.items = mapArticleItems(published.length ? published : arts);
          patch.gridMode = 'articles';
          patch.title = 'Articles in this category';
        } else if ((matched.node.aggregatedArticles || []).length) {
          patch.items = mapArticleItems(matched.node.aggregatedArticles);
          patch.gridMode = 'articles';
        }
      } else if (taxonomy.allArticles?.length) {
        const arts = taxonomy.allArticles;
        const published = arts.filter((a) => a.published);
        patch.items = mapArticleItems(published.length ? published : arts);
        patch.gridMode = 'articles';
        patch.title = 'Latest posts';
      }
    }

    if (type === 'categoryhero' && matched?.node) {
      patch.title = matched.node.title;
      patch.subtitle = matched.node.hasChildren
        ? 'Pick a subcategory to explore articles'
        : `${matched.node.articleCount || matched.node.articles?.length || 0} articles`;
      patch.badgeText = matched.parent ? matched.parent.title : 'Category';
    }

    if (type === 'faq') {
      const faqQs = resolvePageFaqQuestions(taxonomy, matched, pageMeta);
      const faqItems = mapFaqItems(faqQs, pageLabel);
      if (faqItems.length) {
        patch.items = faqItems;
        patch.title = 'Frequently Asked Questions';
        patch.subtitle = matched?.node
          ? `Common questions about ${matched.node.title}`
          : `Answers for ${pageLabel}`;
      }
    }

    if (!Object.keys(patch).length) return sec;
    return patchSectionLiveContent(sec, patch);
  });
}

/**
 * Ensure a live WebsitePage exists for each category / subcategory cluster.
 * Uses the category template sections from design when available.
 */
async function syncContentCategoryPages({ projectId, userId = null } = {}) {
  if (!projectId) return { created: 0, updated: 0 };

  const project = await UserProject.findById(projectId).select('projectType').lean();
  if (!project || Number(project.projectType) !== 2) {
    return { created: 0, updated: 0, skipped: true };
  }

  const taxonomy = await getContentTaxonomy(projectId);
  const nodes = [];
  for (const cat of taxonomy.categories || []) {
    nodes.push(cat);
    for (const child of cat.children || []) nodes.push(child);
  }
  if (!nodes.length) {
    console.warn(`${LOG} syncContentCategoryPages: no category nodes for`, String(projectId));
    return { created: 0, updated: 0 };
  }

  const design = await WebsiteDesignsData.findOne({ projectId });
  const templatePageDoc = await WebsitePage.findOne({
    projectId,
    $or: [{ name: 'category' }, { slug: /^category$/i }],
  }).lean();

  let templateSections = null;
  if (design && templatePageDoc) {
    const designPage = (design.pages || []).find(
      (p) => String(p.pageId) === String(templatePageDoc._id)
    );
    if (designPage?.sections?.length) templateSections = designPage.sections;
  }

  let created = 0;
  let updated = 0;

  for (const node of nodes) {
    const pageName = `category__${node.slug}`;
    const slug = String(node.link || `/category/${node.slug}`).replace(/^\//, '');
    let page = await WebsitePage.findOne({ projectId, name: pageName });
    if (!page) {
      try {
        page = await WebsitePage.create({
          projectId,
          name: pageName,
          slug,
          displayName: node.title,
          description: `${node.title} category`,
          pageType: 'category',
          isPublished: true,
          componentIds: [],
        });
        created += 1;
      } catch (err) {
        console.warn(`${LOG} category page create failed:`, pageName, err?.message || err);
        page = await WebsitePage.create({
          projectId,
          name: pageName,
          slug,
          displayName: node.title,
          description: `${node.title} category`,
          pageType: 'default',
          isPublished: true,
          componentIds: [],
        });
        created += 1;
      }
    } else {
      page.slug = slug;
      page.displayName = node.title;
      page.isPublished = true;
      try {
        page.pageType = 'category';
        await page.save();
      } catch (_) {
        page.pageType = 'default';
        await page.save();
      }
      updated += 1;
    }

    if (design && templateSections) {
      const pages = Array.isArray(design.pages) ? [...design.pages] : [];
      const idx = pages.findIndex((p) => String(p.pageId) === String(page._id));
      const cloned = templateSections.map((s, order) => {
        const sectionData = s.sectionData ? { ...s.sectionData } : {};
        if (sectionData.content) sectionData.content = { ...sectionData.content };
        const t = String(sectionData.type || '').toLowerCase().replace(/[_-]/g, '');
        if (t === 'categoryhero') {
          sectionData.content = {
            ...(sectionData.content || {}),
            title: node.title,
            subtitle: node.description,
          };
        }
        return {
          ...s,
          order,
          sectionData: {
            ...sectionData,
            id: sectionData.id || `sec-${t || 'section'}-${order}`,
          },
        };
      });
      const entry = {
        pageId: page._id,
        pageStyles: { renderer: 'geniebuild' },
        sections: cloned,
        sectionLayout: cloned.map((s, order) => ({
          order,
          sectionId: s.sectionId || s.sectionData?.id,
        })),
      };
      if (idx >= 0) pages[idx] = entry;
      else pages.push(entry);
      design.pages = pages;
    }
  }

  if (design) await design.save();

  console.log(`${LOG} syncContentCategoryPages`, {
    projectId: String(projectId),
    created,
    updated,
    nodes: nodes.length,
  });

  return { created, updated, nodes: nodes.length };
}

module.exports = {
  getContentTaxonomy,
  applyContentTaxonomyToSections,
  syncContentCategoryPages,
  matchCategoryFromSlug,
  articleHref,
  categoryHref,
  slugify,
};
