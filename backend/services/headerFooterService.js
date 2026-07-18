const WebsitePage = require("../models/WebsitePage");
const AboutUs = require("../models/aboutus");
const BusinessLocation = require("../models/businessLocation");
const SiteHeaderFooter = require("../models/siteHeaderFooter");
const Service = require("../models/service");
const UserProject = require("../models/userProjects");
const { toPublicPath, normalizeSlugInput } = require("./pageSlugService");
const { buildBusinessLocationPathMap } = require("../additional/businessLocationPaths");
const {
  DEFAULT_SOURCE,
  resolveElementContact,
  applySectionContactContent,
  applyContactDynamicsToAllSections,
} = require("./contactResolver");
const {
  getFooterLayoutFromDoc,
  normalizeFooterLayout,
  menuItemsToListItems,
  buildPagesByIdMap,
  applyPageUrlsToFooterLayout,
  syncLegacyMenuFromFooterLayout,
  mergeFooterLayoutIntoSettings,
  buildFooterLayoutFromDefaultMenu,
  buildEmptyDefaultFooterLayout,
  catalogRowsToFooterServiceMenuItems,
  pickFooterMarketingFromProject,
  resolveFooterLayoutForEditor,
} = require("./footerLayoutConfig");

const DEFAULT_CONTACT_SETTINGS = {
  useAboutUsContact: true,
  phoneDisplayMode: "primary",
  emailDisplayMode: "primary",
};

function normalizeContactSettings(settings = {}) {
  const custom = settings?.custom && typeof settings.custom === "object" ? settings.custom : {};
  return {
    useAboutUsContact:
      custom.useAboutUsContact !== undefined
        ? Boolean(custom.useAboutUsContact)
        : settings.useAboutUsContact !== undefined
          ? Boolean(settings.useAboutUsContact)
          : DEFAULT_CONTACT_SETTINGS.useAboutUsContact,
    phoneDisplayMode:
      custom.phoneDisplayMode === "all" || settings.phoneDisplayMode === "all"
        ? "all"
        : "primary",
    emailDisplayMode:
      custom.emailDisplayMode === "all" || settings.emailDisplayMode === "all"
        ? "all"
        : "primary",
  };
}

function pickContactList(items = [], mode = "primary") {
  const list = Array.isArray(items) ? items.filter((row) => row?.value) : [];
  if (!list.length) return [];
  if (mode === "all") return list;
  const primary = list.find((row) => row.is_primary) || list[0];
  return primary ? [primary] : [];
}

async function fetchAboutUsForProject(projectId) {
  if (!projectId) return null;
  return AboutUs.findOne({ projectId })
    .select("phone phones email emails address mainLocation socialLinks businessHours")
    .lean();
}

function buildAboutUsDynamicItems(aboutUs, contactSettings) {
  if (!aboutUs) {
    return {
      phone: "",
      email: "",
      address: "",
      mainLocation: "",
      phones: [],
      emails: [],
      socialLinks: [],
    };
  }

  const phones = pickContactList(
    aboutUs.phones?.length ? aboutUs.phones : aboutUs.phone ? [{ value: aboutUs.phone, is_primary: true }] : [],
    contactSettings.phoneDisplayMode
  );
  const emails = pickContactList(
    aboutUs.emails?.length ? aboutUs.emails : aboutUs.email ? [{ value: aboutUs.email, is_primary: true }] : [],
    contactSettings.emailDisplayMode
  );

  return {
    phone: phones[0]?.value || aboutUs.phone || "",
    email: emails[0]?.value || aboutUs.email || "",
    address: aboutUs.address || "",
    mainLocation: aboutUs.mainLocation || "",
    phones: phones.map((row) => ({ value: row.value, is_primary: Boolean(row.is_primary) })),
    emails: emails.map((row) => ({ value: row.value, is_primary: Boolean(row.is_primary) })),
    socialLinks: Array.isArray(aboutUs.socialLinks) ? aboutUs.socialLinks : [],
  };
}

function resolveContactDetailsForDisplay(storedContact = {}, aboutUs, contactSettings) {
  const dynamic = buildAboutUsDynamicItems(aboutUs, contactSettings);
  const phoneEnabled = storedContact?.phone?.enabled !== false;
  const emailEnabled = storedContact?.email?.enabled !== false;
  const addressEnabled = storedContact?.address?.enabled === true;

  const useAboutUs = contactSettings.useAboutUsContact && Boolean(aboutUs);

  const primaryPhone = dynamic.phones[0]?.value || "";
  const primaryEmail = dynamic.emails[0]?.value || "";

  return {
    phone: {
      enabled: phoneEnabled,
      number: useAboutUs ? primaryPhone : storedContact?.phone?.number || primaryPhone,
      label: storedContact?.phone?.label || "Phone",
      style: storedContact?.phone?.style || {},
      items: dynamic.phones,
      displayMode: contactSettings.phoneDisplayMode,
    },
    email: {
      enabled: emailEnabled,
      address: useAboutUs ? primaryEmail : storedContact?.email?.address || primaryEmail,
      label: storedContact?.email?.label || "Email",
      style: storedContact?.email?.style || {},
      items: dynamic.emails,
      displayMode: contactSettings.emailDisplayMode,
    },
    address: {
      enabled: addressEnabled,
      text: useAboutUs ? dynamic.address : storedContact?.address?.text || dynamic.address,
      label: storedContact?.address?.label || "Address",
      style: storedContact?.address?.style || {},
    },
  };
}

function pagePath(page = {}) {
  const slug = normalizeSlugInput(page?.slug || "");
  return slug ? toPublicPath(slug) : "/";
}

function menuLinkItem({
  id,
  label,
  url,
  pageId = null,
  serviceId = null,
  linkPerArea = false,
  order = 0,
  children = [],
}) {
  const item = {
    id: String(id),
    name: String(label || ""),
    url: String(url || "#"),
    pageId: pageId || null,
    icon: "",
    target: "_self",
    order,
    children: Array.isArray(children) ? children : [],
    style: {},
  };
  if (serviceId) item.serviceId = String(serviceId);
  if (linkPerArea) item.linkPerArea = true;
  return item;
}

function toTitleCaseWords(value = "") {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Read-only: catalog display name from Service row (never writes Service collection). */
function catalogServiceLabel(serviceDoc = {}, fallback = "Service") {
  const raw = String(serviceDoc?.name || "").trim();
  return raw ? toTitleCaseWords(raw) : fallback;
}

function pickServicePageForLocation(servicePages = [], serviceId, contextLocationId) {
  const sid = String(serviceId || "").trim();
  if (!sid) return null;
  const rows = servicePages.filter((p) => String(p?.serviceId || "") === sid);
  if (!rows.length) return null;
  const locId = contextLocationId != null && String(contextLocationId).trim() !== ""
    ? String(contextLocationId).trim()
    : "";
  if (locId) {
    const exact = rows.find((p) => String(p?.locationId || "") === locId);
    if (exact) return exact;
  }
  const parent = rows.find((p) => {
    const loc = p?.locationId;
    return !loc || String(loc).trim() === "";
  });
  return parent || rows[0];
}

function buildServiceNavRows(serviceCatalog = [], servicePages = [], contextLocationId = null, options = {}) {
  const { catalogOnly = false } = options;
  const catalogById = new Map(
    (Array.isArray(serviceCatalog) ? serviceCatalog : []).map((s) => [String(s._id), s])
  );
  const orderedIds = catalogById.size
    ? [...catalogById.keys()]
    : [
        ...new Set(
          (Array.isArray(servicePages) ? servicePages : [])
            .map((p) => String(p?.serviceId || "").trim())
            .filter(Boolean)
        ),
      ];

  return orderedIds
    .map((serviceId) => {
      const cat = catalogById.get(serviceId);
      const label = catalogServiceLabel(cat, "Service");
      const page = pickServicePageForLocation(servicePages, serviceId, contextLocationId);

      if (catalogOnly) {
        return {
          serviceId,
          label,
          link: page ? pagePath(page) : "#",
          pageId: null,
          linkPerArea: true,
        };
      }

      if (!page?._id) return null;
      return {
        serviceId,
        label,
        link: pagePath(page),
        pageId: String(page._id),
        linkPerArea: false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function extractServiceIdFromMenuChild(child = {}) {
  if (child?.serviceId) return String(child.serviceId);
  const id = String(child?.id || "");
  if (id.startsWith("svc-")) return id.slice(4).split("-")[0] || "";
  return "";
}

function sortMenuByOrder(items = []) {
  return [...(Array.isArray(items) ? items : [])]
    .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))
    .map((item) => ({
      ...item,
      children: sortMenuByOrder(item.children || []),
    }));
}

function findNavMenuElement(elements = []) {
  return (Array.isArray(elements) ? elements : []).find(
    (el) => String(el?.type || "").toLowerCase() === "nav-menu"
  );
}

/** Default HeaderPlumbing element shell (ids tied to section.id). */
function buildDefaultHeaderPlumbingElements(sectionId, plumbingNavItems = [], navSources = {}) {
  const sid = String(sectionId || "header-1").trim();
  return [
    {
      id: `${sid}-hp-logo-text`,
      type: "heading",
      content: { text: "Logo", htmlTag: "motion.div", link: "/" },
      style: { fontSize: "1.375rem", fontWeight: "900", letterSpacing: "-0.01em", lineHeight: "1" },
    },
    {
      id: `${sid}-hp-nav`,
      type: "nav-menu",
      content: {
        items: Array.isArray(plumbingNavItems) ? plumbingNavItems : [],
        navSources: navSources || {},
      },
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
    },
    {
      id: `${sid}-hp-phone`,
      type: "text",
      content: { text: "", link: "", openInNewTab: false, textSize: "small" },
      style: { fontWeight: "700", fontSize: "0.9375rem" },
    },
    {
      id: `${sid}-hp-cta`,
      type: "button",
      content: {
        text: "Book Now",
        link: "/contact",
        icon: "fa-calendar-check",
        iconPosition: "left",
        openInNewTab: false,
      },
      style: {
        padding: "0.625rem 1.25rem",
        borderRadius: "0.5rem",
        fontWeight: "700",
        fontSize: "0.875rem",
      },
    },
  ];
}

function ensurePlumbingHeaderElements(section = {}, plumbingNavItems = [], navSources = {}) {
  const sectionId = String(section?.id || section?.data?.id || "header-1").trim();
  let elements = sectionElementsFromResolved(section);
  if (!elements.length) {
    elements = buildDefaultHeaderPlumbingElements(sectionId, plumbingNavItems, navSources);
  } else {
    const navEl = findNavMenuElement(elements);
    if (navEl) {
      elements = elements.map((el) =>
        String(el?.type || "").toLowerCase() === "nav-menu"
          ? {
              ...el,
              content: {
                ...(el.content || {}),
                items: plumbingNavItems,
                navSources: {
                  services: navSources?.services || [],
                  locations: navSources?.locations || [],
                },
              },
            }
          : el
      );
    } else {
      const defaults = buildDefaultHeaderPlumbingElements(sectionId, plumbingNavItems, navSources);
      const navDefault = findNavMenuElement(defaults);
      const rest = defaults.filter((el) => String(el?.type || "").toLowerCase() !== "nav-menu");
      const logo = elements.find((el) => String(el?.id || "").includes("-hp-logo")) || rest[0];
      const phone = elements.find((el) => String(el?.id || "").includes("-hp-phone")) || rest[2];
      const cta = elements.find((el) => String(el?.id || "").includes("-hp-cta")) || rest[3];
      elements = [logo, navDefault || rest[1], phone, cta].filter(Boolean);
    }
  }
  return writePatchedElementsToSection(
    { ...section, id: sectionId },
    elements
  );
}

function buildServicesMenuChildren(navRows = [], storedChildren = []) {
  const rows = Array.isArray(navRows) ? navRows : [];
  const byServiceId = new Map(
    rows.filter((r) => r?.serviceId).map((r) => [String(r.serviceId), r])
  );

  const stored = (Array.isArray(storedChildren) ? storedChildren : []).filter((child) => {
    const sid = extractServiceIdFromMenuChild(child);
    return sid && byServiceId.has(sid);
  });

  const orderedRows =
    stored.length > 0
      ? stored
          .map((child) => byServiceId.get(extractServiceIdFromMenuChild(child)))
          .filter(Boolean)
      : rows;

  return orderedRows.map((row, idx) =>
    menuLinkItem({
      id: `svc-${row.serviceId}`,
      label: row.label,
      url: row.linkPerArea ? "#" : row.link,
      pageId: row.linkPerArea ? null : row.pageId,
      serviceId: row.serviceId,
      linkPerArea: Boolean(row.linkPerArea),
      order: idx,
    })
  );
}

function plumbingLinkItem({
  label,
  link,
  pageId = null,
  serviceId = null,
  linkPerArea = false,
  children = undefined,
  selectSource = undefined,
  viewAllLabel,
  viewAllLink,
}) {
  const item = {
    label: String(label || ""),
    link: String(link || "#"),
    linkNewTab: false,
    active: false,
  };
  if (pageId) item.pageId = String(pageId);
  if (serviceId) item.serviceId = String(serviceId);
  if (linkPerArea) item.linkPerArea = true;
  if (Array.isArray(children) && children.length) item.dropdown = children;
  if (selectSource) item.selectSource = selectSource;
  if (viewAllLabel) item.viewAllLabel = viewAllLabel;
  if (viewAllLink) item.viewAllLink = viewAllLink;
  return item;
}

/**
 * Smart area selection for header dropdown based on current location context.
 * Priority: children → siblings → parent
 * 
 * @param {Array} businessLocations - All active business locations
 * @param {Map} locationPageByLocId - Map of locationId → WebsitePage
 * @param {string|null} contextLocationId - Current page's locationId (null for homepage)
 * @returns {Array} Array of location nav items {label, link, pageId, locationId}
 */
function buildContextualAreasForHeader(businessLocations, locationPageByLocId, contextLocationId, pathByLocationId = new Map()) {
  if (!businessLocations?.length) return [];

  // Build lookup maps for fast access
  const locById = new Map(businessLocations.map(l => [String(l._id), l]));
  const childrenByParentId = new Map();
  
  for (const loc of businessLocations) {
    const parentKey = loc.parentId ? String(loc.parentId) : "__root__";
    if (!childrenByParentId.has(parentKey)) {
      childrenByParentId.set(parentKey, []);
    }
    childrenByParentId.get(parentKey).push(loc);
  }

  // Prefer WebsitePage slug; fall back to hierarchical BusinessLocation path so
  // Areas dropdown is never empty / non-clickable when pages are missing.
  const locsToNavItems = (locs) => {
    return locs
      .map((loc) => {
        const locId = String(loc._id);
        const page = locationPageByLocId.get(locId);
        const pathFallback = pathByLocationId?.get?.(locId)
          ? `/${String(pathByLocationId.get(locId)).replace(/^\/+/, "")}`
          : "";
        const link = page ? pagePath(page) : pathFallback;
        if (!link || link === "#") return null;
        return {
          label: loc.areaName || page?.displayName || page?.name || "Area",
          link,
          pageId: page ? String(page._id) : null,
          locationId: locId,
          linkNewTab: false,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  // Case 1: No context location (homepage) → show top-level locations (root children)
  if (!contextLocationId) {
    const rootChildren = childrenByParentId.get("__root__") || [];
    if (rootChildren.length) {
      return locsToNavItems(rootChildren);
    }
    // No root children, show all locations
    return locsToNavItems(businessLocations);
  }

  const currentLoc = locById.get(contextLocationId);
  if (!currentLoc) {
    // Location not found, fallback to root children
    const rootChildren = childrenByParentId.get("__root__") || [];
    return locsToNavItems(rootChildren.length ? rootChildren : businessLocations);
  }

  // Case 2: Current location has children → show children
  const children = childrenByParentId.get(contextLocationId) || [];
  if (children.length) {
    return locsToNavItems(children);
  }

  // Case 3: No children → show siblings (same parentId, excluding self)
  const parentKey = currentLoc.parentId ? String(currentLoc.parentId) : "__root__";
  const siblings = (childrenByParentId.get(parentKey) || [])
    .filter(loc => String(loc._id) !== contextLocationId);
  
  if (siblings.length) {
    return locsToNavItems(siblings);
  }

  // Case 4: No siblings → show parent
  if (currentLoc.parentId) {
    const parent = locById.get(String(currentLoc.parentId));
    if (parent) {
      return locsToNavItems([parent]);
    }
  }

  // Fallback: show root children or all locations
  const rootChildren = childrenByParentId.get("__root__") || [];
  return locsToNavItems(rootChildren.length ? rootChildren : businessLocations);
}

async function buildNavSources(projectId, options = {}) {
  const contextLocationId =
    options?.contextLocationId != null && String(options.contextLocationId).trim() !== ""
      ? String(options.contextLocationId).trim()
      : null;
  const catalogOnly = Boolean(options.catalogOnly);

  const [websitePagesRaw, businessLocations, serviceCatalog] = await Promise.all([
    WebsitePage.find({ projectId })
      .select("_id slug displayName pageType serviceId locationId name isPublished")
      .lean(),
    BusinessLocation.find({ projectId, status: 1 })
      .select("_id areaName type parentId")
      .lean(),
    Service.find({ projectId }).select("_id name slug").sort({ name: 1 }).lean(),
  ]);

  const activeLocIds = new Set(businessLocations.map((l) => String(l._id)));
  const websitePages = (websitePagesRaw || []).filter((p) => {
    if (p.isPublished === false) return false;
    if (p.locationId && !activeLocIds.has(String(p.locationId))) return false;
    return true;
  });

  const servicePages = websitePages.filter(
    (p) => String(p?.pageType || "").toLowerCase() === "service" && p?.serviceId
  );

  const services = buildServiceNavRows(
    serviceCatalog,
    servicePages,
    contextLocationId,
    { catalogOnly }
  );

  const locationPageByLocId = new Map();
  websitePages.forEach((p) => {
    if (String(p?.pageType || "").toLowerCase() === "service") return;
    if (!p?.locationId) return;
    const locId = String(p.locationId);
    if (!locationPageByLocId.has(locId)) {
      locationPageByLocId.set(locId, p);
    }
  });

  // Use smart contextual area selection (page slug or hierarchical path fallback)
  const pathByLocationId = buildBusinessLocationPathMap(businessLocations);
  const locations = buildContextualAreasForHeader(
    businessLocations,
    locationPageByLocId,
    contextLocationId,
    pathByLocationId
  );

  const findListingPage = (candidates = [], preferredLocationId = null) => {
    const locId =
      preferredLocationId != null && String(preferredLocationId).trim() !== ""
        ? String(preferredLocationId).trim()
        : null;
    for (const hint of candidates) {
      const matches = websitePages.filter((p) => {
        const slug = normalizeSlugInput(p.slug || p.name || "");
        const name = normalizeSlugInput(p.name || "");
        return slug === hint || name === hint || slug.endsWith(`/${hint}`);
      });
      if (!matches.length) continue;
      if (locId) {
        const scoped = matches.find((p) => String(p?.locationId || "") === locId);
        if (scoped) return scoped;
      }
      const global = matches.find((p) => !p?.locationId);
      return global || matches[0];
    }
    return null;
  };

  const servicesListing = findListingPage(
    ["services", "service", "our-services"],
    contextLocationId
  );
  // All Areas directory only — never treat Area Detail template (`location`) as the listing.
  const areasListing = findListingPage(["areas", "area", "all-areas", "allareas"]);

  return {
    services,
    locations,
    servicesListing: servicesListing
      ? { label: servicesListing.displayName || "Services", link: pagePath(servicesListing), pageId: String(servicesListing._id) }
      : { label: "Services", link: "/services", pageId: null },
    areasListing: areasListing
      ? { label: areasListing.displayName || "Areas", link: pagePath(areasListing), pageId: String(areasListing._id) }
      : { label: "Areas", link: "/areas", pageId: null },
    pages: websitePages,
  };
}

function findPageByHints(pages = [], hints = []) {
  return pages.find((p) => {
    const slug = normalizeSlugInput(p?.slug || "");
    const name = normalizeSlugInput(p?.name || "");
    return hints.some((h) => slug === h || name === h || slug.endsWith(`/${h}`));
  });
}

function mergeMenuWithNavSources(menu = [], navSources = {}) {
  const availablePages = Array.isArray(navSources.pages) ? navSources.pages : [];
  const availablePageIdSet = new Set(availablePages.map((p) => String(p?._id || "")).filter(Boolean));
  const availablePathSet = new Set(
    availablePages.map((p) => pagePath(p)).filter(Boolean)
  );
  const hasServices = Boolean(navSources.servicesListing?.pageId) || (navSources.services || []).length > 0;
  const hasAreas = Boolean(navSources.areasListing?.pageId) || (navSources.locations || []).length > 0;

  const servicesParent = (Array.isArray(menu) ? menu : []).find((item) => {
    const url = normalizeSlugInput(String(item?.url || "").replace(/^\//, ""));
    const name = String(item?.name || item?.label || "").toLowerCase();
    return (
      item?.id === "services" ||
      name.includes("service") ||
      url === "services" ||
      url.endsWith("/services")
    );
  });
  const servicesChildren = buildServicesMenuChildren(
    navSources.services || [],
    servicesParent?.children || []
  );
  const areaChildren = (navSources.locations || []).map((row, idx) =>
    menuLinkItem({
      id: `area-${row.pageId || idx}`,
      label: row.label,
      url: row.link,
      pageId: row.pageId,
      order: idx,
    })
  );

  const merged = (Array.isArray(menu) ? menu : []).map((item) => {
      if (isServicesMenuItem(item)) {
        return {
          ...item,
          url: navSources.servicesListing?.link || item.url || "/services",
          pageId: navSources.servicesListing?.pageId || item.pageId || null,
          children: servicesChildren.length ? servicesChildren : item.children || [],
        };
      }
      if (isAreasMenuItem(item)) {
        return {
          ...item,
          url: navSources.areasListing?.link || item.url || "/areas",
          pageId: navSources.areasListing?.pageId || item.pageId || null,
          children: areaChildren.length ? areaChildren : item.children || [],
        };
      }
      if (item?.pageId && !item?.linkPerArea && !item?.serviceId) {
        const pages = navSources.pages || [];
        const page = pages.find((p) => String(p._id) === String(item.pageId));
        if (page) {
          return { ...item, url: pagePath(page) };
        }
      }
      return item;
    });

  const shouldKeepItem = (item = {}) => {
    const id = String(item?.id || "").toLowerCase().trim();
    const name = String(item?.name || item?.label || "").toLowerCase().trim();
    const url = String(item?.url || item?.link || "").trim();
    const normalizedUrl = normalizeSlugInput(url.replace(/^\//, ""));
    const pageId = item?.pageId ? String(item.pageId) : "";

    if (id === "services" || name.includes("service") || normalizedUrl === "services") {
      return hasServices;
    }
    if (id === "areas" || name.includes("area") || normalizedUrl === "areas") {
      return hasAreas;
    }
    if (!url || url === "#") return false;
    if (url === "/") return true;
    if (pageId) return availablePageIdSet.has(pageId);
    return availablePathSet.has(url);
  };

  const filterMenuTree = (items = []) =>
    (Array.isArray(items) ? items : [])
      .map((item) => ({
        ...item,
        children: filterMenuTree(item.children || []),
      }))
      .filter(shouldKeepItem);

  return sortMenuByOrder(filterMenuTree(merged));
}

async function buildDefaultSiteMenu(projectId, options = {}) {
  const navSources = await buildNavSources(projectId, options);
  const pages = navSources.pages || [];

  const home = findPageByHints(pages, ["", "home", "homepage"]);
  const about = findPageByHints(pages, ["about", "about-us", "aboutus"]);
  const contact = findPageByHints(pages, ["contact", "contact-us"]);
  const blogs = findPageByHints(pages, ["blogs", "blog", "news"]);
  const menu = [];
  let order = 0;

  // Canonical business-site nav (matches SiteNext / GenieBuild demo chrome):
  // Home → About → Services → Areas → Blog → Contact — only include pages that exist
  // (or Services/Areas when catalog/locations make those menus meaningful).

  menu.push(
    menuLinkItem({
      id: "home",
      label: home?.displayName || "Home",
      url: home ? pagePath(home) : "/",
      pageId: home?._id,
      order: order++,
    })
  );

  if (about?._id) {
    menu.push(
      menuLinkItem({
        id: "about",
        label: about.displayName || "About",
        url: pagePath(about),
        pageId: about._id,
        order: order++,
      })
    );
  }

  const hasServicesNav =
    Boolean(navSources.servicesListing?.pageId) || (navSources.services || []).length > 0;
  if (hasServicesNav) {
    menu.push(
      menuLinkItem({
        id: "services",
        label: navSources.servicesListing?.label || "Services",
        url: navSources.servicesListing?.link || "/services",
        pageId: navSources.servicesListing?.pageId,
        order: order++,
        children: (navSources.services || []).map((row, idx) =>
          menuLinkItem({
            id: `svc-${row.serviceId || row.pageId || idx}`,
            label: row.label,
            url: row.link,
            pageId: row.pageId,
            serviceId: row.serviceId,
            linkPerArea: Boolean(row.linkPerArea),
            order: idx,
          })
        ),
      })
    );
  }

  // Areas nav → All Areas listing (`/areas`), never Area Detail template (`/location`).
  const hasAreasNav =
    Boolean(navSources.areasListing?.pageId) || (navSources.locations || []).length > 0;
  if (hasAreasNav) {
    const areasUrl = navSources.areasListing?.link || "/areas";
    menu.push(
      menuLinkItem({
        id: "areas",
        label: navSources.areasListing?.label || "Areas",
        url: areasUrl,
        pageId: navSources.areasListing?.pageId || null,
        order: order++,
        children: (navSources.locations || []).map((row, idx) =>
          menuLinkItem({
            id: `area-${row.pageId || idx}`,
            label: row.label,
            url: row.link,
            pageId: row.pageId,
            order: idx,
          })
        ),
      })
    );
  }

  if (blogs?._id) {
    menu.push(
      menuLinkItem({
        id: "blog",
        label: blogs.displayName || "Blog",
        url: pagePath(blogs),
        pageId: blogs._id,
        order: order++,
      })
    );
  }

  if (contact?._id) {
    menu.push(
      menuLinkItem({
        id: "contact",
        label: contact.displayName || "Contact",
        url: pagePath(contact),
        pageId: contact._id,
        order: order++,
      })
    );
  }

  return menu;
}

function buildPlumbingNavItems(menu = [], navSources = {}) {
  const servicesDropdown = (navSources.services || []).map((row) =>
    plumbingLinkItem({
      label: row.label,
      link: row.link,
      pageId: row.linkPerArea ? null : row.pageId,
      serviceId: row.serviceId,
      linkPerArea: Boolean(row.linkPerArea),
    })
  );
  const areasDropdown = (navSources.locations || []).map((row) =>
    plumbingLinkItem({ label: row.label, link: row.link, pageId: row.pageId })
  );

  const base =
    Array.isArray(menu) && menu.length
      ? menu
      : [
          plumbingLinkItem({ label: "Home", link: "/" }),
          plumbingLinkItem({ label: "About", link: "/about" }),
          plumbingLinkItem({
            label: "Services",
            link: navSources.servicesListing?.link || "/services",
            selectSource: "services",
            viewAllLabel: "View All Services",
            viewAllLink: navSources.servicesListing?.link || "/services",
          }),
          plumbingLinkItem({
            label: "Areas",
            link: navSources.areasListing?.link || "/areas",
            selectSource: "locations",
            viewAllLabel: "View All Areas",
            viewAllLink: navSources.areasListing?.link || "/areas",
          }),
          plumbingLinkItem({ label: "Blog", link: "/blogs" }),
          plumbingLinkItem({ label: "Contact", link: "/contact" }),
        ];

  return base.map((item) => {
    const baseItem = { ...item, active: false };
    const label = String(baseItem.label || "").toLowerCase();
    const link = normalizeSlugInput(baseItem.link || "");
    if (baseItem.selectSource === "services" || label.includes("service") || link === "services") {
      // Always use live generated service links (do not trust persisted stale dropdown urls).
      const dropdown = servicesDropdown;
      return {
        ...baseItem,
        label: item.label || navSources.servicesListing?.label || "Services",
        link: navSources.servicesListing?.link || item.link || "/services",
        pageId: navSources.servicesListing?.pageId || item.pageId,
        viewAllLink: navSources.servicesListing?.link || item.viewAllLink || "/services",
        dropdown,
        selectSource: dropdown.length ? undefined : "services",
      };
    }
    if (
      baseItem.selectSource === "locations" ||
      label.includes("area") ||
      link === "areas" ||
      link === "location" ||
      link === "locations"
    ) {
      // Always use live generated area links from current project pages/locations.
      const dropdown = areasDropdown;
      return {
        ...baseItem,
        label: item.label || navSources.areasListing?.label || "Areas",
        link: navSources.areasListing?.link || item.link || "/areas",
        pageId: navSources.areasListing?.pageId || item.pageId,
        viewAllLink: navSources.areasListing?.link || item.viewAllLink || "/areas",
        dropdown,
        selectSource: dropdown.length ? undefined : "locations",
      };
    }
    if (label.includes("about")) {
      const aboutPage = findPageByHints(navSources.pages || [], ["about", "about-us", "aboutus"]);
      if (aboutPage) {
        return { ...baseItem, link: pagePath(aboutPage), pageId: String(aboutPage._id), label: aboutPage.displayName || baseItem.label };
      }
    }
    if (label.includes("blog") || link === "blogs" || link === "blog" || link === "news") {
      const blogsPage = findPageByHints(navSources.pages || [], ["blogs", "blog", "news"]);
      if (blogsPage) {
        return {
          ...baseItem,
          link: pagePath(blogsPage),
          pageId: String(blogsPage._id),
          label: blogsPage.displayName || baseItem.label || "Blog",
        };
      }
    }
    if (label.includes("contact")) {
      const contactPage = findPageByHints(navSources.pages || [], ["contact", "contact-us"]);
      if (contactPage) {
        return { ...baseItem, link: pagePath(contactPage), pageId: String(contactPage._id), label: contactPage.displayName || baseItem.label };
      }
    }
    if (label === "home" || link === "" || link === "home") {
      const homePage = findPageByHints(navSources.pages || [], ["", "home", "homepage"]);
      if (homePage) {
        return { ...baseItem, link: pagePath(homePage), pageId: String(homePage._id) };
      }
    }
    return baseItem;
  });
}

function telHref(value = "") {
  const digits = String(value).replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function mailtoHref(value = "") {
  const trimmed = String(value || "").trim();
  return trimmed ? `mailto:${trimmed}` : "";
}

function menuToListItems(menu = []) {
  return (Array.isArray(menu) ? menu : [])
    .filter((m) => m?.name || m?.label)
    .map((m) => ({
      title: m.name || m.label,
      link: m.url || m.link || "#",
      linkNewTab: false,
    }));
}

function buildFooterServiceListItems(navSources = {}, limit = 5) {
  return (navSources.services || []).slice(0, limit).map((row) => ({
    title: row.label,
    link: row.link,
    linkNewTab: false,
  }));
}

function isServicesMenuItem(item = {}) {
  const url = normalizeSlugInput(String(item?.url || "").replace(/^\//, ""));
  const name = String(item?.name || item?.label || "").toLowerCase();
  return (
    item?.id === "services" ||
    name.includes("service") ||
    url === "services" ||
    url.endsWith("/services")
  );
}

function isAreasMenuItem(item = {}) {
  const url = normalizeSlugInput(String(item?.url || "").replace(/^\//, ""));
  const name = String(item?.name || item?.label || "").toLowerCase();
  return (
    item?.id === "areas" ||
    name.includes("area") ||
    url === "areas" ||
    url.endsWith("/areas")
  );
}

/** Footer "Quick Links" column — legacy: top-level rows except Services. */
function buildFooterQuickLinksFromMenu(menu = [], pagesById = null) {
  return menuItemsToListItems(
    sortMenuByOrder(menu).filter((item) => !isServicesMenuItem(item)),
    pagesById
  );
}

/** Footer "Services" column — children under Services menu item, merged with live nav URLs. */
function buildFooterServiceLinksFromMenu(menu = [], navSources = {}) {
  const servicesParent = sortMenuByOrder(menu).find((item) => isServicesMenuItem(item));
  if (servicesParent && Array.isArray(servicesParent.children) && servicesParent.children.length) {
    const mergedChildren = buildServicesMenuChildren(
      navSources.services || [],
      servicesParent.children
    );
    return mergedChildren
      .map((child) => ({
        title: String(child?.name || child?.label || "").trim(),
        link: String(child?.url || child?.link || "#").trim(),
        linkNewTab: false,
      }))
      .filter((row) => row.title);
  }
  return buildFooterServiceListItems(navSources, 12);
}

function buildFooterListsFromBundle(bundle = {}) {
  const navSources = bundle.navSources || bundle.dynamicItems?.navSources || {};
  const pagesById = buildPagesByIdMap(navSources.pages || []);
  const layout = bundle.footerLayout ? normalizeFooterLayout(bundle.footerLayout) : null;

  if (layout) {
    const quickLinks =
      layout.columns?.quickLinks?.enabled !== false
        ? menuItemsToListItems(layout.quickLinks?.items || [], pagesById)
        : [];
    let serviceLinks = [];
    if (layout.columns?.services?.enabled !== false) {
      const mergedChildren = buildServicesMenuChildren(
        navSources.services || [],
        layout.services?.children || []
      );
      serviceLinks = menuItemsToListItems(mergedChildren, pagesById);
      if (!serviceLinks.length) {
        serviceLinks = buildFooterServiceListItems(navSources, 12);
      }
    }
    return { quickLinks, serviceLinks, footerLayout: layout };
  }

  const menu = Array.isArray(bundle.menu) ? bundle.menu : [];
  return {
    quickLinks: buildFooterQuickLinksFromMenu(menu, pagesById),
    serviceLinks: buildFooterServiceLinksFromMenu(menu, navSources),
    footerLayout: getFooterLayoutFromDoc({ menu }),
  };
}

function flattenMenuToQuickLinks(menu = []) {
  return buildFooterQuickLinksFromMenu(menu);
}

const FOOTER_LIST_STYLE = {
  listType: "none",
  itemGap: "0.625rem",
  indent: "0px",
  fontSize: "0.875rem",
  textAlign: "left",
};

function buildDefaultFooterPlumbingElements(sectionId, quickLinks = [], serviceLinks = []) {
  const sid = String(sectionId || "footer-1").trim();
  return [
    {
      id: `${sid}-fp-quick`,
      type: "list",
      content: { items: quickLinks },
      style: { ...FOOTER_LIST_STYLE },
    },
    {
      id: `${sid}-fp-services`,
      type: "list",
      content: { items: serviceLinks },
      style: { ...FOOTER_LIST_STYLE },
    },
  ];
}

function ensurePlumbingFooterElements(section = {}, bundle = {}) {
  const sectionId = String(section?.id || section?.data?.id || "footer-1").trim();
  const { quickLinks, serviceLinks } = buildFooterListsFromBundle(bundle);
  let elements = sectionElementsFromResolved(section);

  const patchList = (els, suffix, items) => {
    const idx = els.findIndex((e) => String(e?.id || "").includes(suffix));
    if (idx >= 0) {
      return els.map((el, i) =>
        i === idx ? { ...el, content: { ...(el.content || {}), items } } : el
      );
    }
    const defaults = buildDefaultFooterPlumbingElements(sectionId, quickLinks, serviceLinks);
    const seed = defaults.find((e) => String(e.id || "").includes(suffix));
    return seed ? [...els, seed] : els;
  };

  if (!elements.length) {
    elements = buildDefaultFooterPlumbingElements(sectionId, quickLinks, serviceLinks);
  } else {
    if (quickLinks.length) elements = patchList(elements, "-fp-quick", quickLinks);
    if (serviceLinks.length) elements = patchList(elements, "-fp-services", serviceLinks);
  }

  return writePatchedElementsToSection({ ...section, id: sectionId }, elements);
}

const SOCIAL_PLATFORM_ICONS = {
  facebook: "fa-brands fa-facebook",
  instagram: "fa-brands fa-instagram",
  twitter: "fa-brands fa-twitter",
  x: "fa-brands fa-x-twitter",
  threads: "fa-brands fa-threads",
  youtube: "fa-brands fa-youtube",
  linkedin: "fa-brands fa-linkedin",
  pinterest: "fa-brands fa-pinterest",
  tiktok: "fa-brands fa-tiktok",
  whatsapp: "fa-brands fa-whatsapp",
  telegram: "fa-brands fa-telegram",
};

function normalizeSocialPlatform(platform = "", url = "") {
  const raw = String(platform || "").trim().toLowerCase();
  const href = String(url || "").trim().toLowerCase();
  if (raw === "threads" || href.includes("threads.net")) return "threads";
  if (raw === "x" || raw === "twitter-x" || /(^|\/\/)(www\.)?x\.com\b/.test(href)) return "x";
  if (raw === "twitter" || href.includes("twitter.com")) return "twitter";
  if (raw && SOCIAL_PLATFORM_ICONS[raw]) return raw;
  if (href.includes("facebook.com")) return "facebook";
  if (href.includes("instagram.com")) return "instagram";
  if (href.includes("youtube.com") || href.includes("youtu.be")) return "youtube";
  if (href.includes("linkedin.com")) return "linkedin";
  if (href.includes("tiktok.com")) return "tiktok";
  if (href.includes("pinterest.")) return "pinterest";
  if (href.includes("wa.me") || href.includes("whatsapp.com")) return "whatsapp";
  if (href.includes("t.me") || href.includes("telegram.")) return "telegram";
  return raw || "custom";
}

function buildFooterSocialItems(socialLinks = []) {
  return (Array.isArray(socialLinks) ? socialLinks : [])
    .filter((s) => String(s?.url || s?.link || "").trim())
    .map((s) => {
      const link = String(s.url || s.link || "").trim();
      const platform = normalizeSocialPlatform(s.platform, link);
      const label =
        String(s.customLabel || "").trim() ||
        String(s.label || "").trim() ||
        String(s.name || "").trim() ||
        (platform && platform !== "custom"
          ? platform === "x"
            ? "X"
            : platform.charAt(0).toUpperCase() + platform.slice(1)
          : "Social");
      return {
        platform,
        icon: s.icon || SOCIAL_PLATFORM_ICONS[platform] || "fa-brands fa-link",
        label,
        link,
      };
    });
}

function patchPlumbingFooterElements(elements = [], bundle = {}, createPayload = null) {
  if (!Array.isArray(elements)) return elements;
  const dynamic = bundle.dynamicItems || {};
  const navSources = bundle.navSources || dynamic.navSources || {};
  const primaryPhone = dynamic.phones?.[0]?.value || dynamic.phone || "";
  const primaryEmail = dynamic.emails?.[0]?.value || dynamic.email || "";
  const addressText = dynamic.address || dynamic.mainLocation || "";
  const { quickLinks, serviceLinks } = buildFooterListsFromBundle(bundle);
  const quickItems = quickLinks.length ? quickLinks : menuToListItems(bundle.menu);
  const serviceItems = serviceLinks.length
    ? serviceLinks
    : buildFooterServiceListItems(navSources, 12);
  const socialItems = buildFooterSocialItems(dynamic.socialLinks);
  const contentOverlay = createPayload?.content || {};
  const projectName = createPayload?.meta?.projectName || "";

  return elements.map((el) => {
    if (!el || typeof el !== "object") return el;
    const id = String(el.id || "");

    if (el.type === "heading" && id.includes("-fp-cta-title")) {
      const text = contentOverlay.ctaTitle || el.content?.text;
      return text ? { ...el, content: { ...(el.content || {}), text } } : el;
    }
    if (el.type === "text" && id.includes("-fp-cta-sub")) {
      const text = contentOverlay.ctaSubtitle || el.content?.text;
      return text ? { ...el, content: { ...(el.content || {}), text } } : el;
    }
    if (el.type === "button" && id.includes("-fp-cta-btn")) {
      return {
        ...el,
        content: {
          ...(el.content || {}),
          text: contentOverlay.ctaButtonText || el.content?.text,
          link: contentOverlay.ctaButtonLink || el.content?.link,
        },
      };
    }
    if (el.type === "heading" && id.includes("-fp-logo-text")) {
      const text = contentOverlay.logoText || projectName || el.content?.text;
      return text ? { ...el, content: { ...(el.content || {}), text } } : el;
    }
    if (el.type === "image" && id.includes("-fp-logo-image") && contentOverlay.logoUrl) {
      return {
        ...el,
        content: {
          ...(el.content || {}),
          imageUrl: contentOverlay.logoUrl,
          imageAlt: contentOverlay.logoAlt || projectName,
        },
      };
    }
    if (el.type === "text" && id.includes("-fp-tagline")) {
      const text = contentOverlay.tagline || el.content?.text;
      return text ? { ...el, content: { ...(el.content || {}), text } } : el;
    }
    if (el.type === "text" && id.includes("-fp-copyright")) {
      const text = contentOverlay.copyrightText || el.content?.text;
      return text ? { ...el, content: { ...(el.content || {}), text } } : el;
    }
    if (el.type === "list" && id.includes("-fp-quick") && quickItems.length) {
      return { ...el, content: { ...(el.content || {}), items: quickItems } };
    }
    if (el.type === "list" && id.includes("-fp-services") && serviceItems.length) {
      return { ...el, content: { ...(el.content || {}), items: serviceItems } };
    }
    if (el.type === "trust-strip" && id.includes("-fp-social") && socialItems.length) {
      return { ...el, content: { ...(el.content || {}), items: socialItems } };
    }
    if (
      (el.type === "text" && id.includes("-fp-phone")) ||
      (el.type === "feature-box" && id.includes("-fp-row-phone"))
    ) {
      return resolveElementContact(
        {
          ...el,
          content: {
            ...(el.content || {}),
            contactKind: "phone",
            contactSource: el.content?.contactSource || DEFAULT_SOURCE,
          },
        },
        bundle.aboutUs
      );
    }
    if (el.type === "feature-box" && id.includes("-fp-row-email")) {
      return resolveElementContact(
        {
          ...el,
          content: {
            ...(el.content || {}),
            contactKind: "email",
            contactSource: el.content?.contactSource || DEFAULT_SOURCE,
          },
        },
        bundle.aboutUs
      );
    }
    if (el.type === "feature-box" && id.includes("-fp-row-address") && addressText) {
      return {
        ...el,
        content: {
          ...(el.content || {}),
          text: addressText,
          subText:
            dynamic.mainLocation && dynamic.mainLocation !== addressText
              ? dynamic.mainLocation
              : el.content?.subText,
        },
      };
    }
    return el;
  });
}

function patchPlumbingElements(elements = [], plumbingNavItems = [], dynamic = {}, createPayload = null) {
  if (!Array.isArray(elements)) return elements;
  const primaryPhone = dynamic.phones?.[0]?.value || dynamic.phone || "";
  const phoneLink = primaryPhone ? telHref(primaryPhone) : "";
  const contentOverlay = createPayload?.content || {};
  const projectName = createPayload?.meta?.projectName || "";

  return elements.map((el) => {
    if (!el || typeof el !== "object") return el;
    if (el.type === "heading" && el.id?.includes("-hp-logo-text")) {
      const text = contentOverlay.logoText || projectName || el.content?.text;
      return text ? { ...el, content: { ...(el.content || {}), text } } : el;
    }
    if (el.type === "image" && el.id?.includes("-hp-logo-image") && contentOverlay.logoUrl) {
      return {
        ...el,
        content: {
          ...(el.content || {}),
          imageUrl: contentOverlay.logoUrl,
          imageAlt: contentOverlay.logoAlt || projectName,
        },
      };
    }
    if (el.type === "nav-menu") {
      return {
        ...el,
        content: {
          ...(el.content || {}),
          items: plumbingNavItems,
          navSources: {
            services: dynamic.navSources?.services || [],
            locations: dynamic.navSources?.locations || [],
          },
        },
      };
    }
    if (el.type === "text" && el.id?.includes("-hp-phone")) {
      return resolveElementContact(
        {
          ...el,
          content: {
            ...(el.content || {}),
            contactKind: "phone",
            contactSource: el.content?.contactSource || DEFAULT_SOURCE,
          },
        },
        dynamic.aboutUs || null
      );
    }
    return el;
  });
}

function sectionElementsFromResolved(section = {}) {
  if (Array.isArray(section.elements) && section.elements.length) {
    return section.elements.map((el) => ({ ...el }));
  }
  const byId =
    section.elementsById && typeof section.elementsById === "object" ? section.elementsById : {};
  const layout = Array.isArray(section.layout) ? section.layout : [];
  if (layout.length) {
    return layout
      .slice()
      .sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0))
      .map((row) => {
        const id = String(row?.elementId || "").trim();
        if (!id || !byId[id]) return null;
        const el = byId[id];
        return {
          id,
          type: el.type,
          content: el.content && typeof el.content === "object" ? { ...el.content } : {},
          style: el.style && typeof el.style === "object" ? { ...el.style } : {},
        };
      })
      .filter(Boolean);
  }
  return Object.entries(byId).map(([id, el]) => ({
    id,
    type: el?.type,
    content: el?.content && typeof el.content === "object" ? { ...el.content } : {},
    style: el?.style && typeof el.style === "object" ? { ...el.style } : {},
  }));
}

function writePatchedElementsToSection(section = {}, patchedElements = []) {
  const elementsById = { ...(section.elementsById || {}) };
  patchedElements.forEach((el) => {
    const id = String(el?.id || "").trim();
    if (!id) return;
    elementsById[id] = {
      type: el.type,
      content: el.content && typeof el.content === "object" ? el.content : {},
      style: el.style && typeof el.style === "object" ? el.style : {},
    };
  });
  return {
    ...section,
    elements: patchedElements,
    elementsById,
  };
}

function applyDynamicsToResolvedSection(section = {}, bundle = {}, createPayload = null) {
  const type = String(section?.type || "").toLowerCase();
  if (type !== "navbar" && type !== "header" && type !== "footer") {
    return section;
  }

  const variant = String(section?.styles?.variant || section?.variant || "").toLowerCase();
  const isPlumbing =
    variant.includes("plumbing") || type === "navbar" || type === "header" || type === "footer";
  const content = {
    ...(section.data || section.content || {}),
    ...(createPayload?.content || {}),
  };
  const dynamic = bundle.dynamicItems || {};

  if (isPlumbing) {
    const plumbingNavItems =
      Array.isArray(bundle.plumbingNavItems) && bundle.plumbingNavItems.length
        ? bundle.plumbingNavItems
        : buildPlumbingNavItems([], bundle.navSources || {});
    content.navSources = {
      services: bundle.navSources?.services || [],
      locations: bundle.navSources?.locations || [],
      servicesListing: bundle.navSources?.servicesListing || null,
      areasListing: bundle.navSources?.areasListing || null,
    };
    content.menuItems = plumbingNavItems;
    content.navItems = plumbingNavItems;
    const aboutUs = bundle.aboutUs || null;
    if (!content.phoneSource) content.phoneSource = DEFAULT_SOURCE;
    if (!content.emailSource && type === "footer") content.emailSource = DEFAULT_SOURCE;

    if (type === "navbar" || type === "header") {
      const resolved = applySectionContactContent(content, type, aboutUs);
      Object.assign(content, resolved);
    }
    if (type === "footer") {
      const footerLists = buildFooterListsFromBundle(bundle);
      const footerLayout = footerLists.footerLayout || normalizeFooterLayout(bundle.footerLayout);
      content.footerLayout = footerLayout;
      content.showCtaBanner = footerLayout.showCtaBanner !== false;
      if (footerLayout.cta?.title) content.ctaTitle = footerLayout.cta.title;
      if (footerLayout.cta?.subtitle) content.ctaSubtitle = footerLayout.cta.subtitle;
      if (footerLayout.cta?.buttonText) content.ctaButtonText = footerLayout.cta.buttonText;
      if (footerLayout.cta?.buttonLink) content.ctaButtonLink = footerLayout.cta.buttonLink;
      const layoutTagline = String(footerLayout.about?.tagline || "").trim();
      const marketingTagline = String(createPayload?.content?.tagline || "").trim();
      if (layoutTagline) {
        content.tagline = layoutTagline;
      } else if (marketingTagline) {
        content.tagline = marketingTagline;
      }
      content.footerAbout = footerLayout.about;
      content.footerContact = footerLayout.contact;
      content.footerColumns = footerLayout.columns;
      content.quickLinks = footerLists.quickLinks;
      content.serviceLinks = footerLists.serviceLinks;
      content.phoneSub = footerLayout.contact?.phoneSub || content.phoneSub;
      content.emailSub = footerLayout.contact?.emailSub || content.emailSub;
      content.hoursText = footerLayout.contact?.hoursText || content.hoursText;
      content.hoursSub = footerLayout.contact?.hoursSub || content.hoursSub;
      // Live AboutUs availability overrides footer free-text when structured hours exist
      if (aboutUs?.businessHours) {
        try {
          const {
            formatBusinessHoursText,
            formatBusinessHoursSub,
          } = require("./businessHours");
          const liveHours = formatBusinessHoursText(aboutUs.businessHours);
          if (liveHours) content.hoursText = liveHours;
          const liveSub = formatBusinessHoursSub(aboutUs.businessHours);
          if (liveSub) content.hoursSub = liveSub;
        } catch {
          /* keep layout hours */
        }
      }
      const resolved = applySectionContactContent(content, type, aboutUs);
      Object.assign(content, resolved);
      content.addressText = dynamic.address || content.addressText;
      if (createPayload?.content?.copyrightText) {
        content.copyrightText = createPayload.content.copyrightText;
      }
      if (createPayload?.content?.ctaTitle) content.ctaTitle = createPayload.content.ctaTitle;
      if (createPayload?.content?.ctaSubtitle) content.ctaSubtitle = createPayload.content.ctaSubtitle;
      if (createPayload?.content?.ctaButtonText) {
        content.ctaButtonText = createPayload.content.ctaButtonText;
      }
      if (createPayload?.content?.ctaButtonLink) {
        content.ctaButtonLink = createPayload.content.ctaButtonLink;
      }
      if (createPayload?.content?.logoText) content.logoText = createPayload.content.logoText;
      if (createPayload?.content?.logoUrl) {
        content.logoUrl = createPayload.content.logoUrl;
        content.logoMode = "image";
      }
      if (Array.isArray(createPayload?.content?.socialItems) && createPayload.content.socialItems.length) {
        content.socialItems = createPayload.content.socialItems;
      }
    }
    if ((type === "navbar" || type === "header") && createPayload?.content) {
      if (createPayload.content.logoText) content.logoText = createPayload.content.logoText;
      if (createPayload.content.logoUrl) {
        content.logoUrl = createPayload.content.logoUrl;
        content.logoMode = "image";
      }
    }

    let workingSection = {
      ...section,
      id: String(section?.id || section?.data?.id || `${type}-1`),
      data: content,
      content,
    };

    if (type === "navbar" || type === "header") {
      workingSection = ensurePlumbingHeaderElements(
        workingSection,
        plumbingNavItems,
        content.navSources
      );
    }
    if (type === "footer") {
      workingSection = ensurePlumbingFooterElements(workingSection, bundle);
    }

    const sourceElements = sectionElementsFromResolved(workingSection);

    const patchedElements =
      type === "footer"
        ? patchPlumbingFooterElements(sourceElements, bundle, createPayload)
        : patchPlumbingElements(
            sourceElements,
            plumbingNavItems,
            {
              ...dynamic,
              navSources: content.navSources,
              aboutUs,
            },
            createPayload
          );

    const patched = writePatchedElementsToSection(workingSection, patchedElements);
    return {
      ...patched,
      data: content,
      content,
    };
  }

  return {
    ...section,
    data: {
      ...content,
      headerFooterBundle: {
        menu: bundle.menu,
        contactDetails: bundle.contactDetails,
        dynamicItems: bundle.dynamicItems,
      },
    },
    content,
  };
}

const DEFAULT_SHELL_CONTACT = {
  phone: { enabled: true, number: "", label: "Phone", style: {} },
  email: { enabled: true, address: "", label: "Email", style: {} },
  address: { enabled: false, text: "", style: {} },
};

const DEFAULT_SHELL_STYLE = {
  header: {
    backgroundColor: "#ffffff",
    color: "#000000",
    padding: "16px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  footer: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    padding: "48px 0",
    borderTop: "1px solid #374151",
  },
};

/**
 * Single source of truth for Admin "create default header/footer" and onboarding flows.
 * @param {string} projectId
 * @param {0|1} type 0 = header, 1 = footer
 */
async function prepareDefaultHeaderFooterPayload(projectId, type = 0) {
  const catalogNav = await buildNavSources(projectId, { catalogOnly: true });
  const baseSettings = {
    sticky: false,
    transparent: false,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true,
    custom: {
      useAboutUsContact: true,
      phoneDisplayMode: "primary",
      emailDisplayMode: "primary",
    },
  };

  if (Number(type) === 1) {
    let siteMenu = [];
    try {
      siteMenu = await buildDefaultSiteMenu(projectId, { catalogOnly: true });
    } catch (err) {
      console.warn("[prepareDefaultHeaderFooterPayload] buildDefaultSiteMenu:", err.message);
    }

    const footerLayout =
      siteMenu.length > 0
        ? buildFooterLayoutFromDefaultMenu(siteMenu, catalogNav.services || [])
        : buildEmptyDefaultFooterLayout();

    if (!(catalogNav.services || []).length && footerLayout.services) {
      footerLayout.services.children = [];
    }

    const project = await UserProject.findById(projectId)
      .select(
        "projectName mainCategory serviceType welcomeLine projectSlogan description promiseLine callToAction cta"
      )
      .lean();
    const footerMarketing = pickFooterMarketingFromProject(project || {});
    const resolvedLayout = resolveFooterLayoutForEditor(footerLayout, footerMarketing);

    const settings = mergeFooterLayoutIntoSettings(baseSettings, resolvedLayout);
    const menu = sortMenuByOrder(
      mergeMenuWithNavSources(syncLegacyMenuFromFooterLayout(resolvedLayout), catalogNav)
    );

    return {
      menu,
      settings,
      contactDetails: { ...DEFAULT_SHELL_CONTACT },
      style: { ...DEFAULT_SHELL_STYLE.footer },
      footerLayout: resolvedLayout,
      footerMarketing,
    };
  }

  let siteMenu = [];
  try {
    siteMenu = await buildDefaultSiteMenu(projectId, { catalogOnly: true });
  } catch (err) {
    console.warn("[prepareDefaultHeaderFooterPayload] header menu:", err.message);
  }

  const fallbackBaseMenu = [
    {
      id: "home",
      name: "Home",
      url: "/",
      icon: "",
      target: "_self",
      order: 0,
      children: [],
      style: {},
    },
    {
      id: "about",
      name: "About",
      url: "/about",
      icon: "",
      target: "_self",
      order: 1,
      children: [],
      style: {},
    },
    ...(catalogNav.services?.length || catalogNav.servicesListing?.pageId
      ? [{
          id: "services",
          name: "Services",
          url: catalogNav.servicesListing?.link || "/services",
          icon: "",
          target: "_self",
          order: 2,
          children: catalogRowsToFooterServiceMenuItems(catalogNav.services || []),
          style: {},
        }]
      : []),
    ...(catalogNav.locations?.length || catalogNav.areasListing?.pageId
      ? [{
          id: "areas",
          name: "Areas",
          url: catalogNav.areasListing?.link || "/areas",
          icon: "",
          target: "_self",
          order: 3,
          children: [],
          style: {},
        }]
      : []),
    {
      id: "blog",
      name: "Blog",
      url: "/blogs",
      icon: "",
      target: "_self",
      order: 4,
      children: [],
      style: {},
    },
    {
      id: "contact",
      name: "Contact",
      url: "/contact",
      icon: "",
      target: "_self",
      order: 5,
      children: [],
      style: {},
    },
  ];
  const menu = siteMenu.length
    ? sortMenuByOrder(mergeMenuWithNavSources(siteMenu, catalogNav))
    : sortMenuByOrder(mergeMenuWithNavSources(fallbackBaseMenu, catalogNav));

  return {
    menu,
    settings: {
      ...baseSettings,
      sticky: true,
      mobileMenuEnabled: true,
    },
    contactDetails: { ...DEFAULT_SHELL_CONTACT },
    style: { ...DEFAULT_SHELL_STYLE.header },
    footerLayout: null,
  };
}

async function buildHeaderFooterBundle(projectId, doc = null, options = {}) {
  const aboutUs = await fetchAboutUsForProject(projectId);
  const contactSettings = normalizeContactSettings(doc?.settings || {});
  const navOptions = {
    contextLocationId: options.contextLocationId || null,
    catalogOnly: Boolean(options.catalogOnly),
  };
  const navSources = await buildNavSources(projectId, navOptions);

  const storedMenu = sortMenuByOrder(
    Array.isArray(doc?.menu) && doc.menu.length ? doc.menu : []
  );
  const menu = storedMenu.length
    ? mergeMenuWithNavSources(storedMenu, navSources)
    : await buildDefaultSiteMenu(projectId, navOptions);

  const contactDetails = resolveContactDetailsForDisplay(
    doc?.contactDetails || {},
    aboutUs,
    contactSettings
  );

  const dynamicItems = {
    ...buildAboutUsDynamicItems(aboutUs, contactSettings),
    navSources: {
      services: navSources.services,
      locations: navSources.locations,
      servicesListing: navSources.servicesListing,
      areasListing: navSources.areasListing,
    },
    contactSettings,
  };

  const siteMenuToPlumbing = (items = []) =>
    items.map((m) =>
      plumbingLinkItem({
        label: m.name,
        link: m.url,
        pageId: m.pageId,
        serviceId: m.serviceId,
        linkPerArea: m.linkPerArea,
        children: (m.children || []).length ? siteMenuToPlumbing(m.children) : undefined,
      })
    );

  const plumbingNavItems = buildPlumbingNavItems(siteMenuToPlumbing(menu), navSources);
  const footerLayout = Number(doc?.type) === 1 ? getFooterLayoutFromDoc(doc) : null;

  return {
    menu,
    contactDetails,
    dynamicItems,
    navSources,
    plumbingNavItems,
    footerLayout,
    aboutUs: aboutUs || null,
    contactSettings,
  };
}

async function enrichHeaderFooterDocument(doc, projectId) {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const bundle = await buildHeaderFooterBundle(projectId, plain, { catalogOnly: true });
  const isFooter = Number(plain.type) === 1;

  let footerLayout = null;
  let footerMarketing = null;
  if (isFooter) {
    const project = await UserProject.findById(projectId)
      .select(
        "projectName mainCategory serviceType welcomeLine projectSlogan description promiseLine callToAction cta"
      )
      .lean();
    footerMarketing = pickFooterMarketingFromProject(project || {});
    const rawLayout = applyPageUrlsToFooterLayout(
      bundle.footerLayout || getFooterLayoutFromDoc(plain),
      buildPagesByIdMap(bundle.navSources?.pages || [])
    );

    let liveMarketing = { ...footerMarketing };
    try {
      const {
        loadHeaderFooterCreateContext,
        buildFooterContentPayload,
      } = require("./headerFooterSectionBuilder");
      const ctx = await loadHeaderFooterCreateContext(projectId);
      const live = buildFooterContentPayload(ctx);
      liveMarketing = {
        tagline: String(live.tagline || footerMarketing.tagline || "").trim(),
        ctaTitle: String(live.ctaTitle || footerMarketing.ctaTitle || "").trim(),
        ctaSubtitle: String(live.ctaSubtitle || footerMarketing.ctaSubtitle || "").trim(),
        ctaButtonText: String(live.ctaButtonText || footerMarketing.ctaButtonText || "Book Now").trim(),
        ctaButtonLink: String(live.ctaButtonLink || footerMarketing.ctaButtonLink || "/contact").trim(),
      };
    } catch (liveErr) {
      console.warn("[enrichHeaderFooterDocument] live footer preview:", liveErr.message);
    }

    footerLayout = resolveFooterLayoutForEditor(rawLayout, liveMarketing);
    footerMarketing = liveMarketing;
  }

  const custom = {
    ...((plain.settings && plain.settings.custom) || {}),
    ...bundle.contactSettings,
  };
  if (isFooter && footerLayout) {
    custom.footer = footerLayout;
  }

  return {
    ...plain,
    menu: bundle.menu,
    contactDetails: bundle.contactDetails,
    dynamicItems: bundle.dynamicItems,
    footerLayout: footerLayout || undefined,
    footerMarketing: footerMarketing || undefined,
    settings: {
      ...(plain.settings || {}),
      custom,
    },
  };
}

function resolveNavContextLocationId(pageMeta = {}) {
  const loc = pageMeta?.locationId;
  return loc != null && String(loc).trim() !== "" ? String(loc).trim() : null;
}

async function applyHeaderFooterDynamicsToSections(sections = [], projectId, options = {}) {
  if (!projectId || !Array.isArray(sections) || !sections.length) return sections;

  const hasShell = sections.some((s) => {
    const t = String(s?.type || "").toLowerCase();
    return t === "navbar" || t === "header" || t === "footer";
  });
  if (!hasShell) return sections;

  const contextLocationId =
    options.contextLocationId != null && String(options.contextLocationId).trim() !== ""
      ? String(options.contextLocationId).trim()
      : resolveNavContextLocationId(options.pageMeta || {});

  const bundleOptions = { contextLocationId, catalogOnly: false };

  const [activeHeader, activeFooter] = await Promise.all([
    SiteHeaderFooter.findOne({ projectId, type: 0, status: "active" }).lean(),
    SiteHeaderFooter.findOne({ projectId, type: 1, status: "active" }).lean(),
  ]);

  const headerBundle = await buildHeaderFooterBundle(projectId, activeHeader, bundleOptions);
  const footerBundle = await buildHeaderFooterBundle(projectId, activeFooter, bundleOptions);

  let headerCreate = null;
  let footerCreate = null;
  try {
    const { buildHeaderFooterSectionContent } = require("./headerFooterSectionBuilder");
    [headerCreate, footerCreate] = await Promise.all([
      buildHeaderFooterSectionContent("header", { projectId }),
      buildHeaderFooterSectionContent("footer", { projectId }),
    ]);
  } catch (err) {
    console.warn("[headerFooter] create payload skipped:", err.message);
  }

  return sections.map((section) => {
    const type = String(section?.type || "").toLowerCase();
    if (type === "footer") {
      return applyDynamicsToResolvedSection(section, footerBundle, footerCreate);
    }
    if (type === "navbar" || type === "header") {
      return applyDynamicsToResolvedSection(section, headerBundle, headerCreate);
    }
    // Expose WebsitePage service/location nav rows on content sections so
    // services grids can resolve per-service slugs (business + bulk).
    if (
      type === "services" ||
      type === "servicesgrid" ||
      type === "serviceslistgrid" ||
      type === "relatedservices" ||
      type === "locationservices" ||
      type === "servicedetailservices"
    ) {
      const data =
        section?.data && typeof section.data === "object" && !Array.isArray(section.data)
          ? { ...section.data }
          : {};
      data.navSources = {
        services: headerBundle?.navSources?.services || [],
        locations: headerBundle?.navSources?.locations || [],
        servicesListing: headerBundle?.navSources?.servicesListing || null,
        areasListing: headerBundle?.navSources?.areasListing || null,
      };
      return { ...section, data };
    }
    return section;
  });
}

/**
 * Rebuild header (+ footer quick links) from current WebsitePage rows.
 * Use after wizard page upsert so About / Services / Areas / Blog / Contact
 * appear in the menu like the SiteNext demo chrome.
 */
async function rebuildProjectHeaderFooterMenus(projectId, options = {}) {
  if (!projectId) return { updated: 0 };

  const catalogNav = await buildNavSources(projectId, { catalogOnly: true });
  let siteMenu = [];
  try {
    siteMenu = await buildDefaultSiteMenu(projectId, { catalogOnly: true });
  } catch (err) {
    console.warn("[rebuildProjectHeaderFooterMenus] buildDefaultSiteMenu:", err.message);
  }
  const menu = sortMenuByOrder(mergeMenuWithNavSources(siteMenu, catalogNav));
  let updated = 0;

  const header = await SiteHeaderFooter.findOne({
    projectId,
    type: 0,
    status: "active",
  });
  if (header) {
    header.menu = menu;
    header.markModified("menu");
    await header.save();
    updated += 1;
  }

  const footer = await SiteHeaderFooter.findOne({
    projectId,
    type: 1,
    status: "active",
  });
  if (footer) {
    const footerLayout =
      menu.length > 0
        ? buildFooterLayoutFromDefaultMenu(menu, catalogNav.services || [])
        : buildEmptyDefaultFooterLayout();
    if (!(catalogNav.services || []).length && footerLayout.services) {
      footerLayout.services.children = [];
    }
    const project = await UserProject.findById(projectId)
      .select(
        "projectName mainCategory serviceType welcomeLine projectSlogan description promiseLine callToAction cta"
      )
      .lean();
    const footerMarketing = pickFooterMarketingFromProject(project || {});
    const resolvedLayout = resolveFooterLayoutForEditor(footerLayout, footerMarketing);
    const nextSettings = mergeFooterLayoutIntoSettings(footer.settings || {}, resolvedLayout);
    footer.menu = sortMenuByOrder(
      mergeMenuWithNavSources(syncLegacyMenuFromFooterLayout(resolvedLayout), catalogNav)
    );
    footer.settings = nextSettings;
    footer.markModified("menu");
    footer.markModified("settings");
    await footer.save();
    updated += 1;
  }

  let syncResult = null;
  if (options.syncSections !== false) {
    try {
      const { syncHeaderFooterSectionsForProject } = require("./headerFooterSectionSync");
      syncResult = await syncHeaderFooterSectionsForProject(projectId, {
        skipFooterAi: true,
      });
    } catch (err) {
      console.warn("[rebuildProjectHeaderFooterMenus] section sync:", err.message);
    }
  }

  return {
    updated,
    menuCount: menu.length,
    menu,
    sync: syncResult,
  };
}

module.exports = {
  normalizeContactSettings,
  fetchAboutUsForProject,
  buildAboutUsDynamicItems,
  resolveContactDetailsForDisplay,
  buildNavSources,
  buildServiceNavRows,
  buildContextualAreasForHeader, // Smart area selection for header (children → siblings → parent)
  resolveNavContextLocationId,
  buildDefaultSiteMenu,
  sortMenuByOrder,
  mergeMenuWithNavSources,
  buildPlumbingNavItems,
  buildHeaderFooterBundle,
  enrichHeaderFooterDocument,
  applyHeaderFooterDynamicsToSections,
  applyContactDynamicsToAllSections,
  buildFooterSocialItems,
  buildFooterListsFromBundle,
  buildFooterQuickLinksFromMenu,
  buildFooterServiceLinksFromMenu,
  getFooterLayoutFromDoc,
  normalizeFooterLayout,
  syncLegacyMenuFromFooterLayout,
  prepareDefaultHeaderFooterPayload,
  rebuildProjectHeaderFooterMenus,
  DEFAULT_SHELL_CONTACT,
  DEFAULT_SHELL_STYLE,
  SOCIAL_PLATFORM_ICONS,
};
