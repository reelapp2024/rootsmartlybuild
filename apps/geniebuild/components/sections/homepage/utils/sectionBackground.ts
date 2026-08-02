import type React from 'react';
import { PRESET_THEMES } from '../../../../constants';

/**
 * Shared section-background resolver for ALL homepage section variants.
 *
 * A section's background can be one of three things the user picks in the
 * sidebar Background control, saved onto `section.styles.background`:
 *   - color    → { type:'color',    color }
 *   - gradient → { type:'gradient', gradient:{ type:'linear'|'radial', direction, stops[] } }
 *   - image    → { type:'image',    image:{ url|images[], position, size, repeat, overlay } }
 *
 * Legacy flat keys (backgroundColor / backgroundImage / overlay*) are also honored.
 *
 * IMPORTANT design rules (fixing long-standing bugs):
 *   1. All three types work in EVERY variant (previously only Features* did).
 *   2. The "theme surface white-lock" (force light sections to a clean surface
 *      when no explicit background is set) must NOT override an explicit user
 *      background. It only supplies the DEFAULT surface colour.
 *   3. The overlay applies ONLY to an image background — never to color/gradient.
 */

export interface SectionBgOptions {
  /** Default surface colour to use when the user has NOT set an explicit background.
   *  Light sections pass their theme light surface (e.g. '#FFFFFF'); dark sections
   *  pass their theme dark surface. Always a theme token, never hardcoded by callers. */
  defaultSurface: string;
}

/** Does this saved flat colour match one of the preset theme surfaces?
 *  Used only to decide whether a *flat* saved colour is a real user choice or a
 *  stale theme-surface value that should fall back to the default surface. */
function matchesThemeSurface(color: string): boolean {
  const norm = color.trim().toLowerCase();
  return PRESET_THEMES.some((t) => {
    const dark = (t.elements?.surface || '').toLowerCase();
    const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
    return norm === dark || norm === light;
  });
}

/**
 * Resolve the section's outer background CSS (color | gradient | image), honoring
 * the rich `styles.background` object first, then legacy flat keys, then the
 * theme default surface. Returns a CSSProperties fragment to spread onto the
 * section's outer wrapper.
 */
export function resolveSectionBackground(
  styles: any,
  { defaultSurface }: SectionBgOptions
): React.CSSProperties {
  const s = styles || {};
  const out: React.CSSProperties = {};
  const b = s.background;

  // 1) Rich background object (the source of truth for the 3-way picker).
  if (b && typeof b === 'object' && b.type) {
    if (b.type === 'gradient' && b.gradient) {
      const stops = (b.gradient.stops || [])
        .map((st: any) => `${st.color} ${st.position}%`)
        .join(', ');
      if (stops) {
        out.backgroundImage =
          b.gradient.type === 'radial'
            ? `radial-gradient(circle, ${stops})`
            : `linear-gradient(${b.gradient.direction ?? 90}deg, ${stops})`;
        return out;
      }
      // Empty gradient → fall through to default surface below.
    } else if (b.type === 'image') {
      const url =
        b.image?.url ||
        (Array.isArray(b.image?.images) ? b.image.images[0]?.url : '');
      if (url) {
        out.backgroundImage = `url(${url})`;
        out.backgroundPosition = b.image?.position || 'center';
        out.backgroundSize = b.image?.size || 'cover';
        out.backgroundRepeat = b.image?.repeat || 'no-repeat';
        if (b.image?.attachment) out.backgroundAttachment = b.image.attachment;
        return out;
      }
      // No image url yet → fall through to default surface below.
    } else if (b.type === 'color') {
      // An explicit colour the user picked always wins — no white-lock override.
      out.backgroundColor = b.color || defaultSurface;
      return out;
    }
  }

  // 2) Legacy flat backgroundImage (url or gradient string).
  if (typeof s.backgroundImage === 'string' && s.backgroundImage.trim()) {
    out.backgroundImage = /^url\(|gradient/i.test(s.backgroundImage)
      ? s.backgroundImage
      : `url(${s.backgroundImage})`;
    out.backgroundSize = s.backgroundSize || 'cover';
    out.backgroundPosition = s.backgroundPosition || 'center';
    out.backgroundRepeat = s.backgroundRepeat || 'no-repeat';
    return out;
  }

  // 3) Legacy flat backgroundColor. A real user colour wins; a stale theme-surface
  //    value (or 'transparent'/empty) falls back to the theme default surface so
  //    light sections stay clean by default.
  const flat = s.backgroundColor;
  if (typeof flat === 'string' && flat.trim()) {
    const norm = flat.trim().toLowerCase();
    if (norm === 'transparent') {
      // gradient/image authoring blanks the flat colour to transparent — but the
      // rich object above already handled those; a bare 'transparent' with no rich
      // background means "use the default surface".
      out.backgroundColor = defaultSurface;
    } else if (matchesThemeSurface(flat)) {
      out.backgroundColor = defaultSurface;
    } else {
      out.backgroundColor = flat;
    }
    return out;
  }

  // 4) Nothing set → theme default surface.
  out.backgroundColor = defaultSurface;
  return out;
}

/**
 * Resolve the section overlay — ONLY for an image background. Returns a
 * CSSProperties fragment for a full-bleed overlay layer, or null when there is
 * no image background or no overlay configured. Never applies to color/gradient.
 */
export function resolveSectionOverlay(styles: any): React.CSSProperties | null {
  const s = styles || {};
  const b = s.background;

  // Overlay is image-only. Require an actual image url (rich object or legacy flat
  // that is NOT a gradient string).
  const richImageUrl =
    b && typeof b === 'object' && b.type === 'image'
      ? b.image?.url || (Array.isArray(b.image?.images) ? b.image.images[0]?.url : '')
      : '';
  const legacyFlatImage =
    !richImageUrl &&
    typeof s.backgroundImage === 'string' &&
    s.backgroundImage.trim() &&
    !/gradient/i.test(s.backgroundImage)
      ? s.backgroundImage
      : '';
  const hasImage = !!(richImageUrl || legacyFlatImage);
  if (!hasImage) return null;

  const color = b?.image?.overlay?.color || b?.overlay?.color || s.overlayColor;
  const opacityRaw =
    b?.image?.overlay?.opacity ?? b?.overlay?.opacity ?? s.overlayOpacityValue;
  const opacity =
    typeof opacityRaw === 'number'
      ? opacityRaw
      : opacityRaw !== undefined
      ? parseFloat(opacityRaw)
      : NaN;

  if (color && Number.isFinite(opacity) && opacity > 0) {
    const style: React.CSSProperties = { backgroundColor: color, opacity };
    const blend = b?.image?.overlay?.blendMode || b?.overlay?.blendMode || s.overlayBlendMode;
    if (blend && blend !== 'normal') style.mixBlendMode = blend as any;
    return style;
  }
  return null;
}

/** Convenience: does the resolved background use an image/gradient layer (so a
 *  variant knows to render the overlay + a relative wrapper)? */
export function sectionBgHasImage(styles: any): boolean {
  const s = styles || {};
  const b = s.background;
  if (b && typeof b === 'object' && b.type === 'image') {
    return !!(b.image?.url || (Array.isArray(b.image?.images) && b.image.images[0]?.url));
  }
  return (
    typeof s.backgroundImage === 'string' &&
    !!s.backgroundImage.trim() &&
    !/gradient/i.test(s.backgroundImage)
  );
}

/**
 * Resolve section-level MARGIN (top/bottom) from styles into a CSSProperties
 * fragment. Only emits keys the user actually set, so it can be spread safely
 * onto the section wrapper. Shared so every variant honours the Advanced-tab
 * margin controls the same way.
 */
export function resolveSectionMargin(styles: any): React.CSSProperties {
  const s = styles || {};
  const out: React.CSSProperties = {};
  if (s.marginTop) out.marginTop = s.marginTop;
  if (s.marginBottom) out.marginBottom = s.marginBottom;
  return out;
}

/**
 * Resolve section-level BORDER from styles (Advanced-tab Border controls) into a
 * CSSProperties fragment. Emits nothing unless a border width/style/colour is
 * set, so it never draws an unwanted line. Supports per-side or all-sides.
 */
export function resolveSectionBorder(styles: any): React.CSSProperties {
  const s = styles || {};
  const out: React.CSSProperties = {};
  const anySide = s.borderWidth || s.borderTopWidth || s.borderBottomWidth || s.borderLeftWidth || s.borderRightWidth;
  if (!anySide && !s.borderColor && !s.borderStyle) return out;
  if (s.borderWidth) out.borderWidth = s.borderWidth;
  if (s.borderStyle) out.borderStyle = s.borderStyle || 'solid';
  else if (anySide || s.borderColor) out.borderStyle = 'solid';
  if (s.borderColor) out.borderColor = s.borderColor;
  if (s.borderTopWidth) out.borderTopWidth = s.borderTopWidth;
  if (s.borderBottomWidth) out.borderBottomWidth = s.borderBottomWidth;
  if (s.borderLeftWidth) out.borderLeftWidth = s.borderLeftWidth;
  if (s.borderRightWidth) out.borderRightWidth = s.borderRightWidth;
  if (s.borderRadius) out.borderRadius = s.borderRadius;
  return out;
}

/**
 * Convenience: the full section-wrapper style = background + margin + border,
 * merged. Spread this directly onto the section's outer element.
 */
export function resolveSectionWrapperStyle(
  styles: any,
  opts: SectionBgOptions
): React.CSSProperties {
  return {
    ...resolveSectionBackground(styles, opts),
    ...resolveSectionMargin(styles),
    ...resolveSectionBorder(styles),
  };
}
