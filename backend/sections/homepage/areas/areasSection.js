/**
 * Areas Section Generator
 * Matches GenieBuild areas section header + city pills structure.
 */

module.exports = {
  id: "areas",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    ctaText: "string",
    ctaHref: "string",
    contentRef: {
      source: "business_locations",
    },
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
    const loc = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are generating an "Areas We Serve" section for a professional local business website.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}
Location context (PRIMARY — write all copy for this place only): ${loc || "Global / all service areas"}
Sub-areas shown as pills (mention only as "including X, Y" — do NOT write copy as if you are one of these children): ${extraData?.childAreaNames?.join?.(", ") || "N/A"}

Return STRICT JSON ONLY:
{
  "badgeText": "2-4 words for section badge",
  "title": "4-9 words for areas section heading",
  "subtitle": "16-32 words describing service coverage confidently",
  "ctaText": "2-5 words CTA label",
  "ctaHref": "#",
  "contentRef": { "source": "business_locations" }
}

Rules (VERY IMPORTANT):
- badgeText, title, and subtitle must describe coverage for "${loc || "this service area"}" specifically — not a child/sub-area.
- If location is a parent region, the heading should name that parent; list sub-areas only in subtitle as "including …".
- Keep badgeText/title/subtitle specific to ${mainCategory || "the business"}.
- Do NOT generate areas/items list (it is fetched from BusinessLocation table).
- Do NOT generate phoneText or phoneHref.
- Do NOT include markdown.
- Output ONLY valid JSON object.
`;
  },
};

