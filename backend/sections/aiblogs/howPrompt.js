const {
  commonOutputSchema,
  commonHtmlRules,
  formatLocations,
} = require("./shared");

function buildHowPrompt(ctx = {}) {
  const { title, projectName, serviceType, locations = [] } = ctx;
  const loc = formatLocations(locations);
  const base = commonHtmlRules({
    title,
    projectName,
    serviceType,
    locationsLine: loc.line,
    hasLocations: loc.hasLocations,
  });

  return `
You are a senior how-to editor for a local service business website.
Write a complete HOW-TO article for: "${title}"
${base}

REQUIRED <h2> SECTION ORDER (use these exact titles, no numbers/letters in headings):
1. Opening: 2–3 <p> Quick Answer (what you'll achieve)${loc.hasLocations ? ` mentioning ${loc.line} when natural` : ""}.
2. <h2>Why This Matters</h2>
3. <h2>What You'll Need</h2> — <ul> of tools/prep items
4. <h2>Before You Start</h2> — prep checklist <ul>
5. <h2>Step-by-Step Guide</h2> — one <ol> with clear <li> steps (6–10 steps). Do NOT put "Step 1" in <h3> titles.
6. <h2>Pro Tips</h2> — <ul>
7. <h2>Common Mistakes to Avoid</h2> — <ul>
8. <h2>When to Call a Professional</h2>
9. <h2>FAQ</h2> — exactly 5 items as <h3>question?</h3><p>answer</p> (no numbers, no A/B/C, no Q:/A:)
10. <h2>Conclusion</h2>

${commonOutputSchema()}
`.trim();
}

module.exports = { buildHowPrompt };
