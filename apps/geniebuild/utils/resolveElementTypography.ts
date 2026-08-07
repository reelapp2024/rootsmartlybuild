import { DEFAULT_SITE_SIZES } from '@schema/core';
import type { GlobalElementStyles, HeadingLevelStyle } from '../types';

export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type TextSizePreset = 'base' | 'small' | 'large' | 'xl' | 'subheading';

const TEXT_SIZE_TO_DEFAULT_KEY: Record<TextSizePreset, keyof typeof DEFAULT_SITE_SIZES> = {
  base: 'text',
  small: 'textSmall',
  large: 'textLarge',
  xl: 'textXl',
  subheading: 'textLarge',
};

function nonEmpty(value: unknown): string {
  const s = String(value ?? '').trim();
  return s;
}

function normColor(value: unknown): string {
  return nonEmpty(value).toLowerCase();
}

export function pickHeadingLevelStyle(
  globalHeadings: GlobalElementStyles['headings'] | undefined,
  headingTag: HeadingTag
): HeadingLevelStyle {
  const headings = globalHeadings || {};
  const legacy = (headings as { heading?: HeadingLevelStyle }).heading;
  const level = (headings as Record<string, HeadingLevelStyle>)[headingTag] || {};
  const all = headings.all || {};
  return { ...legacy, ...all, ...level };
}

/** Priority: element.style → section (hero) → global per-level → global all → theme defaultSizes → schema defaults */
export function resolveHeadingFontSize(opts: {
  elementStyle?: Record<string, unknown>;
  sectionStyles?: Record<string, unknown>;
  isHeroTitle?: boolean;
  headingTag: HeadingTag;
  globalHeadings?: GlobalElementStyles['headings'];
  defaultSizes?: Record<string, string | null | undefined>;
}): string {
  const fromElement = nonEmpty(opts.elementStyle?.fontSize);
  if (fromElement) return fromElement;

  if (opts.isHeroTitle) {
    const fromSection =
      nonEmpty(opts.sectionStyles?.titleSize) ||
      nonEmpty(opts.sectionStyles?.titleFontSize) ||
      nonEmpty(opts.sectionStyles?.fontSize);
    if (fromSection) return fromSection;
  }

  const merged = pickHeadingLevelStyle(opts.globalHeadings, opts.headingTag);
  if (nonEmpty(merged.fontSize)) return nonEmpty(merged.fontSize);

  const fromTheme = nonEmpty(opts.defaultSizes?.[opts.headingTag]);
  if (fromTheme) return fromTheme;

  return DEFAULT_SITE_SIZES[opts.headingTag];
}

/**
 * Priority: explicit element.style.fontSize (user/DNA override) → section subtitle
 * preset → content textSize → global text (base only) → theme defaultSizes.
 *
 * Pass the element's own `style` bag here — never ELEMENT_DEFAULTS. A baked
 * default fontSize would permanently shadow the Text Size dropdown.
 */
export function resolveTextFontSize(opts: {
  elementStyle?: Record<string, unknown>;
  textSize?: TextSizePreset;
  sectionSubtitleTextSize?: TextSizePreset;
  isHeroSubtitle?: boolean;
  globalText?: { fontSize?: string };
  defaultSizes?: Record<string, string | null | undefined>;
}): string {
  const fromElement = nonEmpty(opts.elementStyle?.fontSize);
  if (fromElement) return fromElement;

  let preset: TextSizePreset = opts.textSize || 'base';
  if (opts.isHeroSubtitle && opts.sectionSubtitleTextSize) {
    preset = opts.sectionSubtitleTextSize;
  }

  if (nonEmpty(opts.globalText?.fontSize) && preset === 'base') {
    return nonEmpty(opts.globalText?.fontSize);
  }

  const key = TEXT_SIZE_TO_DEFAULT_KEY[preset] || 'text';
  const fromTheme = nonEmpty(opts.defaultSizes?.[key]);
  if (fromTheme) return fromTheme;

  return DEFAULT_SITE_SIZES[key];
}

export function resolveHighlightAccentColor(opts: {
  elementStyle?: Record<string, unknown>;
  contentHighlightColor?: string;
  headingGlobals?: HeadingLevelStyle;
  themeSecondary?: string;
  themeAccent?: string;
  titleColor: string;
  isLightMode: boolean;
}): string {
  const titleNorm = normColor(opts.titleColor);

  const fromContent = nonEmpty(opts.contentHighlightColor);
  if (fromContent && normColor(fromContent) !== titleNorm) return fromContent;

  const fromElement = nonEmpty(opts.elementStyle?.secondaryHeadingColor);
  if (fromElement && normColor(fromElement) !== titleNorm) return fromElement;

  const globals = opts.headingGlobals || {};
  const fromGlobal =
    nonEmpty(globals.highlightColor) ||
    nonEmpty(opts.isLightMode ? globals.highlightColorLight : globals.highlightColor);
  if (fromGlobal && normColor(fromGlobal) !== titleNorm) return fromGlobal;

  const fromThemeSecondary = nonEmpty(opts.themeSecondary);
  if (fromThemeSecondary && normColor(fromThemeSecondary) !== titleNorm) return fromThemeSecondary;

  return nonEmpty(opts.themeAccent) || '#E11D48';
}

export function buildHeadingHighlightSpanStyle(
  accentCol: string,
  highlightMode: 'color' | 'background' | 'underline',
  parentUsesGradient: boolean
): string {
  const gradientReset = parentUsesGradient
    ? 'background: none !important; -webkit-background-clip: initial !important; background-clip: initial !important;'
    : '';

  if (highlightMode === 'background') {
    return [
      `background-color: ${accentCol}`,
      'color: #FFFFFF',
      '-webkit-text-fill-color: #FFFFFF',
      'padding: 0.05em 0.3em',
      'border-radius: 0.3em',
      'box-decoration-break: clone',
      '-webkit-box-decoration-break: clone',
      gradientReset,
    ]
      .filter(Boolean)
      .join('; ');
  }

  if (highlightMode === 'underline') {
    return [
      `color: ${accentCol}`,
      `-webkit-text-fill-color: ${accentCol}`,
      `background-image: linear-gradient(${accentCol}, ${accentCol})`,
      'background-size: 100% 0.18em',
      'background-repeat: no-repeat',
      'background-position: 0 88%',
      'padding-bottom: 0.05em',
      gradientReset,
    ]
      .filter(Boolean)
      .join('; ');
  }

  return [
    `color: ${accentCol}`,
    `-webkit-text-fill-color: ${accentCol}`,
    gradientReset,
  ]
    .filter(Boolean)
    .join('; ');
}

/** Last-word highlight model used by GenieBuild headings + sidebar. */
export type HeadingHighlightParts = {
  text: string;
  textBefore: string;
  highlightedText: string;
  textAfter: string;
  /** True when the editable ends with a space — keep it after the highlight span. */
  trailingSpace?: boolean;
};

const ZWSP = '\u200b';

export function plainTextFromHtml(rawHtml: string, opts?: { trim?: boolean }): string {
  const raw = String(rawHtml || '');
  let text = '';
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = raw;
    text = tmp.textContent || tmp.innerText || '';
  } else {
    text = raw.replace(/<[^>]*>/g, ' ');
  }
  // Drop caret placeholders; normalize whitespace.
  text = text.replace(new RegExp(ZWSP, 'g'), '').replace(/\u00a0/g, ' ');
  const endsWithSpace = /\s$/.test(text);
  text = text.replace(/\s+/g, ' ');
  if (opts?.trim === false) {
    text = text.replace(/^\s+/, '');
    if (endsWithSpace && text.length > 0 && !/\s$/.test(text)) text += ' ';
    else if (endsWithSpace && text.length === 0) text = ' ';
    return text;
  }
  return text.trim();
}

/**
 * Canonical split for heading editing — always highlight the last word.
 * "hello welcome to my site" → before: "hello welcome to my", highlight: "site"
 */
export function splitHeadingToHighlightParts(plainOrHtml: string): HeadingHighlightParts {
  const withTrail = plainTextFromHtml(plainOrHtml, { trim: false });
  const trailingSpace = /\s$/.test(withTrail);
  const plainText = withTrail.trim();
  const words = plainText.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return {
      text: '',
      textBefore: '',
      highlightedText: '',
      textAfter: '',
      trailingSpace,
    };
  }
  if (words.length === 1) {
    return {
      text: words[0],
      textBefore: '',
      highlightedText: words[0],
      textAfter: '',
      trailingSpace,
    };
  }

  const highlightedText = words[words.length - 1];
  const textBefore = words.slice(0, -1).join(' ');
  return {
    text: `${textBefore} ${highlightedText}`,
    textBefore,
    highlightedText,
    textAfter: '',
    trailingSpace,
  };
}

/** @deprecated Use splitHeadingToHighlightParts — last word is always highlighted. */
export function finishHeadingWord(plainOrHtml: string): HeadingHighlightParts {
  return splitHeadingToHighlightParts(plainOrHtml);
}

function escapeHeadingHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build contentEditable HTML that matches the sidebar highlight fields.
 * Only the last word lives inside the highlight <span>.
 */
export function buildHeadingEditableHtml(
  parts: HeadingHighlightParts,
  highlightSpanStyle: string
): string {
  const before = escapeHeadingHtml(parts.textBefore).trim();
  const hiRaw = String(parts.highlightedText || '').replace(new RegExp(ZWSP, 'g'), '');
  const hi = escapeHeadingHtml(hiRaw);
  const after = escapeHeadingHtml(parts.textAfter).trim();
  const styleAttr = String(highlightSpanStyle || '').replace(/"/g, '&quot;');
  const spanInner = hi || ZWSP;
  const lead = before ? `${before} ` : '';
  const trail = after ? ` ${after}` : parts.trailingSpace ? ' ' : '';
  return `${lead}<span style="${styleAttr}">${spanInner}</span>${trail}`;
}

export function parseFontSizeToRem(value: string): number {
  const match = String(value || '').trim().match(/^([\d.]+)(rem|px|em)?$/);
  if (!match) return 2;
  let num = parseFloat(match[1]);
  if (!Number.isFinite(num)) return 2;
  if (match[2] === 'px') num /= 16;
  return num;
}
