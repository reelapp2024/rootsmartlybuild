/**
 * Shared uniqueness + SEO rules for About page OpenAI section prompts.
 * Keep phone/email/address OUT of AI output — injected from AboutUs at runtime.
 */

function aboutUniquenessRules({
  projectName = "",
  mainCategory = "",
  focusKeyword = "",
  seoKeywords = "",
  locationLabel = "",
  pageLabel = "About Us",
} = {}) {
  const biz = projectName || "this business";
  const loc = locationLabel || "the service area";
  const cat = mainCategory || "this trade";
  const focus = focusKeyword || cat;
  const keys = seoKeywords || focus;

  return `
UNIQUENESS + SEO (CRITICAL — About page must NOT look templated):
- This is the "${pageLabel}" page for "${biz}" (${cat}) — every string must feel written for THIS company only.
- Weave "${focus}" and related terms from [${keys}] naturally (never stuffing; never identical phrasing across fields).
- Mention "${biz}" by name at least once in the section when there is a title, intro, subtitle, or FAQ scope.
- Local relevance: reference ${loc} where it fits, with VARYING phrasing (not "in X" on every line).
- NEVER reuse cliché openers: "Welcome to", "When it comes to", "In today's world", "At the end of the day", "Your trusted partner", "comprehensive solutions", "seamless experience", "top-notch", "state-of-the-art".
- NEVER invent phone numbers, emails, street addresses, or office hours — those come from the business profile/database and are shown elsewhere.
- Prefer concrete, human specifics (how the team works, what customers notice, local service style) over empty marketing adjectives.
- Output must be distinct from a generic ${cat} brochure and from what you would write for a different city or brand.
`;
}

module.exports = {
  aboutUniquenessRules,
};
