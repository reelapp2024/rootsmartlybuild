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
  additionalCss?: {
    blogCss?: string | null;
    siteCss?: string | null;
    applyBlogCssToSite?: boolean | null;
  } | null;
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
    const root = document.documentElement;
    const gc = resolved.globalColors;
    root.style.setProperty('--btn-bg', gc.buttonBackgroundColor);
    root.style.setProperty('--btn-text', gc.buttonTextColor);
    root.style.setProperty('--bg-color', gc.backgroundColor);
    root.style.setProperty('--text-color', gc.textColor);
    root.style.setProperty('--title-color', gc.titleColor);
    root.style.setProperty('--accent-color', gc.accentColor);

    const light = (resolved.elements?.light || {}) as Record<string, any>;
    root.style.setProperty('--blog-title-color', String(light.heading || light.titleColor || '#111827'));
    root.style.setProperty('--blog-text-color', String(light.description || light.textColor || '#374151'));
    root.style.setProperty(
      '--blog-accent-color',
      String(light.accent || light.accentColor || resolved.elements?.accent || gc.accentColor || '#E11D48')
    );
    root.style.setProperty(
      '--blog-link-color',
      String(
        light.link ||
          light.linkColor ||
          light.accent ||
          light.accentColor ||
          resolved.elements?.accent ||
          gc.accentColor ||
          '#E11D48'
      )
    );
    root.style.setProperty('--blog-muted-color', String(light.muted || '#6B7280'));
    root.style.setProperty('--blog-surface-color', String(light.surface || '#FFFFFF'));

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
    // image-box / feature-box CTA color keys
    'buttonBgColor', 'buttonTextColor', 'buttonBackgroundColor', 'buttonColor',
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
      const elType = String(nextNode.type || '').toLowerCase();
      if (elType === 'trust-strip') {
        trustStripStyleKeys.forEach((key) => delete nextElStyle[key]);
      }
      if (elType === 'heading') {
        headingStyleKeys.forEach((key) => delete nextElStyle[key]);
      }
      if (elType === 'button' || elType === 'call-to-action') {
        buttonStyleKeys.forEach((key) => delete nextElStyle[key]);
      }
      if (elType === 'image-box' || elType === 'feature-box' || elType === 'icon-box') {
        ['buttonBgColor', 'buttonTextColor', 'buttonBackgroundColor', 'buttonColor'].forEach(
          (key) => delete nextElStyle[key]
        );
      }
      if (elType === 'badge') {
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

export type BlogThemeTokens = {
  titleColor: string;
  textColor: string;
  linkColor: string;
  accentColor: string;
  mutedColor: string;
  surfaceColor: string;
  titleFont: string;
  bodyFont: string;
  sizes: ReturnType<typeof resolveSiteFontSizes>;
  blogCss: string;
  siteCss: string;
  applyBlogCssToSite: boolean;
  googleFontsUrl: string;
};

/** Same light tokens site headings/paragraphs use — blogs + admin editor share this. */
export function resolveBlogThemeTokens(
  themeSettings: ThemeSettingsInput,
  globalColors?: Partial<GlobalColors>
): BlogThemeTokens {
  const resolved = resolveSiteTheme(themeSettings ?? null, globalColors);
  const gc = resolved.globalColors;
  const sizes = resolveSiteFontSizes(themeSettings);
  const fonts = resolveSiteTypography(themeSettings);
  const elements = resolved.elements || {};
  const light = (elements.light || {}) as Record<string, any>;
  const additional = (themeSettings as any)?.additionalCss || {};

  return {
    titleColor: String(
      light.heading || light.titleColor || light.featureBox?.titleColor || '#111827'
    ),
    textColor: String(
      light.description || light.textColor || light.featureBox?.textColor || '#374151'
    ),
    // Match SiteNextJS BlogContentDefault / applySiteThemeToDocument — light palette first
    accentColor: String(
      light.accent || light.accentColor || elements.accent || gc.accentColor || '#E11D48'
    ),
    linkColor: String(
      light.link ||
        light.linkColor ||
        light.accent ||
        light.accentColor ||
        (elements as any).link ||
        (elements as any).linkColor ||
        elements.accent ||
        gc.accentColor ||
        '#E11D48'
    ),
    mutedColor: String(light.muted || light.textColorMuted || '#6B7280'),
    surfaceColor: String(light.surface || light.backgroundColor || '#FFFFFF'),
    titleFont: String(fonts.titleFontFamily || '"Poppins", sans-serif'),
    bodyFont: String(fonts.descriptionFontFamily || '"Inter", sans-serif'),
    sizes,
    blogCss: String(additional.blogCss || '').trim(),
    siteCss: String(additional.siteCss || '').trim(),
    applyBlogCssToSite: Boolean(additional.applyBlogCssToSite),
    googleFontsUrl: buildGoogleFontsCssUrl(),
  };
}

/**
 * Blog FAQ accordion CSS — matches SiteNextJS BlogContentDefault → ElementsSection
 * accordion (plus-in-circle chip, title-colored questions, card gaps, answer divider).
 * `mode: 'vars'` uses CSS custom properties; `mode: 'literal'` bakes token colors in.
 */
export function buildBlogFaqAccordionCss(
  scope: string,
  mode: 'vars' | 'literal' = 'vars',
  tokens?: Pick<
    BlogThemeTokens,
    'titleColor' | 'textColor' | 'accentColor' | 'surfaceColor' | 'titleFont' | 'bodyFont'
  >
): string {
  const title = mode === 'literal' && tokens ? tokens.titleColor : 'var(--blog-title-color)';
  const text = mode === 'literal' && tokens ? tokens.textColor : 'var(--blog-text-color)';
  const accent = mode === 'literal' && tokens ? tokens.accentColor : 'var(--blog-accent-color)';
  const bg = mode === 'literal' && tokens ? tokens.surfaceColor : 'var(--blog-surface-color, #fff)';
  const titleFont = mode === 'literal' && tokens ? tokens.titleFont : 'var(--blog-title-font)';
  const bodyFont = mode === 'literal' && tokens ? tokens.bodyFont : 'var(--blog-body-font)';
  const border = `color-mix(in srgb, ${accent} 20%, transparent)`;
  const iconBg = `color-mix(in srgb, ${accent} 8%, transparent)`;
  const divider = `color-mix(in srgb, ${accent} 13%, transparent)`;

  return `
    /* Stack FAQ cards like live accordion itemGap */
    ${scope} details.gb-faq,
    ${scope} .gb-faq {
      display: block;
      margin: 0 0 0.75rem;
      padding: 0;
      border: 1px solid ${border};
      border-radius: 0.875rem;
      background: ${bg};
      box-shadow: none;
      overflow: hidden;
      transition: border-color 0.2s ease, background-color 0.2s ease;
    }
    ${scope} details.gb-faq:last-child,
    ${scope} .gb-faq:last-child { margin-bottom: 0; }
    ${scope} details.gb-faq > summary,
    ${scope} summary.gb-faq-q {
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      margin: 0;
      color: ${title};
      font-family: ${titleFont};
      font-weight: 700;
      font-size: 1.0625rem;
      line-height: 1.4;
      text-align: left;
      user-select: none;
      background: transparent;
      border: none;
    }
    ${scope} details.gb-faq > summary::-webkit-details-marker,
    ${scope} summary.gb-faq-q::-webkit-details-marker { display: none; }
    /* Plus / minus chip — same language as live accordion iconType=plus */
    ${scope} details.gb-faq > summary::after {
      content: "+";
      box-sizing: border-box;
      width: 2rem;
      height: 2rem;
      border-radius: 9999px;
      background: ${iconBg};
      color: ${accent};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      line-height: 1;
      flex-shrink: 0;
      transform: none;
      opacity: 1;
      margin-left: 0.25rem;
      transition: background-color 0.2s ease;
    }
    ${scope} details.gb-faq[open] > summary {
      background: transparent;
      border-bottom: none;
    }
    ${scope} details.gb-faq[open] > summary::after {
      content: "\\2212";
      transform: none;
    }
    ${scope} details.gb-faq > .gb-faq-a,
    ${scope} .gb-faq-a {
      padding: 1.25rem 1.5rem;
      margin: 0;
      border-top: 1px solid ${divider};
      color: ${text};
      font-family: ${bodyFont};
      font-size: 0.9375rem;
      line-height: 1.65;
    }
    ${scope} details.gb-faq > .gb-faq-a > p,
    ${scope} .gb-faq-a > p { margin: 0 0 0.65em; color: inherit; font-size: inherit; }
    ${scope} details.gb-faq > .gb-faq-a > p:last-child,
    ${scope} .gb-faq-a > p:last-child { margin-bottom: 0; }
    ${scope} details.gb-faq > summary.gb-faq-q,
    ${scope} details.gb-faq .gb-faq-q {
      color: ${title};
      margin: 0;
      font-size: 1.0625rem;
    }
  `;
}

/**
 * Shared blog prose rules — live site, GenieBuild, admin WYSIWYG.
 * Brand chrome matches site FAQ/headings (accent bars, fonts, link color).
 */
export function buildBlogProseCss(scope = '.blog-prose'): string {
  return `
    ${scope} {
      color: var(--blog-text-color);
      font-family: var(--blog-body-font);
      font-size: var(--text-size-base, 1rem);
      line-height: 1.8;
    }
    ${scope} h1, ${scope} .gb-h1,
    ${scope} h2, ${scope} .gb-h2,
    ${scope} h3, ${scope} .gb-h3,
    ${scope} h4, ${scope} .gb-h4,
    ${scope} h5, ${scope} .gb-h5,
    ${scope} h6, ${scope} .gb-h6 {
      color: var(--blog-title-color);
      font-family: var(--blog-title-font);
      font-weight: 700;
      line-height: 1.3;
      margin: 1.65em 0 0.65em;
    }
    /* Brand accent bar — same visual language as site FAQ / feature cards */
    ${scope} h2, ${scope} .gb-h2 {
      font-size: var(--heading-h2-size, 1.75rem);
      border-left: 4px solid var(--blog-accent-color);
      padding-left: 0.85rem;
      margin-left: 0;
    }
    ${scope} h1, ${scope} .gb-h1 {
      font-size: var(--heading-h1-size, 2.25rem);
      border-left: 4px solid var(--blog-accent-color);
      padding-left: 0.85rem;
    }
    ${scope} h3, ${scope} .gb-h3 {
      font-size: var(--heading-h3-size, 1.375rem);
      color: var(--blog-accent-color);
      font-weight: 700;
    }
    ${scope} h4, ${scope} .gb-h4 { font-size: var(--heading-h4-size, 1.25rem); }
    ${scope} h5, ${scope} .gb-h5 { font-size: var(--heading-h5-size, 1.125rem); }
    ${scope} h6, ${scope} .gb-h6 { font-size: var(--heading-h6-size, 1rem); }
    ${scope} p, ${scope} .gb-p {
      margin: 0 0 1em;
      color: var(--blog-text-color);
      font-family: var(--blog-body-font);
      font-size: var(--text-size-base, 1rem);
      line-height: 1.8;
    }
    ${scope} a, ${scope} .gb-link {
      color: var(--blog-link-color);
      text-decoration: underline;
      text-underline-offset: 3px;
      font-weight: 600;
      cursor: pointer;
    }
    ${scope} a:hover, ${scope} .gb-link:hover { opacity: 0.85; }
    /* Manual editor colors/fonts win over theme (no !important on theme colors/fonts) */
    ${scope} a[style*="color"],
    ${scope} a[data-gb-color-override="1"],
    ${scope} [data-gb-color-override="1"],
    ${scope} [style*="font-family"],
    ${scope} [data-gb-font-override="1"] { /* inline style attribute wins */ }
    ${scope} font[color] a,
    ${scope} [style*="color:"] > a,
    ${scope} [style*="color :"] > a,
    ${scope} [data-gb-color-override="1"] > a { color: inherit; }
    ${scope} ul, ${scope} .gb-ul,
    ${scope} ol, ${scope} .gb-ol {
      margin: 0 0 1em;
      padding-left: 1.35rem;
      color: var(--blog-text-color);
      font-family: var(--blog-body-font);
    }
    ${scope} li, ${scope} .gb-li { margin: 0.35em 0; }
    ${scope} li::marker { color: var(--blog-accent-color); }
    ${scope} blockquote, ${scope} .gb-quote {
      margin: 1.25em 0;
      padding: 0.85em 1.1em;
      border-left: 4px solid var(--blog-accent-color);
      background: color-mix(in srgb, var(--blog-accent-color) 8%, var(--blog-surface-color, #fff));
      color: var(--blog-text-color);
      font-style: italic;
      font-family: var(--blog-body-font);
      border-radius: 0 0.65rem 0.65rem 0;
    }
    ${scope} img, ${scope} .gb-img {
      max-width: 100%;
      height: auto;
      border-radius: 0.75rem;
      margin: 1.25em 0;
    }
    ${scope} strong, ${scope} .gb-strong,
    ${scope} b { color: var(--blog-title-color); font-weight: 700; }
    ${scope} hr, ${scope} .gb-hr {
      border: none;
      border-top: 2px solid color-mix(in srgb, var(--blog-accent-color) 35%, transparent);
      margin: 2em 0;
    }
    ${scope} code, ${scope} .gb-code {
      font-size: 0.9em;
      padding: 0.15em 0.4em;
      border-radius: 0.35rem;
      background: color-mix(in srgb, var(--blog-accent-color) 12%, transparent);
      color: var(--blog-title-color);
    }
    /* FAQ accordion — match SiteNextJS BlogContentDefault ElementsSection accordion */
    ${buildBlogFaqAccordionCss(scope, 'vars')}
    ${scope} .gb-review, ${scope} .gb-testimonial {
      margin: 1.25em 0;
      padding: 1.1em 1.2em;
      border-radius: 0.75rem;
      border: 1px solid color-mix(in srgb, var(--blog-accent-color) 20%, transparent);
      background: color-mix(in srgb, var(--blog-accent-color) 7%, var(--blog-surface-color, #fff));
    }
    ${scope} .gb-review-quote, ${scope} .gb-testimonial-quote {
      color: var(--blog-text-color);
      font-style: italic;
      margin: 0 0 0.75em;
    }
    ${scope} .gb-review-author, ${scope} .gb-testimonial-author {
      color: var(--blog-accent-color);
      font-weight: 700;
      font-family: var(--blog-title-font);
      font-size: 0.95em;
    }
  `;
}

/** CSS vars + prose for admin blog editor iframe (same look as live site). */
export function buildBlogEditorThemeCss(themeSettings: ThemeSettingsInput): {
  tokens: BlogThemeTokens;
  css: string;
  googleFontsUrl: string;
} {
  const tokens = resolveBlogThemeTokens(themeSettings);
  const { sizes } = tokens;
  // Literal color rules (same approach as BlogContentDefault) so the admin iframe
  // matches SiteNextJS even when CSS var inheritance is flaky inside the iframe.
  const literal = buildBlogProseLiteralCss('#root.blog-prose', tokens);
  const css = `
    :root {
      --blog-title-color: ${tokens.titleColor};
      --blog-text-color: ${tokens.textColor};
      --blog-link-color: ${tokens.linkColor};
      --blog-accent-color: ${tokens.accentColor};
      --blog-muted-color: ${tokens.mutedColor};
      --blog-surface-color: ${tokens.surfaceColor};
      --blog-title-font: ${tokens.titleFont};
      --blog-body-font: ${tokens.bodyFont};
      --heading-h1-size: ${sizes.h1};
      --heading-h2-size: ${sizes.h2};
      --heading-h3-size: ${sizes.h3};
      --heading-h4-size: ${sizes.h4};
      --heading-h5-size: ${sizes.h5};
      --heading-h6-size: ${sizes.h6};
      --text-size-base: ${sizes.text};
      --text-size-small: ${sizes.textSmall};
      --text-size-large: ${sizes.textLarge};
      --text-size-xl: ${sizes.textXl};
    }
    html, body {
      margin: 0;
      background: ${tokens.surfaceColor};
      color: ${tokens.textColor};
      font-family: ${tokens.bodyFont};
    }
    body { padding: 1rem 1.15rem; }
    body:after { content:""; display:block; clear:both; }
    #root.blog-prose, .blog-prose {
      outline: none;
      min-height: 12rem;
      color: ${tokens.textColor};
      font-family: ${tokens.bodyFont};
      font-size: ${sizes.text};
      line-height: 1.8;
    }
    img:focus, img.selected { outline: 2px solid #60a5fa; }
    ${buildBlogProseCss('.blog-prose')}
    ${buildBlogProseCss('#root')}
    ${literal}
    ${tokens.blogCss}
  `;
  return { tokens, css, googleFontsUrl: tokens.googleFontsUrl };
}

/**
 * Literal-token prose CSS — mirrors BlogContentDefault scoped <style> so admin
 * WYSIWYG and live SiteNextJS share the same visual rules.
 */
export function buildBlogProseLiteralCss(scope: string, tokens: BlogThemeTokens): string {
  const title = tokens.titleColor;
  const text = tokens.textColor;
  const accent = tokens.accentColor;
  const link = tokens.linkColor;
  const bg = tokens.surfaceColor;
  const titleFont = tokens.titleFont;
  const bodyFont = tokens.bodyFont;
  const h1 = tokens.sizes.h1;
  const h2 = tokens.sizes.h2;
  const h3 = tokens.sizes.h3;
  return `
    ${scope} {
      color: ${text};
      font-family: ${bodyFont};
      font-size: ${tokens.sizes.text};
      line-height: 1.8;
    }
    ${scope} a, ${scope} .gb-link {
      color: ${link};
      text-decoration: underline;
      text-underline-offset: 3px;
      font-weight: 600;
      cursor: pointer;
    }
    ${scope} a:hover, ${scope} .gb-link:hover { opacity: 0.85; }
    ${scope} font[color] a,
    ${scope} [style*="color:"] > a,
    ${scope} [style*="color :"] > a,
    ${scope} [data-gb-color-override="1"] > a { color: inherit; }
    ${scope} [data-gb-color-override="1"] { border-left-color: currentColor; }
    ${scope} img, ${scope} .gb-img {
      max-width: 100%;
      height: auto;
      border-radius: 0.75rem;
    }
    ${scope} h1, ${scope} h2, ${scope} .gb-h1, ${scope} .gb-h2 {
      color: ${title};
      font-family: ${titleFont};
      font-weight: 700;
      line-height: 1.3;
      margin: 1.65em 0 0.65em;
      border-left: 4px solid ${accent};
      padding-left: 0.85rem;
    }
    ${scope} h1, ${scope} .gb-h1 { font-size: ${h1}; }
    ${scope} h2, ${scope} .gb-h2 { font-size: ${h2}; }
    ${scope} h3, ${scope} .gb-h3 {
      color: ${accent};
      font-family: ${titleFont};
      font-weight: 700;
      line-height: 1.35;
      margin: 1.25em 0 0.5em;
      font-size: ${h3};
    }
    ${scope} h4, ${scope} h5, ${scope} h6,
    ${scope} .gb-h4, ${scope} .gb-h5, ${scope} .gb-h6 {
      color: ${title};
      font-family: ${titleFont};
      font-weight: 700;
      margin: 1.25em 0 0.5em;
    }
    ${scope} p, ${scope} .gb-p {
      margin: 0 0 1em;
      color: ${text};
      font-family: ${bodyFont};
    }
    ${scope} ul, ${scope} ol, ${scope} .gb-ul, ${scope} .gb-ol {
      margin: 0 0 1em;
      padding-left: 1.35rem;
      color: ${text};
      font-family: ${bodyFont};
    }
    ${scope} li::marker { color: ${accent}; }
    ${scope} blockquote, ${scope} .gb-quote {
      margin: 1.25em 0;
      padding: 0.85em 1.1em;
      border-left: 4px solid ${accent};
      background: color-mix(in srgb, ${accent} 8%, ${bg});
      color: ${text};
      font-style: italic;
      border-radius: 0 0.65rem 0.65rem 0;
      font-family: ${bodyFont};
    }
    ${scope} strong, ${scope} .gb-strong, ${scope} b {
      color: ${title};
      font-weight: 700;
    }
    ${buildBlogFaqAccordionCss(scope, 'literal', tokens)}
  `;
}

/** Payload for admin GET /blogEditorTheme/:projectId */
export function buildBlogEditorThemePayload(themeSettings: ThemeSettingsInput) {
  const { tokens, css, googleFontsUrl } = buildBlogEditorThemeCss(themeSettings);
  return {
    ...tokens,
    proseCss: css,
    googleFontsUrl,
  };
}

/** Canvas CSS variables + typography (SiteNextJS + GenieBuild). */
export function buildSiteThemeCss({ themeSettings, globalColors }: SiteThemeCssInput): string {
  const resolved = resolveSiteTheme(themeSettings ?? null, globalColors);
  const gc = resolved.globalColors;
  const sizes = resolveSiteFontSizes(themeSettings);
  const fonts = resolveSiteTypography(themeSettings);
  const tokens = resolveBlogThemeTokens(themeSettings, globalColors);
  const { blogCss, siteCss, applyBlogCssToSite: applyBlogToSite } = tokens;

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
      /* Blog prose tokens (always light — WordPress/Wix article feel) */
      --blog-title-color: ${tokens.titleColor};
      --blog-text-color: ${tokens.textColor};
      --blog-link-color: ${tokens.linkColor};
      --blog-accent-color: ${tokens.accentColor};
      --blog-muted-color: ${tokens.mutedColor};
      --blog-surface-color: ${tokens.surfaceColor};
      --blog-title-font: ${tokens.titleFont};
      --blog-body-font: ${tokens.bodyFont};
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
    /* After preset strip, SectionRenderer used to fall back to Tailwind bg-white — force brand CTA. */
    #canvas-root button[id^="gb-btn-"].bg-white,
    #canvas-root a[id^="gb-btn-"].bg-white {
      background-color: var(--btn-bg, #E11D48) !important;
    }
    #canvas-root button[id^="gb-btn-"].text-black,
    #canvas-root a[id^="gb-btn-"].text-black {
      color: var(--btn-text, #FFFFFF) !important;
    }

    /* ── Blog prose (same tokens as site headings / paragraphs) ── */
    ${buildBlogProseCss('.blog-prose')}

    /* Project Additional CSS — site-wide */
    ${siteCss}

    /* Project Additional CSS — blog (target .blog-prose / .gb-* for best results) */
    ${blogCss}

    /* When enabled, gb-* theme tokens also style elements outside blog prose */
    ${applyBlogToSite ? `
    #canvas-root .gb-h1, #canvas-root .gb-h2, #canvas-root .gb-h3,
    #canvas-root .gb-h4, #canvas-root .gb-h5, #canvas-root .gb-h6 {
      color: var(--blog-title-color);
      font-family: var(--blog-title-font);
    }
    #canvas-root .gb-p, #canvas-root .gb-li { color: var(--blog-text-color); }
    #canvas-root .gb-link { color: var(--blog-link-color); }
    #canvas-root .gb-quote { border-left-color: var(--blog-accent-color); }
    ` : ''}
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
