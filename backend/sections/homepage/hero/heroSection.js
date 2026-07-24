/**
 * Hero Section Generator
 * Strict + Location-aware + No empty fields
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "hero",
  /** Primary hero + supporting slots (matches typical multicolor / project.images usage). */
  imageCount: 6,
  /** Image output size preset — see imageengines/imageSizeSpec.js */
  imageRole: "hero",

  schema: {
    title: "string",
    subtitle: "string",
    ctaText: "string",
    badgeText: "string",
    trustStripItems: "array<{icon:string,label:string}>",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
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

    const finalLocation = `${locationName || city || ""} ${state || ""}`.trim();
    const isAreasListing =
      String(pageName || extraData?.pageName || "")
        .toLowerCase()
        .trim() === "areas" ||
      String(extraData?.pageSlug || "")
        .toLowerCase()
        .includes("areas");

    const areasHint = isAreasListing
      ? `
PAGE CONTEXT: ALL AREAS DIRECTORY (/areas)
- This hero introduces a multi-city areas listing page (not a single-location landing).
- Title/subtitle should invite visitors to find their city / browse coverage areas.
- Avoid sounding like a single-neighborhood home hero; emphasize "areas we serve" / coverage map / find your location.
`
      : "";

    return `
You are generating HERO SECTION content for a professional business website.
${areasHint}
Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location Context:
${finalLocation || "No specific location"}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY (NO explanation, NO markdown):

{
  "title": "Powerful 5-8 word hero heading",
  "subtitle": "Supporting subheading (20-35 words)",
  "ctaText": "2-4 word call to action button text",
  "badgeText": "Short badge text (2-5 words)",
  "trustStripItems": [
    { "icon": "fa-clock", "label": "2-5 word trust point" },
    { "icon": "fa-shield-halved", "label": "2-5 word trust point" },
    { "icon": "fa-star", "label": "2-5 word trust point" }
  ],
  "ai_image_prompt": "28-55 words: one rich paragraph describing the MAIN wide hero photograph AND the same visual world for several supporting images (crew, tools, finished work, residential/commercial context). Photoreal, specific actions and lighting. Category: ${mainCategory}. No text in frame.",
  "non_ai_image_prompt": "3-10 words, keyword-only stock query for ${mainCategory} hero + lifestyle shots (e.g. \"solar installer rooftop safety harness\")"
}

================ RULES (VERY IMPORTANT) ================

TITLE:
- REQUIRED (must not be empty)
- Must be 5-8 words
- Compelling and action-oriented
- Include focus keyword naturally
- If location exists: include ${locationName || city || "the area"} OR city in the title OR subtitle (at least one) for local SEO
- Vary title shape per page: "${locationName || city || "Area"} ${mainCategory}", "Trusted ${mainCategory} in ${locationName || city || "Your Area"}", "${mainCategory} Serving ${locationName || city || "Local Homes"}"

SUBTITLE:
- REQUIRED (must not be empty)
- Must be 20-35 words
- Clear value proposition
- Professional and engaging
- If area is already in the title, use city, "local", or a neighborhood angle in the subtitle — different wording, not a copy-paste

CTA TEXT:
- REQUIRED (must not be empty)
- Must be 2-4 words
- Action-oriented (e.g., "Get Started", "Book Now", "Contact Us")

BADGE TEXT:
- REQUIRED (must not be empty)
- Must be 2-5 words
- Short, catchy label
- Examples: "Top Rated", "Trusted Experts", "Award Winning", "Licensed Crew"
- Should feel premium and attention-grabbing

TRUST STRIP ITEMS:
- REQUIRED (must not be empty)
- Return exactly 3 objects in trustStripItems
- Each object must have:
  - "icon": valid Font Awesome token without prefix (example: "fa-clock", "fa-shield-halved", "fa-star", "fa-award", "fa-thumbs-up")
  - "label": short trust phrase, 2-5 words, no punctuation at end
- Keep labels specific to the business category and location context

${IMAGE_PROMPT_JSON_RULES}

GLOBAL RULES:
- ALL fields are REQUIRED → DO NOT return empty string ""
- Output MUST be valid JSON
- Do NOT skip any key
- Do NOT add extra keys
- Do NOT include phone/email/address
- No markdown, no explanation
- Make content SEO optimized
- Each local area page must feel distinct: vary headline shape and trust points while keeping real place names for SEO

========================================================
`;
  },
};
