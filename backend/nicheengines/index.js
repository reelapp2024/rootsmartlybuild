/**
 * Niche demand engines — Google Ads (volume/competition) + Google Trends (seasonality).
 * Used by PinterestControllerV2.analyzeNiche and later Keyword Engine / AI Suggestions.
 */

const googleAds = require('./googleAds');
const googleTrends = require('./googleTrends');

/**
 * Collect real/hybrid demand signals for a niche keyword.
 */
async function collectNicheSignals({
  keyword,
  country = 'US',
  language = 'EN',
} = {}) {
  const [ads, trends] = await Promise.all([
    googleAds.getKeywordDemand({ keyword, country, language }),
    googleTrends.getTrendSignals({ keyword, country }),
  ]);

  return {
    keyword: String(keyword || '').trim(),
    country,
    language,
    ads,
    trends,
    collectedAt: new Date().toISOString(),
  };
}

module.exports = {
  collectNicheSignals,
  googleAds,
  googleTrends,
};
