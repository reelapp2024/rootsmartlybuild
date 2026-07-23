/**
 * Prompt: generate fake blog reviews using PRE-ASSIGNED unique reviewer names.
 * Names are allocated server-side so first/last never repeat across the batch.
 */

function buildFakeReviewsPrompt({
  title = "Blog",
  assignedNames = [],
  referenceNames = [],
  needed = 2,
  chunkIndex = 0,
  totalChunks = 1,
} = {}) {
  const article = String(title || "Blog").trim() || "Blog";
  const names = (Array.isArray(assignedNames) ? assignedNames : [])
    .map((n) => String(n || "").trim())
    .filter(Boolean);
  const count = Math.max(1, names.length || Number(needed) || 1);

  const refs = (Array.isArray(referenceNames) ? referenceNames : [])
    .map((n) => String(n || "").trim())
    .filter(Boolean);

  const nameList = names.length
    ? names.map((n, i) => `${i + 1}. ${n}`).join("\n")
    : "(server will assign names)";

  const styleHint = refs.length
    ? `Tone/style inspiration only (do NOT invent different people than the list below): ${refs.join(", ")}.`
    : `Write in a natural, diverse reader voice.`;

  return `You are writing ${count} authentic-sounding reader reviews for a blog article titled "${article}".

${styleHint}

MANDATORY REVIEWER NAMES — use EXACTLY these full names, in this exact order (one review each).
Do NOT rename, swap, shorten, or invent alternatives:
${nameList}

RULES:
1. Review #1 must use name #1, review #2 must use name #2, and so on.
2. fullName field MUST match the assigned name character-for-character.
3. email must be realistic lowercase matching that fullName (e.g. maya.brooks91@example.com).
4. reviewText: 1–3 natural sentences that show the reviewer read "${article}". Vary tone across reviews.
5. rating: integer 1–5 (mostly 4–5, occasional 3).
6. image: always null.
7. This is chunk ${Number(chunkIndex) || 0} of ${Math.max(1, Number(totalChunks) || 1)}.

Return ONLY a JSON array with exactly ${count} objects. No markdown fences, no commentary.
Schema:
{
  "fullName": "Exact Assigned Name",
  "email": "exact.assigned@example.com",
  "rating": 5,
  "reviewText": "…",
  "image": null
}`;
}

module.exports = {
  buildFakeReviewsPrompt,
};
