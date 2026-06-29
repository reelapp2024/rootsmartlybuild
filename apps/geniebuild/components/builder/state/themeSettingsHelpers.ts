import type { WebsiteData, Section } from '../../../types';
import { DEFAULT_TYPOGRAPHY, SECTION_TEMPLATES } from '../../../constants';
import { resolveSiteTypography } from '../../../../../packages/schema/src/siteTypography';

export interface DefaultSizes {
  h1: string; h2: string; h3: string; h4: string; h5: string; h6: string;
  text: string; textSmall: string; textLarge: string; textXl: string;
}

export interface DefaultTypography {
  titleFontFamily: string;
  subtitleFontFamily: string;
  descriptionFontFamily: string;
  buttonFontFamily: string;
}

/** Merge saved default sizes from API with hardcoded fallback defaults. */
export function buildDefaultSizesFromApi(savedSizes: any): DefaultSizes {
  return {
    h1: savedSizes?.h1 || '3rem',
    h2: savedSizes?.h2 || '2.5rem',
    h3: savedSizes?.h3 || '2rem',
    h4: savedSizes?.h4 || '1.5rem',
    h5: savedSizes?.h5 || '1.25rem',
    h6: savedSizes?.h6 || '1rem',
    text: savedSizes?.text || '1rem',
    textSmall: savedSizes?.textSmall || '0.875rem',
    textLarge: savedSizes?.textLarge || '1.125rem',
    textXl: savedSizes?.textXl || '1.25rem',
  };
}

/** Merge saved default typography from API with DEFAULT_TYPOGRAPHY fallbacks. */
export function buildDefaultTypographyFromApi(
  savedTypography: any,
  themeSettings?: { defaultFont?: string; customColors?: { fontFamily?: string } }
): DefaultTypography {
  return resolveSiteTypography({
    defaultFont: themeSettings?.defaultFont,
    customColors: themeSettings?.customColors,
    defaultTypography: savedTypography,
  });
}

/**
 * Apply custom-theme colors to every section while honoring each section's
 * template DNA (light-mode templates keep their light colors; dark sections
 * adopt the new custom surface/text/title/subtitle).
 */
export function applyCustomColorsToSiteData(prev: WebsiteData, customColors: any): WebsiteData {
  const newColors = {
    backgroundColor: customColors.surface || prev.globalStyles.colors.backgroundColor,
    textColor: customColors.description || prev.globalStyles.colors.textColor,
    titleColor: customColors.heading || prev.globalStyles.colors.titleColor,
    subtitleColor: customColors.description || prev.globalStyles.colors.subtitleColor,
    accentColor: customColors.accent || prev.globalStyles.colors.accentColor,
    buttonBackgroundColor: customColors.primaryButton?.bg || prev.globalStyles.colors.buttonBackgroundColor,
    buttonTextColor: customColors.primaryButton?.text || prev.globalStyles.colors.buttonTextColor,
    linkColor: customColors.ring || prev.globalStyles.colors.linkColor,
    borderColor: customColors.ring || prev.globalStyles.colors.borderColor,
    overlayColor: customColors.overlay?.color || prev.globalStyles.colors.overlayColor,
  };

  const nextSections = prev.sections.map((section: Section) => {
    const template = SECTION_TEMPLATES[section.type] || null;
    const currentVariant = section.styles?.variant || template?.styles?.variant || 'center';
    const overrides: any = template?.variantOverrides?.[currentVariant] || {};

    const templateBg = (overrides.backgroundColor || template?.styles?.backgroundColor || '').toUpperCase();
    const isTemplateWhite = templateBg === '#FFFFFF' || templateBg === '#FFF' || templateBg === 'WHITE';
    const isTemplateLight = overrides.themeMode === 'light' || template?.styles?.themeMode === 'light' || isTemplateWhite;
    const isLight = isTemplateLight;
    const isWhite = isLight;

    return {
      ...section,
      styles: {
        ...section.styles,
        backgroundColor: isLight
          ? (isWhite ? '#FFFFFF' : section.styles.backgroundColor)
          : (customColors.surface || section.styles.backgroundColor),
        textColor: isLight ? section.styles.textColor : (customColors.description || section.styles.textColor),
        titleColor: isLight ? section.styles.titleColor : (customColors.heading || section.styles.titleColor),
        subtitleColor: isLight ? section.styles.subtitleColor : (customColors.description || section.styles.subtitleColor),
        accentColor: customColors.accent || section.styles.accentColor,
        buttonBackgroundColor: customColors.primaryButton?.bg || section.styles.buttonBackgroundColor,
        buttonTextColor: customColors.primaryButton?.text || section.styles.buttonTextColor,
      },
    };
  });

  return {
    ...prev,
    globalStyles: { ...prev.globalStyles, colors: newColors },
    sections: nextSections,
  };
}
