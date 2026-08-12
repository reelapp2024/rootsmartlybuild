/**
 * Reusable, theme-driven section background PATTERNS.
 *
 * A "pattern" is a decorative layer (grid lines, radial glow, dots …) painted
 * ON TOP of a section's base background colour. It is stored on the section as
 * `styles.bgPattern` (a plain string id) so it can be applied to ANY section /
 * Canvas from the Design tab — not baked into one variant.
 *
 * `resolveBgPatternLayers(patternId, theme)` returns the CSS `backgroundImage`,
 * `backgroundSize` and `backgroundRepeat` strings for the chosen pattern, using
 * theme colours (accent + divider line) so it follows whichever theme is active.
 * It never hardcodes a palette — pass the resolved theme colours in.
 */

export type BgPatternId = 'none' | 'grid' | 'glow' | 'grid-glow' | 'dots';

export interface BgPatternOptions {
  /** theme accent (for glow). */
  accent?: string;
  /** theme divider / faint line colour (for grid & dots). */
  line?: string;
}

/** Human-facing choices for the Design-tab picker. */
export const BG_PATTERN_CHOICES: { value: BgPatternId; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'grid-glow', label: 'Grid + Glow' },
  { value: 'grid', label: 'Grid lines' },
  { value: 'glow', label: 'Accent glow' },
  { value: 'dots', label: 'Dots' },
];

export interface ResolvedBgPattern {
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
}

/**
 * Build the decorative background layers for a pattern. Returns an empty object
 * for 'none' (or unknown) so callers can spread it unconditionally.
 */
export function resolveBgPatternLayers(
  patternId: string | undefined,
  { accent = '#FBBF24', line = 'rgba(255,255,255,0.05)' }: BgPatternOptions = {}
): ResolvedBgPattern {
  const glow = `radial-gradient(60% 55% at 78% 18%, ${accent}22, transparent 70%)`;
  const gridV = `linear-gradient(${line} 1px, transparent 1px)`;
  const gridH = `linear-gradient(90deg, ${line} 1px, transparent 1px)`;
  const dots = `radial-gradient(${line} 1.4px, transparent 1.4px)`;

  switch (patternId) {
    case 'grid-glow':
      return {
        backgroundImage: [glow, gridV, gridH].join(', '),
        backgroundSize: '100% 100%, 56px 56px, 56px 56px',
        backgroundRepeat: 'no-repeat, repeat, repeat',
      };
    case 'grid':
      return {
        backgroundImage: [gridV, gridH].join(', '),
        backgroundSize: '56px 56px, 56px 56px',
        backgroundRepeat: 'repeat, repeat',
      };
    case 'glow':
      return {
        backgroundImage: glow,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      };
    case 'dots':
      return {
        backgroundImage: dots,
        backgroundSize: '22px 22px',
        backgroundRepeat: 'repeat',
      };
    case 'none':
    default:
      return {};
  }
}
