import swatchesJson from "../presetThemeSwatches.json";
import { PRESET_THEME_CATALOG } from "./presetThemeCatalog";

export type PresetThemeSwatch = {
  id: string;
  name: string;
  primary: string;
  surface: string;
  heading: string;
  description: string;
};

/**
 * Admin/business/bulk theme picker swatches — derived from GenieBuild PRESET_THEMES.
 * Keep in sync via: node scripts/extract-theme-swatches.cjs
 */
export const PRESET_THEME_SWATCHES = swatchesJson as PresetThemeSwatch[];

/** Alias used by admin wizards / DesignManagement */
export const PRESET_THEMES = PRESET_THEME_SWATCHES;

export function getPresetThemeSwatchById(id: string): PresetThemeSwatch | undefined {
  const normalized = String(id || "")
    .trim()
    .toLowerCase();
  return (
    PRESET_THEME_SWATCHES.find((t) => t.id === normalized) ||
    PRESET_THEME_SWATCHES.find(
      (t) => t.name.toLowerCase().replace(/\s+/g, "-") === normalized
    )
  );
}

/** Ensure catalog and swatches stay aligned with GenieBuild indices */
export function assertThemeCatalogAligned(): boolean {
  if (PRESET_THEME_CATALOG.length !== PRESET_THEME_SWATCHES.length) return false;
  return PRESET_THEME_CATALOG.every((entry, i) => {
    const swatch = PRESET_THEME_SWATCHES[i];
    return swatch && swatch.id === entry.id && swatch.name === entry.name;
  });
}
