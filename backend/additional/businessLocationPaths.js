const slugify = require("./slugify");

/** Hierarchical URL paths for business locations (parent/child slugs). */
function buildBusinessLocationPathMap(locations = []) {
  const byId = new Map(
    (Array.isArray(locations) ? locations : [])
      .filter((loc) => loc && loc._id)
      .map((loc) => [String(loc._id), loc])
  );
  const pathById = new Map();

  const buildPath = (locationId, guard = new Set()) => {
    const id = String(locationId || "");
    if (!id || !byId.has(id)) return "";
    if (pathById.has(id)) return pathById.get(id);
    if (guard.has(id)) return slugify(String(byId.get(id)?.areaName || ""));

    const current = byId.get(id);
    const ownSlug = slugify(String(current?.areaName || ""));
    const parentId = current?.parentId ? String(current.parentId) : "";
    let fullPath = ownSlug;

    if (parentId && byId.has(parentId)) {
      guard.add(id);
      const parentPath = buildPath(parentId, guard);
      guard.delete(id);
      if (parentPath) fullPath = `${parentPath}/${ownSlug}`;
    }

    pathById.set(id, fullPath);
    return fullPath;
  };

  for (const id of byId.keys()) {
    buildPath(id);
  }

  return pathById;
}

function normalizeLocationHref(value = "") {
  const raw = String(value || "").trim();
  if (!raw || raw === "#") return "";
  if (/^(https?:)?\/\//i.test(raw) || /^mailto:|^tel:/i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function resolveLocationPageHref(locationId, pageSlugById, pathByLocationId) {
  const id = String(locationId || "");
  const fromPage = pageSlugById?.get(id);
  if (fromPage && fromPage !== "#") return normalizeLocationHref(fromPage);
  const path = pathByLocationId?.get(id);
  if (path) return normalizeLocationHref(path);
  return "#";
}

module.exports = {
  buildBusinessLocationPathMap,
  normalizeLocationHref,
  resolveLocationPageHref,
};
