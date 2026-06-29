import { WebsiteData, Section, WebsiteElement } from '../../../types';
import { SECTION_TEMPLATES, PRESET_THEMES } from '../../../constants';
import { colorToHex } from './sectionUpdaters';

/**
 * Pure reducer: restore missing template elements + core content for a section.
 * Returns { next, hasChanges } so caller can decide whether to toast.
 */
export const applyRestoreSectionElements = (
  prev: WebsiteData,
  sectionId: string,
): { next: WebsiteData; hasChanges: boolean } => {
  let anyChanges = false;
  const sections = prev.sections.map(s => {
    if (s.id !== sectionId) return s;

    const template = SECTION_TEMPLATES[s.type] || SECTION_TEMPLATES.hero;
    const currentElements = s.elements || [];
    const templateElements = template.elements || [];

    let hasChanges = false;
    let updatedElements = [...currentElements];
    const updatedContent: any = { ...s.content };

    if (templateElements && templateElements.length > 0) {
      const existingElementTypes = new Set(currentElements.map(el => el.type));
      const missingElements: WebsiteElement[] = [];
      templateElements.forEach((templateEl: any) => {
        if (!existingElementTypes.has(templateEl.type)) {
          const newElementId = `${sectionId}-${templateEl.type}-${Date.now()}`;
          missingElements.push({ ...templateEl, id: newElementId });
          hasChanges = true;
        }
      });
      if (missingElements.length > 0) {
        updatedElements = [...currentElements, ...missingElements];
      }
    }

    if (s.type === 'hero') {
      const templateContent: any = template.content || {};
      if (!updatedContent.imageUrl && templateContent.imageUrl) { updatedContent.imageUrl = templateContent.imageUrl; hasChanges = true; }
      if (!updatedContent.title && templateContent.title) { updatedContent.title = templateContent.title; hasChanges = true; }
      if (!updatedContent.subtitle && templateContent.subtitle) { updatedContent.subtitle = templateContent.subtitle; hasChanges = true; }
      if (!updatedContent.ctaText && templateContent.ctaText) { updatedContent.ctaText = templateContent.ctaText; hasChanges = true; }
    }

    if (hasChanges) {
      anyChanges = true;
      return { ...s, elements: updatedElements, content: updatedContent } as Section;
    }
    return s;
  });

  return { next: { ...prev, sections }, hasChanges: anyChanges };
};

/**
 * Pure reducer: reset a section's styles to variant/template defaults
 * with active theme colors merged in. Strips per-element color overrides.
 */
export const applyResetSectionStyles = (
  prev: WebsiteData,
  sectionId: string,
  activeGlobalTheme: any,
  getDefaultVariant: (type: string) => string,
): WebsiteData => {
  const sections = prev.sections.map(s => {
    if (s.id !== sectionId) return s;

    const currentVariant = s.styles?.variant || getDefaultVariant(s.type);
    const template = SECTION_TEMPLATES[s.type] || SECTION_TEMPLATES.hero;
    const variantOverrides: any = template.variantOverrides?.[currentVariant] || {};

    const newSectionStyles: any = {
      ...template.styles,
      ...variantOverrides,
      variant: currentVariant,
    };

    const bgCol = (newSectionStyles.backgroundColor || '').toUpperCase();
    const isWhite = bgCol === '#FFFFFF' || bgCol === '#FFF' || bgCol === 'WHITE' || bgCol === 'RGB(255,255,255)';
    const isLight = newSectionStyles.themeMode === 'light' || isWhite;

    const activeSurface = isWhite ? '#FFFFFF' : (isLight ? (activeGlobalTheme.light?.surface || '#FFFFFF') : (activeGlobalTheme.surface || '#0E1214'));
    const activeHeading = isLight ? (activeGlobalTheme.light?.heading || '#111827') : (activeGlobalTheme.heading || '#F8FAFC');
    const activeDesc = isLight ? (activeGlobalTheme.light?.description || '#4B5563') : (activeGlobalTheme.description || '#C7CDD6');
    const activeAccordionQuestion = isLight ? (activeGlobalTheme.light?.accordion?.questionColor || activeHeading) : (activeGlobalTheme.accordion?.questionColor || activeHeading);
    const activeAccordionAnswer = isLight ? (activeGlobalTheme.light?.accordion?.answerColor || activeDesc) : (activeGlobalTheme.accordion?.answerColor || activeDesc);
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
    const activeCardBg = isLight ? (activeGlobalTheme.light?.surface || '#FFFFFF') : (activeGlobalTheme.surface || '#0E1214');
    const activeCardBorder = isLight ? (activeGlobalTheme.light?.overlay?.color || '#E5E7EB') : (activeGlobalTheme.overlay?.color || '#2D2D2D');

    newSectionStyles.backgroundColor = activeSurface;
    newSectionStyles.titleColor = activeHeading;
    newSectionStyles.textColor = activeDesc;
    newSectionStyles.subtitleColor = activeDesc;
    newSectionStyles.accordionQuestionColor = activeAccordionQuestion;
    newSectionStyles.accordionAnswerColor = activeAccordionAnswer;
    newSectionStyles.cardBackgroundColor = colorToHex(activeCardBg) || activeCardBg;
    newSectionStyles.cardBorderColor = colorToHex(activeCardBorder) || activeCardBorder;
    newSectionStyles.accordionBackgroundColor = colorToHex(activeCardBg) || activeCardBg;
    newSectionStyles.accordionBorderColor = colorToHex(activeCardBorder) || activeCardBorder;
    newSectionStyles.buttonBackgroundColor = activeBtnBg;
    newSectionStyles.buttonTextColor = activeBtnText;
    newSectionStyles.borderColor = activeBorder;
    newSectionStyles.overlayColor = activeOverlayHex;
    newSectionStyles.overlayOpacityValue = activeOverlayOpacity;
    newSectionStyles.overlayBlendMode = activeOverlayBlend;

    if (newSectionStyles.background) {
      const currentBg = newSectionStyles.background;
      currentBg.overlay = {
        enabled: (currentBg.type === 'image' || !!newSectionStyles.backgroundImage) || (currentBg.overlay?.enabled ?? false),
        color: activeOverlayHex,
        opacity: parseFloat(activeOverlayOpacity),
        blendMode: activeOverlayBlend,
      };
      if (currentBg.type === 'image' && currentBg.image) {
        currentBg.image.overlay = { ...currentBg.overlay };
      }
    }

    const defaultAccordionStyle = {
      backgroundColor: colorToHex(activeCardBg) || activeCardBg,
      borderColor: colorToHex(activeCardBorder) || activeCardBorder,
      borderRadius: '12px',
      padding: '20px',
      titleColor: colorToHex(activeAccordionQuestion) || activeAccordionQuestion,
      color: colorToHex(activeAccordionAnswer) || activeAccordionAnswer,
    };

    const variantStyles: any = s.variantStyles || {};
    variantStyles[currentVariant] = { ...newSectionStyles };

    const newElements = s.elements?.map(el => {
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
      styles: newSectionStyles,
      variantStyles,
      elements: newElements,
    } as Section;
  });

  return { ...prev, sections };
};
