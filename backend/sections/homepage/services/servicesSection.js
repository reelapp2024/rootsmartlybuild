/**
 * Services Section Generator
 * Matches GenieBuild services section content structure
 */

const CARD_ANGLES = [
  "speed / emergency response",
  "craftsmanship / lasting workmanship",
  "residential homes & daily use",
  "commercial / multi-unit properties",
  "preventive maintenance & planning",
  "safety, codes & compliance mindset",
  "seasonal or weather-driven needs",
  "upgrades, retrofits & modernization",
];

function buildServiceCardAnglePlan(serviceCards = [], locationLabel = "") {
  const seed = [...String(locationLabel || "local")].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (serviceCards || []).map((card, idx) => ({
    ...card,
    angle: CARD_ANGLES[(seed + idx * 3) % CARD_ANGLES.length],
  }));
}

function gridCopyPrompt(ctx) {
  const { project, location, extraData = {} } = ctx;

  const projectName = project.projectName || "";
  const mainCategory = project.mainCategory || project.serviceType || "";
  const focusKeyword = project.focusKeyword || "";
  const seoKeywords = project.projectKeywordsText || "";

  const locationName = location?.name || location?.areaName || "";
  const city = location?.city || "";
  const state = location?.state || "";
  const loc = `${locationName || city || ""} ${state || ""}`.trim() || "none";

  const rawCards = Array.isArray(extraData.serviceCards) ? extraData.serviceCards : [];
  const serviceCards = buildServiceCardAnglePlan(rawCards, locationName || city || loc);
  const cardLines = serviceCards
    .map(
      (c, i) =>
        `${i + 1}. serviceId="${c.serviceId}" name="${c.name}" → write from angle: ${c.angle}`
    )
    .join("\n");

  return `
You are writing the FULL services grid copy for ONE local business page (header + every service card teaser).

Business: ${projectName}
Trade / category: ${mainCategory}
Focus keyword: ${focusKeyword}
SEO keywords: ${seoKeywords}
Location: ${loc}
IMPORTANT: All copy (badge, title, description, every card) must be written for THIS location only — "${loc}". Do not write as if you are a different sub-area or child location.

Service cards (write a UNIQUE teaser for EACH — same count, same serviceIds, same order):
${cardLines || "none"}

Return STRICT JSON ONLY:
{
  "badgeText": "2-4 words, specific to this trade and area (not generic)",
  "title": "5-12 words — local SEO; vary shape vs other neighborhoods (not always \"{Trade} in {Area}\")",
  "description": "28-45 words — section intro; mention ${locationName || city || "the area"} or city once naturally",
      "items": [
    {
      "serviceId": "exact id from list above",
      "description": "18-32 words — unique teaser for THIS service at THIS location"
    }
  ]
}

UNIQUENESS (CRITICAL — this page must NOT look like another location's services block):
- Every card description MUST use its assigned angle — different benefit, scenario, or customer type per card.
- NEVER reuse the same sentence opener across cards (ban repeats like "We offer", "Our team", "Professional", "Get reliable").
- NEVER use one template with only the service name swapped (e.g. "{Service} for {Area} properties — clear scope…" on every card).
- NEVER copy the same header or card blurbs you would write for a different neighborhood — change hook, examples, and priority.
- Card copy is a GRID TEASER (one compelling line), not the full service page — write fresh from scratch.
- Sound human and specific: short concrete detail (timing, property type, season, access) beats generic marketing adjectives.
- Avoid AI clichés: "comprehensive solutions", "cutting-edge", "seamless experience", "trusted partner", "top-notch", "state-of-the-art".
- Include ${locationName || city || "the area"} or city in the section description and in 2–4 card descriptions total — varied phrasing, not "in X" on every card.
- items array length MUST equal the service list length; serviceId MUST match exactly.

GLOBAL:
- Do NOT invent new services or rename services.
- No phone/email/address.
- No markdown.
- Output ONLY valid JSON.
`;
}

module.exports = {
  id: "services",

  schema: {
    badgeText: "string",
    title: "string",
    description: "string",
    items: [
      {
        id: "string",
        icon: "string",
        title: "string",
        description: "string",
      },
    ],
  },

  gridCopyPrompt,

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";
    const serviceNames = Array.isArray(extraData?.serviceNames)
      ? extraData.serviceNames.filter(Boolean)
      : [];

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const loc = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are generating a "Services" section for a professional business website.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}
Known Services: ${serviceNames.length ? serviceNames.join(", ") : "none provided"}
Location: ${loc || "none"}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:
{
  "badgeText": "2-4 words, business-specific section eyebrow",
  "title": "4-9 words, dynamic and business-specific (NOT generic)",
  "description": "18-32 words explaining service breadth and value",
  "items": [
    {
      "id": "service-1",
      "icon": "fas fa-star",
      "title": "Service title (2-5 words)",
      "description": "Service description (14-26 words)"
    }
  ]
}

Rules (VERY IMPORTANT):
- badgeText must NOT be "Workflow"
- title must NOT be "Our Services" and must NOT be generic filler
- Include ${locationName || city || "the area"} or city in title OR description once for local SEO
- Generate EXACTLY 4-8 service items
- Each item id MUST be unique: service-1, service-2, ...
- Each card description MUST use a DIFFERENT angle (speed, quality, commercial, residential, maintenance, safety, etc.)
- NEVER reuse sentence openers or the same blurb template across cards
- icon must be valid Font Awesome class in format "fas fa-..."
- Every icon must be different
- If known services are provided, items MUST align to those services and not invent unrelated categories
- Keep copy professional and conversion-focused
- Avoid phone/email/address/contact instructions
- No markdown
- No explanations
- Output ONLY valid JSON object matching the schema
`;
  },
};
