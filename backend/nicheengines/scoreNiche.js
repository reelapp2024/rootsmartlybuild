/**
 * Deterministic niche opportunity score from live signals.
 * Avoids static AI defaults (0 / 80) by scoring continuous inputs:
 * volume, competition, Trends interest, related depth, Pinterest fit, specificity.
 */

const VISUAL_HINTS = [
  'diy',
  'decor',
  'decoration',
  'recipe',
  'recipes',
  'outfit',
  'outfits',
  'fashion',
  'home',
  'garden',
  'wedding',
  'craft',
  'crafts',
  'makeup',
  'nail',
  'nails',
  'tattoo',
  'interior',
  'style',
  'printable',
  'printables',
  'photo',
  'photography',
  'art',
  'food',
  'travel',
  'fitness',
  'workout',
  'room',
  'kitchen',
  'bathroom',
  'bedroom',
  'nursery',
  'party',
  'gift',
  'gifts',
  'skincare',
  'hair',
  'pet',
  'pets',
  'baby',
  'kids',
  'parenting',
  'organization',
  'storage',
  'cleaning',
  'wallpaper',
  'furniture',
  'lighting',
];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function parseScore(raw) {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 0 || rounded > 100) return null;
  return rounded;
}

/**
 * Demand points 0–22 from Ads volume or OpenAI High/Med/Low + suggest depth.
 */
function scoreDemand(primary = {}, relatedCount = 0) {
  let pts = 10;
  const avg = Number(primary.avgMonthlySearches);
  if (Number.isFinite(avg) && avg > 0) {
    pts = clamp(Math.round(5 + Math.log10(avg + 1) * 5.8), 3, 22);
  } else {
    const level = String(primary.volumeLevel || '').toLowerCase();
    if (level === 'high') pts = 18;
    else if (level === 'medium') pts = 12;
    else if (level === 'low') pts = 5;
    else pts = 9;
  }

  const sug = Number(primary.suggestionCount) || 0;
  pts += clamp(Math.floor(sug / 3), 0, 2);
  pts += relatedCount >= 6 ? 2 : relatedCount >= 3 ? 1 : 0;

  const aiDemand = parseScore(primary.demandScore);
  if (aiDemand != null) {
    const mapped = Math.round((aiDemand / 100) * 22);
    pts = Math.round(pts * 0.55 + mapped * 0.45);
  }

  return clamp(pts, 0, 22);
}

/** Low competition = better opportunity. 0–14 */
function scoreOpportunity(competition) {
  const c = String(competition || '').toLowerCase();
  if (c === 'low') return 13;
  if (c === 'high') return 4;
  if (c === 'medium') return 8;
  return 7;
}

/** Google Trends continuous interest + direction. 0–16 */
function scoreTrends(summary = {}) {
  let pts = 5;
  const avgI = summary.averageInterest;
  if (typeof avgI === 'number' && Number.isFinite(avgI)) {
    pts = Math.round((clamp(avgI, 0, 100) / 100) * 12);
  }
  const peak = summary.peakInterest;
  if (typeof peak === 'number' && Number.isFinite(peak) && peak >= 70) {
    pts += 1;
  }

  const dir = String(summary.trendDirection || '').toLowerCase();
  if (dir === 'rising') pts += 3;
  else if (dir === 'declining') pts -= 3;
  else if (dir === 'stable') pts += 1;

  const season = String(summary.seasonality || '').toLowerCase();
  if (season === 'strong' || season === 'steady') pts += 1;

  return clamp(pts, 0, 16);
}

/** Related / long-tail depth. 0–8 */
function scoreKeywordDepth(related = []) {
  const n = Array.isArray(related) ? related.length : 0;
  if (n === 0) return 1;
  if (n <= 2) return 3;
  if (n <= 4) return 5;
  if (n <= 6) return 6;
  return 8;
}

/** Visual / Pinterest affinity — prefer live pin signals, else text heuristic. 0–16 */
function scorePinterestFit(nicheName = '', categoryName = '', pinterest = {}) {
  const pinScore = parseScore(pinterest?.score);
  if (pinScore != null) {
    return clamp(Math.round((pinScore / 100) * 16), 2, 16);
  }

  const text = `${nicheName} ${categoryName}`.toLowerCase();
  let hits = 0;
  for (const w of VISUAL_HINTS) {
    if (text.includes(w)) hits += 1;
  }
  if (/\b(ideas?|inspiration|how to|tips|guide|aesthetic)\b/i.test(text)) hits += 1;
  return clamp(Math.round(4 + hits * 1.8), 2, 16);
}

/** Amazon affiliate density from live/hybrid amazon signals. 0–14 */
function scoreAmazonFit(amazon = {}) {
  const amzScore = parseScore(amazon?.score);
  if (amzScore != null) {
    return clamp(Math.round((amzScore / 100) * 14), 1, 14);
  }
  const suggestCount = Array.isArray(amazon?.suggestions) ? amazon.suggestions.length : 0;
  if (suggestCount >= 8) return 10;
  if (suggestCount >= 4) return 7;
  if (suggestCount >= 1) return 4;
  return 3;
}

/** Multi-word niches tend to convert better for content sites. 0–10 */
function scoreSpecificity(nicheName = '') {
  const words = String(nicheName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let pts = 3;
  if (words.length >= 4) pts = 9;
  else if (words.length === 3) pts = 8;
  else if (words.length === 2) pts = 6;
  else pts = 3;
  if (String(nicheName).length >= 28) pts = Math.min(10, pts + 1);
  return clamp(Math.round(pts), 0, 10);
}

/**
 * @returns {{ overallScore: number, breakdown: object, formula: string }}
 */
function computeSignalScore({
  ads = {},
  trends = {},
  pinterest = {},
  amazon = {},
  nicheName = '',
  categoryName = '',
} = {}) {
  const primary = ads?.primary || {};
  const related = ads?.related || [];
  const summary = trends?.summary || {};

  const demand = scoreDemand(primary, related.length);
  const opportunity = scoreOpportunity(primary.competition);
  const trendsPts = scoreTrends(summary);
  const keywordDepth = scoreKeywordDepth(related);
  const pinterestFit = scorePinterestFit(nicheName, categoryName, pinterest);
  const amazonFit = scoreAmazonFit(amazon);
  const specificity = scoreSpecificity(nicheName);

  const overallScore = clamp(
    Math.round(
      demand + opportunity + trendsPts + keywordDepth + pinterestFit + amazonFit + specificity
    ),
    5,
    98
  );

  return {
    overallScore,
    breakdown: {
      demand: {
        points: demand,
        max: 22,
        source: ads?.mode || 'none',
        volumeLevel: primary.volumeLevel || null,
        avgMonthlySearches: primary.avgMonthlySearches ?? null,
      },
      opportunity: { points: opportunity, max: 14, competition: primary.competition || null },
      trends: {
        points: trendsPts,
        max: 16,
        source: trends?.mode || 'none',
        averageInterest: summary.averageInterest ?? null,
        trendDirection: summary.trendDirection || null,
        seasonality: summary.seasonality || null,
      },
      keywordDepth: { points: keywordDepth, max: 8, relatedCount: related.length },
      pinterestFit: {
        points: pinterestFit,
        max: 16,
        source: pinterest?.mode || 'heuristic',
        level: pinterest?.level || null,
        score: pinterest?.score ?? null,
      },
      amazonFit: {
        points: amazonFit,
        max: 14,
        source: amazon?.mode || 'none',
        level: amazon?.level || null,
        score: amazon?.score ?? null,
      },
      specificity: {
        points: specificity,
        max: 10,
        wordCount: String(nicheName || '').trim().split(/\s+/).filter(Boolean).length,
      },
    },
    formula:
      'demand(0-22)+opportunity(0-14)+trends(0-16)+keywordDepth(0-8)+pinterestFit(0-16)+amazonFit(0-14)+specificity(0-10)',
  };
}

/**
 * Merge signal engine with AI score.
 * Ignores AI overallScore when missing, 0, or copy-paste schema defaults.
 */
function mergeOverallScore(signalScore, aiOverallScore) {
  const signal = signalScore?.overallScore ?? 50;
  const ai = parseScore(aiOverallScore);

  // Treat 0 as invalid (model often copies schema example "overallScore": 0)
  if (ai == null || ai === 0) {
    return {
      overallScore: signal,
      method: 'signal_engine',
      signalScore: signal,
      aiScore: ai,
      note: 'Used live signal engine (AI overallScore missing/0 ignored).',
    };
  }

  // Hybrid: signals weigh more so Trends/Ads actually move the needle
  const hybrid = Math.round(signal * 0.65 + ai * 0.35);
  return {
    overallScore: clamp(hybrid, 5, 98),
    method: 'hybrid_signal_ai',
    signalScore: signal,
    aiScore: ai,
    note: '65% live signals + 35% AI judgment.',
  };
}

/**
 * Build richer qualitative fallback when OpenAI analyst fails entirely.
 */
function buildHeuristicAnalysis({ ads, trends, pinterest, amazon, nicheName, categoryName, signalMerge }) {
  const primary = ads?.primary || {};
  const summary = trends?.summary || {};
  const score = signalMerge?.overallScore ?? 50;

  const volLevel = primary.volumeLevel || 'Medium';
  const comp = primary.competition || 'Medium';
  const pinLevel = pinterest?.level || (scorePinterestFit(nicheName, categoryName, pinterest) >= 10 ? 'High' : 'Medium');
  const amzLevel = amazon?.level || 'Medium';

  let verdict;
  if (score >= 72) {
    verdict = `Go — "${nicheName}" shows solid demand/trend/Pinterest/Amazon signals (score ${score}). Validate with a Phase-1 content batch before scaling.`;
  } else if (score >= 48) {
    verdict = `Caution — "${nicheName}" is workable but not a slam dunk (score ${score}). Tighten angle, check SERP & Pinterest CTR early.`;
  } else {
    verdict = `Avoid / rethink — "${nicheName}" scores weak on current signals (${score}). Consider a more specific long-tail niche.`;
  }

  return {
    competition: {
      level: comp,
      summary: `Competition signal: ${comp} (${ads?.dataLabel || 'estimate'} via ${ads?.mode || 'n/a'}).`,
    },
    searches: {
      level: volLevel,
      summary: `Demand: ${primary.volumeRange || volLevel} from ${ads?.mode || 'signals'}.`,
    },
    pinterestPotential: {
      level: pinLevel,
      summary:
        pinterest?.summary ||
        `Pinterest signal via ${pinterest?.mode || 'heuristic'} (score ${pinterest?.score ?? 'n/a'}).`,
    },
    affiliatePotential: {
      level: amzLevel,
      summary:
        amazon?.summary ||
        `Amazon/affiliate signal via ${amazon?.mode || 'n/a'} (score ${amazon?.score ?? 'n/a'}).`,
    },
    adsPotential: {
      level: comp === 'High' ? 'Medium' : 'Medium',
      summary: 'Paid ads need CPC checks; use organic Pinterest first if budget is limited.',
    },
    digitalProductPotential: {
      level: /\b(printable|planner|checklist|template|workbook|guide)\b/i.test(nicheName)
        ? 'High'
        : 'Medium',
      summary: 'Digital products work best when how-to / template intent is clear.',
    },
    difficulty: {
      level: comp === 'High' ? 'High' : comp === 'Low' ? 'Low' : 'Medium',
      summary: `Difficulty inferred from competition (${comp}) and niche specificity.`,
    },
    seasonality: {
      level:
        summary.seasonality === 'strong'
          ? 'Strong'
          : summary.seasonality === 'moderate'
            ? 'Moderate'
            : summary.seasonality === 'steady'
              ? 'Steady'
              : 'Unknown',
      summary: `Trends: ${summary.trendDirection || 'unknown'} · seasonality ${summary.seasonality || 'unknown'} · avg interest ${summary.averageInterest ?? 'n/a'}.`,
    },
    overallScore: score,
    verdict,
    recommendedNextSteps: [
      'Publish 8–12 Phase-1 articles on the strongest related keywords',
      'Test 15–20 Pinterest pins and measure saves/CTR before scaling',
      'Spot-check Amazon bestsellers for affiliate angles before monetizing',
    ],
    _fallback: true,
  };
}

module.exports = {
  computeSignalScore,
  mergeOverallScore,
  buildHeuristicAnalysis,
  parseScore,
  clamp,
};
