import type { Section } from '../../../types';
import type { ThemeData } from '../../../src/ui-blocks';
import { SECTION_TEMPLATES } from '../../../constants';
import { colorToHex } from './sectionUpdaters';

type SectionStyles = Section['styles'];

/**
 * Compute the theme-aware default style for an accordion inside a given
 * section. Light sections yield light accordion colors and vice versa.
 */
export function buildDefaultAccordionStyle(section: Section, activeGlobalTheme: ThemeData) {
  const template = SECTION_TEMPLATES[section.type] || null;
  const currentVariant = section.styles?.variant || template?.styles?.variant || 'center';
  const variantOverrides = (template?.variantOverrides?.[currentVariant] || {}) as Partial<SectionStyles>;
  const isLight =
    variantOverrides.themeMode === 'light' ||
    section.styles?.themeMode === 'light' ||
    template?.styles?.themeMode === 'light';

  const theme = activeGlobalTheme;
  const accordionBg = isLight ? (theme.light?.surface || '#FFFFFF') : (theme.surface || '#0E1214');
  const accordionBorder = isLight ? (theme.light?.overlay?.color || '#E5E7EB') : (theme.overlay?.color || '#2D2D2D');
  const accordionTitleColor = isLight
    ? ((theme.accordion?.questionColor ?? theme.heading) || '#F8FAFC')
    : ((theme.light?.accordion?.questionColor ?? theme.light?.heading) || '#111827');
  const accordionAnswerColor = isLight
    ? ((theme.accordion?.answerColor ?? theme.description) || '#C7CDD6')
    : ((theme.light?.accordion?.answerColor ?? theme.light?.description) || '#4B5563');

  return {
    backgroundColor: colorToHex(accordionBg) || accordionBg,
    borderColor: colorToHex(accordionBorder) || accordionBorder,
    borderRadius: '12px',
    padding: '20px',
    titleColor: colorToHex(accordionTitleColor) || accordionTitleColor,
    color: colorToHex(accordionAnswerColor) || accordionAnswerColor,
  };
}
