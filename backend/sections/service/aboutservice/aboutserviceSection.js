/**
 * Service detail — long "about this service" body
 * Multicolor: data.service.about_service (string / HTML-friendly)
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../sectionImagePrompts");

module.exports = {
  id: "aboutservice",
  imageCount: 2,

  schema: {
    about_service: "string",
    ai_image_prompt: "string",
    non_ai_image_prompt: "string",
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || project.serviceType || "";
    const focusKeyword =
      project.focusKeyword || project.projectKeywordsText || project.serviceType || "";
    const serviceName = extraData.serviceName || extraData.service_name || "";
    const serviceSlug = extraData.serviceSlug || extraData.service_slug || "";
    const servicePageSlug = extraData.servicePageSlug || "";
    const parentAreaName = extraData.parentAreaName || "";
    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const country = location?.country || "";
    const finalLocation = [locationName, parentAreaName, city, state, country].filter(Boolean).join(" · ") || "none";

    return `
Write the ABOUT THIS SERVICE section for a service detail page (SEO + human readers).

Business / brand: ${projectName}
Trade or category: ${mainCategory}
Primary SEO keyword (use once, naturally): ${focusKeyword || serviceName || mainCategory}
Service (exact offering): ${serviceName || "Core service"}
Service slug (internal, do not paste as a URL): ${serviceSlug || "n/a"}
Published path hint (internal): ${servicePageSlug || "n/a"}
Location stack: ${finalLocation}

Extra context (JSON — use facts, do not echo keys verbatim):
${JSON.stringify(extraData)}

Return STRICT JSON ONLY with these keys:

{
  "about_service": "Single string: EXACTLY 3 paragraphs separated by two newline characters (\\n\\n) between paragraphs. Total 120–220 words (count before returning JSON). Plain sentences; optional <p> tags OK. Must be SPECIFIC to this service name and this location (climate, building types, local expectations, how visits are run). Educational + trust + light conversion. No phone, email, street address, or URLs.",
  "ai_image_prompt": "28–48 words: photoreal scenes for this exact service in this place — people, tools, environment, progress-to-finish; no overlaid text.",
  "non_ai_image_prompt": "3–10 words: tight stock keywords only (service + place + trade nouns)."
}

${IMAGE_PROMPT_JSON_RULES}

HARD BANS (violation = bad output):
- Do NOT use this or any close variant: "Our team provides dependable … with a focus on quality, speed, and long-term value" or "We tailor each visit to local requirements and customer priorities, ensuring safe execution and consistent outcomes."
- Do NOT open with "In today's world", "Look no further", "When it comes to", or "At the end of the day".
- Do NOT fill space with vague superlatives ("best-in-class", "#1") without concrete detail tied to ${serviceName || "the service"} and ${locationName || "the area"}.

MUST:
- Paragraph 1: what "${serviceName || "this service"}" solves and how work is scoped — mention ${locationName || "this area"} or city once naturally.
- Paragraph 2: strongest local angle (property types, access, seasonality, materials) — use a different geo phrase than paragraph 1 (serving, homeowners in, properties across, near ${locationName || "the area"}).
- Paragraph 3: expectations (timelines, consultation, quality checks) — optional third geo mention with varied wording; still no contact blocks.
- Use "${serviceName || "this service"}" and place names 2–3 times total across all paragraphs — varied phrasing, not keyword stuffing.
- "${serviceName} in ${locationName}" is fine once if it reads naturally in body copy; do not repeat that exact phrase.
- Output ONLY valid JSON.

FINAL CHECK (mandatory before you respond):
- Count words in about_service. Target 120–220 words (hard minimum ${75} words or validation fails).
- If total is under 120 words, expand paragraph 2 and 3 with concrete local detail before returning JSON.
- Do not return until you reach at least 120 words.
`;
  }
};
