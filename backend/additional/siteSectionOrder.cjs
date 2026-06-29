/**
 * Canonical section order — Node/CommonJS entry (require).
 * Keep in sync with siteSectionOrder.mjs (browser/Vite).
 */

const CANONICAL_HOME_SECTION_ORDER = Object.freeze([
  "hero",
  "about",
  "features",
  "servicesgrid",
  "services",
  "cta",
  "whychooseus",
  "why-choose-us",
  "process",
  "guarantee",
  "testimonials",
  "areas",
  "faq",
]);

const CANONICAL_SERVICE_SECTION_ORDER = Object.freeze([
  "servicehero",
  "aboutservice",
  "servicecopy",
  "servicegroups",
  "servicedetailcta",
  "servicewhychooseus",
  "serviceprocess",
  "serviceguarantee",
  "promiseline",
  "relatedservices",
  "subservices",
  "testimonials",
  "faq",
]);

const MINIMAL_SERVICE_SECTION_FALLBACK = Object.freeze(["aboutservice"]);

const SHELL_SECTION_TYPES = new Set(["header", "footer", "navbar"]);

const SERVICE_TEMPLATE_EXCLUSIVE_SECTIONS = new Set(
  CANONICAL_SERVICE_SECTION_ORDER.filter((id) => id !== "faq")
);

function canonicalSectionId(raw = "") {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "whychooseus") return "why-choose-us";
  return value;
}

function buildOrderIndex(orderList) {
  const map = new Map();
  orderList.forEach((id, idx) => {
    map.set(canonicalSectionId(id), idx);
  });
  return map;
}

function sortSectionIdsByCanonicalOrder(pageKey, ids = []) {
  const order =
    String(pageKey || "").toLowerCase() === "service"
      ? CANONICAL_SERVICE_SECTION_ORDER
      : CANONICAL_HOME_SECTION_ORDER;
  const index = buildOrderIndex(order);
  return [...ids].sort((a, b) => {
    const ia = index.get(canonicalSectionId(a)) ?? 999;
    const ib = index.get(canonicalSectionId(b)) ?? 999;
    if (ia !== ib) return ia - ib;
    return String(a).localeCompare(String(b));
  });
}

function sortSectionObjectsByCanonicalOrder(pageKey, items = [], getId) {
  const getter =
    typeof getId === "function"
      ? getId
      : (item) => item?.id || item?.sectionData?.type || item?.type || "";
  const order =
    String(pageKey || "").toLowerCase() === "service"
      ? CANONICAL_SERVICE_SECTION_ORDER
      : CANONICAL_HOME_SECTION_ORDER;
  const index = buildOrderIndex(order);
  return [...items].sort((a, b) => {
    const ia = index.get(canonicalSectionId(getter(a))) ?? 999;
    const ib = index.get(canonicalSectionId(getter(b))) ?? 999;
    if (ia !== ib) return ia - ib;
    return String(getter(a)).localeCompare(String(getter(b)));
  });
}

function isServiceTemplateExclusiveSection(sectionId = "") {
  return SERVICE_TEMPLATE_EXCLUSIVE_SECTIONS.has(canonicalSectionId(sectionId));
}

function getPageSectionsFromDesign(page = {}) {
  if (Array.isArray(page?.sections)) return page.sections;
  if (Array.isArray(page?.componentIds)) return page.componentIds;
  return [];
}

function extractSectionTypesFromDesignPage(page = {}) {
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

function findServiceTemplateWebsitePage(websitePages = []) {
  return (
    (websitePages || []).find((p) => {
      const name = String(p?.name || "").toLowerCase().trim();
      const hasServiceId = p?.serviceId != null && String(p.serviceId).trim() !== "";
      return name === "service" && !hasServiceId;
    }) || null
  );
}

function findServiceTemplateDesignPage(designData = {}, websitePages = []) {
  const templateWp = findServiceTemplateWebsitePage(websitePages);
  if (!templateWp?._id) return null;
  const templateId = String(templateWp._id);
  return (
    (designData?.pages || []).find((p) => {
      const pid = String(p?.pageId?._id || p?.pageId || "");
      return pid === templateId;
    }) || null
  );
}

function getServiceTemplateSectionTypes(designData = {}, websitePages = []) {
  const templatePage = findServiceTemplateDesignPage(designData, websitePages);
  const fromTemplate = extractSectionTypesFromDesignPage(templatePage);
  if (fromTemplate.length) {
    return sortSectionIdsByCanonicalOrder("service", fromTemplate);
  }
  return [...MINIMAL_SERVICE_SECTION_FALLBACK];
}

function buildServiceRenderSections({
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

function reorderHomeSectionsInConfig(sections = []) {
  return sortSectionObjectsByCanonicalOrder("home", sections, (s) => s.id);
}

module.exports = {
  CANONICAL_HOME_SECTION_ORDER,
  CANONICAL_SERVICE_SECTION_ORDER,
  MINIMAL_SERVICE_SECTION_FALLBACK,
  SHELL_SECTION_TYPES,
  canonicalSectionId,
  sortSectionIdsByCanonicalOrder,
  sortSectionObjectsByCanonicalOrder,
  getPageSectionsFromDesign,
  extractSectionTypesFromDesignPage,
  findServiceTemplateWebsitePage,
  findServiceTemplateDesignPage,
  getServiceTemplateSectionTypes,
  buildServiceRenderSections,
  reorderHomeSectionsInConfig,
  isServiceTemplateExclusiveSection,
  SERVICE_TEMPLATE_EXCLUSIVE_SECTIONS,
};
