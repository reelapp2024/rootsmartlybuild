/**
 * All Areas page reviews — GenieBuild `areastestimonials` / AreasTestimonialsDefault
 */

module.exports = {
  id: "areastestimonials",
  scope: "allareas",

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

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const serviceNames = Array.isArray(extraData.serviceNames)
      ? extraData.serviceNames.map((s) => String(s || "").trim()).filter(Boolean)
      : [];
    const servicesList =
      serviceNames.length > 0
        ? serviceNames.slice(0, 24).join(", ")
        : mainCategory || focusKeyword || "local services";

    return `
You are generating customer REVIEWS for an ALL AREAS DIRECTORY page (/areas).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Project services (use these for per-review badges when possible):
${servicesList}

Primary market:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words (e.g. Local Reviews)",
  "title": "4-8 word heading about multi-area reviews",
  "subtitle": "Supporting line (15-28 words)",
  "items": [
    {
      "id": "1",
      "title": "Short service/job badge matching THIS review (2-5 words)",
      "service": "Same value as title (required duplicate for UI)",
      "description": "Review quote 28-55 words",
      "author": "First Last",
      "role": "City or neighborhood, State",
      "avatar": "",
      "rating": 5
    }
  ]
}

RULES:
- Exactly 4-6 review items
- Reviews must feel multi-area (different cities/neighborhoods in role field)
- Role = city/area label, not job title
- Leave avatar as empty string
- rating: 4 to 5 (allow 4.5)
- Professional tone; no phone/email

PER-REVIEW SERVICE BADGE (title + service) — CRITICAL:
- title AND service MUST both be filled with the SAME short label (2-5 words)
- Badge MUST match that specific review quote (what job they hired for)
- Prefer exact names from the project services list when they fit
- Vary badges across reviews — do not repeat one label on every card
- Do NOT use stock plumbing demo badges unless they are real project services AND match the quote

- Valid JSON only, no markdown
`;
  },
};
