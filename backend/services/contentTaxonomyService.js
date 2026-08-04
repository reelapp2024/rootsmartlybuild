/**
 * Content-site browse taxonomy (projectType = 2).
 *
 * Catalog (wizard only): PinterestCategory → PinterestNiche
 * Site tree (browseable):
 *   Category  = root ProjectCluster (parentClusterId = null)
 *   Subcategory = child ProjectCluster (parentClusterId = parent)
 *   Article   = ProjectKeyword under that cluster (later → Blog)
 *
 * Starter sites ship 1 root category + 4–5 articles; users expand later.
 */

const mongoose = require('mongoose');
const ProjectClusters = require('../models/projectClusters');
const ProjectKeywords = require('../models/projectKeywords');
const UserProject = require('../models/userProjects');
const WebsitePage = require('../models/WebsitePage');
const WebsiteDesignsData = require('../models/WebsiteDesignsData');

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

function articleHref(kw) {
  const slug = String(kw.searchIntentSlug || slugify(kw.primaryKeyword) || 'article').trim();
  return `/blog/${slug}`;
}

function categoryHref(cluster) {
  const slug = String(cluster.clusterSlug || slugify(cluster.clusterName) || 'category').trim();
  return `/category/${slug}`;
}

function toArticleCard(kw, cluster = null) {
  return {
    id: String(kw._id),
    title: kw.primaryKeyword,
    name: kw.primaryKeyword,
    description: (kw.relatedKeywords || []).slice(0, 2).join(' · ') || kw.keywordType || 'Article',
    slug: kw.searchIntentSlug || slugify(kw.primaryKeyword),
    link: articleHref(kw),
    href: articleHref(kw),
    keywordType: kw.keywordType || 'main',
    clusterId: kw.clusterId ? String(kw.clusterId) : null,
    clusterName: cluster?.clusterName || null,
    clusterSlug: cluster?.clusterSlug || null,
    articleCreated: Boolean(kw.articleCreated),
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

/**
 * Full tree for a content project.
 */
async function getContentTaxonomy(projectId) {
  if (!projectId || !mongoose.isValidObjectId(projectId)) {
    return { categories: [], featuredArticles: [], trendingArticles: [], allArticles: [] };
  }

  const clusters = await ProjectClusters.find({ projectId, status: 'active' })
    .sort({ createdAt: 1 })
    .lean();
  const keywords = await ProjectKeywords.find({ projectId, status: 'active', clusterId: { $ne: null } })
    .sort({ createdAt: 1 })
    .lean();

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

  const categories = roots.map((root) => {
    const children = childrenByParent.get(String(root._id)) || [];
    const ownKws = byClusterId.get(String(root._id)) || [];
    const childCards = children.map((ch) => {
      const chKws = byClusterId.get(String(ch._id)) || [];
      return {
        ...toCategoryCard(ch, { articleCount: chKws.length, childCount: 0 }),
        articles: chKws.map((kw) => toArticleCard(kw, ch)),
      };
    });

    // Articles on a parent with children = only direct; leaf uses own keywords.
    // If parent has children, aggregate count includes children articles for the card blurb.
    const childArticleCount = childCards.reduce((n, ch) => n + (ch.articles?.length || 0), 0);
    const articleCount = children.length ? childArticleCount : ownKws.length;

    return {
      ...toCategoryCard(root, {
        articleCount,
        childCount: children.length,
      }),
      children: childCards,
      articles: children.length ? [] : ownKws.map((kw) => toArticleCard(kw, root)),
    };
  });

  const allArticles = keywords.map((kw) =>
    toArticleCard(kw, clusterById.get(String(kw.clusterId)) || null)
  );

  // Featured = pillar-first order across clusters; trending = rest / by volume heuristic
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
      if (hit) featuredArticles.push(toArticleCard(hit, root));
    }
    for (const ch of childrenByParent.get(String(root._id)) || []) {
      const chOwn = byClusterId.get(String(ch._id)) || [];
      for (const phrase of ch.publishOrder || []) {
        const hit = chOwn.find(
          (k) => String(k.primaryKeyword).toLowerCase().trim() === String(phrase).toLowerCase().trim()
        );
        if (hit) featuredArticles.push(toArticleCard(hit, ch));
      }
    }
  }
  if (!featuredArticles.length) {
    featuredArticles.push(...allArticles.slice(0, 5));
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
    featuredArticles: featuredArticles.slice(0, 6),
    trendingArticles: trendingArticles.slice(0, 6),
    allArticles,
  };
}

/**
 * Resolve which category node a page slug maps to (e.g. /category/air-fryer).
 */
function matchCategoryFromSlug(taxonomy, pageSlug = '', pageName = '') {
  const raw = String(pageSlug || '')
    .replace(/^\/+/, '')
    .toLowerCase();
  const parts = raw.split('/').filter(Boolean);
  // /category/{slug} or category/{slug}
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

/**
 * Inject live taxonomy into GenieBuild section content for content websites.
 */
function applyContentTaxonomyToSections(sections = [], taxonomy, pageMeta = {}) {
  if (!Array.isArray(sections) || !sections.length || !taxonomy) return sections;

  const pageSlug = String(pageMeta?.slug || '');
  const pageName = String(pageMeta?.name || '');
  const matched = matchCategoryFromSlug(taxonomy, pageSlug, pageName);
  const categoryNodes = (taxonomy.categories || []).map((c) => ({
    title: c.title,
    name: c.name,
    description: c.description,
    link: c.link,
    href: c.href,
    slug: c.slug,
  }));

  return sections.map((sec) => {
    const type = String(sec?.type || '').toLowerCase().replace(/[_-]/g, '');
    const content = { ...(sec.content || {}) };

    // Homepage / blog: category grids & filters
    if (
      type === 'categoriesgrid' ||
      type === 'categoryfilter' ||
      type === 'relatedcategories'
    ) {
      if (matched?.node?.hasChildren && (matched.node.children || []).length) {
        content.items = matched.node.children.map((c) => ({
          title: c.title,
          name: c.name,
          description: c.description,
          link: c.link,
          href: c.href,
        }));
        content.title = content.title || 'Browse subcategories';
      } else if (categoryNodes.length) {
        content.items = categoryNodes;
        if (!content.title || /browse|vibes|categories/i.test(String(content.title))) {
          content.title = content.title || 'Popular categories';
        }
      }
    }

    // Featured / trending / popular / post grids
    if (
      type === 'featuredposts' ||
      type === 'trendingpins' ||
      type === 'popularposts' ||
      type === 'seasonalspotlight'
    ) {
      const pool =
        type === 'trendingpins' || type === 'popularposts'
          ? taxonomy.trendingArticles
          : taxonomy.featuredArticles;
      if (pool?.length) {
        content.items = pool.map((a) => ({
          title: a.title,
          name: a.title,
          description: a.description,
          link: a.link,
          href: a.link,
          tag: a.clusterName || undefined,
        }));
      }
    }

    if (type === 'postgrid') {
      if (matched?.node) {
        if (matched.node.hasChildren && matched.node.children?.length) {
          // Parent category page → subcategory grid
          content.items = matched.node.children.map((c) => ({
            title: c.title,
            name: c.name,
            description: c.description,
            link: c.link,
            href: c.link,
          }));
          content.gridMode = 'subcategories';
          content.title = content.title || 'Subcategories';
        } else if (matched.node.articles?.length) {
          content.items = matched.node.articles.map((a) => ({
            title: a.title,
            name: a.title,
            description: a.description,
            link: a.link,
            href: a.link,
          }));
          content.gridMode = 'articles';
          content.title = content.title || 'Articles in this category';
        }
      } else if (taxonomy.allArticles?.length) {
        content.items = taxonomy.allArticles.map((a) => ({
          title: a.title,
          name: a.title,
          description: a.description,
          link: a.link,
          href: a.link,
        }));
      }
    }

    if (type === 'categoryhero' && matched?.node) {
      content.title = matched.node.title;
      content.subtitle = matched.node.hasChildren
        ? 'Pick a subcategory to explore articles'
        : `${matched.node.articleCount || matched.node.articles?.length || 0} starter articles`;
      content.badgeText = matched.parent ? matched.parent.title : 'Category';
    }

    return { ...sec, content };
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
  if (!nodes.length) return { created: 0, updated: 0 };

  const design = await WebsiteDesignsData.findOne({ projectId });
  const templatePageDoc = await WebsitePage.findOne({
    projectId,
    $or: [{ name: 'category' }, { slug: /category/i }],
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
    } else {
      page.slug = slug;
      page.displayName = node.title;
      page.isPublished = true;
      page.pageType = 'category';
      await page.save();
      updated += 1;
    }

    if (design && templateSections) {
      const pages = Array.isArray(design.pages) ? [...design.pages] : [];
      const idx = pages.findIndex((p) => String(p.pageId) === String(page._id));
      const cloned = templateSections.map((s, order) => {
        const sectionData = s.sectionData ? { ...s.sectionData } : {};
        if (sectionData.content) sectionData.content = { ...sectionData.content };
        // Stamp hero title for this category
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
  categoryHref,
  articleHref,
};
