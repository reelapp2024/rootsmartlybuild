const Bull = require("bull");
const mongoose = require("mongoose");

const UserProject = require("../models/userProjects");
const WebsiteDesignsData = require("../models/WebsiteDesignsData");
const SectionContent = require("../models/SectionContent");
const Service = require("../models/service");
const WebsitePage = require("../models/WebsitePage");
const BusinessLocation = require("../models/businessLocation");

const AboutUs = require("../models/aboutus");
const WebsiteComponent = require("../models/WebsiteComponent");
const {
  generateMissingSeoForAllProjectPages,
} = require("../services/pageSeoService");
const Slug = require("../models/slug");
const slugify = require("../additional/slugify");
const { fetchJSONFromOpenAI } = require("../additional/openaiHelpers");
const resolveSectionFile = require("../sections/resolveSectionFile");
const { resolvePhone, SOURCE: CONTACT_SOURCE } = require("../services/contactResolver");
const {
  syncHeaderFooterSectionsForProject,
} = require("../services/headerFooterSectionSync");
const {
  stripLegacyImagePromptFields,
} = require("../sections/sectionImagePrompts");
const {
  attachGeneratedImagesToSectionData,
} = require("../additional/sectionImageGenerationHelper");
const { buildLocationAwarePrompt } = require("../additional/locationPromptHelper");
const {
  getSectionResolver,
  isBusinessLocationsSection,
  usesServicesGridDbBuilder,
  isServiceDetailSection,
} = require("../additional/sectionResolverRegistry");
const {
  coerceFaqSectionPayload,
  FAQ_ANSWER_MIN_WORDS,
} = require("../sections/_shared/faqAnswerGuards");
const {
  validateSectionContent,
  buildLengthFixPrompt,
  isMeaningfulSectionData,
  pickAboutServiceBody,
  countWords: countSectionWords,
  ABOUT_SERVICE_MIN_WORDS,
} = require("../sections/_shared/sectionContentGuards");
const {
  resolveConfigPageKey,
  isServiceDetailWebsitePage,
  isServiceTemplateWebsitePage,
  resolveMainParentLocation,
  resolvePageLocationToggle,
  buildPageLocationList,
} = require("../services/sectionGenerationLocationService");
const {
  getScopedAreaLocations,
  getScopeLocationRecord,
} = require("../services/locationContentScope");
require("dotenv").config();

const SECTION_LENGTH_FIX_MAX_ATTEMPTS = 4;

async function loadWizardAboutserviceFallback(projectId, locationId) {
  const wizardPage = await WebsitePage.findOne({
    projectId,
    name: /^service$/i,
    $or: [{ serviceId: null }, { serviceId: { $exists: false } }],
  })
    .select("_id")
    .lean();
  if (!wizardPage?._id) return null;

  const doc = await SectionContent.findOne({
    projectId,
    pageId: wizardPage._id,
    sectionId: "aboutservice",
    locationId: locationId || null,
    status: "generated",
    isDeleted: { $ne: true },
  })
    .select("data")
    .lean();

  const data = doc?.data;
  if (!data || typeof data !== "object") return null;
  const body = pickAboutServiceBody(data);
  if (countSectionWords(body) < ABOUT_SERVICE_MIN_WORDS) return null;
  return { ...data, about_service: body };
}

async function fetchValidatedSectionJson({
  prompt,
  sectionId,
  label,
  tracking,
}) {
  let result = await fetchJSONFromOpenAI(prompt, label, tracking);
  const normalizedId = String(sectionId || "").toLowerCase().trim();
  for (let attempt = 0; attempt <= SECTION_LENGTH_FIX_MAX_ATTEMPTS; attempt++) {
    const validation = validateSectionContent(sectionId, result);
    if (validation.ok) return result;
    if (attempt === SECTION_LENGTH_FIX_MAX_ATTEMPTS) {
      if (normalizedId === "aboutservice") {
        const words = countSectionWords(pickAboutServiceBody(result));
        if (words >= ABOUT_SERVICE_MIN_WORDS) {
          console.warn(
            `[sectionGenerationQueue] aboutservice accepted after retries at ${words} words (min ${ABOUT_SERVICE_MIN_WORDS})`
          );
          return result;
        }
      }
      const details = validation.errors.map((e) => e.message).join("; ");
      throw new Error(`Section content under minimum length (${sectionId}): ${details}`);
    }
    const fixPrompt = buildLengthFixPrompt(sectionId, result, validation.errors);
    result = await fetchJSONFromOpenAI(
      fixPrompt,
      `${label}_length_fix_${attempt + 1}`,
      {
        ...tracking,
        promptFor: `${tracking.promptFor || sectionId}_length_fix`,
      }
    );
  }
  return result;
}

async function deletePendingPlaceholder({
  projectId,
  pageId,
  sectionId,
  locationId = null,
}) {
  const normalizedPageId = normalizeMixedIdForStorage(pageId);
  const pageIdCandidates = buildMixedIdCandidates(pageId);
  await SectionContent.deleteMany({
    projectId,
    ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
    sectionId,
    locationId: locationId || null,
    status: "pending",
    isDeleted: { $ne: true },
  });
}

async function cleanupStalePendingSectionContent(projectId) {
  const pendingRows = await SectionContent.find({
    projectId,
    status: "pending",
    isDeleted: { $ne: true },
  })
    .select("_id data")
    .lean();

  const emptyIds = (pendingRows || [])
    .filter((row) => !isMeaningfulSectionData(row?.data))
    .map((row) => row._id);

  if (emptyIds.length) {
    await SectionContent.deleteMany({ _id: { $in: emptyIds } });
    console.log(
      `[sectionGenerationQueue] Removed ${emptyIds.length} empty pending SectionContent row(s)`
    );
  }
}

function normalizeMixedIdForStorage(value) {
  const raw = String(value || "").trim();
  if (!raw) return raw;
  return mongoose.isValidObjectId(raw) ? new mongoose.Types.ObjectId(raw) : raw;
}

function buildMixedIdCandidates(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  const candidates = [raw];
  if (mongoose.isValidObjectId(raw)) candidates.push(new mongoose.Types.ObjectId(raw));
  return candidates;
}

/**
 * After section content is generated, ensure every WebsitePage row has AI SEO.
 * Uses page records only (slug + location/service context) — not URL bucket matching.
 */
async function generateSeoAfterSectionGeneration({
  project,
  projectId,
  userId,
  pageIds = null,
}) {
  try {
    const scopedIds = Array.isArray(pageIds) && pageIds.length
      ? [...new Set(pageIds.map((id) => String(id || "").trim()).filter(Boolean))]
      : null;
    console.log(
      scopedIds
        ? `[sectionGenerationQueue][SEO] Ensuring SEO for ${scopedIds.length} scoped page(s)…`
        : "[sectionGenerationQueue][SEO] Ensuring SEO for all WebsitePage rows…"
    );

    const result = await generateMissingSeoForAllProjectPages({
      projectId,
      userId: userId || project.userId,
      project,
      pageIds: scopedIds,
    });

    console.log("[sectionGenerationQueue][SEO] Finished:", {
      totalPages: result.total,
      created: result.created,
      alreadyComplete: result.alreadyComplete,
      failed: result.failed,
      stillMissing: result.stillMissing,
    });

    if (result.stillMissing > 0) {
      console.warn(
        "[sectionGenerationQueue][SEO] Some pages still lack SEO — check OpenAI errors above:",
        result.stillMissingPages
      );
    }

    return {
      created: result.created,
      failed: result.failed,
      alreadyComplete: result.alreadyComplete,
      stillMissing: result.stillMissing,
      createdPageUrls: (result.createdPages || []).map((p) => p.pageUrl),
      createdPages: result.createdPages || [],
      stillMissingPages: result.stillMissingPages || [],
      errors: result.errors || [],
      /** @deprecated misleading — use alreadyComplete */
      skipped: result.alreadyComplete,
    };
  } catch (error) {
    console.error("[sectionGenerationQueue][SEO] Unexpected error:", error);
    return {
      created: 0,
      alreadyComplete: 0,
      stillMissing: 0,
      failed: 1,
      createdPageUrls: [],
      errors: [{ message: error.message }],
      skipped: 0,
    };
  }
}

// =========================
// CONFIG
// =========================

const SECTION_GENERATION_QUEUE = "section-generation";

const redisConfig = {
  host: process.env.redisHost,
  port: process.env.redisPort
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

const getPageSections = (page = {}) => {
  if (Array.isArray(page?.sections)) return page.sections;
  if (Array.isArray(page?.componentIds)) return page.componentIds;
  return [];
};

const assignPageSections = (page = {}, sections = []) => {
  page.sections = ensureHeaderFooterComponents(sections || []);
  if (Object.prototype.hasOwnProperty.call(page, "componentIds")) {
    delete page.componentIds;
  }
  return page;
};

// =========================
// QUEUE INIT
// =========================

const sectionGenerationQueue = new Bull(SECTION_GENERATION_QUEUE, {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 15000 },
    removeOnComplete: true,
    removeOnFail: false
  }
});

console.log("🔥 Section queue worker started");

// =========================
// QUEUE EVENTS
// =========================

sectionGenerationQueue.on("active", (job) => {
  console.log(`[sectionGenerationQueue] active job=${job.id}`);
});

sectionGenerationQueue.on("completed", (job) => {
  console.log(`[sectionGenerationQueue] completed job=${job.id}`);
});

sectionGenerationQueue.on("failed", (job, err) => {
  console.error(`[sectionGenerationQueue] failed job=${job?.id}: ${err?.message}`);
});

// =========================
// ENQUEUE FUNCTION (FIXED)
// =========================

async function enqueueSectionGeneration({
  projectId,
  pageId = null,
  sectionId = null,
  locationId = null,
  extraData = {},
  locations = [],
  includeDefaultHomepage = true,
  homepageLocationId = null,
  selectedSectionIds = [],
  perLocationContentByPage = null,
  onlyServiceIds = [],
  onlyServicePageIds = [],
  servicesWizardOnly = false,
  userId = null
}) {
  const normalizedSelected = Array.isArray(selectedSectionIds)
    ? [...new Set(selectedSectionIds.map((s) => String(s || "").toLowerCase().trim()).filter(Boolean))].sort()
    : [];
  const normalizedLocations = Array.isArray(locations)
    ? [...new Set(locations.map((l) => String(l?._id || l?.id || l || "")).filter(Boolean))].sort()
    : [];
  const normalizedOnlyServiceIds = Array.isArray(onlyServiceIds)
    ? [...new Set(onlyServiceIds.map((id) => String(id || "").trim()).filter(Boolean))].sort()
    : [];
  const normalizedOnlyServicePageIds = Array.isArray(onlyServicePageIds)
    ? [...new Set(onlyServicePageIds.map((id) => String(id || "").trim()).filter(Boolean))].sort()
    : [];
  const wizardOnly =
    Boolean(servicesWizardOnly) ||
    normalizedOnlyServiceIds.length > 0 ||
    normalizedOnlyServicePageIds.length > 0;
  const dedupeKey = [
    String(projectId || ""),
    String(pageId || ""),
    String(sectionId || ""),
    String(locationId || ""),
    normalizedSelected.join(","),
    normalizedLocations.join(","),
    wizardOnly ? "wizard" : "full",
    normalizedOnlyServiceIds.join(","),
    normalizedOnlyServicePageIds.join(",")
  ].join("|");
  const jobId = `sectiongen:${dedupeKey}`;

  const toComparableKey = (data = {}) => {
    const selected = Array.isArray(data?.selectedSectionIds)
      ? [...new Set(data.selectedSectionIds.map((s) => String(s || "").toLowerCase().trim()).filter(Boolean))].sort()
      : [];
    const locs = Array.isArray(data?.locations)
      ? [...new Set(data.locations.map((l) => String(l?._id || l?.id || l || "")).filter(Boolean))].sort()
      : [];
    return [
      String(data?.projectId || ""),
      String(data?.pageId || ""),
      String(data?.sectionId || ""),
      String(data?.locationId || ""),
      selected.join(","),
      locs.join(",")
    ].join("|");
  };

  try {
    const candidateJobs = await sectionGenerationQueue.getJobs(["waiting", "active", "delayed", "paused"], 0, 200);
    const isFullProjectJob = !wizardOnly && !pageId && !sectionId;
    if (isFullProjectJob) {
      const existingFull = candidateJobs.find((queuedJob) => {
        const d = queuedJob?.data || {};
        const otherWizard =
          Boolean(d.servicesWizardOnly) ||
          (Array.isArray(d.onlyServiceIds) && d.onlyServiceIds.length > 0) ||
          (Array.isArray(d.onlyServicePageIds) && d.onlyServicePageIds.length > 0);
        return (
          String(d.projectId || "") === String(projectId || "") &&
          !otherWizard &&
          !d.pageId &&
          !d.sectionId
        );
      });
      if (existingFull) return existingFull;
    }
    const existingInFlight = candidateJobs.find((queuedJob) => toComparableKey(queuedJob?.data || {}) === dedupeKey);
    if (existingInFlight) return existingInFlight;

    return await sectionGenerationQueue.add("generate-section", {
      projectId,
      pageId,
      sectionId,
      locationId,
      extraData,
      locations,
      includeDefaultHomepage,
      homepageLocationId,
      selectedSectionIds,
      perLocationContentByPage:
        perLocationContentByPage && typeof perLocationContentByPage === "object"
          ? perLocationContentByPage
          : null,
      onlyServiceIds: normalizedOnlyServiceIds,
      onlyServicePageIds: normalizedOnlyServicePageIds,
      servicesWizardOnly: wizardOnly,
      userId
    }, {
      jobId,
      removeOnComplete: true,
      removeOnFail: true
    });
  } catch (err) {
    if (String(err?.message || "").toLowerCase().includes("jobid")) {
      const existingJob = await sectionGenerationQueue.getJob(jobId);
      if (existingJob) return existingJob;
    }
    throw err;
  }
}

// =========================
// SINGLE SECTION GENERATOR
// =========================

async function generateSingleSection({
  project,
  designData,
  projectId,
  userId,
  pageId,
  sectionId,
  location,
  locationId,
  serviceNames = []
}) {
  const getLocationDisplayName = (loc = null) => {
    if (!loc) return "";
    return String(loc.name || loc.areaName || "").trim();
  };

  const toTitleCase = (text = "") =>
    String(text)
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const normalizedSectionId = String(sectionId || "").trim().toLowerCase();
  const normalizedPageId = normalizeMixedIdForStorage(pageId);
  const pageIdCandidates = buildMixedIdCandidates(pageId);

  if (!normalizedSectionId) {
    throw new Error("sectionId is required");
  }

  console.log("⚙️ Generating section:", {
    sectionId: normalizedSectionId,
    pageId,
    location: location?.name || "DEFAULT",
    locationId
  });

  const pageDoc =
    mongoose.isValidObjectId(String(pageId || ""))
      ? await WebsitePage.findOne({ _id: pageId, projectId })
          .select("_id serviceId locationId pageType name slug")
          .lean()
      : null;
  const pageType = String(pageDoc?.pageType || "").toLowerCase();
  const pageName = String(pageDoc?.name || "").toLowerCase().trim();
  const pageFolder = (() => {
    if (pageType === "service" || pageName === "service") return "service";
    if (pageType === "services" || pageName === "services") return "services";
    if (pageType === "about" || pageName === "about" || pageName === "about us") return "about";
    if (pageType === "contact" || pageName === "contact") return "contact";
    if (pageType === "home" || pageType === "homepage" || pageName === "home") return "homepage";
    return pageName || pageType || "";
  })();

  const sectionFile = resolveSectionFile(normalizedSectionId, { pageType, pageFolder });

  if (!sectionFile) {
    console.warn(`⏭ Section file missing, skipping: ${normalizedSectionId}`);
    await deletePendingPlaceholder({
      projectId,
      pageId,
      sectionId: normalizedSectionId,
      locationId,
    });
    return { skipped: true };
  }

  delete require.cache[require.resolve(sectionFile)];
  const sectionModule = require(sectionFile);

  if (!sectionModule || typeof sectionModule.prompt !== "function") {
    throw new Error(`Invalid section module: ${normalizedSectionId}`);
  }

  const locationDisplayName = getLocationDisplayName(location || {});
  const projectTypeNum = Number(project?.projectType ?? 0);
  const isBulkProjectGen = projectTypeNum === 0;

  const buildDbBackedServicesSection = async () => {
    const allServices = await Service.find({ projectId })
      .select("_id name slug")
      .lean();
    if (!allServices.length) return null;

    const targetLocationId = locationId ? String(locationId) : null;

    const servicePageQuery = {
      projectId,
      pageType: "service",
      serviceId: { $exists: true, $ne: null },
    };

    let servicePages = [];
    if (targetLocationId) {
      servicePages = await WebsitePage.find({
        ...servicePageQuery,
        locationId: targetLocationId,
      })
        .select("_id serviceId locationId slug")
        .lean();
      if (!servicePages.length && isBulkProjectGen) {
        servicePages = await WebsitePage.find({
          ...servicePageQuery,
          $or: [{ locationId: null }, { locationId: { $exists: false } }],
        })
          .select("_id serviceId locationId slug")
          .lean();
      }
    } else if (isBulkProjectGen) {
      servicePages = await WebsitePage.find({
        ...servicePageQuery,
        $or: [{ locationId: null }, { locationId: { $exists: false } }],
      })
        .select("_id serviceId locationId slug")
        .lean();
    } else {
      const firstParentLocation = await BusinessLocation.findOne({
        projectId,
        status: 1,
        type: 0,
      })
        .sort({ createdAt: 1, _id: 1 })
        .select("_id areaName")
        .lean();
      const parentId = firstParentLocation?._id ? String(firstParentLocation._id) : null;
      if (parentId) {
        servicePages = await WebsitePage.find({
          ...servicePageQuery,
          locationId: parentId,
        })
          .select("_id serviceId locationId slug")
          .lean();
      }
    }

    const validServiceIds = new Set(
      (servicePages || []).map((p) => String(p.serviceId || "")).filter(Boolean)
    );

    const filteredServices = targetLocationId
      ? allServices.filter((s) => validServiceIds.has(String(s._id)))
      : allServices;

    const pageByServiceId = new Map(
      (servicePages || []).map((p) => [String(p.serviceId || ""), p])
    );

    const toSentenceRange = (rawText = "", minSentences = 6, maxSentences = 10) => {
      const sentences = String(rawText || "")
        .replace(/\s+/g, " ")
        .trim()
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!sentences.length) return "";
      const sliced = sentences.slice(0, maxSentences);
      if (sliced.length >= minSentences) return sliced.join(" ");
      return sentences.join(" ");
    };

    const serviceIds = (filteredServices || []).map((s) => s?._id).filter(Boolean);
    const serviceBundleDocs = serviceIds.length
      ? await SectionContent.find({
          projectId,
          $or: [
            { serviceId: { $in: serviceIds } },
            { pageId: { $in: serviceIds } }
          ],
          sectionId: "service_sections",
          isDeleted: { $ne: true },
          ...(targetLocationId
            ? { locationId: targetLocationId }
            : { $or: [{ locationId: null }, { locationId: { $exists: false } }] }),
        })
          .select("serviceId pageId locationId data")
          .lean()
      : [];
    const serviceBundleByServiceAndLocation = new Map(
      (serviceBundleDocs || []).map((doc) => [
        `${String(doc.serviceId || doc.pageId || "")}::${String(doc.locationId || "")}`,
        doc?.data || {}
      ])
    );

    const items = filteredServices.slice(0, 8).map((svc, idx) => {
      const serviceName = toTitleCase(String(svc.name || ""));
      const iconList = [
        "fas fa-screwdriver-wrench",
        "fas fa-shield-halved",
        "fas fa-bolt",
        "fas fa-house",
        "fas fa-helmet-safety",
        "fas fa-star",
        "fas fa-gear",
        "fas fa-briefcase"
      ];
      const servicePage = pageByServiceId.get(String(svc._id));
      const serviceLink = servicePage?.slug
        ? `/${String(servicePage.slug).trim().replace(/^\/+/, "")}`
        : "#";
      const bundleLocKey = String(targetLocationId || servicePage?.locationId || "");
      const aboutContent =
        serviceBundleByServiceAndLocation.get(
          `${String(svc?._id || "")}::${bundleLocKey}`
        )?.sections?.aboutservice || {};
      const aboutImage =
        aboutContent?.imageUrl ||
        (Array.isArray(aboutContent?.images) && aboutContent.images[0]?.url) ||
        "";
      return {
        id: `service-${idx + 1}`,
        serviceId: String(svc?._id || ""),
        locationId: servicePage?.locationId ? String(servicePage.locationId) : (targetLocationId || null),
        icon: iconList[idx % iconList.length],
        title: serviceName,
        link: serviceLink,
        imageUrl: aboutImage || "",
        description: "",
      };
    });

    const sectionData = {
      badgeText: "",
      title: "",
      heading: "",
      subtitle: "",
      description: "",
      items,
    };

    const gridCopyFn =
      typeof sectionModule.gridCopyPrompt === "function"
        ? sectionModule.gridCopyPrompt
        : null;

    if (!gridCopyFn || !items.length) {
      throw new Error("services grid requires gridCopyPrompt and at least one service card");
    }

    let servicesCopySource = "openai";
    try {
        const serviceCards = items.map((item) => ({
          serviceId: String(item.serviceId || ""),
          name: String(item.title || ""),
        }));
        const rawPrompt = gridCopyFn({
          project: {
            projectName: project?.projectName || "",
            mainCategory: project?.serviceType || "",
            serviceType: project?.serviceType || "",
            focusKeyword: project?.focusKeyword || "",
            projectKeywordsText: project?.projectKeywordsText || "",
          },
          location: {
            ...(location || {}),
            name:
              locationDisplayName ||
              location?.name ||
              location?.areaName ||
              "",
            areaName:
              locationDisplayName ||
              location?.areaName ||
              location?.name ||
              "",
          },
          extraData: { serviceCards, pageId },
        });
        const prompt = buildLocationAwarePrompt(
          rawPrompt,
          locationDisplayName,
          normalizedSectionId
        );
        const enriched = await fetchValidatedSectionJson({
          prompt,
          sectionId: "servicesgrid",
          label: "services_grid_copy",
          tracking: {
            userId: userId || project?.userId,
            projectId,
            pageId,
            promptFrom: "sectionGenerationQueue",
            promptFor: "services_grid_location_copy",
          },
        });

        const badge = String(enriched?.badgeText || "").trim();
        const heading = String(enriched?.title || enriched?.heading || "").trim();
        const desc = String(
          enriched?.description || enriched?.subtitle || enriched?.descriptionText || ""
        ).trim();
        if (badge) sectionData.badgeText = badge;
        if (heading) {
          sectionData.title = heading;
          sectionData.heading = heading;
        }
        if (desc) {
          sectionData.subtitle = desc;
          sectionData.description = desc;
        }

        const aiItems = Array.isArray(enriched?.items) ? enriched.items : [];
        const aiByServiceId = new Map(
          aiItems
            .map((row) => [
              String(row?.serviceId || "").trim(),
              String(row?.description || "").trim(),
            ])
            .filter(([id, text]) => id && text)
        );
        sectionData.items = items.map((item, idx) => {
          const sid = String(item.serviceId || "");
          const nextDesc =
            aiByServiceId.get(sid) ||
            String(aiItems[idx]?.description || "").trim();
          if (!nextDesc) {
            throw new Error(`missing AI description for serviceId=${sid || idx}`);
          }
          return { ...item, description: nextDesc };
        });

        if (
          !String(sectionData.title || sectionData.heading || "").trim() ||
          !String(sectionData.description || sectionData.subtitle || "").trim()
        ) {
          throw new Error("services grid AI response missing header copy");
        }
    } catch (error) {
        servicesCopySource = "failed";
        throw new Error(`services grid OpenAI copy failed: ${error.message}`);
    }

    return {
      data: sectionData,
      meta: {
        source: "database",
        copySource: servicesCopySource,
        generatedFrom: "openai",
        serviceIds: filteredServices.map((s) => s._id),
        websitePageIds: servicePages.map((p) => p._id),
        homepageSourceLocationId: targetLocationId || null,
        sourceLocationId: targetLocationId || null,
      },
    };
  };

  const buildDbBackedAreasSection = async () => {
    const allLocations = await BusinessLocation.find({
      projectId,
      status: 1,
    })
      .select("_id areaName type parentId locationType")
      .lean();
    if (!allLocations.length) return null;

    const scopeLocationId = locationId ? String(locationId) : null;
    const scopeRecord = getScopeLocationRecord(allLocations, scopeLocationId);
    const scopedAreaLocs = getScopedAreaLocations({
      allLocations,
      projectType: projectTypeNum,
      scopeLocationId,
      onHomepage: !scopeLocationId,
    });

    const items = scopedAreaLocs.slice(0, 14).map((loc, idx) => ({
      id: `area-${idx + 1}`,
      locationId: String(loc._id),
      title: String(loc.areaName || "").trim(),
      link: "#",
    }));

    const scopeLabel =
      locationDisplayName ||
      String(scopeRecord?.areaName || "").trim() ||
      "";
    const childNames = scopedAreaLocs
      .map((loc) => String(loc.areaName || "").trim())
      .filter(Boolean)
      .slice(0, 14);

    const aboutUs = await AboutUs.findOne({ projectId }).select("phone phones").lean();
    const primaryPhoneObj = Array.isArray(aboutUs?.phones)
      ? aboutUs.phones.find((p) => p?.is_primary && p?.value)
      : null;
    const phoneText = String(
      primaryPhoneObj?.value ||
      aboutUs?.phone ||
      ""
    ).trim();
    const phoneHref = phoneText
      ? `tel:${phoneText.replace(/[^\d+]/g, "")}`
      : "";

    const coverageLabel = toTitleCase(project?.serviceType || "Service");
    const fallbackHeader = {
      badgeText: `${coverageLabel} Coverage`,
      heading: scopeLabel
        ? `${coverageLabel} Areas We Serve in ${scopeLabel}`
        : `${coverageLabel} Areas We Cover`,
      descriptionText: scopeLabel
        ? `Explore ${coverageLabel.toLowerCase()} coverage across ${scopeLabel}${childNames.length ? ` and nearby areas including ${childNames.slice(0, 4).join(", ")}` : ""}.`
        : "Explore service availability across the business locations configured for this project.",
    };

    let areaHeader = { ...fallbackHeader };
    try {
      const prompt = `
Generate ONLY valid JSON:
{
  "badgeText": "2-4 words",
  "title": "5-11 words",
  "subtitle": "22-40 words"
}

Context:
- Project name: ${project?.projectName || ""}
- Service type: ${project?.serviceType || ""}
- Focus keyword: ${project?.focusKeyword || ""}
- PRIMARY location for this block (write ONLY for this place): ${scopeLabel || "Global / all areas"}
- Sub-areas shown as pills under this block (do NOT write copy as if you are one of these children): ${childNames.join(", ") || "N/A"}

Rules:
- All header copy must describe service coverage for "${scopeLabel || "this service area"}" specifically.
- Do NOT write the heading as if the business is located in a child/sub-area when primary is the parent.
- If primary is a country/state, mention that region; list children only as "including X, Y" in subtitle.
- Make text specific to this business.
- Do NOT use generic placeholders.
- Do NOT include any phone number in output.
- Output JSON only.
`;
      const generated = await fetchJSONFromOpenAI(prompt, "areas_header", {
        userId: userId || project.userId,
        projectId,
        pageId,
        promptFrom: "sectionGenerationQueue",
        promptFor: "areas_header",
      });
      areaHeader = {
        badgeText: String(generated?.badgeText || "").trim() || fallbackHeader.badgeText,
        heading: String(generated?.heading || generated?.title || "").trim() || fallbackHeader.heading,
        descriptionText: String(generated?.descriptionText || generated?.subtitle || "").trim() || fallbackHeader.descriptionText,
      };
    } catch (error) {
      console.warn("[sectionGenerationQueue] areas header AI failed, using fallback:", error.message);
    }

    return {
      data: {
        badgeText: areaHeader.badgeText,
        title: areaHeader.heading,
        subtitle: areaHeader.descriptionText,
        ctaText: "Check Your Area",
        ctaHref: "#",
        phoneText: phoneText || "",
        phoneHref: phoneHref || "",
        phoneSource: "about_primary",
        items,
        contentRef: { source: "business_locations" }
      },
      meta: {
        source: "database",
        scopeLocationId: scopeLocationId || null,
        locationIds: scopedAreaLocs.map((loc) => loc._id),
      },
    };
  };

  let dbSectionPayload = null;
  if (usesServicesGridDbBuilder(normalizedSectionId)) {
    dbSectionPayload = await buildDbBackedServicesSection();
  } else if (isBusinessLocationsSection(normalizedSectionId)) {
    dbSectionPayload = await buildDbBackedAreasSection();
  }

  let resultToSave = null;
  let sectionMeta = {};
  if (dbSectionPayload?.data) {
    resultToSave = dbSectionPayload.data;
    sectionMeta = dbSectionPayload.meta || {};
  } else {
    let serviceName = "";
    if (pageType === "service" && pageDoc?.serviceId) {
      const svc = await Service.findById(pageDoc.serviceId).select("name").lean();
      serviceName = String(svc?.name || "").trim();
    } else if (pageName === "service" || isServiceTemplateWebsitePage(pageDoc || {})) {
      const firstSvc = await Service.findOne({ projectId }).select("name").sort({ createdAt: 1 }).lean();
      serviceName = String(firstSvc?.name || project?.serviceType || "").trim();
    }

    const rawPrompt = sectionModule.prompt({
      project,
      location: location || {},
      extraData: {
        pageId,
        pageType,
        sectionId: normalizedSectionId,
        serviceName,
        serviceNames,
        servicesCount: serviceNames.length
      }
    });

    const prompt = buildLocationAwarePrompt(rawPrompt, locationDisplayName, normalizedSectionId);

    let result;
    try {
      result = await fetchValidatedSectionJson({
        prompt,
        sectionId: normalizedSectionId,
        label: normalizedSectionId,
        tracking: {
          userId: userId || project.userId,
          projectId,
          pageId,
          promptFrom: "sectionGenerationQueue",
          promptFor: `${normalizedSectionId}_content`,
        },
      });
    } catch (genErr) {
      if (
        normalizedSectionId === "aboutservice" &&
        pageType === "service" &&
        pageDoc?.serviceId
      ) {
        const fallback = await loadWizardAboutserviceFallback(projectId, locationId);
        if (fallback) {
          console.warn(
            `[sectionGenerationQueue] aboutservice fallback from Service wizard page project=${projectId} location=${locationId || "null"}`
          );
          result = fallback;
        } else {
          throw genErr;
        }
      } else {
        throw genErr;
      }
    }

    resultToSave =
      result && typeof result === "object" && !Array.isArray(result)
        ? stripLegacyImagePromptFields({ ...result })
        : result;
  }

  if (
    typeof sectionModule.imageCount === "number" &&
    resultToSave &&
    typeof resultToSave === "object" &&
    !Array.isArray(resultToSave)
  ) {
    resultToSave.image_count = sectionModule.imageCount;
  }

  // Process section guardrail: auto-fix generic static values if model returns them.
  if (normalizedSectionId === "process" && resultToSave && typeof resultToSave === "object" && !Array.isArray(resultToSave)) {
    const categoryBase = toTitleCase(project?.mainCategory || project?.focusKeyword || "Service");
    const rawBadge = String(resultToSave.badge || "").trim();
    const rawTitle = String(resultToSave.title || "").trim();

    if (!rawBadge || /^workflow$/i.test(rawBadge)) {
      resultToSave.badge = `${categoryBase} Flow`;
    }

    if (!rawTitle || /^(our process|how we work)$/i.test(rawTitle)) {
      resultToSave.title = `How ${categoryBase} Works`;
    }
  }

  // Homepage hero: mirror image prompts + count on UserProject for legacy consumers
  if (normalizedSectionId === "hero" && resultToSave && typeof resultToSave === "object") {
    const { ai_image_prompt, non_ai_image_prompt } = resultToSave;
    if (ai_image_prompt || non_ai_image_prompt) {
      await UserProject.findByIdAndUpdate(projectId, {
        $set: {
          ...(ai_image_prompt ? { ai_image_prompt } : {}),
          ...(non_ai_image_prompt ? { non_ai_image_prompt } : {}),
          ...(typeof sectionModule.imageCount === "number"
            ? { image_count: sectionModule.imageCount }
            : {}),
        },
        $unset: { coverImagePrompt: "", otherImagesPrompt: "" },
      });
    }
  }

  // ✅ SAFETY FALLBACK
  if (normalizedSectionId === "hero" && resultToSave && typeof resultToSave === "object") {
    resultToSave.badgeText = resultToSave.badgeText || "Trusted Experts";

    const isValidTrustItem = (item) => {
      if (!item || typeof item !== "object") return false;
      const icon = String(item.icon || "").trim();
      const label = String(item.label || "").trim();
      return Boolean(icon && label);
    };

    const normalizeTrustIcon = (rawIcon = "") => {
      const cleaned = String(rawIcon || "").trim();
      if (!cleaned) return "";
      if (cleaned.startsWith("fa-")) return cleaned;
      if (cleaned.startsWith("fas fa-")) return cleaned.replace(/^fas\s+/, "");
      if (cleaned.startsWith("fa fa-")) return cleaned.replace(/^fa\s+/, "");
      if (cleaned.startsWith("far fa-")) return cleaned.replace(/^far\s+/, "");
      return cleaned.includes("fa-") ? cleaned.slice(cleaned.indexOf("fa-")) : `fa-${cleaned.replace(/^fa-?/, "")}`;
    };

    const fallbackTrustStripItems = [
      { icon: "fa-clock", label: "24/7 Service" },
      { icon: "fa-medal", label: "Licensed & Insured" },
      { icon: "fa-star", label: "Top Rated Team" },
    ];

    const rawTrustStripItems = Array.isArray(resultToSave.trustStripItems)
      ? resultToSave.trustStripItems
      : [];

    const normalizedTrustStripItems = rawTrustStripItems
      .filter(isValidTrustItem)
      .map((item) => ({
        icon: normalizeTrustIcon(item.icon),
        label: String(item.label || "").trim(),
      }))
      .filter((item) => item.icon && item.label)
      .slice(0, 3);

    resultToSave.trustStripItems =
      normalizedTrustStripItems.length === 3 ? normalizedTrustStripItems : fallbackTrustStripItems;
  }

  if (normalizedSectionId === "faq" && Array.isArray(resultToSave)) {
    resultToSave = coerceFaqSectionPayload({ items: resultToSave });
  }

  if (resultToSave && typeof resultToSave === "object" && !Array.isArray(resultToSave)) {
    // Normalize common heading keys across section prompts to one canonical shape.
    const canonicalTitle = String(
      resultToSave.heading ||
      resultToSave.title ||
      resultToSave.sectionTitle ||
      ""
    ).trim();
    const canonicalSubtitle = String(
      resultToSave.descriptionText ||
      resultToSave.subtitle ||
      resultToSave.description ||
      resultToSave.sectionSubtitle ||
      ""
    ).trim();
    if (canonicalTitle) {
      resultToSave.title = canonicalTitle;
    }
    if (canonicalSubtitle) {
      resultToSave.subtitle = canonicalSubtitle;
      if (!resultToSave.description) {
        resultToSave.description = canonicalSubtitle;
      }
    }

    if (normalizedSectionId === "about") {
      const featureBoxes = Array.isArray(resultToSave.featureBoxes)
        ? resultToSave.featureBoxes
        : [];
      resultToSave.featureBoxes = featureBoxes.slice(0, 2).map((box, idx) => ({
        icon: String(box?.icon || box?.iconClass || "fas fa-check-circle").trim(),
        heading: String(box?.heading || box?.title || `Why Choose Us ${idx + 1}`).trim(),
        description: String(box?.description || "").trim(),
      }));
      resultToSave.ctaText = String(
        resultToSave.ctaText || resultToSave.buttonText || "Learn More"
      ).trim();
    }

    if (normalizedSectionId === "whychooseus" || normalizedSectionId === "why-choose-us") {
      const rawItems = Array.isArray(resultToSave.featureBoxes)
        ? resultToSave.featureBoxes
        : (Array.isArray(resultToSave.items) ? resultToSave.items : []);
      const normalizedItems = rawItems.slice(0, 10).map((item, idx) => ({
        icon: String(item?.icon || item?.iconClass || "fas fa-star").trim(),
        iconClass: String(item?.iconClass || item?.icon || "fas fa-star").trim(),
        title: String(item?.title || item?.heading || `Feature ${idx + 1}`).trim(),
        description: String(item?.description || "").trim(),
      }));
      resultToSave.featureBoxes = normalizedItems;
      resultToSave.items = normalizedItems;
    }

    if (normalizedSectionId === "guarantee") {
      const rawList = Array.isArray(resultToSave.guaranteeList)
        ? resultToSave.guaranteeList
        : (Array.isArray(resultToSave.items) ? resultToSave.items : []);
      resultToSave.guaranteeList = rawList.slice(0, 8).map((it) => ({
        icon: String(it?.icon || it?.iconClass || "fas fa-check-circle").trim(),
        line: String(it?.line || it?.title || it?.description || "").trim(),
      })).filter((it) => it.line);
      if (resultToSave.guaranteeList.length < 4) {
        resultToSave.guaranteeList = [
          { icon: "fas fa-check-circle", line: "Verified workmanship standards" },
          { icon: "fas fa-check-circle", line: "Transparent pricing with approvals" },
          { icon: "fas fa-check-circle", line: "Qualified and insured professionals" },
          { icon: "fas fa-check-circle", line: "Prompt support after completion" },
        ];
      }
      const statCard = resultToSave.statCard || {};
      resultToSave.statCard = {
        icon: String(statCard.icon || "fas fa-shield-halved").trim(),
        label: String(statCard.label || "Service Reliability").trim(),
        value: String(statCard.value || "98%").trim(),
        description: String(statCard.description || "Successful, quality-checked visits").trim(),
      };
      resultToSave.items = resultToSave.guaranteeList.map((it, idx) => ({
        id: `guarantee-${idx + 1}`,
        title: it.line,
        icon: it.icon,
      }));
    }

    if (normalizedSectionId === "faq") {
      const beforeCount = Array.isArray(resultToSave.items) ? resultToSave.items.length : 0;
      coerceFaqSectionPayload(resultToSave);
      if (resultToSave.items.length < 4) {
        console.warn(
          `[sectionGenerationQueue] FAQ on page ${pageId}: only ${resultToSave.items.length} items after normalization (raw=${beforeCount})`
        );
      }

      const faqCtaTitle = String(
        resultToSave.faqCtaTitle || resultToSave.ctaTitle || "Still have questions?"
      ).trim();
      const faqCtaDescription = String(
        resultToSave.faqCtaDescription ||
          resultToSave.ctaSubtitle ||
          "Talk to a real professional. Average pickup in under 30 seconds, available 24/7."
      ).trim();
      resultToSave.faqCtaTitle = faqCtaTitle;
      resultToSave.faqCtaDescription = faqCtaDescription;
      resultToSave.ctaTitle = faqCtaTitle;
      resultToSave.ctaSubtitle = faqCtaDescription;

      const aboutUsFaq = await AboutUs.findOne({ projectId })
        .select("phone phones")
        .lean();
      const phoneSource = String(resultToSave.ctaButtonContactSource || "about_primary").trim();
      if (phoneSource !== CONTACT_SOURCE.MANUAL) {
        const resolved = resolvePhone(
          {
            source: phoneSource,
            pickIndex: resultToSave.ctaButtonContactPickIndex,
            text: resultToSave.ctaButtonText,
            link: resultToSave.ctaButtonLink,
          },
          aboutUsFaq
        );
        if (resolved.text) {
          const display = /^call\b/i.test(resolved.text) ? resolved.text : `Call ${resolved.text}`;
          resultToSave.ctaButtonText = display;
          resultToSave.ctaButtonLink = resolved.link;
          resultToSave.ctaButtonContactSource = resolved.source;
          if (resolved.source === CONTACT_SOURCE.ABOUT_PICK) {
            resultToSave.ctaButtonContactPickIndex = resolved.pickIndex;
          }
        } else {
          resultToSave.ctaButtonText = "";
          resultToSave.ctaButtonLink = "";
          resultToSave.ctaButtonContactSource = CONTACT_SOURCE.ABOUT_PRIMARY;
        }
      }
    }

    if (normalizedSectionId === "cta") {
      const aboutUs = await AboutUs.findOne({ projectId }).select("phone phones email emails").lean();
      const primaryPhoneObj = Array.isArray(aboutUs?.phones)
        ? aboutUs.phones.find((p) => p?.is_primary && p?.value)
        : null;
      const primaryEmailObj = Array.isArray(aboutUs?.emails)
        ? aboutUs.emails.find((e) => e?.is_primary && e?.value)
        : null;
      const primaryPhone = String(primaryPhoneObj?.value || aboutUs?.phone || "").trim();
      const primaryEmail = String(primaryEmailObj?.value || aboutUs?.email || "").trim();
      if (primaryPhone) {
        resultToSave.contactText = primaryPhone;
        resultToSave.phoneNumber = primaryPhone;
        resultToSave.contactHref = `tel:${primaryPhone.replace(/[^\d+]/g, "")}`;
        resultToSave.phoneHref = resultToSave.contactHref;
      } else if (primaryEmail) {
        resultToSave.contactText = primaryEmail;
        resultToSave.contactHref = `mailto:${primaryEmail}`;
      } else {
        resultToSave.contactText = "";
        resultToSave.contactHref = "";
      }

      const rawTrust = Array.isArray(resultToSave.items) ? resultToSave.items : [];
      const trustItems = rawTrust.slice(0, 3).map((it, idx) => {
        const iconRaw = String(it?.icon || it?.iconClass || "fa-check-circle").trim();
        const icon = iconRaw.startsWith("fa-")
          ? iconRaw
          : iconRaw.replace(/^fas\s+fa-/, "fa-").replace(/^fa\s+/, "fa-") || "fa-check-circle";
        return {
          label: String(it?.label || it?.title || it?.line || it?.description || "").trim(),
          icon,
          title: String(it?.title || it?.label || "").trim(),
        };
      }).filter((it) => it.label);
      while (trustItems.length < 3) {
        const fallbacks = [
          { label: "Licensed & Insured", icon: "fa-shield-halved" },
          { label: "Upfront Pricing", icon: "fa-tag" },
          { label: "Satisfaction Guaranteed", icon: "fa-circle-check" },
        ];
        trustItems.push(fallbacks[trustItems.length]);
      }
      resultToSave.items = trustItems.slice(0, 3);
      resultToSave.phoneSubText = String(
        resultToSave.phoneSubText || resultToSave.phoneSub || "Call now for fast, professional service"
      ).trim();
    }

    resultToSave = await attachGeneratedImagesToSectionData({
      project,
      projectId,
      sectionId: normalizedSectionId,
      sectionModule,
      data: resultToSave,
    });

  }

  console.log("💾 Saving SectionContent:", {
    projectId,
    pageId,
    sectionId: normalizedSectionId,
    locationId
  });

  const isServiceBundleWrite =
    (getSectionResolver(normalizedSectionId) === "service_bundle" || normalizedSectionId === "faq") &&
    String(pageDoc?.pageType || "").toLowerCase() === "service" &&
    pageDoc?.serviceId;

  if (resultToSave && typeof resultToSave === "object" && !Array.isArray(resultToSave)) {
    if (normalizedSectionId === "areas") {
      delete resultToSave.items;
    }
  }

  if (isServiceBundleWrite) {
    const bundleLocationId = pageDoc?.locationId || locationId || null;
    await SectionContent.findOneAndUpdate(
      {
        projectId,
        pageId: pageDoc.serviceId,
        serviceId: pageDoc.serviceId,
        sectionId: "service_sections",
        locationId: bundleLocationId
      },
      {
        $set: {
          [`data.sections.${normalizedSectionId}`]: resultToSave,
          "data.serviceId": pageDoc.serviceId,
          "data.locationId": bundleLocationId,
          status: "generated",
          error: null,
          locationId: bundleLocationId,
          meta: {
            ...sectionMeta,
            generatedFrom:
              sectionMeta.generatedFrom ||
              sectionMeta.copySource ||
              (dbSectionPayload?.data ? "database" : "openai"),
            serviceIds: sectionMeta.serviceIds || [],
            locationIds: sectionMeta.locationIds || []
          }
        }
      },
      { upsert: true }
    );
    if (bundleLocationId) {
      await SectionContent.deleteMany({
        projectId,
        pageId: pageDoc.serviceId,
        serviceId: pageDoc.serviceId,
        sectionId: "service_sections",
        locationId: null,
        status: "pending"
      });
    }
    console.info(`[content-resolver:service-bundle-write] project=${projectId} service=${pageDoc.serviceId} location=${bundleLocationId} section=${normalizedSectionId}`);
  } else {
    await SectionContent.findOneAndUpdate(
      {
        projectId,
        ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
        sectionId: normalizedSectionId,
        locationId: locationId || null
      },
      {
        $set: {
          pageId: normalizedPageId,
          data: resultToSave,
          status: "generated",
          error: null,
          locationId: locationId || null,
          meta: {
            ...sectionMeta,
            generatedFrom:
              sectionMeta.generatedFrom ||
              sectionMeta.copySource ||
              (dbSectionPayload?.data ? "database" : "openai"),
            serviceIds: sectionMeta.serviceIds || [],
            locationIds: sectionMeta.locationIds || []
          }
        }
      },
      { upsert: true }
    );
    if (locationId) {
      await SectionContent.deleteMany({
        projectId,
        ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
        sectionId: normalizedSectionId,
        locationId: null,
        status: "pending"
      });
    }
    const sameScopeRows = await SectionContent.find({
      projectId,
      ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
      sectionId: normalizedSectionId,
      locationId: locationId || null
    })
      .select("_id updatedAt")
      .sort({ updatedAt: -1, _id: -1 })
      .lean();
    if (sameScopeRows.length > 1) {
      const staleIds = sameScopeRows.slice(1).map((r) => r._id);
      if (staleIds.length) await SectionContent.deleteMany({ _id: { $in: staleIds } });
    }
  }

  // Strict SST: do not mutate WebsiteDesignsData section content from queue.
}

// =========================
// WORKER PROCESS
// =========================

sectionGenerationQueue.process("generate-section", 2, async (job) => {
  const {
    projectId,
    locations = [],
    includeDefaultHomepage = true,
    homepageLocationId = null,
    selectedSectionIds = [],
    perLocationContentByPage: jobPerLocationContentByPage = null,
    onlyServiceIds: jobOnlyServiceIds = [],
    onlyServicePageIds: jobOnlyServicePageIds = [],
    servicesWizardOnly: jobServicesWizardOnly = false,
    userId = null
  } = job.data || {};

  if (!projectId) throw new Error("projectId is required");

  const onlyServiceIdSet = new Set(
    (Array.isArray(jobOnlyServiceIds) ? jobOnlyServiceIds : [])
      .map((id) => String(id || "").trim())
      .filter(Boolean)
  );
  const onlyServicePageIdSet = new Set(
    (Array.isArray(jobOnlyServicePageIds) ? jobOnlyServicePageIds : [])
      .map((id) => String(id || "").trim())
      .filter(Boolean)
  );
  const servicesWizardOnly =
    Boolean(jobServicesWizardOnly) ||
    onlyServiceIdSet.size > 0 ||
    onlyServicePageIdSet.size > 0;

  const designDataDoc = await WebsiteDesignsData.findOne({ projectId });
  const designData = designDataDoc || { pages: [], pageStyles: {} };
  if (!servicesWizardOnly && !designData?.pages?.length) {
    throw new Error("No pages found");
  }

  const perLocationContentByPage = {
    ...(designData?.pageStyles?.perLocationContentByPage || {}),
    ...(jobPerLocationContentByPage && typeof jobPerLocationContentByPage === "object"
      ? jobPerLocationContentByPage
      : {}),
  };

  console.log("[sectionGenerationQueue] START", {
    projectId,
    selectedSectionsCount: (selectedSectionIds || []).length,
    selectedSectionIds,
    locationsCount: Array.isArray(locations) ? locations.length : 0,
    perLocationContentByPage,
    servicesWizardOnly,
    onlyServiceIds: [...onlyServiceIdSet],
  });

  const project = await UserProject.findById(projectId);
  if (!project) throw new Error("Project not found");

  // Build dynamic variant -> section mapping from DB (no hardcoded section list)
  const componentDocs = await WebsiteComponent.find({})
    .select("name variants uniqueId")
    .lean();
  const variantToSection = new Map();
  for (const doc of componentDocs || []) {
    const sectionName = String(doc?.name || "").trim().toLowerCase();
    if (!sectionName) continue;
    variantToSection.set(sectionName, sectionName);

    for (const v of doc?.variants || []) {
      if (!v?.uniqueId || v?.status === 0) continue;
      variantToSection.set(String(v.uniqueId).trim().toLowerCase(), sectionName);
    }

    if (doc?.uniqueId) {
      variantToSection.set(String(doc.uniqueId).trim().toLowerCase(), sectionName);
    }
  }

  const canonicalSectionId = (rawId = "") => {
    const value = String(rawId || "").trim().toLowerCase().replace(/\.tsx$/i, "");
    if (!value) return "";
    const aliases = {
      servicesgrid: "services",
      "whychooseus": "why-choose-us",
      "why-choose-us": "whychooseus",
      navbar: "header",
    };
    if (aliases[value]) return aliases[value];

    if (resolveSectionFile(value)) return value;
    if (variantToSection.has(value)) return variantToSection.get(value);

    const prefix = value.split(/[_-]/)[0];
    if (aliases[prefix]) return aliases[prefix];
    if (resolveSectionFile(prefix)) return prefix;
    if (variantToSection.has(prefix)) return variantToSection.get(prefix);

    return value;
  };

  // Load user-created services (Step 4) once per job and pass to prompts.
  const services = await Service.find({ projectId })
    .select("name")
    .lean();
  const serviceNames = [...new Set(
    (services || [])
      .map((s) => String(s.name || "").trim())
      .filter(Boolean)
  )];

  const pageIds = [...new Set(
    (designData?.pages || [])
      .map((page) => page?.pageId?._id?.toString() || page?.pageId?.toString())
      .filter(Boolean)
  )];
  const websitePages = pageIds.length
    ? await WebsitePage.find({ projectId, _id: { $in: pageIds } })
      .select("_id name slug pageType displayName perLocationContent serviceId locationId")
      .lean()
    : [];
  const pageMetaById = new Map(
    (websitePages || []).map((p) => [String(p._id), p])
  );

  let selectedSectionList = (selectedSectionIds || []).map((s) => canonicalSectionId(s)).filter(Boolean);
  if (servicesWizardOnly) {
    selectedSectionList = selectedSectionList.filter((id) => isServiceDetailSection(id));
  }
  const selectedSet = new Set(selectedSectionList);

  const incomingLocations = Array.isArray(locations) ? locations : [];
  const projectType = Number(project?.projectType ?? 0);
  const isBusinessProject = projectType === 1;
  const isBulkProject = projectType === 0;
  const mainParentLocation = isBusinessProject
    ? resolveMainParentLocation(incomingLocations, { isBusinessProject: true })
    : null;

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const pageSummaries = [];
  const generatedServiceSectionKeys = new Set();

  if (!servicesWizardOnly) for (const page of designData.pages) {
    const normalizedSections = ensureHeaderFooterComponents(getPageSections(page));
    assignPageSections(page, normalizedSections);
    const pageId =
      page?.pageId?._id?.toString() ||
      page?.pageId?.toString() ||
      page?._id?.toString();
    const pageMeta = pageMetaById.get(String(pageId || ""));
    if (isServiceDetailWebsitePage(pageMeta)) {
      continue;
    }
    const pageName = String(pageMeta?.name || "").toLowerCase().trim();
    const pageSlug = String(pageMeta?.slug || pageName).toLowerCase().trim().replace(/^\/+|\/+$/g, "");
    const configPageKey = resolveConfigPageKey(pageMeta);
    const isServiceTemplatePage = isServiceTemplateWebsitePage(pageMeta);
    const pageLocationList = buildPageLocationList({
      projectType,
      isBusinessProject,
      configPageKey,
      perLocationContentByPage,
      pageMeta,
      incomingLocations,
      mainParentLocation,
    });

    console.log("[sectionGenerationQueue] page location scope", {
      projectId,
      pageId,
      configPageKey,
      perLocationContent: pageMeta?.perLocationContent,
      locationScopes: pageLocationList.length,
      locationIds: pageLocationList.map((loc) => (loc?._id ? String(loc._id) : null)),
    });

    const pageSummary = {
      pageId,
      pageName: pageMeta?.displayName || pageMeta?.name || pageSlug || String(pageId),
      selectedSections: [],
      saved: [],
      failed: [],
      skipped: [],
    };

    const seenSectionsForPage = new Set();
    for (const comp of getPageSections(page)) {
      const sectionId = canonicalSectionId(comp?.sectionData?.type || "");

      if (!sectionId) continue;

      // Service-detail sections on non-template pages are generated in pass 2 (real service URLs).
      if (isServiceDetailSection(sectionId) && sectionId !== "faq" && !isServiceTemplatePage) {
        pageSummary.skipped.push({ sectionId, reason: "service_template_pass" });
        continue;
      }

      if (sectionId === "header" || sectionId === "footer") {
        pageSummary.skipped.push({ sectionId, reason: "site_wide_header_footer" });
        continue;
      }

      // Avoid duplicate generation when the same section type appears multiple
      // times in a page's componentIds (can happen after legacy/fallback mappings).
      if (seenSectionsForPage.has(sectionId)) {
        pageSummary.skipped.push({ sectionId, reason: "duplicate_section_on_page" });
        continue;
      }
      seenSectionsForPage.add(sectionId);

      if (selectedSet.size && !selectedSet.has(sectionId)) {
        pageSummary.skipped.push({ sectionId, reason: "not_selected" });
        continue;
      }
      pageSummary.selectedSections.push(sectionId);

      for (const location of pageLocationList) {
        const locationId = location?._id || null;
        const normalizedPageId = normalizeMixedIdForStorage(pageId);
        const pageIdCandidates = buildMixedIdCandidates(pageId);

        try {
          const generationResult = await generateSingleSection({
            project,
            designData,
            projectId,
            userId,
            pageId,
            sectionId,
            location,
            locationId,
            serviceNames
          });

          if (generationResult?.skipped) {
            skipped++;
            pageSummary.skipped.push({
              sectionId,
              locationId: locationId || null,
              reason: "generator_skipped"
            });
            continue;
          }

          success++;
          pageSummary.saved.push({
            sectionId,
            locationId: locationId || null
          });
          if (
            String(pageMeta?.pageType || "").toLowerCase() === "service" &&
            pageMeta?.serviceId
          ) {
            generatedServiceSectionKeys.add(`${String(pageId)}::${sectionId}`);
          }
        } catch (err) {
          failed++;
          pageSummary.failed.push({
            sectionId,
            locationId: locationId || null,
            error: err.message
          });

          await SectionContent.findOneAndUpdate(
            {
              projectId,
              ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
              sectionId,
              locationId: locationId || null
            },
            {
              $set: {
                pageId: normalizedPageId,
                status: "failed",
                error: err.message,
                locationId: locationId || null
              }
            },
            { upsert: true }
          );
        }
      }
    }
    pageSummaries.push({
      ...pageSummary,
      selectedSectionsCount: pageSummary.selectedSections.length,
      savedCount: pageSummary.saved.length,
      failedCount: pageSummary.failed.length,
      skippedCount: pageSummary.skipped.length,
    });
  }

  // Service template sections (Step 6 "Service" page) are not saved on WebsiteDesignsData
  // because that row is templateOnly. Generate them for every pageType=service page instead.
  if ((isBusinessProject || isBulkProject) && selectedSet.size > 0) {
    const serviceTemplateSectionIds = [...selectedSet].filter((id) =>
      isServiceDetailSection(id)
    );

    if (serviceTemplateSectionIds.length) {
      let servicePages = await WebsitePage.find({
        projectId,
        pageType: "service",
        serviceId: { $exists: true, $ne: null },
        ...(isBulkProject ? {} : { locationId: { $exists: true, $ne: null } }),
      })
        .select("_id serviceId locationId slug name")
        .lean();

      const scopedLocationIds = new Set(
        (incomingLocations || []).map((loc) => String(loc?._id || loc?.id || "")).filter(Boolean)
      );
      const serviceTemplatePageMeta = (websitePages || []).find(
        (p) => String(p?.name || "").toLowerCase() === "service" && !p?.serviceId
      ) || null;
      const serviceToggleOn = resolvePageLocationToggle({
        configPageKey: "service",
        pageMeta: serviceTemplatePageMeta,
        perLocationContentByPage,
      });

      if (isBulkProject) {
        if (scopedLocationIds.size) {
          servicePages = (servicePages || []).filter(
            (sp) => !sp.locationId || scopedLocationIds.has(String(sp.locationId || ""))
          );
        }
        if (!serviceToggleOn) {
          servicePages = (servicePages || []).filter((sp) => !sp.locationId);
        }
      } else if (!servicesWizardOnly && !serviceToggleOn) {
        const parentId = mainParentLocation
          ? String(mainParentLocation._id || mainParentLocation.id || "")
          : "";
        servicePages = (servicePages || []).filter(
          (sp) => parentId && String(sp.locationId || "") === parentId
        );
      } else if (scopedLocationIds.size) {
        servicePages = (servicePages || []).filter((sp) =>
          scopedLocationIds.has(String(sp.locationId || ""))
        );
      }
      if (onlyServiceIdSet.size) {
        servicePages = (servicePages || []).filter((sp) =>
          onlyServiceIdSet.has(String(sp.serviceId || ""))
        );
      }
      if (onlyServicePageIdSet.size) {
        servicePages = (servicePages || []).filter((sp) =>
          onlyServicePageIdSet.has(String(sp._id || ""))
        );
      }

      const locationIds = [
        ...new Set(
          (servicePages || [])
            .map((p) => String(p.locationId || ""))
            .filter(Boolean)
        ),
      ];

      const locationDocs = locationIds.length
        ? await BusinessLocation.find({ _id: { $in: locationIds }, projectId, status: 1 }).lean()
        : [];

      const locationById = new Map(
        (locationDocs || []).map((loc) => [String(loc._id), loc])
      );
      const parentIds = [
        ...new Set(
          (locationDocs || [])
            .map((loc) => (loc.parentId ? String(loc.parentId) : ""))
            .filter(Boolean)
        ),
      ].filter((pid) => !locationById.has(pid));

      if (parentIds.length) {
        const parents = await BusinessLocation.find({
          _id: { $in: parentIds },
          projectId,
          status: 1,
        })
          .select("_id areaName")
          .lean();
        for (const p of parents || []) {
          locationById.set(String(p._id), p);
        }
      }

      const formatLoc = (loc) => {
        if (!loc) return null;
        const parent =
          loc.parentId && locationById.get(String(loc.parentId))
            ? locationById.get(String(loc.parentId))
            : null;
        return {
          _id: loc._id,
          name: String(loc.areaName || "").trim(),
          parentName: parent ? String(parent.areaName || "").trim() : "",
          city: String(loc.city || "").trim(),
          state: String(loc.state || "").trim(),
          type: loc.type,
        };
      };

      const serviceTemplateSummary = {
        pageId: "service-template",
        pageName: "Service pages (single service template)",
        selectedSections: serviceTemplateSectionIds,
        saved: [],
        failed: [],
        skipped: [],
      };

      console.log("[sectionGenerationQueue] service-template pass", {
        projectId,
        servicePages: servicePages.length,
        sectionIds: serviceTemplateSectionIds,
        servicesWizardOnly,
        onlyServiceIds: [...onlyServiceIdSet],
      });

      if (!servicePages.length) {
        serviceTemplateSummary.skipped.push({
          sectionId: "*",
          reason: "no_service_pages",
          message: "No pageType=service pages yet (complete Step 4 services first)",
        });
      }

      for (const sp of servicePages) {
        const locDoc = locationById.get(String(sp.locationId || ""));
        const locationPayload = formatLoc(locDoc);

        for (const sectionId of serviceTemplateSectionIds) {
          const dedupeKey = `${String(sp._id)}::${sectionId}`;
          if (generatedServiceSectionKeys.has(dedupeKey)) {
            serviceTemplateSummary.skipped.push({
              sectionId,
              locationId: sp.locationId,
              servicePageId: sp._id,
              reason: "already_generated_on_design_page",
            });
            continue;
          }

          try {
            const generationResult = await generateSingleSection({
              project,
              designData,
              projectId,
              userId,
              pageId: sp._id,
              sectionId,
              location: locationPayload,
              locationId: sp.locationId,
              serviceNames,
            });

            if (generationResult?.skipped) {
              skipped++;
              serviceTemplateSummary.skipped.push({
                sectionId,
                locationId: sp.locationId,
                servicePageId: sp._id,
                reason: "generator_skipped",
              });
              continue;
            }

            success++;
            generatedServiceSectionKeys.add(dedupeKey);
            serviceTemplateSummary.saved.push({
              sectionId,
              locationId: sp.locationId,
              servicePageId: sp._id,
            });
          } catch (err) {
            failed++;
            serviceTemplateSummary.failed.push({
              sectionId,
              locationId: sp.locationId,
              servicePageId: sp._id,
              error: err.message,
            });

            await SectionContent.findOneAndUpdate(
              {
                projectId,
                pageId: sp.serviceId,
                serviceId: sp.serviceId,
                sectionId: "service_sections",
                locationId: sp.locationId || null,
              },
              {
                $set: {
                  status: "failed",
                  error: err.message,
                  locationId: sp.locationId || null,
                },
              },
              { upsert: true }
            ).catch(() => {});
          }
        }
      }

      pageSummaries.push({
        ...serviceTemplateSummary,
        selectedSectionsCount: serviceTemplateSummary.selectedSections.length,
        savedCount: serviceTemplateSummary.saved.length,
        failedCount: serviceTemplateSummary.failed.length,
        skippedCount: serviceTemplateSummary.skipped.length,
      });
    }
  }

  try {
    if (typeof designData?.isModified === "function" && designData.isModified()) {
      await designData.save();
    }
  } catch (err) {
    // Another concurrent generation/save may update the same design doc version.
    // SectionContent is already the source of truth, so do not fail the entire job on this.
    if (err?.name === "VersionError") {
      console.warn("[sectionGenerationQueue] designData version conflict; continuing with SectionContent state");
    } else {
      throw err;
    }
  }

  try {
    const hfSync = await syncHeaderFooterSectionsForProject(projectId);
    console.log("[sectionGenerationQueue] header/footer sync:", hfSync);
  } catch (hfErr) {
    console.warn("[sectionGenerationQueue] header/footer sync failed:", hfErr.message);
  }

  const seoSummary = await generateSeoAfterSectionGeneration({
    project,
    projectId,
    userId,
    pageIds: servicesWizardOnly && onlyServicePageIdSet.size
      ? [...onlyServicePageIdSet]
      : null,
  });

  for (const page of pageSummaries) {
    const pageLabel = String(page?.pageName || page?.pageId || "unknown-page");
    console.log(`[sectionGenerationQueue][page] ${pageLabel} (id=${page?.pageId || "-"})`);

    for (const savedItem of (page?.saved || [])) {
      console.log(
        `[sectionGenerationQueue][saved] page=${pageLabel} section=${savedItem?.sectionId || "-"} location=${savedItem?.locationId || "null"}`
      );
    }

    for (const failedItem of (page?.failed || [])) {
      console.error(
        `[sectionGenerationQueue][failed] page=${pageLabel} section=${failedItem?.sectionId || "-"} location=${failedItem?.locationId || "null"} reason=${failedItem?.error || "unknown"}`
      );
    }

    for (const skippedItem of (page?.skipped || [])) {
      console.warn(
        `[sectionGenerationQueue][skipped] page=${pageLabel} section=${skippedItem?.sectionId || "-"} location=${skippedItem?.locationId || "null"} reason=${skippedItem?.reason || "unknown"}`
      );
    }
  }

  console.log("[sectionGenerationQueue] RESULT", {
    projectId,
    totals: {
      success,
      failed,
      skipped,
      pagesProcessed: pageSummaries.length,
    },
    pages: pageSummaries.map((p) => ({
      pageId: p.pageId,
      pageName: p.pageName,
      selectedSectionsCount: p.selectedSectionsCount,
      savedCount: p.savedCount,
      failedCount: p.failedCount,
      skippedCount: p.skippedCount,
    })),
    seo: {
      created: seoSummary?.created || 0,
      alreadyComplete: seoSummary?.alreadyComplete ?? seoSummary?.skipped ?? 0,
      stillMissing: seoSummary?.stillMissing || 0,
      failed: seoSummary?.failed || 0,
      createdPageUrls: seoSummary?.createdPageUrls || [],
    }
  });

  await cleanupStalePendingSectionContent(projectId);

  if (isBusinessProject) {
    await SectionContent.deleteMany({
      projectId,
      locationId: null,
      status: "pending",
      isDeleted: { $ne: true },
    });
  }

  // Guard: if a generated row exists for a scope, remove stale pending duplicate rows.
  await SectionContent.aggregate([
    { $match: { projectId } },
    {
      $group: {
        _id: {
          projectId: "$projectId",
          pageId: "$pageId",
          sectionId: "$sectionId",
          locationId: "$locationId"
        },
        statuses: { $addToSet: "$status" },
        ids: { $push: "$_id" }
      }
    },
    {
      $match: {
        statuses: { $all: ["generated", "pending"] }
      }
    }
  ]).then(async (rows = []) => {
    const deletions = [];
    for (const row of rows) {
      const scope = row?._id || {};
      deletions.push(
        SectionContent.deleteMany({
          projectId: scope.projectId,
          pageId: scope.pageId,
          sectionId: scope.sectionId,
          locationId: scope.locationId ?? null,
          status: "pending"
        })
      );
    }
    if (deletions.length) await Promise.all(deletions);
  });

  return { success, failed, skipped, pages: pageSummaries, seo: seoSummary };
});

// =========================
// EXPORTS
// =========================

module.exports = {
  sectionGenerationQueue,
  enqueueSectionGeneration,
  SECTION_GENERATION_QUEUE
};