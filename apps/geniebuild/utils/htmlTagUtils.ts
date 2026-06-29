const VALID_HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'p', 'span']);

/** Never pass motion.* or unknown tags to React.createElement for headings. */
export function resolveHeadingHtmlTag(
  raw: unknown,
  fallback: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'p' | 'span' = 'h2'
): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'p' | 'span' {
  const tag = String(raw || '')
    .trim()
    .toLowerCase();
  if (!tag || tag.startsWith('motion.')) {
    return tag === 'motion.div' ? 'div' : fallback;
  }
  if (VALID_HEADING_TAGS.has(tag)) {
    return tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'p' | 'span';
  }
  return fallback;
}
