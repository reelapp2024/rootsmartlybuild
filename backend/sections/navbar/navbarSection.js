/**
 * Navbar Section Generator
 * Matches GenieBuild navbar section content structure
 */

module.exports = {
  id: "navbar",

  schema: {
    logo: "string",
    logoImageUrl: "string",
    ctaText: "string",
    links: [
      {
        label: "string",
        href: "string"
      }
    ]
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

    return `
You are generating NAVBAR/HEADER content for a professional business website.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location:
${locationName || city || ""} ${state || ""}

Extra context:
${JSON.stringify(extraData)}

Return STRICT JSON ONLY:

{
  "logo": "${projectName}",
  "logoImageUrl": "",
  "ctaText": "Contact Us",
  "links": [
    {
      "label": "Home",
      "href": "#"
    },
    {
      "label": "About",
      "href": "#about"
    },
    {
      "label": "Services",
      "href": "#services"
    },
    {
      "label": "Contact",
      "href": "#contact"
    }
  ]
}

Rules (VERY IMPORTANT):

LOGO:
- Use project name: ${projectName}
- This is the text logo displayed in navbar

LOGO IMAGE URL:
- Leave empty string "" if using text logo
- Only provide URL if logo image is available

CTA TEXT:
- Standard call-to-action button text
- Examples: "Contact Us", "Get Started", "Book Now"
- 2-4 words

LINKS:
- Generate 4-6 navigation links
- Standard links: Home, About, Services, Contact
- Can add category-specific links related to ${mainCategory}
- Each link must have label and href
- href can be "#" for same-page anchors or full URLs

GLOBAL:
- Professional and standard navigation structure
- SEO-friendly link labels
- Do NOT include phone numbers
- Do NOT include email addresses
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
