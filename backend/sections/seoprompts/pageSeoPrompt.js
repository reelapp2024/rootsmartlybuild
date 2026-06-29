function buildPageSeoPrompt({
  projectName = "",
  serviceType = "",
  focusKeyword = "",
  projectKeywordsText = "",
  pageName = "",
  displayName = "",
  pageUrl = "",
  locationName = "",
  serviceName = "",
}) {
  return `
Generate SEO JSON for a business website page.

Project:
- Project Name: ${projectName}
- Service Type: ${serviceType}
- Focus Keyword: ${focusKeyword}
- Project Keywords: ${projectKeywordsText}

Page:
- Page Name: ${pageName}
- Display Name: ${displayName}
- Page URL: ${pageUrl}
- Location Context: ${locationName || "N/A"}
- Service Context: ${serviceName || "N/A"}

Hard requirements:
- If Location Context exists, include it naturally in meta_title, meta_description, and meta_keywords.
- If Service Context exists, include it naturally in meta_title, meta_description, and meta_keywords.

Return ONLY valid JSON with this exact shape:
{
  "meta_title": "string (max 60 chars)",
  "meta_description": "string (max 160 chars)",
  "meta_keywords": "comma separated keywords",
  "meta_image": "absolute or relative image URL for social preview",
  "canonical_url": "full or path canonical URL for this page",
  "og_title": "OpenGraph title (defaults to meta_title if empty)",
  "og_description": "OpenGraph description (defaults to meta_description)",
  "og_image": "OpenGraph image URL (defaults to meta_image)",
  "og_type": "website",
  "og_site_name": "business / site name",
  "twitter_card": "summary_large_image",
  "twitter_site": "@handle or empty",
  "robots": "index,follow",
  "language": "en"
}
`;
}

module.exports = {
  buildPageSeoPrompt,
};
