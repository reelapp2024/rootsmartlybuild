/**
 * Niche demand engines — Ads/OpenAI volume + Trends + Pinterest + Amazon.
 * Used by PinterestControllerV2.analyzeNiche and later Keyword Engine / AI Suggestions.
 */

const googleAds = require('./googleAds');
const googleTrends = require('./googleTrends');
const pinterest = require('./pinterest');
const amazon = require('./amazon');

const LOG = '[NicheAnalysis]';

/**
 * Collect real/hybrid demand signals for a niche keyword.
 */
async function collectNicheSignals({
  keyword,
  country = 'US',
  language = 'EN',
  categoryName = '',
  userId = null,
} = {}) {
  const q = String(keyword || '').trim();
  const adsModeEnv = String(process.env.GOOGLE_ADS_API_MODE || '').toLowerCase() === 'true';
  const trendsModeEnv = String(process.env.GOOGLE_TRENDS_MODE || 'true').toLowerCase() !== 'false';
  const pinMode = pinterest.isPinterestApiMode();
  const amazonMode = amazon.isAmazonApiMode();

  console.log(`\n${LOG} ════════════════════════════════════════`);
  console.log(`${LOG} collectNicheSignals START`);
  console.log(`${LOG} Input:`, {
    keyword: q,
    categoryName: categoryName || null,
    country,
    language,
    userId: userId ? String(userId) : null,
  });
  console.log(`${LOG} Env flags:`, {
    GOOGLE_ADS_API_MODE: process.env.GOOGLE_ADS_API_MODE || '(unset → false)',
    adsModeEnabled: adsModeEnv,
    adsCredentialsPresent: googleAds.hasAdsCredentials(),
    GOOGLE_TRENDS_MODE: process.env.GOOGLE_TRENDS_MODE || '(unset → true)',
    trendsModeEnabled: trendsModeEnv,
    PINTEREST_API_MODE: process.env.PINTEREST_API_MODE || '(unset → false)',
    pinterestCredentialsPresent: pinterest.hasPinterestCredentials(),
    AMAZON_API_MODE: process.env.AMAZON_API_MODE || '(unset → false)',
    amazonCredentialsPresent: amazon.hasAmazonCredentials(),
  });
  console.log(`${LOG} Plan:`);
  console.log(
    `${LOG}   1) Volume/competition → ${
      adsModeEnv && googleAds.hasAdsCredentials()
        ? 'Google Ads Keyword Planner (real)'
        : 'OpenAI estimate + Google Suggest (Ads off / no credentials)'
    }`
  );
  console.log(
    `${LOG}   2) Seasonality/interest → ${
      trendsModeEnv ? 'Google Trends interestOverTime' : 'SKIPPED (GOOGLE_TRENDS_MODE=false)'
    }`
  );
  console.log(
    `${LOG}   3) Pinterest → ${
      pinMode && pinterest.hasPinterestCredentials()
        ? 'Pinterest API v5 search/pins (real)'
        : 'Fallback: CSE + OpenAI + visual heuristic (works without token)'
    }`
  );
  console.log(
    `${LOG}   4) Amazon → ${
      amazonMode && amazon.hasAmazonCredentials()
        ? 'Amazon PA-API SearchItems (real)'
        : 'Fallback: Amazon Suggest + CSE + OpenAI (works without PA-API)'
    }`
  );
  console.log(`${LOG}   5) Final scoring → signal engine + OpenAI niche analyst`);

  const started = Date.now();
  const [ads, trends, pin, amz] = await Promise.all([
    googleAds.getKeywordDemand({
      keyword: q,
      country,
      language,
      categoryName,
      userId,
    }),
    googleTrends.getTrendSignals({ keyword: q, country }),
    pinterest.getPinterestSignals({
      keyword: q,
      categoryName,
      userId,
    }),
    amazon.getAmazonSignals({
      keyword: q,
      country,
      categoryName,
      userId,
    }),
  ]);

  const result = {
    keyword: q,
    country,
    language,
    ads,
    trends,
    pinterest: pin,
    amazon: amz,
    collectedAt: new Date().toISOString(),
  };

  console.log(`${LOG} collectNicheSignals DONE in ${Date.now() - started}ms`);
  console.log(`${LOG} Sources used:`, {
    volumeSource: ads?.mode,
    volumeDataLabel: ads?.dataLabel,
    volumeLevel: ads?.primary?.volumeLevel || null,
    competition: ads?.primary?.competition || null,
    relatedCount: Array.isArray(ads?.related) ? ads.related.length : 0,
    trendsSource: trends?.mode,
    trendsDataLabel: trends?.dataLabel,
    trendDirection: trends?.summary?.trendDirection || null,
    seasonality: trends?.summary?.seasonality || null,
    trendsError: trends?.error || null,
    pinterestSource: pin?.mode,
    pinterestScore: pin?.score ?? null,
    pinterestLevel: pin?.level || null,
    amazonSource: amz?.mode,
    amazonScore: amz?.score ?? null,
    amazonLevel: amz?.level || null,
  });
  console.log(`${LOG} ════════════════════════════════════════\n`);

  return result;
}

module.exports = {
  collectNicheSignals,
  googleAds,
  googleTrends,
  pinterest,
  amazon,
};
