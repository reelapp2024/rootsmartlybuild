/**
 * Section registry — derived from filesystem via sectionDiscovery (import.meta.glob).
 * Add a variant by creating sections/{sectionType}/{VariantName}.tsx only.
 *
 * Variant lists are filtered at call time by active project type
 * (Funky = content websites only).
 */

import {
  DISCOVERED_SECTION_TYPES,
  getDiscoveredVariants,
  getDefaultVariantForSection,
  isDiscoveredVariant,
  setActiveProjectType,
  getActiveProjectType,
  isContentWebsiteProject,
} from './sections/sectionDiscovery';

export {
  setActiveProjectType,
  getActiveProjectType,
  isContentWebsiteProject,
};

export interface SectionConfig {
  sectionType: string;
  variants: string[];
  defaultVariant?: string;
}

/** Snapshot at module load. Prefer getVariantsForSection for live project-type filtering. */
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
  return getDiscoveredVariants(sectionType).map((e) => e.variantFile);
};

export const getDefaultVariant = (sectionType: string): string => {
  const v = getDefaultVariantForSection(sectionType);
  if (v) return v;
  return getVariantsForSection(sectionType)[0] || '';
};

export const isValidVariant = (sectionType: string, variant: string): boolean => {
  return isDiscoveredVariant(sectionType, variant);
};

export const getAllSectionTypes = (): string[] => {
  return [...DISCOVERED_SECTION_TYPES];
};
