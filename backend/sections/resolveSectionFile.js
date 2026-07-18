const path = require("path");
const fs = require("fs");
const {
  LOCATION_TO_HOME_SECTION,
} = require("../additional/locationHomeSectionMap.cjs");

const SECTIONS_ROOT = __dirname;

/** Site-wide sections (header/footer) — not under a page folder. */
const SITE_WIDE_FOLDERS = ["headerfooter"];

/** Page folders — each holds only sections for that page type. */
const PAGE_FOLDERS = [
  "homepage",
  "serviceslist",
  "servicedetail",
  "services",
  "service",
  "about",
  "contact",
  "blog",
  "legal",
  "allareas",
];

const SECTION_ID_ALIASES = {
  navbar: "header",
  /** Legacy About ids → GenieBuild About section ids */
  difference: "usp",
  /** Legacy Contact blob → GenieBuild contact hero (intro/form are separate now) */
  contactpage: "contacthero",
  /** Legacy all-services hero → GenieBuild services list hero */
  serviceshero: "serviceslisthero",
  /**
   * Legacy Multicolor service-detail ids → GenieBuild servicedetail* prompts.
   * Do NOT alias shared ids (faq, testimonials) — those exist on homepage too.
   */
  servicehero: "servicedetailhero",
  aboutservice: "servicedetailabout",
  subservices: "servicedetailservices",
  serviceprocess: "servicedetailprocess",
  servicewhychooseus: "servicedetailwhychoose",
  serviceguarantee: "servicedetailguarantee",
  /** Location UI ids → homepage prompts (same section, location-scoped content). */
  ...LOCATION_TO_HOME_SECTION,
  /** Legacy blog listing blob → GenieBuild blogs hero */
  blogslisting: "blogshero",
};

const PAGE_TYPE_TO_FOLDER = {
  home: "homepage",
  homepage: "homepage",
  default: "homepage",
  about: "about",
  contact: "contact",
  service: "service",
  servicedetail: "servicedetail",
  services: "serviceslist",
  serviceslist: "serviceslist",
  "services-list": "serviceslist",
  "all-services": "serviceslist",
  blog: "blog",
  blogs: "blog",
  location: "homepage",
  legal: "legal",
  privacy: "legal",
  "privacy-policy": "legal",
  terms: "legal",
  "terms-conditions": "legal",
  disclaimer: "legal",
  /** All Areas listing (`/areas`) — prompts under sections/allareas/ */
  areas: "allareas",
  allareas: "allareas",
};

function resolvePageFolder(pageType = "", pageName = "") {
  const pt = String(pageType || "").toLowerCase().trim();
  const pn = String(pageName || "").toLowerCase().trim();
  if (PAGE_TYPE_TO_FOLDER[pt]) return PAGE_TYPE_TO_FOLDER[pt];
  if (pn === "about" || pn === "about us") return "about";
  if (pn === "contact" || pn === "contact us") return "contact";
  if (
    pn === "services" ||
    pn === "services list" ||
    pn === "serviceslist" ||
    pn === "all services"
  ) {
    return "serviceslist";
  }
  if (pn === "service") return "service";
  if (pn === "home") return "homepage";
  if (pn === "blog" || pn === "blogs" || pn.startsWith("blog-")) return "blog";
  // All Areas listing: name areas / allareas
  if (pn === "areas" || pn === "allareas" || pn === "all-areas") return "allareas";
  // Location landings: name like location-<id> — reuse homepage section modules
  if (pn.startsWith("location-") || pn === "location") return "homepage";
  if (
    pn === "legal" ||
    pn === "privacy" ||
    pn === "privacy-policy" ||
    pn === "privacypolicy" ||
    pn === "terms" ||
    pn === "terms-conditions" ||
    pn === "termsandconditions" ||
    pn === "disclaimer"
  ) {
    return "legal";
  }
  return pn || pt || "";
}

function trySectionPath(pageFolder, sectionId) {
  const filePath = path.join(
    SECTIONS_ROOT,
    pageFolder,
    sectionId,
    `${sectionId}Section.js`
  );
  return fs.existsSync(filePath) ? filePath : null;
}

/**
 * @param {string} sectionId
 * @param {{ pageType?: string, pageFolder?: string, scope?: string }} [options]
 */
function resolveSectionFile(sectionId, options = {}) {
  let normalized = String(sectionId || "").trim().toLowerCase();
  if (!normalized) return null;

  if (SECTION_ID_ALIASES[normalized]) {
    normalized = SECTION_ID_ALIASES[normalized];
  }

  const pageType = String(options.pageType || "").toLowerCase().trim();
  const pageFolder = resolvePageFolder(
    pageType,
    String(options.pageFolder || "").toLowerCase().trim()
  );

  for (const folder of SITE_WIDE_FOLDERS) {
    const hit = trySectionPath(folder, normalized);
    if (hit) return hit;
  }

  if (pageFolder) {
    const pageHit = trySectionPath(pageFolder, normalized);
    if (pageHit) return pageHit;
  }

  // GenieBuild service-detail sections live under servicedetail/ (not service/)
  if (
    normalized.startsWith("servicedetail") ||
    pageFolder === "servicedetail" ||
    pageType === "servicedetail"
  ) {
    const detailHit = trySectionPath("servicedetail", normalized);
    if (detailHit) return detailHit;
  }

  // Blog GenieBuild ids
  if (
    pageFolder === "blog" ||
    pageType === "blog" ||
    normalized.startsWith("blog")
  ) {
    const blogHit = trySectionPath("blog", normalized);
    if (blogHit) return blogHit;
  }

  // Legal GenieBuild + legacy ids
  if (
    pageFolder === "legal" ||
    pageType === "legal" ||
    normalized.startsWith("legal")
  ) {
    const legalHit = trySectionPath("legal", normalized);
    if (legalHit) return legalHit;
  }

  const preferService =
    pageFolder === "service" ||
    pageType === "service" ||
    ((normalized.startsWith("service") ||
      normalized === "aboutservice" ||
      normalized === "promiseline" ||
      normalized === "subservices" ||
      normalized === "relatedservices") &&
      !normalized.startsWith("serviceslist") &&
      !normalized.startsWith("servicedetail") &&
      normalized !== "services" &&
      normalized !== "serviceshero" &&
      normalized !== "servicesgrid");

  if (preferService) {
    const serviceHit = trySectionPath("service", normalized);
    if (serviceHit) return serviceHit;
  }

  if (
    pageFolder === "serviceslist" ||
    pageFolder === "services" ||
    pageType === "services" ||
    pageType === "serviceslist" ||
    normalized.startsWith("serviceslist")
  ) {
    const listHit = trySectionPath("serviceslist", normalized);
    if (listHit) return listHit;
    const legacyServicesHit = trySectionPath("services", normalized);
    if (legacyServicesHit) return legacyServicesHit;
  }

  // Prefer allareas folder for All Areas page / allareas section ids
  if (
    pageFolder === "allareas" ||
    pageType === "areas" ||
    pageType === "allareas" ||
    normalized === "areashero" ||
    normalized === "areastestimonials" ||
    normalized === "areasfaq" ||
    normalized === "sublocations" ||
    normalized === "locationmap"
  ) {
    const areasHit = trySectionPath("allareas", normalized);
    if (areasHit) return areasHit;
  }

  // Prefer homepage for shared section ids / location DB helpers
  if (
    pageFolder === "homepage" ||
    pageType === "home" ||
    pageType === "homepage" ||
    pageType === "default" ||
    pageType === "location"
  ) {
    const homeHit = trySectionPath("homepage", normalized);
    if (homeHit) return homeHit;
  }

  for (const page of PAGE_FOLDERS) {
    const hit = trySectionPath(page, normalized);
    if (hit) return hit;
  }

  const legacyPath = path.join(
    SECTIONS_ROOT,
    normalized,
    `${normalized}Section.js`
  );
  if (fs.existsSync(legacyPath)) return legacyPath;

  return null;
}

module.exports = resolveSectionFile;
