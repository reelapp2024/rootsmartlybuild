const mongoose = require("mongoose");
const WebsitePage = require("../models/WebsitePage");
const PageSlugRedirect = require("../models/PageSlugRedirect");
const SiteHeaderFooter = require("../models/siteHeaderFooter");
const WebsiteDesignsData = require("../models/WebsiteDesignsData");
const SectionContent = require("../models/SectionContent");
const BusinessLocation = require("../models/businessLocation");
const UserProject = require("../models/userProjects");
const { isBulkProject } = require("./geoBusinessLocationSync");

const LINK_FIELD_KEYS = new Set([
  "link",
  "href",
  "url",
  "buttonLink",
  "ctaHref",
  "ctaLink",
  "buttonUrl",
]);

function normalizeProjectId(projectId) {
  const raw = String(projectId || "").trim();
  if (!raw) return null;
  if (mongoose.Types.ObjectId.isValid(raw)) {
    return new mongoose.Types.ObjectId(raw);
  }
  return raw;
}

function isHomepagePageDoc(page = {}) {
  const name = String(page?.name || "").toLowerCase().trim();
  const slug = normalizeSlugInput(page?.slug);
  return (
    name === "home" ||
    name === "homepage" ||
    slug === "" ||
    slug === "home"
  );
}

function normalizeSlugInput(value) {
  try {
    const raw = String(value ?? "").trim();
    const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
    const normalized = decoded.toLowerCase().replace(/^\/+|\/+$/g, "");
    return normalized === "home" ? "" : normalized;
  } catch {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "");
    return normalized === "home" ? "" : normalized;
  }
}

function toPublicPath(slug) {
  const normalized = normalizeSlugInput(slug);
  return normalized ? `/${normalized}` : "/";
}

function buildSlugLookupVariants(effectiveSlug = "", preferredPageType = "") {
  const slug = String(effectiveSlug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!slug) return ["", "/", "home"];
  const parts = slug.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || slug;
  const preferred = String(preferredPageType || "").toLowerCase().trim();

  if (preferred === "default" || preferred === "location") {
    return Array.from(new Set([slug, `/${slug}`]));
  }

  // Service pages: location-prefixed URLs must match the full slug, not the tail only.
  // e.g. india/himachal-pradesh/my-service ≠ my-service (parent location page).
  if (preferred === "service" && parts.length > 1) {
    return Array.from(new Set([slug, `/${slug}`]));
  }

  return Array.from(new Set([slug, `/${slug}`, last, `/${last}`]));
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreSlugPageCandidate(page = {}, requestedSlug = "") {
  const pageType = String(page?.pageType || "").toLowerCase().trim();
  const pageSlug = normalizeSlugInput(page?.slug);
  const requested = normalizeSlugInput(requestedSlug);
  const pageName = String(page?.name || "").toLowerCase();
  let score = 0;

  // Exact slug wins hard.
  if (requested && pageSlug && pageSlug === requested) {
    score += 10000;
  } else if (requested && pageSlug && pageSlug.endsWith(`/${requested}`)) {
    // Leaf URL `/punjab` → hierarchical DB slug `india/punjab`
    score += 5000;
    if (page?.locationId) score += 2000;
    if (pageName.startsWith("location-")) score += 1500;
  } else if (
    requested &&
    pageSlug &&
    requested.includes("/") &&
    requested.endsWith(`/${pageSlug}`)
  ) {
    // Full URL `/india/punjab` → leaf DB slug `punjab`
    score += 4500;
    if (page?.locationId) score += 2000;
    if (pageName.startsWith("location-")) score += 1500;
  }

  // Location landing pages are pageType "default" with locationId — prefer them over services
  // when resolving ambiguous area URLs.
  if (page?.locationId) score += 90;
  if (pageName.startsWith("location-")) score += 60;
  if (pageType === "service") score += 100;
  if (page?.serviceId) score += 40;
  if (pageType === "location") score += 20;
  if (pageType === "default") score += 5;
  return score;
}

function getPageSectionsFromDesignPage(page = {}) {
  if (Array.isArray(page?.sections)) return page.sections;
  if (Array.isArray(page?.componentIds)) return page.componentIds;
  return [];
}

function detectServiceTemplateSignals(page = {}) {
  const sections = getPageSectionsFromDesignPage(page);
  return sections.some((comp) => {
    const sectionType = String(comp?.sectionData?.type || "").toLowerCase().trim();
    const variantKey = String(comp?.variant_uniqueId || comp?.uniqueId || "")
      .toLowerCase()
      .trim();
    return (
      sectionType === "servicehero" ||
      sectionType === "aboutservice" ||
      variantKey.includes("servicehero") ||
      variantKey.includes("aboutservice")
    );
  });
}

async function pickBestSlugCandidate(rows = [], projectId = "", requestedSlug = "") {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  if (rows.length === 1) return rows[0];
  const normalizedRequested = normalizeSlugInput(requestedSlug);

  let serviceSignalPageIds = new Set();
  try {
    if (projectId) {
      const designData = await WebsiteDesignsData.findOne({ projectId })
        .select("pages.pageId pages.sections pages.componentIds")
        .lean();
      const byPageId = new Map(
        (designData?.pages || []).map((p) => [
          String(p?.pageId?._id || p?.pageId || ""),
          p,
        ])
      );
      serviceSignalPageIds = new Set(
        Array.from(byPageId.entries())
          .filter(([, p]) => detectServiceTemplateSignals(p))
          .map(([id]) => id)
      );
    }
  } catch (_e) {
    // Soft-fail: fallback to metadata-only score.
  }

  return rows
    .slice()
    .sort((a, b) => {
      const aSignal = serviceSignalPageIds.has(String(a?._id || "")) ? 80 : 0;
      const bSignal = serviceSignalPageIds.has(String(b?._id || "")) ? 80 : 0;
      const scoreDiff =
        scoreSlugPageCandidate(b, normalizedRequested) +
        bSignal -
        (scoreSlugPageCandidate(a, normalizedRequested) + aSignal);
      if (scoreDiff !== 0) return scoreDiff;
      return String(a?._id || "").localeCompare(String(b?._id || ""));
    })[0];
}

async function findLivePageBySlug({
  projectId = "",
  effectiveSlug = "",
  select = "",
  preferredPageType = "",
}) {
  const pid = normalizeProjectId(projectId);
  const preferred = String(preferredPageType || "").toLowerCase().trim();
  const normalizedEffective = normalizeSlugInput(effectiveSlug);
  const slugVariants = buildSlugLookupVariants(effectiveSlug, preferred);

  const filterByPreferred = (rows = []) => {
    if (!preferred) return rows;
    if (preferred === "service") {
      return rows.filter(
        (p) => String(p?.pageType || "").toLowerCase().trim() === "service"
      );
    }
    // Location pages are stored as pageType "default" + locationId (not pageType "location").
    if (preferred === "location" || preferred === "default") {
      const locationRows = rows.filter(
        (p) =>
          p?.locationId ||
          String(p?.name || "").toLowerCase().startsWith("location-")
      );
      if (preferred === "location" && locationRows.length) return locationRows;
      if (preferred === "default") {
        return rows.filter(
          (p) => String(p?.pageType || "").toLowerCase().trim() === "default"
        );
      }
      return locationRows.length ? locationRows : rows;
    }
    return rows;
  };

  // 1) Prefer exact slug match (location-prefixed service URLs).
  if (normalizedEffective) {
    const exactRows = await WebsitePage.find({
      projectId: pid,
      slug: { $in: [normalizedEffective, `/${normalizedEffective}`] },
    })
      .select(select)
      .lean();
    const exactFiltered = filterByPreferred(exactRows);
    const exactPick = await pickBestSlugCandidate(
      exactFiltered.length ? exactFiltered : exactRows,
      projectId,
      normalizedEffective
    );
    if (exactPick) return exactPick;
  }

  const baseInProject = await WebsitePage.find({
    projectId: pid,
    slug: { $in: slugVariants },
  })
    .select(select)
    .lean();
  const inProject = filterByPreferred(baseInProject);
  let pageDoc = await pickBestSlugCandidate(
    inProject.length ? inProject : baseInProject,
    projectId,
    normalizedEffective
  );
  if (pageDoc) return pageDoc;

  // 2b) Leaf ↔ hierarchical reverse match (e.g. "punjab" ↔ "india/punjab").
  // Nav/areas often link `/punjab` while bulk sync stores `parent/child` paths.
  if (normalizedEffective && pid) {
    const leaf = normalizedEffective.includes("/")
      ? normalizedEffective.split("/").filter(Boolean).pop()
      : normalizedEffective;
    const escapedLeaf = escapeRegex(leaf || "");
    if (escapedLeaf) {
      const hierarchicalQuery = {
        projectId: pid,
        $or: [
          { slug: { $regex: `/${escapedLeaf}$`, $options: "i" } },
          { slug: { $regex: `^${escapedLeaf}$`, $options: "i" } },
          { slug: { $regex: `^/${escapedLeaf}$`, $options: "i" } },
        ],
      };
      // When the request is already hierarchical, also try matching the full path suffix.
      if (normalizedEffective.includes("/")) {
        hierarchicalQuery.$or.push({
          slug: {
            $regex: `^${escapeRegex(normalizedEffective)}$`,
            $options: "i",
          },
        });
      }
      const hierarchicalRows = await WebsitePage.find(hierarchicalQuery)
        .select(select)
        .lean();
      const hierarchicalFiltered = filterByPreferred(hierarchicalRows);
      pageDoc = await pickBestSlugCandidate(
        hierarchicalFiltered.length ? hierarchicalFiltered : hierarchicalRows,
        projectId,
        normalizedEffective
      );
      if (pageDoc) return pageDoc;
    }
  }

  const baseGlobalMatches = await WebsitePage.find({
    slug: { $in: slugVariants },
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .select(select)
    .lean();
  const globalMatches = filterByPreferred(baseGlobalMatches);
  return pickBestSlugCandidate(
    globalMatches.length ? globalMatches : baseGlobalMatches,
    projectId,
    normalizedEffective
  );
}

async function findHomepage(projectId, select = "") {
  const pid = normalizeProjectId(projectId);
  if (!pid) return null;

  const homepage = await WebsitePage.findOne({
    projectId: pid,
    $or: [
      { name: { $in: ["home", "homepage"] } },
      { slug: { $in: ["", "/", "home"] } },
      { pageType: "default", slug: { $in: ["", null] } },
    ],
  })
    .sort({ createdAt: 1 })
    .select(select)
    .lean();
  if (homepage) return homepage;

  const project = await UserProject.findById(pid).select("projectType").lean();
  if (isBulkProject(project)) {
    const globalHome = await WebsitePage.findOne({
      projectId: pid,
      name: "home",
      pageType: "default",
      $or: [{ locationId: null }, { locationId: { $exists: false } }],
    })
      .sort({ createdAt: 1 })
      .select(select)
      .lean();
    if (globalHome) return globalHome;
  }

  // Business: homepage often carries primary parent locationId (root "/").
  if (!isBulkProject(project)) {
    const primaryParent = await BusinessLocation.findOne({
      projectId: pid,
      status: 1,
      type: 0,
    })
      .sort({ createdAt: 1, _id: 1 })
      .select("_id")
      .lean();
    if (primaryParent?._id) {
      const parentHome = await WebsitePage.findOne({
        projectId: pid,
        locationId: primaryParent._id,
        pageType: "default",
      })
        .sort({ createdAt: 1 })
        .select(select)
        .lean();
      if (parentHome) return parentHome;
    }
  }

  const defaultPage = await WebsitePage.findOne({ projectId: pid, pageType: "default" })
    .sort({ createdAt: 1 })
    .select(select)
    .lean();
  if (defaultPage && isHomepagePageDoc(defaultPage)) return defaultPage;

  // Design row may reference the real home WebsitePage even when slug/name differ.
  const design = await WebsiteDesignsData.findOne({ projectId: pid })
    .select("pages.pageId")
    .lean();
  if (Array.isArray(design?.pages) && design.pages.length) {
    for (const entry of design.pages) {
      const pageRef = entry?.pageId?._id || entry?.pageId;
      if (!pageRef) continue;
      const doc = await WebsitePage.findOne({ _id: pageRef, projectId: pid })
        .select(select)
        .lean();
      if (doc && isHomepagePageDoc(doc)) return doc;
    }
    const firstRef = design.pages[0]?.pageId?._id || design.pages[0]?.pageId;
    if (firstRef) {
      const firstDoc = await WebsitePage.findOne({ _id: firstRef, projectId: pid })
        .select(select)
        .lean();
      if (firstDoc) return firstDoc;
    }
  }

  if (defaultPage) return defaultPage;

  return WebsitePage.findOne({ projectId: pid })
    .sort({ createdAt: 1 })
    .select(select)
    .lean();
}

/**
 * Create a root homepage row when the project exists but no "/" page was ever saved.
 */
async function ensureHomepageForProject(projectId, select = "") {
  const existing = await findHomepage(projectId, select);
  if (existing) return existing;

  const pid = normalizeProjectId(projectId);
  if (!pid) return null;

  const project = await UserProject.findById(pid)
    .select("projectType projectName")
    .lean();
  if (!project) return null;

  const bulk = isBulkProject(project);
  const primaryParent = bulk
    ? null
    : await BusinessLocation.findOne({
        projectId: pid,
        status: 1,
        type: 0,
      })
        .sort({ createdAt: 1, _id: 1 })
        .select("_id areaName")
        .lean();

  const displayName = primaryParent?.areaName
    ? `Home — ${String(primaryParent.areaName).trim()}`
    : "Home";

  const created = await WebsitePage.create({
    projectId: pid,
    name: "home",
    slug: "home",
    displayName,
    pageType: "default",
    ...(primaryParent?._id && !bulk ? { locationId: primaryParent._id } : {}),
  });

  try {
    let designData = await WebsiteDesignsData.findOne({ projectId: pid });
    if (!designData) {
      designData = new WebsiteDesignsData({
        projectId: pid,
        userId: project.userId || project.user,
        schemaVersion: 2,
        pages: [],
      });
    }
    const exists = (designData.pages || []).some(
      (p) => String(p?.pageId?._id || p?.pageId || "") === String(created._id)
    );
    if (!exists) {
      designData.pages.push({
        pageId: created._id,
        pageStyles: {},
        sectionLayout: [],
        sections: [],
      });
      await designData.save();
    }
  } catch (err) {
    console.warn("[pageSlugService] ensureHomepageForProject design sync failed:", err.message);
  }

  if (select) {
    return WebsitePage.findById(created._id).select(select).lean();
  }
  return created.toObject ? created.toObject() : created;
}

function normalizeExcludePageId(excludePageId) {
  if (excludePageId == null || excludePageId === "") return null;
  const raw = String(excludePageId).trim();
  if (!raw) return null;
  if (mongoose.isValidObjectId(raw)) {
    return new mongoose.Types.ObjectId(raw);
  }
  return raw;
}

async function assertSlugAvailable(projectId, slug, excludePageId = null, options = {}) {
  const normalized = normalizeSlugInput(slug);
  if (!normalized) return { ok: true, slug: normalized };

  const pageType = String(options?.pageType || "").toLowerCase().trim();
  const slugVariants = buildSlugLookupVariants(normalized, pageType);
  const excludeId = normalizeExcludePageId(excludePageId);
  const excludeIdStr = excludeId ? String(excludeId) : null;

  if (excludeId) {
    const currentPage = await WebsitePage.findOne({ _id: excludeId, projectId })
      .select("_id slug")
      .lean();
    if (currentPage) {
      const currentSlug = normalizeSlugInput(currentPage.slug);
      if (currentSlug === normalized) {
        return { ok: true, slug: normalized };
      }
    }
  }

  const candidates = await WebsitePage.find({
    projectId,
    slug: { $in: slugVariants },
  })
    .select("_id slug displayName pageType")
    .lean();

  const conflict = candidates.find((row) => {
    if (!excludeIdStr) return true;
    return String(row?._id || "") !== excludeIdStr;
  });

  if (conflict) {
    return {
      ok: false,
      message: `Slug "/${normalized}" is already used by page "${conflict.displayName || conflict.slug}".`,
    };
  }

  return { ok: true, slug: normalized };
}

function menuUrlMatchesSlug(url, slug) {
  const normalized = normalizeSlugInput(slug);
  if (!normalized) return false;
  const value = String(url || "").trim();
  if (!value || value === "#") return false;
  const pathOnly = value.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const comparable = pathOnly.startsWith("/") ? pathOnly.slice(1) : pathOnly;
  return comparable === normalized || comparable.endsWith(`/${normalized}`);
}

function updateMenuItemsForSlugChange(menuItems, pageId, oldSlug, newSlug) {
  if (!Array.isArray(menuItems)) return menuItems;

  return menuItems.map((item) => {
    const updatedItem = { ...item };
    const linkedToPage =
      item.pageId && item.pageId.toString() === pageId.toString();
    const urlMatchesOld =
      oldSlug && menuUrlMatchesSlug(item.url, oldSlug);

    if (linkedToPage || urlMatchesOld) {
      updatedItem.url = toPublicPath(newSlug);
      if (linkedToPage) updatedItem.pageId = item.pageId;
    }

    if (
      Array.isArray(item.children) &&
      item.children.length > 0
    ) {
      updatedItem.children = updateMenuItemsForSlugChange(
        item.children,
        pageId,
        oldSlug,
        newSlug
      );
    }

    return updatedItem;
  });
}

async function updateHeaderFooterMenuUrls(pageId, oldSlug, newSlug) {
  const headersFooters = await SiteHeaderFooter.find({
    $or: [{ "menu.pageId": pageId }, { "menu.children.pageId": pageId }],
  });

  let updatedCount = 0;
  for (const headerFooter of headersFooters) {
    const updatedMenu = updateMenuItemsForSlugChange(
      headerFooter.menu,
      pageId,
      oldSlug,
      newSlug
    );
    if (JSON.stringify(headerFooter.menu) !== JSON.stringify(updatedMenu)) {
      headerFooter.menu = updatedMenu;
      await headerFooter.save();
      updatedCount += 1;
    }
  }

  return updatedCount;
}

function replaceStoredLinkValue(value, oldSlug, newSlug) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "#") return value;

  const oldPath = toPublicPath(oldSlug);
  const newPath = toPublicPath(newSlug);
  const oldNorm = oldPath.replace(/\/+$/, "") || "/";
  const newNorm = newPath.replace(/\/+$/, "") || "/";

  if (trimmed === oldPath || trimmed === oldNorm || trimmed === oldSlug) {
    return newNorm;
  }

  if (trimmed.startsWith(`${oldPath}/`)) {
    return `${newNorm}${trimmed.slice(oldPath.length)}`;
  }
  if (trimmed.startsWith(`${oldNorm}/`)) {
    return `${newNorm}${trimmed.slice(oldNorm.length)}`;
  }

  return value;
}

const MAX_LINK_WALK_DEPTH = 48;
const SKIP_LINK_WALK_KEYS = new Set([
  "__parent",
  "__parentArray",
  "$__",
  "$__parent",
  "ownerDocument",
  "parent",
  "schema",
]);

function shouldSkipLinkWalkKey(key) {
  if (!key || typeof key !== "string") return true;
  if (SKIP_LINK_WALK_KEYS.has(key)) return true;
  if (key.startsWith("$")) return true;
  return false;
}

function isPlainTraversableValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value !== "object") return false;
  if (value instanceof Date) return false;
  if (typeof value.toHexString === "function") return false;
  if (Buffer.isBuffer(value)) return false;
  return true;
}

function cloneDesignPagesForLinkWalk(pages) {
  try {
    return JSON.parse(JSON.stringify(pages));
  } catch (error) {
    console.error("[pageSlugService] Failed to clone design pages for link walk:", error);
    return null;
  }
}

function walkAndUpdateStoredLinks(node, oldSlug, newSlug, visited, depth, changedRef) {
  if (depth > MAX_LINK_WALK_DEPTH) return node;

  if (Array.isArray(node)) {
    return node.map((item) =>
      walkAndUpdateStoredLinks(item, oldSlug, newSlug, visited, depth + 1, changedRef)
    );
  }

  if (!isPlainTraversableValue(node)) return node;
  if (visited.has(node)) return node;
  visited.add(node);

  const next = {};
  for (const key of Object.keys(node)) {
    if (shouldSkipLinkWalkKey(key)) continue;

    const value = node[key];
    if (LINK_FIELD_KEYS.has(key) && typeof value === "string") {
      const replaced = replaceStoredLinkValue(value, oldSlug, newSlug);
      next[key] = replaced;
      if (replaced !== value) changedRef.changed = true;
      continue;
    }

    if (isPlainTraversableValue(value)) {
      next[key] = walkAndUpdateStoredLinks(
        value,
        oldSlug,
        newSlug,
        visited,
        depth + 1,
        changedRef
      );
    } else {
      next[key] = value;
    }
  }

  return next;
}

async function updateStoredInternalLinks(projectId, oldSlug, newSlug) {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return 0;

  const designData = await WebsiteDesignsData.findOne({ projectId })
    .select("pages")
    .lean();
  if (!Array.isArray(designData?.pages) || !designData.pages.length) return 0;

  const plainPages = cloneDesignPagesForLinkWalk(designData.pages);
  if (!plainPages) return 0;

  const changedRef = { changed: false };
  const visited = new WeakSet();
  const pages = plainPages.map((page) =>
    walkAndUpdateStoredLinks(page, oldSlug, newSlug, visited, 0, changedRef)
  );

  if (!changedRef.changed) return 0;

  await WebsiteDesignsData.updateOne({ projectId }, { $set: { pages } });
  return 1;
}

async function recordSlugRedirect(projectId, pageId, oldSlug) {
  const fromSlug = normalizeSlugInput(oldSlug);
  if (!fromSlug) return null;

  return PageSlugRedirect.findOneAndUpdate(
    { projectId, fromSlug },
    {
      $set: {
        projectId,
        fromSlug,
        pageId,
        statusCode: 301,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function applyWebsitePageSlugChange({
  projectId,
  pageId,
  oldSlug,
  newSlug,
  pageType = "",
}) {
  const normalizedOld = normalizeSlugInput(oldSlug);
  const normalizedNew = normalizeSlugInput(newSlug);
  if (!normalizedNew || normalizedOld === normalizedNew) {
    return { changed: false };
  }

  const availability = await assertSlugAvailable(projectId, normalizedNew, pageId, {
    pageType,
  });
  if (!availability.ok) {
    const error = new Error(availability.message);
    error.statusCode = 409;
    throw error;
  }

  await PageSlugRedirect.deleteOne({ projectId, fromSlug: normalizedNew });
  await recordSlugRedirect(projectId, pageId, normalizedOld);

  const page = await WebsitePage.findOneAndUpdate(
    { _id: pageId, projectId },
    { $set: { slug: normalizedNew } },
    { new: true, runValidators: false }
  );
  if (!page) {
    const error = new Error("Page not found");
    error.statusCode = 404;
    throw error;
  }

  const runSoftSlugSideEffect = async (label, fn) => {
    try {
      await fn();
    } catch (error) {
      console.error(`[pageSlugService] ${label} failed (slug already saved):`, error);
    }
  };

  await runSoftSlugSideEffect("header/footer menu URL sync", () =>
    updateHeaderFooterMenuUrls(pageId, normalizedOld, normalizedNew)
  );
  await runSoftSlugSideEffect("design data internal link sync", () =>
    updateStoredInternalLinks(projectId, normalizedOld, normalizedNew)
  );
  await runSoftSlugSideEffect("services grid link sync", () =>
    refreshServiceGridLinksForPage(projectId, pageId)
  );
  await runSoftSlugSideEffect("SEO canonical sync", async () => {
    const { syncSeoCanonicalOnSlugChange } = require("./pageSeoService");
    await syncSeoCanonicalOnSlugChange(projectId, pageId, normalizedOld, normalizedNew);
  });

  return {
    changed: true,
    page,
    oldSlug: normalizedOld,
    newSlug: normalizedNew,
  };
}

async function resolveSlugRoute({
  projectId,
  slug,
  preferredPageType = "",
  select = "_id projectId pageType name slug locationId serviceId displayName",
}) {
  const pid = normalizeProjectId(projectId);
  const effectiveSlug = normalizeSlugInput(slug);

  if (!effectiveSlug) {
    let homepage = await findHomepage(pid, select);
    if (!homepage) {
      homepage = await ensureHomepageForProject(pid, select);
    }
    if (homepage) {
      return {
        kind: "live",
        page: homepage,
        canonicalPath: toPublicPath(homepage.slug),
      };
    }
    return { kind: "not_found" };
  }

  const livePage = await findLivePageBySlug({
    projectId: pid,
    effectiveSlug,
    select,
    preferredPageType,
  });
  if (livePage) {
    return {
      kind: "live",
      page: livePage,
      canonicalPath: toPublicPath(livePage.slug),
    };
  }

  const redirectSlugCandidates = buildSlugLookupVariants(effectiveSlug)
    .map((value) => normalizeSlugInput(value))
    .filter(Boolean);

  const redirectDoc = await PageSlugRedirect.findOne({
    projectId: pid,
    fromSlug: { $in: redirectSlugCandidates },
  })
    .select("pageId statusCode fromSlug")
    .lean();

  if (!redirectDoc?.pageId) {
    return { kind: "not_found" };
  }

  const page = await WebsitePage.findOne({
    _id: redirectDoc.pageId,
    projectId: pid,
  })
    .select(select)
    .lean();

  if (!page) {
    return { kind: "not_found" };
  }

  const canonicalPath = toPublicPath(page.slug);
  const requestedPath = toPublicPath(effectiveSlug);
  if (canonicalPath === requestedPath) {
    return { kind: "live", page, canonicalPath };
  }

  return {
    kind: "redirect",
    page,
    canonicalPath,
    redirect: {
      from: requestedPath,
      to: canonicalPath,
      statusCode: redirectDoc.statusCode || 301,
    },
  };
}

async function getPageSlugHistory(projectId, pageId) {
  const page = await WebsitePage.findOne({ _id: pageId, projectId })
    .select("_id slug displayName updatedAt")
    .lean();
  if (!page) return null;

  const redirects = await PageSlugRedirect.find({ projectId, pageId })
    .sort({ createdAt: -1 })
    .select("fromSlug statusCode createdAt")
    .lean();

  const currentSlug = normalizeSlugInput(page.slug);
  const history = [
    {
      slug: currentSlug,
      path: toPublicPath(currentSlug),
      status: "live",
      statusCode: 200,
      isCurrent: true,
      createdAt: page.updatedAt,
    },
    ...redirects.map((row) => ({
      slug: row.fromSlug,
      path: toPublicPath(row.fromSlug),
      status: "redirect",
      statusCode: row.statusCode || 301,
      isCurrent: false,
      createdAt: row.createdAt,
    })),
  ];

  return {
    pageId: String(page._id),
    displayName: page.displayName,
    currentSlug,
    currentPath: toPublicPath(currentSlug),
    history,
  };
}

async function updateExistingWebsitePage({
  projectId,
  pageDoc,
  slug,
  displayName,
  description,
}) {
  const pageId = pageDoc._id;
  let page = null;
  let slugChanged = false;
  let oldSlug = pageDoc.slug;

  if (slug !== undefined && slug !== null) {
    const normalizedSlug = normalizeSlugInput(slug);
    if (normalizedSlug !== normalizeSlugInput(pageDoc.slug)) {
      const result = await applyWebsitePageSlugChange({
        projectId,
        pageId,
        oldSlug: pageDoc.slug,
        newSlug: normalizedSlug,
        pageType: pageDoc.pageType,
      });
      page = result.page;
      slugChanged = true;
      oldSlug = result.oldSlug;
    }
  }

  const $set = {};
  const nextDisplayName = displayName ? displayName.trim() : "";
  if (nextDisplayName && nextDisplayName !== String(pageDoc.displayName || "").trim()) {
    $set.displayName = nextDisplayName;
  }
  if (description !== undefined) {
    const nextDescription = description ? description.trim() : "";
    if (nextDescription !== String(pageDoc.description || "").trim()) {
      $set.description = nextDescription;
    }
  }

  if (Object.keys($set).length > 0) {
    page = await WebsitePage.findOneAndUpdate(
      { _id: pageId, projectId },
      { $set },
      { new: true, runValidators: false }
    );
  }

  if (!page) {
    page = await WebsitePage.findOne({ _id: pageId, projectId });
  }

  if (!page) {
    const error = new Error("Page not found");
    error.statusCode = 404;
    throw error;
  }

  return { page, slugChanged, oldSlug };
}

function normalizeScopeLocationId(locationId) {
  const normalized =
    locationId != null && String(locationId).trim() !== ""
      ? String(locationId).trim()
      : "";
  return normalized;
}

function buildServicePageLinkMap(websitePages = []) {
  const byServiceAndLocation = new Map();
  (websitePages || []).forEach((page) => {
    if (!page?.serviceId) return;
    if (page.isPublished === false) return;
    const pageType = String(page?.pageType || "").toLowerCase().trim();
    // Service detail pages are pageType "service". Also accept legacy rows that
    // carry serviceId even if pageType was left as default.
    if (pageType === "default" && !page.serviceId) return;
    if (pageType && pageType !== "service" && pageType !== "default") return;

    const slug = normalizeSlugInput(page.slug);
    if (!slug) return;
    const serviceId = String(page.serviceId?._id || page.serviceId || "").trim();
    if (!serviceId) return;
    const locKey = normalizeScopeLocationId(
      page.locationId?._id || page.locationId || ""
    );
    const entry = {
      pageId: String(page._id),
      link: toPublicPath(slug),
      locationId: locKey || null,
      slug,
      pageType: pageType || "service",
    };
    const key = `${serviceId}::${locKey}`;
    const existing = byServiceAndLocation.get(key);
    if (!existing) {
      byServiceAndLocation.set(key, entry);
      return;
    }
    // Prefer explicit pageType=service over legacy default+serviceId rows.
    if (pageType === "service" && existing.pageType !== "service") {
      byServiceAndLocation.set(key, entry);
    }
  });
  return byServiceAndLocation;
}

function resolveServicePageLinkForScope(serviceId, scopeLocationId, byServiceAndLocation) {
  const sid = String(serviceId || "").trim();
  if (!sid || !byServiceAndLocation?.size) return null;

  const loc = normalizeScopeLocationId(scopeLocationId);
  if (loc) {
    const scoped = byServiceAndLocation.get(`${sid}::${loc}`);
    if (scoped) return scoped;
  }

  // Home / global service page (no locationId).
  const globalScoped = byServiceAndLocation.get(`${sid}::`);
  if (globalScoped) return globalScoped;

  // Fallback: any WebsitePage for this serviceId in the project.
  // Service slugs live on WebsitePage (projectId + serviceId + locationId); exact
  // location match can miss when the grid is scoped to a parent/sibling location.
  for (const [key, value] of byServiceAndLocation.entries()) {
    if (key === `${sid}::` || key.startsWith(`${sid}::`)) return value;
  }
  return null;
}

function isUsableServiceLink(value) {
  const s = String(value || "").trim();
  return Boolean(s) && s !== "#" && s.toLowerCase() !== "/services" && s.toLowerCase() !== "services";
}

function attachServicePageLinksToGridItems(items, websitePages = [], scopeLocationId = null) {
  if (!Array.isArray(items) || !items.length) return items;
  const byServiceAndLocation = buildServicePageLinkMap(websitePages);
  if (!byServiceAndLocation.size) return items;

  const defaultScope = normalizeScopeLocationId(scopeLocationId);

  return items.map((item) => {
    const serviceId = String(item?.serviceId?._id || item?.serviceId || "").trim();
    if (!serviceId) return item;

    const itemScope =
      normalizeScopeLocationId(item?.locationId?._id || item?.locationId) ||
      defaultScope;
    const resolved = resolveServicePageLinkForScope(
      serviceId,
      itemScope,
      byServiceAndLocation
    );

    if (!resolved) {
      return item;
    }

    return {
      ...item,
      pageId: resolved.pageId,
      link: resolved.link,
      href: resolved.link,
      locationId: resolved.locationId ?? itemScope ?? item?.locationId ?? null,
      slug: resolved.slug || item.slug,
      serviceId,
    };
  });
}

async function refreshServiceGridLinksForPage(projectId, pageId) {
  const page = await WebsitePage.findOne({ _id: pageId, projectId })
    .select("_id serviceId slug pageType")
    .lean();
  if (!page?.serviceId) return 0;

  const link = toPublicPath(page.slug);
  const serviceId = String(page.serviceId);
  const rows = await SectionContent.find({
    projectId,
    sectionId: { $in: ["services", "servicesgrid"] },
    isDeleted: { $ne: true },
  }).select("_id data");

  let updated = 0;
  for (const row of rows) {
    const items = Array.isArray(row?.data?.items) ? row.data.items : [];
    if (!items.length) continue;

    let changed = false;
    const nextItems = items.map((item) => {
      if (String(item?.serviceId || "") !== serviceId) return item;
      const currentLink = String(item?.link || item?.href || "").trim();
      if (
        currentLink === link &&
        String(item?.pageId || "") === String(pageId)
      ) {
        return item;
      }
      changed = true;
      return {
        ...item,
        pageId: String(pageId),
        link,
        href: link,
      };
    });

    if (changed) {
      row.data = { ...(row.data || {}), items: nextItems };
      row.markModified("data");
      await row.save();
      updated += 1;
    }
  }

  return updated;
}

module.exports = {
  normalizeSlugInput,
  toPublicPath,
  buildSlugLookupVariants,
  findLivePageBySlug,
  findHomepage,
  ensureHomepageForProject,
  normalizeProjectId,
  isHomepagePageDoc,
  assertSlugAvailable,
  applyWebsitePageSlugChange,
  updateExistingWebsitePage,
  resolveSlugRoute,
  getPageSlugHistory,
  updateHeaderFooterMenuUrls,
  updateMenuItemsForSlugChange,
  attachServicePageLinksToGridItems,
  refreshServiceGridLinksForPage,
};
