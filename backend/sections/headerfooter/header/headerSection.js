/**
 * Site-wide header — AI prompts only (no marketing copy; runtime data only).
 * Variant: apps/geniebuild/.../headerfooter/header/HeaderPlumbing.tsx
 */

module.exports = {
  id: "header",
  aliases: ["navbar"],

  schema: {
    contentRef: {
      logo: "site_header_footer",
      phone: "about_us",
      nav: "nav_sources",
    },
  },

  prompt(ctx) {
    const projectName = ctx?.project?.projectName || "";

    return `
Header for ${projectName} is populated at runtime (logo, phone, navigation).
Return STRICT JSON ONLY: {}

Rules:
- Do NOT generate logo, phone, CTA, tagline, or nav items
- Output ONLY an empty JSON object: {}
`.trim();
  },
};
