import type { CSSProperties } from 'react';

/** Style keys that belong on the image area only — must not leak onto the card wrapper. */
export const IMAGE_BOX_IMAGE_ONLY_KEYS = [
  'imageAspectRatio',
  'imageHeight',
  'imageObjectFit',
  'imageObjectPosition',
  'imageRadius',
  'imageHover',
  'imageBorderWidth',
  'imageBorderStyle',
  'imageBorderColor',
  'imageBoxShadow',
  'imageFilterPreset',
  'imageOpacity',
  'imageBrightness',
  'imageContrast',
  'imageSaturate',
  'imageGrayscale',
  'imageSepia',
  'imageBlur',
  'imageHueRotate',
  'imageOverlayColor',
  'imageOverlayOpacity',
  'imageBackgroundColor',
  'imageHoverEffect',
  'imageHoverScale',
  'imageContentGap',
] as const;

export function stripImageBoxImageKeys(style: Record<string, unknown>): Record<string, unknown> {
  const out = { ...style };
  for (const k of IMAGE_BOX_IMAGE_ONLY_KEYS) delete out[k];
  return out;
}

export interface NormalizedImageStyle {
  aspectRatio: string;
  borderRadius: string;
  objectFit: string;
  objectPosition: string;
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  boxShadow?: string;
  filterPreset?: string;
  opacity?: number | string;
  brightness?: string;
  contrast?: string;
  saturate?: string;
  hueRotate?: string;
  overlayColor?: string;
  overlayOpacity: number;
  backgroundColor?: string;
  hoverEffect: string;
}

/** Normalize standalone `image` element styles. */
export function normalizeImageElementStyle(style: Record<string, any>): NormalizedImageStyle {
  const s = style || {};
  const borderWidth = s.borderWidth || '0px';
  const borderWNum = parseFloat(String(borderWidth)) || 0;
  return {
    aspectRatio: s.aspectRatio || 'auto',
    borderRadius: s.borderRadius ?? '0%',
    objectFit: s.objectFit || 'cover',
    objectPosition: s.objectPosition || 'center',
    borderWidth,
    borderStyle: s.borderStyle || (borderWNum > 0 ? 'solid' : 'none'),
    borderColor: s.borderColor || 'transparent',
    boxShadow: s.boxShadow && s.boxShadow !== 'none' ? s.boxShadow : undefined,
    filterPreset: s.filterPreset || '',
    opacity: s.opacity,
    brightness: s.brightness,
    contrast: s.contrast,
    saturate: s.saturate,
    hueRotate: s.hueRotate,
    overlayColor: s.overlayColor,
    overlayOpacity: s.overlayOpacity !== undefined ? parseFloat(String(s.overlayOpacity)) : 0,
    backgroundColor: s.backgroundColor,
    hoverEffect: s.hoverEffect || 'none',
  };
}

/** Normalize `image-box` image-area styles (prefixed keys). */
export function normalizeImageBoxImageStyle(style: Record<string, any>): NormalizedImageStyle {
  const s = style || {};
  const borderWidth = s.imageBorderWidth || '0px';
  const borderWNum = parseFloat(String(borderWidth)) || 0;
  return {
    aspectRatio: s.imageAspectRatio || 'auto',
    borderRadius: s.imageRadius ?? '0px',
    objectFit: s.imageObjectFit || 'cover',
    objectPosition: s.imageObjectPosition || 'center',
    borderWidth,
    borderStyle: s.imageBorderStyle || (borderWNum > 0 ? 'solid' : 'none'),
    borderColor: s.imageBorderColor || 'transparent',
    boxShadow: s.imageBoxShadow && s.imageBoxShadow !== 'none' ? s.imageBoxShadow : undefined,
    filterPreset: s.imageFilterPreset || '',
    opacity: s.imageOpacity,
    brightness: s.imageBrightness,
    contrast: s.imageContrast,
    saturate: s.imageSaturate,
    hueRotate: s.imageHueRotate,
    overlayColor: s.imageOverlayColor,
    overlayOpacity:
      s.imageOverlayOpacity !== undefined && s.imageOverlayOpacity !== ''
        ? parseFloat(String(s.imageOverlayOpacity))
        : 0,
    backgroundColor: s.imageBackgroundColor,
    hoverEffect: s.imageHover || s.imageHoverEffect || 'none',
  };
}

export function buildCombinedImageFilter(
  normalized: NormalizedImageStyle,
  legacyFilter?: string
): string | undefined {
  const filterParts: string[] = [];
  if (normalized.filterPreset) filterParts.push(normalized.filterPreset);
  if (normalized.brightness) filterParts.push(`brightness(${normalized.brightness}%)`);
  if (normalized.contrast) filterParts.push(`contrast(${normalized.contrast}%)`);
  if (normalized.saturate) filterParts.push(`saturate(${normalized.saturate}%)`);
  if (normalized.hueRotate) filterParts.push(`hue-rotate(${normalized.hueRotate}deg)`);
  if (filterParts.length === 0 && legacyFilter && legacyFilter !== 'none') {
    filterParts.push(legacyFilter);
  }
  return filterParts.length > 0 ? filterParts.join(' ') : undefined;
}

export function buildImageOuterStyle(
  normalized: NormalizedImageStyle,
  opts?: { width?: string; height?: string; useAspectRatio?: boolean }
): CSSProperties {
  const useAspect =
    opts?.useAspectRatio !== false &&
    normalized.aspectRatio &&
    normalized.aspectRatio !== 'auto';
  return {
    position: 'relative',
    width: opts?.width || '100%',
    flexShrink: 0,
    ...(useAspect
      ? { aspectRatio: normalized.aspectRatio, height: 'auto' }
      : { height: opts?.height || '12rem' }),
    borderRadius: normalized.borderRadius,
    borderWidth: normalized.borderWidth,
    borderStyle: normalized.borderStyle as CSSProperties['borderStyle'],
    borderColor: normalized.borderColor,
    backgroundColor: normalized.backgroundColor || undefined,
    boxShadow: normalized.boxShadow,
    overflow: 'hidden',
  };
}

export function buildImageImgStyle(normalized: NormalizedImageStyle, combinedFilter?: string): CSSProperties {
  const opacityRaw = normalized.opacity;
  const opacity =
    opacityRaw !== undefined && opacityRaw !== ''
      ? typeof opacityRaw === 'number'
        ? opacityRaw
        : parseFloat(String(opacityRaw))
      : 1;
  return {
    width: '100%',
    height: '100%',
    objectFit: normalized.objectFit as CSSProperties['objectFit'],
    objectPosition: normalized.objectPosition,
    opacity: Number.isFinite(opacity) ? opacity : 1,
    filter: combinedFilter,
    transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), filter 0.3s, opacity 0.3s',
    display: 'block',
  };
}

/** Scoped hover CSS for image / image-box wrappers. */
export function buildImageHoverCss(
  scopeSelector: string,
  hoverEffect: string,
  combinedFilter?: string,
  tintColor?: string
): string {
  if (!hoverEffect || hoverEffect === 'none') return '';
  const filterSuffix = combinedFilter ? ` ${combinedFilter}` : '';
  if (hoverEffect === 'zoom') {
    return `${scopeSelector} img { transition: transform 0.4s ease; }
${scopeSelector}:hover img { transform: scale(1.06); }`;
  }
  if (hoverEffect === 'lift') {
    return `${scopeSelector} { transition: transform 0.3s ease, box-shadow 0.3s ease; }
${scopeSelector}:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.18); }`;
  }
  if (hoverEffect === 'brighten') {
    return `${scopeSelector} img { transition: filter 0.3s ease; }
${scopeSelector}:hover img { filter: brightness(1.15)${filterSuffix}; }`;
  }
  if (hoverEffect === 'darken') {
    return `${scopeSelector} img { transition: filter 0.3s ease; }
${scopeSelector}:hover img { filter: brightness(0.7)${filterSuffix}; }`;
  }
  if (hoverEffect === 'tint') {
    return `${scopeSelector}:hover .gb-img-tint { opacity: 1; }`;
  }
  return '';
}
