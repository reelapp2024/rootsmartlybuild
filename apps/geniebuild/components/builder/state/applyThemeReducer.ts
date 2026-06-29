import { WebsiteData } from '../../../types';
import type { ThemeData } from '../../../src/ui-blocks';
import { SECTION_TEMPLATES, PRESET_THEMES } from '../../../constants';
import { colorToHex } from './sectionUpdaters';

/**
 * Pure reducer: given current siteData + theme colors, return the new siteData with
 * updated globalStyles and section-level color overrides applied.
 *
 * `isInit=true` means page-load: only apply to sections with no saved titleColor (fresh/AI-generated).
 * `isInit=false` means user theme switch: apply to all sections.
 */
export const applyThemeToSiteData = (
  prev: WebsiteData,
  colors: ThemeData & Record<string, any>,
  isInit: boolean,
): WebsiteData => {
  const baseHex = colors.overlay?.color || PRESET_THEMES[0].elements.overlay.color;
  const defaultOpacity = colors.overlay?.opacity ?? PRESET_THEMES[0].elements.overlay.opacity;
  const blendMode = colors.overlay?.blend || PRESET_THEMES[0].elements.overlay.blend;

  const newGlobalStyles = {
    ...prev.globalStyles,
    colors: {
      ...prev.globalStyles.colors,
      backgroundColor: colors.surface,
      textColor: colors.description,
      titleColor: colors.heading,
      accordionQuestionColor: colors.accordion?.questionColor ?? colors.heading,
      accordionAnswerColor: colors.accordion?.answerColor ?? colors.description,
      cardBackgroundColor: colorToHex(colors.surface) || colors.surface,
      cardBorderColor: colorToHex(baseHex) || baseHex,
      accordionBackgroundColor: colorToHex(colors.surface) || colors.surface,
      accordionBorderColor: colorToHex(baseHex) || baseHex,
      accentColor: colors.accent,
      buttonBackgroundColor: colors.primaryButton?.bg || (typeof colors.primaryButton === 'string' ? colors.primaryButton : prev.globalStyles.colors.buttonBackgroundColor),
      buttonTextColor: colors.primaryButton?.text,
      borderColor: colors.borderColor || colors.ring,
      overlayColor: baseHex,
      overlayOpacityValue: defaultOpacity.toString(),
      overlayBlendMode: blendMode,
    },
  };

  // On initial hydration/reload, never override per-element custom styles.
  // We only sync global theme tokens and keep saved section/element styles as-is.
  if (isInit) {
    return { ...prev, globalStyles: newGlobalStyles };
  }

  const newSections = prev.sections.map(section => {
    const currentBg = section.styles.background || { type: section.styles.backgroundImage ? 'image' : 'color' };

    const template = SECTION_TEMPLATES[section.type] || null;
    const currentVariant = section.styles?.variant || template?.styles?.variant || 'center';
    const overrides = (template?.variantOverrides?.[currentVariant] || {}) as Partial<WebsiteData['sections'][number]['styles']>;

    const templateBg = (overrides.backgroundColor || template?.styles?.backgroundColor || '').toUpperCase();
    const isTemplateWhite = templateBg === '#FFFFFF' || templateBg === '#FFF' || templateBg === 'WHITE';
    const isTemplateLight = overrides.themeMode === 'light' || template?.styles?.themeMode === 'light' || isTemplateWhite;

    const isLight = isTemplateLight;
    const isWhite = isLight;

    const activeSurface = isWhite ? '#FFFFFF' : (isLight ? (colors.light?.surface || '#FFFFFF') : colors.surface);
    const activeHeading = isLight ? (colors.light?.heading || '#111827') : colors.heading;
    const activeDesc = isLight ? (colors.light?.description || '#4B5563') : colors.description;
    const activeBorder = isLight ? (colors.light?.borderColor || 'rgba(0,0,0,0.1)') : (colors.borderColor || 'rgba(255,255,255,0.1)');
    const activeAccordionQuestion = isLight ? (colors.light?.accordion?.questionColor ?? activeHeading) : (colors.accordion?.questionColor ?? activeHeading);
    const activeAccordionAnswer = isLight ? (colors.light?.accordion?.answerColor ?? activeDesc) : (colors.accordion?.answerColor ?? activeDesc);
    const activeOverlayHex = isLight ? (colors.light?.overlay?.color || '#FFFFFF') : baseHex;
    const activeOverlayOpacity = isLight ? (colors.light?.overlay?.opacity || 0.92) : defaultOpacity;

    const updatedBg: any = {
      ...currentBg,
      overlay: {
        enabled: (currentBg.type === 'image' || !!section.styles.backgroundImage) || (currentBg.overlay?.enabled ?? false),
        color: activeOverlayHex,
        opacity: activeOverlayOpacity,
        blendMode,
      },
    };
    if (updatedBg.type === 'image' && updatedBg.image) {
      updatedBg.image = { ...updatedBg.image, overlay: { ...updatedBg.overlay } };
    }

    return {
      ...section,
      styles: {
        ...section.styles,
        backgroundColor: activeSurface,
        textColor: activeDesc,
        titleColor: activeHeading,
        subtitleColor: activeDesc,
        accordionQuestionColor: activeAccordionQuestion,
        accordionAnswerColor: activeAccordionAnswer,
        cardBackgroundColor: colorToHex(isLight ? (colors.light?.surface || '#FFFFFF') : (colors.surface || '#0E1214')) || (isLight ? (colors.light?.surface || '#FFFFFF') : (colors.surface || '#0E1214')),
        cardBorderColor: colorToHex(activeBorder) || activeBorder,
        accordionBackgroundColor: colorToHex(isLight ? (colors.light?.surface || '#FFFFFF') : (colors.surface || '#0E1214')) || (isLight ? (colors.light?.surface || '#FFFFFF') : (colors.surface || '#0E1214')),
        accordionBorderColor: colorToHex(activeBorder) || activeBorder,
        accentColor: colors.accent,
        buttonBackgroundColor: colors.primaryButton?.bg,
        buttonTextColor: colors.primaryButton?.text,
        borderColor: activeBorder,
        iconColor: isLight ? (colors.light?.icon || colors.icon) : colors.icon,
        iconBgColor: isLight ? (colors.light?.iconBg || colors.iconBg) : colors.iconBg,
        secondaryHeadingColor: isLight ? (colors.light?.secondaryHeading || colors.secondaryHeading) : colors.secondaryHeading,
        subheadingColor: isLight ? (colors.light?.subheading || colors.subheading) : colors.subheading,
        background: updatedBg,
        overlayColor: activeOverlayHex,
        overlayOpacityValue: activeOverlayOpacity.toString(),
        overlayBlendMode: blendMode,
      },
      elements: section.elements?.map(el => {
        if (el.type === 'accordion') {
          const cardBg = isLight ? (colors.light?.surface || '#FFFFFF') : (colors.surface || '#0E1214');
          const cardBorder = activeBorder;
          const defaultAccordionStyle = {
            backgroundColor: colorToHex(cardBg) || cardBg,
            borderColor: colorToHex(cardBorder) || cardBorder,
            borderRadius: '12px',
            padding: '20px',
            titleColor: colorToHex(activeAccordionQuestion) || activeAccordionQuestion,
            color: colorToHex(activeAccordionAnswer) || activeAccordionAnswer,
          };
          return { ...el, style: { ...defaultAccordionStyle } };
        }
        const newStyle = { ...el.style } as any;
        delete newStyle.color;
        delete newStyle.backgroundColor;
        delete newStyle.accentColor;
        delete newStyle.borderColor;
        delete newStyle.iconColor;
        delete newStyle.iconBackgroundColor;
        delete newStyle.iconBgColor;
        delete newStyle.iconBorderColor;
        delete newStyle.titleColor;
        delete newStyle.descriptionColor;
        delete newStyle.textColor;
        return { ...el, style: newStyle };
      }) || [],
    };
  });

  return { ...prev, globalStyles: newGlobalStyles, sections: newSections };
};
