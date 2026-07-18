/**
 * Area detail landings reuse homepage section prompts.
 * GenieBuild legacy `location*` ids alias to home for old designs / dual-write.
 * All Areas listing (`/areas`): dedicated sections under
 * geniebuild/components/sections/allareas/ + backend/sections/allareas/.
 */
const LOCATION_TO_HOME_SECTION = Object.freeze({
  locationhero: "hero",
  locationabout: "about",
  locationservices: "services",
  locationwhychoose: "whychooseus",
  locationprocess: "process",
  locationcta: "cta",
  locationguarantee: "guarantee",
  locationtestimonials: "testimonials",
  locationareas: "areas",
  locationfaq: "faq",
  locationpromise: "promiseline",
});

const HOME_TO_LOCATION_SECTION = Object.freeze(
  Object.fromEntries(
    Object.entries(LOCATION_TO_HOME_SECTION).map(([loc, home]) => [home, loc])
  )
);

/** All Areas listing page sections (geniebuild/.../allareas). */
const ALL_AREAS_SECTION_IDS = new Set([
  "areashero",
  "sublocations",
  "locationmap",
  "areastestimonials",
  "areasfaq",
]);
/** DB-hydrated listing helpers (subset of ALL_AREAS_SECTION_IDS). */
const LOCATION_DB_SECTION_IDS = new Set(["locationmap", "sublocations"]);

function locationHomeTwinId(sectionId = "") {
  const id = String(sectionId || "").trim().toLowerCase();
  return LOCATION_TO_HOME_SECTION[id] || HOME_TO_LOCATION_SECTION[id] || null;
}

function isLocationUiSection(sectionId = "") {
  const id = String(sectionId || "").trim().toLowerCase();
  return Boolean(LOCATION_TO_HOME_SECTION[id]) || ALL_AREAS_SECTION_IDS.has(id);
}

function isAllAreasSection(sectionId = "") {
  return ALL_AREAS_SECTION_IDS.has(String(sectionId || "").trim().toLowerCase());
}

module.exports = {
  LOCATION_TO_HOME_SECTION,
  HOME_TO_LOCATION_SECTION,
  ALL_AREAS_SECTION_IDS,
  LOCATION_DB_SECTION_IDS,
  locationHomeTwinId,
  isLocationUiSection,
  isAllAreasSection,
};
