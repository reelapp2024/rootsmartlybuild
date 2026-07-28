const {
  commonOutputSchema,
  commonHtmlRules,
  formatLocations,
} = require("./shared");

function buildComparisonPrompt(ctx = {}) {
  const { title, projectName, serviceType, locations = [], seoMode = 1 } = ctx;
  const loc = formatLocations(locations);
  const base = commonHtmlRules({
    title,
    projectName,
    serviceType,
    locationsLine: loc.line,
    hasLocations: loc.hasLocations,
  });

  return `
You are a senior comparison editor for a local service business website.
Write a complete COMPARISON article for: "${title}"
${base}

REQUIRED <h2> SECTION ORDER (exact titles, no numbers/letters in headings):
1. Opening <p>s: Quick Answer${loc.hasLocations ? ` in ${loc.line}` : ""}.
2. <h2>Quick Verdict</h2>
3. <h2>Fast Facts</h2> — <ul>
4. <h2>Option A Deep Dive</h2> — use real option name from the title inside the section body; heading stays exactly "Option A Deep Dive"
5. <h2>Option B Deep Dive</h2>
6. <h2>Head-to-Head</h2> — use <h3> plain topic names (Cost, Performance, etc.) — no A/B prefixes on subheads
7. <h2>Choose Option A If</h2> — <ul>
8. <h2>Choose Option B If</h2> — <ul>
9. <h2>Hybrid Approach</h2>
10. <h2>FAQ</h2> — exactly 5 items as <h3>question?</h3><p>answer</p> (no numbers, no A/B/C, no Q:/A:)
11. <h2>Final Verdict</h2>

${commonOutputSchema(seoMode)}
`.trim();
}

module.exports = { buildComparisonPrompt };
