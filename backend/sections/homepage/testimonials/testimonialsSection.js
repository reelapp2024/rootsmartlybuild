/**
 * Testimonials Section Generator
 * Matches GenieBuild testimonials section content structure
 */

module.exports = {
  id: "testimonials",

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
    const { project, location, extraData = {}, pageName = "" } = ctx;

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
        : mainCategory || focusKeyword || "this business's services";

    const isAreasListing =
      String(pageName || extraData?.pageName || "")
        .toLowerCase()
        .trim() === "areas";

    const areasHint = isAreasListing
      ? `
PAGE CONTEXT: ALL AREAS DIRECTORY (/areas)
- Reviews should feel multi-area (different neighborhoods/cities), not one single street address.
- Title can emphasize locals across the regions you serve.
`
      : "";

    return `
You are generating customer testimonials for a professional business website.
${areasHint}
Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Project services (use these for per-review badges when possible):
${servicesList}

Location:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "badgeText": "2-4 words",
  "title": "Section heading (e.g., 'What Our Customers Say')",
  "subtitle": "Optional supporting text (12-24 words)",
  "items": [
    {
      "id": "testimonial-1",
      "title": "Short service/job badge matching THIS review (2-5 words)",
      "service": "Same value as title (required duplicate for UI)",
      "description": "Authentic customer review quote (35-60 words)",
      "author": "Customer first name",
      "role": "Customer role or location label",
      "avatar": "https://randomuser.me/api/portraits/[men/women]/[1-10].jpg",
      "rating": 5
    }
  ]
}

Rules (VERY IMPORTANT):

HEADING:
- Standard testimonials section title
- Examples: "What Our Customers Say", "Client Testimonials", "Reviews"

DESCRIPTION:
- 12-24 words

ITEMS:
- Generate BETWEEN 3 and 6 testimonial items
- Each item MUST have unique id: "testimonial-1", "testimonial-2", etc.
- Description must be 35-60 words
- Author must be realistic first name only (no surnames)
- Role should be relevant (e.g., "Customer", "Client", "Homeowner", "Business Owner") or a city/area label
- Avatar must be valid randomuser.me URL format
- rating: number from 4 to 5 (allow 4.5)
- Every review must be UNIQUE
- Reviews must sound natural and human
- Reviews must relate directly to ${mainCategory}

PER-REVIEW SERVICE BADGE (title + service) — CRITICAL:
- title AND service MUST both be filled with the SAME short label (2-5 words)
- The badge MUST match what that specific review is about (e.g. if the quote is about a clogged drain, badge = one of the project drain services — NOT a generic unrelated service)
- Prefer exact names from the project services list above when they fit the quote
- If no exact match, invent a short realistic job label that still fits ${mainCategory} and the quote
- Do NOT reuse the same badge on every review — vary them across items
- Do NOT use unrelated stock labels like "Emergency Pipe Repair" / "Drain Cleaning" / "Water Heater Install" unless those are real project services AND match that review's quote

- subtitle may mention ${locationName || city || "the area"} once
- 1–2 reviews may reference the area or city naturally; every review must still sound unique — not the same quote with only the neighborhood swapped

AVATAR URLS:
- Use randomuser.me API format
- Examples:
  - "https://randomuser.me/api/portraits/men/1.jpg"
  - "https://randomuser.me/api/portraits/women/2.jpg"
- Mix men and women
- Use numbers 1-10

GLOBAL:
- Professional and authentic tone
- Do NOT include phone numbers
- Do NOT include email addresses
- Do NOT include physical addresses
- Do NOT reference calling or contacting
- Avoid overly marketing language
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  },
};
