



function normalizeInput(str) {
  if (!str) return '';
  return str
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function conjugate3sg(base) {
  const lower = base.toLowerCase();
  if (/(s|x|z|ch|sh)$/.test(lower)) return base + 'es';
  if (/[^aeiou]y$/.test(lower)) return base.slice(0, -1) + 'ies';
  if (/^have$/i.test(lower)) return base.replace(/have/i, 'has');
  if (/^do$/i.test(lower)) return base.replace(/do/i, 'does');
  return base + 's';
}

function postHeuristics(text) {
  let out = text;

  // 1) Subject–verb agreement for simple NPs: "He/She/It/The boy/girl/man/woman/child/student/user ... run/go/buy/need/have..."
  out = out.replace(
    /\b((?:[Hh]e|[Ss]he|[Ii]t|[Tt]he\s+\w+))\s+(run|go|buy|need|want|have|do|say|pay|come|make|take|give|try|walk|work|look|ask|seem|feel|leave|call)\b/g,
    (_, subj, verb) => `${subj} ${conjugate3sg(verb)}`
  );

  // 2) Adverb form: quick -> quickly when adjacent to a movement/action verb context
  out = out.replace(
    /\b(quick)\b(?=\s*(?:because|and|but|,|\.|$)|\s+(?:to|toward|towards|into|onto|back|home)|\s+(?:run|go|walk|move|hurry|rush|drive|travel)\b)/gi,
    'quickly'
  );

  return out;
}

function applyMatches(text, matches) {
  let out = text;
  for (const m of matches) {
    if (!m.replacements || !m.replacements.length) continue;
    const rep = m.replacements[0].value;
    out = out.slice(0, m.offset) + rep + out.slice(m.offset + m.length);
  }
  return out;
}

async function callLT(text) {
  const body = new URLSearchParams({
    text,
    language: 'en-US',
    level: 'picky',
    enabledOnly: 'false'
  }).toString();

  const { data } = await axios.post(
    'https://api.languagetool.org/v2/check',
    body,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );
  return data;
}

async function fixGrammarLT(text, maxPasses = 3) {
  if (!text || typeof text !== 'string') return '';
  let fixed = normalizeInput(text);

  for (let pass = 0; pass < maxPasses; pass++) {
    const data = await callLT(fixed);
    const matches = (data.matches || [])
      .filter(m => m?.replacements?.length && m.offset >= 0 && m.length >= 0)
      .sort((a, b) => b.offset - a.offset);

    if (matches.length === 0) break;

    const next = applyMatches(fixed, matches);
    if (next === fixed) break;
    fixed = next;
  }

  // Lightweight heuristic cleanup for common misses
  fixed = postHeuristics(fixed);

  return fixed;
}




(async () => {


  const input = "The boy run to the store quick because he don’t wants the shop to close before he buy milk.";
  const corrected = await fixGrammarLT(input);
  console.log({ input, corrected });
})();

