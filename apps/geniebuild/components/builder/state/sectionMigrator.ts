import type { Section } from '../../../types';
import type { ThemeData } from '../../../src/ui-blocks';
import { SECTION_TEMPLATES, PRESET_THEMES } from '../../../constants';
import { getDefaultVariant, isValidVariant } from '../../SectionsAndVariantRegistry';

type SectionStyles = Section['styles'];

/**
 * Pure migrator: sanitizes a Section loaded from the DB to conform to the
 * current template DNA (light-vs-dark mode colors, variant background, and
 * variantStyles bookkeeping). Returns a new Section.
 */
export function migrateSection(section: Section, activeGlobalTheme: ThemeData | undefined): Section {
  const template = SECTION_TEMPLATES[section.type] || null;
  const rawVariant = section.styles?.variant || '';
  const currentVariant = rawVariant && isValidVariant(section.type, rawVariant)
    ? rawVariant
    : getDefaultVariant(section.type);
  const variantOverrides = (template?.variantOverrides?.[currentVariant] || {}) as Partial<SectionStyles>;

  const templateBg = (variantOverrides.backgroundColor || template?.styles?.backgroundColor || '').toUpperCase();
  const isTemplateWhite = templateBg === '#FFFFFF' || templateBg === '#FFF' || templateBg === 'WHITE';
  const isTemplateLight =
    variantOverrides.themeMode === 'light' ||
    (template?.styles as SectionStyles | undefined)?.themeMode === 'light' ||
    isTemplateWhite;

  const isLight = isTemplateLight;
  const migrated: Section = {
    ...section,
    styles: {
      ...section.styles,
      // Normalize stale/removed variants from old DB saves to a real variant file.
      variant: currentVariant,
    },
  };

  if (isLight) {
    migrated.styles.themeMode = 'light';

    const currentBg = (migrated.styles.backgroundColor || '').toUpperCase();
    const currentTitle = (migrated.styles.titleColor || '').toUpperCase();
    const currentText = (migrated.styles.textColor || '').toUpperCase();

    if (
      (currentBg && currentBg !== '#FFFFFF' && currentBg !== '#FFF' && !currentBg.includes('255,255,255')) ||
      currentTitle === '#F8FAFC' || currentTitle === '#FFFFFF' || currentTitle === '#FFF' ||
      currentText === '#C7CDD6' || currentText === '#FFFFFF'
    ) {
      migrated.styles.backgroundColor = '#FFFFFF';
      migrated.styles.titleColor = variantOverrides.titleColor || template?.styles?.titleColor || '#111827';
      migrated.styles.textColor = variantOverrides.textColor || template?.styles?.textColor || '#4B5563';
      migrated.styles.subtitleColor = variantOverrides.subtitleColor || template?.styles?.subtitleColor || '#3b82f6';
      migrated.styles.cardBackgroundColor = variantOverrides.cardBackgroundColor || template?.styles?.cardBackgroundColor || '#F9FAFB';
      migrated.styles.cardBorderColor = variantOverrides.cardBorderColor || template?.styles?.cardBorderColor || '#E5E7EB';
    }
  }

  if (migrated.styles && !migrated.styles.background && variantOverrides.background) {
    const _isLight = migrated.styles.themeMode === 'light';
    const _overlayColor = migrated.styles.overlayColor
      || (_isLight
        ? (activeGlobalTheme?.light?.overlay?.color || '#FFFFFF')
        : (activeGlobalTheme?.overlay?.color || PRESET_THEMES[0].elements.overlay.color));
    const _overlayOpacity = parseFloat(migrated.styles.overlayOpacityValue || '0.92');
    const _overlayBlend = migrated.styles.overlayBlendMode || activeGlobalTheme?.overlay?.blend || 'normal';
    const baseBg = { ...variantOverrides.background };
    baseBg.overlay = { enabled: true, color: _overlayColor, opacity: _overlayOpacity, blendMode: _overlayBlend as any };
    if (baseBg.type === 'image' && baseBg.image) {
      baseBg.image = { ...baseBg.image, overlay: { ...baseBg.overlay } };
    }
    migrated.styles.background = baseBg;
  }

  if (!migrated.variantStyles) {
    return {
      ...migrated,
      variantStyles: {
        [currentVariant]: { ...migrated.styles } as any,
      },
    };
  }
  return migrated;
}
