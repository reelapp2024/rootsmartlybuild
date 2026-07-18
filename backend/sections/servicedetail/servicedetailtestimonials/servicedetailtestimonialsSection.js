/**
 * Service detail testimonials — GenieBuild `servicedetailtestimonials`
 */

module.exports = {
  id: "servicedetailtestimonials",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    items: [
      {
        id: "string",
        title: "string",
        service: "string",
        description: "string",
        author: "string",
        role: "string",
        avatar: "string",
        rating: "number",
      },
    ],
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";
    const serviceName = extraData.serviceName || extraData.service_name || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const serviceNames = Array.isArray(extraData.serviceNames)
      ? extraData.serviceNames.map((s) => String(s || "").trim()).filter(Boolean)
      : [];
    const servicesList =
      serviceNames.length > 0
        ? serviceNames.slice(0, 24).join(", ")
        : serviceName || mainCategory || "this service";

    return `
You are generating customer testimonials for a SERVICE DETAIL page.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Service: ${serviceName || mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Project services:
${servicesList}

Location:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "4-8 word heading",
  "subtitle": "12-24 words intro about reviews for this service",
  "items": [
    {
      "id": "t1",
      "title": "Short badge for THIS review (2-5 words) — usually \"${serviceName || mainCategory}\" or a closely related job label",
      "service": "Same value as title (required duplicate for UI)",
      "description": "45-80 word first-person review mentioning ${serviceName || mainCategory} naturally",
      "author": "First name + last initial",
      "role": "Homeowner / Business owner / Local resident",
      "avatar": "",
      "rating": 5
    }
  ]
}

Rules (VERY IMPORTANT):
- Generate BETWEEN 4 and 6 items
- Every review UNIQUE and realistic; reference this service specifically
- Leave avatar as empty string (UI uses placeholders)
- rating: 4 to 5 (allow 4.5)
- If location exists, 1-2 reviews may mention ${locationName || city || "the area"} naturally

PER-REVIEW SERVICE BADGE (title + service) — CRITICAL:
- title AND service MUST both be filled with the SAME short label
- Prefer "${serviceName || mainCategory}" for most cards; you may vary slightly (e.g. "Same-Day ${serviceName || "Service"}", "Emergency ${serviceName || "Call"}") when it still matches the quote
- Badge MUST relate to the quote — never show an unrelated stock service name

- Do NOT invent real phone/email/address
- No markdown — JSON only
`;
  },
};
