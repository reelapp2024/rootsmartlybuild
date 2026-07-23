export type Node = {
  id: string;
  type: string;
  props?: Record<string, any>;
  style?: React.CSSProperties;
  children?: Node[];
};

export type PageDoc = {
  _version: number;
  id: string;
  slug: string;
  title: string;
  root: Node;
};

export {
  PRESET_FONTS,
  DEFAULT_FONT_FAMILY,
  normalizePresetFontFamily,
  buildGoogleFontsCssUrl,
} from "./presetFonts";
export type { PresetFont } from "./presetFonts";

export {
  resolveSiteTypography,
  resolveSiteFontSizes,
  buildSiteTypographyCss,
  typographyFromDefaultTypographyState,
  DEFAULT_SITE_SIZES,
} from "./siteTypography";
export type { SiteTypography, ThemeSettingsTypographyInput } from "./siteTypography";

export {
  PRESET_THEME_CATALOG,
  PRESET_THEME_COUNT,
  findPresetIndexFromSettings,
  findPresetIndexFromThemeSlug,
  getPresetCatalogEntryById,
  getPresetCatalogEntryByIndex,
  getPresetIndexByAdminId,
  getThemeSlugForApiFromIndex,
  normalizeThemeSlug as normalizePresetThemeSlug,
  resolveAdminThemeIdFromSettings,
} from "./presetThemeCatalog";
export type { PresetThemeCatalogEntry } from "./presetThemeCatalog";

export {
  PRESET_THEMES,
  PRESET_THEME_SWATCHES,
  getPresetThemeSwatchById,
  assertThemeCatalogAligned,
} from "./presetThemeSwatches";
export type { PresetThemeSwatch } from "./presetThemeSwatches";