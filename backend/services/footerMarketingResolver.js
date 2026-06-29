/**
 * Footer marketing copy: AI (footerSection) + SectionContent + project fallbacks.
 * tagline = footer description under logo (FooterPlumbing + admin).
 */

const WebsiteDesignsData = require("../models/WebsiteDesignsData");
const SectionContent = require("../models/SectionContent");
const resolveSectionFile = require("../sections/resolveSectionFile");
const { fetchJSONFromOpenAI } = require("../additional/openaiHelpers");
const { pickFooterMarketingFromProject } = require("./footerLayoutConfig");

function mergeFooterMarketing(runtime = {}, saved = {}, projectMarketing = {}) {
  const pick = (key) =>
    String(runtime[key] || "").trim() ||
    String(saved[key] || "").trim() ||
    String(projectMarketing[key] || "").trim();

  return {
    tagline: pick("tagline"),
    ctaTitle: pick("ctaTitle"),
    ctaSubtitle: pick("ctaSubtitle"),
    ctaButtonText: pick("ctaButtonText") || "Book Now",
    ctaButtonLink: pick("ctaButtonLink") || "/contact",
  };
}

async function loadSavedFooterMarketing(projectId) {
  if (!projectId) return {};

  const designData = await WebsiteDesignsData.findOne({ projectId })
    .select("pages.pageId")
    .lean();
  const homepagePage = designData?.pages?.[0];
  if (!homepagePage) return {};

  const pageId =
    homepagePage?.pageId?._id?.toString() ||
    homepagePage?.pageId?.toString() ||
    homepagePage?._id?.toString();
  if (!pageId) return {};

  const footerDoc = await SectionContent.findOne({
    projectId,
    pageId,
    sectionId: "footer",
    locationId: null,
  })
    .select("data")
    .lean();

  if (!footerDoc?.data || typeof footerDoc.data !== "object") return {};

  const d = footerDoc.data;
  return {
    tagline: String(d.tagline || "").trim(),
    ctaTitle: String(d.ctaTitle || "").trim(),
    ctaSubtitle: String(d.ctaSubtitle || "").trim(),
    ctaButtonText: String(d.ctaButtonText || "").trim(),
    ctaButtonLink: String(d.ctaButtonLink || "").trim(),
  };
}

async function generateFooterMarketingViaAi(project) {
  const sectionFile = resolveSectionFile("footer");
  if (!sectionFile) return null;

  delete require.cache[require.resolve(sectionFile)];
  const sectionModule = require(sectionFile);
  if (typeof sectionModule.prompt !== "function") return null;

  const prompt = sectionModule.prompt({ project });
  const result = await fetchJSONFromOpenAI(prompt, "footer_marketing", {
    userId: project?.userId,
    projectId: project?._id,
    promptFrom: "footerMarketingResolver",
    promptFor: "footer_marketing",
  });

  if (!result || typeof result !== "object") return null;

  return {
    tagline: String(result.tagline || "").trim(),
    ctaTitle: String(result.ctaTitle || "").trim(),
    ctaSubtitle: String(result.ctaSubtitle || "").trim(),
    ctaButtonText: String(result.ctaButtonText || "").trim() || "Book Now",
    ctaButtonLink: "/contact",
  };
}

/**
 * Resolved footer copy for live site + admin preview.
 * Priority: saved SectionContent → AI (footerSection) → project CTA fields (not welcomeLine for tagline).
 */
async function resolveFooterMarketingForProject(projectId, project, savedMarketing = {}) {
  const projectMarketing = pickFooterMarketingFromProject(project);
  let merged = mergeFooterMarketing({}, savedMarketing, projectMarketing);

  const needsAi =
    !merged.tagline || !merged.ctaTitle || !merged.ctaSubtitle;
  if (needsAi && project) {
    try {
      const ai = await generateFooterMarketingViaAi(project);
      if (ai) {
        merged = mergeFooterMarketing(ai, merged, projectMarketing);
      }
    } catch (err) {
      console.warn("[footerMarketingResolver] footer AI copy skipped:", err.message);
    }
  }

  return merged;
}

async function loadResolvedFooterMarketing(projectId, project) {
  const saved = await loadSavedFooterMarketing(projectId);
  return resolveFooterMarketingForProject(projectId, project, saved);
}

module.exports = {
  mergeFooterMarketing,
  loadSavedFooterMarketing,
  generateFooterMarketingViaAi,
  resolveFooterMarketingForProject,
  loadResolvedFooterMarketing,
};
