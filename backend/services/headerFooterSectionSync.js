const WebsiteDesignsData = require("../models/WebsiteDesignsData");
const SectionContent = require("../models/SectionContent");
const { buildHeaderFooterSectionContent } = require("./headerFooterSectionBuilder");
const {
  mergeFooterMarketing,
  resolveFooterMarketingForProject,
} = require("./footerMarketingResolver");
const { pickFooterMarketingFromProject } = require("./footerLayoutConfig");
const {
  applySectionContactDynamics,
  fetchAboutUsForContact,
} = require("./contactResolver");

function getPageSections(page = {}) {
  if (Array.isArray(page?.sections)) return page.sections;
  if (Array.isArray(page?.componentIds)) return page.componentIds;
  return [];
}

function assignPageSections(page, sections) {
  page.sections = sections;
  page.sectionLayout = (sections || []).map((s, idx) => ({
    order: idx + 1,
    sectionId: String(s?.sectionData?.id || s?.id || `section-${idx + 1}`),
  }));
}

function patchHeaderElementsFromContent(comp, content = {}) {
  if (!comp?.sectionData) return comp;
  const sid = String(comp.sectionData.id || "header-1");
  const menuItems = Array.isArray(content.menuItems) ? content.menuItems : [];
  const navSources = content.navSources || {};
  let elements = Array.isArray(comp.sectionData.elements)
    ? comp.sectionData.elements.map((el) => ({ ...el, content: { ...(el.content || {}) } }))
    : [];

  const navIdx = elements.findIndex(
    (e) => String(e?.type || "").toLowerCase() === "nav-menu"
  );
  if (navIdx >= 0 && menuItems.length) {
    elements[navIdx] = {
      ...elements[navIdx],
      content: {
        ...(elements[navIdx].content || {}),
        items: menuItems,
        navSources,
      },
    };
  } else if (menuItems.length) {
    elements.push({
      id: `${sid}-hp-nav`,
      type: "nav-menu",
      content: { items: menuItems, navSources },
      style: {
        orientation: "horizontal",
        justifyContent: "center",
        indicator: "underline",
        mobileBreakpoint: "lg",
        itemGap: "1.75rem",
        itemPadding: "0.5rem 0.25rem",
        fontSize: "0.9375rem",
        fontWeight: "600",
      },
    });
  }

  if (content.logoText) {
    const logoIdx = elements.findIndex((e) => String(e.id || "").includes("-hp-logo-text"));
    if (logoIdx >= 0) {
      elements[logoIdx] = {
        ...elements[logoIdx],
        content: { ...(elements[logoIdx].content || {}), text: content.logoText, link: content.logoLink || "/" },
      };
    }
  }

  return {
    ...comp,
    sectionData: {
      ...comp.sectionData,
      elements: elements.length ? elements : comp.sectionData.elements,
    },
  };
}

function patchFooterElementsFromContent(comp, content = {}) {
  if (!comp?.sectionData) return comp;
  const sid = String(comp.sectionData.id || "footer-1");
  const elements = Array.isArray(comp.sectionData.elements)
    ? comp.sectionData.elements.map((el) => ({ ...el, content: { ...(el.content || {}) } }))
    : [];

  const patchEl = (suffix, patch) => {
    const elId = `${sid}${suffix}`;
    const idx = elements.findIndex((e) => String(e.id || "") === elId);
    if (idx < 0) return;
    elements[idx] = {
      ...elements[idx],
      content: { ...(elements[idx].content || {}), ...patch },
    };
  };

  if (content.tagline) patchEl("-fp-tagline", { text: content.tagline });
  if (content.ctaTitle) patchEl("-fp-cta-title", { text: content.ctaTitle });
  if (content.ctaSubtitle) patchEl("-fp-cta-sub", { text: content.ctaSubtitle });
  if (content.ctaButtonText || content.ctaButtonLink) {
    patchEl("-fp-cta-btn", {
      text: content.ctaButtonText || "Book Now",
      link: content.ctaButtonLink || "/contact",
    });
  }
  if (content.copyrightText) patchEl("-fp-copyright", { text: content.copyrightText });
  if (content.logoText) patchEl("-fp-logo-text", { text: content.logoText, link: content.logoLink || "/" });
  if (content.logoUrl) {
    patchEl("-fp-logo-image", {
      imageUrl: content.logoUrl,
      imageAlt: content.logoAlt || content.logoText,
      link: content.logoLink || "/",
    });
  }
  if (Array.isArray(content.socialItems) && content.socialItems.length) {
    patchEl("-fp-social", { items: content.socialItems });
  }
  if (Array.isArray(content.quickLinks) && content.quickLinks.length) {
    patchEl("-fp-quick", { items: content.quickLinks });
  }
  if (Array.isArray(content.serviceLinks) && content.serviceLinks.length) {
    patchEl("-fp-services", { items: content.serviceLinks });
  } else if (Array.isArray(content.navSources?.services) && content.navSources.services.length) {
    patchEl("-fp-services", {
      items: content.navSources.services.slice(0, 12).map((row) => ({
        title: row.label,
        link: row.link,
        linkNewTab: false,
      })),
    });
  }
  if (content.phoneText) {
    patchEl("-fp-phone", { text: content.phoneText, link: content.phoneLink || "" });
    patchEl("-fp-row-phone", {
      text: content.phoneText,
      link: content.phoneLink || "",
      subText: content.phoneSub || "Available 24/7",
    });
  }
  if (content.emailText) {
    patchEl("-fp-row-email", {
      text: content.emailText,
      link: content.emailLink || "",
      subText: content.emailSub || "We reply within an hour",
    });
  }
  if (content.addressText) {
    patchEl("-fp-row-address", {
      text: content.addressText,
      subText: content.addressSub || "",
      link: content.addressLink || "",
    });
  }

  return {
    ...comp,
    sectionData: {
      ...comp.sectionData,
      elements: elements.length ? elements : comp.sectionData.elements,
    },
  };
}

function applyContentPayloadToSectionComp(comp, payload, sectionType) {
  if (!comp?.sectionData || !payload?.content) return comp;
  const sectionId = String(comp.sectionData.id || `${sectionType}-1`);
  const variant =
    comp.sectionData?.styles?.variant ||
    (sectionType === "footer" ? "FooterPlumbing" : "HeaderPlumbing");

  const mergedContent = { ...(comp.sectionData.content || {}), ...payload.content };

  let next = {
    ...comp,
    variant_uniqueId: comp.variant_uniqueId || variant,
    sectionData: {
      ...comp.sectionData,
      type: sectionType,
      id: sectionId,
      content: mergedContent,
      elements: comp.sectionData.elements,
      styles: {
        ...(comp.sectionData.styles || {}),
        variant,
      },
    },
  };

  if (sectionType === "footer") {
    next = patchFooterElementsFromContent(next, mergedContent);
  }
  if (sectionType === "header" && Array.isArray(mergedContent.menuItems) && mergedContent.menuItems.length) {
    next = patchHeaderElementsFromContent(next, mergedContent);
  }

  return next;
}

async function syncHeaderFooterSectionsForProject(projectId, options = {}) {
  if (!projectId) return { updated: 0, pages: 0 };

  const designData = await WebsiteDesignsData.findOne({ projectId });
  if (!designData?.pages?.length) {
    return { updated: 0, pages: 0, message: "no_design_data" };
  }

  const UserProject = require("../models/userProjects");
  const project = await UserProject.findById(projectId)
    .select(
      "_id userId projectName mainCategory serviceType welcomeLine projectSlogan description promiseLine callToAction cta"
    )
    .lean();

  const homepagePage = designData.pages[0];
  const homepagePageId =
    homepagePage?.pageId?._id?.toString() ||
    homepagePage?.pageId?.toString() ||
    homepagePage?._id?.toString();

  let savedFooterMarketing = {};
  if (homepagePageId) {
    const footerDoc = await SectionContent.findOne({
      projectId,
      pageId: homepagePageId,
      sectionId: "footer",
      locationId: null,
    })
      .select("data")
      .lean();
    if (footerDoc?.data && typeof footerDoc.data === "object") {
      savedFooterMarketing = footerDoc.data;
    }
  }

  const footerMarketing =
    options.skipFooterAi === true
      ? mergeFooterMarketing({}, savedFooterMarketing, pickFooterMarketingFromProject(project || {}))
      : await resolveFooterMarketingForProject(projectId, project, savedFooterMarketing);

  const [headerPayload, footerPayload] = await Promise.all([
    buildHeaderFooterSectionContent("header", { projectId }),
    buildHeaderFooterSectionContent("footer", {
      projectId,
      footerMarketingOverrides: footerMarketing,
    }),
  ]);

  let updated = 0;
  const aboutUs = await fetchAboutUsForContact(projectId);

  for (const page of designData.pages) {
    const pageId =
      page?.pageId?._id?.toString() ||
      page?.pageId?.toString() ||
      page?._id?.toString();
    const sections = getPageSections(page);
    let changed = false;

    const nextSections = sections.map((comp) => {
      const type = String(comp?.sectionData?.type || "").toLowerCase();
      if ((type === "navbar" || type === "header") && headerPayload) {
        changed = true;
        return applyContentPayloadToSectionComp(comp, headerPayload, "header");
      }
      if (type === "footer" && footerPayload) {
        changed = true;
        return applyContentPayloadToSectionComp(comp, footerPayload, "footer");
      }
      if (aboutUs && comp?.sectionData) {
        const shellTypes = new Set(["navbar", "header", "footer"]);
        if (!shellTypes.has(type)) {
          changed = true;
          return {
            ...comp,
            sectionData: applySectionContactDynamics(comp.sectionData, aboutUs),
          };
        }
      }
      return comp;
    });

    if (changed) {
      assignPageSections(page, nextSections);
      updated += 1;

      if (options.saveSectionContent !== false && pageId) {
        const saves = [];
        if (headerPayload) {
          saves.push(
            SectionContent.findOneAndUpdate(
              { projectId, pageId, sectionId: "header", locationId: null },
              {
                $set: {
                  data: headerPayload.content,
                  status: "generated",
                  error: null,
                },
              },
              { upsert: true }
            )
          );
        }
        if (footerPayload) {
          saves.push(
            SectionContent.findOneAndUpdate(
              { projectId, pageId, sectionId: "footer", locationId: null },
              {
                $set: {
                  data: footerPayload.content,
                  status: "generated",
                  error: null,
                },
              },
              { upsert: true }
            )
          );
        }
        await Promise.all(saves);
      }
    }
  }

  if (updated > 0) {
    designData.markModified("pages");
    await designData.save();
  }

  return {
    updated,
    pages: designData.pages.length,
    header: Boolean(headerPayload),
    footer: Boolean(footerPayload),
  };
}

module.exports = {
  syncHeaderFooterSectionsForProject,
  buildHeaderFooterSectionContent,
};
