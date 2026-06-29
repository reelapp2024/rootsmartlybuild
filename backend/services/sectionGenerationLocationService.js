/**
 * Location list rules for section content generation (business vs bulk).
 *
 * Business (projectType 1):
 *   toggle OFF → main parent location only (never locationId: null)
 *   toggle ON  → every active location (never locationId: null)
 *
 * Bulk (projectType 0):
 *   toggle OFF → locationId: null only
 *   toggle ON  → null + every active location
 */

const DEFAULT_PER_LOCATION_CONTENT = { home: true, service: true };

function resolveConfigPageKey(pageMeta = {}) {
  const pageType = String(pageMeta?.pageType || "").toLowerCase();
  const name = String(pageMeta?.name || "").toLowerCase().trim();
  if (pageType === "service" && pageMeta?.serviceId) return "service";
  if (name.startsWith("service-")) return "service";
  if (name === "service") return "service";
  if (name === "home" || name === "homepage") return "home";
  if (name === "about" || name.startsWith("about")) return "about";
  if (name === "services") return "services";
  if (name === "contact" || name.startsWith("contact")) return "contact";
  if (name.startsWith("location-")) return "location";
  return name || "unknown";
}

function isPerLocationContentForPage(configPageKey, perLocationContentByPage = {}) {
  if (typeof perLocationContentByPage[configPageKey] === "boolean") {
    return perLocationContentByPage[configPageKey];
  }
  return DEFAULT_PER_LOCATION_CONTENT[configPageKey] === true;
}

function isServiceDetailWebsitePage(pageMeta = {}) {
  return (
    String(pageMeta?.pageType || "").toLowerCase() === "service" &&
    Boolean(pageMeta?.serviceId)
  );
}

function isServiceTemplateWebsitePage(pageMeta = {}) {
  const name = String(pageMeta?.name || "").toLowerCase().trim();
  return name === "service" && !isServiceDetailWebsitePage(pageMeta);
}

/**
 * Format every active BusinessLocation for the generation queue.
 * Includes full geo hierarchy (country/state/city/local area), not only type 0/1.
 */
function formatBusinessLocationsForGeneration(locationsData = []) {
  const locationMap = {};
  for (const loc of locationsData || []) {
    locationMap[String(loc._id)] = loc;
  }

  const sorted = [...(locationsData || [])].sort((a, b) => {
    const ta = new Date(a?.createdAt || 0).getTime();
    const tb = new Date(b?.createdAt || 0).getTime();
    if (ta !== tb) return ta - tb;
    return String(a?._id || "").localeCompare(String(b?._id || ""));
  });

  return sorted
    .map((loc) => {
      const name = String(loc?.areaName || "").trim();
      if (!name) return null;
      const parent = loc?.parentId ? locationMap[String(loc.parentId)] : null;
      return {
        _id: loc._id,
        name,
        areaName: name,
        parentName: parent ? String(parent.areaName || "").trim() : null,
        parent_id: loc.parentId ? String(loc.parentId) : null,
        type: Number(loc?.type ?? 0),
        locationType: loc?.locationType != null ? Number(loc.locationType) : null,
        createdAt: loc?.createdAt || null,
      };
    })
    .filter(Boolean);
}

/**
 * First-entered main parent for business websites:
 * manual business location (locationType 4) → else first root → else first row.
 */
function resolveMainParentLocation(incomingLocations = [], { isBusinessProject = true } = {}) {
  const list = Array.isArray(incomingLocations) ? incomingLocations : [];
  if (!list.length) return null;

  if (isBusinessProject) {
    const manual = list.find((loc) => Number(loc?.locationType) === 4);
    if (manual) return manual;

    const firstRoot = list.find(
      (loc) => !loc?.parent_id && (Number(loc?.type) === 0 || loc?.parent_id == null)
    );
    if (firstRoot) return firstRoot;
  }

  return list[0];
}

function resolvePageLocationToggle({
  configPageKey,
  pageMeta = null,
  perLocationContentByPage = {},
}) {
  if (pageMeta && typeof pageMeta.perLocationContent === "boolean") {
    return pageMeta.perLocationContent;
  }
  return isPerLocationContentForPage(configPageKey, perLocationContentByPage);
}

/**
 * @returns {Array<object|null>} Location objects for generation loop (null = global/non-location).
 */
function buildPageLocationList({
  projectType,
  isBusinessProject,
  configPageKey,
  perLocationContentByPage = {},
  pageMeta = null,
  incomingLocations = [],
  mainParentLocation = null,
}) {
  const isBulkProject = Number(projectType ?? (isBusinessProject ? 1 : 0)) === 0;
  const allLocations = Array.isArray(incomingLocations) ? incomingLocations : [];
  const toggleOn = resolvePageLocationToggle({
    configPageKey,
    pageMeta,
    perLocationContentByPage,
  });
  const parent =
    mainParentLocation ||
    resolveMainParentLocation(allLocations, { isBusinessProject: !isBulkProject });

  if (configPageKey === "location") {
    return allLocations.length ? allLocations : isBulkProject ? [null] : parent ? [parent] : [];
  }

  if (isBulkProject) {
    if (toggleOn) {
      return [null, ...allLocations];
    }
    return [null];
  }

  // Business: never generate locationId: null
  if (toggleOn) {
    return allLocations.length ? allLocations : parent ? [parent] : [];
  }
  return parent ? [parent] : [];
}

module.exports = {
  DEFAULT_PER_LOCATION_CONTENT,
  resolveConfigPageKey,
  isPerLocationContentForPage,
  isServiceDetailWebsitePage,
  isServiceTemplateWebsitePage,
  formatBusinessLocationsForGeneration,
  resolveMainParentLocation,
  resolvePageLocationToggle,
  buildPageLocationList,
};
