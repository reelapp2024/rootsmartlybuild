const {
  commonOutputSchema,
  commonHtmlRules,
  formatLocations,
} = require("./shared");

function buildWhatPrompt(ctx = {}) {
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
You are a senior explainer writer for a local service business website.
Write a complete WHAT / WHY / explainer article for: "${title}"
${base}

REQUIRED <h2> SECTION ORDER (exact titles, no numbers/letters in headings):
1. Opening <p>s: Quick Answer definition${loc.hasLocations ? ` (${loc.line})` : ""}.
2. <h2>The Basics</h2>
3. <h2>Why It Matters</h2>
4. <h2>How It Works</h2> — <ol> or short <h3> stages with plain titles
5. <h2>Key Benefits</h2> — <ul>
6. <h2>Important Considerations</h2>
7. <h2>Signs You Need Help</h2> — <ul>
8. <h2>What To Expect From a Professional</h2>
9. <h2>FAQ</h2> — exactly 5 items as <h3>question?</h3><p>answer</p> (no numbers, no A/B/C, no Q:/A:)
10. <h2>Bottom Line</h2>

${commonOutputSchema()}
`.trim();
}

module.exports = { buildWhatPrompt };
