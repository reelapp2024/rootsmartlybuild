/**
 * Shared element style apply helpers — GenieBuild canvas + SiteNextJS.
 * Explicit element.style overrides always win over theme / luminance guesses.
 */
import type { CSSProperties } from 'react';

export function hasExplicitStyleValue(style: Record<string, any> | undefined | null, key: string): boolean {
  if (!style) return false;
  const v = style[key];
  return v !== undefined && v !== null && String(v).trim() !== '';
}

/**
 * Resolve a color for an element: override → theme fallback → mode fallback.
 * Never replaces an explicit override based on surface luminance.
 */
export function resolveElementColor(opts: {
  elementStyle?: Record<string, any> | null;
  colorKey?: string;
  themeFallback?: string;
  lightFallback?: string;
  darkFallback?: string;
  isLightMode?: boolean;
}): string {
  const key = opts.colorKey || 'color';
  if (hasExplicitStyleValue(opts.elementStyle, key)) {
    return String(opts.elementStyle![key]);
  }
  if (opts.themeFallback && String(opts.themeFallback).trim()) {
    return String(opts.themeFallback);
  }
  return opts.isLightMode
    ? opts.lightFallback || '#111827'
    : opts.darkFallback || '#F8FAFC';
}

/** Box model keys commonly written by LayoutSpacingBlock / StylesBlocks */
export const ELEMENT_BOX_STYLE_KEYS = [
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'width',
  'height',
  'maxWidth',
  'minWidth',
  'textAlign',
  'justifyContent',
  'alignItems',
  'gap',
] as const;

export function pickElementBoxStyles(style: Record<string, any> | undefined | null): CSSProperties {
  if (!style) return {};
  const out: Record<string, any> = {};
  for (const key of ELEMENT_BOX_STYLE_KEYS) {
    if (hasExplicitStyleValue(style, key)) out[key] = style[key];
  }
  return out as CSSProperties;
}
