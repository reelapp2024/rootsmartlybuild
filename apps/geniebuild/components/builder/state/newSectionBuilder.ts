import type { Section, SectionType } from '../../../types';
import type { ThemeData } from '../../../src/ui-blocks';
import { SECTION_TEMPLATES, PRESET_THEMES } from '../../../constants';
import { colorToHex } from './sectionUpdaters';

/**
 * Build a new Section of the given type, filling in theme-aware default
 * colors from the active global theme so it renders correctly without
 * requiring the user to configure anything. Also deep-injects a background
 * overlay so image backgrounds are not blown out.
 */
export function buildNewSection(type: SectionType, activeGlobalTheme: ThemeData): Section {
  const template = SECTION_TEMPLATES[type] || SECTION_TEMPLATES.hero;
  const defaultVariant = template.styles?.variant || 'center';
  const variantOverrides: any = template.variantOverrides?.[defaultVariant] || {};

  const bgCol = (variantOverrides?.backgroundColor || template.styles?.backgroundColor || '').toUpperCase();
  const isWhite = bgCol === '#FFFFFF' || bgCol === '#FFF' || bgCol === 'WHITE' || bgCol === 'RGB(255,255,255)';
  const isLight = variantOverrides?.themeMode === 'light' || template.styles?.themeMode === 'light' || isWhite;

  const activeSurface = isWhite
    ? '#FFFFFF'
    : (isLight ? (activeGlobalTheme.light?.surface || '#FFFFFF') : (activeGlobalTheme.surface || '#0E1214'));
  const activeHeading = isLight ? (activeGlobalTheme.light?.heading || '#111827') : (activeGlobalTheme.heading || '#F8FAFC');
  const activeDesc    = isLight ? (activeGlobalTheme.light?.description || '#4B5563') : (activeGlobalTheme.description || '#C7CDD6');
  const activeOverlayHex = isLight
    ? (activeGlobalTheme.light?.overlay?.color || '#FFFFFF')
    : (activeGlobalTheme.overlay?.color || PRESET_THEMES[0].elements.overlay.color);
  const activeOverlayOpacity = isLight
    ? (activeGlobalTheme.light?.overlay?.opacity?.toString() || '0.92')
    : (activeGlobalTheme.overlay?.opacity?.toString() || PRESET_THEMES[0].elements.overlay.opacity.toString());
  const activeOverlayBlend = activeGlobalTheme.overlay?.blend || 'normal';
  const activeBtnBg = activeGlobalTheme.primaryButton?.bg || '#E11D48';
  const activeBtnText = activeGlobalTheme.primaryButton?.text || '#FFFFFF';
  const activeBorder = activeGlobalTheme.ring || '#F43F5E';
  const activeAccent = activeGlobalTheme.accent || '#F59E0B';
  const activeAccordionQuestion = isLight ? (activeGlobalTheme.light?.accordion?.questionColor || activeHeading) : (activeGlobalTheme.accordion?.questionColor || activeHeading);
  const activeAccordionAnswer   = isLight ? (activeGlobalTheme.light?.accordion?.answerColor || activeDesc) : (activeGlobalTheme.accordion?.answerColor || activeDesc);
  const activeCardBg = isLight ? (activeGlobalTheme.light?.surface || '#FFFFFF') : (activeGlobalTheme.surface || '#0E1214');
  const activeCardBorder = isLight ? (activeGlobalTheme.light?.overlay?.color || '#E5E7EB') : (activeGlobalTheme.overlay?.color || '#2D2D2D');

  const newSection: Section = {
    ...template,
    id: `section-${Date.now()}`,
    type: template.type || type,
    styles: {
      ...template.styles,
      ...variantOverrides,
      variant: defaultVariant,
      maxWidth: 'max-w-full',
      backgroundColor: variantOverrides?.backgroundColor || activeSurface,
      textColor: variantOverrides?.textColor || activeDesc,
      titleColor: variantOverrides?.titleColor || activeHeading,
      subtitleColor: variantOverrides?.subtitleColor || activeDesc,
      accordionQuestionColor: activeAccordionQuestion,
      accordionAnswerColor: activeAccordionAnswer,
      accordionBackgroundColor: colorToHex(activeCardBg) || activeCardBg,
      accordionBorderColor: colorToHex(activeCardBorder) || activeCardBorder,
      cardBackgroundColor: colorToHex(activeCardBg) || activeCardBg,
      cardBorderColor: colorToHex(activeCardBorder) || activeCardBorder,
      accentColor: activeAccent,
      buttonBackgroundColor: variantOverrides?.buttonBackgroundColor || activeBtnBg,
      buttonTextColor: variantOverrides?.buttonTextColor || activeBtnText,
      borderColor: variantOverrides?.borderColor || activeBorder,
      overlayColor: variantOverrides?.overlayColor || activeOverlayHex,
      overlayOpacityValue: variantOverrides?.overlayOpacityValue || activeOverlayOpacity,
      overlayBlendMode: variantOverrides?.overlayBlendMode || activeOverlayBlend,
      enableGeometry: defaultVariant === 'HeroGeometric' || (variantOverrides.variant || template.styles?.variant) === 'HeroGeometric',
    },
  } as Section;

  const currentBg = newSection.styles.background;
  const deepOverlay = {
    enabled: (currentBg?.type === 'image' || !!newSection.styles.backgroundImage) || (currentBg?.overlay?.enabled ?? false),
    color: newSection.styles.overlayColor,
    opacity: parseFloat(newSection.styles.overlayOpacityValue || '0.92'),
    blendMode: (newSection.styles.overlayBlendMode || 'normal') as any,
  };
  if (newSection.styles.background) {
    newSection.styles.background.overlay = {
      ...newSection.styles.background.overlay,
      ...deepOverlay,
    };
    if (newSection.styles.background.type === 'image' && newSection.styles.background.image) {
      newSection.styles.background.image.overlay = {
        ...newSection.styles.background.image.overlay,
        ...deepOverlay,
      };
    }
  }

  return newSection;
}
