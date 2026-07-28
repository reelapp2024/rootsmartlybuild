const {
  commonOutputSchema,
  commonHtmlRules,
  formatLocations,
} = require("./shared");

function buildBestPrompt(ctx = {}) {
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
You are a senior recommendations editor for a local service business website.
Write a complete BEST / recommendations article for: "${title}"
${base}

REQUIRED <h2> SECTION ORDER (exact titles, no numbers/letters in headings):
1. Opening <p>s: Quick Answer${loc.hasLocations ? ` (${loc.line})` : ""}.
2. <h2>What You'll Learn</h2> — <ul>
3. <h2>How We Ranked These Options</h2>
4. <h2>Top Picks</h2> — exactly 6 picks. For EACH use:
   <h3>Pick Name</h3>  (plain name only — NO "#1", "1.", "A.")
   <p><strong>Best for:</strong> …</p>
   <p>Overview</p>
   <ul> key features
   <p><strong>Watch-outs:</strong> …</p>
5. <h2>At-a-Glance Comparison</h2> — <ul> only (no tables)
6. <h2>Buyer's Guide</h2>
7. <h2>FAQ</h2> — exactly 5 items as <h3>question?</h3><p>answer</p> (no numbers, no A/B/C, no Q:/A:)
8. <h2>Final Verdict</h2>

${commonOutputSchema(seoMode)}
`.trim();
}

module.exports = { buildBestPrompt };
