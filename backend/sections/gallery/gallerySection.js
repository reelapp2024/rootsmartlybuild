module.exports = {
  sectionId: "gallery",

  prompt: ({ project, location, pageId }) => {
    const projectName = project?.projectName || "";
    const mainCategory = project?.categories?.[0] || project?.serviceType || "";
    const focusKeyword = project?.focusKeyword || "";
    const page = pageId || "homepage";
    const locationName = location?.name || "";

    return `
You are generating content for a website gallery section.

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
Current Page: ${page}
Location Context: ${locationName || "global"}

TASK:

Generate a Gallery section for this page.

The gallery should visually represent real-world work, environments, services, or results related to "${mainCategory}".

Rules:

1. Generate ONE gallery title (string).
2. Generate a JSON array of 6–10 gallery image objects.
3. Each image object must include:
   - "title": short descriptive title (3–6 words)
   - "alt": SEO friendly alt text related to "${mainCategory}"
   - "description": short contextual description (8–15 words)

4. Do NOT include:
   - phone numbers
   - emails
   - addresses
   - offers
   - pricing
   - dates

5. Titles and descriptions must be unique.
6. Content must feel natural and professional.
7. Make content page-aware:
   - Homepage → general business showcase
   - About → team / culture / behind the scenes
   - Services → service execution
   - Location pages → local context

OUTPUT FORMAT (STRICT JSON ONLY):

{
  "title": "Gallery Section Title",
  "images": [
    {
      "title": "Sample Image Title",
      "alt": "SEO friendly alt text",
      "description": "Short description related to ${mainCategory}"
    }
  ]
}

Return ONLY valid JSON.
`;
  }
};
