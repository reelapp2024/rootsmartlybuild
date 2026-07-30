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
 */
async function getKeywordDemand({
  keyword,
  country = 'US',
  language = 'EN',
} = {}) {
  const q = String(keyword || '').trim();
  if (!q) {
    return {
      mode: 'none',
      dataLabel: 'estimate',
      primary: null,
      related: [],
      error: 'Keyword required',
    };
  }

  if (isAdsModeEnabled() && hasAdsCredentials()) {
    try {
      const rows = await fetchAdsKeywordIdeas({ keyword: q, country, language });
      const primary = rows[0] || null;
      return {
        mode: 'google_ads',
        dataLabel: primary?.dataLabel || 'real',
        primary,
        related: rows.slice(1, 8),
      };
    } catch (err) {
      console.warn(
        '[nicheengines/googleAds] Ads API failed, falling back:',
        err.message
      );
    }
  }

  // Fallback — Google Suggest + estimate labels (honest, no fake exact numbers)
  const suggestions = await fetchGoogleSuggest(q, language);
  const related = suggestions
    .filter((s) => s.toLowerCase() !== q.toLowerCase())
    .slice(0, 8)
    .map((s) => ({
      keyword: s,
      avgMonthlySearches: null,
      volumeRange: 'estimate',
      volumeLevel: suggestions.length >= 8 ? 'High' : suggestions.length >= 4 ? 'Medium' : 'Low',
      competition: 'estimate',
      source: 'google_suggest',
      dataLabel: 'estimate',
    }));

  const suggestStrength =
    suggestions.length >= 8 ? 'High' : suggestions.length >= 4 ? 'Medium' : 'Low';

  return {
    mode: isAdsModeEnabled() ? 'fallback_suggest' : 'google_suggest',
    dataLabel: 'estimate',
    primary: {
      keyword: q,
      avgMonthlySearches: null,
      volumeRange: 'estimate · ' + suggestStrength,
      volumeLevel: suggestStrength,
      competition: 'estimate · ' + suggestStrength,
      source: 'google_suggest',
      dataLabel: 'estimate',
      suggestionCount: suggestions.length,
    },
    related,
  };
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
