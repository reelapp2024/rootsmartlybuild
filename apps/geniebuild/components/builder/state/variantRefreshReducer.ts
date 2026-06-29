import type { WebsiteData, Section } from '../../../types';
import type { ThemeData } from '../../../src/ui-blocks';
import { SECTION_TEMPLATES, PRESET_THEMES } from '../../../constants';
import { colorToHex } from './sectionUpdaters';

interface VariantRefreshArgs {
  sectionId: string;
  sectionType: string;
  currentVariant: string;
  nextVariant: string;
  activeGlobalTheme: ThemeData;
}

/**
 * Reducer: switch one section to the next variant, saving the current
 * styles to variantStyles[currentVariant] and loading (or deriving)
 * styles for variantStyles[nextVariant]. Applies the active theme's
 * active surface/heading/description/overlay/button colors to purge
 * stale colors left over from the previous variant.
 *
 * Strips inline color styles from child elements (so theme colors can
 * flow through) and resets accordions to the theme-default accordion style.
 */
export function applyVariantRefresh(
  prev: WebsiteData,
  { sectionId, sectionType, currentVariant, nextVariant, activeGlobalTheme }: VariantRefreshArgs
): WebsiteData {
  return {
    ...prev,
    sections: prev.sections.map((s: Section) => {
      if (s.id !== sectionId) return s;

      const variantStyles: any = s.variantStyles || {};
      variantStyles[currentVariant] = {
        ...variantStyles[currentVariant],
        ...s.styles,
      };

      const nextVariantStyles = variantStyles[nextVariant] || {};
      const template = SECTION_TEMPLATES[sectionType] || SECTION_TEMPLATES.hero;
      const defaultStyles: any = template?.styles || {};
      const overrides: any = template?.variantOverrides?.[nextVariant] || {};
      const isLight = nextVariantStyles.themeMode === 'light' || overrides.themeMode === 'light';

      const activeSurface = isLight ? (activeGlobalTheme.light?.surface || '#FFFFFF') : (activeGlobalTheme.surface || '#0E1214');
      const activeHeading = isLight ? (activeGlobalTheme.light?.heading || '#111827') : (activeGlobalTheme.heading || '#F8FAFC');
      const activeDesc    = isLight ? (activeGlobalTheme.light?.description || '#4B5563') : (activeGlobalTheme.description || '#C7CDD6');
      const activeAccordionQuestion = isLight ? (activeGlobalTheme.light?.accordion?.questionColor || activeHeading) : (activeGlobalTheme.accordion?.questionColor || activeHeading);
      const activeAccordionAnswer   = isLight ? (activeGlobalTheme.light?.accordion?.answerColor || activeDesc) : (activeGlobalTheme.accordion?.answerColor || activeDesc);
      const activeOverlayHex = isLight
        ? (activeGlobalTheme.light?.overlay?.color || '#FFFFFF')
        : (activeGlobalTheme.overlay?.color || PRESET_THEMES[0].elements.overlay.color);
      const activeOverlayOpacity = isLight
        ? (activeGlobalTheme.light?.overlay?.opacity?.toString() || '0.92')
        : (activeGlobalTheme.overlay?.opacity?.toString() || '0.92');
      const activeOverlayBlend = activeGlobalTheme.overlay?.blend || 'normal';
      const activeBtnBg = activeGlobalTheme.primaryButton?.bg || '#E11D48';
      const activeBtnText = activeGlobalTheme.primaryButton?.text || '#FFFFFF';
      const activeBorder = activeGlobalTheme.ring || '#F43F5E';

      const deepOverlay = {
        enabled: true,
        color: overrides.overlayColor || activeOverlayHex,
        opacity: overrides.overlayOpacityValue || activeOverlayOpacity,
        blendMode: overrides.overlayBlendMode || activeOverlayBlend,
      };

      const currentBg = nextVariantStyles.background || overrides.background || defaultStyles.background;
      let updatedBg = currentBg ? { ...currentBg } : undefined;
      if (updatedBg) {
        updatedBg.overlay = { ...updatedBg.overlay, ...deepOverlay };
        if (updatedBg.type === 'image' && updatedBg.image) {
          updatedBg.image = { ...updatedBg.image, overlay: { ...updatedBg.image.overlay, ...deepOverlay } };
        }
      }

      const activeCardBg = isLight ? (activeGlobalTheme.light?.surface || '#FFFFFF') : (activeGlobalTheme.surface || '#0E1214');
      const activeCardBorder = isLight ? (activeGlobalTheme.light?.overlay?.color || '#E5E7EB') : (activeGlobalTheme.overlay?.color || '#2D2D2D');

      const mergedStyles = {
        ...defaultStyles,
        ...nextVariantStyles,
        ...overrides,
        variant: nextVariant,
        background: updatedBg,
        overlayColor: deepOverlay.color,
        overlayOpacityValue: deepOverlay.opacity.toString(),
        overlayBlendMode: deepOverlay.blendMode,
        backgroundColor: overrides.backgroundColor || activeSurface,
        titleColor: overrides.titleColor || activeHeading,
        textColor: overrides.textColor || activeDesc,
        subtitleColor: overrides.subtitleColor || activeDesc,
        accordionQuestionColor: overrides.accordionQuestionColor || activeAccordionQuestion,
        accordionAnswerColor: overrides.accordionAnswerColor || activeAccordionAnswer,
        cardBackgroundColor: colorToHex(activeCardBg) || activeCardBg,
        cardBorderColor: colorToHex(activeCardBorder) || activeCardBorder,
        accordionBackgroundColor: colorToHex(activeCardBg) || activeCardBg,
        accordionBorderColor: colorToHex(activeCardBorder) || activeCardBorder,
        buttonBackgroundColor: overrides.buttonBackgroundColor || activeBtnBg,
        buttonTextColor: overrides.buttonTextColor || activeBtnText,
        borderColor: overrides.borderColor || activeBorder,
      };

      const defaultAccordionStyle = {
        backgroundColor: colorToHex(activeCardBg) || activeCardBg,
        borderColor: colorToHex(activeCardBorder) || activeCardBorder,
        borderRadius: '12px',
        padding: '20px',
        titleColor: colorToHex(activeAccordionQuestion) || activeAccordionQuestion,
        color: colorToHex(activeAccordionAnswer) || activeAccordionAnswer,
      };

      const updatedElements = s.elements?.map((el) => {
        if (el.type === 'accordion') {
          return { ...el, style: { ...defaultAccordionStyle } };
        }
        const newStyle: any = { ...el.style };
        delete newStyle.color;
        delete newStyle.backgroundColor;
        delete newStyle.accentColor;
        delete newStyle.borderColor;
        return { ...el, style: newStyle };
      }) || [];

      return {
        ...s,
        styles: mergedStyles,
        variantStyles,
        elements: updatedElements,
      } as Section;
    }),
  };
}
