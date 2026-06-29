import { PRESET_THEMES } from '../../../constants';
import type { ThemeData } from '../../../src/ui-blocks';

/** Active theme elements — set by themeResolver.applySiteThemeToDocument (DB is source of truth). */
export const getActiveGlobalTheme = (): ThemeData => {
  try {
    if (typeof window !== 'undefined') {
      const live = (window as any).__GENIEBUILD_ACTIVE_THEME__;
      if (live && typeof live === 'object') return live as ThemeData;
    }
  } catch (_) {
    /* ignore */
  }
  return PRESET_THEMES[0].elements as ThemeData;
};

/**
 * Computes the active theme's overlay defaults (color + opacity + blend mode).
 * Handles legacy broken "transparent" colors by falling back to Crimson Jet.
 * Takes themeData from useTheme() hook because that's where live context lives.
 */
export const computeThemeOverlayDefaults = (themeData: ThemeData | null | undefined) => {
  let overlayColor: string = themeData?.overlay?.color || PRESET_THEMES[0].elements.overlay.color;
  let overlayOpacity: number = themeData?.overlay?.opacity ?? PRESET_THEMES[0].elements.overlay.opacity;
  let blendMode: string = themeData?.overlay?.blend || PRESET_THEMES[0].elements.overlay.blend;

  if (!overlayColor || overlayColor === 'transparent' || overlayColor.replace(/\s/g, '') === 'rgba(0,0,0,0)' || overlayColor.includes(', 0)')) {
    overlayColor = PRESET_THEMES[0].elements.overlay.color;
    overlayOpacity = PRESET_THEMES[0].elements.overlay.opacity;
    blendMode = PRESET_THEMES[0].elements.overlay.blend;
  } else if (typeof overlayColor === 'string' && overlayColor.includes('rgba')) {
    const rgbaMatch = overlayColor.match(/rgba?\([^)]+\)/);
    if (rgbaMatch) {
      const rgbaValues = rgbaMatch[0].match(/[\d.]+/g);
      if (rgbaValues && rgbaValues.length >= 4) {
        overlayOpacity = parseFloat(rgbaValues[3]);
      }
    }
  }

  return {
    enabled: true,
    color: overlayColor,
    opacity: overlayOpacity,
    blendMode,
  };
};
