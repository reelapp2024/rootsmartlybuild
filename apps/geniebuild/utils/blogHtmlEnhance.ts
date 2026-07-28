/**
 * Client-side stamp of GenieBuild blog element classes (mirrors backend blogHtmlEnhance).
 * Ensures older posts without gb-* still pick up theme CSS + FAQ accordions.
 */

const TAG_TO_CLASS: Record<string, string> = {
  h1: 'gb-h1',
  h2: 'gb-h2',
  h3: 'gb-h3',
  h4: 'gb-h4',
  h5: 'gb-h5',
  h6: 'gb-h6',
  p: 'gb-p',
  a: 'gb-link',
  ul: 'gb-ul',
  ol: 'gb-ol',
  li: 'gb-li',
  blockquote: 'gb-quote',
  strong: 'gb-strong',
  b: 'gb-strong',
  em: 'gb-em',
  i: 'gb-em',
  img: 'gb-img',
  hr: 'gb-hr',
  figure: 'gb-figure',
  figcaption: 'gb-figcaption',
  code: 'gb-code',
  details: 'gb-faq',
  summary: 'gb-faq-q',
};

function mergeClasses(existing: string, required: string[]): string {
  const set = new Set(
    String(existing || '')
      .split(/\s+/)
      .map((c) => c.trim())
      .filter(Boolean)
  );
  for (const c of required) set.add(c);
  if (!set.has('gb-el')) set.add('gb-el');
  return Array.from(set).join(' ');
}

export function stripHtmlText(html: string): string {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function h3InnerHtml(h3Block: string): string {
  return String(h3Block || '')
    .replace(/^<h3\b[^>]*>/i, '')
    .replace(/<\/h3>\s*$/i, '')
    .trim();
}

function escapeRegExp(s: string): string {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Answer panel must NOT repeat the question (legacy wrap left h3 / duplicate p).
 */
export function cleanFaqAnswerHtml(answerHtml: string, questionHtmlOrText: string): string {
  let a = String(answerHtml || '').trim();
  if (!a) return '';

  const qText = stripHtmlText(questionHtmlOrText);
  const qNorm = qText.toLowerCase().replace(/[?？]/g, '').trim();

  // Strip leftover headings / summary inside answer
  a = a
    .replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, '')
    .replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, '')
    .replace(/<div\b[^>]*\bgb-faq-q\b[^>]*>[\s\S]*?<\/div>/gi, '');

  // Drop paragraphs that only repeat the question (or start with it as a label)
  a = a.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs, inner) => {
    const plain = stripHtmlText(inner);
    const plainNorm = plain.toLowerCase().replace(/[?？]/g, '').trim();
    if (!plainNorm) return '';
    if (qNorm && plainNorm === qNorm) return '';
    if (qNorm && plainNorm.startsWith(qNorm)) {
      const restPlain = plain
        .replace(new RegExp(`^${escapeRegExp(qText)}`, 'i'), '')
        .replace(/^[?？:\s\-–—]+/, '')
        .trim();
      if (!restPlain) return '';
      // Keep original inner HTML if question wasn't the whole thing as HTML prefix
      const strippedInner = String(inner)
        .replace(new RegExp(`^(\\s|<(strong|b|em|span)[^>]*>)*${escapeRegExp(qText)}`, 'i'), '')
        .replace(/^(\s|<\/?(strong|b|em|span)[^>]*>|[?？:\-–—])+/i, '')
        .trim();
      if (strippedInner && stripHtmlText(strippedInner)) {
        return `<p${attrs || ''}>${strippedInner}</p>`;
      }
      return `<p${attrs || ''}>${restPlain}</p>`;
    }
    return full;
  });

  // Unwrap empty wrappers
  a = a.replace(/<div\b[^>]*\bgb-faq-a\b[^>]*>\s*<\/div>/gi, '').trim();
  // If still wrapped in gb-faq-a, unwrap once
  const wrap = a.match(/^<div\b[^>]*\bgb-faq-a\b[^>]*>([\s\S]*)<\/div>\s*$/i);
  if (wrap) a = wrap[1].trim();

  return a.trim();
}

function toFaqAccordion(questionInnerHtml: string, answerHtml: string): string {
  const q = String(questionInnerHtml || '').trim();
  const a = cleanFaqAnswerHtml(answerHtml, q);
  if (!q || !stripHtmlText(a)) return '';
  return (
    `<details class="gb-faq gb-el" name="gb-blog-faq">` +
    `<summary class="gb-faq-q gb-el">${q}</summary>` +
    `<div class="gb-faq-a gb-el">${a}</div>` +
    `</details>`
  );
}

/** Upgrade legacy static FAQ cards into native accordions. */
function upgradeLegacyFaqCards(html: string): string {
  return String(html || '').replace(
    /<div\b([^>]*\bgb-faq\b[^>]*)>([\s\S]*?)<\/div>/gi,
    (full, _attrs: string, body: string) => {
      if (/<details\b/i.test(body) || /<summary\b/i.test(body)) return full;
      const m = String(body).match(/<h3\b[^>]*>([\s\S]*?)<\/h3>\s*([\s\S]*)/i);
      if (!m) return full;
      // Only keep answer paragraphs — never leave the h3 in the answer
      const paragraphs = String(m[2] || '').match(/<p\b[^>]*>[\s\S]*?<\/p>/gi);
      const answerHtml = paragraphs ? paragraphs.join('') : String(m[2] || '');
      return toFaqAccordion(m[1], answerHtml) || full;
    }
  );
}

/** Fix already-saved details that still have the question inside the answer panel. */
function sanitizeExistingFaqAccordions(html: string): string {
  return String(html || '').replace(
    /<details\b([^>]*\bgb-faq\b[^>]*)>([\s\S]*?)<\/details>/gi,
    (full, attrs: string, body: string) => {
      const sm = body.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
      if (!sm) return full;
      const q = sm[1];
      let after = body.replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/i, '');
      after = cleanFaqAnswerHtml(after, q);
      if (!stripHtmlText(after)) return full;
      return `<details${attrs}><summary class="gb-faq-q gb-el">${q}</summary><div class="gb-faq-a gb-el">${after}</div></details>`;
    }
  );
}

function wrapFaqSectionsClient(html: string): string {
  let s = String(html || '');
  if (!s) return s;

  s = upgradeLegacyFaqCards(s);
  s = sanitizeExistingFaqAccordions(s);

  if (!/<h2\b[^>]*>\s*FAQ\s*<\/h2>/i.test(s)) return s;

  return s.replace(
    /(<h2\b[^>]*>\s*FAQ\s*<\/h2>)([\s\S]*?)(?=<h2\b|$)/i,
    (_full, heading: string, body: string) => {
      const block = String(body || '').replace(
        /(<h3\b[^>]*>[\s\S]*?<\/h3>)\s*((?:<p\b[^>]*>[\s\S]*?<\/p>\s*)+)/gi,
        (pair: string, q: string, answers: string) => {
          if (/<details\b/i.test(pair) || /<summary\b/i.test(pair)) return pair;
          return toFaqAccordion(h3InnerHtml(q), answers) || pair;
        }
      );
      return heading + block;
    }
  );
}

export type BlogFaqItem = { title: string; content: string };

/**
 * Split FAQ out of blog HTML so the live page can render the same accordion
 * component as website FAQ sections (question in summary, answer-only body).
 */
export function splitBlogFaqFromHtml(html: string): {
  htmlWithoutFaq: string;
  faqHeading: string;
  items: BlogFaqItem[];
} {
  let s = enhanceBlogHtmlClient(String(html || ''));
  const items: BlogFaqItem[] = [];

  // Pull accordion items out of the document
  s = s.replace(
    /<details\b[^>]*\bgb-faq\b[^>]*>([\s\S]*?)<\/details>/gi,
    (_full, body: string) => {
      const sm = String(body).match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
      if (!sm) return '';
      const title = stripHtmlText(sm[1]);
      let content = String(body).replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/i, '');
      content = cleanFaqAnswerHtml(content, title);
      if (title && stripHtmlText(content)) {
        items.push({ title, content });
      }
      return '';
    }
  );

  // Legacy unwrapped FAQ under h2
  s = s.replace(
    /(<h2\b[^>]*>\s*(FAQ|Frequently Asked Questions)\s*<\/h2>)([\s\S]*?)(?=<h2\b|$)/i,
    (_full, _heading: string, _label: string, body: string) => {
      String(body || '').replace(
        /(<h3\b[^>]*>[\s\S]*?<\/h3>)\s*((?:<p\b[^>]*>[\s\S]*?<\/p>\s*)+)/gi,
        (_pair, q: string, answers: string) => {
          const title = stripHtmlText(h3InnerHtml(q));
          const content = cleanFaqAnswerHtml(answers, title);
          if (title && stripHtmlText(content)) items.push({ title, content });
          return '';
        }
      );
      // Remove the whole FAQ block from prose — accordion renders separately
      return items.length ? '' : '';
    }
  );

  // Orphan FAQ heading if items already extracted
  if (items.length) {
    s = s.replace(/<h2\b[^>]*>\s*(FAQ|Frequently Asked Questions)\s*<\/h2>\s*/gi, '');
  }

  return {
    htmlWithoutFaq: s.replace(/\n{3,}/g, '\n\n').trim(),
    faqHeading: 'FAQ',
    items,
  };
}

export function enhanceBlogHtmlClient(html: string): string {
  let s = String(html || '');
  if (!s.trim()) return '';

  for (const tag of Object.keys(TAG_TO_CLASS)) {
    const cls = TAG_TO_CLASS[tag];
    const re = new RegExp(`<${tag}(\\s[^>]*)?\\/?>`, 'gi');
    s = s.replace(re, (full, attrs = '') => {
      const required = [cls, 'gb-el'];
      const classMatch = String(attrs).match(/\sclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      let next: string;
      if (classMatch) {
        const quote = classMatch[2] != null ? '"' : classMatch[3] != null ? "'" : '"';
        const existing = classMatch[2] ?? classMatch[3] ?? classMatch[4] ?? '';
        const merged = mergeClasses(existing, required);
        const replacement = ` class=${quote}${merged}${quote}`;
        next = `<${tag}${String(attrs).replace(classMatch[0], replacement)}>`;
      } else {
        next = `<${tag}${attrs} class="${required.join(' ')}">`;
      }
      if (/\/\s*>$/.test(full) || tag === 'img' || tag === 'hr') {
        return next.replace(/>$/, ' />');
      }
      return next;
    });
  }

  return wrapFaqSectionsClient(s);
}
