const axios = require('axios');

function isAdsModeEnabled() {
  return String(process.env.GOOGLE_ADS_API_MODE || '').toLowerCase() === 'true';
}

function hasAdsCredentials() {
  return Boolean(
    process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN &&
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CUSTOMER_ID
  );
}

/** Map common country labels → Google Ads geo target constant IDs */
const GEO_TARGET = {
  US: '2840',
  USA: '2840',
  'UNITED STATES': '2840',
  CA: '2124',
  CANADA: '2124',
  UK: '2826',
  GB: '2826',
  'UNITED KINGDOM': '2826',
  AU: '2036',
  AUSTRALIA: '2036',
  IN: '2356',
  INDIA: '2356',
  GLOBAL: '2840',
};

/** Map language codes → Google Ads language constant IDs */
const LANG_CONSTANT = {
  EN: '1000',
  ES: '1003',
  DE: '1001',
  FR: '1002',
  HI: '1023',
};

function resolveGeoId(country = 'US') {
  const key = String(country || 'US').trim().toUpperCase();
  return GEO_TARGET[key] || GEO_TARGET.US;
}

function resolveLanguageId(language = 'EN') {
  const key = String(language || 'EN').trim().toUpperCase();
  return LANG_CONSTANT[key] || LANG_CONSTANT.EN;
}

function competitionLabel(raw) {
  const v = String(raw || '').toUpperCase();
  if (v.includes('LOW') || v === '1') return 'Low';
  if (v.includes('HIGH') || v === '3') return 'High';
  return 'Medium';
}

function volumeBucket(avgMonthly) {
  const n = Number(avgMonthly) || 0;
  if (n >= 10000) return { range: '10K+', level: 'High' };
  if (n >= 1000) return { range: '1K–10K', level: 'High' };
  if (n >= 100) return { range: '100–1K', level: 'Medium' };
  if (n > 0) return { range: '10–100', level: 'Low' };
  return { range: 'Unknown', level: 'Low' };
}

/**
 * Fallback: Google Autocomplete suggestions (no Ads token needed).
 * Returns estimate-level signals only — never fake exact volumes.
 */
async function fetchGoogleSuggest(keyword, language = 'en') {
  const q = String(keyword || '').trim();
  if (!q) return [];

  try {
    const { data } = await axios.get(
      'https://suggestqueries.google.com/complete/search',
      {
        params: {
          client: 'firefox',
          q,
          hl: String(language || 'en').toLowerCase().slice(0, 2),
        },
        timeout: 8000,
      }
    );
    const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
    return suggestions
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 12);
  } catch (err) {
    console.warn('[nicheengines/googleAds] Suggest failed:', err.message);
    return [];
  }
}

/**
 * Real Google Ads Keyword Plan Ideas (when MODE=true + credentials + package).
 */
async function fetchAdsKeywordIdeas({ keyword, country, language }) {
  let GoogleAdsApi;
  try {
    ({ GoogleAdsApi } = require('google-ads-api'));
  } catch {
    throw new Error(
      'google-ads-api package not installed. Run: npm i google-ads-api'
    );
  }

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });

  const customerId = String(process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(
    /-/g,
    ''
  );
  const customer = client.Customer({
    customer_id: customerId,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  });

  const geoId = resolveGeoId(country);
  const langId = resolveLanguageId(language);

  const results = await customer.keywordPlanIdeas.generateKeywordIdeas({
    customer_id: customerId,
    language: `languageConstants/${langId}`,
    geo_target_constants: [`geoTargetConstants/${geoId}`],
    include_adult_keywords: false,
    keyword_plan_network: 'GOOGLE_SEARCH',
    keyword_seed: {
      keywords: [String(keyword).trim()],
    },
  });

  const rows = [];
  for (const idea of results || []) {
    const text =
      idea?.text ||
      idea?.keyword_idea_metrics?.text ||
      idea?.keywordIdeaMetrics?.text ||
      '';
    const metrics =
      idea?.keyword_idea_metrics || idea?.keywordIdeaMetrics || {};
    const avg =
      Number(metrics.avg_monthly_searches ?? metrics.avgMonthlySearches) || 0;
    const competition =
      metrics.competition || metrics.competition_index || 'UNKNOWN';
    const bucket = volumeBucket(avg);
    rows.push({
      keyword: String(text || keyword).trim(),
      avgMonthlySearches: avg,
      volumeRange: bucket.range,
      volumeLevel: bucket.level,
      competition: competitionLabel(competition),
      source: 'google_ads',
      dataLabel: 'real',
    });
  }

  if (rows.length === 0) {
    // seed keyword itself with unknown metrics
    rows.push({
      keyword: String(keyword).trim(),
      avgMonthlySearches: null,
      volumeRange: 'Unknown',
      volumeLevel: 'Medium',
      competition: 'Medium',
      source: 'google_ads',
      dataLabel: 'estimate',
    });
  }

  return rows;
}

/**
 * Main entry: search volume + competition for a niche keyword.
 * GOOGLE_ADS_API_MODE=true + credentials → Google Ads.
 * Otherwise → OpenAI estimate (High/Med/Low) + Google Suggest related terms.
 */
async function getKeywordDemand({
  keyword,
  country = 'US',
  language = 'EN',
  categoryName = '',
  userId = null,
} = {}) {
  const LOG = '[NicheAnalysis][Ads]';
  const q = String(keyword || '').trim();
  if (!q) {
    console.log(`${LOG} SKIP — keyword empty`);
    return {
      mode: 'none',
      dataLabel: 'estimate',
      primary: null,
      related: [],
      error: 'Keyword required',
    };
  }

  const adsOn = isAdsModeEnabled();
  const credsOk = hasAdsCredentials();
  console.log(`${LOG} Volume engine decision:`, {
    keyword: q,
    country,
    language,
    categoryName: categoryName || null,
    GOOGLE_ADS_API_MODE: adsOn,
    credentialsPresent: credsOk,
    willTryGoogleAds: adsOn && credsOk,
    fallbackIfNeeded: 'OpenAI + Google Suggest',
  });

  if (adsOn && credsOk) {
    try {
      console.log(`${LOG} Calling Google Ads Keyword Plan Ideas…`);
      const t0 = Date.now();
      const rows = await fetchAdsKeywordIdeas({ keyword: q, country, language });
      const primary = rows[0] || null;
      console.log(`${LOG} Google Ads OK (${Date.now() - t0}ms):`, {
        mode: 'google_ads',
        dataLabel: primary?.dataLabel || 'real',
        primaryKeyword: primary?.keyword,
        avgMonthlySearches: primary?.avgMonthlySearches,
        volumeLevel: primary?.volumeLevel,
        volumeRange: primary?.volumeRange,
        competition: primary?.competition,
        relatedCount: Math.max(0, rows.length - 1),
        relatedSample: rows.slice(1, 5).map((r) => r.keyword),
      });
      return {
        mode: 'google_ads',
        dataLabel: primary?.dataLabel || 'real',
        primary,
        related: rows.slice(1, 8),
      };
    } catch (err) {
      console.warn(
        `${LOG} Google Ads FAILED → falling back to OpenAI + Suggest:`,
        err.message
      );
    }
  } else {
    console.log(
      `${LOG} Google Ads NOT used — reason: ${
        !adsOn
          ? 'GOOGLE_ADS_API_MODE is false/unset'
          : 'Ads credentials missing in .env'
      }`
    );
  }

  // Ads off / failed → OpenAI demand estimate + Suggest for related keywords
  console.log(`${LOG} Fetching Google Suggest (autocomplete) for related terms…`);
  const suggestStarted = Date.now();
  const suggestions = await fetchGoogleSuggest(q, language);
  console.log(`${LOG} Google Suggest (${Date.now() - suggestStarted}ms):`, {
    count: suggestions.length,
    suggestions: suggestions.slice(0, 10),
  });

  let aiEstimate = null;

  try {
    console.log(`${LOG} Calling OpenAI for volume/competition estimate (High/Med/Low)…`);
    const { fetchJSONFromOpenAI } = require('../additional/openaiHelpers');
    const tAi = Date.now();
    aiEstimate = await fetchJSONFromOpenAI(
      `You estimate niche keyword demand for content / Pinterest sites.

Return ONLY JSON:
{
  "volumeLevel": "High|Medium|Low",
  "volumeRange": "e.g. estimate · 1K–10K or estimate · High",
  "demandScore": 47,
  "competition": "High|Medium|Low",
  "competitionNote": "one short sentence",
  "relatedKeywords": ["up to 8 related long-tail keywords"]
}

Rules:
- demandScore MUST be an integer from 15 to 92 (never 0, never exactly 50 or 80 unless truly deserved)
- Vary demandScore based on niche specificity, commercial intent, and Suggest hints
- Do NOT invent exact monthly search numbers
- Be honest for niche: "${q}"
- Category: ${categoryName || 'n/a'}
- Country: ${country}
- Language: ${language}
- Google Suggest hints (optional): ${JSON.stringify(suggestions.slice(0, 8))}
`,
      'NICHE_DEMAND_ESTIMATE',
      {
        userId: userId ? String(userId) : undefined,
        promptFrom: 'nicheengines/googleAds',
        promptFor: `Demand estimate - ${q}`,
      }
    );
    console.log(`${LOG} OpenAI demand estimate OK (${Date.now() - tAi}ms):`, aiEstimate);
  } catch (err) {
    console.warn(
      `${LOG} OpenAI estimate FAILED — will use Suggest-count heuristic:`,
      err.message
    );
  }

  const volumeLevel =
    aiEstimate?.volumeLevel === 'High' ||
    aiEstimate?.volumeLevel === 'Medium' ||
    aiEstimate?.volumeLevel === 'Low'
      ? aiEstimate.volumeLevel
      : suggestions.length >= 8
        ? 'High'
        : suggestions.length >= 4
          ? 'Medium'
          : 'Low';

  const competition =
    aiEstimate?.competition === 'High' ||
    aiEstimate?.competition === 'Medium' ||
    aiEstimate?.competition === 'Low'
      ? aiEstimate.competition
      : 'Medium';

  let demandScore = null;
  const rawDemand = Number(aiEstimate?.demandScore);
  if (Number.isFinite(rawDemand) && rawDemand > 0 && rawDemand <= 100) {
    demandScore = Math.round(rawDemand);
  } else {
    // Derive continuous score from suggest depth + volume level (never stuck on 0/80)
    const base =
      volumeLevel === 'High' ? 68 : volumeLevel === 'Medium' ? 48 : 28;
    demandScore = Math.min(
      92,
      Math.max(18, base + suggestions.length * 2 + String(q).split(/\s+/).length * 3)
    );
  }

  const volumeSource = aiEstimate
    ? 'openai'
    : 'google_suggest_heuristic';

  const relatedFromAi = Array.isArray(aiEstimate?.relatedKeywords)
    ? aiEstimate.relatedKeywords
    : [];
  const relatedMerged = [
    ...relatedFromAi,
    ...suggestions.filter((s) => s.toLowerCase() !== q.toLowerCase()),
  ]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .filter((s, i, arr) => arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i)
    .slice(0, 8)
    .map((s) => ({
      keyword: s,
      avgMonthlySearches: null,
      volumeRange: 'estimate',
      volumeLevel,
      competition: 'estimate',
      source: 'openai_estimate',
      dataLabel: 'estimate',
    }));

  const result = {
    mode: 'openai_estimate',
    dataLabel: 'estimate',
    primary: {
      keyword: q,
      avgMonthlySearches: null,
      volumeRange: aiEstimate?.volumeRange || `estimate · ${volumeLevel}`,
      volumeLevel,
      competition,
      competitionNote: aiEstimate?.competitionNote || null,
      demandScore,
      source: 'openai_estimate',
      dataLabel: 'estimate',
      suggestionCount: suggestions.length,
      volumeSource,
    },
    related: relatedMerged,
  };

  console.log(`${LOG} Volume engine RESULT:`, {
    mode: result.mode,
    dataLabel: result.dataLabel,
    volumeSource,
    volumeLevel,
    demandScore,
    volumeRange: result.primary.volumeRange,
    competition,
    relatedCount: relatedMerged.length,
    related: relatedMerged.map((r) => r.keyword),
  });

  return result;
}

module.exports = {
  isAdsModeEnabled,
  hasAdsCredentials,
  getKeywordDemand,
  fetchGoogleSuggest,
  volumeBucket,
  resolveGeoId,
  resolveLanguageId,
};
