/**
 * Shared FAQ prompt builder for content websites (projectType 2).
 * GenieBuild FaqFunky reads items[].title/question + description/answer.
 */

function buildContentFaqPrompt({
  pageLabel = 'homepage',
  project = {},
  extraData = {},
} = {}) {
  const projectName = project.projectName || '';
  const niche =
    project.focusKeyword || project.serviceType || extraData.nicheName || '';
  const category = project.serviceType || extraData.categoryName || '';
  const pageName = extraData.pageName || pageLabel;
  const faqHints = Array.isArray(extraData.faqKeywords)
    ? extraData.faqKeywords.filter(Boolean).slice(0, 12)
    : [];
  const primaryHints = Array.isArray(extraData.primaryKeywords)
    ? extraData.primaryKeywords.filter(Boolean).slice(0, 8)
    : [];

  return `
Create CONTENT for a niche CONTENT WEBSITE FAQ section.

Section: faq
Page: ${pageLabel} (${pageName})
Site: ${projectName}
Niche: ${niche}
Catalog category: ${category}
Goal: ${project.contentGoal || 'Pinterest Traffic'}

Seed questions from keyword research (prefer these when relevant):
${JSON.stringify(faqHints.length ? faqHints : ['(none — invent niche-relevant FAQs)'])}

Related article topics (for internal relevance, not as FAQ titles unless natural):
${JSON.stringify(primaryHints)}

Extra page context:
${JSON.stringify({
  pageType: extraData.pageType || null,
  pageSlug: extraData.pageSlug || null,
  categoryTitle: extraData.categoryTitle || null,
})}

Return STRICT JSON ONLY:
{
  "title": "Frequently Asked Questions (or niche-specific heading)",
  "subtitle": "1 supporting sentence for this page context",
  "body": "optional short intro paragraph",
  "items": [
    {
      "title": "Clear question readers actually ask?",
      "description": "Helpful 2–4 sentence answer in the site voice. No fluff.",
      "question": "same as title",
      "answer": "same as description",
      "link": "#"
    }
  ]
}

RULES:
- Return 5–8 FAQ items tailored to THIS page (${pageLabel}), not generic filler.
- title/question = the question; description/answer = the answer.
- Match niche voice (visual, pin-worthy, helpful). No phone/email.
- No invented external URLs (use "#").
- JSON only.
`.trim();
}

module.exports = { buildContentFaqPrompt };
