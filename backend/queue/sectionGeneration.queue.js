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
const {
  startProgress,
  patchProgress,
  finishProgress,
  getDefaultParallelWorkers,
  mapWithConcurrency,
} = require("../services/sectionGenerationProgress");
const resolveSectionFile = require("../sections/resolveSectionFile");
const { resolvePhone, SOURCE: CONTACT_SOURCE } = require("../services/contactResolver");
const {
  applyContactPageSectionDynamics,
} = require("../services/contactPageDynamics");
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
  serviceDetailBundleTwinId,
  locationHomeTwinId,
  isLocationMapSection,
  usesBlogCollectionBuilder,
  usesBlogDocumentBuilder,
  usesBlogAuthorBuilder,
  usesBlogRelatedBuilder,
} = require("../additional/sectionResolverRegistry");
const {
  buildBlogListSectionData,
  buildBlogArticleHeroData,
  buildBlogContentData,
  buildBlogAuthorData,
  buildBlogRelatedItems,
} = require("../services/blogSectionDynamics");
const {
  resolveLegalDocType,
  splitLegalPayload,
} = require("../services/legalSectionDynamics");
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
const GENERIC_PLACEHOLDER_RX =
  /(sample\s*question|sample\s*answer|placeholder|lorem ipsum|dummy text|question\s*\d+|answer\s*\d+)/i;

function sanitizeAiHeadingField(value = "", fallback = "") {
  const current = String(value || "").trim();
  if (!current) return String(fallback || "").trim();
  if (GENERIC_PLACEHOLDER_RX.test(current)) return String(fallback || "").trim();
  return current;
}

function buildSectionHeadingFallbacks({
  sectionId = "",
  project = {},
  locationDisplayName = "",
}) {
  const projectName = String(project?.projectName || "").trim();
  const category =
    String(project?.mainCategory || project?.serviceType || project?.focusKeyword || "Service")
      .trim();
  const locationHint = String(locationDisplayName || "").trim();
  const sectionLabel = String(sectionId || "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    badgeText: `${projectName || category} ${sectionLabel}`.trim().split(/\s+/).slice(0, 4).join(" "),
    title: `${projectName || category} ${sectionLabel || "Section"}`.trim(),
    subtitle: locationHint
      ? `Professional ${category.toLowerCase()} content tailored for ${locationHint}.`
      : `Professional ${category.toLowerCase()} content tailored for your business.`,
  };
}

function sanitizeFaqItems(items = [], project = {}, locationDisplayName = "") {
  const cleaned = (Array.isArray(items) ? items : [])
    .map((item) => ({
      question: String(item?.question || item?.title || "").trim(),
      answer: String(item?.answer || item?.description || item?.content || "").trim(),
    }))
    .filter(
      (item) =>
        item.question &&
        item.answer &&
        !GENERIC_PLACEHOLDER_RX.test(item.question) &&
        !GENERIC_PLACEHOLDER_RX.test(item.answer)
    );

  if (cleaned.length >= 4) return cleaned;

  const businessName = String(project?.projectName || "Our Team").trim();
  const category = String(project?.mainCategory || project?.serviceType || "service").trim();
  const area = String(locationDisplayName || "your area").trim();
  return [
    {
      question: `What experience does ${businessName} bring?`,
      answer: `${businessName} brings practical, hands-on ${category.toLowerCase()} experience with a quality-first process built around clear communication, reliable workmanship, and clean project delivery for customers in ${area}.`,
    },
    {
      question: `How does your team ensure consistent quality?`,
      answer: `We follow a documented workflow for every job: clear scope, careful execution, quality checks, and final walkthroughs. That approach keeps outcomes consistent and helps customers trust our ${category.toLowerCase()} team long term.`,
    },
    {
      question: `Do you serve nearby neighborhoods and surrounding areas?`,
      answer: `Yes. We support customers across ${area} and nearby neighborhoods, and we tailor recommendations to local conditions so the work stays practical, durable, and aligned with real customer needs.`,
    },
    {
      question: `What makes your company different from competitors?`,
      answer: `${businessName} focuses on transparent communication, dependable timelines, and accountable follow-through. We prioritize long-term customer relationships over one-time transactions, so each project is handled with care and professional standards.`,
    },
    {
      question: `How do customers stay informed during projects?`,
      answer: `Customers get clear updates at each major step, including scope confirmation, status updates, and final completion notes. This keeps expectations aligned and prevents confusion during delivery.`,
    },
    {
      question: `Do you stand behind the work after completion?`,
      answer: `Yes. We back completed work with responsive post-service support and practical guidance, so customers in ${area} have confidence in the outcomes long after the initial project is finished.`,
    },
  ];
}

function isTestimonialSectionId(sectionId = "") {
  const id = String(sectionId || "").toLowerCase().trim();
  return (
    id === "testimonials" ||
    id === "areastestimonials" ||
    id === "locationtestimonials" ||
    id === "servicedetailtestimonials"
  );
}

/** Stock plumbing demo badges from GenieBuild defaults — never persist these. */
const STOCK_REVIEW_SERVICE_BADGES = new Set(
  [
    "emergency pipe repair",
    "drain cleaning",
    "water heater install",
    "bathroom remodel",
    "leak detection",
    "water heater repair",
    "service booking",
    "repeat customer",
    "new installation",
    "full service",
    "emergency call",
    "same-day service",
  ].map((s) => s.toLowerCase())
);

function sanitizeTestimonialItems(items = [], project = {}, serviceNames = []) {
  const list = Array.isArray(items) ? items : [];
  const services = (Array.isArray(serviceNames) ? serviceNames : [])
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  const category = String(
    project?.mainCategory || project?.serviceType || project?.focusKeyword || "Service"
  ).trim();

  return list.map((raw, idx) => {
    const item = raw && typeof raw === "object" ? { ...raw } : {};
    const description = String(item.description || item.quote || item.content || "").trim();
    let badge = String(item.service || item.title || item.badge || "").trim();
    const badgeKey = badge.toLowerCase();
    const isStock = !badge || STOCK_REVIEW_SERVICE_BADGES.has(badgeKey);

    if (isStock) {
      // Prefer a real project service that appears in the quote; else rotate project services.
      const fromQuote = services.find((name) =>
        description.toLowerCase().includes(String(name).toLowerCase())
      );
      if (fromQuote) {
        badge = fromQuote;
      } else if (services.length) {
        badge = services[idx % services.length];
      } else {
        badge = category;
      }
    }

    item.title = badge;
    item.service = badge;
    if (!item.id) item.id = `testimonial-${idx + 1}`;
    if (description && !item.description) item.description = description;
    const rating = Number(item.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      item.rating = 5;
    }
    return item;
  });
}

function sanitizeGeneratedSectionPayload({
  sectionId = "",
  payload = {},
  project = {},
  locationDisplayName = "",
  serviceNames = [],
}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;

  const cleaned = { ...payload };
  const fallback = buildSectionHeadingFallbacks({
    sectionId,
    project,
    locationDisplayName,
  });

  if ("badgeText" in cleaned) {
    cleaned.badgeText = sanitizeAiHeadingField(cleaned.badgeText, fallback.badgeText);
  }
  if ("title" in cleaned) {
    cleaned.title = sanitizeAiHeadingField(cleaned.title, fallback.title);
  }
  if ("heading" in cleaned) {
    cleaned.heading = sanitizeAiHeadingField(cleaned.heading, fallback.title);
  }
  if ("subtitle" in cleaned) {
    cleaned.subtitle = sanitizeAiHeadingField(cleaned.subtitle, fallback.subtitle);
  }
  if ("description" in cleaned) {
    cleaned.description = sanitizeAiHeadingField(cleaned.description, fallback.subtitle);
  }
  if ("descriptionText" in cleaned) {
    cleaned.descriptionText = sanitizeAiHeadingField(cleaned.descriptionText, fallback.subtitle);
  }
  if ("intro" in cleaned) {
    cleaned.intro = sanitizeAiHeadingField(cleaned.intro, fallback.subtitle);
  }

  if (/faq/i.test(String(sectionId || "")) && Array.isArray(cleaned.items)) {
    cleaned.items = sanitizeFaqItems(cleaned.items, project, locationDisplayName);
  }

  if (isTestimonialSectionId(sectionId) && Array.isArray(cleaned.items)) {
    cleaned.items = sanitizeTestimonialItems(cleaned.items, project, serviceNames);
  }

  return cleaned;
}

function appendUniversalSectionPromptRules(rawPrompt = "", sectionId = "") {
  const base = String(rawPrompt || "").trim();
  const sid = String(sectionId || "").trim();
  return `${base}

GLOBAL SECTION RULES (apply strictly):
- Every heading-style field must be business-specific and dynamic: badgeText, title, heading, subtitle, description, descriptionText, intro.
- Never output placeholders or template labels like "Sample Question 1", "Question 1", "Sample Answer", "Lorem ipsum", "placeholder", or "dummy text".
- For any FAQ section, generate real customer questions and detailed answers specific to the business context.
- For testimonials/reviews: every item MUST include title and service (same short job badge, 2-5 words) that matches THAT review's quote — prefer real project service names; never invent unrelated stock plumbing badges.
- Keep section copy unique for this project; avoid reusable stock phrases across sites.
- For guarantee sections: never use the stock pair value "98%" + label "On-time completion"; invent a project-specific metric.
- Output strict JSON only for section "${sid}".
`;
}

function hashStringSeed(input = "") {
  let hash = 0;
  const s = String(input || "");
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildGuaranteeStatCardFallback(project = {}, serviceName = "") {
  const projectName = String(project?.projectName || "").trim() || "Our team";
  const category = String(
    project?.mainCategory || project?.serviceType || project?.focusKeyword || "service"
  ).trim();
  const focus = String(serviceName || category).trim() || "service";
  const options = [
    {
      icon: "fa-clock",
      value: "Same-day",
      label: "Booking goal",
      description: `Fast scheduling for ${focus} jobs with ${projectName}`,
    },
    {
      icon: "fa-star",
      value: "4.9★",
      label: "Customer rating",
      description: `Trusted ${category.toLowerCase()} results from ${projectName}`,
    },
    {
      icon: "fa-shield-halved",
      value: "100%",
      label: "Workmanship care",
      description: `Quality-checked ${focus.toLowerCase()} delivery every visit`,
    },
    {
      icon: "fa-headset",
      value: "24/7",
      label: "Support access",
      description: `Responsive help when ${projectName} customers need it`,
    },
    {
      icon: "fa-calendar-check",
      value: "On schedule",
      label: "Arrival promise",
      description: `Reliable timing for ${focus.toLowerCase()} appointments`,
    },
    {
      icon: "fa-award",
      value: "Local pro",
      label: "Trusted crew",
      description: `Experienced ${category.toLowerCase()} specialists from ${projectName}`,
    },
  ];
  const idx = hashStringSeed(`${projectName}::${focus}`) % options.length;
  return options[idx];
}

function isStockGuaranteeStat(value = "", label = "") {
  const v = String(value || "").trim().toLowerCase();
  const l = String(label || "").trim().toLowerCase();
  if (!v && !l) return true;
  if (v === "98%" && /on[-\s]?time\s+completion/.test(l)) return true;
  if (v === "10" && /year\s+guarantee/.test(l)) return true;
  if (v === "98%" && (!l || /jobs?\s+done\s+right/.test(l))) return true;
  return false;
}

function sanitizeGuaranteeStatCard(statCard = {}, project = {}, serviceName = "") {
  const fallback = buildGuaranteeStatCardFallback(project, serviceName);
  const icon = String(statCard?.icon || "").trim() || fallback.icon;
  let label = String(statCard?.label || "").trim();
  let value = String(statCard?.value || "").trim();
  let description = String(statCard?.description || "").trim();

  if (isStockGuaranteeStat(value, label) || !value || !label) {
    value = fallback.value;
    label = fallback.label;
    description = description || fallback.description;
  }
  if (!description) description = fallback.description;

  return {
    icon: icon.replace(/^fas?\s+/, ""),
    label,
    value,
    description,
  };
}

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
      if (normalizedId === "aboutservice" || normalizedId === "servicedetailabout") {
        const words = countSectionWords(pickAboutServiceBody(result));
        if (words >= ABOUT_SERVICE_MIN_WORDS) {
          console.warn(
            `[sectionGenerationQueue] ${normalizedId} accepted after retries at ${words} words (min ${ABOUT_SERVICE_MIN_WORDS})`
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

const { getBullRedisConfig, bullQueueName, getRedisConnectionLabel } = require("../config/bullRedis");
const crypto = require("crypto");

const SECTION_GENERATION_QUEUE = bullQueueName("section-generation");

const redisConfig = getBullRedisConfig();

const ensureHeaderFooterComponents = (componentIds = [], options = {}) => {
  const list = Array.isArray(componentIds) ? [...componentIds] : [];
  const normalized = list.filter(Boolean);
  const isContentSite = Number(options.projectType) === 2;
  const headerVariant = isContentSite ? "HeaderFunky" : "HeaderPlumbing";
  const footerVariant = isContentSite ? "FooterFunky" : "FooterPlumbing";

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
      variant_uniqueId: headerVariant,
      componentId: null,
      sectionData: {
        type: "header",
        content: {},
        styles: { variant: headerVariant },
      },
    };
  } else if (String(headerComp.sectionData?.type || "").toLowerCase() === "navbar") {
    headerComp = {
      ...headerComp,
      sectionData: { ...headerComp.sectionData, type: "header" },
    };
  }

  if (!footerComp) {
    footerComp = {
      variant_uniqueId: footerVariant,
      componentId: null,
      sectionData: {
        type: "footer",
        content: {},
        styles: { variant: footerVariant },
      },
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

const assignPageSections = (page = {}, sections = [], options = {}) => {
  page.sections = ensureHeaderFooterComponents(sections || [], options);
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
    attempts: 3,
    backoff: { type: "fixed", delay: 15000 },
    removeOnComplete: true,
    // Keep failures visible for ops / re-queue debugging
    removeOnFail: false,
  },
});

/**
 * Process handler body is assigned later in this file (sync load).
 * IMPORTANT: do NOT register Bull `.process()` until Mongo is connected —
 * otherwise jobs fail with "buffering timed out" and sit forever in `failed`.
 */
let runSectionGenerationJob = async () => {
  throw new Error("Section generation worker not finished loading");
};

let workerStarted = false;

async function ensureMongooseReady(timeoutMs = 45000) {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState === 1) return;

  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("MongoDB still connecting — section generation aborted")),
        timeoutMs
      );
      const onConnected = () => {
        clearTimeout(timer);
        resolve();
      };
      mongoose.connection.once("connected", onConnected);
    });
    return;
  }

  // Disconnected / disconnecting — attempt reconnect via shared connectDB.
  const connectDB = require("../config/db");
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    throw new Error(
      "MongoDB is not connected — cannot generate sections. Restart the backend after Mongo is reachable."
    );
  }
}

/**
 * Call once after Mongo connects (from ai.js startup). Safe to call repeatedly.
 */
function startSectionGenerationWorker() {
  if (workerStarted) return sectionGenerationQueue;
  workerStarted = true;

  sectionGenerationQueue.process("generate-section", 2, async (job) => {
    await ensureMongooseReady();
    return runSectionGenerationJob(job);
  });

  console.log(
    `🔥 Section queue worker started queue="${SECTION_GENERATION_QUEUE}" redis=${getRedisConnectionLabel(redisConfig)}`
  );
  return sectionGenerationQueue;
}

// =========================
// QUEUE EVENTS
// =========================

sectionGenerationQueue.on("error", (err) => {
  console.error(`[sectionGenerationQueue] redis/queue error: ${err?.message || err}`);
});

sectionGenerationQueue.on("ready", () => {
  console.log(`[sectionGenerationQueue] redis ready for "${SECTION_GENERATION_QUEUE}"`);
});

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
  // Worker must be running (Mongo connected). Soft-start for scripts that skip ai.js boot.
  if (!workerStarted) {
    console.warn(
      "[enqueueSectionGeneration] Worker not started yet — starting now (ensure Mongo is connected)"
    );
    await ensureMongooseReady().catch((err) => {
      throw new Error(
        `Cannot enqueue section generation: ${err?.message || err}`
      );
    });
    startSectionGenerationWorker();
  }

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
  const jobId = `sectiongen:${crypto
    .createHash("sha1")
    .update(dedupeKey)
    .digest("hex")
    .slice(0, 24)}`;

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

  const payload = {
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
  };

  try {
    // Clear a prior failed/completed job with the same id so Generate Website can re-run.
    const priorById = await sectionGenerationQueue.getJob(jobId);
    if (priorById) {
      const priorState = await priorById.getState().catch(() => "");
      if (priorState === "failed" || priorState === "completed") {
        console.warn(
          `[enqueueSectionGeneration] Removing stale ${priorState} job ${jobId} so generation can re-run`
        );
        await priorById.remove().catch(() => null);
      } else if (
        priorState === "waiting" ||
        priorState === "active" ||
        priorState === "delayed" ||
        priorState === "paused"
      ) {
        console.log(
          `[enqueueSectionGeneration] Reusing in-flight job ${jobId} state=${priorState}`
        );
        return priorById;
      }
    }

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
      if (existingFull) {
        console.log(
          `[enqueueSectionGeneration] Reusing existing full-project job ${existingFull.id}`
        );
        return existingFull;
      }
    }
    const existingInFlight = candidateJobs.find((queuedJob) => toComparableKey(queuedJob?.data || {}) === dedupeKey);
    if (existingInFlight) return existingInFlight;

    const job = await sectionGenerationQueue.add("generate-section", payload, {
      jobId,
      removeOnComplete: true,
      removeOnFail: false,
    });
    console.log(
      `[enqueueSectionGeneration] Queued job=${job.id} projectId=${projectId} locations=${normalizedLocations.length} sections=${normalizedSelected.length}`
    );
    return job;
  } catch (err) {
    if (String(err?.message || "").toLowerCase().includes("job") && String(err?.message || "").toLowerCase().includes("id")) {
      const existingJob = await sectionGenerationQueue.getJob(jobId);
      if (existingJob) {
        const state = await existingJob.getState().catch(() => "");
        if (state === "failed") {
          console.warn(`[enqueueSectionGeneration] Retrying failed job ${jobId}`);
          await existingJob.retry().catch(() => null);
        }
        return existingJob;
      }
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
  serviceNames = [],
  extraData = {},
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
    location: location?.name || location?.areaName || "DEFAULT",
    locationId,
    ...(extraData?.__progress
      ? {
          progress: `${extraData.__progress.done + 1}/${extraData.__progress.total}`,
          pending: Math.max(0, extraData.__progress.total - extraData.__progress.done - 1),
          status: "generating",
        }
      : {}),
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
    if (
      pageType === "blog" ||
      pageName === "blog" ||
      pageName === "blogs" ||
      pageName.startsWith("blog-")
    ) {
      return "blog";
    }
    if (pageType === "article" || pageName === "article") return "article";
    if (pageType === "category" || pageName === "category") return "category";
    if (pageType === "author" || pageName === "author") return "author";
    // Location landings reuse homepage section modules (content scoped by locationId)
    if (pageName.startsWith("location-") || pageName === "location" || pageDoc?.locationId) {
      return "homepage";
    }
    // All Areas listing (`/areas`) — prompts under sections/allareas/
    if (
      pageType === "areas" ||
      pageType === "allareas" ||
      pageName === "areas" ||
      pageName === "allareas" ||
      pageName === "all-areas"
    ) {
      return "allareas";
    }
    if (
      pageType === "legal" ||
      pageName === "legal" ||
      pageName.includes("privacy") ||
      pageName.includes("terms") ||
      pageName.includes("disclaimer")
    ) {
      return "legal";
    }
    return pageName || pageType || "";
  })();

  const projectTypeNumEarly = Number(project?.projectType ?? 0);
  const sectionFile = resolveSectionFile(normalizedSectionId, {
    pageType,
    pageFolder,
    projectType: projectTypeNumEarly,
    scope: projectTypeNumEarly === 2 ? "contentsites" : undefined,
  });

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
        )?.sections?.aboutservice ||
        serviceBundleByServiceAndLocation.get(
          `${String(svc?._id || "")}::${bundleLocKey}`
        )?.sections?.servicedetailabout ||
        {};
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
          appendUniversalSectionPromptRules(rawPrompt, normalizedSectionId),
          locationDisplayName,
          normalizedSectionId
        );
        const enriched = await fetchValidatedSectionJson({
          prompt,
          sectionId: normalizedSectionId === "serviceslistgrid" ? "serviceslistgrid" : "servicesgrid",
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

  const buildDbBackedSublocationsSection = async () => {
    const scopeLocationId =
      locationId || pageDoc?.locationId
        ? String(locationId || pageDoc.locationId)
        : null;

    const { getScopedAreaLocations } = require("../services/locationContentScope");
    const {
      buildBusinessLocationPathMap,
      resolveLocationPageHref,
    } = require("../additional/businessLocationPaths");

    const allLocs = await BusinessLocation.find({ projectId, status: 1 })
      .select("_id areaName type parentId")
      .lean();

    // All Areas listing (no parent scope): show primary parent's children (or parents).
    // Location landing: show children of that location.
    const scopedLocs = scopeLocationId
      ? await BusinessLocation.find({
          projectId,
          status: 1,
          parentId: scopeLocationId,
        })
          .select("_id areaName type parentId")
          .lean()
      : getScopedAreaLocations({
          allLocations: allLocs,
          projectType: projectTypeNum,
          scopeLocationId: null,
          onHomepage: true,
        });

    if (!scopedLocs.length) return null;

    const locPages = await WebsitePage.find({
      projectId,
      locationId: { $in: scopedLocs.map((c) => c._id) },
      pageType: { $ne: "service" },
    })
      .select("_id slug locationId name")
      .lean();
    const pageByLoc = new Map(
      (locPages || []).map((p) => [String(p.locationId), p])
    );
    const pageSlugById = new Map();
    for (const p of locPages || []) {
      const slug = String(p?.slug || "").trim().replace(/^\/+/, "");
      if (slug) pageSlugById.set(String(p.locationId), `/${slug}`);
    }
    const pathByLocationId = buildBusinessLocationPathMap(allLocs);

    const items = scopedLocs
      .map((loc) => {
        const name = String(loc.areaName || "").trim();
        if (!name) return null;
        const locId = String(loc._id);
        const page = pageByLoc.get(locId);
        const link = resolveLocationPageHref(locId, pageSlugById, pathByLocationId);
        return {
          name,
          title: name,
          meta: "Local coverage",
          locationId: locId,
          link: link && link !== "#" ? link : (page?.slug ? `/${String(page.slug).replace(/^\/+/, "")}` : "#"),
        };
      })
      .filter(Boolean);

    if (!items.length) return null;

    const parentLabel = locationDisplayName || "your service area";
    return {
      data: {
        badgeText: "Areas We Serve",
        title: scopeLocationId
          ? `Explore Nearby Locations`
          : `Areas We Serve`,
        subtitle: scopeLocationId
          ? `Neighborhoods and communities we serve around ${parentLabel}.`
          : `Find local coverage across the areas ${String(project?.projectName || "we").trim()} serve.`,
        items,
        contentRef: {
          source: "business_locations",
          parentId: scopeLocationId || null,
        },
      },
      meta: {
        source: "database",
        scopeLocationId: scopeLocationId || null,
        locationIds: scopedLocs.map((c) => c._id),
      },
    };
  };

  const buildDbBackedLocationMapSection = async () => {
    const scopeLocationId =
      locationId || pageDoc?.locationId
        ? String(locationId || pageDoc.locationId)
        : null;

    const toMarker = (loc, idx = 0) => {
      const lat = typeof loc.lat === "number" ? loc.lat : Number(loc.lat);
      const lng = typeof loc.lng === "number" ? loc.lng : Number(loc.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: String(loc._id || `m-${idx}`),
        locationId: String(loc._id || ""),
        name: String(loc.areaName || loc.formattedAddress || "Area").trim(),
        lat,
        lng,
        formattedAddress: String(loc.formattedAddress || "").trim(),
      };
    };

    // Scoped page (area detail / single location) → one pin
    if (scopeLocationId) {
      const loc = await BusinessLocation.findOne({
        _id: scopeLocationId,
        projectId,
        status: 1,
      })
        .select("areaName lat lng formattedAddress googlePlaceId")
        .lean();
      if (!loc) return null;

      const marker = toMarker(loc);
      const lat = marker?.lat ?? null;
      const lng = marker?.lng ?? null;
      let mapEmbedUrl = "";
      if (lat != null && lng != null) {
        mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;
      }

      return {
        data: {
          badgeText: "Service Area",
          title: `Find Us in ${String(loc.areaName || "Your Area").trim()}`,
          subtitle: String(loc.formattedAddress || "").trim(),
          lat,
          lng,
          mapEmbedUrl,
          formattedAddress: String(loc.formattedAddress || "").trim(),
          markers: marker ? [marker] : [],
          contentRef: { source: "location_map", locationId: scopeLocationId },
        },
        meta: { source: "database", scopeLocationId, markerCount: marker ? 1 : 0 },
      };
    }

    // Homepage / All Areas (no location scope) → all areas with coordinates highlighted
    const allLocations = await BusinessLocation.find({
      projectId,
      status: 1,
      lat: { $ne: null },
      lng: { $ne: null },
    })
      .select("_id areaName lat lng formattedAddress type locationType parentId")
      .lean();

    // Prefer leaf areas (local / city / business children) so the map isn't only countries
    const scored = (allLocations || [])
      .map((loc, idx) => {
        const marker = toMarker(loc, idx);
        if (!marker) return null;
        const lt = Number(loc.locationType);
        const st = Number(loc.type);
        let score = 0;
        if (lt === 3 || st === 1) score = 3; // local areas
        else if (lt === 2) score = 2; // cities
        else if (lt === 4 || st === 0) score = 1; // business parents
        else score = 0; // country/state
        return { marker, score, loc };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    let markers = scored.map((s) => s.marker);
    // If we only have coarse geo (countries), still show them
    if (!markers.length) {
      return {
        data: {
          badgeText: "Service Area",
          title: "Find Us On The Map",
          subtitle: "Add locations with Google Maps to pin them here.",
          lat: null,
          lng: null,
          mapEmbedUrl: "",
          formattedAddress: "",
          markers: [],
          contentRef: { source: "location_map", locationId: null },
        },
        meta: { source: "database", scopeLocationId: null, markerCount: 0 },
      };
    }

    // Cap for embed performance
    markers = markers.slice(0, 80);

    const avgLat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
    const avgLng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
    const projectLabel = String(project?.projectName || "Our").trim();

    return {
      data: {
        badgeText: "Coverage Map",
        title: markers.length > 1 ? `Areas We Serve` : `Find Us On The Map`,
        subtitle:
          markers.length > 1
            ? `${projectLabel} coverage across ${markers.length} locations — explore every pin on the map.`
            : String(markers[0]?.formattedAddress || markers[0]?.name || "").trim(),
        lat: avgLat,
        lng: avgLng,
        mapEmbedUrl:
          markers.length === 1
            ? `https://maps.google.com/maps?q=${markers[0].lat},${markers[0].lng}&z=13&output=embed`
            : "",
        formattedAddress: "",
        markers,
        contentRef: { source: "location_map", locationId: null, multi: true },
      },
      meta: {
        source: "database",
        scopeLocationId: null,
        markerCount: markers.length,
        locationIds: markers.map((m) => m.locationId).filter(Boolean),
      },
    };
  };

  let dbSectionPayload = null;
  if (usesServicesGridDbBuilder(normalizedSectionId)) {
    dbSectionPayload = await buildDbBackedServicesSection();
  } else if (normalizedSectionId === "sublocations") {
    dbSectionPayload = await buildDbBackedSublocationsSection();
  } else if (isLocationMapSection(normalizedSectionId)) {
    dbSectionPayload = await buildDbBackedLocationMapSection();
  } else if (isBusinessLocationsSection(normalizedSectionId)) {
    dbSectionPayload = await buildDbBackedAreasSection();
  } else if (usesBlogCollectionBuilder(normalizedSectionId)) {
    dbSectionPayload = await buildBlogListSectionData(projectId);
  } else if (usesBlogDocumentBuilder(normalizedSectionId)) {
    const blogOpts = {
      blogId: extraData?.blogId || pageDoc?.blogId,
      slug: extraData?.blogSlug || extraData?.slug,
    };
    if (normalizedSectionId === "blogcontent" || normalizedSectionId === "blogarticle") {
      dbSectionPayload = await buildBlogContentData(projectId, blogOpts);
    } else {
      dbSectionPayload = await buildBlogArticleHeroData(projectId, blogOpts);
    }
  } else if (usesBlogAuthorBuilder(normalizedSectionId)) {
    dbSectionPayload = await buildBlogAuthorData(projectId, {
      blogId: extraData?.blogId,
      slug: extraData?.blogSlug || extraData?.slug,
    });
    // If no Author in DB, fall through to OpenAI seed below
    if (dbSectionPayload?.meta?.empty) {
      dbSectionPayload = null;
    }
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

    // Content sites: seed FAQ prompts with keyword-research questions
    let contentFaqExtra = {};
    if (projectTypeNum === 2 && normalizedSectionId === "faq") {
      try {
        const ProjectKeywords = require("../models/projectKeywords");
        const kwDocs = await ProjectKeywords.find({
          projectId,
          status: "active",
        })
          .select("primaryKeyword faqKeywords")
          .limit(40)
          .lean();
        const faqKeywords = [];
        const primaryKeywords = [];
        for (const kw of kwDocs || []) {
          if (kw.primaryKeyword) primaryKeywords.push(String(kw.primaryKeyword));
          for (const q of kw.faqKeywords || []) {
            if (q) faqKeywords.push(String(q));
          }
        }
        contentFaqExtra = {
          faqKeywords: [...new Set(faqKeywords)].slice(0, 16),
          primaryKeywords: [...new Set(primaryKeywords)].slice(0, 10),
          nicheName: project?.focusKeyword || "",
          categoryName: project?.serviceType || "",
          categoryTitle: pageDoc?.displayName || pageDoc?.name || "",
        };
      } catch (faqSeedErr) {
        console.warn(
          "[sectionGeneration] content FAQ seed skipped:",
          faqSeedErr?.message || faqSeedErr
        );
      }
    }

    const rawPrompt = sectionModule.prompt({
      project,
      location: location || {},
      pageName,
      pageSlug: String(pageDoc?.slug || "").trim(),
      extraData: {
        pageId,
        pageType,
        pageName,
        pageSlug: String(pageDoc?.slug || "").trim(),
        sectionId: normalizedSectionId,
        serviceName,
        serviceNames,
        servicesCount: serviceNames.length,
        ...contentFaqExtra,
        ...extraData,
      }
    });

    const prompt = buildLocationAwarePrompt(
      appendUniversalSectionPromptRules(rawPrompt, normalizedSectionId),
      locationDisplayName,
      normalizedSectionId
    );

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
        (normalizedSectionId === "aboutservice" ||
          normalizedSectionId === "servicedetailabout") &&
        pageType === "service" &&
        pageDoc?.serviceId
      ) {
        const fallback = await loadWizardAboutserviceFallback(projectId, locationId);
        if (fallback) {
          console.warn(
            `[sectionGenerationQueue] ${normalizedSectionId} fallback from Service wizard page project=${projectId} location=${locationId || "null"}`
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
        ? sanitizeGeneratedSectionPayload({
            sectionId: normalizedSectionId,
            payload: stripLegacyImagePromptFields({ ...result }),
            project,
            locationDisplayName,
            serviceNames,
          })
        : result;
  }

  if (
    typeof sectionModule.imageCount === "number" &&
    resultToSave &&
    typeof resultToSave === "object" &&
    !Array.isArray(resultToSave)
  ) {
    resultToSave.image_count = sectionModule.imageCount;
    const {
      resolveImageSpec,
      stampImageSpecOnData,
    } = require("../imageengines");
    resultToSave = stampImageSpecOnData(
      resultToSave,
      resolveImageSpec(sectionModule, resultToSave, normalizedSectionId || sectionModule.id)
    );
  }

  // Process section guardrail: auto-fix generic static values if model returns them.
  if (
    (normalizedSectionId === "process" ||
      normalizedSectionId === "serviceslistprocess" ||
      normalizedSectionId === "servicedetailprocess" ||
      normalizedSectionId === "serviceprocess") &&
    resultToSave &&
    typeof resultToSave === "object" &&
    !Array.isArray(resultToSave)
  ) {
    const categoryBase = toTitleCase(project?.mainCategory || project?.focusKeyword || "Service");
    const rawBadge = String(resultToSave.badge || resultToSave.badgeText || "").trim();
    const rawTitle = String(resultToSave.title || "").trim();

    if (!rawBadge || /^workflow$/i.test(rawBadge)) {
      const fixed = `${categoryBase} Flow`;
      resultToSave.badge = fixed;
      resultToSave.badgeText = fixed;
    } else if (!resultToSave.badgeText && resultToSave.badge) {
      resultToSave.badgeText = resultToSave.badge;
    } else if (!resultToSave.badge && resultToSave.badgeText) {
      resultToSave.badge = resultToSave.badgeText;
    }

    if (!rawTitle || /^(our process|how we work)$/i.test(rawTitle)) {
      resultToSave.title = `How ${categoryBase} Works`;
    }

    // GenieBuild process / servicedetailprocess expect content.items
    const rawSteps = Array.isArray(resultToSave.items)
      ? resultToSave.items
      : Array.isArray(resultToSave.steps_process)
        ? resultToSave.steps_process
        : Array.isArray(resultToSave.data)
          ? resultToSave.data
          : [];
    if (rawSteps.length) {
      resultToSave.items = rawSteps.map((step, idx) => {
        const iconRaw = String(
          step?.icon || step?.iconClass || "fa-circle-check"
        ).trim();
        const icon = iconRaw.startsWith("fa-")
          ? iconRaw
          : iconRaw.replace(/^fas?\s+fa-/, "fa-").replace(/^fa\s+/, "fa-") || "fa-circle-check";
        return {
          id: String(step?.id || `step-${idx + 1}`),
          icon,
          iconClass: icon,
          title: String(
            step?.title || step?.heading || step?.stepName || `Step ${idx + 1}`
          ).trim(),
          description: String(
            step?.description || step?.subtitle || step?.serviceDescription || ""
          ).trim(),
        };
      });
      // Multicolor legacy mirror
      resultToSave.steps_process = resultToSave.items.map((step) => ({
        stepName: step.title,
        iconClass: step.icon.startsWith("fa-") ? `fas ${step.icon}` : step.icon,
        serviceDescription: step.description,
      }));
      if (!resultToSave.subtitle && resultToSave.description) {
        resultToSave.subtitle = resultToSave.description;
      }
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

  if (
    (normalizedSectionId === "faq" ||
      normalizedSectionId === "contactfaq" ||
      normalizedSectionId === "aboutfaq" ||
      normalizedSectionId === "serviceslistfaq" ||
      normalizedSectionId === "servicedetailfaq") &&
    Array.isArray(resultToSave)
  ) {
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

    if (
      normalizedSectionId === "whychooseus" ||
      normalizedSectionId === "why-choose-us" ||
      normalizedSectionId === "serviceslistwhychoose" ||
      normalizedSectionId === "aboutwhychoose" ||
      normalizedSectionId === "servicedetailwhychoose" ||
      normalizedSectionId === "servicewhychooseus"
    ) {
      const rawItems = Array.isArray(resultToSave.featureBoxes)
        ? resultToSave.featureBoxes
        : Array.isArray(resultToSave.whyChooseUsSection)
          ? resultToSave.whyChooseUsSection
          : Array.isArray(resultToSave.items)
            ? resultToSave.items
            : [];
      const normalizedItems = rawItems.slice(0, 10).map((item, idx) => ({
        icon: String(item?.icon || item?.iconClass || "fas fa-star").trim(),
        iconClass: String(item?.iconClass || item?.icon || "fas fa-star").trim(),
        title: String(item?.title || item?.heading || `Feature ${idx + 1}`).trim(),
        description: String(item?.description || "").trim(),
      }));
      resultToSave.featureBoxes = normalizedItems;
      resultToSave.items = normalizedItems;
      // Multicolor legacy mirror
      resultToSave.whyChooseUsSection = normalizedItems.map((item) => ({
        title: item.title,
        description: item.description,
        iconClass: item.iconClass.startsWith("fa-")
          ? `fas ${item.iconClass}`
          : item.iconClass,
      }));
    }

    if (
      normalizedSectionId === "guarantee" ||
      normalizedSectionId === "serviceslistguarantee" ||
      normalizedSectionId === "servicedetailguarantee" ||
      normalizedSectionId === "serviceguarantee"
    ) {
      const rawList = Array.isArray(resultToSave.guaranteeList)
        ? resultToSave.guaranteeList
        : (Array.isArray(resultToSave.items) ? resultToSave.items : []);
      resultToSave.guaranteeList = rawList.slice(0, 8).map((it) => ({
        icon: String(it?.icon || it?.iconClass || "fas fa-check-circle").trim(),
        line: String(it?.line || it?.title || it?.description || "").trim(),
      })).filter((it) => it.line);
      if (resultToSave.guaranteeList.length < 4) {
        const cat = String(project?.mainCategory || project?.serviceType || "service").trim();
        const biz = String(project?.projectName || "Our team").trim();
        resultToSave.guaranteeList = [
          { icon: "fas fa-check-circle", line: `Verified ${cat.toLowerCase()} workmanship from ${biz}` },
          { icon: "fas fa-check-circle", line: "Clear pricing with approvals before work starts" },
          { icon: "fas fa-check-circle", line: "Qualified and careful professionals on every job" },
          { icon: "fas fa-check-circle", line: "Responsive support after the work is complete" },
        ];
      }
      let resolvedServiceHint = String(
        extraData?.serviceName || extraData?.service_name || ""
      ).trim();
      if (!resolvedServiceHint && pageDoc?.serviceId) {
        try {
          const svcDoc = await Service.findById(pageDoc.serviceId).select("name").lean();
          resolvedServiceHint = String(svcDoc?.name || "").trim();
        } catch (_) {
          resolvedServiceHint = "";
        }
      }
      const cleanStat = sanitizeGuaranteeStatCard(
        resultToSave.statCard || {},
        project,
        resolvedServiceHint
      );
      resultToSave.statCard = {
        icon: cleanStat.icon.startsWith("fa-")
          ? `fas ${cleanStat.icon}`
          : cleanStat.icon,
        label: cleanStat.label,
        value: cleanStat.value,
        description: cleanStat.description,
      };
      // Flatten for GenieBuild UI (GuaranteePlumbing reads top-level fields)
      resultToSave.statValue = cleanStat.value;
      resultToSave.statLabel = cleanStat.label;
      resultToSave.statIcon = cleanStat.icon;
      resultToSave.statDescription = cleanStat.description;
      resultToSave.items = resultToSave.guaranteeList.map((it, idx) => ({
        id: `guarantee-${idx + 1}`,
        title: it.line,
        icon: it.icon,
      }));
    }

    if (
      normalizedSectionId === "faq" ||
      normalizedSectionId === "contactfaq" ||
      normalizedSectionId === "aboutfaq" ||
      normalizedSectionId === "serviceslistfaq" ||
      normalizedSectionId === "servicedetailfaq"
    ) {
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

    // Contact + services-list + service-detail CTA enrichment (AboutUs phone + trust strip)
    if (
      [
        "contactinfo",
        "contactform",
        "contactcta",
        "contactfaq",
        "aboutcta",
        "aboutfaq",
        "serviceslistcta",
        "servicedetailcta",
        "servicedetailfaq",
        "serviceslistfaq",
      ].includes(normalizedSectionId)
    ) {
      resultToSave = await applyContactPageSectionDynamics(
        normalizedSectionId,
        resultToSave,
        projectId
      );
    }

    // GenieBuild servicedetailservices: mirror items ↔ subServices
    if (
      (normalizedSectionId === "servicedetailservices" ||
        normalizedSectionId === "subservices") &&
      resultToSave &&
      typeof resultToSave === "object"
    ) {
      const rawItems = Array.isArray(resultToSave.items) ? resultToSave.items : [];
      if (rawItems.length) {
        resultToSave.items = rawItems.map((item, idx) => {
          const iconRaw = String(item?.icon || item?.iconClass || "fa-check").trim();
          const icon = iconRaw.startsWith("fa-")
            ? iconRaw
            : iconRaw.replace(/^fas?\s+fa-/, "fa-").replace(/^fa\s+/, "fa-") || "fa-check";
          return {
            icon,
            title: String(item?.title || item?.heading || `Include ${idx + 1}`).trim(),
            description: String(item?.description || "").trim(),
          };
        });
        resultToSave.subServices = resultToSave.items
          .map((it) => it.title)
          .filter(Boolean);
      } else if (Array.isArray(resultToSave.subServices) && resultToSave.subServices.length) {
        resultToSave.items = resultToSave.subServices.map((label, idx) => ({
          icon: "fa-check",
          title: String(label || "").trim(),
          description: "",
        }));
      }
    }

    // Related services: normalize legacy AI header keys (cards filled at page resolve)
    if (
      normalizedSectionId === "relatedservices" &&
      resultToSave &&
      typeof resultToSave === "object"
    ) {
      const badge = String(
        resultToSave.badgeText || resultToSave.relatedServicesBadge || ""
      ).trim();
      const title = String(
        resultToSave.title || resultToSave.relatedServicesTitle || ""
      ).trim();
      const subtitle = String(
        resultToSave.subtitle || resultToSave.relatedServicesSubtitle || ""
      ).trim();
      if (badge) {
        resultToSave.badgeText = badge;
        resultToSave.relatedServicesBadge = badge;
      }
      if (title) {
        resultToSave.title = title;
        resultToSave.relatedServicesTitle = title;
      }
      if (subtitle) {
        resultToSave.subtitle = subtitle;
        resultToSave.relatedServicesSubtitle = subtitle;
      }
      // Never persist invented card lists — resolve-time catalog wins
      delete resultToSave.items;
    }

    // Hero badge/title mirrors for GenieBuild + Multicolor
    if (
      (normalizedSectionId === "servicedetailhero" ||
        normalizedSectionId === "servicehero" ||
        normalizedSectionId === "locationhero" ||
        normalizedSectionId === "hero") &&
      resultToSave &&
      typeof resultToSave === "object"
    ) {
      const badge = String(
        resultToSave.badgeText || resultToSave.serviceHeroBadge || ""
      ).trim();
      const title = String(
        resultToSave.serviceHeroTitle || resultToSave.title || ""
      ).trim();
      const subtitle = String(
        resultToSave.serviceHeroSubtitle || resultToSave.subtitle || ""
      ).trim();
      if (badge) {
        resultToSave.badgeText = badge;
        resultToSave.serviceHeroBadge = badge;
      }
      if (title) {
        resultToSave.serviceHeroTitle = title;
        resultToSave.title = title;
      }
      if (subtitle) {
        resultToSave.serviceHeroSubtitle = subtitle;
        resultToSave.subtitle = subtitle;
      }
    }

    // locationpromise ← promiseline prompt (title/subtitle mirrors)
    if (
      (normalizedSectionId === "locationpromise" ||
        normalizedSectionId === "promiseline") &&
      resultToSave &&
      typeof resultToSave === "object"
    ) {
      const line = String(
        resultToSave.promiseLine || resultToSave.subtitle || resultToSave.line || ""
      ).trim();
      const title = String(resultToSave.title || "Our Promise").trim();
      resultToSave.title = title;
      if (line) {
        resultToSave.promiseLine = line;
        resultToSave.subtitle = line;
        resultToSave.line = line;
      }
    }

    // Related blogs: AI chrome + Blog collection cards
    if (usesBlogRelatedBuilder(normalizedSectionId) && resultToSave) {
      try {
        const relatedItems = await buildBlogRelatedItems(projectId, {
          blogId: extraData?.blogId,
          slug: extraData?.blogSlug || extraData?.slug,
        });
        resultToSave.items = relatedItems;
        if (!resultToSave.relatedTitle && resultToSave.title) {
          resultToSave.relatedTitle = resultToSave.title;
        }
        if (!resultToSave.title && resultToSave.relatedTitle) {
          resultToSave.title = resultToSave.relatedTitle;
        }
        sectionMeta = {
          ...sectionMeta,
          source: "hybrid",
          blogIds: relatedItems.map((it) => it.blogId).filter(Boolean),
        };
      } catch (relErr) {
        console.warn(
          `[sectionGenerationQueue] blogrelated DB merge failed: ${relErr.message}`
        );
      }
    }

    // blogshero title mirrors
    if (normalizedSectionId === "blogshero" || normalizedSectionId === "blogslisting") {
      const title = String(
        resultToSave.blogsHeroTitle || resultToSave.title || ""
      ).trim();
      const subtitle = String(
        resultToSave.blogsHeroSubtitle || resultToSave.subtitle || ""
      ).trim();
      if (title) {
        resultToSave.blogsHeroTitle = title;
        resultToSave.title = title;
      }
      if (subtitle) {
        resultToSave.blogsHeroSubtitle = subtitle;
        resultToSave.subtitle = subtitle;
      }
    }

    // Legal pages: normalize GenieBuild + legacy shapes (+ content-site Funky bodies)
    if (
      [
        "legalhero",
        "legalcontent",
        "legalprivacy",
        "legalterms",
        "legaldisclaimer",
        "privacybody",
        "termsbody",
        "disclaimerbody",
      ].includes(normalizedSectionId) &&
      resultToSave &&
      typeof resultToSave === "object"
    ) {
      const docType = resolveLegalDocType({
        sectionId: normalizedSectionId,
        pageName,
        pageSlug: String(pageDoc?.slug || "").trim(),
        extraData,
      });
      const split = splitLegalPayload(resultToSave, docType);
      if (normalizedSectionId === "legalhero") {
        resultToSave = { ...resultToSave, ...split.hero };
      } else if (normalizedSectionId === "legalcontent") {
        resultToSave = {
          ...resultToSave,
          sections: split.content.sections,
          body: split.content.body,
        };
      } else if (
        normalizedSectionId === "privacybody" ||
        normalizedSectionId === "termsbody" ||
        normalizedSectionId === "disclaimerbody"
      ) {
        // Content-site single-section legal pages: hero fields + full document body
        resultToSave = {
          ...resultToSave,
          ...split.combined,
          title: split.combined.title,
          subtitle: split.combined.subtitle,
          sections: split.combined.sections,
          body: split.combined.body,
        };
      } else {
        resultToSave = { ...resultToSave, ...split.combined };
      }
      sectionMeta = {
        ...sectionMeta,
        legalDocType: docType,
        legacyLegalSectionId: split.legacySectionId,
      };
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
    locationId,
    ...(extraData?.__progress
      ? {
          progress: `${extraData.__progress.done + 1}/${extraData.__progress.total}`,
          pending: Math.max(0, extraData.__progress.total - extraData.__progress.done - 1),
          status: "saving",
        }
      : {}),
  });

  const isServiceBundleWrite =
    (getSectionResolver(normalizedSectionId) === "service_bundle" ||
      normalizedSectionId === "faq" ||
      normalizedSectionId === "servicedetailfaq") &&
    String(pageDoc?.pageType || "").toLowerCase() === "service" &&
    pageDoc?.serviceId;

  if (resultToSave && typeof resultToSave === "object" && !Array.isArray(resultToSave)) {
    if (
      normalizedSectionId === "areas" ||
      normalizedSectionId === "serviceslistareas" ||
      normalizedSectionId === "locationareas"
    ) {
      // Runtime resolver rebuilds pills from BusinessLocation; keep header only
      delete resultToSave.items;
    }
  }

  if (isServiceBundleWrite) {
    const bundleLocationId = pageDoc?.locationId || locationId || null;
    const twinId = serviceDetailBundleTwinId(normalizedSectionId);
    const $set = {
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
        locationIds: sectionMeta.locationIds || [],
      },
    };
    // Dual-write GenieBuild ↔ Multicolor keys so grids + both UIs stay aligned
    if (twinId && twinId !== normalizedSectionId) {
      $set[`data.sections.${twinId}`] = resultToSave;
    }

    await SectionContent.findOneAndUpdate(
      {
        projectId,
        pageId: pageDoc.serviceId,
        serviceId: pageDoc.serviceId,
        sectionId: "service_sections",
        locationId: bundleLocationId
      },
      { $set },
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
    const saveSectionContent = async (sectionKey) => {
      await SectionContent.findOneAndUpdate(
        {
          projectId,
          ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
          sectionId: sectionKey,
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
          sectionId: sectionKey,
          locationId: null,
          status: "pending"
        });
      }
      const sameScopeRows = await SectionContent.find({
        projectId,
        ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
        sectionId: sectionKey,
        locationId: locationId || null
      })
        .select("_id updatedAt")
        .sort({ updatedAt: -1, _id: -1 })
        .lean();
      if (sameScopeRows.length > 1) {
        const staleIds = sameScopeRows.slice(1).map((r) => r._id);
        if (staleIds.length) await SectionContent.deleteMany({ _id: { $in: staleIds } });
      }
    };

    await saveSectionContent(normalizedSectionId);

    // Location pages: dual-write GenieBuild location* ↔ homepage ids so both UIs share content
    const onLocationPage = Boolean(
      pageDoc?.locationId ||
        String(pageDoc?.name || "").toLowerCase().startsWith("location-")
    );
    const locTwin = onLocationPage ? locationHomeTwinId(normalizedSectionId) : null;
    if (locTwin && locTwin !== normalizedSectionId) {
      await saveSectionContent(locTwin);
    }

    // Legal pages: dual-write GenieBuild split ↔ legacy combined blob
    const legalIds = new Set([
      "legalhero",
      "legalcontent",
      "legalprivacy",
      "legalterms",
      "legaldisclaimer",
    ]);
    if (legalIds.has(normalizedSectionId) && resultToSave) {
      const docType = resolveLegalDocType({
        sectionId: normalizedSectionId,
        pageName,
        pageSlug: String(pageDoc?.slug || "").trim(),
        extraData,
      });
      const split = splitLegalPayload(resultToSave, docType);
      const legacyId = split.legacySectionId;

      if (
        normalizedSectionId === "legalprivacy" ||
        normalizedSectionId === "legalterms" ||
        normalizedSectionId === "legaldisclaimer"
      ) {
        const prev = resultToSave;
        resultToSave = split.hero;
        await saveSectionContent("legalhero");
        resultToSave = split.content;
        await saveSectionContent("legalcontent");
        resultToSave = prev;
      } else if (normalizedSectionId === "legalhero" || normalizedSectionId === "legalcontent") {
        // Merge into legacy combined document for Multicolor consumers
        let existingLegacy = null;
        try {
          existingLegacy = await SectionContent.findOne({
            projectId,
            ...(pageIdCandidates.length
              ? { pageId: { $in: pageIdCandidates } }
              : { pageId: normalizedPageId }),
            sectionId: legacyId,
            locationId: locationId || null,
            isDeleted: { $ne: true },
          })
            .select("data")
            .lean();
        } catch (_) {
          existingLegacy = null;
        }
        const merged = {
          ...(existingLegacy?.data && typeof existingLegacy.data === "object"
            ? existingLegacy.data
            : {}),
          ...(normalizedSectionId === "legalhero" ? split.hero : {}),
          ...(normalizedSectionId === "legalcontent"
            ? { sections: split.content.sections }
            : {}),
        };
        const prev = resultToSave;
        resultToSave = splitLegalPayload(merged, docType).combined;
        await saveSectionContent(legacyId);
        resultToSave = prev;
      }
    }
  }

  // Strict SST: do not mutate WebsiteDesignsData section content from queue.
}

// =========================
// WORKER PROCESS
// =========================

runSectionGenerationJob = async (job) => {
  await ensureMongooseReady();

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
  /** @type {Array<{kind:string,pageId:any,sectionId:string,location:any,locationId:any,pageMeta?:any,pageSummary?:any,servicePage?:any,serviceTemplateSummary?:any}>} */
  const plannedUnits = [];

  if (!servicesWizardOnly) for (const page of designData.pages) {
    const normalizedSections = ensureHeaderFooterComponents(getPageSections(page), {
      projectType,
    });
    assignPageSections(page, normalizedSections, { projectType });
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
        plannedUnits.push({
          kind: "page",
          pageId,
          sectionId,
          location,
          locationId,
          pageMeta,
          pageSummary,
        });
      }
    }
    pageSummaries.push(pageSummary);
  }

  // Service template sections (Step 6 "Service" page) are not saved on WebsiteDesignsData
  // because that row is templateOnly. Generate them for every pageType=service page instead.
  let serviceTemplateSummary = null;
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

      serviceTemplateSummary = {
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
          plannedUnits.push({
            kind: "service",
            pageId: sp._id,
            sectionId,
            location: locationPayload,
            locationId: sp.locationId,
            servicePage: sp,
            serviceTemplateSummary,
          });
        }
      }
    }
  }

  const progress = { total: plannedUnits.length, done: 0, failed: 0, skipped: 0 };
  const parallelWorkers = getDefaultParallelWorkers();
  const claimingServiceKeys = new Set();
  const activeSectionKeys = new Set();

  const persistProjectProgress = async (snapshot) => {
    try {
      await UserProject.updateOne(
        { _id: projectId },
        { $set: { contentGeneration: snapshot } }
      );
    } catch (err) {
      console.warn("[sectionGenerationQueue] persist contentGeneration failed:", err?.message || err);
    }
  };

  startProgress(projectId, {
    total: progress.total,
    parallelWorkers,
    message: `Generating ${progress.total} sections with ${parallelWorkers} parallel workers`,
  });
  await persistProjectProgress({
    status: "generating",
    total: progress.total,
    done: 0,
    failed: 0,
    skipped: 0,
    pending: progress.total,
    percent: 0,
    parallelWorkers,
    activeWorkers: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    message: `Generating ${progress.total} sections with ${parallelWorkers} parallel workers`,
  });

  console.log("📊 Section generation plan:", {
    projectId,
    total: progress.total,
    pending: progress.total,
    done: 0,
    failed: 0,
    parallelWorkers,
    status: "starting",
  });

  const syncLiveProgress = (event = null) => {
    const snapshot = patchProgress(projectId, {
      total: progress.total,
      done: progress.done,
      failed: progress.failed,
      skipped: progress.skipped,
      parallelWorkers,
      activeWorkers: activeSectionKeys.size,
      currentSections: [...activeSectionKeys],
      ...(event ? { event } : {}),
    });
    // Throttle DB writes: every 3 completions or when idle workers
    if (
      !event ||
      event.status === "done" ||
      event.status === "failed" ||
      event.status === "skipped"
    ) {
      const finished = progress.done + progress.failed + progress.skipped;
      if (finished === progress.total || finished % 3 === 0 || activeSectionKeys.size === 0) {
        persistProjectProgress(snapshot).catch(() => {});
      }
    }
    return snapshot;
  };

  await mapWithConcurrency(plannedUnits, parallelWorkers, async (unit) => {
    const { pageId, sectionId, location, locationId } = unit;
    const normalizedPageId = normalizeMixedIdForStorage(pageId);
    const pageIdCandidates = buildMixedIdCandidates(pageId);
    const sectionKey = `${String(pageId)}::${sectionId}::${locationId || "null"}`;
    const progressExtra = () => ({
      __progress: {
        total: progress.total,
        done: progress.done,
        failed: progress.failed,
        skipped: progress.skipped,
      },
    });

    if (unit.kind === "service") {
      const sp = unit.servicePage;
      const dedupeKey = `${String(sp._id)}::${sectionId}`;
      if (generatedServiceSectionKeys.has(dedupeKey) || claimingServiceKeys.has(dedupeKey)) {
        skipped++;
        progress.skipped++;
        unit.serviceTemplateSummary.skipped.push({
          sectionId,
          locationId: sp.locationId,
          servicePageId: sp._id,
          reason: "already_generated_on_design_page",
        });
        syncLiveProgress({
          status: "skipped",
          sectionId,
          pageId: String(sp._id),
          message: `Skipped ${sectionId} (already generated)`,
        });
        return;
      }
      claimingServiceKeys.add(dedupeKey);
      activeSectionKeys.add(sectionKey);
      syncLiveProgress({
        status: "generating",
        sectionId,
        pageId: String(sp._id),
        message: `Generating ${sectionId}`,
      });

      try {
        const generationResult = await generateSingleSection({
          project,
          designData,
          projectId,
          userId,
          pageId: sp._id,
          sectionId,
          location,
          locationId: sp.locationId,
          serviceNames,
          extraData: progressExtra(),
        });

        if (generationResult?.skipped) {
          skipped++;
          progress.skipped++;
          unit.serviceTemplateSummary.skipped.push({
            sectionId,
            locationId: sp.locationId,
            servicePageId: sp._id,
            reason: "generator_skipped",
          });
          syncLiveProgress({
            status: "skipped",
            sectionId,
            pageId: String(sp._id),
            message: `Skipped ${sectionId}`,
          });
          return;
        }

        success++;
        progress.done++;
        generatedServiceSectionKeys.add(dedupeKey);
        unit.serviceTemplateSummary.saved.push({
          sectionId,
          locationId: sp.locationId,
          servicePageId: sp._id,
        });
        console.log("✅ Section generated:", {
          sectionId,
          pageId: sp._id,
          location: location?.name || "DEFAULT",
          locationId: sp.locationId,
          progress: `${progress.done}/${progress.total}`,
          pending: Math.max(0, progress.total - progress.done - progress.failed - progress.skipped),
          status: "done",
        });
        syncLiveProgress({
          status: "done",
          sectionId,
          pageId: String(sp._id),
          message: `Generated ${sectionId}`,
        });
      } catch (err) {
        failed++;
        progress.failed++;
        unit.serviceTemplateSummary.failed.push({
          sectionId,
          locationId: sp.locationId,
          servicePageId: sp._id,
          error: err.message,
        });
        console.error("❌ Section failed:", {
          sectionId,
          pageId: sp._id,
          error: err.message,
          progress: `${progress.done}/${progress.total}`,
          pending: Math.max(0, progress.total - progress.done - progress.failed - progress.skipped),
          status: "failed",
        });
        syncLiveProgress({
          status: "failed",
          sectionId,
          pageId: String(sp._id),
          message: `Failed ${sectionId}: ${err.message}`,
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
      } finally {
        claimingServiceKeys.delete(dedupeKey);
        activeSectionKeys.delete(sectionKey);
        syncLiveProgress();
      }
      return;
    }

    // kind === "page"
    const pageSummary = unit.pageSummary;
    const pageMeta = unit.pageMeta;
    activeSectionKeys.add(sectionKey);
    syncLiveProgress({
      status: "generating",
      sectionId,
      pageId: String(pageId),
      message: `Generating ${sectionId}`,
    });

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
        serviceNames,
        extraData: progressExtra(),
      });

      if (generationResult?.skipped) {
        skipped++;
        progress.skipped++;
        pageSummary.skipped.push({
          sectionId,
          locationId: locationId || null,
          reason: "generator_skipped",
        });
        syncLiveProgress({
          status: "skipped",
          sectionId,
          pageId: String(pageId),
          message: `Skipped ${sectionId}`,
        });
        return;
      }

      success++;
      progress.done++;
      pageSummary.saved.push({
        sectionId,
        locationId: locationId || null,
      });
      if (
        String(pageMeta?.pageType || "").toLowerCase() === "service" &&
        pageMeta?.serviceId
      ) {
        generatedServiceSectionKeys.add(`${String(pageId)}::${sectionId}`);
      }
      console.log("✅ Section generated:", {
        sectionId,
        pageId,
        location: location?.name || location?.areaName || "DEFAULT",
        locationId,
        progress: `${progress.done}/${progress.total}`,
        pending: Math.max(0, progress.total - progress.done - progress.failed - progress.skipped),
        status: "done",
      });
      syncLiveProgress({
        status: "done",
        sectionId,
        pageId: String(pageId),
        message: `Generated ${sectionId}`,
      });
    } catch (err) {
      failed++;
      progress.failed++;
      pageSummary.failed.push({
        sectionId,
        locationId: locationId || null,
        error: err.message,
      });
      console.error("❌ Section failed:", {
        sectionId,
        pageId,
        error: err.message,
        progress: `${progress.done}/${progress.total}`,
        pending: Math.max(0, progress.total - progress.done - progress.failed - progress.skipped),
        status: "failed",
      });
      syncLiveProgress({
        status: "failed",
        sectionId,
        pageId: String(pageId),
        message: `Failed ${sectionId}: ${err.message}`,
      });

      await SectionContent.findOneAndUpdate(
        {
          projectId,
          ...(pageIdCandidates.length ? { pageId: { $in: pageIdCandidates } } : { pageId: normalizedPageId }),
          sectionId,
          locationId: locationId || null,
        },
        {
          $set: {
            pageId: normalizedPageId,
            status: "failed",
            error: err.message,
            locationId: locationId || null,
          },
        },
        { upsert: true }
      );
    } finally {
      activeSectionKeys.delete(sectionKey);
      syncLiveProgress();
    }
  });

  const finalStatus =
    failed > 0 && success === 0 ? "failed" : failed > 0 ? "completed_with_errors" : "completed";
  const finalSnapshot = finishProgress(projectId, {
    status: finalStatus === "failed" ? "failed" : "completed",
    message:
      finalStatus === "failed"
        ? `Generation failed (${failed} errors)`
        : `Generation complete: ${success} done, ${failed} failed, ${skipped} skipped`,
  });
  await persistProjectProgress({
    ...(finalSnapshot || {}),
    status: finalStatus === "failed" ? "failed" : "completed",
    total: progress.total,
    done: progress.done,
    failed: progress.failed,
    skipped: progress.skipped,
    pending: 0,
    percent: progress.total
      ? Math.round(((progress.done + progress.failed + progress.skipped) / progress.total) * 100)
      : 100,
    parallelWorkers,
    activeWorkers: 0,
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log("📊 Section generation finished:", {
    projectId,
    total: progress.total,
    done: progress.done,
    failed: progress.failed,
    skipped: progress.skipped,
    pending: 0,
    parallelWorkers,
    status: "complete",
  });

  // Finalize per-page summary counts
  for (let i = 0; i < pageSummaries.length; i++) {
    const pageSummary = pageSummaries[i];
    pageSummaries[i] = {
      ...pageSummary,
      selectedSectionsCount: pageSummary.selectedSections.length,
      savedCount: pageSummary.saved.length,
      failedCount: pageSummary.failed.length,
      skippedCount: pageSummary.skipped.length,
    };
  }
  if (serviceTemplateSummary) {
    pageSummaries.push({
      ...serviceTemplateSummary,
      selectedSectionsCount: serviceTemplateSummary.selectedSections.length,
      savedCount: serviceTemplateSummary.saved.length,
      failedCount: serviceTemplateSummary.failed.length,
      skippedCount: serviceTemplateSummary.skipped.length,
    });
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
};

// =========================
// EXPORTS
// =========================

module.exports = {
  sectionGenerationQueue,
  enqueueSectionGeneration,
  startSectionGenerationWorker,
  ensureMongooseReady,
  SECTION_GENERATION_QUEUE,
  getLiveProgress: require("../services/sectionGenerationProgress").getLiveProgress,
  getLiveProgressMap: require("../services/sectionGenerationProgress").getLiveProgressMap,
  getDefaultParallelWorkers: require("../services/sectionGenerationProgress").getDefaultParallelWorkers,
};