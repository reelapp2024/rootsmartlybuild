/**
 * Footer Section Generator
 * Matches GenieBuild footer section content structure
 */

module.exports = {
  id: "footer",

  schema: {
    brand: "string",
    description: "string",
    logoImageUrl: "string",
    links: [
      {
        title: "string",
        items: [
          {
            label: "string",
            href: "string"
          }
        ]
      }
    ],
    newsletterTitle: "string",
    newsletterPlaceholder: "string",
    newsletterButtonText: "string"
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
You are generating FOOTER content for a professional business website.

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
  "brand": "${projectName}",
  "description": "Brief company description (15-30 words)",
  "logoImageUrl": "",
  "links": [
    {
      "title": "Company",
      "items": [
        {
          "label": "About",
          "href": "#"
        },
        {
          "label": "Careers",
          "href": "#"
        }
      ]
    },
    {
      "title": "Legal",
      "items": [
        {
          "label": "Privacy Policy",
          "href": "#"
        },
        {
          "label": "Terms of Service",
          "href": "#"
        }
      ]
    }
  ],
  "newsletterTitle": "Subscribe to our newsletter",
  "newsletterPlaceholder": "Enter your email",
  "newsletterButtonText": "Subscribe"
}

Rules (VERY IMPORTANT):

BRAND:
- Use project name: ${projectName}

DESCRIPTION:
- Brief company description
- 15-30 words
- Professional and SEO optimized
- Related to ${mainCategory}

LOGO IMAGE URL:
- Leave empty string "" if using text brand
- Only provide URL if logo image is available

LINKS:
- Generate 2-3 link groups
- Common groups: "Company", "Legal", "Resources", "Support"
- Each group has title and items array
- Each item has label and href
- Standard footer links (About, Privacy Policy, Terms, etc.)

NEWSLETTER:
- newsletterTitle: Standard newsletter heading
- newsletterPlaceholder: Email input placeholder text
- newsletterButtonText: Subscribe button text

GLOBAL:
- Professional footer structure
- SEO-friendly links
- Do NOT include phone numbers
- Do NOT include email addresses
- Do NOT include physical addresses
- No markdown
- No explanations
- Output ONLY valid JSON object
`;
  }
};
