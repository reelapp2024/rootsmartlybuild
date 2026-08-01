/**
 * Surface luminance helpers — keep text contrast aligned with the actual
 * section background, not only themeMode (which can disagree with bg).
 */

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Parse #rgb/#rrggbb/rgb()/rgba() → RGB. Returns null for unknown/transparent. */
export function parseCssColorToRgb(
  color?: string | null
): { r: number; g: number; b: number } | null {
  const raw = String(color || '').trim().toLowerCase();
  if (!raw || raw === 'transparent' || raw === 'none') return null;

  if (raw === 'white') return { r: 255, g: 255, b: 255 };
  if (raw === 'black') return { r: 0, g: 0, b: 0 };

  const hex = raw.replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  if (/^[0-9a-f]{8}$/i.test(hex)) {
    // #rrggbbaa — ignore alpha for luminance
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const m = raw.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/
  );
  if (m) {
    const a = m[4] !== undefined ? Number(m[4]) : 1;
    if (!(a > 0.15)) return null;
    return { r: clampByte(Number(m[1])), g: clampByte(Number(m[2])), b: clampByte(Number(m[3])) };
  }

  return null;
}

/** WCAG relative luminance 0–1 */
export function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/**
 * true  = light surface (need dark text)
 * false = dark surface (need light text)
 * null  = unknown / transparent
 */
export function isLightSurfaceColor(color?: string | null): boolean | null {
  const rgb = parseCssColorToRgb(color);
  if (!rgb) return null;
  // Midpoint ~0.45 separates cream/pastels from charcoal/navy
  return relativeLuminance(rgb) >= 0.45;
}

/**
 * Prefer actual background luminance over themeMode when they disagree.
 * themeMode is only the fallback when bg can't be classified.
 */
export function resolveIsLightSurface(opts: {
  themeMode?: string | null;
  backgroundColor?: string | null;
  /** Optional card/surface fallback when section bg is transparent */
  fallbackBackgroundColor?: string | null;
  alwaysLight?: boolean;
}): boolean {
  if (opts.alwaysLight) return true;

  const fromBg =
    isLightSurfaceColor(opts.backgroundColor) ??
    isLightSurfaceColor(opts.fallbackBackgroundColor);

  if (fromBg === true) return true;
  if (fromBg === false) return false;

  return String(opts.themeMode || '').toLowerCase() === 'light';
}

/** Near-white / dark-canvas text tokens that vanish on light surfaces. */
export function isDarkCanvasTextColor(color?: string | null): boolean {
  const s = String(color || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  if (!s) return false;
  return (
    s === '#fff' ||
    s === '#ffffff' ||
    s === 'white' ||
    s === '#f8fafc' ||
    s === '#f1f5f9' ||
    s === '#e2e8f0' ||
    s === '#d1d5db' ||
    s === '#cbd5e1' ||
    s === '#c7cdd6' ||
    s === '#9ca3af' ||
    s === '#94a3b8'
  );
}

/** Near-black text tokens that vanish on dark surfaces. */
export function isLightCanvasTextColor(color?: string | null): boolean {
  const s = String(color || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  if (!s) return false;
  return (
    s === '#000' ||
    s === '#000000' ||
    s === 'black' ||
    s === '#111827' ||
    s === '#0f172a' ||
    s === '#1a1025' ||
    s === '#1e293b' ||
    s === '#2a2135' ||
    s === '#334155' ||
    s === '#4b5563' ||
    s === '#6b6178' ||
    s === '#6b7280'
  );
}
