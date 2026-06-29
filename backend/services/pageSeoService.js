/**

 * Per-page SEO on WebsitePage.seoSettings (single active entry in array).

 * Page lookup respects PageSlugRedirect (301) via resolveSlugRoute.

 */



const WebsitePage = require("../models/WebsitePage");
const UserProject = require("../models/userProjects");
const Service = require("../models/service");
const BusinessLocation = require("../models/businessLocation");

const { buildPageSeoPrompt } = require("../sections/seoprompts/pageSeoPrompt");

const { fetchJSONFromOpenAI } = require("../additional/openaiHelpers");

const {

  toPublicPath,

  normalizeSlugInput,

  resolveSlugRoute,

} = require("./pageSlugService");



const PAGE_SEO_SELECT =

  "_id projectId pageType name slug displayName serviceId locationId seoSettings";



const DEFAULT_SEO_ENTRY = {

  meta_title: "",

  meta_description: "",

  meta_keywords: "",

  meta_image: "",

  canonical_url: "",

  og_title: "",

  og_description: "",

  og_image: "",

  og_type: "website",

  og_site_name: "",

  twitter_card: "summary_large_image",

  twitter_site: "",

  robots: "index,follow",

  favicon: "",

  structured_data: "",

  language: "en",

};



function pickSeoFields(raw = {}) {

  const out = { ...DEFAULT_SEO_ENTRY };

  const map = {

    meta_title: raw.meta_title ?? raw.title ?? raw.og_title,

    meta_description: raw.meta_description ?? raw.description ?? raw.og_description,

    meta_keywords: raw.meta_keywords ?? raw.keywords,

    meta_image: raw.meta_image ?? raw.og_image ?? raw.ogImage,

    canonical_url: raw.canonical_url ?? raw.canonicalUrl,

    og_title: raw.og_title ?? raw.ogTitle,

    og_description: raw.og_description ?? raw.ogDescription,

    og_image: raw.og_image ?? raw.ogImage ?? raw.meta_image,

    og_type: raw.og_type ?? raw.ogType,

    og_site_name: raw.og_site_name ?? raw.ogSiteName,

    twitter_card: raw.twitter_card ?? raw.twitterCard,

    twitter_site: raw.twitter_site ?? raw.twitterSite,

    robots: raw.robots,

    favicon: raw.favicon,

    structured_data: raw.structured_data ?? raw.structuredData,

    language: raw.language,

  };

  Object.entries(map).forEach(([key, val]) => {

    if (val !== undefined && val !== null) out[key] = String(val).trim();

  });

  return out;

}



function getActiveSeoFromPage(page) {

  if (!page) return null;

  const arr = Array.isArray(page.seoSettings) ? page.seoSettings : [];

  if (!arr.length) return null;

  return pickSeoFields(arr[0]);

}



/** Always expose canonical for the page's current live slug (post-301 target). */

function withLiveCanonical(entry, pageDoc, projectBaseUrl = "") {

  if (!entry || !pageDoc) return entry;

  const liveCanonical = pageUrlFromPage(pageDoc, projectBaseUrl);

  return { ...pickSeoFields(entry), canonical_url: liveCanonical };

}



function seoEntryToLegacyApi(entry, pageDoc = null, projectBaseUrl = "") {

  const e = pageDoc

    ? withLiveCanonical(entry, pageDoc, projectBaseUrl)

    : pickSeoFields(entry || {});

  return {

    ...e,

    meta_title: e.meta_title,

    meta_description: e.meta_description,

    meta_keywords: e.meta_keywords,

    meta_image: e.meta_image,

    canonical_url: e.canonical_url,

  };

}



function seoEntryToGeniebuild(entry, pageDoc = null, projectBaseUrl = "") {

  const e = pageDoc

    ? withLiveCanonical(entry, pageDoc, projectBaseUrl)

    : pickSeoFields(entry || {});

  return {

    title: e.meta_title,

    description: e.meta_description,

    keywords: e.meta_keywords,

    canonicalUrl: e.canonical_url,

    ogTitle: e.og_title || e.meta_title,

    ogDescription: e.og_description || e.meta_description,

    ogImage: e.og_image || e.meta_image,

    ogType: e.og_type || "website",

    ogSiteName: e.og_site_name,

    twitterCard: e.twitter_card || "summary_large_image",

    twitterSite: e.twitter_site,

    robots: e.robots || "index,follow",

    favicon: e.favicon,

    structuredData: e.structured_data,

    language: e.language || "en",

  };

}



function geniebuildToSeoEntry(seo = {}) {

  return pickSeoFields({

    meta_title: seo.title,

    meta_description: seo.description,

    meta_keywords: seo.keywords,

    canonical_url: seo.canonicalUrl,

    og_title: seo.ogTitle,

    og_description: seo.ogDescription,

    og_image: seo.ogImage,

    og_type: seo.ogType,

    og_site_name: seo.ogSiteName,

    twitter_card: seo.twitterCard,

    twitter_site: seo.twitterSite,

    robots: seo.robots,

    favicon: seo.favicon,

    structured_data: seo.structuredData,

    language: seo.language,

  });

}



function pageUrlFromPage(page, projectBaseUrl = "") {

  const slug = normalizeSlugInput(page?.slug || page?.name || "");

  const path = toPublicPath(slug);

  if (projectBaseUrl) {

    const base = String(projectBaseUrl).replace(/\/+$/, "");

    return `${base}${path}`;

  }

  return path;

}



async function getSeoForWebsitePage(pageDoc, options = {}) {

  if (!pageDoc) return null;

  const active = getActiveSeoFromPage(pageDoc);

  if (!active || (!active.meta_title && !active.meta_description)) {

    return null;

  }

  return withLiveCanonical(active, pageDoc, options.projectBaseUrl || "");

}



async function upsertWebsitePageSeo({ projectId, pageId, patch = {}, source = "manual", status = null, logs = null }) {
  if (!projectId || !pageId) {
    throw new Error("projectId and pageId are required");
  }

  const page = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
  if (!page) throw new Error("Website page not found");

  const existing = (await getSeoForWebsitePage(page)) || {};
  const existingRaw = getRawSeoFromPage(page) || {};

  const merged = {
    ...pickSeoFields(existing),
    ...pickSeoFields(patch),
  };

  if (!merged.canonical_url) {
    merged.canonical_url = pageUrlFromPage(page);
  }

  // Determine status: 0 = pending, 1 = AI generated, 2 = manual
  let finalStatus = status;
  if (finalStatus === null) {
    // Auto-detect: if source is "manual" set status 2, if "ai" set status 1
    if (source === "manual") {
      finalStatus = 2;
    } else if (source === "ai") {
      finalStatus = 1;
    } else {
      finalStatus = existingRaw.status ?? 0;
    }
  }

  // Merge logs: append new logs to existing ones (keep last 10)
  const existingLogs = Array.isArray(existingRaw.log) ? existingRaw.log : [];
  const newLogs = Array.isArray(logs) ? logs : [];
  const mergedLogs = [...existingLogs, ...newLogs].slice(-10); // Keep last 10 entries

  const entry = {
    ...merged,
    updatedAt: new Date(),
    source,
    status: finalStatus,
    log: mergedLogs,
  };

  await WebsitePage.updateOne(
    { _id: pageId, projectId },
    { $set: { seoSettings: [entry] } }
  );

  return withLiveCanonical(entry, page);
}



/** After slug change + 301 redirect recorded, keep canonical on the new live path. */

async function syncSeoCanonicalOnSlugChange(projectId, pageId, oldSlug, newSlug) {

  const page = await WebsitePage.findOne({ _id: pageId, projectId })

    .select("seoSettings slug")

    .lean();

  if (!page?.seoSettings?.length) return;



  const entry = pickSeoFields(page.seoSettings[0]);

  const newCanonical = pageUrlFromPage({ slug: newSlug });

  const oldCanonical = pageUrlFromPage({ slug: oldSlug });

  const stored = String(entry.canonical_url || "").trim();



  if (stored && stored !== oldCanonical && !stored.endsWith(oldCanonical)) {

    return;

  }



  if (stored === newCanonical) return;



  await WebsitePage.updateOne(

    { _id: pageId, projectId },

    {

      $set: {

        seoSettings: [

          {

            ...entry,

            canonical_url: newCanonical,

            updatedAt: new Date(),

          },

        ],

      },

    }

  );

}



const MAX_SEO_RETRIES = 3;

async function generatePageSeoWithAI({
  project = {},
  page = {},
  locationName = "",
  serviceName = "",
  userId,
  projectId,
  pageId,
}) {
  const pageUrl = pageUrlFromPage(page);
  const prompt = buildPageSeoPrompt({
    projectName: project.projectName || "",
    serviceType: project.serviceType || project.mainCategory || "",
    focusKeyword: project.focusKeyword || "",
    projectKeywordsText: project.projectKeywordsText || "",
    pageName: page.name || "",
    displayName: page.displayName || "",
    pageUrl,
    locationName,
    serviceName,
  });

  const logs = [];
  let lastError = null;
  let seoJson = null;

  // Retry logic: up to MAX_SEO_RETRIES attempts
  for (let attempt = 1; attempt <= MAX_SEO_RETRIES; attempt++) {
    try {
      console.log(`[pageSeoService] SEO generation attempt ${attempt}/${MAX_SEO_RETRIES} for page ${page.name || page._id}`);
      
      seoJson = await fetchJSONFromOpenAI(prompt, "GENERATE_PAGE_SEO_SETTINGS", {
        userId: userId || project.userId,
        projectId,
        pageId: pageId || String(page._id || ""),
        promptFrom: "pageSeoService",
        promptFor: "page_seo_settings",
      });

      const metaTitle = String(seoJson?.meta_title || "").trim();
      const metaDescription = String(seoJson?.meta_description || "").trim();
      const metaKeywords = String(seoJson?.meta_keywords || "").trim();

      if (!metaTitle || !metaDescription || !metaKeywords) {
        throw new Error(`Invalid SEO JSON: title=${!!metaTitle}, desc=${!!metaDescription}, keywords=${!!metaKeywords}`);
      }

      // Success - log it
      logs.push({
        timestamp: new Date(),
        success: true,
        message: "SEO generated successfully",
        attempt,
        responseSnippet: JSON.stringify(seoJson).substring(0, 500),
      });

      const entry = pickSeoFields({
        ...seoJson,
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        og_title: seoJson.og_title || metaTitle,
        og_description: seoJson.og_description || metaDescription,
        og_image: seoJson.og_image || seoJson.meta_image || "",
        canonical_url: seoJson.canonical_url || pageUrl,
      });

      await upsertWebsitePageSeo({
        projectId,
        pageId: String(page._id),
        patch: entry,
        source: "ai",
        status: 1, // AI generated
        logs,
      });

      return entry;

    } catch (err) {
      lastError = err;
      logs.push({
        timestamp: new Date(),
        success: false,
        message: err.message || "Unknown error",
        attempt,
        responseSnippet: seoJson ? JSON.stringify(seoJson).substring(0, 500) : "",
      });
      console.warn(`[pageSeoService] SEO attempt ${attempt}/${MAX_SEO_RETRIES} failed for ${page.name}:`, err.message);

      // Wait before retry (exponential backoff: 1s, 2s, 4s)
      if (attempt < MAX_SEO_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  // All retries failed - save the failure log with pending status
  await upsertWebsitePageSeo({
    projectId,
    pageId: String(page._id),
    patch: { canonical_url: pageUrl },
    source: "ai",
    status: 0, // Pending (failed to generate)
    logs,
  });

  throw lastError || new Error(`SEO generation failed after ${MAX_SEO_RETRIES} attempts`);
}

/** Read stored SEO as saved — do not fall back to og_* (avoids false "complete" skips). */
function getRawSeoFromPage(page) {
  const arr = Array.isArray(page?.seoSettings) ? page.seoSettings : [];
  if (!arr.length) return null;
  const raw = arr[0];
  return raw && typeof raw === "object" ? raw : null;
}

function isSeoEntryComplete(entry) {
  if (!entry || typeof entry !== "object") return false;
  const title = String(entry.meta_title || "").trim();
  const description = String(entry.meta_description || "").trim();
  const keywords = String(entry.meta_keywords || "").trim();
  return (
    title.length >= 8 &&
    description.length >= 32 &&
    keywords.length >= 3
  );
}

function pageNeedsSeo(page) {
  const raw = getRawSeoFromPage(page);
  if (!raw) return true;
  return !isSeoEntryComplete(raw);
}

async function resolveSeoContextForPage(page = {}) {
  let locationName = "";
  let serviceName = "";
  if (page.locationId) {
    const loc = await BusinessLocation.findById(page.locationId)
      .select("areaName name")
      .lean();
    if (loc) locationName = String(loc.areaName || loc.name || "").trim();
  }
  if (page.serviceId) {
    const svc = await Service.findById(page.serviceId).select("name").lean();
    if (svc) serviceName = String(svc.name || "").trim();
  }
  return { locationName, serviceName };
}

/**
 * Generate AI SEO for every WebsitePage that lacks complete meta_title, meta_description, and meta_keywords.
 * This is the single source of truth for post–section-generation SEO (no URL-set heuristics).
 */
async function generateMissingSeoForAllProjectPages({
  projectId,
  userId,
  project: projectIn,
  pageIds = null,
  maxPages = 0,
} = {}) {
  const project = projectIn || (await UserProject.findById(projectId).lean());
  if (!project) {
    throw new Error("Project not found for SEO generation");
  }

  const query = { projectId };
  if (Array.isArray(pageIds) && pageIds.length) {
    query._id = { $in: pageIds };
  }

  const pages = await WebsitePage.find(query).select(PAGE_SEO_SELECT).lean();

  const missingBefore = pages.filter(pageNeedsSeo);
  const toProcess = maxPages > 0 ? missingBefore.slice(0, maxPages) : missingBefore;
  const alreadyCompleteBefore = pages.length - missingBefore.length;

  let created = 0;
  let failed = 0;
  const errors = [];
  const createdPages = [];

  if (!toProcess.length) {
    console.log(
      `[pageSeoService] All ${pages.length} WebsitePage row(s) already have complete meta_title, meta_description, and meta_keywords`
    );
  } else {
    console.log(
      `[pageSeoService] Generating AI SEO for ${toProcess.length} of ${pages.length} page(s) (${alreadyCompleteBefore} already complete)`
    );
  }

  for (const page of toProcess) {
    const pageLabel = `${page.displayName || page.name} (${page._id})`;
    const pageUrl = pageUrlFromPage(page);
    try {
      const { locationName, serviceName } = await resolveSeoContextForPage(page);
      await generatePageSeoWithAI({
        project,
        page,
        locationName,
        serviceName,
        userId: userId || project.userId,
        projectId,
        pageId: String(page._id),
      });
      created++;
      createdPages.push({
        pageId: String(page._id),
        pageUrl,
        name: page.displayName || page.name,
      });
      console.log(`[pageSeoService] ✅ SEO saved: ${pageLabel} url=${pageUrl}`);
    } catch (err) {
      failed++;
      errors.push({
        pageId: String(page._id),
        pageUrl,
        message: err.message,
      });
      console.error(`[pageSeoService] ❌ SEO failed: ${pageLabel} url=${pageUrl}:`, err.message);
    }
  }

  const refreshed = await WebsitePage.find(query).select(PAGE_SEO_SELECT).lean();
  const stillMissing = refreshed.filter(pageNeedsSeo);

  if (stillMissing.length > 0) {
    console.warn(
      `[pageSeoService] ${stillMissing.length} page(s) still missing SEO after generation:`,
      stillMissing.map((p) => ({
        id: String(p._id),
        name: p.displayName || p.name,
        url: pageUrlFromPage(p),
      }))
    );
  }

  return {
    total: pages.length,
    missingBefore: missingBefore.length,
    stillMissing: stillMissing.length,
    created,
    alreadyComplete: alreadyCompleteBefore,
    /** @deprecated use alreadyComplete */
    skipped: alreadyCompleteBefore,
    failed,
    errors,
    createdPages,
    stillMissingPages: stillMissing.map((p) => ({
      pageId: String(p._id),
      pageUrl: pageUrlFromPage(p),
      name: p.displayName || p.name,
    })),
  };
}

async function findWebsitePageByPublicUrl(projectId, pageUrl) {

  const slug = normalizeSlugInput(String(pageUrl || "").replace(/^\//, ""));



  const route = await resolveSlugRoute({

    projectId,

    slug,

    select: PAGE_SEO_SELECT,

  });



  if (route.kind === "live" || route.kind === "redirect") {

    return route.page;

  }



  if (!slug) return null;



  let page = await WebsitePage.findOne({

    projectId,

    $or: [{ slug }, { name: slug }],

  })

    .select(PAGE_SEO_SELECT)

    .lean();



  if (!page && slug.startsWith("services/")) {

    const serviceSlug = slug.replace(/^services\//, "");

    const service = await Service.findOne({ projectId, slug: serviceSlug }).select("_id").lean();

    if (service) {

      page = await WebsitePage.findOne({

        projectId,

        pageType: "service",

        serviceId: service._id,

      })

        .select(PAGE_SEO_SELECT)

        .lean();

    }

  }



  const lastSegment = slug.split("/").filter(Boolean).pop();

  if (!page && lastSegment) {

    page = await WebsitePage.findOne({

      projectId,

      $or: [{ slug: lastSegment }, { name: lastSegment }],

    })

      .select(PAGE_SEO_SELECT)

      .lean();

  }



  return page;

}



async function upsertSeoByPageUrl(projectId, pageUrl, patch = {}, source = "ai") {

  const page = await findWebsitePageByPublicUrl(projectId, pageUrl);

  if (!page) {

    console.warn(`[pageSeoService] No WebsitePage for project=${projectId} url=${pageUrl}`);

    return null;

  }

  const canonical = pageUrlFromPage(page);

  return upsertWebsitePageSeo({

    projectId,

    pageId: String(page._id),

    patch: { ...patch, canonical_url: patch.canonical_url || canonical },

    source,

  });

}



module.exports = {

  DEFAULT_SEO_ENTRY,

  pickSeoFields,

  getActiveSeoFromPage,

  withLiveCanonical,

  seoEntryToLegacyApi,

  seoEntryToGeniebuild,

  geniebuildToSeoEntry,

  pageUrlFromPage,

  getSeoForWebsitePage,

  upsertWebsitePageSeo,

  syncSeoCanonicalOnSlugChange,

  generatePageSeoWithAI,

  generateMissingSeoForAllProjectPages,

  pageNeedsSeo,

  getRawSeoFromPage,

  isSeoEntryComplete,

  resolveSeoContextForPage,

  upsertSeoByPageUrl,

  findWebsitePageByPublicUrl,

};


