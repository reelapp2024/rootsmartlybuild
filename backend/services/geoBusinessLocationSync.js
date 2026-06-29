const BusinessLocation = require("../models/businessLocation");
const UserProject = require("../models/userProjects");
const WebsitePage = require("../models/WebsitePage");
const { buildBusinessLocationPathMap } = require("../additional/businessLocationPaths");
const slugify = require("../additional/slugify");

function isBulkProject(projectOrType) {
  if (projectOrType == null) return false;
  if (typeof projectOrType === "object") {
    return Number(projectOrType?.projectType ?? 0) === 0;
  }
  return Number(projectOrType) === 0;
}

/** locationType on BusinessLocation: 0=country, 1=state, 2=city, 3=localArea, 4=business */
const GEO_LOCATION_TYPE = {
  COUNTRY: 0,
  STATE: 1,
  CITY: 2,
  LOCAL_AREA: 3,
  BUSINESS: 4,
};

function isGeoRootCountry(loc = {}) {
  return Number(loc?.locationType) === GEO_LOCATION_TYPE.COUNTRY && !loc?.parentId;
}

function pushBusinessLocationToProject(project, locationDoc, locType, parentId) {
  if (!project.locations) project.locations = {};
  if (!project.locations.businessLocations) project.locations.businessLocations = [];
  const alreadyInProject = project.locations.businessLocations.find(
    (l) =>
      l.areaName === locationDoc.areaName &&
      Number(l.type) === locType &&
      String(l.parentId || "") === String(parentId || "")
  );
  if (!alreadyInProject) {
    project.locations.businessLocations.push({
      locationId: locationDoc._id,
      areaName: locationDoc.areaName,
      type: locType,
      parentId: parentId || null,
    });
  }
}

async function upsertGeoBusinessLocation({
  project,
  projectId,
  adminLocationId,
  locationType,
  areaName,
  parentBusinessLocationId = null,
  structuralType = 0,
  lat = null,
  lng = null,
  country = null,
  state = null,
  city = null,
  status = 1,
}) {
  const name = String(areaName || "").trim();
  const adminId = adminLocationId != null ? String(adminLocationId) : null;
  if (!name || locationType == null) return null;

  let doc = null;
  if (adminId) {
    doc = await BusinessLocation.findOne({
      projectId,
      adminLocationId: adminId,
      locationType,
    });
  }
  if (!doc) {
    doc = await BusinessLocation.findOne({
      projectId,
      areaName: name,
      locationType,
      parentId: parentBusinessLocationId || null,
    });
  }

  if (doc) {
    doc.areaName = name;
    doc.parentId = parentBusinessLocationId || null;
    doc.type = structuralType;
    doc.locationType = locationType;
    doc.adminLocationId = adminId;
    doc.status = status;
    if (lat != null) doc.lat = lat;
    if (lng != null) doc.lng = lng;
    if (country) doc.country = country;
    if (state) doc.state = state;
    if (city) doc.city = city;
    await doc.save();
  } else {
    doc = await BusinessLocation.create({
      projectId,
      areaName: name,
      parentId: parentBusinessLocationId || null,
      type: structuralType,
      locationType,
      adminLocationId: adminId,
      status,
      pageGenerated: false,
      lat,
      lng,
      country,
      state,
      city,
    });
  }

  if (project && status === 1) {
    pushBusinessLocationToProject(
      project,
      doc,
      structuralType,
      parentBusinessLocationId || null
    );
  }

  return doc;
}

async function deactivateGeoByType(projectId, locationType, keptAdminIds = []) {
  const kept = new Set(keptAdminIds.map((id) => String(id)));
  const query = {
    projectId,
    locationType,
    status: 1,
  };
  if (kept.size) {
    query.adminLocationId = { $nin: [...kept] };
  }
  await BusinessLocation.updateMany(query, { $set: { status: 0 } });
}

async function findParentByAdminId(projectId, adminLocationId, locationType) {
  if (adminLocationId == null) return null;
  return BusinessLocation.findOne({
    projectId,
    adminLocationId: String(adminLocationId),
    locationType,
    status: 1,
  }).lean();
}

async function syncCountriesToBusinessLocations(projectId, countries = []) {
  const project = await UserProject.findById(projectId);
  if (!project) return;

  const active = (countries || []).filter((c) => Number(c.status) === 1);
  const keptIds = [];

  for (const entry of active) {
    const doc = await upsertGeoBusinessLocation({
      project,
      projectId,
      adminLocationId: entry.countryId,
      locationType: GEO_LOCATION_TYPE.COUNTRY,
      areaName: entry.name,
      parentBusinessLocationId: null,
      structuralType: 0,
      lat: entry.lat ?? null,
      lng: entry.lng ?? null,
      country: entry.name,
      status: 1,
    });
    if (doc) keptIds.push(String(entry.countryId));
  }

  await deactivateGeoByType(projectId, GEO_LOCATION_TYPE.COUNTRY, keptIds);
  await project.save();
  await afterBulkGeoSync(projectId);
}

async function syncStatesToBusinessLocations(projectId, states = []) {
  const project = await UserProject.findById(projectId);
  if (!project) return;

  const active = (states || []).filter((s) => Number(s.status) === 1);
  const keptIds = [];

  for (const entry of active) {
    const parent = await findParentByAdminId(
      projectId,
      entry.countryId,
      GEO_LOCATION_TYPE.COUNTRY
    );
    const doc = await upsertGeoBusinessLocation({
      project,
      projectId,
      adminLocationId: entry.stateId,
      locationType: GEO_LOCATION_TYPE.STATE,
      areaName: entry.name,
      parentBusinessLocationId: parent?._id || null,
      structuralType: 0,
      state: entry.name,
      country: parent?.areaName || null,
      status: 1,
    });
    if (doc) keptIds.push(String(entry.stateId));
  }

  await deactivateGeoByType(projectId, GEO_LOCATION_TYPE.STATE, keptIds);
  await project.save();
  await afterBulkGeoSync(projectId);
}

async function syncCitiesToBusinessLocations(projectId, cities = []) {
  const project = await UserProject.findById(projectId);
  if (!project) return;

  const active = (cities || []).filter((c) => Number(c.status) === 1);
  const keptIds = [];

  for (const entry of active) {
    const parent = await findParentByAdminId(
      projectId,
      entry.stateId,
      GEO_LOCATION_TYPE.STATE
    );
    const doc = await upsertGeoBusinessLocation({
      project,
      projectId,
      adminLocationId: entry.cityId,
      locationType: GEO_LOCATION_TYPE.CITY,
      areaName: entry.name,
      parentBusinessLocationId: parent?._id || null,
      structuralType: 0,
      city: entry.name,
      state: parent?.areaName || null,
      status: 1,
    });
    if (doc) keptIds.push(String(entry.cityId));
  }

  await deactivateGeoByType(projectId, GEO_LOCATION_TYPE.CITY, keptIds);
  await project.save();
  await afterBulkGeoSync(projectId);
}

async function syncLocalAreasToBusinessLocations(projectId, localAreas = []) {
  const project = await UserProject.findById(projectId);
  if (!project) return;

  const keptIds = [];

  for (const entry of localAreas || []) {
    const parent = await findParentByAdminId(
      projectId,
      entry.cityId,
      GEO_LOCATION_TYPE.CITY
    );
    const doc = await upsertGeoBusinessLocation({
      project,
      projectId,
      adminLocationId: entry.localAreaId,
      locationType: GEO_LOCATION_TYPE.LOCAL_AREA,
      areaName: entry.name,
      parentBusinessLocationId: parent?._id || null,
      structuralType: 1,
      city: parent?.areaName || null,
      status: 1,
    });
    if (doc) keptIds.push(String(entry.localAreaId));
  }

  if (keptIds.length) {
    await BusinessLocation.updateMany(
      {
        projectId,
        locationType: GEO_LOCATION_TYPE.LOCAL_AREA,
        status: 1,
        adminLocationId: { $nin: keptIds },
      },
      { $set: { status: 0 } }
    );
  }

  await project.save();
  await afterBulkGeoSync(projectId);
}

/** Bulk: global core pages must not be tied to any BusinessLocation. */
async function ensureBulkGlobalCorePages(projectId) {
  const project = await UserProject.findById(projectId).select("projectType").lean();
  if (!isBulkProject(project)) return;

  const coreSpecs = [
    { name: "home", slug: "home", displayName: "Home" },
    { name: "about", slug: "about", displayName: "About Us" },
    { name: "services", slug: "services", displayName: "Services" },
    { name: "contact", slug: "contact", displayName: "Contact" },
  ];

  for (const spec of coreSpecs) {
    const pageSlug = String(spec.slug || slugify(spec.name) || spec.name || "page").trim();
    const displayName = String(spec.displayName || spec.name || "Page").trim();
    if (!pageSlug || !displayName) continue;

    await WebsitePage.findOneAndUpdate(
      { projectId, name: spec.name },
      {
        $set: {
          slug: pageSlug,
          displayName,
          pageType: "default",
        },
        $unset: { locationId: "" },
        $setOnInsert: {
          projectId,
          name: spec.name,
          componentIds: [],
        },
      },
      { upsert: true, new: true }
    );
  }
}

/** Bulk: one landing page per active geo node (country → state → city → local area). */
async function syncBulkLocationLandingPages(projectId) {
  const project = await UserProject.findById(projectId).select("projectType").lean();
  if (!isBulkProject(project)) return { upserted: 0 };

  const locations = await BusinessLocation.find({ projectId, status: 1 })
    .select("_id areaName type parentId locationType")
    .lean();
  if (!locations.length) return { upserted: 0 };

  const pathById = buildBusinessLocationPathMap(locations);
  const ops = [];

  for (const loc of locations) {
    const locId = String(loc._id);
    const slugPath = String(pathById.get(locId) || slugify(String(loc.areaName || ""))).trim();
    const displayName = String(loc.areaName || "").trim();
    if (!slugPath || !displayName) continue;

    const pageName = `location-${locId}`;
    ops.push({
      updateOne: {
        filter: { projectId, name: pageName },
        update: {
          $set: {
            slug: slugPath,
            displayName,
            pageType: "default",
            locationId: loc._id,
            isPublished: true, // Location pages should always be published by default
          },
          $setOnInsert: {
            projectId,
            name: pageName,
            isPublished: true,
          },
        },
        upsert: true,
      },
    });
  }

  if (ops.length) {
    await WebsitePage.bulkWrite(ops, { ordered: false });
  }

  return { upserted: ops.length };
}

async function afterBulkGeoSync(projectId) {
  await ensureBulkGlobalCorePages(projectId);
  return syncBulkLocationLandingPages(projectId);
}

/** Mark manual business locations when syncing business wizard (locationType=4). */
async function markBusinessManualLocation(doc) {
  if (!doc || doc.locationType != null) return doc;
  doc.locationType = GEO_LOCATION_TYPE.BUSINESS;
  doc.adminLocationId = null;
  await doc.save();
  return doc;
}

module.exports = {
  GEO_LOCATION_TYPE,
  isBulkProject,
  isGeoRootCountry,
  ensureBulkGlobalCorePages,
  syncBulkLocationLandingPages,
  afterBulkGeoSync,
  syncCountriesToBusinessLocations,
  syncStatesToBusinessLocations,
  syncCitiesToBusinessLocations,
  syncLocalAreasToBusinessLocations,
  markBusinessManualLocation,
  upsertGeoBusinessLocation,
};
