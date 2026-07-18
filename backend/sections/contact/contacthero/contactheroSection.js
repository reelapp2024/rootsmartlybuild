/**
 * Contact page hero — matches GenieBuild `contacthero` / ContactHeroDefault
 * Marketing copy only. Phone/email/address come from AboutUs elsewhere on the page.
 */

module.exports = {
  id: "contacthero",

  schema: {
    badgeText: "string",
    contactHeroTitle: "string",
    contactHeroSubtitle: "string",
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are generating the CONTACT PAGE HERO for a professional business website.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location Context:
${finalLocation || "No specific location"}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words (e.g. Contact Us)",
  "contactHeroTitle": "4-10 word H1-style heading",
  "contactHeroSubtitle": "20-40 words inviting contact and setting response-time expectations"
}

Rules (VERY IMPORTANT):

BADGE TEXT:
- 2-4 words — e.g. "Contact Us", "Get In Touch", "Reach Out"

CONTACT HERO TITLE:
- 4-10 words
- Welcoming, clear, not a hard sales CTA
- Include ${mainCategory} or focus keyword naturally when it fits
- If location exists, put ${locationName || city || "the area"} in title OR subtitle once

CONTACT HERO SUBTITLE:
- 20-40 words
- Invite questions/bookings and set reply expectations
- Professional tone

GLOBAL:
- Do NOT invent phone numbers, emails, or street addresses
- Do NOT add extra keys
- Valid JSON only — no markdown, no explanations
`;
  },
};
