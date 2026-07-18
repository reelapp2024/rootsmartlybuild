const { canonicalSectionId, serviceDetailBundleTwinId } = require("./siteSectionOrder.cjs");
const { locationHomeTwinId } = require("./locationHomeSectionMap.cjs");

/** Homepage / listing grid only — not single-service detail sections. */
const SERVICE_GRID_SECTION_IDS = new Set([
  "servicesgrid",
  "services",
  "serviceslistgrid",
  /** Location page services block reuses homepage services DB builder */
  "locationservices",
]);

const BLOG_COLLECTION_SECTION_IDS = new Set(["blogslist"]);
const BLOG_DOCUMENT_SECTION_IDS = new Set([
  "blogarticlehero",
  "blogcontent",
  "blogarticle",
]);
const BLOG_AUTHOR_SECTION_IDS = new Set(["blogauthor"]);
const BLOG_RELATED_SECTION_IDS = new Set(["blogrelated"]);

const SECTION_RESOLVERS = Object.freeze({
  servicesgrid: "service_bundle",
  // Legacy Multicolor
  servicehero: "service_bundle",
  aboutservice: "service_bundle",
  servicecopy: "service_bundle",
  servicegroups: "service_bundle",
  servicedetailcta: "service_bundle",
  serviceprocess: "service_bundle",
  servicewhychooseus: "service_bundle",
  serviceguarantee: "service_bundle",
  promiseline: "service_bundle",
  relatedservices: "service_bundle",
  subservices: "service_bundle",
  faq: "service_bundle",
  // GenieBuild service detail
  servicedetailhero: "service_bundle",
  servicedetailabout: "service_bundle",
  servicedetailservices: "service_bundle",
  servicedetailprocess: "service_bundle",
  servicedetailwhychoose: "service_bundle",
  servicedetailguarantee: "service_bundle",
  servicedetailtestimonials: "service_bundle",
  servicedetailfaq: "service_bundle",
  areas: "business_locations",
  serviceslistareas: "business_locations",
  locationareas: "business_locations",
  sublocations: "business_locations",
  locationmap: "location_map",
  blogslist: "blog_collection",
  blogarticlehero: "blog_document",
  blogcontent: "blog_document",
  blogarticle: "blog_document",
  blogauthor: "blog_author",
  blogrelated: "blog_related",
});

const getSectionResolver = (sectionId = "") =>
  SECTION_RESOLVERS[canonicalSectionId(sectionId)] || "page_scoped";

const isServiceBundleSection = (sectionId = "") =>
  getSectionResolver(sectionId) === "service_bundle";

/** Uses DB-backed services list (home grid), not OpenAI service-detail prompts. */
const usesServicesGridDbBuilder = (sectionId = "") =>
  SERVICE_GRID_SECTION_IDS.has(canonicalSectionId(sectionId));

/** Single-service page sections stored in service_sections bundle (AI-generated). */
const isServiceDetailSection = (sectionId = "") => {
  const id = canonicalSectionId(sectionId);
  if (!id || usesServicesGridDbBuilder(id)) return false;
  return isServiceBundleSection(id) || id === "faq" || id === "servicedetailfaq";
};

const isBusinessLocationsSection = (sectionId = "") =>
  getSectionResolver(sectionId) === "business_locations";

const isLocationMapSection = (sectionId = "") => {
  const id = canonicalSectionId(sectionId);
  return getSectionResolver(id) === "location_map" || id === "locationmap";
};

const usesBlogCollectionBuilder = (sectionId = "") =>
  BLOG_COLLECTION_SECTION_IDS.has(canonicalSectionId(sectionId)) ||
  getSectionResolver(sectionId) === "blog_collection";

const usesBlogDocumentBuilder = (sectionId = "") =>
  BLOG_DOCUMENT_SECTION_IDS.has(canonicalSectionId(sectionId)) ||
  getSectionResolver(sectionId) === "blog_document";

const usesBlogAuthorBuilder = (sectionId = "") =>
  BLOG_AUTHOR_SECTION_IDS.has(canonicalSectionId(sectionId)) ||
  getSectionResolver(sectionId) === "blog_author";

const usesBlogRelatedBuilder = (sectionId = "") =>
  BLOG_RELATED_SECTION_IDS.has(canonicalSectionId(sectionId)) ||
  getSectionResolver(sectionId) === "blog_related";

module.exports = {
  SECTION_RESOLVERS,
  SERVICE_GRID_SECTION_IDS,
  BLOG_COLLECTION_SECTION_IDS,
  BLOG_DOCUMENT_SECTION_IDS,
  getSectionResolver,
  isServiceBundleSection,
  usesServicesGridDbBuilder,
  isServiceDetailSection,
  isBusinessLocationsSection,
  isLocationMapSection,
  usesBlogCollectionBuilder,
  usesBlogDocumentBuilder,
  usesBlogAuthorBuilder,
  usesBlogRelatedBuilder,
  canonicalSectionId,
  serviceDetailBundleTwinId,
  locationHomeTwinId,
};
