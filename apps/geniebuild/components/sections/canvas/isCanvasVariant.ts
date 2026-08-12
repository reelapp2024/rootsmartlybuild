/**
 * isCanvasRenderedVariant — single source of truth for "does this variant render
 * through the freeform CanvasFreeform section?".
 *
 * Section style blocks (Design/Advanced tab) use this to hide controls that make
 * no sense for a freeform Canvas (e.g. Grid Columns, Theme-Mode toggle). Detect
 * by BOTH the section type ('canvas') AND the variant name — because Canvas-based
 * heroes (HeroDarkBold, HeroCanvasTrust, …) are `type: 'hero'` with a variant
 * name that may not contain the word "canvas".
 *
 * Keep this list in sync when adding a new Canvas-rendered variant.
 */

const CANVAS_VARIANT_NAMES = new Set(
  [
    'CanvasFreeform',
    'CanvasShowcase',
    'HeroCanvas',
    'HeroCanvasTrust',
    'HeroCanvasSpotlight',
    'HeroDarkBold',
  ].map((n) => n.toLowerCase())
);

export function isCanvasRenderedVariant(
  variantName?: string | null,
  sectionType?: string | null
): boolean {
  if (String(sectionType || '').toLowerCase() === 'canvas') return true;
  const v = String(variantName || '').trim().toLowerCase();
  if (!v) return false;
  if (CANVAS_VARIANT_NAMES.has(v)) return true;
  // Any variant whose name contains "canvas" (defensive for future additions).
  return /canvas/.test(v);
}
