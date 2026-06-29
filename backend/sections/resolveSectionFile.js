const path = require("path");
const fs = require("fs");

const SECTIONS_ROOT = __dirname;

/** Site-wide sections (header/footer) — not under a page folder. */
const SITE_WIDE_FOLDERS = ["headerfooter"];

/** Page folders — each holds only sections for that page type. */
const PAGE_FOLDERS = [
  "homepage",
  "services",
  "service",
  "about",
  "contact",
  "blog",
  "legal",
];

const SECTION_ID_ALIASES = {
  navbar: "header",
};

const PAGE_TYPE_TO_FOLDER = {
  home: "homepage",
  homepage: "homepage",
  default: "homepage",
  about: "about",
  contact: "contact",
  service: "service",
  services: "services",
};

function resolvePageFolder(pageType = "", pageName = "") {
  const pt = String(pageType || "").toLowerCase().trim();
  const pn = String(pageName || "").toLowerCase().trim();
  if (PAGE_TYPE_TO_FOLDER[pt]) return PAGE_TYPE_TO_FOLDER[pt];
  if (pn === "about" || pn === "about us") return "about";
  if (pn === "contact" || pn === "contact us") return "contact";
  if (pn === "services") return "services";
  if (pn === "service") return "service";
  if (pn === "home") return "homepage";
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

  const preferService =
    pageFolder === "service" ||
    pageType === "service" ||
    normalized.startsWith("service") ||
    normalized === "aboutservice" ||
    normalized === "promiseline" ||
    normalized === "subservices" ||
    normalized === "relatedservices";

  if (preferService) {
    const serviceHit = trySectionPath("service", normalized);
    if (serviceHit) return serviceHit;
  }

  if (pageFolder === "services" || pageType === "services") {
    const servicesHit = trySectionPath("services", normalized);
    if (servicesHit) return servicesHit;
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
