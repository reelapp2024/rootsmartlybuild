/**
 * Content Cluster Engine — convert Master Keyword Database primaries into silos.
 *
 * Depth over count (2026):
 *   1 deep pillar + 3–6 strong supporting per cluster (NOT 20 thin articles).
 *
 * Input: primary keywords / searchIntents from Keyword Engine (do NOT regenerate keywords).
 * Output: clusters + publishOrder + internalLinks for Calendar / Article Gen / Pinterest.
 *
 * Reuses fetchJSONFromOpenAI — does not touch generateBlogTitles or business blog pipelines.
 */

const { fetchJSONFromOpenAI } = require('../additional/openaiHelpers');

const LOG = '[ContentClusterEngine]';

const MIN_SUPPORTING = 2;
const MAX_SUPPORTING = 6;
const MIN_CLUSTERS = 2;
const MAX_CLUSTERS = 10;

function normalizePhrase(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(s) {
  return normalizePhrase(s)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function extractPrimaries({ searchIntents, primaryKeywords, keywordDataset } = {}) {
  const fromIntents = (
    searchIntents ||
    keywordDataset?.searchIntents ||
    keywordDataset?.mergedKeywords ||
    keywordDataset?.intents ||
    []
  )
    .map((i) => (typeof i === 'string' ? i : i?.primaryKeyword))
    .filter(Boolean);

  const fromList = (primaryKeywords || keywordDataset?.primaryKeywords || []).filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const p of [...fromIntents, ...fromList]) {
    const phrase = String(p).trim();
    const n = normalizePhrase(phrase);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(phrase);
  }
  return out;
}

function defaultInternalLinks(pillar, supporting = []) {
  const links = [];
  for (const s of supporting) {
    links.push({
      from: pillar,
      to: s,
      relation: 'pillar_to_supporting',
    });
    links.push({
      from: s,
      to: pillar,
      relation: 'supporting_to_pillar',
    });
  }
  // Adjacent supporting ↔ supporting for a light mesh
  for (let i = 0; i < supporting.length - 1; i += 1) {
    links.push({
      from: supporting[i],
      to: supporting[i + 1],
      relation: 'supporting_to_supporting',
    });
    links.push({
      from: supporting[i + 1],
      to: supporting[i],
      relation: 'supporting_to_supporting',
    });
  }
  return links;
}

function targetClusterCount(intentCount) {
  if (intentCount <= 6) return Math.max(MIN_CLUSTERS, Math.ceil(intentCount / 3));
  if (intentCount <= 15) return Math.min(6, Math.max(3, Math.round(intentCount / 4)));
  if (intentCount <= 30) return Math.min(8, Math.max(4, Math.round(intentCount / 5)));
  return Math.min(MAX_CLUSTERS, Math.max(6, Math.round(intentCount / 6)));
}

/**
 * Validate + normalize AI cluster output against the primary set.
 */
function validateAndNormalizeClusters(aiClusters = [], primaries = [], unassignedAi = []) {
  const primaryByNorm = new Map();
  for (const p of primaries) {
    primaryByNorm.set(normalizePhrase(p), p);
  }

  const used = new Set();
  const clusters = [];
  const usedSlugs = new Set();

  for (const raw of aiClusters || []) {
    const clusterName = String(raw.clusterName || raw.name || '').trim();
    let pillarRaw = String(raw.pillarKeyword || '').trim();
    let pillarNorm = normalizePhrase(pillarRaw);
    if (!clusterName || !pillarNorm || !primaryByNorm.has(pillarNorm)) continue;
    if (used.has(pillarNorm)) continue;

    const pillar = primaryByNorm.get(pillarNorm);
    used.add(pillarNorm);

    const supporting = [];
    for (const s of raw.supportingKeywords || []) {
      const sn = normalizePhrase(s);
      if (!sn || sn === pillarNorm || used.has(sn) || !primaryByNorm.has(sn)) continue;
      used.add(sn);
      supporting.push(primaryByNorm.get(sn));
      if (supporting.length >= MAX_SUPPORTING) break;
    }

    // Skip empty/too-thin clusters unless only 1 primary left overall — keep pillar solo only if needed later
    if (supporting.length === 0 && primaries.length > 3) {
      // release pillar back — will try as supporting elsewhere or unassigned
      used.delete(pillarNorm);
      continue;
    }

    let slug = slugify(clusterName) || slugify(pillar);
    let base = slug;
    let i = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${i}`;
      i += 1;
    }
    usedSlugs.add(slug);

    const memberSet = new Set([pillarNorm, ...supporting.map(normalizePhrase)]);
    const publishOrderRaw = Array.isArray(raw.publishOrder) ? raw.publishOrder : [];
    const publishOrder = [];
    const orderSeen = new Set();
    // Pillar always first
    publishOrder.push(pillar);
    orderSeen.add(pillarNorm);
    for (const p of publishOrderRaw) {
      const n = normalizePhrase(p);
      if (!n || !memberSet.has(n) || orderSeen.has(n)) continue;
      orderSeen.add(n);
      publishOrder.push(primaryByNorm.get(n));
    }
    for (const s of supporting) {
      const n = normalizePhrase(s);
      if (!orderSeen.has(n)) {
        orderSeen.add(n);
        publishOrder.push(s);
      }
    }

    let internalLinks = [];
    for (const link of raw.internalLinks || []) {
      const from = String(link.from || '').trim();
      const to = String(link.to || '').trim();
      const fn = normalizePhrase(from);
      const tn = normalizePhrase(to);
      if (!fn || !tn || fn === tn) continue;
      if (!memberSet.has(fn) || !memberSet.has(tn)) continue;
      let relation = String(link.relation || '').toLowerCase();
      if (fn === pillarNorm) relation = 'pillar_to_supporting';
      else if (tn === pillarNorm) relation = 'supporting_to_pillar';
      else relation = 'supporting_to_supporting';
      internalLinks.push({
        from: primaryByNorm.get(fn),
        to: primaryByNorm.get(tn),
        relation,
      });
    }
    if (!internalLinks.length) {
      internalLinks = defaultInternalLinks(pillar, supporting);
    }

    clusters.push({
      clusterName,
      clusterSlug: slug,
      pillarKeyword: pillar,
      supportingKeywords: supporting.map((primaryKeyword) => ({ primaryKeyword })),
      publishOrder,
      internalLinks,
      approved: false,
    });
  }

  // Unassigned = primaries never used + AI unassigned that still exist
  const unassigned = [];
  const unassignedSeen = new Set();
  for (const p of primaries) {
    const n = normalizePhrase(p);
    if (used.has(n) || unassignedSeen.has(n)) continue;
    unassignedSeen.add(n);
    unassigned.push(p);
  }
  for (const u of unassignedAi || []) {
    const phrase = String(u).trim();
    const n = normalizePhrase(phrase);
    if (!n || !primaryByNorm.has(n) || used.has(n) || unassignedSeen.has(n)) continue;
    unassignedSeen.add(n);
    unassigned.push(primaryByNorm.get(n));
  }

  // If we have too few clusters and leftover unassigned, greedily form small clusters
  while (clusters.length < MIN_CLUSTERS && unassigned.length >= MIN_SUPPORTING + 1) {
    const pillar = unassigned.shift();
    const supporting = unassigned.splice(0, Math.min(MAX_SUPPORTING, Math.max(MIN_SUPPORTING, unassigned.length)));
    const clusterName = pillar;
    let slug = slugify(clusterName);
    let base = slug;
    let i = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${i}`;
      i += 1;
    }
    usedSlugs.add(slug);
    clusters.push({
      clusterName,
      clusterSlug: slug,
      pillarKeyword: pillar,
      supportingKeywords: supporting.map((primaryKeyword) => ({ primaryKeyword })),
      publishOrder: [pillar, ...supporting],
      internalLinks: defaultInternalLinks(pillar, supporting),
      approved: false,
    });
  }

  return { clusters, unassigned };
}

/**
 * Run Content Cluster Engine.
 */
async function runContentClusterEngine({
  nicheName,
  categoryName,
  searchIntents,
  primaryKeywords,
  keywordDataset,
  userId = null,
} = {}) {
  const started = Date.now();
  const primaries = extractPrimaries({ searchIntents, primaryKeywords, keywordDataset });

  console.log(`\n${LOG} ▶ runContentClusterEngine`, {
    nicheName,
    categoryName,
    primaryCount: primaries.length,
  });

  if (!primaries.length) {
    return {
      clusters: [],
      unassigned: [],
      nicheName: nicheName || null,
      categoryName: categoryName || null,
      generatedAt: new Date().toISOString(),
      stats: {
        intentCount: 0,
        clusterCount: 0,
        assigned: 0,
        unassigned: 0,
        elapsedMs: Date.now() - started,
      },
    };
  }

  const targetClusters = targetClusterCount(primaries.length);
  let ai = null;

  try {
    const prompt = `
You are a content architect for a niche CONTENT website (Pinterest / SEO silo structure, 2026).

Convert PRIMARY search intents into CONTENT CLUSTERS (silos).

DEPTH OVER COUNT:
- Each cluster = 1 deep PILLAR article + ${MIN_SUPPORTING}–${MAX_SUPPORTING} strong SUPPORTING articles
- Do NOT create thin pages or 20 articles per cluster
- Aim for about ${targetClusters} clusters for ${primaries.length} primaries

Niche: "${nicheName || 'n/a'}"
Category: "${categoryName || 'n/a'}"

PRIMARY KEYWORDS (ONLY these — do not invent new ones):
${JSON.stringify(primaries)}

Return ONLY valid JSON:
{
  "clusters": [
    {
      "clusterName": "short silo name",
      "pillarKeyword": "exact primary from list — broadest hub article",
      "supportingKeywords": ["exact primaries — ${MIN_SUPPORTING} to ${MAX_SUPPORTING}"],
      "publishOrder": ["pillar first", "then supporting in publish order"],
      "internalLinks": [
        { "from": "exact primary", "to": "exact primary", "relation": "pillar_to_supporting|supporting_to_pillar|supporting_to_supporting" }
      ]
    }
  ],
  "unassigned": ["primaries that do not fit cleanly — optional"]
}

RULES:
1) Use ONLY phrases from the PRIMARY KEYWORDS list (exact spelling).
2) Each primary appears in AT MOST one cluster (as pillar OR supporting), never both, never duplicated across clusters.
3) Pillar must NOT appear in supportingKeywords.
4) Prefer grouping by shared search theme / audience (e.g. Healthy Breakfast vs Indian Breakfast).
5) Pillar = broadest commercial/informational hub for that silo.
6) Internal links: pillar ↔ every supporting; optional supporting↔supporting when closely related.
7) Publish order: pillar first, then supporting by importance.
8) Leave weak/orphan intents in unassigned rather than forcing thin clusters.
`.trim();

    ai = await fetchJSONFromOpenAI(prompt, 'CONTENT_CLUSTER_SILO', {
      userId: userId ? String(userId) : undefined,
      promptFrom: 'contentClusterEngine',
      promptFor: `Content clusters - ${categoryName || ''} / ${nicheName || ''}`,
    });
  } catch (err) {
    console.warn(`${LOG} AI clustering failed:`, err?.message || err);
  }

  const { clusters, unassigned } = validateAndNormalizeClusters(
    ai?.clusters || [],
    primaries,
    ai?.unassigned || []
  );

  const assigned = clusters.reduce(
    (n, c) => n + 1 + (c.supportingKeywords?.length || 0),
    0
  );

  const dataset = {
    clusters,
    unassigned,
    nicheName: nicheName || null,
    categoryName: categoryName || null,
    generatedAt: new Date().toISOString(),
    stats: {
      intentCount: primaries.length,
      clusterCount: clusters.length,
      assigned,
      unassigned: unassigned.length,
      elapsedMs: Date.now() - started,
    },
  };

  console.log(`${LOG} ▶ DONE`, dataset.stats);
  return dataset;
}

/**
 * Persist clusters for a project. Resolves primary strings → ProjectKeywords._id
 * and backfills ProjectKeywords.clusterId.
 */
async function saveProjectClusters({
  projectId,
  userId = null,
  clusters = [],
  nicheName = null,
  categoryName = null,
  approved = false,
} = {}) {
  const ProjectClusters = require('../models/projectClusters');
  const ProjectKeywords = require('../models/projectKeywords');

  if (!projectId) {
    return { saved: 0, reason: 'no_projectId' };
  }

  await ProjectClusters.deleteMany({ projectId });
  // Clear previous cluster assignments
  await ProjectKeywords.updateMany({ projectId }, { $set: { clusterId: null } });

  const keywordDocs = await ProjectKeywords.find({ projectId, status: 'active' })
    .select('_id primaryKeyword')
    .lean();
  const idByNorm = new Map();
  for (const doc of keywordDocs) {
    idByNorm.set(normalizePhrase(doc.primaryKeyword), doc._id);
  }

  const docs = [];
  for (const cluster of clusters || []) {
    const pillarKeyword = String(cluster.pillarKeyword || '').trim();
    if (!pillarKeyword) continue;
    const pillarKeywordId = idByNorm.get(normalizePhrase(pillarKeyword)) || null;

    const supportingKeywords = (cluster.supportingKeywords || []).map((s) => {
      const primaryKeyword = typeof s === 'string' ? s : s.primaryKeyword;
      return {
        primaryKeyword: String(primaryKeyword || '').trim(),
        keywordId: idByNorm.get(normalizePhrase(primaryKeyword)) || null,
      };
    }).filter((s) => s.primaryKeyword);

    const supportingKeywordIds = supportingKeywords
      .map((s) => s.keywordId)
      .filter(Boolean);

    const internalLinks = (cluster.internalLinks || []).map((link) => ({
      from: String(link.from || '').trim(),
      to: String(link.to || '').trim(),
      fromKeywordId: idByNorm.get(normalizePhrase(link.from)) || null,
      toKeywordId: idByNorm.get(normalizePhrase(link.to)) || null,
      relation: link.relation || 'supporting_to_pillar',
    })).filter((l) => l.from && l.to);

    const publishOrder =
      Array.isArray(cluster.publishOrder) && cluster.publishOrder.length
        ? cluster.publishOrder.map(String)
        : [pillarKeyword, ...supportingKeywords.map((s) => s.primaryKeyword)];

    docs.push({
      projectId,
      userId: userId || undefined,
      clusterName: cluster.clusterName || pillarKeyword,
      clusterSlug: cluster.clusterSlug || slugify(cluster.clusterName || pillarKeyword),
      pillarKeywordId,
      pillarKeyword,
      supportingKeywordIds,
      supportingKeywords,
      publishOrder,
      internalLinks,
      status: 'active',
      approved: Boolean(approved || cluster.approved),
      nicheName: nicheName || null,
      categoryName: categoryName || null,
      metadata: {},
    });
  }

  if (!docs.length) return { saved: 0, linkedKeywords: 0 };

  let inserted = [];
  try {
    inserted = await ProjectClusters.insertMany(docs, { ordered: false });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    inserted = await ProjectClusters.find({ projectId }).lean();
  }

  let linkedKeywords = 0;
  for (const cluster of inserted) {
    const clusterId = cluster._id;
    const ids = [
      cluster.pillarKeywordId,
      ...(cluster.supportingKeywordIds || []),
    ].filter(Boolean);
    if (!ids.length) continue;
    const res = await ProjectKeywords.updateMany(
      { _id: { $in: ids }, projectId },
      { $set: { clusterId } }
    );
    linkedKeywords += res.modifiedCount || 0;
  }

  console.log(`${LOG} saved ProjectClusters`, {
    projectId: String(projectId),
    saved: inserted.length,
    linkedKeywords,
  });

  return { saved: inserted.length, linkedKeywords };
}

module.exports = {
  runContentClusterEngine,
  saveProjectClusters,
  extractPrimaries,
  validateAndNormalizeClusters,
  defaultInternalLinks,
  normalizePhrase,
  slugify,
  MIN_SUPPORTING,
  MAX_SUPPORTING,
};
