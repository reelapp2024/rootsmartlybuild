/**
 * Section registry — derived from filesystem via sectionDiscovery (import.meta.glob).
 * Add a variant by creating sections/{sectionType}/{VariantName}.tsx only.
 */

import {
  DISCOVERED_SECTION_TYPES,
  getDiscoveredVariants,
  getDefaultVariantForSection,
  isDiscoveredVariant,
} from './sections/sectionDiscovery';

export interface SectionConfig {
  sectionType: string;
  variants: string[];
  defaultVariant?: string;
}

export const SECTIONS_REGISTRY: SectionConfig[] = DISCOVERED_SECTION_TYPES.map((sectionType) => ({
  sectionType,
  variants: getDiscoveredVariants(sectionType).map((e) => e.variantFile),
  defaultVariant: getDefaultVariantForSection(sectionType),
}));

export const SECTIONS_REGISTRY_MAP: Record<string, SectionConfig> = SECTIONS_REGISTRY.reduce(
  (acc, section) => {
    acc[section.sectionType] = section;
    return acc;
  },
  {} as Record<string, SectionConfig>
);

export const getVariantsForSection = (sectionType: string): string[] => {
  return SECTIONS_REGISTRY_MAP[sectionType]?.variants || [];
};

export const getDefaultVariant = (sectionType: string): string => {
  const v = getDefaultVariantForSection(sectionType);
  if (v) return v;
  return SECTIONS_REGISTRY_MAP[sectionType]?.variants[0] || '';
};

export const isValidVariant = (sectionType: string, variant: string): boolean => {
  return isDiscoveredVariant(sectionType, variant);
};

export const getAllSectionTypes = (): string[] => {
  return [...DISCOVERED_SECTION_TYPES];
};
