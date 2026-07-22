/**
 * Shared rules for AI blog content generation (V2).
 * Output is editor-ready semantic HTML only — no CSS, no page templates.
 * Design comes from GenieBuild blog section variants on SiteNextJS.
 */

const ALLOWED_TYPES = ["how", "best", "comparison", "what"];

function normalizeBlogType(type) {
  const t = String(type || "")
    .trim()
    .toLowerCase();
  if (t === "how to" || t === "howto" || t === "how-to") return "how";
  if (ALLOWED_TYPES.includes(t)) return t;
  return "how";
}

function formatLocations(locations) {
  const list = Array.isArray(locations)
    ? locations.map((l) => String(l || "").trim()).filter(Boolean)
    : [];
  if (!list.length) return { hasLocations: false, list: [], line: "none" };
  return {
    hasLocations: true,
    list,
    line: list.join(", "),
  };
}

function commonOutputSchema() {
  return `
Return STRICT JSON ONLY with this exact shape:
{
  "information": "string — 1–2 sentence excerpt (120–180 characters) for blog cards",
  "content_html": "string — article BODY HTML only",
  "meta_title": "string — SEO title ≤ 60 characters",
  "meta_description": "string — SEO description ≤ 155 characters",
  "meta_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "cover_alt": "string — short alt text for a cover image"
}
`.trim();
}

/**
 * Identical formatting rules for EVERY blog type — no numbered/lettered FAQ variants.
 */
function commonStructureRules() {
  return `
UNIFORM STRUCTURE RULES (mandatory for ALL blogs — do not invent alternate formats)
1. Section headings MUST be plain <h2>Title</h2> text only. No "1.", "2.", "A.", "B.", "Step 1:", "Q1:", etc. in headings.
2. Sub-headings MUST be plain <h3>Title</h3> text only. Same ban on numbers/letters prefixes.
3. Lists: use <ul>/<ol> + <li> only. Never write "1)" / "a)" / "A." as text inside list items as a fake outline system.
4. FAQ SECTION — EXACT format only (copy this pattern, always exactly 5 Q&As):
   <h2>FAQ</h2>
   <h3>First question ends with a question mark?</h3>
   <p>Answer in 2–4 clear sentences.</p>
   <h3>Second question ends with a question mark?</h3>
   <p>Answer in 2–4 clear sentences.</p>
   …repeat until 5 questions…
   FORBIDDEN in FAQ: numbering (1,2,3), letters (A,B,C), "Q:"/"A:" labels, <ol> wrapping questions, bold "Question:" prefixes.
5. Keep the same section order defined for this blog type. Do not skip or rename the required <h2> sections.
6. Target length: 900–1300 words (complete and useful, not padded).
`.trim();
}

function commonHtmlRules({ title, projectName, serviceType, locationsLine, hasLocations }) {
  return `
CONTEXT
- Exact blog title (use as H1 topic; do NOT wrap in <h1> — start with intro <p>): "${title}"
- Business / project: "${projectName || "the business"}"
- Service focus: "${serviceType || projectName || "local professional services"}"
- Locations: ${hasLocations ? locationsLine : "none (write generally, no fake city names)"}

HARD RULES FOR content_html
1. Output ONLY semantic article body HTML. Allowed tags: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <a>, <strong>, <em>, <blockquote>.
2. FORBIDDEN: <html>, <head>, <body>, <style>, <script>, <link>, <meta>, class=, id=, style=, CSS, inline styles, SVG, iframes, forms, <table>, blog layout chrome, author boxes, comment widgets, headers/footers, nav, TOC widgets.
3. No placeholder text (lorem, TODO, [insert], example.com).
4. Include a short Quick Answer opening (2–3 sentences) then the required sections.
5. Include 2–4 external https links where helpful: <a href="https://...">anchor text</a>.
6. ${hasLocations ? `Naturally mention these location(s) where relevant: ${locationsLine}. Do not spam every paragraph.` : "Do not invent specific city names."}
7. Tone: helpful, clear, professional. Second-person ("you") is fine.
8. Do NOT invent fake reviews, star ratings, author bios, or comment widgets in HTML.
9. Do NOT output CSS or layout chrome. GenieBuild variants handle design.

${commonStructureRules()}
`.trim();
}

/**
 * Strip anything that would break the RichTextEditor / GenieBuild blog body.
 */
function sanitizeArticleHtml(html) {
  let s = String(html || "").trim();
  if (!s) return "";

  // If a full document slipped through, keep body/main only
  const mainMatch = s.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) s = mainMatch[1];
  else {
    const bodyMatch = s.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) s = bodyMatch[1];
  }

  s = s
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<\/?(html|head|body|main|header|footer|nav|aside|section|article|div)(\s[^>]*)?>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/\s(class|id|style|onclick|onerror|onload)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  // Unwrap empty leftover wrappers
  s = s.replace(/<p>\s*<\/p>/gi, "").trim();
  return s;
}

function normalizeAiPayload(raw, title) {
  const obj = raw && typeof raw === "object" ? raw : {};
  const information = String(obj.information || obj.excerpt || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
  const content_html = sanitizeArticleHtml(
    obj.content_html || obj.contentHtml || obj.content || obj.body || ""
  );
  const meta_title = String(obj.meta_title || obj.metaTitle || title || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70);
  const meta_description = String(
    obj.meta_description || obj.metaDescription || information || ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  let meta_keywords = obj.meta_keywords || obj.metaKeywords || obj.keywords || [];
  if (typeof meta_keywords === "string") {
    meta_keywords = meta_keywords.split(/[,|]/).map((k) => k.trim()).filter(Boolean);
  }
  if (!Array.isArray(meta_keywords)) meta_keywords = [];
  meta_keywords = meta_keywords
    .map((k) => String(k || "").trim())
    .filter(Boolean)
    .slice(0, 12);
  const cover_alt = String(obj.cover_alt || obj.coverAlt || title || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return {
    information: information || String(title || "").slice(0, 160),
    content_html,
    meta_title: meta_title || String(title || "").slice(0, 60),
    meta_description:
      meta_description || information || String(title || "").slice(0, 155),
    meta_keywords,
    cover_alt,
  };
}

module.exports = {
  ALLOWED_TYPES,
  normalizeBlogType,
  formatLocations,
  commonOutputSchema,
  commonStructureRules,
  commonHtmlRules,
  sanitizeArticleHtml,
  normalizeAiPayload,
};
