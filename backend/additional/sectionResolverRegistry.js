const { canonicalSectionId } = require("./siteSectionOrder.cjs");

/** Homepage / listing grid only — not single-service detail sections. */
const SERVICE_GRID_SECTION_IDS = new Set(["servicesgrid", "services"]);

const SECTION_RESOLVERS = Object.freeze({
  servicesgrid: "service_bundle",
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
  areas: "business_locations",
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
  return isServiceBundleSection(id) || id === "faq";
};

const isBusinessLocationsSection = (sectionId = "") =>
  getSectionResolver(sectionId) === "business_locations";

module.exports = {
  SECTION_RESOLVERS,
  SERVICE_GRID_SECTION_IDS,
  getSectionResolver,
  isServiceBundleSection,
  usesServicesGridDbBuilder,
  isServiceDetailSection,
  isBusinessLocationsSection,
  canonicalSectionId,
};
