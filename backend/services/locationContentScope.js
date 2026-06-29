/**
 * Shared location scoping for areas + section content resolution.
 * Prevents parent pages from picking child/descendant SectionContent rows.
 */

function buildLocationParentMap(locations = []) {
  const parentById = new Map();
  for (const loc of locations || []) {
    const id = String(loc?._id || "").trim();
    if (!id) continue;
    parentById.set(
      id,
      loc?.parentId || loc?.parent_id ? String(loc.parentId || loc.parent_id) : null
    );
  }
  return parentById;
}

function getAncestorIds(locationId, parentById = new Map()) {
  const ancestors = [];
  let cursor = String(locationId || "").trim();
  const seen = new Set();
  while (cursor && parentById.has(cursor) && !seen.has(cursor)) {
    seen.add(cursor);
    const parent = parentById.get(cursor);
    if (!parent) break;
    ancestors.push(parent);
    cursor = parent;
  }
  return ancestors;
}

/**
 * Pick SectionContent for a page+section scope.
 * Never returns a descendant location row when a parent/global was requested.
 */
function pickSectionDocForLocation(docs = [], preferredLocationId = null, parentById = null) {
  const rows = Array.isArray(docs) ? docs.filter(Boolean) : [];
  if (!rows.length) return null;

  const parentMap = parentById || new Map();

  if (!preferredLocationId) {
    const global = rows.find((row) => row?.locationId == null || row?.locationId === undefined);
    if (global) return global;
    // Never fall back to a location-specific row when global (null) scope was requested.
    return null;
  }

  const pref = String(preferredLocationId).trim();

  const exact = rows.find((row) => String(row?.locationId || "") === pref);
  if (exact) return exact;

  for (const ancestorId of getAncestorIds(pref, parentMap)) {
    const ancestorDoc = rows.find((row) => String(row?.locationId || "") === ancestorId);
    if (ancestorDoc) return ancestorDoc;
  }

  const global = rows.find((row) => row?.locationId == null || row?.locationId === undefined);
  if (global) return global;

  return null;
}

function isRootGeoLocation(loc = {}) {
  return (
    (Number(loc?.locationType) === 0 && !loc?.parentId && !loc?.parent_id) ||
    (Number(loc?.type) === 0 && !loc?.parentId && !loc?.parent_id && loc?.locationType == null)
  );
}

/**
 * Locations whose area pills / coverage copy should appear for a scoped generation/render context.
 */
function getScopedAreaLocations({
  allLocations = [],
  projectType = 0,
  scopeLocationId = null,
  onHomepage = false,
}) {
  const safe = Array.isArray(allLocations) ? allLocations : [];
  const isBulk = Number(projectType) === 0;
  const byId = new Map(safe.map((loc) => [String(loc._id), loc]));

  if (onHomepage || !scopeLocationId) {
    if (isBulk) {
      return safe.filter(isRootGeoLocation);
    }
    const parents = safe.filter((loc) => Number(loc?.type) === 0);
    const primaryParent = parents[0] || null;
    if (primaryParent?._id) {
      const children = safe.filter(
        (loc) =>
          Number(loc?.type) === 1 &&
          String(loc?.parentId || loc?.parent_id || "") === String(primaryParent._id)
      );
      return children.length ? children : [primaryParent];
    }
    return safe.filter((loc) => Number(loc?.type) === 1);
  }

  const scopeId = String(scopeLocationId).trim();
  const current = byId.get(scopeId);
  if (!current) return [];

  if (isBulk) {
    const children = safe.filter(
      (loc) => String(loc?.parentId || loc?.parent_id || "") === scopeId
    );
    return children.length ? children : [current];
  }

  const children = safe.filter(
    (loc) =>
      Number(loc?.type) === 1 &&
      String(loc?.parentId || loc?.parent_id || "") === scopeId
  );
  if (children.length) return children;

  if (Number(current?.type) === 1) {
    const parent = current?.parentId ? byId.get(String(current.parentId)) : null;
    return parent ? [parent] : [current];
  }
  return [current];
}

function getScopeLocationRecord(locations = [], scopeLocationId = null) {
  if (!scopeLocationId) return null;
  return (
    (locations || []).find((loc) => String(loc._id) === String(scopeLocationId)) || null
  );
}

module.exports = {
  buildLocationParentMap,
  getAncestorIds,
  pickSectionDocForLocation,
  getScopedAreaLocations,
  getScopeLocationRecord,
};
