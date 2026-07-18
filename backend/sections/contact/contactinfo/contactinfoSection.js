/**
 * Contact page reach-us cards — matches GenieBuild `contactinfo` / ContactInfoDefault
 *
 * AI generates headings + helper text ONLY.
 * Real phone / email / address / office hours are injected post-generation from AboutUs.
 */

module.exports = {
  id: "contactinfo",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    items: [
      {
        icon: "string",
        title: "string",
        kind: "string",
        helperText: "string",
      },
    ],
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
You are generating the CONTACT INFO ("Ways to Reach Us") section for a professional About/Contact page.

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
  "badgeText": "2-4 words",
  "title": "4-8 word section heading",
  "subtitle": "15-30 word intro",
  "items": [
    {
      "icon": "fa-phone",
      "title": "Call Us",
      "kind": "phone",
      "helperText": "short availability / response hint WITHOUT any phone digits"
    },
    {
      "icon": "fa-envelope",
      "title": "Email Us",
      "kind": "email",
      "helperText": "short reply expectation WITHOUT any email address"
    },
    {
      "icon": "fa-location-dot",
      "title": "Visit Us",
      "kind": "address",
      "helperText": "optional short visit tip WITHOUT inventing a street address (may be empty string)"
    },
    {
      "icon": "fa-clock",
      "title": "Office Hours",
      "kind": "hours",
      "helperText": "optional short extra note ONLY (e.g. emergency callout) — do NOT invent Mon–Sun schedules; real hours come from the business profile"
    }
  ]
}

Rules (VERY IMPORTANT):

- Generate EXACTLY 4 items in this order with kinds: phone, email, address, hours
- Titles should be short labels (Call Us / Email Us / Visit Us / Office Hours or close variants)
- icon must be FA6 token without "fas" prefix
- helperText for phone/email/address must NOT contain phone numbers, emails, or street addresses
  (real values are injected from the business About Us database after generation)
- helperText for hours must NOT invent a weekly schedule — leave empty or a brief emergency note only
- badgeText, title, and subtitle MUST be unique marketing copy for this business (never generic placeholder tone)
- title OR subtitle may mention ${locationName || city || "the area"} once for local SEO
- No markdown, no explanations
- Output ONLY valid JSON
`;
  },
};
