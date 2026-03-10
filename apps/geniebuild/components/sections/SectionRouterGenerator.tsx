/**
 * SectionRouterGenerator.tsx
 * 
 * Helper utility to generate section router switch statements from registry
 * This makes it easy to add new variants - just update the registry!
 */

import { SECTIONS_REGISTRY, getDefaultVariant } from '../SectionsAndVariantRegistry';

/**
 * Generates a switch statement case for a section router
 * Usage: Use this in your section router files to auto-generate cases
 */
export const generateSectionRouterCases = (sectionType: string, variantComponents: Record<string, React.ComponentType<any>>) => {
  const variants = SECTIONS_REGISTRY[sectionType]?.variants || [];
  const defaultVariant = getDefaultVariant(sectionType);

  return variants.map(variant => {
    const Component = variantComponents[variant];
    if (!Component) {
      console.warn(`[SectionRouterGenerator] Component ${variant} not found for section ${sectionType}`);
      return null;
    }
    return {
      variant,
      component: Component,
      isDefault: variant === defaultVariant
    };
  }).filter(Boolean);
};
