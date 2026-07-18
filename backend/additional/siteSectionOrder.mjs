/**
 * Canonical section order — browser/Vite ESM entry (@shared/siteSectionOrder).
 * Node backend uses siteSectionOrder.cjs (keep in sync with this file).
 *
 * Modern default structure (GenieBuild may reorder later):
 * Hero first → body sections → CTA → Reviews → FAQ last.
 */

export const CANONICAL_HOME_SECTION_ORDER = Object.freeze([
  "hero",
  "about",
  "features",
  "servicesgrid",
  "services",
  "whychooseus",
  "why-choose-us",
  "process",
  "areas",
  "guarantee",
  "cta",
  "testimonials",
  "faq",
]);

/** All Areas listing (`/areas`) */
export const CANONICAL_AREAS_SECTION_ORDER = Object.freeze([
  "areashero",
  "sublocations",
  "locationmap",
  "areastestimonials",
  "areasfaq",
]);

/** Services listing (`/services`) */
export const CANONICAL_SERVICES_SECTION_ORDER = Object.freeze([
  "serviceslisthero",
  "serviceslistgrid",
  "serviceslistwhychoose",
  "serviceslistprocess",
  "serviceslistguarantee",
  "serviceslistareas",
  "serviceslistcta",
  "serviceslistfaq",
]);

/** About Us page */
export const CANONICAL_ABOUT_SECTION_ORDER = Object.freeze([
  "abouthero",
  "aboutwhychoose",
  "missionvision",
  "corevalues",
  "usp",
  "aboutcta",
  "aboutfaq",
]);

/** Contact page (/contact) */
export const CANONICAL_CONTACT_SECTION_ORDER = Object.freeze([
  "contacthero",
  "contactinfo",
  "contactform",
  "contactcta",
  "contactfaq",
]);

/** Legal pages (/privacy, /terms, /disclaimer) */
export const CANONICAL_LEGAL_SECTION_ORDER = Object.freeze(["legalhero", "legalcontent"]);

/** Blog index page */
export const CANONICAL_BLOG_SECTION_ORDER = Object.freeze(["blogshero", "blogssearch", "blogslist"]);

/** Blog detail template */
export const CANONICAL_BLOGDETAIL_SECTION_ORDER = Object.freeze([
  "blogarticlehero",
  "blogcontent",
  "blogauthor",
  "blogrelated",
  "blogcomments",
]);

/**
 * Service detail page — GenieBuild ids first (modern order), then legacy aliases
 * at the same relative slots via alias map in sort (see SERVICE_DETAIL_ORDER_ALIASES).
 */
export const CANONICAL_SERVICE_SECTION_ORDER = Object.freeze([
  "servicedetailhero",
  "servicedetailabout",
  "servicedetailservices",
  "servicedetailprocess",
  "servicedetailwhychoose",
  "servicedetailguarantee",
  "relatedservices",
  "servicedetailcta",
  "servicedetailtestimonials",
  "servicedetailfaq",
  // Legacy Multicolor / older wizard ids (same visual slots via alias index)
  "servicehero",
  "aboutservice",
  "servicecopy",
  "servicegroups",
  "subservices",
  "servicewhychooseus",
  "serviceprocess",
  "serviceguarantee",
  "promiseline",
  "testimonials",
  "faq",
]);

export const MINIMAL_SERVICE_SECTION_FALLBACK = Object.freeze([
  "servicedetailhero",
  "servicedetailabout",
  "servicedetailfaq",
]);

export const SHELL_SECTION_TYPES = new Set(["header", "footer", "navbar"]);

export const SERVICE_TEMPLATE_EXCLUSIVE_SECTIONS = new Set(
  CANONICAL_SERVICE_SECTION_ORDER.filter(
    (id) => id !== "faq" && id !== "servicedetailfaq" && id !== "testimonials"
  )
);

/**
 * Pair keys written into service_sections so GenieBuild + Multicolor stay in sync.
 */
export const SERVICE_DETAIL_SECTION_ALIASES = Object.freeze({
  servicehero: "servicedetailhero",
  aboutservice: "servicedetailabout",
  subservices: "servicedetailservices",
  serviceprocess: "servicedetailprocess",
  servicewhychooseus: "servicedetailwhychoose",
  serviceguarantee: "servicedetailguarantee",
  faq: "servicedetailfaq",
  testimonials: "servicedetailtestimonials",
  servicedetailhero: "servicehero",
  servicedetailabout: "aboutservice",
  servicedetailservices: "subservices",
  servicedetailprocess: "serviceprocess",
  servicedetailwhychoose: "servicewhychooseus",
  servicedetailguarantee: "serviceguarantee",
  servicedetailfaq: "faq",
  servicedetailtestimonials: "testimonials",
});

/** Map legacy service ids onto GenieBuild order slots for sorting. */
const SERVICE_SORT_SLOT_ALIASES = Object.freeze({
  servicehero: "servicedetailhero",
  aboutservice: "servicedetailabout",
  servicecopy: "servicedetailabout",
  servicegroups: "servicedetailservices",
  subservices: "servicedetailservices",
  serviceprocess: "servicedetailprocess",
  servicewhychooseus: "servicedetailwhychoose",
  serviceguarantee: "servicedetailguarantee",
  promiseline: "servicedetailguarantee",
  testimonials: "servicedetailtestimonials",
  faq: "servicedetailfaq",
});

export function canonicalSectionId(raw = "") {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "whychooseus") return "why-choose-us";
  return value;
}

export function serviceDetailBundleTwinId(sectionId = "") {
  const id = canonicalSectionId(sectionId);
  return SERVICE_DETAIL_SECTION_ALIASES[id] || null;
}

function buildOrderIndex(orderList) {
  const map = new Map();
  orderList.forEach((id, idx) => {
    map.set(canonicalSectionId(id), idx);
  });
  return map;
}

/**
 * Resolve which canonical list to use for a page key / WebsitePage meta.
 */
export function resolveCanonicalPageKey(pageKeyOrMeta = "") {
  if (pageKeyOrMeta && typeof pageKeyOrMeta === "object") {
    const pageMeta = pageKeyOrMeta;
    const name = String(pageMeta?.name || "").toLowerCase().trim().replace(/\s+/g, "-");
    const pageType = String(pageMeta?.pageType || "").toLowerCase().trim();
    const slug = String(pageMeta?.slug || "")
      .toLowerCase()
      .trim()
      .replace(/^\/+|\/+$/g, "");

    if (pageType === "service" || (name === "service" && pageMeta?.serviceId)) return "service";
    if (name === "service" && !pageMeta?.serviceId) return "service";
    if (
      name === "services" ||
      slug === "services" ||
      pageType === "services" ||
      pageType === "serviceslist"
    ) {
      return "services";
    }
    if (
      name === "areas" ||
      name === "allareas" ||
      name === "all-areas" ||
      slug === "areas" ||
      pageType === "areas" ||
      pageType === "allareas"
    ) {
      return "areas";
    }
    if (name === "about" || name === "about-us" || name === "aboutus" || slug === "about") {
      return "about";
    }
    if (name === "contact" || name === "contact-us" || slug === "contact") return "contact";
    if (name === "blog" || name === "blogs" || slug === "blog" || slug === "blogs") return "blog";
    if (name === "blogdetail" || name.startsWith("blog-") || slug.startsWith("blog/")) {
      return "blogdetail";
    }
    if (
      name === "legal" ||
      name.includes("privacy") ||
      name.includes("terms") ||
      name.includes("disclaimer") ||
      slug.includes("privacy") ||
      slug.includes("terms") ||
      slug.includes("disclaimer")
    ) {
      return "legal";
    }
    if (
      pageType === "home" ||
      pageType === "homepage" ||
      name === "home" ||
      name === "homepage" ||
      !slug ||
      slug === "home"
    ) {
      return "home";
    }
    // Location landings reuse homepage section modules
    if (pageMeta?.locationId && pageType !== "service") return "home";
    return "home";
  }

  const key = String(pageKeyOrMeta || "").toLowerCase().trim();
  if (
    key === "service" ||
    key === "services" ||
    key === "areas" ||
    key === "allareas" ||
    key === "about" ||
    key === "contact" ||
    key === "legal" ||
    key === "blog" ||
    key === "blogdetail" ||
    key === "home" ||
    key === "homepage"
  ) {
    return key === "allareas" ? "areas" : key === "homepage" ? "home" : key;
  }
  return "home";
}

export function getCanonicalOrderList(pageKey = "home") {
  const key = resolveCanonicalPageKey(pageKey);
  switch (key) {
    case "service":
      return CANONICAL_SERVICE_SECTION_ORDER;
    case "services":
      return CANONICAL_SERVICES_SECTION_ORDER;
    case "areas":
      return CANONICAL_AREAS_SECTION_ORDER;
    case "about":
      return CANONICAL_ABOUT_SECTION_ORDER;
    case "contact":
      return CANONICAL_CONTACT_SECTION_ORDER;
    case "legal":
      return CANONICAL_LEGAL_SECTION_ORDER;
    case "blog":
      return CANONICAL_BLOG_SECTION_ORDER;
    case "blogdetail":
      return CANONICAL_BLOGDETAIL_SECTION_ORDER;
    case "home":
    default:
      return CANONICAL_HOME_SECTION_ORDER;
  }
}

function orderIndexForSection(pageKey, sectionId) {
  const key = resolveCanonicalPageKey(pageKey);
  const id = canonicalSectionId(sectionId);
  const order = getCanonicalOrderList(key);
  const index = buildOrderIndex(order);
  if (key === "service") {
    const slot = SERVICE_SORT_SLOT_ALIASES[id] || id;
    if (index.has(slot)) return index.get(slot);
  }
  return index.get(id) ?? null;
}

export function sortSectionIdsByCanonicalOrder(pageKey, ids = []) {
  return [...ids]
    .map((id, origIdx) => ({ id, origIdx }))
    .sort((a, b) => {
      const ia = orderIndexForSection(pageKey, a.id);
      const ib = orderIndexForSection(pageKey, b.id);
      const ra = ia == null ? 1000 + a.origIdx : ia;
      const rb = ib == null ? 1000 + b.origIdx : ib;
      if (ra !== rb) return ra - rb;
      return a.origIdx - b.origIdx;
    })
    .map((row) => row.id);
}

export function sortSectionObjectsByCanonicalOrder(pageKey, items = [], getId) {
  const getter =
    typeof getId === "function"
      ? getId
      : (item) => item?.id || item?.sectionData?.type || item?.type || "";
  return [...items]
    .map((item, origIdx) => ({ item, origIdx }))
    .sort((a, b) => {
      const ia = orderIndexForSection(pageKey, getter(a.item));
      const ib = orderIndexForSection(pageKey, getter(b.item));
      const ra = ia == null ? 1000 + a.origIdx : ia;
      const rb = ib == null ? 1000 + b.origIdx : ib;
      if (ra !== rb) return ra - rb;
      return a.origIdx - b.origIdx;
    })
    .map((row) => row.item);
}

/**
 * Re-order content sections while keeping header/navbar first and footer last.
 */
export function applyCanonicalSectionOrderToPageSections(pageKeyOrMeta, sections = []) {
  const list = Array.isArray(sections) ? sections : [];
  if (!list.length) return list;
  const pageKey = resolveCanonicalPageKey(pageKeyOrMeta);
  const shellTypes = new Set(["header", "navbar", "footer"]);
  const headerLike = list.filter((s) =>
    ["header", "navbar"].includes(String(s?.type || s?.sectionData?.type || "").toLowerCase())
  );
  const footerLike = list.filter(
    (s) => String(s?.type || s?.sectionData?.type || "").toLowerCase() === "footer"
  );
  const middle = list.filter((s) => {
    const t = String(s?.type || s?.sectionData?.type || "").toLowerCase();
    return !shellTypes.has(t);
  });
  const orderedMiddle = sortSectionObjectsByCanonicalOrder(
    pageKey,
    middle,
    (s) => String(s?.type || s?.sectionData?.type || s?.id || "")
  );
  return [...headerLike, ...orderedMiddle, ...footerLike];
}

export function isServiceTemplateExclusiveSection(sectionId = "") {
  return SERVICE_TEMPLATE_EXCLUSIVE_SECTIONS.has(canonicalSectionId(sectionId));
}

export function getPageSectionsFromDesign(page = {}) {
  if (Array.isArray(page?.sections)) return page.sections;
  if (Array.isArray(page?.componentIds)) return page.componentIds;
  return [];
}

export function extractSectionTypesFromDesignPage(page = {}) {
  const types = [];
  const seen = new Set();
  for (const comp of getPageSectionsFromDesign(page)) {
    const type = canonicalSectionId(comp?.sectionData?.type || "");
    if (!type || SHELL_SECTION_TYPES.has(type) || seen.has(type)) continue;
    seen.add(type);
    types.push(type);
  }
  return types;
}

export function findServiceTemplateWebsitePage(websitePages = []) {
  return (
    (websitePages || []).find((p) => {
      const name = String(p?.name || "").toLowerCase().trim();
      const hasServiceId = p?.serviceId != null && String(p.serviceId).trim() !== "";
      return name === "service" && !hasServiceId;
    }) || null
  );
}

export function findServiceTemplateDesignPage(designData = {}, websitePages = []) {
  const templateWp = findServiceTemplateWebsitePage(websitePages);
  if (templateWp?._id) {
    const templateId = String(templateWp._id);
    const byId = (designData?.pages || []).find((p) => {
      const pid = String(p?.pageId?._id || p?.pageId || "");
      return pid === templateId;
    });
    if (byId && extractSectionTypesFromDesignPage(byId).length) return byId;
  }

  for (const page of designData?.pages || []) {
    const pid = String(page?.pageId?._id || page?.pageId || "");
    if (!pid) continue;
    const wp = (websitePages || []).find((w) => String(w._id) === pid);
    if (!wp) continue;
    const name = String(wp?.name || "").toLowerCase().trim();
    const hasServiceId = wp?.serviceId != null && String(wp.serviceId).trim() !== "";
    if (name === "service" && !hasServiceId) {
      if (extractSectionTypesFromDesignPage(page).length) return page;
    }
  }

  let best = null;
  let bestCount = 0;
  for (const page of designData?.pages || []) {
    const pid = String(page?.pageId?._id || page?.pageId || "");
    const wp = (websitePages || []).find((w) => String(w._id) === pid);
    if (wp?.serviceId != null && String(wp.serviceId).trim() !== "") continue;
    const types = extractSectionTypesFromDesignPage(page).filter((t) => {
      const id = String(t || "").toLowerCase();
      return (
        id.startsWith("servicedetail") ||
        id === "relatedservices" ||
        id === "aboutservice" ||
        id === "servicehero"
      );
    });
    if (types.length > bestCount) {
      best = page;
      bestCount = types.length;
    }
  }
  return bestCount > 0 ? best : null;
}

export function getServiceTemplateSectionTypes(designData = {}, websitePages = []) {
  const templatePage = findServiceTemplateDesignPage(designData, websitePages);
  const fromTemplate = extractSectionTypesFromDesignPage(templatePage);
  if (fromTemplate.length) {
    return sortSectionIdsByCanonicalOrder("service", fromTemplate);
  }
  return [...MINIMAL_SERVICE_SECTION_FALLBACK];
}

export function buildServiceRenderSections({
  designData = {},
  websitePages = [],
  headerComp = null,
  footerComp = null,
  serviceId,
  locationId,
  existingSections = [],
  makeBundleSection,
}) {
  const selectedTypes = getServiceTemplateSectionTypes(designData, websitePages);
  const findExistingByType = (type) =>
    (existingSections || []).find(
      (c) => canonicalSectionId(c?.sectionData?.type || "") === canonicalSectionId(type)
    );

  const makeDefault =
    typeof makeBundleSection === "function"
      ? makeBundleSection
      : (type, variantKey) => ({
          variant_uniqueId: variantKey || `${type}Default`,
          componentId: null,
          sectionData: {
            type,
            content: {},
            contentRef: {
              scope: "service_bundle",
              sectionId: type,
              serviceId: serviceId != null ? String(serviceId) : null,
              locationId: locationId != null ? String(locationId) : null,
            },
            styles: {},
          },
        });

  const contentSections = selectedTypes.map((type) => {
    const existing = findExistingByType(type);
    if (existing) return existing;
    return makeDefault(type, `${type}Default`);
  });

  return [
    ...(headerComp ? [headerComp] : []),
    ...contentSections,
    ...(footerComp ? [footerComp] : []),
  ];
}

export function reorderHomeSectionsInConfig(sections = []) {
  return sortSectionObjectsByCanonicalOrder("home", sections, (s) => s.id);
}

