/**
 * SEO mode from env (Phase 1).
 *   0 = off (no generation)
 *   1 = basic meta only (title, keywords, description)
 *   2 = premium (basic + OG polish + JSON-LD schemas[])
 */
function getSeoMode() {
  const raw = String(process.env.seo_mode ?? process.env.SEO_MODE ?? "1").trim();
  const n = parseInt(raw, 10);
  if (n === 0 || n === 1 || n === 2) return n;
  return 1;
}

const SEO_MODE = {
  OFF: 0,
  BASIC: 1,
  PREMIUM: 2,
};

function shouldGenerateSeo() {
  return getSeoMode() !== SEO_MODE.OFF;
}

function shouldGenerateSchemas() {
  return getSeoMode() === SEO_MODE.PREMIUM;
}

function isPremiumSeo() {
  return getSeoMode() === SEO_MODE.PREMIUM;
}

function isBasicSeoOnly() {
  return getSeoMode() === SEO_MODE.BASIC;
}

module.exports = {
  SEO_MODE,
  getSeoMode,
  shouldGenerateSeo,
  shouldGenerateSchemas,
  isPremiumSeo,
  isBasicSeoOnly,
};
