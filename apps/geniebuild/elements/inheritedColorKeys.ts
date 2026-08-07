/**
 * Style keys that must NEVER be baked into DNA / seed fallbacks.
 * Theme resolves these at render time (ElementsSection). Explicit user
 * overrides still live on `element.style` from the API/DB.
 */
export const INHERITED_COLOR_KEYS = [
  'color',
  'backgroundColor',
  'borderColor',
  'titleColor',
  'descriptionColor',
  'textColor',
  'subheadingColor',
  'secondaryHeadingColor',
  'iconColor',
  'iconBackgroundColor',
  'iconBgColor',
  'linkColor',
  'markerColor',
  'hoverColor',
  'activeColor',
  'accentColor',
  'highlightColor',
  'highlightTextColor',
  'quoteColor',
  'verifiedColor',
  'replyAuthorColor',
  'labelColor',
  'inactiveColor',
  'activeTextColor',
  'activeBackgroundColor',
  'activeBorderColor',
  'activeTitleColor',
  'hoverBackgroundColor',
  'dividerColor',
  'gradientFrom',
  'gradientTo',
  'dropCapColor',
  'kickerColor',
  'overlayColor',
] as const;

const INHERITED_COLOR_KEY_SET = new Set<string>(INHERITED_COLOR_KEYS);

export function isInheritedColorKey(key: string): boolean {
  return INHERITED_COLOR_KEY_SET.has(key);
}

/** Strip theme-owned color keys from a style bag (DNA / seed only). */
export function stripInheritedColorKeys<T extends Record<string, any> | null | undefined>(
  style: T
): T extends null | undefined ? Record<string, never> : Record<string, any> {
  if (!style || typeof style !== 'object') return {} as any;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(style)) {
    if (isInheritedColorKey(k)) continue;
    if (v === '' || v === undefined) continue;
    out[k] = v;
  }
  return out as any;
}
