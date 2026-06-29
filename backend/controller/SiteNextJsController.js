const AdminController = require("./AdminController");
const WebsitePage = require("../models/WebsitePage");
const UserProject = require("../models/userProjects");
const BusinessLocation = require("../models/businessLocation");
const {
  normalizeSlugInput,
  resolveSlugRoute,
  findHomepage,
  ensureHomepageForProject,
  normalizeProjectId,
} = require("../services/pageSlugService");
const {
  getSeoForWebsitePage,
  seoEntryToLegacyApi,
} = require("../services/pageSeoService");

const PAGE_SELECT =
  "_id projectId pageType name slug locationId serviceId displayName isPublished";

async function isPagePubliclyVisible(pageDoc) {
  if (!pageDoc) return false;
  if (pageDoc.isPublished === false) return false;
  if (pageDoc.locationId) {
    const loc = await BusinessLocation.findById(pageDoc.locationId).select("status").lean();
    if (loc && Number(loc.status) !== 1) return false;
  }
  return true;
}

function buildPageDetailsPayload(pageDoc, effectiveSlug) {
  return {
    projectId: String(pageDoc.projectId || "").trim(),
    pageId: String(pageDoc._id),
    locationId: pageDoc.locationId ? String(pageDoc.locationId) : null,
    pageType: String(pageDoc.pageType || "default"),
    slug: normalizeSlugInput(pageDoc.slug || effectiveSlug),
    name: String(pageDoc.name || ""),
    displayName: String(pageDoc.displayName || ""),
    serviceId: pageDoc.serviceId ? String(pageDoc.serviceId) : null,
  };
}

async function resolvePageDocument({
  projectId,
  incomingPageId,
  incomingSlug,
  requestedPageType,
}) {
  const effectiveSlug = normalizeSlugInput(incomingSlug);

  const pid = normalizeProjectId(projectId);

  if (!incomingPageId && !effectiveSlug) {
    let homepage = await findHomepage(pid, PAGE_SELECT);
    if (!homepage) {
      homepage = await ensureHomepageForProject(pid, PAGE_SELECT);
    }
    if (homepage) {
      return { pageDoc: homepage, projectId: String(homepage.projectId || pid) };
    }
  }

  if (incomingPageId) {
    const pageIdStr = String(incomingPageId).trim();
    let pageDoc = await WebsitePage.findOne({
      _id: pageIdStr,
      projectId: pid,
    })
      .select(PAGE_SELECT)
      .lean();
    if (!pageDoc) {
      pageDoc = await WebsitePage.findOne({ _id: pageIdStr })
        .select(PAGE_SELECT)
        .lean();
    }
    if (pageDoc) return { pageDoc, projectId: String(pageDoc.projectId || projectId) };
    return { pageDoc: null, projectId: String(pid || projectId) };
  }

  if (incomingSlug !== undefined && incomingSlug !== null) {
    const route = await resolveSlugRoute({
      projectId: pid,
      slug: effectiveSlug,
      preferredPageType: requestedPageType,
      select: PAGE_SELECT,
    });

    if (route.kind === "live" || route.kind === "redirect") {
      return {
        pageDoc: route.page,
        projectId: String(route.page.projectId || projectId),
        redirect: route.kind === "redirect" ? route.redirect : null,
      };
    }
  }

  let fallback = await findHomepage(pid, PAGE_SELECT);
  if (!fallback) {
    fallback = await ensureHomepageForProject(pid, PAGE_SELECT);
  }
  if (!fallback) {
    fallback = await WebsitePage.findOne({ projectId: pid, pageType: "default" })
      .sort({ createdAt: 1 })
      .select(PAGE_SELECT)
      .lean();
  }
  if (!fallback) {
    fallback = await WebsitePage.findOne({ projectId: pid })
      .sort({ createdAt: 1 })
      .select(PAGE_SELECT)
      .lean();
  }

  if (fallback) {
    return { pageDoc: fallback, projectId: String(fallback.projectId || pid) };
  }

  return { pageDoc: null, projectId: String(pid || projectId) };
}

function logWebsitePageResponse(res, statusCode, payload, label = "RESPONSE") {
  const sections = payload?.data?.sections;
  const summary = {
    message: payload?.message,
    pageId: payload?.data?.pageId || payload?.data?.page?._id,
    projectId: payload?.data?.projectId,
    sectionsCount: Array.isArray(sections) ? sections.length : undefined,
    redirect: payload?.redirect || null,
    hasSeo: Boolean(payload?.data?.seo),
  };
  // console.log(`[website_page] ${label}`, { statusCode, summary });
  // console.log(`[website_page] ${label} body:`, JSON.stringify(payload, null, 2));
}

function attachWebsitePageResponseLogger(res) {
  let statusCode = 200;
  const originalStatus = res.status.bind(res);
  const originalJson = res.json.bind(res);

  res.status = function (code) {
    statusCode = code;
    return originalStatus(code);
  };

  res.json = function (payload) {
    logWebsitePageResponse(res, statusCode, payload, "SUCCESS");
    return originalJson(payload);
  };

  return res;
}

module.exports = {
  website_page: async (req, res) => {
    const startedAt = Date.now();
    console.log("[website_page] ========== REQUEST START ==========");
    console.log("[website_page] body:", JSON.stringify(req.body ?? {}, null, 2));
    console.log("[website_page] params:", JSON.stringify(req.params ?? {}, null, 2));
    console.log("[website_page] query:", JSON.stringify(req.query ?? {}, null, 2));

    try {
      let projectId = String(req.body?.projectId ?? "").trim();
      const incomingPageId = req.body?.pageId;
      const incomingSlug = req.body?.slug;
      const locationId = req.body?.locationId;
      const requestedPageType = String(req.body?.pageType || "")
        .toLowerCase()
        .trim();

      console.log("[website_page] parsed input:", {
        projectId,
        incomingPageId: incomingPageId ?? null,
        incomingSlug: incomingSlug ?? null,
        locationId: locationId ?? null,
        requestedPageType: requestedPageType || null,
      });

      if (!projectId) {
        const payload = { message: "projectId is required" };
        console.log("[website_page] FAIL 400:", payload);
        return res.status(400).json(payload);
      }

      const { pageDoc, projectId: resolvedProjectId, redirect } =
        await resolvePageDocument({
          projectId,
          incomingPageId,
          incomingSlug,
          requestedPageType,
        });

      // console.log("[website_page] resolved page:", {
      //   found: Boolean(pageDoc?._id),
      //   pageId: pageDoc?._id ? String(pageDoc._id) : null,
      //   name: pageDoc?.name ?? null,
      //   slug: pageDoc?.slug ?? null,
      //   pageType: pageDoc?.pageType ?? null,
      //   locationId: pageDoc?.locationId ? String(pageDoc.locationId) : null,
      //   serviceId: pageDoc?.serviceId ? String(pageDoc.serviceId) : null,
      //   isPublished: pageDoc?.isPublished,
      //   resolvedProjectId,
      //   redirect: redirect ?? null,
      // });

      if (!pageDoc?._id) {
        const pid = normalizeProjectId(projectId);
        const projectExists = pid
          ? Boolean(await UserProject.findById(pid).select("_id").lean())
          : false;
        const message = !projectExists
          ? "Project not found. Check NEXT_PUBLIC_PROJECT_ID matches a project in this database."
          : "No website page found for this project/slug";
        const payload = { message, projectExists };
        console.log("[website_page] FAIL 404:", payload);
        return res.status(404).json({ message });
      }

      if (!(await isPagePubliclyVisible(pageDoc))) {
        const payload = { message: "This page is not available" };
        console.log("[website_page] FAIL 404 (not visible):", {
          ...payload,
          pageId: String(pageDoc._id),
          isPublished: pageDoc.isPublished,
          locationId: pageDoc.locationId ? String(pageDoc.locationId) : null,
        });
        return res.status(404).json(payload);
      }

      projectId = resolvedProjectId;

      if (redirect) {
        const pageSeoEntry = await getSeoForWebsitePage(pageDoc);
        const payload = {
          message: "Redirect",
          redirect: {
            from: redirect.from,
            to: redirect.to,
            statusCode: redirect.statusCode || 301,
            pageId: String(pageDoc._id),
          },
          data: {
            pageId: String(pageDoc._id),
            projectId,
            seo: pageSeoEntry ? seoEntryToLegacyApi(pageSeoEntry, pageDoc) : null,
          },
        };
        logWebsitePageResponse(res, 200, payload, "SUCCESS (redirect)");
        return res.status(200).json(payload);
      }

      req.params = {
        ...req.params,
        projectId: String(pageDoc.projectId || projectId),
        pageId: String(pageDoc._id),
      };

      const resolvedLocationId = locationId
        ? String(locationId).trim()
        : pageDoc.locationId
          ? String(pageDoc.locationId)
          : null;
      if (resolvedLocationId) {
        req.query = { ...req.query, locationId: resolvedLocationId };
      } else if (req.query?.locationId) {
        const nextQuery = { ...req.query };
        delete nextQuery.locationId;
        req.query = nextQuery;
      }

      // console.log("[website_page] delegating to getWebsiteDesignData:", {
      //   params: req.params,
      //   query: req.query,
      // });

      attachWebsitePageResponseLogger(res);

      const result = await AdminController.getWebsiteDesignData(req, res);
      // console.log(
      //   "[website_page] ========== REQUEST END (%dms) ==========",
      //   Date.now() - startedAt
      // );
      return result;
    } catch (error) {
      console.error("[website_page] ========== ERROR ==========");
      console.error("[website_page] message:", error?.message);
      console.error("[website_page] stack:", error?.stack);
      console.error("[website_page] full error:", error);
      const payload = { message: "Server error while fetching website page data" };
      console.log("[website_page] FAIL 500:", payload);
      return res.status(500).json(payload);
    }
  },

  slug_to_page_details: async (req, res) => {
    try {
      const incomingPageId = req.body?.pageId;
      const hasSlugField =
        req.body?.slug !== undefined && req.body?.slug !== null;
      const slug = hasSlugField ? req.body.slug : "";
      let projectId = String(req.body?.projectId ?? "").trim();
      const requestedPageType = String(req.body?.pageType || "")
        .toLowerCase()
        .trim();

      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }
      if (!hasSlugField && !incomingPageId) {
        return res.status(400).json({ message: "slug or pageId is required" });
      }

      const { pageDoc, projectId: resolvedProjectId, redirect } =
        await resolvePageDocument({
          projectId,
          incomingPageId,
          incomingSlug: slug,
          requestedPageType,
        });

      if (redirect) {
        return res.status(200).json({
          message: "Redirect",
          redirect: {
            from: redirect.from,
            to: redirect.to,
            statusCode: redirect.statusCode || 301,
          },
        });
      }

      if (!pageDoc?._id) {
        return res
          .status(404)
          .json({ message: "Page details not found for this project" });
      }

      let content=buildPageDetailsPayload(
        pageDoc,
        normalizeSlugInput(slug)
      );
      console.log(content);
      return res.status(200).json({
        message: "Page details found",
        data: buildPageDetailsPayload(
          pageDoc,
          normalizeSlugInput(slug)
        ),
      });
    } catch (error) {
      console.error("Error in slug_to_page_details:", error);
      return res
        .status(500)
        .json({ message: "Server error while fetching slug to page details" });
    }
  },

  resolve_slug: async (req, res) => {
    try {
      const projectId = String(req.body?.projectId ?? req.query?.projectId ?? "").trim();
      const slug = req.body?.slug ?? req.query?.slug ?? "";

      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }

      const route = await resolveSlugRoute({
        projectId,
        slug,
        select: PAGE_SELECT,
      });

      if (route.kind === "not_found") {
        return res.status(404).json({ message: "Slug not found", kind: "not_found" });
      }

      const pageSeoEntry = await getSeoForWebsitePage(route.page);

      if (route.kind === "redirect") {
        return res.status(200).json({
          kind: "redirect",
          redirect: route.redirect,
          data: {
            ...buildPageDetailsPayload(route.page, route.page.slug),
            seo: pageSeoEntry ? seoEntryToLegacyApi(pageSeoEntry, route.page) : null,
          },
        });
      }

      return res.status(200).json({
        kind: "live",
        data: {
          ...buildPageDetailsPayload(route.page, route.page.slug),
          seo: pageSeoEntry ? seoEntryToLegacyApi(pageSeoEntry, route.page) : null,
        },
      });
    } catch (error) {
      console.error("Error in resolve_slug:", error);
      return res.status(500).json({ message: "Server error while resolving slug" });
    }
  },

  
};
