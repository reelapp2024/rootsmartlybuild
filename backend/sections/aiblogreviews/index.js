/**
 * AI fake blog reviews — prompts + guaranteed-unique name allocation.
 * Used by fakeReviewsQueue (admin Generate Reviews).
 */

const { buildFakeReviewsPrompt } = require("./fakeReviewsPrompt");
const {
  allocateUniqueReviewerNames,
  applyAssignedNames,
  ensureUniqueReviewerNames,
  inventUniqueName,
  normalizePersonName,
  nameKey,
  firstNameOf,
  lastNameOf,
} = require("./shared");

module.exports = {
  buildFakeReviewsPrompt,
  allocateUniqueReviewerNames,
  applyAssignedNames,
  ensureUniqueReviewerNames,
  inventUniqueName,
  normalizePersonName,
  nameKey,
  firstNameOf,
  lastNameOf,
};
