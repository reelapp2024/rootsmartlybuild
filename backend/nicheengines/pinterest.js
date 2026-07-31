/**
 * Pinterest niche signals for Content Website analysis.
 *
 * With credentials (PINTEREST_API_MODE=true + PINTEREST_ACCESS_TOKEN):
 *   → Official Pinterest API v5 search/pins
 *
 * Without credentials (always works):
 *   → Google CSE site:pinterest.com (if GOOGLE_API_KEY set)
 *   → OpenAI pin-potential estimate
 *   → Visual keyword heuristic
 */

const axios = require('axios');

const LOG = '[NicheAnalysis][Pinterest]';

function isPinterestApiMode() {
  return String(process.env.PINTEREST_API_MODE || '').toLowerCase() === 'true';
}

function hasPinterestCredentials() {
  return Boolean(String(process.env.PINTEREST_ACCESS_TOKEN || '').trim());
}

function levelFromScore(n) {
  if (n >= 70) return 'High';
  if (n >= 40) return 'Medium';
  return 'Low';
}

const VISUAL_HINTS = [
  'diy', 'decor', 'recipe', 'outfit', 'fashion', 'home', 'garden', 'wedding',
  'craft', 'makeup', 'nail', 'tattoo', 'interior', 'style', 'printable', 'photo',
  'art', 'food', 'travel', 'fitness', 'room', 'kitchen', 'bedroom', 'skincare',
  'hair', 'gift', 'aesthetic', 'ideas', 'inspiration',
];

function visualHeuristicScore(keyword = '', categoryName = '') {
  const text = `${keyword} ${categoryName}`.toLowerCase();
  let hits = 0;
  for (const w of VISUAL_HINTS) {
    if (text.includes(w)) hits += 1;
  }
  if (/\b(ideas?|inspiration|how to|tips|aesthetic)\b/i.test(text)) hits += 1;
  const score = Math.min(92, Math.max(18, 35 + hits * 8 + String(keyword).split(/\s+/).length * 4));
  return {
    score,
    level: levelFromScore(score),
    hits,
  };
}

async function searchPinsOfficial(keyword) {
  const token = String(process.env.PINTEREST_ACCESS_TOKEN || '').trim();
  const { data } = await axios.get('https://api.pinterest.com/v5/search/pins', {
    params: {
      query: String(keyword).trim(),
      page_size: 15,
    },
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  const items = Array.isArray(data?.items) ? data.items : [];
  const pins = items.slice(0, 12).map((p) => ({
    id: p.id || null,
    title: p.title || p.grid_title || '',
    description: (p.description || '').slice(0, 160),
    link: p.link || p.pin_url || null,
    saveCount: p.pin_metrics?.save_count ?? p.total_saves ?? null,
  }));

  const withSaves = pins.filter((p) => typeof p.saveCount === 'number');
  const avgSaves =
    withSaves.length > 0
      ? Math.round(withSaves.reduce((s, p) => s + p.saveCount, 0) / withSaves.length)
      : null;

  // Map pin density / saves → potential score
  let score = 40 + Math.min(35, pins.length * 3);
  if (avgSaves != null) {
    if (avgSaves >= 5000) score += 20;
    else if (avgSaves >= 500) score += 12;
    else if (avgSaves >= 50) score += 6;
  }
  score = Math.min(95, Math.max(15, score));

  return {
    mode: 'pinterest_api',
    dataLabel: 'real',
    level: levelFromScore(score),
    score,
    pinCount: pins.length,
    avgSaves,
    samplePins: pins.slice(0, 6),
    note: 'Live Pinterest API v5 search/pins',
  };
}

async function searchViaGoogleCse(keyword) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!key || !cx) return null;

  const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key,
      cx,
      q: `${String(keyword).trim()} site:pinterest.com`,
      num: 8,
    },
    timeout: 12000,
  });

  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    resultCount: items.length,
    totalEstimated: Number(data?.searchInformation?.totalResults) || items.length,
    samples: items.slice(0, 5).map((i) => ({
      title: i.title,
      link: i.link,
      snippet: i.snippet,
    })),
  };
}

async function estimateWithOpenAI({ keyword, categoryName, userId, cse, heuristic }) {
  try {
    const { fetchJSONFromOpenAI } = require('../additional/openaiHelpers');
    return await fetchJSONFromOpenAI(
      `Estimate Pinterest content potential for a niche site.

Return ONLY JSON:
{
  "score": 62,
  "level": "High|Medium|Low",
  "summary": "2 sentences",
  "pinAngles": ["3 pin content angles"],
  "visualStrength": "High|Medium|Low"
}

Rules:
- score integer 18-92 (never 0)
- Prefer visual/how-to niches
- Keyword: "${keyword}"
- Category: ${categoryName || 'n/a'}
- Google CSE pinterest hits: ${cse ? JSON.stringify({ count: cse.resultCount, totalEstimated: cse.totalEstimated }) : 'n/a'}
- Heuristic: ${JSON.stringify(heuristic)}
`,
      'PINTEREST_NICHE_ESTIMATE',
      {
        userId: userId ? String(userId) : undefined,
        promptFrom: 'nicheengines/pinterest',
        promptFor: `Pinterest estimate - ${keyword}`,
      }
    );
  } catch (err) {
    console.warn(`${LOG} OpenAI estimate failed:`, err.message);
    return null;
  }
}

/**
 * Main entry — Pinterest potential signals for a niche keyword.
 */
async function getPinterestSignals({
  keyword,
  categoryName = '',
  userId = null,
} = {}) {
  const q = String(keyword || '').trim();
  if (!q) {
    return {
      mode: 'none',
      dataLabel: 'estimate',
      level: 'Low',
      score: null,
      error: 'Keyword required',
    };
  }

  console.log(`${LOG} Decision:`, {
    keyword: q,
    PINTEREST_API_MODE: isPinterestApiMode(),
    credentialsPresent: hasPinterestCredentials(),
    willTryOfficialApi: isPinterestApiMode() && hasPinterestCredentials(),
  });

  if (isPinterestApiMode() && hasPinterestCredentials()) {
    try {
      console.log(`${LOG} Calling Pinterest API v5 search/pins…`);
      const t0 = Date.now();
      const result = await searchPinsOfficial(q);
      console.log(`${LOG} Official API OK (${Date.now() - t0}ms):`, {
        score: result.score,
        level: result.level,
        pinCount: result.pinCount,
        avgSaves: result.avgSaves,
      });
      return result;
    } catch (err) {
      console.warn(`${LOG} Official API failed → fallback:`, err.response?.data || err.message);
    }
  } else {
    console.log(
      `${LOG} Official API skipped — ${
        !isPinterestApiMode()
          ? 'PINTEREST_API_MODE is false'
          : 'PINTEREST_ACCESS_TOKEN missing'
      }`
    );
  }

  // ---- No-credentials / fallback path ----
  const heuristic = visualHeuristicScore(q, categoryName);
  let cse = null;
  try {
    console.log(`${LOG} Fallback: Google CSE site:pinterest.com…`);
    cse = await searchViaGoogleCse(q);
    if (cse) {
      console.log(`${LOG} CSE OK:`, {
        resultCount: cse.resultCount,
        totalEstimated: cse.totalEstimated,
      });
    } else {
      console.log(`${LOG} CSE skipped (GOOGLE_API_KEY / GOOGLE_SEARCH_ENGINE_ID missing)`);
    }
  } catch (err) {
    console.warn(`${LOG} CSE failed:`, err.message);
  }

  const ai = await estimateWithOpenAI({
    keyword: q,
    categoryName,
    userId,
    cse,
    heuristic,
  });

  let score = heuristic.score;
  if (cse) {
    const total = cse.totalEstimated || 0;
    if (total > 100000) score += 12;
    else if (total > 10000) score += 8;
    else if (total > 1000) score += 4;
    score += Math.min(8, cse.resultCount);
  }
  if (ai?.score && Number(ai.score) > 0) {
    score = Math.round(score * 0.45 + Number(ai.score) * 0.55);
  }
  score = Math.min(92, Math.max(18, Math.round(score)));

  const result = {
    mode: 'hybrid_fallback',
    dataLabel: 'estimate',
    level: ai?.level || levelFromScore(score),
    score,
    visualStrength: ai?.visualStrength || heuristic.level,
    summary: ai?.summary || `Visual/heuristic Pinterest fit for "${q}" (no API token).`,
    pinAngles: Array.isArray(ai?.pinAngles) ? ai.pinAngles.slice(0, 3) : [],
    cse: cse
      ? {
          resultCount: cse.resultCount,
          totalEstimated: cse.totalEstimated,
          samples: cse.samples,
        }
      : null,
    heuristicHits: heuristic.hits,
    note: 'No Pinterest token — used CSE (if available) + OpenAI + visual heuristic',
  };

  console.log(`${LOG} Fallback RESULT:`, {
    mode: result.mode,
    score: result.score,
    level: result.level,
    hasCse: Boolean(cse),
    hasAi: Boolean(ai),
  });

  return result;
}

module.exports = {
  getPinterestSignals,
  isPinterestApiMode,
  hasPinterestCredentials,
  visualHeuristicScore,
};
