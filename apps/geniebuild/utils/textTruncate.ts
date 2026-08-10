/**
 * Display-length helpers for text / feature-box / image-box descriptions.
 * Full copy always stays in element content — these only shape what is shown.
 */

export type TextLimitMode = 'none' | 'lines' | 'words';

const SENTENCE_END = /[.!?…]["')\]]*$/;

/** Plain text from HTML-ish editable content (tags stripped). */
export function plainTextForTruncate(htmlOrText: string): string {
  const raw = String(htmlOrText ?? '');
  let text = raw;
  if (typeof document !== 'undefined' && /<[a-z][\s\S]*>/i.test(raw)) {
    const tmp = document.createElement('div');
    tmp.innerHTML = raw;
    text = tmp.textContent || tmp.innerText || '';
  } else {
    text = raw.replace(/<[^>]*>/g, ' ');
  }
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWords(text: string): number {
  return plainTextForTruncate(text).split(/\s+/).filter(Boolean).length;
}

/**
 * Show at least `wordLimit` words, then extend to the nearest sentence end
 * (`.`, `!`, `?`, `…`). Example: limit 20 but period at word 23 → show 23 words.
 * If no terminator appears after the limit, hard-cut at `wordLimit` and add "…".
 */
export function truncateToNearestSentence(
  htmlOrText: string,
  wordLimit: number,
  opts?: { ellipsis?: boolean }
): string {
  const limit = Math.max(0, Math.floor(Number(wordLimit) || 0));
  const plain = plainTextForTruncate(htmlOrText);
  if (limit <= 0 || !plain) return plain;

  const words = plain.split(/\s+/).filter(Boolean);
  if (words.length <= limit) return words.join(' ');

  let endIdx = limit;
  let foundSentence = false;
  for (let i = limit - 1; i < words.length; i++) {
    if (SENTENCE_END.test(words[i])) {
      endIdx = i + 1;
      foundSentence = true;
      break;
    }
  }

  if (!foundSentence) {
    const cut = words.slice(0, limit).join(' ');
    return opts?.ellipsis === false ? cut : `${cut}…`;
  }

  return words.slice(0, endIdx).join(' ');
}

/** CSS line-clamp style bag (0 / unset = no clamp). */
export function lineClampStyle(maxLines: number): Record<string, string | number> {
  const n = Math.max(0, Math.floor(Number(maxLines) || 0));
  if (n <= 0) return {};
  return {
    display: '-webkit-box',
    WebkitLineClamp: n,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
}

/** Normalize content fields used by forms + ElementsSection. */
export function resolveTextLimit(content: Record<string, any> | null | undefined): {
  mode: TextLimitMode;
  maxLines: number;
  wordLimit: number;
} {
  const c = content || {};
  const rawMode = String(c.textLimitMode || '').toLowerCase();
  let mode: TextLimitMode = 'none';
  if (rawMode === 'lines' || rawMode === 'words') mode = rawMode;
  else if (Number(c.maxLines) > 0) mode = 'lines';
  else if (Number(c.wordLimit) > 0) mode = 'words';

  const maxLines = Math.min(12, Math.max(0, Math.floor(Number(c.maxLines) || 0)));
  let wordLimit = Math.floor(Number(c.wordLimit) || 0);
  if (wordLimit > 0) wordLimit = Math.min(100, Math.max(20, wordLimit));

  return { mode, maxLines, wordLimit };
}

/**
 * When content has no explicit limit, apply a sensible default (e.g. feature-box
 * / service card blurbs → 3 lines). Explicit `textLimitMode: 'none'` wins.
 */
export function withDefaultTextLimit(
  content: Record<string, any> | null | undefined,
  defaults: { mode: TextLimitMode; maxLines?: number; wordLimit?: number }
): Record<string, any> {
  const c = { ...(content || {}) };
  if (c.textLimitMode === 'none') return c;
  if (c.textLimitMode === 'lines' || c.textLimitMode === 'words') return c;
  if (Number(c.maxLines) > 0 || Number(c.wordLimit) > 0) return c;
  return {
    ...c,
    textLimitMode: defaults.mode,
    maxLines: defaults.mode === 'lines' ? defaults.maxLines ?? 3 : 0,
    wordLimit: defaults.mode === 'words' ? defaults.wordLimit ?? 40 : 0,
  };
}

/**
 * Single display resolver for canvas + live site.
 *
 * - **lines**: CSS clamp always applied (sidebar Max Lines updates live while selected).
 * - **words**: show trimmed unless the editable is focused (so we never save trimmed copy).
 * - Expand for edit only on **focus**, not mere selection — selection is used for sidebar.
 */
export function resolveLimitedTextDisplay(opts: {
  fullHtml: string;
  content: Record<string, any> | null | undefined;
  isFocused: boolean;
}): {
  limit: ReturnType<typeof resolveTextLimit>;
  displayHtml: string;
  clampStyle: Record<string, string | number>;
  /** False while showing a words-mode preview string — do not contentEditable. */
  allowEdit: boolean;
  limitKey: string;
} {
  const limit = resolveTextLimit(opts.content);
  const full = String(opts.fullHtml ?? '');

  const clampStyle =
    limit.mode === 'lines' && limit.maxLines > 0 ? lineClampStyle(limit.maxLines) : {};

  if (limit.mode === 'words' && limit.wordLimit > 0 && !opts.isFocused) {
    return {
      limit,
      displayHtml: truncateToNearestSentence(full, limit.wordLimit),
      clampStyle: {},
      allowEdit: false,
      limitKey: `words-${limit.wordLimit}`,
    };
  }

  return {
    limit,
    displayHtml: full,
    clampStyle,
    allowEdit: true,
    limitKey:
      limit.mode === 'lines'
        ? `lines-${limit.maxLines}`
        : limit.mode === 'words'
          ? `words-${limit.wordLimit}-edit`
          : 'full',
  };
}
