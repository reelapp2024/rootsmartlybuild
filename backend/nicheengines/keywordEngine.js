/**
 * Keyword Engine — Master Keyword Database builder for content websites.
 *
 * Architecture:
 *   1) Discover raw research buckets (Main / Long-tail / Question / Pinterest / Seasonal)
 *      using existing googleAds / googleTrends / pinterest / OpenAI (no duplicate APIs).
 *   2) Enrich metadata (Volume · Trend · Pinterest · Competition).
 *   3) Normalize into UNIQUE search intents:
 *        - One primaryKeyword per intent (= one future article)
 *        - relatedKeywords / faqKeywords / pinterestKeywords / seasonalKeywords attached
 *        - Questions & Pinterest tags NEVER become separate intents
 *        - Long-tail & Seasonal: AI decides attach vs new primary
 *   4) Persist via ProjectKeywords collection (one doc = one intent).
 *
 * Research buckets may still be shown in the UI, but the source of truth is searchIntents.
 */

const { googleAds, googleTrends, pinterest } = require('./index');
const { fetchJSONFromOpenAI } = require('../additional/openaiHelpers');

const LOG = '[KeywordEngine]';

function normalizePhrase(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyIntent(s) {
  return normalizePhrase(s)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function uniqByNorm(list) {
  const seen = new Set();
  const out = [];
  for (const item of list || []) {
    const kw = typeof item === 'string' ? item : item?.keyword;
    const n = normalizePhrase(kw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(
      typeof item === 'string'
        ? { keyword: String(kw).trim() }
        : { ...item, keyword: String(kw).trim() }
    );
  }
  return out;
}

function phrasesOnly(list) {
  return uniqByNorm(list).map((r) => r.keyword);
}

function bucketPush(buckets, bucket, keyword, extra = {}) {
  if (!keyword) return;
  if (!buckets[bucket]) buckets[bucket] = [];
  buckets[bucket].push({ keyword: String(keyword).trim(), bucket, ...extra });
}

function emptyMeta(row = {}) {
  return {
    volume: row.volumeRange || row.volumeLevel || row.volume || null,
    volumeLevel: row.volumeLevel || null,
    volumeRange: row.volumeRange || null,
    searchVolume: row.searchVolume ?? null,
    trend: row.trendDirection || row.trend || null,
    trendDirection: row.trendDirection || row.trend || null,
    rising: Boolean(row.rising),
    pinterestDemand: row.pinterestLevel || row.pinterest || row.pinterestDemand || null,
    pinterestLevel: row.pinterestLevel || row.pinterest || null,
    pinterestScore: row.pinterestScore ?? null,
    competition: row.competition || null,
    seasonality: row.seasonality || null,
    source: row.source || null,
  };
}

function toPublicKeywordRow(row) {
  const meta = emptyMeta(row);
  return {
    keyword: row.keyword || '',
    volume: meta.volume,
    volumeLevel: meta.volumeLevel,
    volumeRange: meta.volumeRange,
    searchVolume: meta.searchVolume,
    trend: meta.trend,
    trendDirection: meta.trendDirection,
    rising: meta.rising,
    pinterest: meta.pinterestDemand,
    pinterestLevel: meta.pinterestLevel,
    pinterestScore: meta.pinterestScore,
    competition: meta.competition,
    seasonality: meta.seasonality,
    source: meta.source,
    bucket: row.bucket || null,
    enrichMode: row.enrichMode || null,
  };
}

/**
 * Discover raw keyword candidates into research buckets.
 */
async function discoverKeywords({
  nicheName,
  categoryName,
  country = 'US',
  language = 'EN',
  contentGoal = '',
  userId = null,
} = {}) {
  const seed = String(nicheName || '').trim();
  console.log(`${LOG} discover START`, { seed, categoryName, country, language });

  const demand = await googleAds.getKeywordDemand({
    keyword: seed,
    country,
    language,
    categoryName,
    userId,
  });

  const relatedFromAds = (demand?.related || [])
    .map((r) => ({
      keyword: r.keyword,
      searchVolume: r.avgMonthlySearches ?? null,
      volumeLevel: r.volumeLevel || null,
      volumeRange: r.volumeRange || null,
      competition: r.competition || null,
      source: demand?.mode || 'ads',
    }))
    .filter((r) => r.keyword);

  const suggest = await googleAds.fetchGoogleSuggest(seed, String(language || 'en').toLowerCase());
  const suggestRows = (suggest || []).slice(0, 15).map((k) => ({
    keyword: k,
    source: 'google_suggest',
  }));

  const extraSuggest = [];
  for (const rel of relatedFromAds.slice(0, 3)) {
    try {
      const more = await googleAds.fetchGoogleSuggest(
        rel.keyword,
        String(language || 'en').toLowerCase()
      );
      (more || []).slice(0, 6).forEach((k) => {
        extraSuggest.push({ keyword: k, source: 'google_suggest' });
      });
    } catch {
      /* ignore */
    }
  }

  const seedRows = [
    {
      keyword: seed,
      searchVolume: demand?.primary?.avgMonthlySearches ?? null,
      volumeLevel: demand?.primary?.volumeLevel || null,
      competition: demand?.primary?.competition || null,
      volumeRange: demand?.primary?.volumeRange || null,
      source: demand?.mode || 'seed',
    },
  ];

  let aiBuckets = null;
  try {
    const prompt = `
You are a keyword research strategist for a Pinterest / niche CONTENT website.

Build RAW research keyword lists for this niche (NOT final article list yet).

Return ONLY valid JSON:
{
  "mainKeywords": ["8-14 head / pillar terms"],
  "longTailKeywords": ["18-28 specific long-tail phrases (4–8 words)"],
  "questionKeywords": ["10-16 natural search questions"],
  "pinterestKeywords": ["12-18 visual / aesthetic / pin-title phrases"],
  "seasonalKeywords": ["6-10 seasonal or timely phrases (realistic; empty if none)"]
}

Rules:
- Niche: "${seed}"
- Category: "${categoryName || 'n/a'}"
- Country: ${country}
- Language: ${language}
- Content goal: ${contentGoal || 'n/a'}
- Use real search/pin language
- Prefer commercial + informational intent
- Minimize exact duplicates across buckets

Inspiration:
${JSON.stringify(
  [...relatedFromAds, ...suggestRows, ...extraSuggest]
    .slice(0, 30)
    .map((r) => r.keyword)
)}
`.trim();

    aiBuckets = await fetchJSONFromOpenAI(prompt, 'KEYWORD_ENGINE_DISCOVER', {
      userId: userId ? String(userId) : undefined,
      promptFrom: 'keywordEngine',
      promptFor: `Keyword discover - ${categoryName} / ${seed}`,
    });
  } catch (err) {
    console.warn(`${LOG} AI discover failed:`, err?.message || err);
  }

  const buckets = {
    main: [],
    longTail: [],
    questions: [],
    pinterest: [],
    seasonal: [],
  };

  seedRows.forEach((r) => bucketPush(buckets, 'main', r.keyword, r));
  relatedFromAds.slice(0, 10).forEach((r) => bucketPush(buckets, 'main', r.keyword, r));
  suggestRows.forEach((r) => bucketPush(buckets, 'longTail', r.keyword, r));
  extraSuggest.forEach((r) => bucketPush(buckets, 'longTail', r.keyword, r));

  (aiBuckets?.mainKeywords || []).forEach((k) => bucketPush(buckets, 'main', k, { source: 'ai' }));
  (aiBuckets?.longTailKeywords || []).forEach((k) =>
    bucketPush(buckets, 'longTail', k, { source: 'ai' })
  );
  (aiBuckets?.questionKeywords || []).forEach((k) =>
    bucketPush(buckets, 'questions', k, { source: 'ai' })
  );
  (aiBuckets?.pinterestKeywords || []).forEach((k) =>
    bucketPush(buckets, 'pinterest', k, { source: 'ai' })
  );
  (aiBuckets?.seasonalKeywords || []).forEach((k) =>
    bucketPush(buckets, 'seasonal', k, { source: 'ai' })
  );

  // Exact-phrase de-dupe across research buckets (display only — normalize step is authoritative)
  const globalSeen = new Set();
  const priority = ['main', 'longTail', 'questions', 'pinterest', 'seasonal'];
  for (const key of priority) {
    const next = [];
    for (const row of buckets[key]) {
      const n = normalizePhrase(row.keyword);
      if (!n || globalSeen.has(n)) continue;
      globalSeen.add(n);
      next.push(row);
    }
    buckets[key] = next;
  }

  console.log(`${LOG} discover DONE`, {
    main: buckets.main.length,
    longTail: buckets.longTail.length,
    questions: buckets.questions.length,
    pinterest: buckets.pinterest.length,
    seasonal: buckets.seasonal.length,
    rawTotal: globalSeen.size,
  });

  return { buckets, seedDemand: demand, rawTotal: globalSeen.size };
}

async function enrichKeywordsDeep(
  rows,
  { country = 'US', language = 'EN', categoryName = '', userId = null } = {}
) {
  const list = (rows || []).slice(0, 24);
  const concurrency = 4;
  const enriched = new Array(list.length);

  async function enrichOne(row, index) {
    const keyword = row.keyword;
    try {
      const [ads, trends, pin] = await Promise.all([
        row.searchVolume != null && row.volumeLevel
          ? Promise.resolve(null)
          : googleAds.getKeywordDemand({ keyword, country, language, categoryName, userId }),
        googleTrends.getTrendSignals({ keyword, country }),
        pinterest.getPinterestSignals({ keyword, categoryName, userId }),
      ]);

      enriched[index] = {
        ...row,
        searchVolume: row.searchVolume ?? ads?.primary?.avgMonthlySearches ?? null,
        volumeLevel: row.volumeLevel || ads?.primary?.volumeLevel || null,
        volumeRange: row.volumeRange || ads?.primary?.volumeRange || null,
        competition: row.competition || ads?.primary?.competition || null,
        volumeSource: ads?.mode || row.source || null,
        volumeDataLabel: ads?.dataLabel || null,
        trendDirection: trends?.summary?.trendDirection || null,
        seasonality: trends?.summary?.seasonality || null,
        averageInterest: trends?.summary?.averageInterest ?? null,
        rising: Boolean(trends?.summary?.rising),
        trendsMode: trends?.mode || null,
        pinterestScore: pin?.score ?? null,
        pinterestLevel: pin?.level || null,
        pinterestSummary: pin?.summary || null,
        pinterestMode: pin?.mode || null,
        enrichMode: 'deep',
      };
    } catch (err) {
      console.warn(`${LOG} deep enrich failed for "${keyword}":`, err?.message || err);
      enriched[index] = { ...row, enrichError: String(err?.message || err), enrichMode: 'deep' };
    }
  }

  for (let i = 0; i < list.length; i += concurrency) {
    const batch = list.slice(i, i + concurrency);
    await Promise.all(batch.map((row, offset) => enrichOne(row, i + offset)));
  }

  return enriched.filter(Boolean);
}

async function enrichKeywordsBatchAi(rows, { nicheName, categoryName, userId = null } = {}) {
  const list = uniqByNorm(rows || []).slice(0, 120);
  if (!list.length) return [];

  const chunks = [];
  for (let i = 0; i < list.length; i += 40) chunks.push(list.slice(i, i + 40));

  const out = [];
  for (const chunk of chunks) {
    try {
      const prompt = `
Estimate SEO / Pinterest keyword metadata for a niche content site.

Niche: "${nicheName}"
Category: "${categoryName || 'n/a'}"

Return ONLY valid JSON:
{
  "keywords": [
    {
      "keyword": "exact phrase from input",
      "volumeLevel": "Very High|High|Medium|Low",
      "volumeRange": "e.g. 10K–100K or 100K+",
      "trendDirection": "Rising|Stable|Falling|Seasonal",
      "pinterestLevel": "Very High|High|Medium|Low",
      "competition": "High|Medium|Low"
    }
  ]
}

Rules:
- One object per input keyword (same spelling)
- Be realistic for ${nicheName}

INPUT:
${JSON.stringify(chunk.map((r) => r.keyword))}
`.trim();

      const ai = await fetchJSONFromOpenAI(prompt, 'KEYWORD_ENGINE_META_BATCH', {
        userId: userId ? String(userId) : undefined,
        promptFrom: 'keywordEngine',
        promptFor: `Keyword metadata batch - ${nicheName}`,
      });

      const byNorm = new Map();
      for (const row of ai?.keywords || []) {
        const n = normalizePhrase(row.keyword);
        if (n) byNorm.set(n, row);
      }

      for (const row of chunk) {
        const hit = byNorm.get(normalizePhrase(row.keyword));
        out.push({
          ...row,
          volumeLevel: row.volumeLevel || hit?.volumeLevel || null,
          volumeRange: row.volumeRange || hit?.volumeRange || null,
          trendDirection: row.trendDirection || hit?.trendDirection || null,
          rising: String(hit?.trendDirection || row.trendDirection || '')
            .toLowerCase()
            .includes('rising'),
          pinterestLevel: row.pinterestLevel || hit?.pinterestLevel || null,
          competition: row.competition || hit?.competition || null,
          enrichMode: row.enrichMode || 'ai_batch',
        });
      }
    } catch (err) {
      console.warn(`${LOG} AI meta batch failed:`, err?.message || err);
      chunk.forEach((row) => out.push({ ...row, enrichMode: row.enrichMode || 'skipped' }));
    }
  }

  return out;
}

/**
 * Normalize research buckets → unique search intents (Master Keyword Database rows).
 *
 * CRITICAL RULES:
 * - Question keywords NEVER become primary intents → faqKeywords
 * - Pinterest keywords NEVER become primary intents → pinterestKeywords
 * - Long-tail: same intent → relatedKeywords; different → new primary
 * - Seasonal: same intent → seasonalKeywords; different → new primary (keywordType=seasonal)
 * - Every raw phrase appears exactly once across the whole DB
 */
async function normalizeToSearchIntents(
  {
    mainKeywords = [],
    longTailKeywords = [],
    questionKeywords = [],
    pinterestKeywords = [],
    seasonalKeywords = [],
  },
  { nicheName, userId = null } = {}
) {
  const main = phrasesOnly(mainKeywords);
  const longTail = phrasesOnly(longTailKeywords);
  const questions = phrasesOnly(questionKeywords);
  const pins = phrasesOnly(pinterestKeywords);
  const seasonal = phrasesOnly(seasonalKeywords);

  const metaByNorm = new Map();
  for (const row of [
    ...mainKeywords,
    ...longTailKeywords,
    ...questionKeywords,
    ...pinterestKeywords,
    ...seasonalKeywords,
  ]) {
    const n = normalizePhrase(row.keyword);
    if (n && !metaByNorm.has(n)) metaByNorm.set(n, row);
  }

  const rawAll = uniqByNorm([
    ...main.map((k) => ({ keyword: k })),
    ...longTail.map((k) => ({ keyword: k })),
    ...questions.map((k) => ({ keyword: k })),
    ...pins.map((k) => ({ keyword: k })),
    ...seasonal.map((k) => ({ keyword: k })),
  ]).map((r) => r.keyword);

  let ai = null;
  try {
    const prompt = `
You build a MASTER KEYWORD DATABASE for a niche content website.

Entity = SEARCH INTENT (not keyword type).
One search intent = one future article = one primaryKeyword.

INPUT buckets (research only):
{
  "mainKeywords": ${JSON.stringify(main)},
  "longTailKeywords": ${JSON.stringify(longTail)},
  "questionKeywords": ${JSON.stringify(questions)},
  "pinterestKeywords": ${JSON.stringify(pins)},
  "seasonalKeywords": ${JSON.stringify(seasonal)}
}

Niche: "${nicheName}"

Return ONLY valid JSON:
{
  "searchIntents": [
    {
      "primaryKeyword": "canonical phrase",
      "relatedKeywords": ["same-intent variants — NOT separate articles"],
      "faqKeywords": ["questions attached to THIS intent"],
      "pinterestKeywords": ["pin/aesthetic tags for THIS intent"],
      "seasonalKeywords": ["seasonal variants that share THIS intent"],
      "keywordType": "main|longtail|seasonal"
    }
  ]
}

HARD RULES:
1) Questions NEVER create a new search intent. Always attach as faqKeywords on the best parent.
2) Pinterest tags NEVER create a new search intent. Always attach as pinterestKeywords on the best parent.
3) Long-tail: SAME intent → relatedKeywords; DIFFERENT intent → new primary (keywordType=longtail).
4) Seasonal: SAME intent → seasonalKeywords on parent; DIFFERENT intent (e.g. "Christmas Bedroom Decor" vs "Bedroom Decor") → new primary with keywordType=seasonal.
5) Merge true duplicates / cannibalizing variants:
   - "Small Bedroom Ideas" + "Ideas for Small Bedrooms" + "Small Bedroom Decorating Ideas" → ONE intent
6) Keep meaningfully different intents separate:
   - "Healthy Breakfast Recipes" vs "Easy Breakfast Recipes" → TWO intents
7) Every phrase from ALL input buckets must appear EXACTLY ONCE as primary OR in related/faq/pinterest/seasonal.
8) Prefer clear commercial/informational head terms as primaryKeyword.
9) Do NOT invent phrases that are not in the input.
`.trim();

    ai = await fetchJSONFromOpenAI(prompt, 'KEYWORD_ENGINE_NORMALIZE_INTENTS', {
      userId: userId ? String(userId) : undefined,
      promptFrom: 'keywordEngine',
      promptFor: `Keyword normalize intents - ${nicheName}`,
    });
  } catch (err) {
    console.warn(`${LOG} normalize AI failed:`, err?.message || err);
  }

  const used = new Set();
  const searchIntents = [];

  const takeUnique = (list) => {
    const out = [];
    for (const raw of list || []) {
      const phrase = String(raw || '').trim();
      const n = normalizePhrase(phrase);
      if (!n || used.has(n)) continue;
      used.add(n);
      out.push(phrase);
    }
    return out;
  };

  const questionSet = new Set(questions.map(normalizePhrase));
  const pinSet = new Set(pins.map(normalizePhrase));
  const seasonalSet = new Set(seasonal.map(normalizePhrase));

  for (const intent of ai?.searchIntents || []) {
    let primary = String(intent.primaryKeyword || '').trim();
    let pNorm = normalizePhrase(primary);
    if (!primary || !pNorm) continue;

    // Never allow a pure question / pin tag as primary if we can avoid it
    if (questionSet.has(pNorm) || pinSet.has(pNorm)) {
      continue;
    }
    if (used.has(pNorm)) continue;
    used.add(pNorm);

    const relatedKeywords = takeUnique(intent.relatedKeywords || []);
    const faqKeywords = takeUnique(intent.faqKeywords || []);
    const pinterestKw = takeUnique(intent.pinterestKeywords || []);
    const seasonalKw = takeUnique(intent.seasonalKeywords || []);

    let keywordType = String(intent.keywordType || 'main').toLowerCase();
    if (!['main', 'longtail', 'seasonal', 'question_parent', 'other'].includes(keywordType)) {
      keywordType = seasonalSet.has(pNorm) ? 'seasonal' : 'main';
    }

    const primaryMeta = emptyMeta(metaByNorm.get(pNorm) || { keyword: primary });

    searchIntents.push({
      primaryKeyword: primary,
      relatedKeywords,
      faqKeywords,
      pinterestKeywords: pinterestKw,
      seasonalKeywords: seasonalKw,
      keywordType,
      searchIntentSlug: slugifyIntent(primary),
      volume: primaryMeta.volume,
      volumeLevel: primaryMeta.volumeLevel,
      volumeRange: primaryMeta.volumeRange,
      searchVolume: primaryMeta.searchVolume,
      trend: primaryMeta.trend,
      seasonality: primaryMeta.seasonality,
      pinterestDemand: primaryMeta.pinterestDemand,
      competition: primaryMeta.competition,
      source: primaryMeta.source,
      // compat aliases for older UI
      secondaryKeywords: relatedKeywords,
      intentId: `intent_${searchIntents.length + 1}`,
      intentLabel: primary,
      primaryData: metaByNorm.get(pNorm) || { keyword: primary },
    });
  }

  // Attach leftover questions / pins / seasonal to best parent by token overlap
  const leftoverQuestions = questions.filter((q) => !used.has(normalizePhrase(q)));
  const leftoverPins = pins.filter((p) => !used.has(normalizePhrase(p)));
  const leftoverSeasonal = seasonal.filter((s) => !used.has(normalizePhrase(s)));
  const leftoverMainLong = [...main, ...longTail].filter((k) => !used.has(normalizePhrase(k)));

  function scoreParent(phrase, intent) {
    const tokens = new Set(normalizePhrase(phrase).split(' ').filter((t) => t.length > 2));
    const parentTokens = new Set(
      normalizePhrase(intent.primaryKeyword)
        .split(' ')
        .filter((t) => t.length > 2)
    );
    let score = 0;
    for (const t of tokens) if (parentTokens.has(t)) score += 1;
    return score;
  }

  function attachToBest(phrase, field) {
    if (!searchIntents.length) return false;
    let best = searchIntents[0];
    let bestScore = -1;
    for (const intent of searchIntents) {
      const sc = scoreParent(phrase, intent);
      if (sc > bestScore) {
        bestScore = sc;
        best = intent;
      }
    }
    const n = normalizePhrase(phrase);
    if (used.has(n)) return true;
    used.add(n);
    best[field] = [...(best[field] || []), phrase];
    if (field === 'relatedKeywords') {
      best.secondaryKeywords = best.relatedKeywords;
    }
    return true;
  }

  for (const q of leftoverQuestions) attachToBest(q, 'faqKeywords');
  for (const p of leftoverPins) attachToBest(p, 'pinterestKeywords');

  // Leftover seasonal with weak overlap → new seasonal primary; else attach
  for (const s of leftoverSeasonal) {
    if (!searchIntents.length) {
      used.add(normalizePhrase(s));
      const meta = emptyMeta(metaByNorm.get(normalizePhrase(s)) || { keyword: s });
      searchIntents.push({
        primaryKeyword: s,
        relatedKeywords: [],
        faqKeywords: [],
        pinterestKeywords: [],
        seasonalKeywords: [],
        keywordType: 'seasonal',
        searchIntentSlug: slugifyIntent(s),
        ...meta,
        secondaryKeywords: [],
        intentId: `intent_${searchIntents.length + 1}`,
        intentLabel: s,
        primaryData: metaByNorm.get(normalizePhrase(s)) || { keyword: s },
      });
      continue;
    }
    let best = searchIntents[0];
    let bestScore = -1;
    for (const intent of searchIntents) {
      const sc = scoreParent(s, intent);
      if (sc > bestScore) {
        bestScore = sc;
        best = intent;
      }
    }
    if (bestScore >= 2) {
      attachToBest(s, 'seasonalKeywords');
    } else {
      const n = normalizePhrase(s);
      if (used.has(n)) continue;
      used.add(n);
      const meta = emptyMeta(metaByNorm.get(n) || { keyword: s });
      searchIntents.push({
        primaryKeyword: s,
        relatedKeywords: [],
        faqKeywords: [],
        pinterestKeywords: [],
        seasonalKeywords: [],
        keywordType: 'seasonal',
        searchIntentSlug: slugifyIntent(s),
        volume: meta.volume,
        volumeLevel: meta.volumeLevel,
        volumeRange: meta.volumeRange,
        searchVolume: meta.searchVolume,
        trend: meta.trend,
        seasonality: meta.seasonality,
        pinterestDemand: meta.pinterestDemand,
        competition: meta.competition,
        source: meta.source,
        secondaryKeywords: [],
        intentId: `intent_${searchIntents.length + 1}`,
        intentLabel: s,
        primaryData: metaByNorm.get(n) || { keyword: s },
      });
    }
  }

  // Leftover main/long-tail → new primaries (never drop)
  for (const k of leftoverMainLong) {
    const n = normalizePhrase(k);
    if (used.has(n) || questionSet.has(n) || pinSet.has(n)) continue;
    used.add(n);
    const meta = emptyMeta(metaByNorm.get(n) || { keyword: k });
    const isLong = longTail.some((x) => normalizePhrase(x) === n);
    searchIntents.push({
      primaryKeyword: k,
      relatedKeywords: [],
      faqKeywords: [],
      pinterestKeywords: [],
      seasonalKeywords: [],
      keywordType: isLong ? 'longtail' : 'main',
      searchIntentSlug: slugifyIntent(k),
      volume: meta.volume,
      volumeLevel: meta.volumeLevel,
      volumeRange: meta.volumeRange,
      searchVolume: meta.searchVolume,
      trend: meta.trend,
      seasonality: meta.seasonality,
      pinterestDemand: meta.pinterestDemand,
      competition: meta.competition,
      source: meta.source,
      secondaryKeywords: [],
      intentId: `intent_${searchIntents.length + 1}`,
      intentLabel: k,
      primaryData: metaByNorm.get(n) || { keyword: k },
    });
  }

  // Re-number intentIds
  searchIntents.forEach((intent, idx) => {
    intent.intentId = `intent_${idx + 1}`;
  });

  const covered = used.size;
  const duplicatesMerged = Math.max(0, rawAll.length - searchIntents.length);

  return {
    searchIntents,
    stats: {
      rawKeywordsFound: rawAll.length,
      uniqueSearchIntents: searchIntents.length,
      duplicatesMerged,
      phrasesCovered: covered,
    },
  };
}

/**
 * Persist search intents into ProjectKeywords (replace set for project).
 */
async function saveProjectKeywords({
  projectId,
  userId = null,
  searchIntents = [],
  nicheName = null,
  categoryName = null,
  country = null,
  language = null,
} = {}) {
  const ProjectKeywords = require('../models/projectKeywords');
  if (!projectId) {
    return { saved: 0, reason: 'no_projectId' };
  }

  await ProjectKeywords.deleteMany({ projectId });

  const docs = (searchIntents || []).map((intent) => ({
    projectId,
    userId: userId || undefined,
    primaryKeyword: intent.primaryKeyword,
    relatedKeywords: intent.relatedKeywords || [],
    faqKeywords: intent.faqKeywords || [],
    pinterestKeywords: intent.pinterestKeywords || [],
    seasonalKeywords: intent.seasonalKeywords || [],
    keywordType: intent.keywordType || 'main',
    searchIntentSlug: intent.searchIntentSlug || slugifyIntent(intent.primaryKeyword),
    volume: intent.volume || intent.volumeRange || intent.volumeLevel || null,
    volumeLevel: intent.volumeLevel || null,
    volumeRange: intent.volumeRange || null,
    searchVolume: intent.searchVolume ?? null,
    trend: intent.trend || intent.trendDirection || null,
    seasonality: intent.seasonality || null,
    pinterestDemand: intent.pinterestDemand || intent.pinterestLevel || null,
    competition: intent.competition || null,
    source: intent.source || null,
    country: country || null,
    language: language || null,
    nicheName: nicheName || null,
    categoryName: categoryName || null,
    status: 'active',
    articleCreated: false,
    clusterId: null,
    metadata: {
      intentId: intent.intentId || null,
      enrichMode: intent.primaryData?.enrichMode || null,
    },
  }));

  if (!docs.length) return { saved: 0 };

  try {
    await ProjectKeywords.insertMany(docs, { ordered: false });
  } catch (err) {
    // Ignore duplicate-key races; still report count
    if (err?.code !== 11000) throw err;
  }

  console.log(`${LOG} saved ProjectKeywords`, { projectId: String(projectId), saved: docs.length });
  return { saved: docs.length };
}

/**
 * Full Keyword Engine run — research buckets + normalized Master Keyword Database.
 */
async function runKeywordEngine({
  nicheName,
  categoryName,
  country = 'US',
  language = 'EN',
  contentGoal = '',
  userId = null,
  projectId = null,
} = {}) {
  const started = Date.now();
  console.log(`\n${LOG} ▶ runKeywordEngine`, { nicheName, categoryName, country, language, projectId });

  const { buckets, seedDemand, rawTotal } = await discoverKeywords({
    nicheName,
    categoryName,
    country,
    language,
    contentGoal,
    userId,
  });

  const toDeep = uniqByNorm([
    ...buckets.main.slice(0, 8),
    ...buckets.longTail.slice(0, 6),
    ...buckets.questions.slice(0, 4),
    ...buckets.pinterest.slice(0, 4),
    ...buckets.seasonal.slice(0, 2),
  ]);

  const deepEnriched = await enrichKeywordsDeep(toDeep, {
    country,
    language,
    categoryName,
    userId,
  });
  const deepMap = new Map(deepEnriched.map((e) => [normalizePhrase(e.keyword), e]));

  const flatRaw = uniqByNorm([
    ...buckets.main,
    ...buckets.longTail,
    ...buckets.questions,
    ...buckets.pinterest,
    ...buckets.seasonal,
  ]).map((row) => deepMap.get(normalizePhrase(row.keyword)) || row);

  const needBatch = flatRaw.filter(
    (r) => !r.volumeLevel || !r.trendDirection || !r.pinterestLevel || !r.competition
  );
  const batchEnriched = await enrichKeywordsBatchAi(needBatch, {
    nicheName,
    categoryName,
    userId,
  });
  const batchMap = new Map(batchEnriched.map((e) => [normalizePhrase(e.keyword), e]));

  const applyMeta = (list, bucketName) =>
    (list || []).map((row) => {
      const n = normalizePhrase(row.keyword);
      const hit = deepMap.get(n) || batchMap.get(n) || row;
      return toPublicKeywordRow({ ...hit, bucket: bucketName });
    });

  const mainKeywords = applyMeta(buckets.main, 'main');
  const longTailKeywords = applyMeta(buckets.longTail, 'longTail');
  const questionKeywords = applyMeta(buckets.questions, 'question');
  const pinterestKeywords = applyMeta(buckets.pinterest, 'pinterest');
  const seasonalKeywords = applyMeta(buckets.seasonal, 'seasonal');

  const { searchIntents, stats: normalizeStats } = await normalizeToSearchIntents(
    {
      mainKeywords,
      longTailKeywords,
      questionKeywords,
      pinterestKeywords,
      seasonalKeywords,
    },
    { nicheName, userId }
  );

  // Primary keywords list for Content Clusters (ONLY primaries)
  const primaryKeywords = searchIntents.map((i) => i.primaryKeyword).filter(Boolean);

  // Compat: mergedKeywords / intents shaped for older UI
  const mergedKeywords = searchIntents.map((intent) => ({
    primaryKeyword: intent.primaryKeyword,
    relatedKeywords: intent.relatedKeywords || [],
    secondaryKeywords: intent.relatedKeywords || [],
    faqKeywords: intent.faqKeywords || [],
    pinterestKeywords: intent.pinterestKeywords || [],
    seasonalKeywords: intent.seasonalKeywords || [],
    keywordType: intent.keywordType,
    searchIntentSlug: intent.searchIntentSlug,
    intentId: intent.intentId,
    intentLabel: intent.intentLabel,
    volume: intent.volume,
    volumeLevel: intent.volumeLevel,
    volumeRange: intent.volumeRange,
    trend: intent.trend,
    trendDirection: intent.trend,
    pinterest: intent.pinterestDemand,
    pinterestLevel: intent.pinterestDemand,
    competition: intent.competition,
    seasonality: intent.seasonality,
    primaryData: intent.primaryData,
  }));

  let persist = null;
  if (projectId) {
    persist = await saveProjectKeywords({
      projectId,
      userId,
      searchIntents,
      nicheName,
      categoryName,
      country,
      language,
    });
  }

  const dataset = {
    // Research view (UI only — not the source of truth for articles)
    mainKeywords,
    longTailKeywords,
    questionKeywords,
    pinterestKeywords,
    seasonalKeywords,
    buckets: {
      mainKeywords,
      longTailKeywords,
      questionKeywords,
      pinterestKeywords,
      seasonalKeywords,
    },

    // Master Keyword Database (source of truth)
    searchIntents,
    mergedKeywords,
    intents: mergedKeywords,
    primaryKeywords,
    totalKeywords: normalizeStats.rawKeywordsFound || rawTotal,
    uniqueSearchIntents: normalizeStats.uniqueSearchIntents,
    rawKeywordsFound: normalizeStats.rawKeywordsFound || rawTotal,
    duplicatesMerged: normalizeStats.duplicatesMerged,

    nicheName,
    categoryName,
    country,
    language,
    contentGoal: contentGoal || null,
    generatedAt: new Date().toISOString(),
    seed: {
      keyword: nicheName,
      volumeLevel: seedDemand?.primary?.volumeLevel || null,
      volumeRange: seedDemand?.primary?.volumeRange || null,
      competition: seedDemand?.primary?.competition || null,
      mode: seedDemand?.mode || null,
      dataLabel: seedDemand?.dataLabel || null,
    },
    stats: {
      rawKeywordsFound: normalizeStats.rawKeywordsFound || rawTotal,
      uniqueSearchIntents: normalizeStats.uniqueSearchIntents,
      duplicatesMerged: normalizeStats.duplicatesMerged,
      totalKeywords: normalizeStats.rawKeywordsFound || rawTotal,
      intentCount: normalizeStats.uniqueSearchIntents,
      primaryArticleCount: normalizeStats.uniqueSearchIntents,
      enrichedDeepCount: deepEnriched.length,
      enrichedBatchCount: batchEnriched.length,
      persisted: persist?.saved || 0,
      elapsedMs: Date.now() - started,
    },
    persist,
  };

  console.log(`${LOG} ▶ DONE`, {
    rawKeywordsFound: dataset.rawKeywordsFound,
    uniqueSearchIntents: dataset.uniqueSearchIntents,
    duplicatesMerged: dataset.duplicatesMerged,
    persisted: persist?.saved || 0,
    elapsedMs: dataset.stats.elapsedMs,
  });

  return dataset;
}

module.exports = {
  runKeywordEngine,
  discoverKeywords,
  enrichKeywordsDeep,
  enrichKeywordsBatchAi,
  normalizeToSearchIntents,
  saveProjectKeywords,
  normalizePhrase,
  slugifyIntent,
  // legacy alias
  enrichKeywords: enrichKeywordsDeep,
  mergeByIntent: async (allKeywords, opts) => {
    const rows = uniqByNorm(allKeywords).map((k) => toPublicKeywordRow(k));
    const { searchIntents } = await normalizeToSearchIntents(
      {
        mainKeywords: rows,
        longTailKeywords: [],
        questionKeywords: [],
        pinterestKeywords: [],
        seasonalKeywords: [],
      },
      opts
    );
    return {
      intents: searchIntents,
      mergedKeywords: searchIntents,
    };
  },
};
