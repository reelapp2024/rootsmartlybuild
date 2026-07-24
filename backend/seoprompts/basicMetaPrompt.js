/**
 * Mode 1 — basic page SEO (title, description, keywords only).
 */
function buildBasicMetaPrompt({
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
Generate BASIC SEO meta for a business website page.
Return ONLY valid JSON with exactly these three keys (no other fields):

{
  "meta_title": "string (max 60 chars)",
  "meta_description": "string (max 160 chars)",
  "meta_keywords": "comma separated keywords"
}

Context:
- Project Name: ${projectName}
- Service Type: ${serviceType}
- Focus Keyword: ${focusKeyword}
- Project Keywords: ${projectKeywordsText}
- Page Name: ${pageName}
- Display Name: ${displayName}
- Page URL: ${pageUrl}
- Location: ${locationName || "N/A"}
- Service: ${serviceName || "N/A"}

Rules:
- Include location naturally when Location is not N/A.
- Include service naturally when Service is not N/A.
- meta_title must be compelling and under 60 characters.
- meta_description must be under 160 characters.
- Do not invent phone numbers or fake ratings.
`.trim();
}

module.exports = { buildBasicMetaPrompt };
