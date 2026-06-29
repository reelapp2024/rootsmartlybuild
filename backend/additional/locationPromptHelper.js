const SECTION_GEO_HINTS = {
  hero: [
    "REQUIRED local SEO: include the area name OR city in the title OR subtitle (at least one).",
    "Good title shapes (pick one, vary per page): \"{Trade} in {Area}\", \"{Area} {Trade} Experts\", \"Trusted {Trade} Serving {Area}\".",
    "If the area is in the title, use city/parent area or \"local\" / \"nearby\" in the subtitle — different wording, not a duplicate.",
  ],
  servicehero: [
    "REQUIRED: serviceHeroTitle must pair the service name with the area or city once (e.g. \"{Service} in {Area}\", \"{Area} {Service}\").",
    "Subtitle: one more natural geo reference with different phrasing (serving, across, properties in, near).",
  ],
  about: [
    "Include area name or city in title OR subtitle once for local relevance.",
    "One featureBox description may mention the area; use a different phrase than the title (e.g. \"serving {Area}\", \"{Area} homes\").",
  ],
  aboutservice: [
    "Mention the area or city 2–3 times across the three paragraphs — each time with different wording (serving, homeowners in, properties across, near {Area}).",
    "Paragraph 2 should carry the strongest local/practical angle.",
  ],
  faq: [
    "heading OR descriptionText: include area or city once (e.g. \"{Category} FAQs — {Area}\" or \"Common questions for {Area} customers\").",
    "Across FAQ items: 3–5 answers should mention the area or city naturally; at most 2 questions should include the area name — never every question.",
  ],
  features: [
    "title OR subtitle: one geo mention. 1–2 feature descriptions may reference the area with varied phrasing.",
  ],
  whychooseus: [
    "title OR subtitle: one geo mention.",
    "2–3 benefit descriptions may reference local context — mix area name, city, \"local\", \"nearby\", not the same \"in {Area}\" on every line.",
  ],
  process: [
    "Section description: one mention of area or city.",
    "At most 1–2 step descriptions may reference local on-site realities; do not put \"in {Area}\" in every step title.",
  ],
  cta: [
    "title OR subtitle: include area or city once with a clear local call-to-action angle.",
  ],
  testimonials: [
    "subtitle may mention the area once.",
    "1–2 review quotes may reference the area or city naturally — not every review, and not identical phrasing.",
  ],
  services: [
    "Section title/description: one natural geo mention; vary headline shape vs other neighborhoods.",
    "Each service card teaser MUST be unique — different angle, opener, and scenario per card; geo in 2–4 cards only, varied phrasing.",
    "Never use the same card blurb template with only the service name changed.",
  ],
  servicesgrid: [
    "Same as services: unique header hook per location; card teasers must not look copy-pasted across areas.",
  ],
};

function buildLocationAwarePrompt(basePrompt = "", locationDisplayName = "", currentSectionId = "") {
  if (!locationDisplayName) return basePrompt;

  const areaLabel = String(locationDisplayName).split(",")[0].trim();
  const sectionKey = String(currentSectionId || "").toLowerCase().replace(/-/g, "");
  const sectionHints = SECTION_GEO_HINTS[sectionKey] || [
    "Include the area or city in 2–3 text fields across this JSON for local SEO.",
    "Vary phrasing: area name, city, serving, local, nearby, properties in — not the same template every field.",
  ];

  return `${basePrompt}

LOCAL SEO — area: "${areaLabel}" (use city/parent from context when it reads better):
${sectionHints.map((line) => `- ${line.replace(/\{Area\}/g, areaLabel)}`).join("\n")}

BALANCE (read like a pro local page, not a mail-merge):
- DO include real place names for SEO — customers and search engines expect "${areaLabel}" or the city on the page.
- DO vary how you say it: "${areaLabel}", "serving ${areaLabel}", "${areaLabel} homeowners", "properties in ${areaLabel}", "the ${areaLabel} area", city name when provided.
- DO spread mentions across fields (title, subtitle, body, select FAQs) — not stacked in one sentence.
- DO NOT repeat the exact phrase "in ${areaLabel}" more than twice in this JSON.
- DO NOT put the area name in every heading, every FAQ question, and every bullet — that reads robotic.
- DO NOT append "in ${areaLabel}" to a generic line just to fake localization.
- Each local area page must still feel UNIQUE: different hook, examples, and priorities — only the geo label is shared.
- Section "${currentSectionId}": follow the geo hints above; substance first, natural local keywords second.
`;
}

module.exports = {
  buildLocationAwarePrompt,
};
