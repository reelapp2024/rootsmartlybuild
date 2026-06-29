const { scanGenieSections } = require("./scanGenieSections");

/**
 * Collapse multiple WebsiteComponent docs with the same `name` into one.
 */
async function dedupeWebsiteComponentsByName(WebsiteComponent) {
  const groups = await WebsiteComponent.aggregate([
    { $group: { _id: "$name", ids: { $push: "$_id" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  for (const g of groups) {
    const docs = await WebsiteComponent.find({ name: g._id }).lean();
    if (docs.length < 2) continue;

    const mergedVariants = [];
    const seen = new Set();
    for (const d of docs) {
      for (const v of d.variants || []) {
        if (v && v.uniqueId && !seen.has(v.uniqueId)) {
          seen.add(v.uniqueId);
          mergedVariants.push({ uniqueId: String(v.uniqueId).toLowerCase(), status: v.status === 0 ? 0 : 1 });
        }
      }
      if (d.uniqueId && !seen.has(String(d.uniqueId).toLowerCase())) {
        const uid = String(d.uniqueId).toLowerCase();
        seen.add(uid);
        mergedVariants.push({ uniqueId: uid, status: 1 });
      }
    }

    const keepId = docs[0]._id;
    await WebsiteComponent.updateOne(
      { _id: keepId },
      {
        $set: { variants: mergedVariants },
        $unset: { variant: "", uniqueId: "" },
      }
    );
    const otherIds = docs.slice(1).map((x) => x._id);
    if (otherIds.length) {
      await WebsiteComponent.deleteMany({ _id: { $in: otherIds } });
    }
  }
}

/**
 * Merge filesystem scan into WebsiteComponent (one document per section `name`).
 * Variants on disk stay active (1); variants only in DB not on disk → status 0.
 */
async function mergeWebsiteComponentsFromScan(WebsiteComponent, sectionsRoot) {
  const { componentsByName, logLines } = scanGenieSections(sectionsRoot);

  await dedupeWebsiteComponentsByName(WebsiteComponent);

  const results = [];
  const added = [];
  const updated = [];

  for (const [sectionName, diskVariants] of Object.entries(componentsByName)) {
    const diskUniqueIds = new Set(diskVariants.map((v) => v.uniqueId));

    let doc = await WebsiteComponent.findOne({ name: sectionName });
    const mergedList = [];
    const seen = new Set();

    for (const d of diskVariants) {
      mergedList.push({
        uniqueId: d.uniqueId,
        status: 1,
      });
      seen.add(d.uniqueId);
    }

    if (doc?.variants) {
      for (const v of doc.variants) {
        if (!v || !v.uniqueId) continue;
        if (seen.has(v.uniqueId)) continue;
        mergedList.push({ ...v, uniqueId: String(v.uniqueId).toLowerCase(), status: 0 });
      }
    }

    if (doc) {
      await WebsiteComponent.updateOne(
        { _id: doc._id },
        { $set: { variants: mergedList }, $unset: { variant: "", uniqueId: "" } }
      );
      updated.push(sectionName);
    } else {
      doc = await WebsiteComponent.create({
        name: sectionName,
        variants: mergedList.filter((v) => v.status === 1),
      });
      added.push(sectionName);
    }

    results.push({ name: sectionName, variants: mergedList.length });
    console.log(`[mergeWebsiteComponentsFromScan] Synced section: ${sectionName} (${diskVariants.length} on disk)`);
  }

  logLines.forEach((l) => console.log(l));

  return {
    results,
    added,
    updated,
    summary: {
      sections: results.length,
      added: added.length,
      updated: updated.length,
    },
    logLines,
  };
}

module.exports = { mergeWebsiteComponentsFromScan, dedupeWebsiteComponentsByName };
