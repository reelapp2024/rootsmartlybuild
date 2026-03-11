/**
 * SectionsAndVariantRegistry.tsx
 * * Single source of truth for all GenieBuild sections and their variants
 * * SIMPLE FORMAT:
 * - Array of section objects
 * - Each section has: sectionType and variants array
 * - Variant filename = Component name = uniqueId (all same)
 * * To add a new variant:
 * 1. Create the component file (e.g., HeroFullWidth.tsx)
 * 2. Add variant name to the variants array below
 * 3. Update the section router to import and add case
 * 4. That's it! Backend will auto-scan filesystem and sync
 */

export interface SectionConfig {
  sectionType: string;
  variants: string[]; // Array of variant filenames (without .tsx)
  defaultVariant?: string; // Optional default variant
}

/**
 * SIMPLE REGISTRY FORMAT:
 * Array of sections, each with array of variants
 * Example: [{ sectionType: 'hero', variants: ['HeroCenter', 'HeroSplitLeft'] }]
 */
export const SECTIONS_REGISTRY: SectionConfig[] = [
  {
    sectionType: 'hero',
    variants: ['HeroCenter', 'HeroSplitLeft', 'HeroSplitRight', 'HeroGradient', 'HeroGeometric', 'HeroMulticolor', 'HeroMulticolorV1'],
    defaultVariant: 'HeroCenter'
  },
  {
    sectionType: 'features',
    variants: ['FeaturesGrid', 'FeaturesList', 'FeaturesCards'],
    defaultVariant: 'FeaturesGrid'
  },
  {
    sectionType: 'navbar',
    variants: ['NavbarSimple', 'NavbarCentered', 'NavbarMinimal', 'NavbarApi'],
    defaultVariant: 'NavbarSimple'
  },
  {
    sectionType: 'cta',
    variants: ['CTACenter', 'CTASplit', 'CTAMulticolor'],
    defaultVariant: 'CTACenter'
  },
  {
    sectionType: 'footer',
    variants: ['FooterColumns', 'FooterCentered', 'FooterMinimal', 'FooterApi'],
    defaultVariant: 'FooterColumns'
  },
  {
    sectionType: 'pricing',
    variants: ['PricingCards', 'PricingMinimal'],
    defaultVariant: 'PricingCards'
  },
  {
    sectionType: 'testimonials',
    variants: ['TestimonialsGrid', 'TestimonialsCentered', 'TestimonialsColumns', 'TestimonialsMulticolor'],
    defaultVariant: 'TestimonialsGrid'
  },
  {
    sectionType: 'faq',
    variants: ['FAQCentered', 'FAQSplit', 'FAQMulticolor'],
    defaultVariant: 'FAQCentered'
  },
 
  {
    sectionType: 'elements',
    variants: ['ElementsSection'],
    defaultVariant: 'ElementsSection'
  },
  {
    sectionType: 'image-banner',
    variants: ['BannerCenter', 'BannerSplit', 'BannerBottomLeft'],
    defaultVariant: 'BannerCenter'
  },
  {
    sectionType: 'allelementsTest',
    variants: ['AllElementsTest'],
    defaultVariant: 'AllElementsTest'
  }
];

/**
 * Convert array format to object format for easy lookup
 */
export const SECTIONS_REGISTRY_MAP: Record<string, SectionConfig> = 
  SECTIONS_REGISTRY.reduce((acc, section) => {
    acc[section.sectionType] = section;
    return acc;
  }, {} as Record<string, SectionConfig>);

/**
 * Get all variants for a section type
 */
export const getVariantsForSection = (sectionType: string): string[] => {
  return SECTIONS_REGISTRY_MAP[sectionType]?.variants || [];
};

/**
 * Get default variant for a section type
 */
export const getDefaultVariant = (sectionType: string): string => {
  const config = SECTIONS_REGISTRY_MAP[sectionType];
  return config?.defaultVariant || config?.variants[0] || '';
};

/**
 * Check if a variant exists for a section type
 */
export const isValidVariant = (sectionType: string, variant: string): boolean => {
  const variants = getVariantsForSection(sectionType);
  return variants.includes(variant);
};

/**
 * Get all section types
 */
export const getAllSectionTypes = (): string[] => {
  return SECTIONS_REGISTRY.map(s => s.sectionType);
};