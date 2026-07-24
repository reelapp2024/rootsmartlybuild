/**
 * backend/seoprompts — SEO prompts + mode + JSON-LD builders
 * (mirrors backend/sections/... prompt organization)
 */
const seoMode = require("./seoMode");
const { buildBasicMetaPrompt } = require("./basicMetaPrompt");
const { buildPageSeoPrompt } = require("./pageSeoPrompt");
const schemaBuilders = require("./schemaBuilders");

function buildSeoPromptForMode(ctx = {}) {
  if (seoMode.isPremiumSeo()) return buildPageSeoPrompt(ctx);
  return buildBasicMetaPrompt(ctx);
}

module.exports = {
  ...seoMode,
  buildBasicMetaPrompt,
  buildPageSeoPrompt,
  buildSeoPromptForMode,
  ...schemaBuilders,
};
