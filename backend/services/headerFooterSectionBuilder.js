/**
 * Runtime header/footer content from project + About Us + SiteHeaderFooter + nav tables.
 * Keys match HeaderPlumbing / FooterPlumbing section.content.
 */

const UserProject = require("../models/userProjects");
const SiteHeaderFooter = require("../models/siteHeaderFooter");
const {
  buildHeaderFooterBundle,
  buildFooterSocialItems,
  buildFooterListsFromBundle,
} = require("./headerFooterService");
const { loadResolvedFooterMarketing } = require("./footerMarketingResolver");
const { pickFooterMarketingFromProject } = require("./footerLayoutConfig");
const {
  DEFAULT_SOURCE,
  resolvePhone,
  resolveEmail,
  telHref,
  mailtoHref,
} = require("./contactResolver");

function resolveLogoFromHeaderDoc(headerDoc, projectName) {
  const url = String(headerDoc?.logo?.url || "").trim();
  const alt = String(headerDoc?.logo?.alt || projectName || "Logo").trim();
  return {
    logoMode: url ? "image" : "text",
    logoText: projectName || "Logo",
    logoUrl: url,
    logoAlt: alt,
    logoLink: "/",
  };
}

function buildCopyrightLine(projectName = "", year = new Date().getFullYear()) {
  const name = String(projectName || "Our Company").trim();
  return `© ${year} ${name}. All rights reserved.`;
}

async function loadHeaderFooterCreateContext(projectId) {
  const [project, activeHeader, activeFooter] = await Promise.all([
    UserProject.findById(projectId)
      .select(
        "projectName mainCategory serviceType welcomeLine projectSlogan description promiseLine callToAction cta"
      )
      .lean(),
    SiteHeaderFooter.findOne({ projectId, type: 0, status: "active" }).lean(),
    SiteHeaderFooter.findOne({ projectId, type: 1, status: "active" }).lean(),
  ]);

  if (!project) {
    throw new Error("Project not found");
  }

  const projectName = String(project.projectName || "").trim();
  const headerBundle = await buildHeaderFooterBundle(projectId, activeHeader);
  const footerBundle = await buildHeaderFooterBundle(projectId, activeFooter);
  const logo = resolveLogoFromHeaderDoc(activeHeader, projectName);
  const dynamic = footerBundle.dynamicItems || headerBundle.dynamicItems || {};
  const aboutUs = footerBundle.aboutUs || headerBundle.aboutUs || null;
  const primaryPhone = resolvePhone({ source: DEFAULT_SOURCE }, aboutUs);
  const primaryEmail = resolveEmail({ source: DEFAULT_SOURCE }, aboutUs);
  const addressText = dynamic.address || dynamic.mainLocation || "";
  const socialItems = buildFooterSocialItems(dynamic.socialLinks || []);

  return {
    project,
    projectName,
    headerBundle,
    footerBundle,
    logo,
    dynamic,
    aboutUs,
    primaryPhone: primaryPhone.text,
    primaryEmail: primaryEmail.text,
    addressText,
    copyrightText: buildCopyrightLine(projectName),
    footerMarketing: await loadResolvedFooterMarketing(projectId, project),
    socialItems,
  };
}

/** HeaderPlumbing: logo*, sticky, phone*, navSources */
function buildHeaderContentPayload(ctx) {
  const { logo, primaryPhone, aboutUs, headerBundle } = ctx;
  const phone = resolvePhone({ source: DEFAULT_SOURCE }, aboutUs);
  const menuItems = headerBundle?.plumbingNavItems || [];
  return {
    ...logo,
    sticky: true,
    phoneSource: DEFAULT_SOURCE,
    phoneText: phone.text || primaryPhone || "",
    phoneLink: phone.link || telHref(primaryPhone),
    menuItems,
    navItems: menuItems,
    navSources: {
      services: headerBundle?.navSources?.services || [],
      locations: headerBundle?.navSources?.locations || [],
      servicesListing: headerBundle?.navSources?.servicesListing || null,
      areasListing: headerBundle?.navSources?.areasListing || null,
    },
  };
}

/** FooterPlumbing: runtime + project marketing copy + About Us social */
function buildFooterContentPayload(ctx, marketingOverrides = {}) {
  const {
    logo,
    primaryPhone,
    primaryEmail,
    addressText,
    dynamic,
    copyrightText,
    footerBundle,
    footerMarketing,
    socialItems,
  } = ctx;

  const marketing = {
    ...footerMarketing,
    ...marketingOverrides,
  };

  const phone = resolvePhone({ source: DEFAULT_SOURCE }, ctx.aboutUs);
  const email = resolveEmail({ source: DEFAULT_SOURCE }, ctx.aboutUs);
  const { quickLinks, serviceLinks, footerLayout } = buildFooterListsFromBundle(footerBundle || {});
  const layout = footerLayout || footerBundle?.footerLayout || null;
  const ctaFromLayout = layout?.cta || {};
  const marketingCtaTitle =
    String(ctaFromLayout.title || "").trim() || marketing.ctaTitle;
  const marketingCtaSubtitle =
    String(ctaFromLayout.subtitle || "").trim() || marketing.ctaSubtitle;
  const resolvedTagline =
    String(layout?.about?.tagline || "").trim() || String(marketing.tagline || "").trim();

  return {
    ...logo,
    showCtaBanner: layout ? layout.showCtaBanner !== false : true,
    footerLayout: layout,
    footerColumns: layout?.columns,
    footerAbout: layout?.about,
    footerContact: layout?.contact,
    ...(resolvedTagline ? { tagline: resolvedTagline } : {}),
    ...(marketingCtaTitle ? { ctaTitle: marketingCtaTitle } : {}),
    ...(marketingCtaSubtitle ? { ctaSubtitle: marketingCtaSubtitle } : {}),
    ctaButtonText: ctaFromLayout.buttonText || marketing.ctaButtonText || "Book Now",
    ctaButtonLink: ctaFromLayout.buttonLink || marketing.ctaButtonLink || "/contact",
    phoneSource: DEFAULT_SOURCE,
    phoneText: phone.text || primaryPhone || "",
    phoneLink: phone.link || telHref(primaryPhone),
    emailSource: DEFAULT_SOURCE,
    emailText: email.text || primaryEmail || "",
    emailLink: email.link || mailtoHref(primaryEmail),
    addressText: addressText || "",
    addressSub:
      dynamic.mainLocation && dynamic.mainLocation !== addressText ? dynamic.mainLocation : "",
    phoneSub: layout?.contact?.phoneSub || "Available 24/7",
    emailSub: layout?.contact?.emailSub || "We reply within an hour",
    hoursText: layout?.contact?.hoursText || "Open 24/7",
    hoursSub: layout?.contact?.hoursSub || "Always on call",
    copyrightText,
    ...(socialItems.length ? { socialItems } : {}),
    quickLinks,
    serviceLinks,
    navSources: {
      services: footerBundle?.navSources?.services || [],
      locations: footerBundle?.navSources?.locations || [],
      servicesListing: footerBundle?.navSources?.servicesListing || null,
      areasListing: footerBundle?.navSources?.areasListing || null,
    },
  };
}

async function buildHeaderFooterSectionContent(sectionId, ctx = {}) {
  const key = String(sectionId || "").trim().toLowerCase();
  const isFooter = key === "footer";
  const isHeader = key === "header" || key === "navbar";
  if (!isHeader && !isFooter) return null;

  const projectId = ctx.projectId || ctx.project?._id;
  if (!projectId) {
    throw new Error("projectId is required for header/footer content build");
  }

  const loaded = await loadHeaderFooterCreateContext(projectId);
  const marketingOverrides = ctx.footerMarketingOverrides || {};
  const content = isFooter
    ? buildFooterContentPayload(loaded, marketingOverrides)
    : buildHeaderContentPayload(loaded);

  return {
    content,
    meta: {
      projectName: loaded.projectName,
      dynamicItems: isFooter ? loaded.footerBundle.dynamicItems : loaded.headerBundle.dynamicItems,
    },
  };
}

async function createHeaderFooterSection(sectionId, ctx) {
  return buildHeaderFooterSectionContent(sectionId, ctx);
}

module.exports = {
  loadHeaderFooterCreateContext,
  pickFooterMarketingFromProject,
  buildFooterContentPayload,
  buildHeaderFooterSectionContent,
  createHeaderFooterSection,
};
