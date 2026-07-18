/**
 * After AboutUs contact/hours changes, keep Contact + About CTA/FAQ + Footer aligned.
 */

const SiteHeaderFooter = require("../models/siteHeaderFooter");
const SectionContent = require("../models/SectionContent");
const {
  normalizeFooterLayout,
  mergeFooterLayoutIntoSettings,
} = require("./footerLayoutConfig");
const {
  formatBusinessHoursText,
  formatBusinessHoursSub,
  normalizeBusinessHours,
} = require("./businessHours");
const {
  enrichContactInfoContent,
  enrichContactCtaContent,
  enrichContactFaqContent,
} = require("./contactPageDynamics");

async function syncFooterHoursFromAboutUs(projectId, aboutUs) {
  if (!projectId || !aboutUs?.businessHours) return;

  const hoursText = formatBusinessHoursText(aboutUs.businessHours);
  const hoursSub =
    formatBusinessHoursSub(aboutUs.businessHours) || "We're here when you need us";

  const footer = await SiteHeaderFooter.findOne({ projectId, type: 1 });
  if (!footer) return;

  const settings =
    footer.settings && typeof footer.settings === "object" ? { ...footer.settings } : {};
  const custom =
    settings.custom && typeof settings.custom === "object" ? { ...settings.custom } : {};
  const layout = normalizeFooterLayout(custom.footer || {});
  layout.contact = {
    ...layout.contact,
    hoursText: hoursText || layout.contact.hoursText,
    hoursSub,
  };
  footer.settings = mergeFooterLayoutIntoSettings(settings, layout);
  footer.markModified("settings");
  await footer.save();
}

async function syncSectionContentsByIds(projectId, aboutUs, sectionIds, enrichFn) {
  if (!projectId || !aboutUs || !sectionIds?.length) return;
  const sections = await SectionContent.find({
    projectId,
    sectionId: { $in: sectionIds },
    isDeleted: { $ne: true },
  });

  for (const section of sections) {
    const raw = section.data && typeof section.data === "object" ? section.data : {};
    section.data = enrichFn(raw, aboutUs);
    section.markModified("data");
    await section.save();
  }
}

async function syncContactInfoSectionsFromAboutUs(projectId, aboutUs) {
  await syncSectionContentsByIds(projectId, aboutUs, ["contactinfo"], enrichContactInfoContent);
}

async function syncAboutCtaFaqFromAboutUs(projectId, aboutUs) {
  await Promise.all([
    syncSectionContentsByIds(
      projectId,
      aboutUs,
      ["aboutcta", "contactcta"],
      enrichContactCtaContent
    ),
    syncSectionContentsByIds(
      projectId,
      aboutUs,
      ["aboutfaq", "contactfaq", "faq"],
      enrichContactFaqContent
    ),
  ]);
}

async function syncContactSurfacesFromAboutUs(projectId, aboutUs) {
  const normalized = aboutUs
    ? {
        ...aboutUs,
        businessHours: aboutUs.businessHours
          ? normalizeBusinessHours(aboutUs.businessHours)
          : aboutUs.businessHours,
      }
    : aboutUs;

  await Promise.all([
    syncFooterHoursFromAboutUs(projectId, normalized),
    syncContactInfoSectionsFromAboutUs(projectId, normalized),
    syncAboutCtaFaqFromAboutUs(projectId, normalized),
  ]);
}

module.exports = {
  syncFooterHoursFromAboutUs,
  syncContactInfoSectionsFromAboutUs,
  syncAboutCtaFaqFromAboutUs,
  syncContactSurfacesFromAboutUs,
};
