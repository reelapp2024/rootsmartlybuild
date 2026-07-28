/**
 * Tag blog body HTML with GenieBuild-aligned element classes (gb-*).
 * Mirrors WordPress/Wix: semantic markup + theme CSS, not inline black text.
 * Safe for AI output and RichTextEditor HTML (full docs or body fragments).
 */

const TAG_TO_CLASS = {
  h1: "gb-h1",
  h2: "gb-h2",
  h3: "gb-h3",
  h4: "gb-h4",
  h5: "gb-h5",
  h6: "gb-h6",
  p: "gb-p",
  a: "gb-link",
  ul: "gb-ul",
  ol: "gb-ol",
  li: "gb-li",
  blockquote: "gb-quote",
  strong: "gb-strong",
  b: "gb-strong",
  em: "gb-em",
  i: "gb-em",
  img: "gb-img",
  hr: "gb-hr",
  figure: "gb-figure",
  figcaption: "gb-figcaption",
  pre: "gb-pre",
  code: "gb-code",
  table: "gb-table",
  thead: "gb-thead",
  tbody: "gb-tbody",
  tr: "gb-tr",
  th: "gb-th",
  td: "gb-td",
  details: "gb-faq",
  summary: "gb-faq-q",
};

const GB_CLASS_RE = /^gb-(h[1-6]|p|link|ul|ol|li|quote|strong|em|img|hr|figure|figcaption|pre|code|table|thead|tbody|tr|th|td|faq|faq-q|faq-a|review|review-quote|review-author|testimonial|testimonial-quote|testimonial-author|el)$/;

function mergeClassAttr(existing, required) {
  const parts = String(existing || "")
    .split(/\s+/)
    .map((c) => c.trim())
    .filter(Boolean);
  const set = new Set(parts);
  for (const cls of required) {
    if (cls) set.add(cls);
  }
  const keep = [];
  for (const c of set) {
    if (GB_CLASS_RE.test(c) || c === "gb-el") {
      keep.push(c);
      continue;
    }
    if (/^(text-(left|center|right|justify)|img-(sm|md|lg|full|left|center|right))$/.test(c)) {
      keep.push(c);
      continue;
    }
  }
  for (const cls of required) {
    if (cls && !keep.includes(cls)) keep.push(cls);
  }
  if (!keep.includes("gb-el")) keep.push("gb-el");
  return keep.join(" ");
}

function enhanceOpeningTag(tagName, attrsRaw) {
  const cls = TAG_TO_CLASS[tagName.toLowerCase()];
  if (!cls) return null;
  const attrs = attrsRaw || "";
  const required = [cls, "gb-el"];
  const classMatch = attrs.match(/\sclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (classMatch) {
    const quote = classMatch[2] != null ? '"' : classMatch[3] != null ? "'" : "";
    const existing = classMatch[2] ?? classMatch[3] ?? classMatch[4] ?? "";
    const merged = mergeClassAttr(existing, required);
    const replacement = quote
      ? ` class=${quote}${merged}${quote}`
      : ` class="${merged}"`;
    return `<${tagName}${attrs.replace(classMatch[0], replacement)}>`;
  }
  return `<${tagName}${attrs} class="${required.join(" ")}">`;
}

function enhanceBlogHtml(html) {
  let s = String(html || "");
  if (!s.trim()) return "";

  for (const tag of Object.keys(TAG_TO_CLASS)) {
    const re = new RegExp(`<${tag}(\\s[^>]*)?\\/?>`, "gi");
    s = s.replace(re, (full, attrs) => {
      const enhanced = enhanceOpeningTag(tag, attrs || "");
      if (!enhanced) return full;
      if (/\/\s*>$/.test(full) || tag === "img" || tag === "hr") {
        return enhanced.replace(/>$/, " />");
      }
      return enhanced;
    });
  }
  return s;
}

function h3InnerHtml(h3Block) {
  return String(h3Block || "")
    .replace(/^<h3\b[^>]*>/i, "")
    .replace(/<\/h3>\s*$/i, "")
    .trim();
}

function stripHtmlText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Answer panel must never repeat the question. */
function cleanFaqAnswerHtml(answerHtml, questionHtmlOrText) {
  let a = String(answerHtml || "").trim();
  if (!a) return "";

  const qText = stripHtmlText(questionHtmlOrText);
  const qNorm = qText.toLowerCase().replace(/[?？]/g, "").trim();

  a = a
    .replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, "")
    .replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, "")
    .replace(/<div\b[^>]*\bgb-faq-q\b[^>]*>[\s\S]*?<\/div>/gi, "");

  a = a.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs, inner) => {
    const plain = stripHtmlText(inner);
    const plainNorm = plain.toLowerCase().replace(/[?？]/g, "").trim();
    if (!plainNorm) return "";
    if (qNorm && plainNorm === qNorm) return "";
    if (qNorm && plainNorm.startsWith(qNorm)) {
      const restPlain = plain
        .replace(new RegExp(`^${escapeRegExp(qText)}`, "i"), "")
        .replace(/^[?？:\s\-–—]+/, "")
        .trim();
      if (!restPlain) return "";
      const strippedInner = String(inner)
        .replace(new RegExp(`^(\\s|<(strong|b|em|span)[^>]*>)*${escapeRegExp(qText)}`, "i"), "")
        .replace(/^(\s|<\/?(strong|b|em|span)[^>]*>|[?？:\-–—])+/i, "")
        .trim();
      if (strippedInner && stripHtmlText(strippedInner)) {
        return `<p${attrs || ""}>${strippedInner}</p>`;
      }
      return `<p${attrs || ""}>${restPlain}</p>`;
    }
    return full;
  });

  a = a.replace(/<div\b[^>]*\bgb-faq-a\b[^>]*>\s*<\/div>/gi, "").trim();
  const wrap = a.match(/^<div\b[^>]*\bgb-faq-a\b[^>]*>([\s\S]*)<\/div>\s*$/i);
  if (wrap) a = wrap[1].trim();
  return a.trim();
}

/** One FAQ item as a native accordion (same UX as site FAQ sections). */
function toFaqAccordion(questionInnerHtml, answerHtml) {
  const q = String(questionInnerHtml || "").trim();
  const a = cleanFaqAnswerHtml(answerHtml, q);
  if (!q || !stripHtmlText(a)) return "";
  return (
    `<details class="gb-faq gb-el" name="gb-blog-faq">` +
    `<summary class="gb-faq-q gb-el">${q}</summary>` +
    `<div class="gb-faq-a gb-el">${a}</div>` +
    `</details>`
  );
}

/**
 * Upgrade legacy static FAQ cards (`div.gb-faq` + h3/p) into `<details>` accordions.
 */
function upgradeLegacyFaqCards(html) {
  return String(html || "").replace(
    /<div\b([^>]*\bgb-faq\b[^>]*)>([\s\S]*?)<\/div>/gi,
    (full, _attrs, body) => {
      if (/<details\b/i.test(body) || /<summary\b/i.test(body)) return full;
      const m = String(body).match(/<h3\b[^>]*>([\s\S]*?)<\/h3>\s*([\s\S]*)/i);
      if (!m) return full;
      const paragraphs = String(m[2] || "").match(/<p\b[^>]*>[\s\S]*?<\/p>/gi);
      const answerHtml = paragraphs ? paragraphs.join("") : String(m[2] || "");
      const acc = toFaqAccordion(m[1], answerHtml);
      return acc || full;
    }
  );
}

function sanitizeExistingFaqAccordions(html) {
  return String(html || "").replace(
    /<details\b([^>]*\bgb-faq\b[^>]*)>([\s\S]*?)<\/details>/gi,
    (full, attrs, body) => {
      const sm = body.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
      if (!sm) return full;
      const q = sm[1];
      let after = body.replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/i, "");
      after = cleanFaqAnswerHtml(after, q);
      if (!stripHtmlText(after)) return full;
      return `<details${attrs}><summary class="gb-faq-q gb-el">${q}</summary><div class="gb-faq-a gb-el">${after}</div></details>`;
    }
  );
}

/**
 * Wrap FAQ Q&A pairs (h3 + following p) after an FAQ heading into
 * `<details>/<summary>` accordions — same interaction as website FAQ sections.
 */
function wrapFaqSections(html) {
  let s = String(html || "");
  if (!s) return s;

  s = upgradeLegacyFaqCards(s);
  s = sanitizeExistingFaqAccordions(s);

  if (!/<h2\b[^>]*>\s*FAQ\s*<\/h2>/i.test(s)) return s;

  return s.replace(
    /(<h2\b[^>]*>\s*FAQ\s*<\/h2>)([\s\S]*?)(?=<h2\b|$)/i,
    (_full, heading, body) => {
      const block = String(body || "").replace(
        /(<h3\b[^>]*>[\s\S]*?<\/h3>)\s*((?:<p\b[^>]*>[\s\S]*?<\/p>\s*)+)/gi,
        (pair, q, answers) => {
          if (/<details\b/i.test(pair) || /<summary\b/i.test(pair)) return pair;
          const acc = toFaqAccordion(h3InnerHtml(q), answers);
          return acc || pair;
        }
      );
      return heading + block;
    }
  );
}

/**
 * Strip dangerous chrome then stamp gb-* classes.
 * Preserves intentional editor inline colors (style=) for per-selection overrides.
 */
function prepareBlogContentHtml(html) {
  let s = String(html || "").trim();
  if (!s) return "";

  const mainMatch = s.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) s = mainMatch[1];
  else {
    const bodyMatch = s.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) s = bodyMatch[1];
  }

  const isFullDoc = /<!doctype|<html[\s>]/i.test(String(html || ""));

  s = s
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/\s(onclick|onerror|onload|onmouseover)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  s = enhanceBlogHtml(s);
  s = wrapFaqSections(s);

  if (isFullDoc) return s;
  return s;
}

module.exports = {
  TAG_TO_CLASS,
  enhanceBlogHtml,
  wrapFaqSections,
  upgradeLegacyFaqCards,
  prepareBlogContentHtml,
};
