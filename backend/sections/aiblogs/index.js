/**
 * AI blog prompts (V2) — content-only generation for create-post-ai wizard.
 * Types: how | best | comparison | what
 */

const { normalizeBlogType, formatLocations, normalizeAiPayload } = require("./shared");
const { buildHowPrompt } = require("./howPrompt");
const { buildBestPrompt } = require("./bestPrompt");
const { buildComparisonPrompt } = require("./comparisonPrompt");
const { buildWhatPrompt } = require("./whatPrompt");

/**
 * @param {object} ctx
 * @param {string} ctx.type - how | best | comparison | what
 * @param {string} ctx.title
 * @param {string} [ctx.projectName]
 * @param {string} [ctx.serviceType]
 * @param {string[]} [ctx.locations]
 */
function buildBlogContentPrompt(ctx = {}) {
  const type = normalizeBlogType(ctx.type);
  const payload = {
    title: String(ctx.title || "").trim(),
    projectName: String(ctx.projectName || "").trim(),
    serviceType: String(ctx.serviceType || "").trim(),
    locations: Array.isArray(ctx.locations) ? ctx.locations : [],
  };

  switch (type) {
    case "best":
      return buildBestPrompt(payload);
    case "comparison":
      return buildComparisonPrompt(payload);
    case "what":
      return buildWhatPrompt(payload);
    case "how":
    default:
      return buildHowPrompt(payload);
  }
}

module.exports = {
  buildBlogContentPrompt,
  normalizeBlogType,
  formatLocations,
  normalizeAiPayload,
  buildHowPrompt,
  buildBestPrompt,
  buildComparisonPrompt,
  buildWhatPrompt,
};
