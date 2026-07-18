/**
 * Services listing hero — matches GenieBuild `serviceslisthero` / ServicesListHeroDefault
 */

module.exports = {
  id: "serviceslisthero",

  schema: {
    badgeText: "string",
    serviceHeroBadge: "string",
    serviceHeroTitle: "string",
    serviceHeroSubtitle: "string",
    title: "string",
    subtitle: "string",
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";
    const serviceNames = Array.isArray(extraData?.serviceNames)
      ? extraData.serviceNames.filter(Boolean)
      : [];
    const serviceList = serviceNames.length ? serviceNames.join(", ") : "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are generating the SERVICES LISTING PAGE HERO (all-services page — not a single service detail).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}
User-created services (do NOT invent new service names): ${serviceList || "none provided"}

Location Context:
${finalLocation || "No specific location"}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "serviceHeroBadge": "2-4 words (same idea as badgeText)",
  "serviceHeroTitle": "5-10 word H1-style heading",
  "serviceHeroSubtitle": "22-40 words inviting visitors to explore the full service range",
  "title": "same as serviceHeroTitle",
  "subtitle": "same as serviceHeroSubtitle"
}

Rules (VERY IMPORTANT):

- serviceHeroBadge and badgeText should match (or be near-identical)
- serviceHeroTitle / title: include ${mainCategory} naturally; if location exists put ${locationName || city || "the area"} in title OR subtitle once
- Subtitle: set expectation about quality, range, and professionalism — not a hard phone CTA
- Align language with provided services when listed — NEVER invent services
- Do NOT invent phone numbers, emails, or street addresses
- Valid JSON only — no markdown, no explanations
`;
  },
};
