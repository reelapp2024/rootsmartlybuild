/**
 * Site-wide footer — AI prompts only (copy fields that match FooterPlumbing content keys).
 * Variant: apps/geniebuild/.../headerfooter/footer/FooterPlumbing.tsx
 */

module.exports = {
  id: "footer",

  schema: {
    tagline: "string",
    ctaTitle: "string",
    ctaSubtitle: "string",
    ctaButtonText: "string",
    contentRef: {
      logo: "site_header_footer",
      phone: "about_us",
      email: "about_us",
      address: "about_us",
      serviceLinks: "nav_sources.services",
      quickLinks: "site_header_footer.menu",
    },
  },

  prompt(ctx) {
    const { project } = ctx;
    const projectName = project?.projectName || "the business";
    const category = project?.mainCategory || project?.serviceType || "services";
    const location = project?.location || project?.city || "";

    return `
You are generating FOOTER marketing copy for ${projectName}${location ? ` in ${location}` : ""}.
Return STRICT JSON ONLY with these keys:

{
  "tagline": "<footer description under logo: 15-25 words, trust + ${category}>",
  "ctaTitle": "<short CTA headline>",
  "ctaSubtitle": "<one supporting line>",
  "ctaButtonText": "Book Now"
}

Rules:
- tagline: the only text shown under the logo in the footer (footer description). Write original copy for this business — do not reuse generic placeholder phrases.
- ctaTitle / ctaSubtitle: footer top banner only (not the tagline)
- Do NOT include phone, email, address, logo, service links, or quick links (from database at runtime)
- No markdown
`.trim();
  },
};
