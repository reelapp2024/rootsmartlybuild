/**

 * Per-page SEO on WebsitePage.seoSettings (single active entry in array).

 * Page lookup respects PageSlugRedirect (301) via resolveSlugRoute.

 */



const WebsitePage = require("../models/WebsitePage");
const UserProject = require("../models/userProjects");
const Service = require("../models/service");
const BusinessLocation = require("../models/businessLocation");
const SectionContent = require("../models/SectionContent");

const {
  getSeoMode,
  SEO_MODE,
  shouldGenerateSeo,
  shouldGenerateSchemas,
  isPremiumSeo,
  buildSeoPromptForMode,
  buildPremiumSchemas,
  schemasToStructuredDataString,
  newSchemaId,
} = require("../seoprompts");

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
  schemas: [],
  language: "en",
};

const SCHEMA_SOURCES = new Set(["system", "ai", "manual"]);

/** Normalize one JSON-LD schema row for WebsitePage.seoSettings[].schemas */
function normalizeSchemaEntry(input = {}, { generateIdIfMissing = true } = {}) {
  let json = input.json;
  if (typeof json === "string") {
    try {
      json = JSON.parse(json);
    } catch {
      json = {};
    }
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    json = {};
  }

  const typeFromJson = Array.isArray(json["@type"])
    ? String(json["@type"][0] || "")
    : String(json["@type"] || "");
  const type = String(input.type || typeFromJson || "Thing").trim() || "Thing";
  const name = String(input.name || type).trim() || type;
  let id = String(input.id || "").trim();
  if (!id && generateIdIfMissing) id = newSchemaId();

  return {
    id,
    type,
    name,
    enabled: !(input.enabled === false || input.enabled === "false" || input.enabled === 0),
    source: SCHEMA_SOURCES.has(String(input.source || ""))
      ? String(input.source)
      : "manual",
    json,
    updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
  };
}

function normalizeSchemasArray(list) {
  if (typeof list === "string" && list.trim()) {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((row) => {
      try {
        const entry = normalizeSchemaEntry(row, { generateIdIfMissing: true });
        return entry.id ? entry : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

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
  if (
    Object.prototype.hasOwnProperty.call(raw, "schemas") ||
    Array.isArray(raw.schemas)
  ) {
    out.schemas = normalizeSchemasArray(raw.schemas);
  }
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
    schemas: Array.isArray(e.schemas) ? e.schemas : [],
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
    schemas: Array.isArray(e.schemas) ? e.schemas : [],
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
    schemas: seo.schemas,
    language: seo.language,
  });
}

async function loadFaqAndTestimonialsForPage(projectId, page = {}) {
  const faqItems = [];
  const testimonials = [];
  try {
    const pageId = page?._id || null;
    const query = {
      projectId,
      sectionId: { $in: ["faq", "testimonials", "aboutfaq", "contactfaq", "areasfaq"] },
      status: "generated",
      isDeleted: { $ne: true },
    };
    if (pageId) query.pageId = pageId;

    const rows = await SectionContent.find(query)
      .select("sectionId data")
      .limit(12)
      .lean();

    for (const row of rows) {
      const sid = String(row.sectionId || "").toLowerCase();
      const data = row.data || {};
      if (sid.includes("faq") && Array.isArray(data.items)) {
        faqItems.push(...data.items);
      }
      if (sid.includes("testimonial")) {
        const list = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.testimonials)
            ? data.testimonials
            : [];
        testimonials.push(...list);
      }
    }
  } catch (err) {
    console.warn("[pageSeoService] FAQ/testimonial load failed:", err.message);
  }
  return { faqItems, testimonials };
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
  if (!active) return null;

  const hasMeta = Boolean(
    String(active.meta_title || "").trim() || String(active.meta_description || "").trim()
  );
  const hasSchemas = Array.isArray(active.schemas) && active.schemas.length > 0;
  const hasLd = Boolean(String(active.structured_data || "").trim());
  if (!hasMeta && !hasSchemas && !hasLd) return null;

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

  const base = pickSeoFields(existing);
  const next = pickSeoFields(patch);
  const merged = { ...base, ...next };

  // Don't wipe schemas/structured_data when patch omits them
  if (!Object.prototype.hasOwnProperty.call(patch, "schemas") && Array.isArray(base.schemas)) {
    merged.schemas = base.schemas;
  }
  if (
    !Object.prototype.hasOwnProperty.call(patch, "structured_data") &&
    base.structured_data
  ) {
    merged.structured_data = base.structured_data;
  }

  // Keep schemas normalized + sync legacy structured_data @graph when schemas change
  if (Object.prototype.hasOwnProperty.call(patch, "schemas")) {
    merged.schemas = normalizeSchemasArray(merged.schemas);
    // schemas[] is source of truth — always rebuild legacy blob
    merged.structured_data = schemasToStructuredDataString(merged.schemas);
  } else if (Array.isArray(merged.schemas)) {
    merged.schemas = normalizeSchemasArray(merged.schemas);
  }

  if (!merged.canonical_url) {
    merged.canonical_url = pageUrlFromPage(page);
  }

  let finalStatus = status;
  if (finalStatus === null) {
    if (source === "manual") finalStatus = 2;
    else if (source === "ai") finalStatus = 1;
    else finalStatus = existingRaw.status ?? 0;
  }

  const existingLogs = Array.isArray(existingRaw.log) ? existingRaw.log : [];
  const newLogs = Array.isArray(logs) ? logs : [];
  const mergedLogs = [...existingLogs, ...newLogs].slice(-10);

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
  const mode = getSeoMode();
  if (!shouldGenerateSeo()) {
    console.log(
      `[pageSeoService] seo_mode=${mode} — skip generation for ${page.name || page._id}`
    );
    return null;
  }

  const pageUrl = pageUrlFromPage(page);
  const prompt = buildSeoPromptForMode({
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
  const promptLabel = isPremiumSeo() ? "page_seo_premium" : "page_seo_basic";

  for (let attempt = 1; attempt <= MAX_SEO_RETRIES; attempt++) {
    try {
      console.log(
        `[pageSeoService] SEO mode=${mode} attempt ${attempt}/${MAX_SEO_RETRIES} for ${page.name || page._id}`
      );

      seoJson = await fetchJSONFromOpenAI(prompt, "GENERATE_PAGE_SEO_SETTINGS", {
        userId: userId || project.userId,
        projectId,
        pageId: pageId || String(page._id || ""),
        promptFrom: "pageSeoService",
        promptFor: promptLabel,
      });

      const metaTitle = String(seoJson?.meta_title || "").trim();
      const metaDescription = String(seoJson?.meta_description || "").trim();
      const metaKeywords = String(seoJson?.meta_keywords || "").trim();

      if (!metaTitle || !metaDescription || !metaKeywords) {
        throw new Error(
          `Invalid SEO JSON: title=${!!metaTitle}, desc=${!!metaDescription}, keywords=${!!metaKeywords}`
        );
      }

      logs.push({
        timestamp: new Date(),
        success: true,
        message: `SEO generated (mode ${mode})`,
        attempt,
        responseSnippet: JSON.stringify(seoJson).substring(0, 500),
      });

      let entry = pickSeoFields({
        ...seoJson,
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        og_title: seoJson.og_title || metaTitle,
        og_description: seoJson.og_description || metaDescription,
        og_image: seoJson.og_image || seoJson.meta_image || "",
        canonical_url: seoJson.canonical_url || pageUrl,
        og_site_name: seoJson.og_site_name || project.projectName || "",
        robots: seoJson.robots || "index,follow",
        language: seoJson.language || "en",
        twitter_card: seoJson.twitter_card || "summary_large_image",
      });

      // Mode 1: strip premium-only noise; keep OG mirrored from basic meta
      if (!isPremiumSeo()) {
        entry.structured_data = "";
        entry.schemas = [];
      }

      // Mode 2: build JSON-LD schemas[]
      if (shouldGenerateSchemas()) {
        const { faqItems, testimonials } = await loadFaqAndTestimonialsForPage(
          projectId,
          page
        );
        const schemas = buildPremiumSchemas({
          project,
          page,
          locationName,
          serviceName,
          seoMeta: entry,
          faqItems,
          testimonials,
          contact: {
            phone: project.phone || project.contactPhone || "",
            email: project.email || project.contactEmail || "",
            address: project.address || "",
          },
        });
        entry.schemas = schemas;
        entry.structured_data = schemasToStructuredDataString(schemas);
      }

      await upsertWebsitePageSeo({
        projectId,
        pageId: String(page._id),
        patch: entry,
        source: "ai",
        status: 1,
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
      console.warn(
        `[pageSeoService] SEO attempt ${attempt}/${MAX_SEO_RETRIES} failed for ${page.name}:`,
        err.message
      );
      if (attempt < MAX_SEO_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  await upsertWebsitePageSeo({
    projectId,
    pageId: String(page._id),
    patch: { canonical_url: pageUrl },
    source: "ai",
    status: 0,
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
  const mode = getSeoMode();
  if (!shouldGenerateSeo()) {
    console.log(`[pageSeoService] seo_mode=${mode} — skipping all page SEO generation`);
    return {
      total: 0,
      missingBefore: 0,
      stillMissing: 0,
      created: 0,
      alreadyComplete: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      createdPages: [],
      stillMissingPages: [],
      seoMode: mode,
    };
  }

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
      `[pageSeoService] All ${pages.length} WebsitePage row(s) already have complete meta_title, meta_description, and meta_keywords (seo_mode=${mode})`
    );
  } else {
    console.log(
      `[pageSeoService] Generating AI SEO (mode=${mode}) for ${toProcess.length} of ${pages.length} page(s) (${alreadyCompleteBefore} already complete)`
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
    seoMode: mode,
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

/**
 * Create or update one JSON-LD schema on a page's SEO entry.
 * Pass schema.id to update; omit id (or unknown id) to create.
 */
async function upsertPageSeoSchema({ projectId, pageId, schema }) {
  if (!projectId || !pageId) throw new Error("projectId and pageId are required");
  if (!schema || typeof schema !== "object") throw new Error("schema object is required");

  const page = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
  if (!page) throw new Error("Website page not found");

  const raw = getRawSeoFromPage(page) || {};
  const base = pickSeoFields(raw);
  const schemas = normalizeSchemasArray(base.schemas);
  const incoming = normalizeSchemaEntry(schema, { generateIdIfMissing: true });

  if (!incoming.json || typeof incoming.json !== "object") {
    throw new Error("schema.json must be a valid JSON-LD object");
  }
  if (!incoming.json["@type"] && incoming.type) {
    incoming.json = { ...incoming.json, "@type": incoming.type };
  }
  if (!incoming.json["@context"]) {
    incoming.json = { "@context": "https://schema.org", ...incoming.json };
  }

  const idx = schemas.findIndex((s) => s.id === incoming.id);
  if (idx >= 0) {
    schemas[idx] = {
      ...schemas[idx],
      ...incoming,
      id: schemas[idx].id,
      updatedAt: new Date(),
    };
  } else {
    schemas.push({ ...incoming, updatedAt: new Date() });
  }

  return upsertWebsitePageSeo({
    projectId,
    pageId: String(pageId),
    patch: {
      schemas,
      structured_data: schemasToStructuredDataString(schemas),
    },
    source: raw.source || "manual",
    status: typeof raw.status === "number" ? raw.status : null,
  });
}

async function deletePageSeoSchema({ projectId, pageId, schemaId }) {
  if (!projectId || !pageId || !schemaId) {
    throw new Error("projectId, pageId, and schemaId are required");
  }
  const page = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
  if (!page) throw new Error("Website page not found");

  const raw = getRawSeoFromPage(page) || {};
  const base = pickSeoFields(raw);
  const before = normalizeSchemasArray(base.schemas);
  const schemas = before.filter((s) => s.id !== String(schemaId));
  if (schemas.length === before.length) {
    throw new Error("Schema not found");
  }

  return upsertWebsitePageSeo({
    projectId,
    pageId: String(pageId),
    patch: {
      schemas,
      structured_data: schemasToStructuredDataString(schemas),
    },
    source: raw.source || "manual",
    status: typeof raw.status === "number" ? raw.status : null,
  });
}

async function setPageSeoSchemaEnabled({ projectId, pageId, schemaId, enabled }) {
  if (!projectId || !pageId || !schemaId) {
    throw new Error("projectId, pageId, and schemaId are required");
  }
  const page = await WebsitePage.findOne({ _id: pageId, projectId }).lean();
  if (!page) throw new Error("Website page not found");

  const raw = getRawSeoFromPage(page) || {};
  const base = pickSeoFields(raw);
  const schemas = normalizeSchemasArray(base.schemas);
  const idx = schemas.findIndex((s) => s.id === String(schemaId));
  if (idx < 0) throw new Error("Schema not found");

  schemas[idx] = {
    ...schemas[idx],
    enabled: enabled !== false && enabled !== "false" && enabled !== 0,
    updatedAt: new Date(),
  };

  return upsertWebsitePageSeo({
    projectId,
    pageId: String(pageId),
    patch: {
      schemas,
      structured_data: schemasToStructuredDataString(schemas),
    },
    source: raw.source || "manual",
    status: typeof raw.status === "number" ? raw.status : null,
  });
}

/** Rebuild premium JSON-LD schemas from page/project context (seo_mode=2). */
async function regeneratePageSeoSchemas({ projectId, pageId }) {
  if (!projectId || !pageId) throw new Error("projectId and pageId are required");
  if (!shouldGenerateSchemas()) {
    throw new Error(
      `Schema rebuild requires seo_mode=2 (current seo_mode=${getSeoMode()})`
    );
  }

  const [project, page] = await Promise.all([
    UserProject.findById(projectId).lean(),
    WebsitePage.findOne({ _id: pageId, projectId }).lean(),
  ]);
  if (!project || !page) throw new Error("Project or page not found");

  const raw = getRawSeoFromPage(page) || {};
  const entry = pickSeoFields(raw);
  const { locationName, serviceName } = await resolveSeoContextForPage(page);
  const { faqItems, testimonials } = await loadFaqAndTestimonialsForPage(projectId, page);

  // Preserve manually edited schemas; replace system/ai ones
  const manualKeep = normalizeSchemasArray(entry.schemas).filter(
    (s) => s.source === "manual"
  );

  const built = buildPremiumSchemas({
    project,
    page,
    locationName,
    serviceName,
    seoMeta: entry,
    faqItems,
    testimonials,
    contact: {
      phone: project.phone || project.contactPhone || "",
      email: project.email || project.contactEmail || "",
    },
  }).map((s) => ({ ...s, source: s.source || "system" }));

  const schemas = [...built, ...manualKeep];
  const structured_data = schemasToStructuredDataString(schemas);

  return upsertWebsitePageSeo({
    projectId,
    pageId: String(pageId),
    patch: { schemas, structured_data },
    source: raw.source || "system",
    status: typeof raw.status === "number" ? raw.status : null,
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
  loadFaqAndTestimonialsForPage,
  getSeoMode,
  SEO_MODE,
  shouldGenerateSeo,
  upsertPageSeoSchema,
  deletePageSeoSchema,
  setPageSeoSchemaEnabled,
  regeneratePageSeoSchemas,
  normalizeSchemaEntry,
  normalizeSchemasArray,
};

