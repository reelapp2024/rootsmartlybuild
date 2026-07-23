const Users = require("../models/users");
const UserProject = require("../models/userProjects");
const ProjectCategory = require("../models/ProjectCategory");
const SubCategory = require("../models/SubCategory");
const MicroCategory = require("../models/MicroCategory");
const BusinessLocation = require("../models/businessLocation");
const Country = require("../models/adminCountires");
const State = require("../models/adminStates");
const City = require("../models/adminCities");
const AdminLocalArea = require("../models/adminLocalAreas");
const Slug = require("../models/slug");
const Notification = require("../models/notification");
const Service = require("../models/service");
const WebsitePage = require("../models/WebsitePage");
const WebsiteDesignsData = require("../models/WebsiteDesignsData");
const SectionContent = require("../models/SectionContent");
const AboutUs = require("../models/aboutus")
const ThemeSetting = require("../models/themeSettings");
const axios = require("axios");
const slugify = require("../additional/slugify");
const { buildBusinessLocationPathMap } = require("../additional/businessLocationPaths");
const { attachGeneratedImagesToSectionData } = require("../additional/sectionImageGenerationHelper");
const { parseSectionOrigin } = require("../imageengines");
const { enqueueSectionGeneration } = require("../queue/sectionGeneration.queue");
const {
  GEO_LOCATION_TYPE,
  isBulkProject,
  ensureBulkGlobalCorePages,
  syncBulkLocationLandingPages,
  syncCountriesToBusinessLocations,
  syncStatesToBusinessLocations,
  syncCitiesToBusinessLocations,
  syncLocalAreasToBusinessLocations,
} = require("../services/geoBusinessLocationSync");
const aboutserviceSection = require("../sections/service/aboutservice/aboutserviceSection");
const { fetchJSONFromOpenAI } = require("../additional/openaiHelpers");
const { syncHeaderFooterSectionsForProject } = require("../services/headerFooterSectionSync");
const { isServiceDetailSection } = require("../additional/sectionResolverRegistry");
const {
  MINIMAL_SERVICE_SECTION_FALLBACK,
  sortSectionIdsByCanonicalOrder,
  findServiceTemplateDesignPage,
  extractSectionTypesFromDesignPage,
  isServiceTemplateExclusiveSection,
} = require("../additional/siteSectionOrder.cjs");
const {
  formatBusinessLocationsForGeneration,
  resolveMainParentLocation,
} = require("../services/sectionGenerationLocationService");

const normalizeArray = (input, fieldName, mandatory = false) => {
  if (!input) {
    if (mandatory) throw new Error(`${fieldName} is required`);
    return [];
  }

  let arr = [];
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) arr = parsed;
      else arr = [parsed];
    } catch {
      arr = [input];
    }
  } else if (Array.isArray(input)) {
    arr = input;
  } else {
    arr = [String(input)];
  }

  arr = arr.map((v) => String(v).trim()).filter(Boolean);
  if (mandatory && arr.length === 0) throw new Error(`${fieldName} cannot be empty`);
  return arr;
};

const ensureHeaderFooterComponents = (componentIds = []) => {
  const list = Array.isArray(componentIds) ? [...componentIds] : [];
  const normalized = list.filter(Boolean);

  const isHeader = (comp) => {
    const t = String(comp?.sectionData?.type || "").toLowerCase();
    return t === "header" || t === "navbar";
  };
  const isFooter = (comp) => String(comp?.sectionData?.type || "").toLowerCase() === "footer";

  let headerComp =
    normalized.find((c) => String(c?.sectionData?.type || "").toLowerCase() === "header") ||
    normalized.find((c) => String(c?.sectionData?.type || "").toLowerCase() === "navbar");
  let footerComp = normalized.find(isFooter);

  if (!headerComp) {
    headerComp = {
      variant_uniqueId: "HeaderPlumbing",
      componentId: null,
      sectionData: { type: "header", content: {}, styles: { variant: "HeaderPlumbing" } },
    };
  } else if (String(headerComp.sectionData?.type || "").toLowerCase() === "navbar") {
    headerComp = {
      ...headerComp,
      sectionData: { ...headerComp.sectionData, type: "header" },
    };
  }

  if (!footerComp) {
    footerComp = {
      variant_uniqueId: "FooterPlumbing",
      componentId: null,
      sectionData: { type: "footer", content: {}, styles: { variant: "FooterPlumbing" } },
    };
  }

  const middle = normalized.filter((comp) => !isHeader(comp) && !isFooter(comp));
  return [headerComp, ...middle, footerComp];
};

const toTitleCaseWords = (value = "") =>
  String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

/** Legacy Step-6 single-line filler — reject if model echoes it. */
const LEGACY_ABOUT_SERVICE_BOILERPLATE =
  /Our team provides dependable\s+.+\s+services in\s+.+\s+with a focus on quality,?\s+speed,?\s+and\s+long-term value/i;

/**
 * Deterministic about copy when AI fails or returns banned boilerplate.
 * Ties copy to brand, service title, and geo hints (not a one-size paragraph).
 */
function buildDeterministicAboutServiceFallback({
  projectName = "",
  serviceType = "",
  focusKeyword = "",
  serviceTitle = "",
  locationName = "",
  parentAreaName = "",
  city = "",
  state = "",
}) {
  const brand = String(projectName || "Our team").trim();
  const st = String(serviceTitle || "this service").trim();
  const ln = String(locationName || "your area").trim();
  const kw = String(focusKeyword || serviceType || st).trim();
  const geo = [city, state].filter(Boolean).join(", ");
  const hierarchy = [ln, parentAreaName].filter(Boolean).join(" — ");

  const p1 = `${brand} documents ${st} work for ${ln} with clear scope: what we inspect first on arrival, how we sequence tasks, and what "done" looks like before we pack up. That keeps recommendations tied to what we see on-site—not generic scripts.`;

  const p2 = geo
    ? `Across ${geo}, buildings and access vary; we adjust layouts, materials, and safety steps for ${st.toLowerCase()} jobs based on those realities. ${kw ? `We keep ${kw} in mind when prioritizing fixes and upgrades.` : "We prioritize fixes and upgrades that match how the space is actually used."}`
    : `${hierarchy ? `For ${hierarchy}, ` : ""}we factor in typical access, finishes, and on-site constraints when planning ${st.toLowerCase()} work so timelines and handoffs stay predictable.`;

  const p3 = `If you are comparing ${st.toLowerCase()} options around ${ln}, use this section to see how we communicate expectations, confirm quality checkpoints, and leave work ready for the next step — without stuffing the page with contact blocks.`;

  return [p1, p2, p3].join("\n\n");
}

function singularizeName(value = "") {
  const input = String(value || "").trim().toLowerCase();
  if (!input) return "";
  if (input.endsWith("ies") && input.length > 4) return `${input.slice(0, -3)}y`;
  if (input.endsWith("sses") || input.endsWith("shes") || input.endsWith("ches")) return input.slice(0, -2);
  if (input.endsWith("s") && !input.endsWith("ss") && input.length > 3) return input.slice(0, -1);
  return input;
}

function normalizeServiceLabel(raw = "") {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "")
    .trim();
}

function dedupeServiceNames(candidateNames = [], existingNames = []) {
  const existingNameSet = new Set(
    existingNames
      .map((n) => normalizeServiceLabel(n).toLowerCase())
      .filter(Boolean)
  );
  const existingSlugSet = new Set(
    existingNames
      .map((n) => slugify(String(n || "").toLowerCase()))
      .filter(Boolean)
  );
  const existingSingularSet = new Set(
    existingNames
      .map((n) => singularizeName(normalizeServiceLabel(n)))
      .filter(Boolean)
  );

  const seen = new Set();
  const cleaned = [];
  for (const item of candidateNames) {
    const display = normalizeServiceLabel(item);
    if (!display) continue;
    const lc = display.toLowerCase();
    const slug = slugify(lc);
    const singular = singularizeName(display);
    if (
      seen.has(lc) ||
      seen.has(slug) ||
      existingNameSet.has(lc) ||
      existingSlugSet.has(slug) ||
      existingSingularSet.has(singular)
    ) {
      continue;
    }
    seen.add(lc);
    seen.add(slug);
    cleaned.push(display);
  }
  return cleaned;
}

function dedupeServiceNamesLoose(candidateNames = [], existingNames = []) {
  const existingNameSet = new Set(
    existingNames
      .map((n) => normalizeServiceLabel(n).toLowerCase())
      .filter(Boolean)
  );
  const existingSlugSet = new Set(
    existingNames
      .map((n) => slugify(String(n || "").toLowerCase()))
      .filter(Boolean)
  );
  const seen = new Set();
  const cleaned = [];
  for (const item of candidateNames) {
    const display = normalizeServiceLabel(item);
    if (!display) continue;
    const lc = display.toLowerCase();
    const slug = slugify(lc);
    if (seen.has(lc) || seen.has(slug) || existingNameSet.has(lc) || existingSlugSet.has(slug)) {
      continue;
    }
    seen.add(lc);
    seen.add(slug);
    cleaned.push(display);
  }
  return cleaned;
}

function coerceNameList(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof input === "string") {
    return input
      .split(/\r?\n|,/)
      .map((x) => String(x || "").trim())
      .filter(Boolean);
  }
  if (typeof input === "object") {
    return Object.values(input).map((x) => String(x || "").trim()).filter(Boolean);
  }
  return [];
}

function parseSelectedLocationIds(input = []) {
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed.map((id) => String(id).trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  if (!Array.isArray(input)) return [];
  return input.map((id) => String(id).trim()).filter(Boolean);
}

/** DB slug for site root; routing treats "home" same as "/" (see pageSlugService). */
const ROOT_HOMEPAGE_SLUG = "home";

function resolveServicePageSlug(serviceDoc = {}) {
  const fromDoc = String(serviceDoc.slug || "").trim();
  if (fromDoc) return fromDoc;
  const fromName = slugify(String(serviceDoc.name || "").trim());
  if (fromName) return fromName;
  return `service-${String(serviceDoc._id || "page")}`;
}

/** Ensure standard business pages exist (never deletes; only creates missing rows). */
async function ensureCoreBusinessWebsitePages(projectId) {
  const CORE_PAGE_SPECS = [
    { name: "home", slug: ROOT_HOMEPAGE_SLUG, displayName: "Home" },
    { name: "about", slug: "about", displayName: "About Us" },
    { name: "services", slug: "services", displayName: "Services" },
    { name: "contact", slug: "contact", displayName: "Contact" },
  ];
  const [project, parent] = await Promise.all([
    UserProject.findById(projectId).select("projectType").lean(),
    BusinessLocation.findOne({ projectId, status: 1, type: 0 })
      .sort({ createdAt: 1, _id: 1 })
      .select("_id")
      .lean(),
  ]);
  const bulk = isBulkProject(project);

  let created = 0;
  for (const spec of CORE_PAGE_SPECS) {
    const exists = await WebsitePage.findOne({ projectId, name: spec.name }).select("_id").lean();
    if (exists) continue;
    await WebsitePage.create({
      projectId,
      name: spec.name,
      slug: spec.slug,
      displayName: spec.displayName,
      pageType: "default",
      componentIds: [],
      ...(spec.name === "home" && parent?._id && !bulk ? { locationId: parent._id } : {}),
    });
    created += 1;
  }
  return { created };
}

async function upsertBusinessServicesAndPages({
  projectId,
  services,
  selectedLocationIds = [],
  selectAll = false,
}) {
  const [project, activeLocationsRaw] = await Promise.all([
    UserProject.findById(projectId).select("projectType").lean(),
    BusinessLocation.find({
      projectId,
      status: 1,
    }).select("_id areaName type parentId locationType"),
  ]);
  const bulk = isBulkProject(project);
  const activeLocations = Array.from(
    new Map(activeLocationsRaw.map((loc) => [String(loc._id), loc])).values()
  );

  if (!activeLocations.length) {
    return {
      error: { status: 400, message: "No active business locations found for this project" },
    };
  }

  const selectedSet = new Set(parseSelectedLocationIds(selectedLocationIds));
  const scopedLocations = selectAll
    ? activeLocations
    : activeLocations.filter((loc) => selectedSet.has(String(loc._id)));
  if (!scopedLocations.length) {
    return {
      error: { status: 400, message: "Please select at least one valid location" },
    };
  }

  const normalizedServiceNames = dedupeServiceNames(services, []);
  const serviceDocs = [];
  for (const rawName of normalizedServiceNames) {
    const normalizedName = rawName.toLowerCase();
    const normalizedSlug =
      slugify(normalizedName) ||
      normalizedName.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    let serviceDoc = await Service.findOne({
      projectId,
      name: normalizedName,
    });
    if (!serviceDoc) {
      serviceDoc = await Service.create({
        projectId,
        name: normalizedName,
        slug: normalizedSlug || `service-${normalizedName.slice(0, 24)}`,
      });
    } else if (!String(serviceDoc.slug || "").trim()) {
      serviceDoc.slug = normalizedSlug || resolveServicePageSlug(serviceDoc);
      await serviceDoc.save();
    }
    serviceDocs.push(serviceDoc);
  }

  const pathByLocationId = buildBusinessLocationPathMap(activeLocations);
  const scopedLocationIdSet = new Set(scopedLocations.map((loc) => String(loc._id)));
  let locationPagesCount = 0;
  let scopedChildLocations = [];

  if (bulk) {
    await ensureBulkGlobalCorePages(projectId);
    const landingResult = await syncBulkLocationLandingPages(projectId);
    scopedChildLocations = scopedLocations.filter((loc) => scopedLocationIdSet.has(String(loc._id)));
    locationPagesCount = landingResult?.upserted || 0;
  } else {
    const parentLocations = activeLocations.filter((loc) => Number(loc?.type) === 0);
    const primaryParentLocation =
      parentLocations.find((loc) => scopedLocationIdSet.has(String(loc._id))) || parentLocations[0] || null;

    scopedChildLocations = activeLocations.filter(
      (loc) => Number(loc?.type) === 1 && scopedLocationIdSet.has(String(loc._id))
    );
    const locationPageOps = [];
    for (const childLoc of scopedChildLocations) {
      const childId = String(childLoc._id);
      const childPath = String(pathByLocationId.get(childId) || "").trim();
      if (!childPath) continue;
      const parent = childLoc?.parentId
        ? activeLocations.find((x) => String(x._id) === String(childLoc.parentId))
        : null;
      const displayName = parent
        ? `${toTitleCaseWords(childLoc.areaName)}, ${toTitleCaseWords(parent.areaName)}`
        : toTitleCaseWords(childLoc.areaName);

      locationPageOps.push({
        updateOne: {
          filter: { projectId, name: `location-${childId}` },
          update: {
            $set: {
              slug: childPath,
              displayName,
              pageType: "default",
              locationId: childLoc._id,
              isPublished: true,
            },
          },
          upsert: true,
        },
      });
    }
    if (locationPageOps.length) {
      await WebsitePage.bulkWrite(locationPageOps, { ordered: false });
    }
    locationPagesCount = locationPageOps.length;

    if (primaryParentLocation?._id) {
      await WebsitePage.updateOne(
        { projectId, name: "home" },
        {
          $set: {
            slug: ROOT_HOMEPAGE_SLUG,
            displayName: "Home",
            pageType: "default",
            locationId: primaryParentLocation._id,
            isPublished: true,
          },
        }
      );
    }
  }

  const pageOps = [];
  if (!serviceDocs.length) {
    return {
      serviceDocs,
      scopedLocations,
      scopedChildLocations,
      pageOpsCount: 0,
      servicePages: [],
      removedDuplicatePages: 0,
      locationPagesCount,
    };
  }

  for (const serviceDoc of serviceDocs) {
    const serviceSlug = resolveServicePageSlug(serviceDoc);
    const displayServiceName = toTitleCaseWords(String(serviceDoc.name || ""));

    if (bulk) {
      const globalPageName = `service-${String(serviceDoc._id)}-global`;
      pageOps.push({
        updateOne: {
          filter: { projectId, name: globalPageName },
          update: {
            $set: {
              slug: serviceSlug,
              displayName: displayServiceName,
              pageType: "service",
              serviceId: serviceDoc._id,
              locationId: null,
              componentIds: ensureHeaderFooterComponents([]),
              isPublished: true,
            },
            $setOnInsert: {
              projectId,
              name: globalPageName,
            },
          },
          upsert: true,
        },
      });

      for (const location of scopedLocations) {
        const locationId = String(location._id);
        const locationPath = String(pathByLocationId.get(locationId) || "").trim();
        const pageSlug = locationPath ? `${locationPath}/${serviceSlug}` : serviceSlug;
        if (!pageSlug) continue;
        const pageName = `service-${String(serviceDoc._id)}-${locationId}`;
        const displayName = `${displayServiceName} in ${toTitleCaseWords(location.areaName)}`;
        pageOps.push({
          updateOne: {
            filter: { projectId, name: pageName },
            update: {
              $set: {
                slug: pageSlug,
                displayName,
                pageType: "service",
                serviceId: serviceDoc._id,
                locationId: location._id,
                componentIds: ensureHeaderFooterComponents([]),
                isPublished: true,
              },
              $setOnInsert: {
                projectId,
                name: pageName,
              },
            },
            upsert: true,
          },
        });
      }
    } else {
      for (const location of scopedLocations) {
        const locationId = String(location._id);
        const isParentLocation = Number(location?.type) === 0;
        const locationPath = String(pathByLocationId.get(locationId) || "").trim();
        const pageSlug = isParentLocation
          ? serviceSlug
          : `${locationPath}/${serviceSlug}`;
        if (!pageSlug) continue;
        const pageName = `service-${String(serviceDoc._id)}-${locationId}`;
        const displayName = isParentLocation
          ? `${displayServiceName}`
          : `${displayServiceName} in ${toTitleCaseWords(location.areaName)}`;
        pageOps.push({
          updateOne: {
            filter: { projectId, name: pageName },
            update: {
              $set: {
                slug: pageSlug,
                displayName,
                pageType: "service",
                serviceId: serviceDoc._id,
                locationId: location._id,
                componentIds: ensureHeaderFooterComponents([]),
                isPublished: true,
              },
              $setOnInsert: {
                projectId,
                name: pageName,
              },
            },
            upsert: true,
          },
        });
      }
    }
  }
  if (pageOps.length) {
    await WebsitePage.bulkWrite(pageOps, { ordered: false });
  }

  const serviceIds = serviceDocs.map((s) => s._id);
  const locationIds = bulk
    ? [...scopedLocations.map((l) => l._id), null]
    : scopedLocations.map((l) => l._id);
  const existingPages = await WebsitePage.find({
    projectId,
    pageType: "service",
    serviceId: { $in: serviceIds },
    locationId: { $in: locationIds },
  })
    .sort({ updatedAt: -1, _id: -1 })
    .select("_id serviceId locationId");

  const keepKeySet = new Set();
  const duplicateIdsToDelete = [];
  for (const page of existingPages) {
    const locKey = page.locationId ? String(page.locationId) : "global";
    const key = `${projectId}-${String(page.serviceId)}-${locKey}-service`;
    if (!keepKeySet.has(key)) keepKeySet.add(key);
    else duplicateIdsToDelete.push(page._id);
  }
  if (duplicateIdsToDelete.length) {
    await WebsitePage.deleteMany({
      _id: { $in: duplicateIdsToDelete },
      projectId,
      pageType: "service",
    });
  }

  const servicePages = await WebsitePage.find({
    projectId,
    pageType: "service",
    serviceId: { $in: serviceIds },
    locationId: { $in: locationIds },
  }).select("_id serviceId locationId slug");

  return {
    serviceDocs,
    scopedLocations,
    scopedChildLocations,
    pageOpsCount: pageOps.length,
    servicePages,
    removedDuplicatePages: duplicateIdsToDelete.length,
    locationPagesCount,
  };
}

function getDesignPageSections(page = {}) {
  if (Array.isArray(page?.sections)) return page.sections;
  if (Array.isArray(page?.componentIds)) return page.componentIds;
  return [];
}

async function buildLocationHasPagesSet(projectId) {
  const hasPagesSet = new Set();
  const [locationPages, servicePages] = await Promise.all([
    WebsitePage.find({ projectId, name: /^location-/ })
      .select("name locationId")
      .lean(),
    WebsitePage.find({
      projectId,
      pageType: "service",
      locationId: { $exists: true, $ne: null },
    })
      .select("locationId")
      .lean(),
  ]);

  for (const page of locationPages || []) {
    if (page?.locationId) hasPagesSet.add(String(page.locationId));
    const match = String(page?.name || "").match(/^location-([a-f\d]{24})$/i);
    if (match) hasPagesSet.add(match[1]);
  }
  for (const page of servicePages || []) {
    if (page?.locationId) hasPagesSet.add(String(page.locationId));
  }
  return hasPagesSet;
}

async function syncLocationPageGeneratedFlags(projectId) {
  const locations = await BusinessLocation.find({ projectId, status: 1 })
    .select("_id pageGenerated")
    .lean();
  if (!locations.length) {
    return { updated: 0, hasPagesSet: new Set() };
  }

  const hasPagesSet = await buildLocationHasPagesSet(projectId);
  const toMarkTrue = locations
    .filter((loc) => hasPagesSet.has(String(loc._id)) && !loc.pageGenerated)
    .map((loc) => loc._id);

  if (toMarkTrue.length) {
    await BusinessLocation.updateMany(
      { _id: { $in: toMarkTrue } },
      { $set: { pageGenerated: true } }
    );
  }

  return { updated: toMarkTrue.length, hasPagesSet };
}

async function loadSectionSelectionFromDesign(projectId) {
  const [designData, websitePages] = await Promise.all([
    WebsiteDesignsData.findOne({ projectId }).lean(),
    WebsitePage.find({ projectId }).select("_id name serviceId").lean(),
  ]);
  if (!designData?.pages?.length) return null;

  const pageSectionIds = new Set();
  const serviceSectionIds = new Set();

  const serviceTemplateDesign = findServiceTemplateDesignPage(designData, websitePages);
  const templatePageId = serviceTemplateDesign
    ? String(serviceTemplateDesign.pageId?._id || serviceTemplateDesign.pageId || "")
    : "";

  extractSectionTypesFromDesignPage(serviceTemplateDesign).forEach((id) => {
    if (isServiceDetailSection(id)) serviceSectionIds.add(id);
  });

  for (const designPage of designData.pages || []) {
    const pid = String(designPage?.pageId?._id || designPage?.pageId || "");
    if (templatePageId && pid === templatePageId) continue;

    for (const comp of getDesignPageSections(designPage)) {
      const sectionId = String(comp?.sectionData?.type || "").toLowerCase().trim();
      if (!sectionId || ["header", "footer", "navbar"].includes(sectionId)) continue;
      if (isServiceTemplateExclusiveSection(sectionId)) continue;
      pageSectionIds.add(sectionId);
    }
  }

  if (!serviceSectionIds.size) {
    MINIMAL_SERVICE_SECTION_FALLBACK.forEach((id) => serviceSectionIds.add(id));
  }
  if (pageSectionIds.has("servicesgrid") || pageSectionIds.has("services")) {
    serviceSectionIds.add("aboutservice");
  }

  return {
    pageSectionIds: sortSectionIdsByCanonicalOrder("home", [...pageSectionIds]),
    serviceSectionIds: sortSectionIdsByCanonicalOrder("service", [...serviceSectionIds]),
    perLocationContentByPage: designData.pageStyles?.perLocationContentByPage || null,
  };
}

async function enqueueContentForNewLocations(projectId, newLocations, options = {}) {
  const { servicePageIds = [], userId = null } = options;
  const [design, project] = await Promise.all([
    loadSectionSelectionFromDesign(projectId),
    UserProject.findById(projectId).select("projectType").lean(),
  ]);
  if (!design) {
    return { contentQueued: false, reason: "no_design_data" };
  }
  const bulk = isBulkProject(project);

  const queueLocations = (newLocations || []).map((loc) => ({
    _id: String(loc._id),
    name: String(loc.areaName || "").trim(),
    parent_id: loc.parentId ? String(loc.parentId) : null,
    type: Number(loc.type || 0),
  }));

  if (!queueLocations.length) {
    return { contentQueued: false, reason: "no_locations" };
  }

  const parentFromBatch =
    newLocations.find((loc) => Number(loc.type) === 0) || null;
  const primaryParent =
    parentFromBatch ||
    (await BusinessLocation.findOne({ projectId, type: 0, status: 1 })
      .sort({ createdAt: 1, _id: 1 })
      .select("_id areaName type parentId")
      .lean());

  const jobs = [];

  if (design.pageSectionIds.length) {
    const pageJob = await enqueueSectionGeneration({
      projectId: String(projectId),
      locations: queueLocations,
      includeDefaultHomepage: !bulk,
      homepageLocationId: bulk ? null : (primaryParent?._id ? String(primaryParent._id) : null),
      selectedSectionIds: design.pageSectionIds,
      perLocationContentByPage: design.perLocationContentByPage,
      userId: userId ? String(userId) : null,
    });
    jobs.push({ pass: "pages", jobId: pageJob?.id || null });
  }

  const scopedServicePageIds = (servicePageIds || [])
    .map((id) => String(id || "").trim())
    .filter((id) => isValidObjectId(id));

  if (design.serviceSectionIds.length && scopedServicePageIds.length) {
    const serviceJob = await enqueueSectionGeneration({
      projectId: String(projectId),
      locations: queueLocations,
      includeDefaultHomepage: false,
      homepageLocationId: bulk ? null : (primaryParent?._id ? String(primaryParent._id) : null),
      selectedSectionIds: design.serviceSectionIds,
      perLocationContentByPage: {
        ...(design.perLocationContentByPage || {}),
        service: true,
      },
      onlyServicePageIds: scopedServicePageIds,
      servicesWizardOnly: true,
      userId: userId ? String(userId) : null,
    });
    jobs.push({ pass: "service", jobId: serviceJob?.id || null });
  }

  return {
    contentQueued: jobs.length > 0,
    jobs,
    pageSectionsCount: design.pageSectionIds.length,
    serviceSectionsCount: design.serviceSectionIds.length,
  };
}

async function generatePagesForNewBusinessLocations(projectId, locationIds = [], options = {}) {
  const { userId = null } = options;
  const query = { projectId, status: 1, pageGenerated: false };
  if (Array.isArray(locationIds) && locationIds.length) {
    query._id = { $in: locationIds.filter((id) => isValidObjectId(id)) };
  }

  const newLocations = await BusinessLocation.find(query)
    .select("_id areaName type parentId")
    .lean();

  if (!newLocations.length) {
    return { newLocationCount: 0, message: "No new locations pending page generation" };
  }

  const newLocationIdList = newLocations.map((l) => String(l._id));
  const existingServices = await Service.find({ projectId }).select("name").lean();
  const serviceNames = existingServices.map((s) => String(s.name || "").trim()).filter(Boolean);

  const result = await upsertBusinessServicesAndPages({
    projectId,
    services: serviceNames,
    selectedLocationIds: newLocationIdList,
    selectAll: false,
  });

  if (result.error) {
    return { error: result.error, newLocationCount: newLocations.length };
  }

  const scopedServicePageIds = (result.servicePages || [])
    .filter((page) => newLocationIdList.includes(String(page.locationId || "")))
    .map((page) => String(page._id));

  const contentResult = await enqueueContentForNewLocations(projectId, newLocations, {
    servicePageIds: scopedServicePageIds,
    userId,
  });

  await BusinessLocation.updateMany(
    { _id: { $in: newLocations.map((l) => l._id) } },
    { $set: { pageGenerated: true } }
  );

  return {
    newLocationCount: newLocations.length,
    servicePagesCreated: result.pageOpsCount || 0,
    locationPagesCreated: result.locationPagesCount || 0,
    servicePageIds: scopedServicePageIds,
    contentQueued: Boolean(contentResult.contentQueued),
    contentJobs: contentResult.jobs || [],
    contentQueueReason: contentResult.reason || null,
  };
}

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id || ""));

async function assertBusinessProjectOwned(projectId, userId) {
  if (!projectId || !userId) return null;
  if (!isValidObjectId(projectId)) return null;

  const project = await UserProject.findById(projectId).exec();
  if (!project) return null;

  // Owner can always access.
  if (String(project.userId) === String(userId)) return project;

  // Super admins can manage any project (same as getUserProjects / dashboard).
  const user = await Users.findById(userId).select("isSuper").lean();
  if (Number(user?.isSuper) === 1) return project;

  return null;
}

async function processBusinessWebsiteCategories(categories, subCategories, microCategories) {
  let categoryId = null;
  const processedSubCategories = [];
  const processedMicroCategories = [];

  if (categories && categories.length > 0) {
    const categoryName = categories[0].trim();
    let category = await ProjectCategory.findOne({ name: categoryName });
    if (!category) {
      category = new ProjectCategory({ name: categoryName, isManual: 1 });
      await category.save();
    }
    categoryId = category._id;
  }

  if (subCategories && subCategories.length > 0 && categoryId) {
    for (const subCatName of subCategories) {
      const trimmedName = subCatName.trim();
      if (!trimmedName) continue;
      let subCategory = await SubCategory.findOne({ categoryId, name: trimmedName });
      if (!subCategory) {
        subCategory = new SubCategory({
          categoryId,
          name: trimmedName,
          isManual: 1,
        });
        await subCategory.save();
      }
      processedSubCategories.push(trimmedName);
    }
  }

  if (microCategories && microCategories.length > 0 && categoryId && processedSubCategories.length > 0) {
    const firstSubCategory = await SubCategory.findOne({
      categoryId,
      name: processedSubCategories[0],
    });
    if (firstSubCategory) {
      for (const microCatName of microCategories) {
        const trimmedName = microCatName.trim();
        if (!trimmedName) continue;
        let microCategory = await MicroCategory.findOne({
          subCategoryId: firstSubCategory._id,
          name: trimmedName,
        });
        if (!microCategory) {
          microCategory = new MicroCategory({
            categoryId,
            subCategoryId: firstSubCategory._id,
            name: trimmedName,
            isManual: 1,
          });
          await microCategory.save();
        }
        processedMicroCategories.push(trimmedName);
      }
    }
  }

  return { categoryId, processedSubCategories, processedMicroCategories };
}

async function pushBusinessLocationToProject(project, locationDoc, locType, parentId) {
  if (!project.locations) project.locations = {};
  if (!project.locations.businessLocations) project.locations.businessLocations = [];
  const alreadyInProject = project.locations.businessLocations.find(
    (l) =>
      l.areaName === locationDoc.areaName &&
      Number(l.type) === locType &&
      String(l.parentId || "") === String(parentId || "")
  );
  if (!alreadyInProject) {
    project.locations.businessLocations.push({
      locationId: locationDoc._id,
      areaName: locationDoc.areaName,
      type: locType,
      parentId: parentId || null,
    });
  }
}

module.exports = {

  // STEP 1 of bussiness Site creation
  createBusinessWebsite: async (req, res) => {
    try {
      let {
        userId,
        serviceType,
        projectName,
        wantImages,
        sectionImageOrigin,
        focusKeyword,
        projectKeywordsText,
        categories,
        subCategories,
        microCategories
      } = req.body;

      console.log(req.body, "logs of body");

      if (!serviceType) serviceType = categories[0];

      let finalWantImages = 1;
      if (wantImages !== undefined && wantImages !== null) {
        const parsed = parseInt(wantImages, 10);
        if (!isNaN(parsed) && parsed === 0) {
          finalWantImages = 0;
        }
      }

      let finalSectionImageOrigin = 1;
      if (sectionImageOrigin !== undefined && sectionImageOrigin !== null) {
        finalSectionImageOrigin = parseSectionOrigin(sectionImageOrigin, 1);
      }

      if (!projectKeywordsText || !focusKeyword) {
        return res.status(400).json({
          message: "projectKeywordsText and focusKeyword are required"
        });
      }

      try {
        categories = normalizeArray(categories, "categories", true);
        subCategories = normalizeArray(subCategories, "subCategories", true);
        microCategories = normalizeArray(microCategories, "microCategories", false);
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!userId) userId = req.user?.userId;
      if (!userId || !projectName) {
        return res.status(400).json({
          message: "userId and projectName are required"
        });
      }

      const {
        processedSubCategories,
        processedMicroCategories,
      } = await processBusinessWebsiteCategories(categories, subCategories, microCategories);

      const newProject = new UserProject({
        userId,
        serviceType,
        projectName,
        projectKeywordsText,
        focusKeyword,
        wantImages: finalWantImages,
        sectionImageOrigin: finalSectionImageOrigin,
        status: 1,
        projectType: 1,
        categories: categories || [],
        subCategories: processedSubCategories,
        microCategories: processedMicroCategories
      });

      const savedProject = await newProject.save();

      console.log(savedProject._id.toString(), "This business website project sent for projectBackgroundQueue From step 1");
      // await projectBackgroundQueue.add({ projectId: savedProject._id.toString() }); (bg redis no need)

      try {
        const user = await Users.findById(userId).select("email username").lean();
        await Notification.create({
          userFromId: userId,
          isSuperAdminNotification: true,
          message: `${user?.username || user?.email || "User"} created new business website "${projectName}"`,
          type: "project_created",
          relatedId: savedProject._id
        });
      } catch (notifError) {
        console.error("Error creating business website creation notification:", notifError);
      }

      return res
        .status(201)
        .json({ message: "Business website created successfully", data: savedProject });
    } catch (error) {
      console.error("Error in createBusinessWebsite:", error);
      return res
        .status(500)
        .json({ message: "An error occurred while processing your request." });
    }
  },

  // Business website wizard — Step 1 (read)
  getBusinessWebsiteBasicInfo: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      return res.status(200).json({
        message: "OK",
        data: {
          projectId: String(project._id),
          projectName: project.projectName || "",
          serviceType: project.serviceType || "",
          projectKeywordsText: project.projectKeywordsText || "",
          focusKeyword: project.focusKeyword || "",
          categories: Array.isArray(project.categories) ? project.categories : [],
          subCategories: Array.isArray(project.subCategories) ? project.subCategories : [],
          microCategories: Array.isArray(project.microCategories) ? project.microCategories : [],
          wantImages: project.wantImages ?? 1,
          sectionImageOrigin: project.sectionImageOrigin ?? 1,
        },
      });
    } catch (error) {
      console.error("getBusinessWebsiteBasicInfo error:", error);
      return res.status(500).json({ message: "Failed to fetch basic info" });
    }
  },

  // Business website wizard — Step 1 (update on return visit)
  updateBusinessWebsiteBasicInfo: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      let {
        serviceType,
        projectName,
        wantImages,
        sectionImageOrigin,
        focusKeyword,
        projectKeywordsText,
        categories,
        subCategories,
        microCategories,
      } = req.body;

      if (!projectKeywordsText || !focusKeyword) {
        return res.status(400).json({
          message: "projectKeywordsText and focusKeyword are required",
        });
      }

      try {
        categories = normalizeArray(categories, "categories", true);
        subCategories = normalizeArray(subCategories, "subCategories", true);
        microCategories = normalizeArray(microCategories, "microCategories", false);
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!projectName) {
        return res.status(400).json({ message: "projectName is required" });
      }

      if (!serviceType) serviceType = categories[0];

      let finalWantImages = project.wantImages ?? 1;
      if (wantImages !== undefined && wantImages !== null) {
        const parsed = parseInt(wantImages, 10);
        if (!isNaN(parsed) && parsed === 0) finalWantImages = 0;
      }

      let finalSectionImageOrigin = project.sectionImageOrigin ?? 1;
      if (sectionImageOrigin !== undefined && sectionImageOrigin !== null) {
        finalSectionImageOrigin = parseSectionOrigin(
          sectionImageOrigin,
          project.sectionImageOrigin ?? 1
        );
      }

      const { processedSubCategories, processedMicroCategories } =
        await processBusinessWebsiteCategories(categories, subCategories, microCategories);

      project.serviceType = serviceType;
      project.projectName = projectName;
      project.projectKeywordsText = projectKeywordsText;
      project.focusKeyword = focusKeyword;
      project.wantImages = finalWantImages;
      project.sectionImageOrigin = finalSectionImageOrigin;
      project.categories = categories || [];
      project.subCategories = processedSubCategories;
      project.microCategories = processedMicroCategories;

      const saved = await project.save();

      return res.status(200).json({
        message: "Basic info updated successfully",
        data: saved,
      });
    } catch (error) {
      console.error("updateBusinessWebsiteBasicInfo error:", error);
      return res.status(500).json({ message: "Failed to update basic info" });
    }
  },

  // Business website wizard — Step 2 (read parent locations)
  getBusinessWebsiteLocations: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      const rows = await BusinessLocation.find({
        projectId,
        type: 0,
        status: 1,
      })
        .select("_id areaName")
        .sort({ areaName: 1 })
        .lean();

      return res.status(200).json({
        message: "OK",
        data: {
          locations: rows.map((row) => ({
            id: String(row._id),
            address: row.areaName,
            createPage: true,
          })),
        },
      });
    } catch (error) {
      console.error("getBusinessWebsiteLocations error:", error);
      return res.status(500).json({ message: "Failed to fetch locations" });
    }
  },

  // Business website wizard — Step 2 (sync parent locations)
  syncBusinessWebsiteLocations: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const { locations } = req.body;

      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      if (!Array.isArray(locations)) {
        return res.status(400).json({ message: "locations array is required" });
      }

      const keptIds = [];

      for (const loc of locations) {
        const areaName = String(loc.areaName || loc.address || "").trim();
        if (!areaName) continue;

        let doc = null;
        const locId = loc.id || loc._id;
        if (isValidObjectId(locId)) {
          doc = await BusinessLocation.findOne({
            _id: locId,
            projectId,
            type: 0,
          });
        }

        if (!doc) {
          doc = await BusinessLocation.findOne({
            projectId,
            type: 0,
            parentId: null,
            areaName,
          });
        }

        const {
          resolveGeoForLocation,
          applyGeoToBusinessLocation,
        } = require("../services/googlePlaces");
        const geo = await resolveGeoForLocation(areaName, loc);

        if (doc) {
          doc.areaName = areaName;
          doc.status = 1;
          doc.locationType = GEO_LOCATION_TYPE.BUSINESS;
          applyGeoToBusinessLocation(doc, geo);
          await doc.save();
        } else {
          doc = await BusinessLocation.create({
            projectId,
            areaName,
            parentId: null,
            type: 0,
            locationType: GEO_LOCATION_TYPE.BUSINESS,
            adminLocationId: null,
            status: 1,
            pageGenerated: false,
            lat: geo.lat,
            lng: geo.lng,
            googlePlaceId: geo.googlePlaceId || undefined,
            formattedAddress: geo.formattedAddress || undefined,
            bounds: geo.bounds || undefined,
            country: geo.country || undefined,
            state: geo.state || undefined,
            city: geo.city || undefined,
          });
        }

        keptIds.push(String(doc._id));
        await pushBusinessLocationToProject(project, doc, 0, null);
      }

      if (keptIds.length) {
        await BusinessLocation.updateMany(
          {
            projectId,
            type: 0,
            status: 1,
            _id: { $nin: keptIds },
          },
          { $set: { status: 0 } }
        );
        await BusinessLocation.updateMany(
          {
            projectId,
            type: 1,
            status: 1,
            parentId: { $nin: keptIds },
          },
          { $set: { status: 0 } }
        );
      }

      await project.save();

      return res.status(200).json({
        message: "Locations synced successfully",
        count: keptIds.length,
      });
    } catch (error) {
      console.error("syncBusinessWebsiteLocations error:", error);
      return res.status(500).json({ message: "Failed to sync locations" });
    }
  },

  // Business website wizard — Step 3 (read local areas grouped by parent)
  getBusinessWebsiteLocalAreas: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      const [parents, children] = await Promise.all([
        BusinessLocation.find({ projectId, type: 0, status: 1 })
          .select("_id areaName")
          .sort({ areaName: 1 })
          .lean(),
        BusinessLocation.find({ projectId, type: 1, status: 1 })
          .select("_id areaName parentId")
          .sort({ areaName: 1 })
          .lean(),
      ]);

      const childrenByParent = children.reduce((map, row) => {
        const key = String(row.parentId || "");
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({
          id: String(row._id),
          name: row.areaName,
          createPage: true,
        });
        return map;
      }, new Map());

      return res.status(200).json({
        message: "OK",
        data: {
          locations: parents.map((parent) => ({
            locationId: String(parent._id),
            locationName: parent.areaName,
            localAreas: childrenByParent.get(String(parent._id)) || [],
            localAreaInput: "",
            generatingAreas: false,
          })),
        },
      });
    } catch (error) {
      console.error("getBusinessWebsiteLocalAreas error:", error);
      return res.status(500).json({ message: "Failed to fetch local areas" });
    }
  },

  // Business website wizard — Step 3 (sync local areas)
  syncBusinessWebsiteLocalAreas: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const { localAreas } = req.body;

      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      if (!Array.isArray(localAreas)) {
        return res.status(400).json({ message: "localAreas array is required" });
      }

      const keptIds = [];

      for (const item of localAreas) {
        const areaName = String(item.areaName || item.name || "").trim();
        const parentId = item.parentId || item.locationId;
        if (!areaName || !isValidObjectId(parentId)) continue;

        const parent = await BusinessLocation.findOne({
          _id: parentId,
          projectId,
          type: 0,
          status: 1,
        });
        if (!parent) continue;

        let doc = null;
        const locId = item.id || item._id;
        if (isValidObjectId(locId)) {
          doc = await BusinessLocation.findOne({
            _id: locId,
            projectId,
            type: 1,
            parentId: parent._id,
          });
        }

        if (!doc) {
          doc = await BusinessLocation.findOne({
            projectId,
            type: 1,
            parentId: parent._id,
            areaName,
          });
        }

        const {
          resolveGeoForLocation,
          applyGeoToBusinessLocation,
        } = require("../services/googlePlaces");
        const geoLabel = [areaName, parent.areaName].filter(Boolean).join(", ");
        const geo = await resolveGeoForLocation(geoLabel, item);

        if (doc) {
          doc.areaName = areaName;
          doc.status = 1;
          doc.locationType = GEO_LOCATION_TYPE.BUSINESS;
          applyGeoToBusinessLocation(doc, geo);
          await doc.save();
        } else {
          doc = await BusinessLocation.create({
            projectId,
            areaName,
            parentId: parent._id,
            type: 1,
            locationType: GEO_LOCATION_TYPE.BUSINESS,
            adminLocationId: null,
            status: 1,
            pageGenerated: false,
            lat: geo.lat,
            lng: geo.lng,
            googlePlaceId: geo.googlePlaceId || undefined,
            formattedAddress: geo.formattedAddress || undefined,
            bounds: geo.bounds || undefined,
            country: geo.country || undefined,
            state: geo.state || undefined,
            city: geo.city || parent.areaName || undefined,
          });
        }

        keptIds.push(String(doc._id));
        await pushBusinessLocationToProject(project, doc, 1, parent._id);
      }

      if (keptIds.length) {
        await BusinessLocation.updateMany(
          {
            projectId,
            type: 1,
            status: 1,
            _id: { $nin: keptIds },
          },
          { $set: { status: 0 } }
        );
      } else {
        await BusinessLocation.updateMany(
          { projectId, type: 1, status: 1 },
          { $set: { status: 0 } }
        );
      }

      await project.save();

      try {
        await syncLocationPageGeneratedFlags(projectId);
      } catch (syncErr) {
        console.warn("[syncBusinessWebsiteLocalAreas] pageGenerated sync warning:", syncErr.message);
      }

      return res.status(200).json({
        message: "Local areas synced successfully",
        count: keptIds.length,
      });
    } catch (error) {
      console.error("syncBusinessWebsiteLocalAreas error:", error);
      return res.status(500).json({ message: "Failed to sync local areas" });
    }
  },

  // Business website wizard — Step 4 (read services; existing names are read-only in UI)
  getBusinessWebsiteServices: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      const services = await Service.find({ projectId })
        .select("_id name slug createdAt updatedAt")
        .sort({ name: 1 })
        .lean();

      return res.status(200).json({
        message: "OK",
        data: {
          project_info: {
            _id: project._id,
            projectName: project.projectName,
          },
          services: services.map((s) => ({
            ...s,
            service_name: s.name,
          })),
          totalServices: services.length,
        },
      });
    } catch (error) {
      console.error("getBusinessWebsiteServices error:", error);
      return res.status(500).json({ message: "Failed to fetch services" });
    }
  },

  // Business website — design settings (theme + font)
  getBusinessWebsiteDesign: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      const themeSettings = await ThemeSetting.findOne({ projectId }).lean();
      if (!themeSettings) {
        return res.status(200).json({
          message: "No design settings saved yet",
          data: {
            theme: "crimson-jet",
            defaultFont: "Inter, sans-serif",
            defaultTypography: {
              fontFamily: "Inter, sans-serif",
              titleFontFamily: "Inter, sans-serif",
              subtitleFontFamily: "Inter, sans-serif",
              descriptionFontFamily: "Inter, sans-serif",
              buttonFontFamily: "Inter, sans-serif",
            },
            customColors: null,
          },
        });
      }

      return res.status(200).json({
        message: "Design settings fetched successfully",
        data: themeSettings,
      });
    } catch (error) {
      console.error("getBusinessWebsiteDesign error:", error);
      return res.status(500).json({ message: "Failed to fetch design settings" });
    }
  },

  // Business website wizard — Step 5 (read contact / AboutUs)
  getBusinessWebsiteContact: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.userId;
      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      const aboutUs = await AboutUs.findOne({ projectId }).sort({ _id: -1 });
      if (!aboutUs) {
        return res.status(200).json({
          message: "No contact information saved yet",
          data: {
            email: "",
            phone: "",
            emails: [{ value: "", is_primary: true }],
            phones: [{ value: "", is_primary: true }],
            address: "",
            mainLocation: "",
            socialLinks: [],
            businessHours: null,
          },
        });
      }

      return res.status(200).json({
        message: "Contact details fetched successfully",
        data: aboutUs,
      });
    } catch (error) {
      console.error("getBusinessWebsiteContact error:", error);
      return res.status(500).json({ message: "Failed to fetch contact details" });
    }
  },

  updateCountryInProject: async (req, res) => {
    try {
      let { projectId, countries, manualCountries } = req.body;
      if (typeof countries === "string") countries = JSON.parse(countries);
      if (typeof manualCountries === "string") manualCountries = JSON.parse(manualCountries);

      if (
        !projectId ||
        (!(Array.isArray(countries) && countries.length)) &&
        (!(Array.isArray(manualCountries) && manualCountries.length))
      ) {
        return res.status(400).json({
          message: "Project ID and at least one country (selected or manual) are required!"
        });
      }

      if (Array.isArray(manualCountries) && manualCountries.length) {
        const all = await Country.find().select("id").lean();
        const nums = all.map((c) => parseInt(c.id, 10)).filter((n) => !isNaN(n));
        let nextId = nums.length ? Math.max(...nums) + 1 : 1;

        for (let mc of manualCountries) {
          const rawName = mc.name.trim();
          const words = rawName.split(/\s+/);
          const name = words
            .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
          const sortname = words.map((w) => w[0].toUpperCase()).join("");
          const status = mc.status === 0 ? 0 : 1;

          let existing = await Country.findOne({ name, manual: 1 });
          let idStr = existing ? existing.id : (nextId++).toString();
          if (!existing) {
            await new Country({ id: idStr, sortname, name, manual: 1 }).save();
          }

          countries.push({ countryId: idStr, name, status });
        }
      }

      const enriched = [];
      for (let c of countries) {
        let { countryId, name } = c;
        let status = c.status === 0 ? 0 : 1;
        let doc = await Country.findOne({ id: countryId });
        let lat = doc?.lat ?? null;
        let lng = doc?.lng ?? null;

        if (lat == null || lng == null) {
          try {
            const geo = await axios.get("https://us1.locationiq.com/v1/search.php", {
              params: {
                key: process.env.LOCATIONIQ_API_KEY,
                q: name,
                format: "json",
                limit: 1
              }
            });
            const loc = geo.data[0];
            lat = loc.lat;
            lng = loc.lon;
            if (lat && lng) {
              await Country.updateOne({ id: countryId }, { $set: { lat, lng } });
            }
          } catch (err) {
            console.error(`Geocode failed for ${name}:`, err.message);
          }
        }

        enriched.push({ countryId, name, lat, lng, bounds: { southwest: null, northeast: null }, status });
      }

      const isCountry = enriched.some((e) => e.status === 1) ? 1 : 0;
      const project = await UserProject.findByIdAndUpdate(
        projectId,
        { $set: { "locations.country": enriched, isCountry } },
        { new: true }
      );
      if (!project) return res.status(404).json({ message: "Project not found!" });

      for (let entry of enriched) {
        if (entry.status !== 1) continue;
        const slugText = slugify(entry.name, { lower: true });
        const showName = entry.name.charAt(0).toUpperCase() + entry.name.slice(1).toLowerCase();

        const exists = await Slug.findOne({
          slug: slugText,
          slugService: slugText,
          slugType: "country",
          locationId: entry.countryId,
          showName: showName,
          projectId
        });

        if (!exists) {
          await Slug.create({
            slug: slugText,
            slugService: slugText,
            slugType: "country",
            locationId: entry.countryId,
            projectId,
            showName: showName
          });
        } else {
          console.log("slug already exists", slugText);
        }
      }

      try {
        await syncCountriesToBusinessLocations(projectId, project.locations.country || []);
      } catch (syncErr) {
        console.error("[updateCountryInProject] geo BusinessLocation sync:", syncErr.message);
      }

      return res.status(200).json({
        message: "Countries updated successfully!",
        data: project
      });
    } catch (error) {
      console.error("Error in updateCountryInProject:", error);
      return res.status(500).json({ message: "An error occurred." });
    }
  },

  updateStateInProject: async (req, res) => {
    try {
      let { projectId, states, manualStates } = req.body;
      if (typeof states === "string") states = JSON.parse(states);
      if (typeof manualStates === "string") manualStates = JSON.parse(manualStates);

      if (
        !projectId ||
        ((!Array.isArray(states) || !states.length) &&
          (!Array.isArray(manualStates) || !manualStates.length))
      ) {
        return res.status(400).json({
          message: "Project ID and at least one state (selected or manual) are required!"
        });
      }

      if (Array.isArray(manualStates) && manualStates.length) {
        const all = await State.find().select("id").lean();
        const nums = all.map((c) => parseInt(c.id, 10)).filter((n) => !isNaN(n));
        let nextId = nums.length ? Math.max(...nums) + 1 : 1;

        for (let ms of manualStates) {
          const { countryId, name: rawName } = ms;
          const status = ms.status === 0 ? 0 : 1;
          const words = rawName.trim().split(/\s+/);
          const name = words
            .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");

          let existing = await State.findOne({ name, manual: 1, country_id: countryId });
          let idStr = existing ? existing.id : (nextId++).toString();
          if (!existing) {
            await new State({ id: idStr, name, country_id: countryId, manual: 1 }).save();
          }
          states.push({ countryId, stateId: idStr, name, status });
        }
      }

      const isState = (states || []).some((s) => s.status === 1) ? 1 : 0;
      const project = await UserProject.findByIdAndUpdate(
        projectId,
        { $set: { "locations.state": states, isState } },
        { new: true }
      );
      if (!project) return res.status(404).json({ message: "Project not found!" });

      for (let entry of states) {
        const countryEntry = project.locations.country.find((c) => c.countryId === entry.countryId);

        const country = await Country.findOne({ id: entry.countryId }).select("sortname name");
        const sortName = country && country.sortname ? country.sortname : null;
        const countryName = country && country.name ? country.name : (countryEntry ? countryEntry.name : "");

        let showName;
        if (sortName && sortName.trim()) {
          showName = `${entry.name}, ${sortName}`;
        } else if (countryName && countryName.trim()) {
          showName = `${entry.name}, ${countryName}`;
        } else {
          showName = entry.name;
        }

        const prefix = countryEntry?.status === 1
          ? slugify(countryEntry.name, { lower: true }) + "/"
          : "";
        const fullSlug = prefix + slugify(entry.name, { lower: true });

        const exists = await Slug.findOne({
          slug: fullSlug,
          slugType: "state",
          locationId: entry.stateId,
          showName: showName,
          projectId
        });
        if (!exists) {
          await Slug.create({
            slug: fullSlug,
            slugType: "state",
            locationId: entry.stateId,
            showName: showName,
            projectId
          });
        }
      }

      try {
        await syncStatesToBusinessLocations(projectId, project.locations.state || []);
      } catch (syncErr) {
        console.error("[updateStateInProject] geo BusinessLocation sync:", syncErr.message);
      }

      return res.status(200).json({
        message: "States updated successfully!",
        data: project
      });
    } catch (error) {
      console.error("Error in updateStateInProject:", error);
      return res.status(500).json({ message: "An error occurred." });
    }
  },

  updateCityInProject: async (req, res) => {
    try {
      let { projectId, cities, manualCities } = req.body;
      if (typeof cities === "string") cities = JSON.parse(cities);
      if (typeof manualCities === "string") manualCities = JSON.parse(manualCities);

      if (
        !projectId ||
        ((!Array.isArray(cities) || !cities.length) &&
          (!Array.isArray(manualCities) || !manualCities.length))
      ) {
        return res.status(400).json({
          message: "Project ID and at least one city (selected or manual) are required!"
        });
      }

      if (Array.isArray(manualCities) && manualCities.length) {
        const all = await City.find().select("id").lean();
        const nums = all.map((c) => parseInt(c.id, 10)).filter((n) => !isNaN(n));
        let nextId = nums.length ? Math.max(...nums) + 1 : 1;

        for (let mc of manualCities) {
          const { stateId, name: rawName } = mc;
          const status = mc.status === 0 ? 0 : 1;
          const name = rawName
            .trim()
            .split(/\s+/)
            .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");

          let existing = await City.findOne({ name, state_id: stateId, manual: 1 });
          let idStr = existing ? existing.id : (nextId++).toString();
          if (!existing) {
            await new City({
              id: idStr,
              name,
              state_id: stateId,
              manual: 1
            }).save();
          }

          cities.push({ stateId, cityId: idStr, name, status });
        }
      }

      const cityData = (cities || []).map((c) => ({
        stateId: c.stateId,
        cityId: c.cityId,
        name: c.name,
        status: c.status === 0 ? 0 : 1
      }));
      const isCity = cityData.some((c) => c.status === 1) ? 1 : 0;

      const project = await UserProject.findByIdAndUpdate(
        projectId,
        { $set: { "locations.city": cityData, isCity } },
        { new: true }
      );
      if (!project) {
        return res.status(404).json({ message: "Project not found!" });
      }

      for (let entry of cityData) {
        const stateEntry = project.locations.state.find(
          (s) => String(s.stateId) === String(entry.stateId)
        );
        const countryEntry = stateEntry
          ? project.locations.country.find(
            (c) => String(c.countryId) === String(stateEntry.countryId)
          )
          : null;

        const state = await State.findOne({ id: entry.stateId }).select("sortname name");
        const sortNameOfState = state && state.sortname ? state.sortname : null;
        const stateName = state && state.name ? state.name : (stateEntry ? stateEntry.name : "");

        let showName;
        if (sortNameOfState && sortNameOfState.trim()) {
          showName = `${entry.name}, ${sortNameOfState}`;
        } else if (stateName && stateName.trim()) {
          showName = `${entry.name}, ${stateName}`;
        } else {
          showName = entry.name;
        }

        const slugParts = [];
        if (countryEntry && countryEntry.status === 1) {
          slugParts.push(slugify(countryEntry.name, { lower: true }));
        }
        if (stateEntry && stateEntry.status === 1) {
          slugParts.push(slugify(stateEntry.name, { lower: true }));
        }
        slugParts.push(slugify(entry.name, { lower: true }));

        const fullSlug = slugParts.join("/");

        const exists = await Slug.findOne({
          slug: fullSlug,
          slugType: "city",
          locationId: entry.cityId,
          showName: showName,
          projectId
        });
        if (!exists) {
          await Slug.create({
            slug: fullSlug,
            slugType: "city",
            locationId: entry.cityId,
            showName: showName,
            projectId
          });
        }
      }

      try {
        await syncCitiesToBusinessLocations(projectId, project.locations.city || []);
      } catch (syncErr) {
        console.error("[updateCityInProject] geo BusinessLocation sync:", syncErr.message);
      }

      return res.status(200).json({
        message: "Cities updated successfully!",
        data: project
      });
    } catch (error) {
      console.error("Error in updateCityInProject:", error);
      return res.status(500).json({ message: "An error occurred." });
    }
  },

  updateLocalAreaInProject: async (req, res) => {
    try {
      const { projectId, localAreas } = req.body;
      if (!projectId || !Array.isArray(localAreas)) {
        return res.status(400).json({
          message: "projectId and localAreas (array) are required"
        });
      }

      const existing = await AdminLocalArea.find().select("id").lean();
      const nums = existing
        .map((a) => parseInt(a.id, 10))
        .filter((n) => !isNaN(n));
      let nextId = nums.length ? Math.max(...nums) + 1 : 1;
      const payload = [];

      for (let la of localAreas) {
        const { name: rawName, cityId } = la;
        const name = rawName
          .trim()
          .split(/\s+/)
          .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");

        const {
          resolveGeoForLocation,
          extractGeoFromPayload,
        } = require("../services/googlePlaces");
        let geo = extractGeoFromPayload(la);
        if (geo.lat == null || geo.lng == null) {
          const cityDoc = cityId
            ? await City.findOne({ id: String(cityId) }).select("name lat lng").lean()
            : null;
          const label = [name, cityDoc?.name].filter(Boolean).join(", ");
          geo = await resolveGeoForLocation(label, la);
          // Prefer city coords as last resort for neighborhood names
          if ((geo.lat == null || geo.lng == null) && cityDoc?.lat != null && cityDoc?.lng != null) {
            geo.lat = cityDoc.lat;
            geo.lng = cityDoc.lng;
          }
        }

        let area = await AdminLocalArea.findOne({
          name,
          city_id: cityId,
          manual: 1
        });
        if (!area) {
          const idStr = (nextId++).toString();
          area = await new AdminLocalArea({
            id: idStr,
            name,
            city_id: cityId,
            manual: 1,
            lat: geo.lat,
            lng: geo.lng,
          }).save();
        } else if (geo.lat != null && geo.lng != null) {
          area.lat = geo.lat;
          area.lng = geo.lng;
          await area.save();
        }
        payload.push({
          localAreaId: area.id,
          name,
          cityId,
          lat: area.lat ?? geo.lat ?? null,
          lng: area.lng ?? geo.lng ?? null,
          googlePlaceId: geo.googlePlaceId || null,
          formattedAddress: geo.formattedAddress || null,
        });
      }

      const project = await UserProject.findByIdAndUpdate(
        projectId,
        { $set: { "locations.localArea": payload, isLocal: 1 } },
        { new: true }
      );
      if (!project) {
        return res.status(404).json({ message: "Project not found!" });
      }

      for (let area of project.locations.localArea) {
        const cityEntry = project.locations.city.find(
          (c) => String(c.cityId) === String(area.cityId)
        );
        const stateEntry = cityEntry
          ? project.locations.state.find(
            (s) => String(s.stateId) === String(cityEntry.stateId)
          )
          : null;
        const countryEntry = stateEntry
          ? project.locations.country.find(
            (c) => String(c.countryId) === String(stateEntry.countryId)
          )
          : null;

        const slugParts = [];
        if (countryEntry && countryEntry.status === 1) {
          slugParts.push(slugify(countryEntry.name, { lower: true }));
        }
        if (stateEntry && stateEntry.status === 1) {
          slugParts.push(slugify(stateEntry.name, { lower: true }));
        }
        if (cityEntry && cityEntry.status === 1) {
          slugParts.push(slugify(cityEntry.name, { lower: true }));
        }
        slugParts.push(slugify(area.name, { lower: true }));

        const fullSlug = slugParts.join("/");

        let citySortName = null;
        let cityName = null;

        if (cityEntry && cityEntry.cityId) {
          const city = await City.findOne({ id: cityEntry.cityId }).select("sortname name").lean();
          citySortName = city && city.sortname ? city.sortname : null;
          cityName = city && city.name ? city.name : (cityEntry.name || null);
        }

        let showName;
        if (citySortName && citySortName.trim()) {
          showName = `${area.name}, ${citySortName}`;
        } else if (cityName && cityName.trim()) {
          showName = `${area.name}, ${cityName}`;
        } else {
          showName = area.name;
        }

        const exists = await Slug.findOne({
          slug: fullSlug,
          slugType: "local_area",
          locationId: area.localAreaId,
          showName: showName,
          projectId
        });
        if (!exists) {
          await Slug.create({
            slug: fullSlug,
            slugType: "local_area",
            locationId: area.localAreaId,
            showName: showName,
            projectId
          });
        }
      }

      try {
        await syncLocalAreasToBusinessLocations(projectId, project.locations.localArea || []);
      } catch (syncErr) {
        console.error("[updateLocalAreaInProject] geo BusinessLocation sync:", syncErr.message);
      }

      return res.status(200).json({
        message: "Local areas updated successfully",
        data: project
      });
    } catch (error) {
      console.error("Error in updateLocalAreaInProject:", error);
      return res.status(500).json({ message: "An error occurred." });
    }
  },

  getProjectLocationsHierarchy: async (req, res) => {
    try {
      const projectId = req.query.projectId || req.body.projectId;
      if (!projectId) return res.status(400).json({ message: "projectId is required" });

      const proj = await UserProject.findById(projectId)
        .select("projectType locations")
        .lean();
      if (!proj) return res.status(404).json({ message: "Project not found" });

      // Prefer BusinessLocation hierarchy (business sites + synced bulk sites).
      // AI blog generator / pickers need parent + child nodes selectable independently.
      const bizRows = await BusinessLocation.find({ projectId, status: 1 })
        .select("_id areaName type parentId locationType")
        .lean();

      if (bizRows.length > 0 || Number(proj.projectType) === 1) {
        const byId = new Map(bizRows.map((r) => [String(r._id), r]));
        const childrenByParent = new Map();
        for (const r of bizRows) {
          const parentKey = r.parentId ? String(r.parentId) : "__root__";
          if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
          childrenByParent.get(parentKey).push(r);
        }

        const walk = (node) => {
          const id = String(node._id);
          const children = (childrenByParent.get(id) || []).map(walk);
          children.sort((a, b) => a.name.localeCompare(b.name));
          const isParent = Number(node.type) === 0;
          return {
            id,
            name: node.areaName,
            type: Number(node.type || 0),
            locationType: node.locationType != null ? Number(node.locationType) : null,
            parentId: node.parentId ? String(node.parentId) : null,
            label: isParent ? "Parent" : "Local area",
            children,
          };
        };

        const roots = bizRows
          .filter((r) => !r.parentId || !byId.has(String(r.parentId)))
          .map(walk)
          .sort((a, b) => a.name.localeCompare(b.name));

        return res.status(200).json({
          message: "OK",
          data: roots,
          meta: {
            source: "business_locations",
            total: bizRows.length,
            parents: bizRows.filter((r) => Number(r.type) === 0).length,
            children: bizRows.filter((r) => Number(r.type) === 1).length,
          },
        });
      }

      // Bulk-site fallback: embedded country → state → city → localArea
      const loc = proj.locations || {};
      const countries = Array.isArray(loc.country) ? loc.country : [];
      const states = Array.isArray(loc.state) ? loc.state : [];
      const cities = Array.isArray(loc.city) ? loc.city : [];
      const locals = Array.isArray(loc.localArea) ? loc.localArea : [];

      const isActive = (x) => x?.status === 1 || x?.status === "1" || x?.status === true;
      const hasName = (x) => typeof x?.name === "string" && x.name.trim().length > 0;

      const allStatesById = states.reduce((m, s) => {
        const id = String(s.stateId || "");
        if (id) m[id] = s;
        return m;
      }, {});
      const allCitiesById = cities.reduce((m, c) => {
        const id = String(c.cityId || "");
        if (id) m[id] = c;
        return m;
      }, {});

      const A_COUNTRY = countries.filter((c) => isActive(c) && hasName(c));
      const A_STATE = states.filter((s) => isActive(s) && hasName(s));
      const A_CITY = cities.filter((c) => isActive(c) && hasName(c));
      const A_LOCAL = locals.filter((l) => isActive(l) && hasName(l));

      const countryNodesById = {};
      const stateNodesById = {};
      const cityNodesById = {};
      const roots = [];

      for (const c of A_COUNTRY) {
        const node = {
          name: c.name,
          id: String(c.countryId || ""),
          type: 0,
          label: "Country",
          children: [],
        };
        countryNodesById[node.id] = node;
        roots.push(node);
      }

      for (const s of A_STATE) {
        const node = {
          name: s.name,
          id: String(s.stateId || ""),
          type: 0,
          label: "State",
          children: [],
        };
        stateNodesById[node.id] = node;
        const parentCountry = countryNodesById[String(s.countryId || "")];
        if (parentCountry) parentCountry.children.push(node);
        else roots.push(node);
      }

      for (const c of A_CITY) {
        const node = {
          name: c.name,
          id: String(c.cityId || ""),
          type: 0,
          label: "City",
          children: [],
        };
        cityNodesById[node.id] = node;

        const sId = String(c.stateId || "");
        const activeState = stateNodesById[sId];
        if (activeState) {
          activeState.children.push(node);
          continue;
        }

        const stateRec = allStatesById[sId];
        const activeCountry = stateRec && countryNodesById[String(stateRec.countryId || "")];
        if (activeCountry) activeCountry.children.push(node);
        else roots.push(node);
      }

      for (const l of A_LOCAL) {
        const node = {
          name: l.name,
          id: String(l.localAreaId || ""),
          type: 1,
          label: "Local area",
          children: [],
        };

        const cId = String(l.cityId || "");
        const activeCity = cityNodesById[cId];
        if (activeCity) {
          activeCity.children.push(node);
          continue;
        }

        const cityRec = allCitiesById[cId];
        const sId = String(cityRec?.stateId || "");
        const activeState = stateNodesById[sId];
        if (activeState) {
          activeState.children.push(node);
          continue;
        }

        const stateRec = allStatesById[sId];
        const activeCountry = stateRec && countryNodesById[String(stateRec.countryId || "")];
        if (activeCountry) activeCountry.children.push(node);
        else roots.push(node);
      }

      const sortRec = (n) => {
        if (!n.children?.length) return;
        n.children.sort((a, b) => a.name.localeCompare(b.name));
        n.children.forEach(sortRec);
      };
      roots.sort((a, b) => a.name.localeCompare(b.name));
      roots.forEach(sortRec);

      return res.status(200).json({
        message: "OK",
        data: roots,
        meta: { source: "embedded_locations", total: roots.length },
      });
    } catch (err) {
      console.error("getProjectLocationsHierarchy error:", err);
      return res.status(500).json({ message: "Failed to fetch project locations" });
    }
  },

  // Business website step-2 APIs and also Step 3 api
  saveBusinessLocation: async (req, res) => {
    try {
      const { projectId, locations } = req.body;
      const userId = req.user.userId;

      if (!projectId || !Array.isArray(locations)) {
        return res.status(400).json({
          message: "projectId and locations array required",
        });
      }

      const project = await UserProject.findOne({
        _id: projectId,
        userId,
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const createdLocations = [];

      for (const loc of locations) {
        if (!loc.areaName) continue;

        const locType = Number(loc.type ?? 0);
        const parentId = locType === 1 ? loc.parentId : null;

        // ✅ FIX: correct duplicate check
        const exists = await BusinessLocation.findOne({
          projectId,
          areaName: loc.areaName,
          type: locType,
          parentId: parentId || null,
        });

        if (!exists) {
          const {
            resolveGeoForLocation,
          } = require("../services/googlePlaces");
          const geo = await resolveGeoForLocation(loc.areaName, loc);
          const newLoc = await BusinessLocation.create({
            projectId,
            areaName: loc.areaName,
            parentId: parentId,
            type: locType,
            createPage: loc.createPage ?? true,
            status: 1,
            pageGenerated: false,
            locationType: GEO_LOCATION_TYPE.BUSINESS,
            lat: geo.lat,
            lng: geo.lng,
            googlePlaceId: geo.googlePlaceId || undefined,
            formattedAddress: geo.formattedAddress || undefined,
            bounds: geo.bounds || undefined,
          });

          createdLocations.push(newLoc);

          // ✅ ensure structure exists
          if (!project.locations) project.locations = {};
          if (!project.locations.businessLocations)
            project.locations.businessLocations = [];

          // ✅ FIX: avoid duplicate in project array
          const alreadyInProject =
            project.locations.businessLocations.find(
              (l) =>
                l.areaName === newLoc.areaName &&
                Number(l.type) === locType &&
                String(l.parentId || "") === String(parentId || "")
            );

          if (!alreadyInProject) {
            project.locations.businessLocations.push({
              locationId: newLoc._id,
              areaName: newLoc.areaName,
              type: locType,
              parentId: parentId || null,
            });
          }
        }
      }

      await project.save();

      return res.status(201).json({
        message: "Locations saved",
        count: createdLocations.length,
        data: createdLocations,
      });

    } catch (err) {
      console.error("saveBusinessLocation error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },

  //STEP 3 API

  fetchBusinessLocations: async (req, res) => {
    try {
      const { projectId } = req.body;
      const userId = req.user.userId;

      if (!projectId) {
        return res.status(400).json({
          message: "projectId is required"
        });
      }

      const project = await UserProject.findOne({
        _id: projectId,
        userId: userId
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found or you do not have permission"
        });
      }

      const businessLocations = await BusinessLocation.find({
        projectId: projectId,
        type: 0,
        status: 1
      }).select("_id areaName").lean();

      return res.status(200).json({
        message: "Business locations fetched successfully",
        data: businessLocations
      });
    } catch (error) {
      console.error("Error in fetchBusinessLocations:", error);
      return res.status(500).json({
        message: "An error occurred while fetching business locations"
      });
    }
  },

  getBusinessLocationHierarchy: async (req, res) => {
    try {
      const projectId = req.body.projectId || req.query.projectId;
      const includeInactive =
        req.body.includeInactive === true ||
        req.body.includeInactive === "true" ||
        req.query.includeInactive === "true";
      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }

      let hasPagesSet = new Set();
      if (includeInactive) {
        const syncResult = await syncLocationPageGeneratedFlags(projectId);
        hasPagesSet = syncResult.hasPagesSet || new Set();
      } else {
        hasPagesSet = await buildLocationHasPagesSet(projectId);
      }

      const locQuery = { projectId };
      if (!includeInactive) locQuery.status = 1;

      const rows = await BusinessLocation.find(locQuery)
        .select("_id areaName type parentId status pageGenerated")
        .lean();
      const byId = new Map(rows.map((r) => [String(r._id), r]));
      const roots = [];
      const childrenByParent = new Map();
      rows.forEach((r) => {
        const parentKey = r.parentId ? String(r.parentId) : "__root__";
        if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
        childrenByParent.get(parentKey).push(r);
      });
      const walk = (node) => {
        const id = String(node._id);
        const children = (childrenByParent.get(id) || []).map(walk);
        children.sort((a, b) => a.name.localeCompare(b.name));
        const hasPages = hasPagesSet.has(id);
        return {
          id,
          name: node.areaName,
          type: Number(node.type || 0),
          parentId: node.parentId ? String(node.parentId) : null,
          status: Number(node.status ?? 1),
          enabled: Number(node.status ?? 1) === 1,
          hasPages,
          pageGenerated: Boolean(node.pageGenerated) || hasPages,
          children,
        };
      };
      rows
        .filter((r) => !r.parentId || !byId.has(String(r.parentId)))
        .map(walk)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((n) => roots.push(n));

      const pendingCount = rows.filter((r) => {
        if (Number(r.status) !== 1) return false;
        const id = String(r._id);
        return !hasPagesSet.has(id) && !r.pageGenerated;
      }).length;

      return res.status(200).json({
        message: "OK",
        data: roots,
        meta: { total: rows.length, pendingPageGeneration: pendingCount },
      });
    } catch (error) {
      console.error("getBusinessLocationHierarchy error:", error);
      return res.status(500).json({ message: "Failed to fetch location hierarchy" });
    }
  },

  toggleBusinessLocationStatus: async (req, res) => {
    try {
      const { projectId, locationId, status, enabled } = req.body;
      const userId = req.user?.userId;
      if (!projectId || !locationId) {
        return res.status(400).json({ message: "projectId and locationId are required" });
      }

      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      let nextStatus = status;
      if (nextStatus === undefined && enabled !== undefined) {
        nextStatus = enabled ? 1 : 0;
      }
      nextStatus = Number(nextStatus);
      if (![0, 1].includes(nextStatus)) {
        return res.status(400).json({ message: "status must be 0 or 1" });
      }

      const location = await BusinessLocation.findOne({ _id: locationId, projectId });
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      location.status = nextStatus;
      await location.save();

      if (nextStatus === 0) {
        await WebsitePage.updateMany(
          { projectId, locationId: location._id },
          { $set: { isPublished: false } }
        );
      }

      return res.status(200).json({
        message: nextStatus === 1 ? "Location enabled" : "Location disabled",
        data: {
          id: String(location._id),
          status: location.status,
          enabled: location.status === 1,
        },
      });
    } catch (error) {
      console.error("toggleBusinessLocationStatus error:", error);
      return res.status(500).json({ message: "Failed to update location status" });
    }
  },

  generateBusinessLocationPages: async (req, res) => {
    try {
      const { projectId, locationIds = [] } = req.body;
      const userId = req.user?.userId;
      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }

      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      const result = await generatePagesForNewBusinessLocations(projectId, locationIds, {
        userId: req.user?.userId,
      });
      if (result.error) {
        return res.status(result.error.status).json({ message: result.error.message });
      }

      if (!result.newLocationCount) {
        return res.status(200).json({
          message: "All locations already have pages — nothing new to generate",
          data: result,
        });
      }

      const contentNote = result.contentQueued
        ? " Section content generation has been queued for the new locations."
        : result.contentQueueReason === "no_design_data"
          ? " Complete Step 6 (design) in the wizard to enable automatic section content for new locations."
          : "";

      return res.status(200).json({
        message: `Pages generated for new locations successfully.${contentNote}`,
        data: result,
      });
    } catch (error) {
      console.error("generateBusinessLocationPages error:", error);
      return res.status(500).json({ message: "Failed to generate location pages" });
    }
  },

  toggleWebsitePagePublished: async (req, res) => {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const { pageId, isPublished } = req.body;
      const userId = req.user?.userId;

      if (!projectId || !pageId) {
        return res.status(400).json({ message: "projectId and pageId are required" });
      }

      const project = await assertBusinessProjectOwned(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found or you do not have permission" });
      }

      const page = await WebsitePage.findOne({ _id: pageId, projectId });
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }

      page.isPublished = isPublished !== false;
      await page.save();

      return res.status(200).json({
        message: page.isPublished ? "Page is now visible on the website" : "Page hidden from the website",
        data: { pageId: String(page._id), isPublished: page.isPublished },
      });
    } catch (error) {
      console.error("toggleWebsitePagePublished error:", error);
      return res.status(500).json({ message: "Failed to update page visibility" });
    }
  },

  createProjectServicesWizard: async (req, res) => {
    try {
      let {
        projectId,
        source = "manual",
        requestedCount = 0,
        manualServiceNames = [],
        selectedLocationIds = [],
        selectAll = false,
        generateContent = true,
        selectedSectionIds = [],
      } = req.body || {};

      if (!projectId) return res.status(400).json({ message: "projectId is required" });
      const project = await UserProject.findById(projectId).select("_id userId projectName").lean();
      if (!project) return res.status(404).json({ message: "Project not found" });

      const existing = await Service.find({ projectId }).select("name").lean();
      const existingNames = existing.map((s) => String(s.name || "")).filter(Boolean);

      let candidateNames = [];
      const fallbackRawNames = [
        ...coerceNameList(manualServiceNames),
        ...coerceNameList(req.body?.services),
        ...coerceNameList(req.body?.manualServicesText),
        ...coerceNameList(req.body?.wizardNames),
      ];
      const providedNames = dedupeServiceNamesLoose(fallbackRawNames, existingNames);

      if (source === "ai" && providedNames.length > 0) {
        // Use step-1 reviewed names from UI; do NOT re-generate on finish.
        candidateNames = providedNames;
      } else if (source === "ai") {
        const n = Math.max(1, Math.min(Number(requestedCount) || 10, 50));
        const previewPrompt = `Generate EXACTLY ${n} unique service names as JSON array of strings only.
Exclude existing names: ${existingNames.join(" | ") || "none"}.`;
        let retries = 0;
        while (candidateNames.length < n && retries < 3) {
          retries += 1;
          let generated = [];
          try {
            generated = await fetchJSONFromOpenAI(previewPrompt, "GENERATE_AI_SERVICE_NAMES_WIZARD", {
              userId: String(project.userId || ""),
              projectId: String(projectId),
              promptFrom: "controller",
              promptFor: "Services Wizard",
            });
          } catch (_err) {
            generated = [];
          }
          const raw = Array.isArray(generated) ? generated : [];
          const flattened = raw.map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              return String(item.service_title || item.title || item.name || "").trim();
            }
            return "";
          }).filter(Boolean);
          const unique = dedupeServiceNames([...candidateNames, ...flattened], existingNames);
          candidateNames = unique.slice(0, n);
          if (candidateNames.length >= n) break;
        }
      } else {
        candidateNames = providedNames;
      }

      if (!candidateNames.length) {
        console.log("No unique service names available after filtering", {
          source,
          providedCount: Array.isArray(manualServiceNames) ? manualServiceNames.length : 0,
          existingCount: existingNames.length,
          sampleProvided: Array.isArray(manualServiceNames) ? manualServiceNames.slice(0, 5) : [],
        });
        return res.status(400).json({
          message: "No unique service names available after filtering",
          source,
          providedCount: fallbackRawNames.length,
          existingCount: existingNames.length,
        });
      }

      const upsertResult = await upsertBusinessServicesAndPages({
        projectId,
        services: candidateNames,
        selectedLocationIds,
        selectAll: Boolean(selectAll),
      });
      if (upsertResult.error) {
        console.log("upsertResult.error", upsertResult.error);
        return res.status(upsertResult.error.status).json({ message: upsertResult.error.message });
      }

      let contentQueued = false;
      let sectionsQueued = false;
      if (Boolean(generateContent)) {
        const serviceOnlySections =
          Array.isArray(selectedSectionIds) && selectedSectionIds.length > 0
            ? selectedSectionIds
            : ["servicehero", "aboutservice", "faq"];
        const newServiceIds = (upsertResult.serviceDocs || []).map((s) => String(s._id));
        const newServicePageIds = (upsertResult.servicePages || []).map((p) => String(p._id));
        const fakeReq = {
          body: {
            projectId,
            selectedSectionIds: serviceOnlySections,
            selectedLocationIds: upsertResult.scopedLocations.map((l) => String(l._id)),
            selectAll: false,
            perLocationContentByPage: { service: true },
            onlyServiceIds: newServiceIds,
            onlyServicePageIds: newServicePageIds,
            servicesWizardOnly: true,
          },
          user: req.user,
        };
        await module.exports.enqueueSectionsContnetGeneration(
          fakeReq,
          { status: () => ({ json: () => undefined }) }
        );
        contentQueued = true;
        sectionsQueued = true;
      }

      try {
        await syncHeaderFooterSectionsForProject(projectId);
      } catch (syncErr) {
        console.warn("[createProjectServicesWizard] header/footer sync warning:", syncErr.message);
      }

      return res.status(200).json({
        message: "Services wizard completed",
        data: {
          servicesCreated: upsertResult.serviceDocs.length,
          locationsUsed: upsertResult.scopedLocations.length,
          pagesCreated: upsertResult.servicePages.length,
          contentGenerationStarted: contentQueued,
          sectionsGenerationStarted: sectionsQueued,
        },
      });
    } catch (error) {
      console.error("createProjectServicesWizard error:", error);
      return res.status(500).json({ message: "Failed to complete services wizard" });
    }
  },


  // STEP 4: Save service master data + service-location pages
  addBusinessServicesToLocation: async (req, res) => {
    try {
      let { projectId, services = [], selectedLocationIds = [], selectAll = true } = req.body;

      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      if (typeof services === "string") {
        try {
          services = JSON.parse(services);
        } catch {
          services = [];
        }
      }

      if (!Array.isArray(services) || services.length === 0) {
        return res.status(400).json({ message: "services array is required" });
      }

      const project = await UserProject.findById(projectId).select("_id");
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const result = await upsertBusinessServicesAndPages({
        projectId,
        services,
        selectedLocationIds,
        selectAll: Boolean(selectAll),
      });
      if (result.error) {
        return res.status(result.error.status).json({ message: result.error.message });
      }

      try {
        await syncLocationPageGeneratedFlags(projectId);
      } catch (syncErr) {
        console.warn("[addBusinessServicesToLocation] pageGenerated sync warning:", syncErr.message);
      }

      return res.status(200).json({
        message: "Services and service-location pages saved successfully",
        servicesCount: result.serviceDocs.length,
        serviceLocationPagesCount: result.pageOpsCount,
        locationPagesCount: result.scopedChildLocations.length,
        removedDuplicatePages: result.removedDuplicatePages,
        selectedLocationsCount: result.scopedLocations.length,
        servicePageIds: result.servicePages.map((p) => String(p._id)),
      });

    } catch (error) {
      console.error("Error saving Step 4 services/pages:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },

  // STEP 6: Generate section-based content for service-location pages
  generateBusinessServicePageContent: async (req, res) => {
    try {
      const { projectId, selectedLocationIds = [], servicePageIds = [], __internalCall = false } = req.body;
      if (!projectId) {
        if (__internalCall) return { success: false, message: "projectId is required", pagesUpdated: 0 };
        return res.status(400).json({ message: "projectId is required" });
      }

      const project = await UserProject.findById(projectId)
        .select("_id userId projectName serviceType focusKeyword projectKeywordsText")
        .lean();
      if (!project) {
        if (__internalCall) return { success: false, message: "Project not found", pagesUpdated: 0 };
        return res.status(404).json({ message: "Project not found" });
      }

      const scopedLocationIds = parseSelectedLocationIds(selectedLocationIds);
      const scopedPageIds = parseSelectedLocationIds(servicePageIds);
      const servicePageQuery = {
        projectId,
        pageType: "service",
        serviceId: { $exists: true, $ne: null },
        locationId: { $exists: true, $ne: null },
      };
      if (scopedPageIds.length) {
        servicePageQuery._id = { $in: scopedPageIds };
      } else if (scopedLocationIds.length) {
        servicePageQuery.locationId = { $in: scopedLocationIds };
      }

      const servicePages = await WebsitePage.find(servicePageQuery).select("_id serviceId locationId slug");

      if (!servicePages.length) {
        if (__internalCall) {
          return { success: true, message: "No service pages found to generate content", pagesUpdated: 0 };
        }
        return res.status(200).json({
          message: "No service pages found to generate content",
          pagesUpdated: 0
        });
      }

      const serviceIds = [...new Set(servicePages.map((p) => String(p.serviceId)))];
      const locationIdsFromPages = [...new Set(servicePages.map((p) => String(p.locationId)))];

      const [servicesData, locationsDataFirst] = await Promise.all([
        Service.find({ _id: { $in: serviceIds } }).select("_id name slug").lean(),
        BusinessLocation.find({ _id: { $in: locationIdsFromPages } })
          .select("_id areaName parentId type city state country")
          .lean()
      ]);

      let locationsData = [...(locationsDataFirst || [])];
      const parentIdsNeeded = [
        ...new Set(
          locationsData
            .map((l) => (l.parentId ? String(l.parentId) : ""))
            .filter(Boolean)
            .filter((pid) => !locationIdsFromPages.includes(pid))
        )
      ];
      if (parentIdsNeeded.length) {
        const parentDocs = await BusinessLocation.find({ _id: { $in: parentIdsNeeded } })
          .select("_id areaName parentId type city state country")
          .lean();
        locationsData = locationsData.concat(parentDocs || []);
      }

      const serviceMap = new Map(servicesData.map((s) => [String(s._id), s]));
      const locationMap = new Map(locationsData.map((l) => [String(l._id), l]));

      let designData = await WebsiteDesignsData.findOne({ projectId });
      if (!designData) {
        designData = await WebsiteDesignsData.create({
          projectId,
          userId: project.userId,
          pageStyles: {},
          pages: []
        });
      }

      const existingPagesMap = new Map(
        (designData.pages || []).map((p, idx) => [String(p.pageId), idx])
      );

      let pagesUpdated = 0;
      let imagesGeneratedForHero = 0;
      let imagesGeneratedForAbout = 0;
      for (const page of servicePages) {
        const serviceDoc = serviceMap.get(String(page.serviceId));
        const locationDoc = locationMap.get(String(page.locationId));
        if (!serviceDoc || !locationDoc) continue;

        const serviceTitle = String(serviceDoc.name || "")
          .split(" ")
          .filter(Boolean)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        const locationName = String(locationDoc.areaName || "").trim();
        const parentLoc =
          locationDoc.parentId && locationMap.get(String(locationDoc.parentId))
            ? locationMap.get(String(locationDoc.parentId))
            : null;
        const parentAreaName = parentLoc ? String(parentLoc.areaName || "").trim() : "";
        const combinedTitle = `${serviceTitle} in ${locationName}`;

        const aboutPrompt = aboutserviceSection.prompt({
          project: {
            projectName: project.projectName || "",
            mainCategory: project.serviceType || "",
            focusKeyword: project.focusKeyword || project.projectKeywordsText || "",
          },
          location: {
            name: locationName,
            city: String(locationDoc.city || "").trim(),
            state: String(locationDoc.state || "").trim(),
            country: String(locationDoc.country || "").trim(),
          },
          extraData: {
            serviceName: serviceDoc.name,
            serviceSlug: serviceDoc.slug,
            servicePageSlug: String(page.slug || "").replace(/^\/+/, "").trim(),
            parentAreaName,
          },
        });

        let aboutAi = {};
        try {
          aboutAi = await fetchJSONFromOpenAI(aboutPrompt, "SERVICE_PAGE_ABOUTSERVICE", {
            userId: project.userId,
            projectId,
            pageId: page._id,
            promptFrom: "generateBusinessServicePageContent",
            promptFor: "aboutservice_bundle",
          });
        } catch (err) {
          console.warn(
            `[Step6][aboutservice] OpenAI JSON failed service="${serviceTitle}" location="${locationName}":`,
            err.message
          );
        }

        let aboutBody = String(aboutAi.about_service || "").trim();
        if (!aboutBody || LEGACY_ABOUT_SERVICE_BOILERPLATE.test(aboutBody)) {
          aboutBody = buildDeterministicAboutServiceFallback({
            projectName: project.projectName || "",
            serviceType: project.serviceType || "",
            focusKeyword: project.focusKeyword || project.projectKeywordsText || "",
            serviceTitle,
            locationName,
            parentAreaName,
            city: String(locationDoc.city || "").trim(),
            state: String(locationDoc.state || "").trim(),
          });
        }

        const aboutAiImg = String(aboutAi.ai_image_prompt || "").trim();
        const aboutNonAiImg = String(aboutAi.non_ai_image_prompt || "").trim();

        const heroContent = await attachGeneratedImagesToSectionData({
          project,
          projectId,
          sectionId: "servicehero",
          sectionModule: { imageCount: 6 },
          data: {
            serviceHeroBadge: "Professional Service",
            serviceHeroTitle: combinedTitle,
            serviceHeroSubtitle: `Trusted ${serviceTitle.toLowerCase()} for ${locationName} homes and businesses — clear scope, trained workflows, and results you can verify.`,
            ai_image_prompt: `Photoreal hero and supporting scenes for ${serviceTitle}: technician arrival, inspection, work in progress, completed result, equipment detail, customer satisfaction. No text overlays.`,
            non_ai_image_prompt: `${serviceTitle} ${locationName} technician service`,
            image_count: 6
          }
        });
        imagesGeneratedForHero += Array.isArray(heroContent?.images) ? heroContent.images.length : 0;


        const aboutContent = await attachGeneratedImagesToSectionData({
          project,
          projectId,
          sectionId: "aboutservice",
          sectionModule: { imageCount: 2 },
          data: {
            about_service: aboutBody,
            ai_image_prompt:
              aboutAiImg ||
              `Two photoreal images for ${serviceTitle}: professional team consultation and on-site execution with equipment. Clean, realistic, no text overlays.`,
            non_ai_image_prompt:
              aboutNonAiImg ||
              `${String(serviceTitle)} ${locationName} team equipment`
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim(),
            image_count: 2
          }
        });
        imagesGeneratedForAbout += Array.isArray(aboutContent?.images) ? aboutContent.images.length : 0;
        const faqContent = {
          badgeText: "Service FAQ",
          heading: `${serviceTitle} FAQs — ${locationName}`,
          descriptionText: `Practical answers about ${serviceTitle.toLowerCase()} scope, scheduling, and what to expect for ${locationName} properties.`,
          items: [
            { question: `Do you offer same-day ${serviceTitle.toLowerCase()} in ${locationName}?`, answer: `Same-day availability in ${locationName} depends on crew schedule and job scope; we confirm realistic windows when you request service.` },
            { question: `How do you plan ${serviceTitle.toLowerCase()} for different property types?`, answer: `We adjust materials, access steps, and safety checks for ${locationName} properties based on building layout, age, and how the space is used—not a one-size script.` },
            { question: `Are your technicians certified for ${serviceTitle.toLowerCase()}?`, answer: `Our team follows trained workflows, documented checks, and service standards for reliable delivery.` },
            { question: `Do you provide transparent estimates before work starts?`, answer: `Yes, we share clear scope and estimate details before execution to avoid surprises.` },
            { question: `Can I schedule preventive maintenance visits?`, answer: `Absolutely, recurring preventive plans are available to reduce downtime and long-term risk.` },
            { question: `What if I need support after service completion?`, answer: `Post-service support is available and we quickly address valid follow-up concerns.` }
          ]
        };

        // Simplified aggregate entry:
        // one document per project + service + location
        const serviceAggregateSet = {
          data: {
            serviceId: page.serviceId || null,
            serviceName: serviceDoc?.name || "",
            serviceSlug: serviceDoc?.slug || "",
            locationId: page.locationId || null,
            locationName: locationDoc?.areaName || "",
            servicePageId: page._id,
            servicePageSlug: page.slug || "",
            sections: {
              servicehero: heroContent,
              servicedetailhero: heroContent,
              aboutservice: aboutContent,
              servicedetailabout: aboutContent,
              faq: faqContent,
              servicedetailfaq: faqContent,
            }
          },
          status: "generated",
          error: null,
          meta: {
            source: "step6_service_page_generation_aggregate",
            serviceId: page.serviceId || null,
            locationId: page.locationId || null,
            servicePageId: page._id,
            serviceSlug: serviceDoc?.slug || "",
            serviceName: serviceDoc?.name || "",
            locationName: locationDoc?.areaName || "",
          }
        };

        await SectionContent.findOneAndUpdate(
          {
            projectId,
            pageId: page.serviceId,
            serviceId: page.serviceId,
            sectionId: "service_sections",
            locationId: page.locationId || null
          },
          { $set: serviceAggregateSet },
          { upsert: true }
        );

        const componentIds = ensureHeaderFooterComponents([
          {
            variant_uniqueId: "serviceheroDefault",
            componentId: null,
            sectionData: {
              type: "servicehero",
              content: {},
              contentRef: {
                scope: "service_bundle",
                sectionId: "servicehero",
                serviceId: page.serviceId || null,
                locationId: page.locationId || null
              },
              styles: {}
            }
          },
          {
            variant_uniqueId: "aboutserviceDefault",
            componentId: null,
            sectionData: {
              type: "aboutservice",
              content: {},
              contentRef: {
                scope: "service_bundle",
                sectionId: "aboutservice",
                serviceId: page.serviceId || null,
                locationId: page.locationId || null
              },
              styles: {}
            }
          },
          {
            variant_uniqueId: "faqDefault",
            componentId: null,
            sectionData: {
              type: "faq",
              content: {},
              contentRef: {
                scope: "service_bundle",
                sectionId: "faq",
                serviceId: page.serviceId || null,
                locationId: page.locationId || null
              },
              styles: {}
            }
          }
        ]);

        const pagePayload = {
          pageId: page._id,
          pageStyles: {},
          sections: componentIds.map((sec, idx) => ({
            ...sec,
            order: idx + 1,
            sectionData: {
              ...(sec.sectionData || {}),
              contentRef: {
                resolver: "service_bundle",
                locationIds: page.locationId ? [String(page.locationId)] : [],
                sources: [
                  ...(page.serviceId ? [{ source: "service_bundle", ids: [String(page.serviceId)] }] : [])
                ]
              }
            }
          })),
          sectionLayout: []
        };

        const existingIndex = existingPagesMap.get(String(page._id));
        if (existingIndex === undefined) {
          designData.pages.push(pagePayload);
          existingPagesMap.set(String(page._id), designData.pages.length - 1);
        } else {
          designData.pages[existingIndex] = pagePayload;
        }
        pagesUpdated += 1;
      }

      await designData.save();

      const payload = {
        message: "Service page content generated successfully",
        pagesUpdated,
        imagesGeneratedForHero,
        imagesGeneratedForAbout
      };
      if (__internalCall) return { success: true, ...payload };
      return res.status(200).json(payload);
    } catch (error) {
      console.error("Error generating Step 6 service page content:", error);
      if (req?.body?.__internalCall) {
        return { success: false, message: "Server error", pagesUpdated: 0, error: error.message };
      }
      return res.status(500).json({ message: "Server error" });
    }
  },

  regenerateServiceLocationPageContent: async (req, res) => {
    try {
      const { projectId, serviceId, locationId } = req.body || {};
      if (!projectId || !serviceId || !locationId) {
        return res.status(400).json({ message: "projectId, serviceId and locationId are required" });
      }

      const page = await WebsitePage.findOne({
        projectId,
        pageType: "service",
        serviceId,
        locationId,
      }).select("_id");

      if (!page) {
        return res.status(404).json({ message: "Service location page not found" });
      }

      const result = await module.exports.generateBusinessServicePageContent(
        {
          body: {
            projectId,
            selectedLocationIds: [String(locationId)],
            servicePageIds: [String(page._id)],
            __internalCall: true,
          },
        },
        { status: () => ({ json: () => undefined }) }
      );

      if (!result?.success) {
        return res.status(500).json({
          message: result?.message || "Failed to regenerate content",
          error: result?.error || null,
        });
      }

      return res.status(200).json({
        message: "Service location page content regenerated successfully",
        data: {
          pageId: String(page._id),
          pagesUpdated: Number(result.pagesUpdated || 0),
          imagesGeneratedForHero: Number(result.imagesGeneratedForHero || 0),
          imagesGeneratedForAbout: Number(result.imagesGeneratedForAbout || 0),
        },
      });
    } catch (error) {
      console.error("regenerateServiceLocationPageContent error:", error);
      return res.status(500).json({ message: "Failed to regenerate service location page content" });
    }
  },

  enqueueSectionsContnetGeneration: async (req, res) => {
    try {
      let {
        projectId,
        locations = [],
        selectedSectionIds = [],
        selectedLocationIds = [],
        selectAll = true,
        perLocationContentByPage = null,
        onlyServiceIds = [],
        onlyServicePageIds = [],
        servicesWizardOnly = false,
      } = req.body;
      const canonicalSectionId = (rawId = "") => {
        const value = String(rawId || "").trim().toLowerCase();
        if (!value) return "";
        const aliases = {
          servicesgrid: "services",
          "whychooseus": "why-choose-us",
          navbar: "header",
        };
        if (aliases[value]) return aliases[value];

        // Known section ids used by section generation modules (longer ids before shorter prefixes)
        const knownSections = [
          "header", "hero", "about", "features",
          "servicesgrid",
          "serviceshero",
          "servicehero",
          "services",
          "cta",
          "process",
          "footer",
          "testimonials",
          "pricing",
          "image-banner",
          "faq",
          "whychooseus",
          "why-choose-us",
          "guarantee",
          // About page (GenieBuild ids)
          "abouthero",
          "missionvision",
          "corevalues",
          "usp",
          "aboutwhychoose",
          "aboutcta",
          "aboutfaq",
          "mission",
          "vision",
          "difference",
          "aboutservice",
          "servicecopy",
          "serviceprocess",
          "serviceguarantee",
          "servicewhychooseus",
          "servicegroups",
          "servicedetailcta",
          "promiseline",
          "relatedservices",
          "subservices",
          // Service detail page (GenieBuild ids)
          "servicedetailhero",
          "servicedetailabout",
          "servicedetailservices",
          "servicedetailprocess",
          "servicedetailwhychoose",
          "servicedetailguarantee",
          "servicedetailtestimonials",
          "servicedetailfaq",
          "descriptions",
          // Contact page (GenieBuild ids)
          "contacthero",
          "contactinfo",
          "contactform",
          "contactcta",
          "contactfaq",
          "contactpage",
          // Services listing page (GenieBuild ids)
          "serviceslisthero",
          "serviceslistgrid",
          "serviceslistwhychoose",
          "serviceslistcta",
          "serviceslistguarantee",
          "serviceslistprocess",
          "serviceslistareas",
          "serviceslistfaq",
          // Blog (GenieBuild) — list/chrome AI; posts from Blog collection
          "blogshero",
          "blogssearch",
          "blogslist",
          "blogarticlehero",
          "blogcontent",
          "blogauthor",
          "blogcomments",
          "blogrelated",
          "blogslisting",
          "blogarticle",
          // Legal (GenieBuild split + legacy combined)
          "legalhero",
          "legalcontent",
          "legalprivacy",
          "legalterms",
          "legaldisclaimer",
          // Location UI ids (resolve → homepage prompts; map/subs from DB)
          "locationhero",
          "locationabout",
          "locationservices",
          "locationwhychoose",
          "locationprocess",
          "locationcta",
          "locationguarantee",
          "locationpromise",
          "locationtestimonials",
          "locationareas",
          "locationfaq",
          "locationmap",
          "sublocations",
          "areashero",
          "areastestimonials",
          "areasfaq",
        ];

        // Exact match first
        if (knownSections.includes(value)) return value;

        // Normalize separators for variants like hero_a, hero-center, faqmodern
        const stripped = value.replace(/[_-].*$/, "");
        if (aliases[stripped]) return aliases[stripped];
        if (knownSections.includes(stripped)) return stripped;

        const sorted = [...knownSections].sort((a, b) => b.length - a.length);
        const prefix = sorted.find((s) => value.startsWith(s));
        return prefix || value;
      };

      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }

      console.log("locations", locations, req.body);
      console.log("selectedSectionIds", selectedSectionIds);

      // Fetch all active locations (full geo hierarchy)
      const locationsData = await BusinessLocation.find({
        projectId,
        status: 1,
      })
        .select("_id areaName type parentId locationType createdAt")
        .lean();

      const formattedLocations = formatBusinessLocationsForGeneration(locationsData);

      const scopedLocationIdSet = new Set(parseSelectedLocationIds(selectedLocationIds));
      if (!Boolean(selectAll) && scopedLocationIdSet.size > 0) {
        locations = formattedLocations.filter((loc) => scopedLocationIdSet.has(String(loc._id)));
      } else {
        locations = formattedLocations;
      }

      // ✅ parse if string
      if (typeof selectedSectionIds === "string") {
        try {
          selectedSectionIds = JSON.parse(selectedSectionIds);
        } catch (_e) {
          selectedSectionIds = [];
        }
      }

      // ✅ normalize incoming variant/uniqueIds to canonical section ids
      if (Array.isArray(selectedSectionIds)) {
        selectedSectionIds = selectedSectionIds
          .map(canonicalSectionId)
          .filter(Boolean)
          // Header/footer are managed via SiteHeaderFooter, not section-generation prompts
          .filter((id) => id !== "header" && id !== "footer");
      }

      let parsedOnlyServiceIds = onlyServiceIds;
      if (typeof parsedOnlyServiceIds === "string") {
        try {
          parsedOnlyServiceIds = JSON.parse(parsedOnlyServiceIds);
        } catch (_e) {
          parsedOnlyServiceIds = [];
        }
      }
      const normalizedOnlyServiceIds = Array.isArray(parsedOnlyServiceIds)
        ? parsedOnlyServiceIds.map((id) => String(id || "").trim()).filter(Boolean)
        : [];

      let parsedOnlyServicePageIds = onlyServicePageIds;
      if (typeof parsedOnlyServicePageIds === "string") {
        try {
          parsedOnlyServicePageIds = JSON.parse(parsedOnlyServicePageIds);
        } catch (_e) {
          parsedOnlyServicePageIds = [];
        }
      }
      const normalizedOnlyServicePageIds = Array.isArray(parsedOnlyServicePageIds)
        ? parsedOnlyServicePageIds.map((id) => String(id || "").trim()).filter(Boolean)
        : [];

      const isServicesWizardJob =
        Boolean(servicesWizardOnly) ||
        normalizedOnlyServiceIds.length > 0 ||
        normalizedOnlyServicePageIds.length > 0;

      if (isServicesWizardJob && Array.isArray(selectedSectionIds)) {
        selectedSectionIds = selectedSectionIds.filter((id) => isServiceDetailSection(id));
      }

      const project = await UserProject.findById(projectId).select("_id projectType");
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const isBusinessProject = Number(project?.projectType || 0) === 1;
      const primaryParentLocation = resolveMainParentLocation(formattedLocations, {
        isBusinessProject,
      });

      console.log(
        "Things sent to redis bull queue",
        locations,
        selectedSectionIds,
        req?.user?.userId || null
      );

      const job = await enqueueSectionGeneration({
        projectId,
        locations: Array.isArray(locations) ? locations : [],
        includeDefaultHomepage: !isBusinessProject && !isServicesWizardJob,
        homepageLocationId: isBusinessProject ? (primaryParentLocation?._id || null) : null,
        selectedSectionIds: Array.isArray(selectedSectionIds)
          ? selectedSectionIds
          : [],
        perLocationContentByPage:
          perLocationContentByPage && typeof perLocationContentByPage === "object"
            ? perLocationContentByPage
            : null,
        onlyServiceIds: normalizedOnlyServiceIds,
        onlyServicePageIds: normalizedOnlyServicePageIds,
        servicesWizardOnly: isServicesWizardJob,
        userId: req?.user?.userId || null,
      });

      const jobState = job?.getState ? await job.getState().catch(() => "unknown") : "unknown";
      console.log("[enqueueSectionsContnetGeneration] job queued", {
        jobId: job?.id,
        state: jobState,
        projectId,
        locations: Array.isArray(locations) ? locations.length : 0,
        sections: Array.isArray(selectedSectionIds) ? selectedSectionIds.length : 0,
      });

      return res.status(202).json({
        message: "Sections content generation queued",
        success: true,
        data: {
          queue: "section-generation",
          jobId: job.id,
          state: jobState,
        },
      });
    } catch (error) {
      console.error("enqueueSectionsContnetGeneration error:", error);
      return res.status(500).json({
        message: "Failed to queue sections content generation",
        error: error.message,
      });
    }
  },


  updateBusinessAboutUs: async (req, res) => {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const { email, phone, emails, phones, mainLocation, address, socialLinks, businessHours } = req.body;
      const userId = req.user?.userId;

      const project = userId
        ? await assertBusinessProjectOwned(projectId, userId)
        : await UserProject.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      let normalizedEmails = Array.isArray(emails)
        ? emails
          .filter((item) => item && typeof item.value === "string" && item.value.trim())
          .map((item) => ({
            value: item.value.trim(),
            is_primary: item.is_primary === true,
          }))
        : (email
          ? [{ value: String(email).trim(), is_primary: true }]
          : []);
      if (normalizedEmails.length > 0 && !normalizedEmails.some((e) => e.is_primary)) {
        normalizedEmails[0].is_primary = true;
      }

      let normalizedPhones = Array.isArray(phones)
        ? phones
          .filter((item) => item && typeof item.value === "string" && item.value.trim())
          .map((item) => ({
            value: item.value.trim(),
            is_primary: item.is_primary === true,
          }))
        : (phone
          ? [{ value: String(phone).trim(), is_primary: true }]
          : []);
      if (normalizedPhones.length > 0 && !normalizedPhones.some((p) => p.is_primary)) {
        normalizedPhones[0].is_primary = true;
      }

      const primaryEmail = normalizedEmails.find((item) => item.is_primary)?.value || normalizedEmails[0]?.value || "";
      const primaryPhone = normalizedPhones.find((item) => item.is_primary)?.value || normalizedPhones[0]?.value || "";

      // Prefer primary (parent) BusinessLocation formatted address when client didn't send a street address
      let normalizedAddress = String(address || mainLocation || "").trim();
      try {
        const BusinessLocation = require("../models/businessLocation");
        const { resolveMainParentLocation } = require("../services/sectionGenerationLocationService");
        const locs = await BusinessLocation.find({ projectId }).lean();
        const isBulk = Number(project.projectType) === 0;
        const main = resolveMainParentLocation(locs, { isBusinessProject: !isBulk });
        const primaryLabel = String(
          main?.formattedAddress || main?.areaName || ""
        ).trim();
        if (primaryLabel) {
          // Always prefer primary parent location for "Visit Us" when locations exist
          normalizedAddress = primaryLabel;
        }
      } catch (locErr) {
        console.warn("[updateBusinessAboutUs] primary location resolve failed:", locErr.message);
      }

      let normalizedSocialLinks = [];
      if (Array.isArray(socialLinks)) {
        normalizedSocialLinks = socialLinks
          .filter((item) => item && typeof item.url === "string" && item.url.trim())
          .map((item) => {
            const url = String(item.url).trim();
            const platform = item.platform != null ? String(item.platform).trim().toLowerCase() : "custom";
            const customLabel =
              item.customLabel != null && String(item.customLabel).trim()
                ? String(item.customLabel).trim()
                : undefined;
            return {
              platform: platform || "custom",
              ...(customLabel ? { customLabel } : {}),
              url,
            };
          });
      }

      const { normalizeBusinessHours } = require("../services/businessHours");
      const normalizedHours = businessHours
        ? normalizeBusinessHours(businessHours)
        : undefined;

      const $set = {
        email: primaryEmail,
        phone: primaryPhone,
        emails: normalizedEmails,
        phones: normalizedPhones,
        address: normalizedAddress,
        mainLocation: normalizedAddress,
        socialLinks: normalizedSocialLinks,
      };
      if (normalizedHours) {
        $set.businessHours = normalizedHours;
      }

      // Keep a single AboutUs document per project (no duplicates)
      const aboutUs = await AboutUs.findOneAndUpdate(
        { projectId },
        { $set },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      try {
        const { syncContactSurfacesFromAboutUs } = require("../services/syncContactSurfacesFromAboutUs");
        await syncContactSurfacesFromAboutUs(projectId, aboutUs?.toObject ? aboutUs.toObject() : aboutUs);
      } catch (contactSyncErr) {
        console.warn("[updateBusinessAboutUs] contact surfaces sync failed:", contactSyncErr.message);
      }

      try {
        const { syncHeaderFooterSectionsForProject } = require("../services/headerFooterSectionSync");
        await syncHeaderFooterSectionsForProject(projectId, { skipFooterAi: true });
      } catch (syncErr) {
        console.warn("[updateBusinessAboutUs] header/footer sync failed:", syncErr.message);
      }

      return res.status(201).json({
        message: 'About Us saved successfully',
        data: aboutUs
      });
    } catch (error) {
      console.error('Error creating About Us:', error);
      return res.status(500).json({ message: 'Server error while creating About Us' });
    }
  },

  ensureCoreBusinessWebsitePages,
};
