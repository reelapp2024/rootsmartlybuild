/**
 * Contact page form intro — matches GenieBuild `contactform` / ContactFormDefault
 *
 * AI generates marketing copy ONLY (badge, heading, body, CTA label).
 * Form fields + formId come from the project's enabled DynamicForm (admin Forms
 * Management) and are attached after generation — never invent field schemas.
 */

module.exports = {
  id: "contactform",

  schema: {
    badgeText: "string",
    contactIntroHeading: "string",
    contactIntroBody: "string",
    ctaText: "string",
    trustBullets: ["string"],
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

    return `
You are generating CONTACT FORM marketing copy for a professional business website.
Do NOT invent form field lists — fields are managed in the admin Dynamic Forms system.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words (e.g. Send a Message)",
  "contactIntroHeading": "4-10 word heading above the form",
  "contactIntroBody": "30-60 words — what to include in a message, privacy reassurance, response expectations",
  "ctaText": "2-4 word submit button label",
  "trustBullets": [
    "3-8 words",
    "3-8 words",
    "3-8 words"
  ]
}

Rules (VERY IMPORTANT):

- trustBullets: exactly 3 unique short reassurance lines (e.g. "Private & secure", "Same-day reply")
- Do NOT output a "fields" array
- Do NOT invent phone numbers, emails, or street addresses
- Do NOT request sensitive PII beyond normal contact (name/email/phone/message)
- Professional, helpful tone for ${mainCategory}
- Subtle location relevance allowed once in heading OR body
- No markdown, no explanations
- Output ONLY valid JSON
`;
  },
};
