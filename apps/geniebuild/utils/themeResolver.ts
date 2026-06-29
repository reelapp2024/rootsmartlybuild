/**
 * Single source of truth for project theme (GenieBuild + SiteNextJS + API colors).
 * Always resolve from ThemeSetting shape: { theme, presetId, customColors }.
 */

import { DEFAULT_TYPOGRAPHY, PRESET_THEMES } from '../constants';
import type { WebsiteData } from '../types';
import { buildGoogleFontsCssUrl } from '../../../packages/schema/src/presetFonts';
import {
  findPresetIndexFromSettings,
  getPresetCatalogEntryByIndex,
  getThemeSlugForApiFromIndex,
  normalizeThemeSlug,
} from '../../../packages/schema/src/presetThemeCatalog';
import {
  buildSiteTypographyCss,
  resolveSiteFontSizes,
  resolveSiteTypography,
} from '../../../packages/schema/src/siteTypography';

export type ThemeSettingsInput = {
  presetId?: string | number | null;
  theme?: string | null;
  defaultFont?: string | null;
  customColors?: Record<string, any> | null;
  defaultSizes?: Record<string, string> | null;
  defaultTypography?: Record<string, string> | null;
} | null;

export type GlobalColors = {
  backgroundColor: string;
  textColor: string;
  titleColor: string;
  accentColor: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
};

export type ResolvedSiteTheme = {
  themeSlug: string;
  presetIndex: number;
  preset: (typeof PRESET_THEMES)[number] | null;
  elements: Record<string, any>;
  isCustom: boolean;
  globalColors: GlobalColors;
};

export { normalizeThemeSlug };

/** Index into PRESET_THEMES — shared catalog (presetId index + theme slug aliases). */
export function findPresetIndex(themeSettings: ThemeSettingsInput): number {
  return findPresetIndexFromSettings(themeSettings);
}

export function settingsFromPresetIndex(index: number): ThemeSettingsInput {
  const preset = PRESET_THEMES[index];
  const catalogEntry = getPresetCatalogEntryByIndex(index);
  if (!preset) return { theme: 'crimson-jet', presetId: '0' };
  return {
    theme: catalogEntry?.id || getThemeSlugForApiFromIndex(index),
    presetId: String(index),
  };
}

export function resolveSiteTheme(
  themeSettings: ThemeSettingsInput,
  fallbackColors?: Partial<GlobalColors>
): ResolvedSiteTheme {
  const presetIndex = findPresetIndex(themeSettings);
  const preset = presetIndex >= 0 ? PRESET_THEMES[presetIndex] : null;
  const elements = (preset?.elements || {}) as Record<string, any>;
  const custom = (themeSettings?.customColors || {}) as Record<string, any>;
  const isCustom = !preset && normalizeThemeSlug(String(themeSettings?.theme || '')) === 'custom';

  const active = isCustom ? custom : elements;
  const fb = fallbackColors || {};

  const globalColors: GlobalColors = {
    backgroundColor: String(active.surface || fb.backgroundColor || elements.surface || '#0E1214').trim(),
    textColor: String(active.description || fb.textColor || elements.description || '#C7CDD6').trim(),
    titleColor: String(active.heading || fb.titleColor || elements.heading || '#F8FAFC').trim(),
    accentColor: String(active.accent || fb.accentColor || elements.accent || '#F59E0B').trim(),
    buttonBackgroundColor: String(
      active.primaryButton?.bg || fb.buttonBackgroundColor || elements.primaryButton?.bg || '#E11D48'
    ).trim(),
    buttonTextColor: String(
      active.primaryButton?.text || fb.buttonTextColor || elements.primaryButton?.text || '#FFFFFF'
    ).trim(),
  };

  const themeSlug = preset
    ? getThemeSlugForApiFromIndex(presetIndex)
    : isCustom
      ? 'custom'
      : normalizeThemeSlug(String(themeSettings?.theme || '')) || 'crimson-jet';

  return {
    themeSlug,
    presetIndex,
    preset,
    elements: isCustom ? { ...elements, ...custom } : elements,
    isCustom,
    globalColors,
  };
}

export function hasPresetThemeSettings(themeSettings: ThemeSettingsInput): boolean {
  if (!themeSettings) return false;
  const idx = findPresetIndex(themeSettings);
  if (idx >= 0) return true;
  const slug = normalizeThemeSlug(String(themeSettings.theme || ''));
  return Boolean(slug && slug !== 'custom');
}

/** API `colors` block for getWebsiteDesignData — derived from same resolver as the live site. */
export function toApiColorsPayload(themeSettings: ThemeSettingsInput) {
  const { globalColors } = resolveSiteTheme(themeSettings);
  return {
    colorPrimary: globalColors.buttonBackgroundColor,
    colorSecondary: globalColors.backgroundColor,
    colorAccent: globalColors.titleColor,
  };
}

/** Push theme elements into GenieBuild ThemeProvider (builder + SiteNextJS). */
export function applySiteThemeToDocument(
  themeSettings: ThemeSettingsInput,
  fallbackColors?: Partial<GlobalColors>
): ResolvedSiteTheme {
  const resolved = resolveSiteTheme(themeSettings, fallbackColors);

  if (typeof window !== 'undefined') {
    (window as any).__GENIEBUILD_ACTIVE_THEME__ = resolved.elements;
    window.dispatchEvent(
      new CustomEvent('geniebuild-theme-change', {
        detail: { themeElements: resolved.elements },
      })
    );
  }

  return resolved;
}

export type SyncThemeFromApiResult = {
  resolved: ResolvedSiteTheme;
  selectedPresetId: string | null;
  shouldStripPresetColors: boolean;
  globalColors: GlobalColors;
  globalElementStyles?: import('../types').GlobalElementStyles;
};

/** Load theme from API ThemeSetting — use in GenieBuild loadPageData and SiteNextJS. */
export function syncThemeFromApiSettings(
  themeSettings: ThemeSettingsInput,
  options?: { projectId?: string }
): SyncThemeFromApiResult {
  const resolved = resolveSiteTheme(themeSettings);
  applySiteThemeToDocument(themeSettings);

  if (typeof window !== 'undefined' && options?.projectId && resolved.presetIndex >= 0) {
    try {
      localStorage.setItem(
        `activeBuilderTheme_${options.projectId}`,
        resolved.themeSlug
      );
    } catch {
      /* ignore */
    }
  }

  // Extract globalElementStyles from API settings (typography styles set from Admin Panel)
  const globalElementStyles = (themeSettings as any)?.globalElementStyles || undefined;

  return {
    resolved,
    selectedPresetId: resolved.presetIndex >= 0 ? String(resolved.presetIndex) : null,
    shouldStripPresetColors: hasPresetThemeSettings(themeSettings),
    globalColors: resolved.globalColors,
    globalElementStyles,
  };
}

/** /updateProjectTheme body — shared by GenieBuild save + font auto-save. */
export function buildThemeSavePayload(
  projectId: string,
  selectedPresetId: string | null,
  siteData: WebsiteData,
  defaultSizes: Record<string, string>,
  defaultTypography: Record<string, unknown>
) {
  const idx =
    selectedPresetId !== null && selectedPresetId !== '' && !Number.isNaN(Number(selectedPresetId))
      ? Number(selectedPresetId)
      : -1;
  const preset = idx >= 0 ? PRESET_THEMES[idx] : null;
  const themeName = idx >= 0 ? getThemeSlugForApiFromIndex(idx) : 'custom';

  const defaultFont = String(
    defaultTypography.descriptionFontFamily ||
      defaultTypography.titleFontFamily ||
      defaultTypography.fontFamily ||
      ''
  );

  const payload: Record<string, unknown> = {
    projectId,
    theme: themeName,
    presetId: idx >= 0 ? String(idx) : null,
    defaultSizes,
    defaultTypography,
  };

  if (defaultFont) {
    payload.defaultFont = defaultFont;
  }

  if (themeName === 'custom') {
    payload.customColors = {
      heading: siteData.globalStyles.colors.titleColor,
      description: siteData.globalStyles.colors.textColor,
      surface: siteData.globalStyles.colors.backgroundColor,
      primaryButton: {
        bg: siteData.globalStyles.colors.buttonBackgroundColor,
        text: siteData.globalStyles.colors.buttonTextColor,
      },
      accent: siteData.globalStyles.colors.accentColor,
    };
  }

  return payload;
}

export function stripPresetThemeColorOverrides(sections: any[]): any[] {
  const sectionColorKeys = [
    'backgroundColor', 'textColor', 'titleColor', 'subtitleColor', 'descriptionColor',
    'accentColor', 'buttonBackgroundColor', 'buttonTextColor', 'secondaryHeadingColor',
    'iconColor', 'iconBgColor', 'iconBackgroundColor', 'subheadingColor',
    'borderColor', 'cardBackgroundColor', 'cardBorderColor', 'dividerColor', 'mutedColor',
    'inputBgColor', 'inputBorderColor', 'inputTextColor', 'inputPlaceholderColor',
    'navBackgroundColor', 'navBorderColor', 'footerBackgroundColor',
    'overlayColor',
  ];
  const trustStripStyleKeys = ['iconColor', 'iconBackgroundColor', 'iconBgColor', 'titleColor'];
  const headingStyleKeys = ['secondaryHeadingColor'];
  const buttonStyleKeys = [
    'background', 'backgroundColor', 'color', 'borderColor', 'outlineColor',
    'hoverBackgroundColor', 'hoverTextColor',
  ];
  const badgeStyleKeys = ['background', 'backgroundColor', 'color', 'borderColor'];

  const sanitizeNode = (node: any): any => {
    if (Array.isArray(node)) return node.map(sanitizeNode);
    if (!node || typeof node !== 'object') return node;

    const nextNode: any = { ...node };
    if (nextNode.styles && typeof nextNode.styles === 'object') {
      const nextStyles: any = { ...nextNode.styles };
      sectionColorKeys.forEach((key) => delete nextStyles[key]);
      nextNode.styles = nextStyles;
    }

    if (nextNode.style && typeof nextNode.style === 'object') {
      const nextElStyle: any = { ...nextNode.style };
      if (nextNode.type === 'trust-strip') {
        trustStripStyleKeys.forEach((key) => delete nextElStyle[key]);
      }
      if (nextNode.type === 'heading') {
        headingStyleKeys.forEach((key) => delete nextElStyle[key]);
      }
      if (nextNode.type === 'button') {
        buttonStyleKeys.forEach((key) => delete nextElStyle[key]);
      }
      if (nextNode.type === 'badge') {
        badgeStyleKeys.forEach((key) => delete nextElStyle[key]);
      }
      nextNode.style = nextElStyle;
    }

    Object.keys(nextNode).forEach((key) => {
      const value = nextNode[key];
      if (value && typeof value === 'object') {
        nextNode[key] = sanitizeNode(value);
      }
    });

    return nextNode;
  };

  return sections.map((section: any) => sanitizeNode(section));
}

export type SiteThemeCssInput = {
  themeSettings?: ThemeSettingsInput;
  globalColors: GlobalColors;
};

export function buildThemeProviderTypography(
  themeSettings: ThemeSettingsInput,
  baseTypography: typeof DEFAULT_TYPOGRAPHY = DEFAULT_TYPOGRAPHY
) {
  const fonts = resolveSiteTypography(themeSettings);
  return {
    h1: { ...baseTypography.h1, fontFamily: fonts.titleFontFamily },
    h2: { ...baseTypography.h2, fontFamily: fonts.subtitleFontFamily },
    h3: { ...baseTypography.h3, fontFamily: fonts.titleFontFamily },
    h4: { ...baseTypography.h4, fontFamily: fonts.titleFontFamily },
    h5: { ...baseTypography.h5, fontFamily: fonts.titleFontFamily },
    h6: { ...baseTypography.h6, fontFamily: fonts.titleFontFamily },
    p: { ...baseTypography.p, fontFamily: fonts.descriptionFontFamily },
    button: { ...baseTypography.button, fontFamily: fonts.buttonFontFamily },
    link: { ...baseTypography.link, fontFamily: fonts.descriptionFontFamily },
    caption: { ...baseTypography.caption, fontFamily: fonts.descriptionFontFamily },
  };
}

/** Push resolved typography into ThemeProvider (builder + SiteNextJS). */
export function applySiteTypographyToDocument(
  themeSettings: ThemeSettingsInput,
  baseTypography: typeof DEFAULT_TYPOGRAPHY = DEFAULT_TYPOGRAPHY
) {
  const typography = buildThemeProviderTypography(themeSettings, baseTypography);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('geniebuild-typography-change', { detail: { typography } })
    );
  }
  return typography;
}

/** Ensure Google Fonts stylesheet is present for all preset families. */
export function ensureSiteGoogleFontsLoaded(linkId = 'site-google-fonts') {
  if (typeof document === 'undefined') return;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = buildGoogleFontsCssUrl();
  document.head.appendChild(link);
}

/** Canvas CSS variables + typography (SiteNextJS + GenieBuild). */
export function buildSiteThemeCss({ themeSettings, globalColors }: SiteThemeCssInput): string {
  const resolved = resolveSiteTheme(themeSettings ?? null, globalColors);
  const gc = resolved.globalColors;
  const sizes = resolveSiteFontSizes(themeSettings);
  const fonts = resolveSiteTypography(themeSettings);

  return `
    :root { 
      --bg-color: ${gc.backgroundColor}; 
      --text-color: ${gc.textColor}; 
      --title-color: ${gc.titleColor}; 
      --accent-color: ${gc.accentColor}; 
      --btn-bg: ${gc.buttonBackgroundColor}; 
      --btn-text: ${gc.buttonTextColor}; 
      --heading-h1-size: ${sizes.h1} !important;
      --heading-h2-size: ${sizes.h2} !important;
      --heading-h3-size: ${sizes.h3} !important;
      --heading-h4-size: ${sizes.h4} !important;
      --heading-h5-size: ${sizes.h5} !important;
      --heading-h6-size: ${sizes.h6} !important;
      --text-size-base: ${sizes.text} !important;
      --text-size-small: ${sizes.textSmall} !important;
      --text-size-large: ${sizes.textLarge} !important;
      --text-size-xl: ${sizes.textXl} !important;
      --button-font-size: ${sizes.text} !important;
    } 
    #canvas-root { 
      background-color: var(--bg-color); 
      color: var(--text-color); 
      min-height: 100vh; 
    }
    ${buildSiteTypographyCss(fonts, sizes)}
    #canvas-root button {
      transition: all 0.2s ease;
    }
    #canvas-root button[class*="bg-["] { background-color: var(--btn-bg) !important; }
    #canvas-root button[class*="text-["] { color: var(--btn-text) !important; }
  `;
}

export function mountSiteThemeCss(input: SiteThemeCssInput): () => void {
  if (typeof document === 'undefined') return () => undefined;

  const styleEl = document.createElement('style');
  styleEl.id = 'dynamic-theme-styles';
  styleEl.innerHTML = buildSiteThemeCss(input);
  const existing = document.getElementById('dynamic-theme-styles');
  if (existing) existing.remove();
  document.head.appendChild(styleEl);

  return () => {
    const el = document.getElementById('dynamic-theme-styles');
    if (el) el.remove();
  };
}
