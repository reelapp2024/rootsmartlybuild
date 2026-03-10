import type { Section } from "../types/builder";
import { prepareElementsForStorage, getChangedValues } from "@ui/utils/elementStorage";
import { getDefaultStyle } from "@ui/constants/unifiedDefaults";

/**
 * Get default section styles (component-specific)
 * Component-specific default styles for sections
 * Falls back to layout defaults from constants
 */
function getDefaultSectionStyles(componentType: string): Record<string, any> {
  // Get base defaults from unified defaults (single source of truth)
  const baseDefaults = getDefaultStyle('section');
  
  // Component-specific overrides
  const componentOverrides: Record<string, Record<string, any>> = {
    'HeroSection': {
      padding: '80px 40px',
      minHeight: '500px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    'herosectionvarianta': {
      padding: '80px 40px',
      minHeight: '500px',
    },
    // Add more component defaults as needed
  };
  
  // Merge base defaults with component-specific overrides
  const componentOverride = componentOverrides[componentType] || {};
  return {
    ...baseDefaults,
    ...componentOverride,
  };
}

/**
 * Prepare section for database storage
 * Only saves changed values (not defaults)
 */
export function prepareSectionForStorage(section: Section): {
  componentId?: string;
  variant?: string;
  style: Record<string, any>; // Only changed section styles
  elementIds: Array<{
    elementId: string;
    elementType: string;
    style: Record<string, any>; // Only changed element styles
    data: Record<string, any>; // Only changed element props
    order: number;
  }>;
} {
  // Get section-level styles (only changed values)
  // Section styles can be in section.styles or customElementStyles.section
  // section.styles contains the full merged styles (from API + customElementStyles overrides)
  // customElementStyles.section contains only the overrides made in builder
  const defaultSectionStyles = getDefaultSectionStyles(section.componentType || '');
  
  // Use section.styles as the source of truth (it's already merged)
  // If section.styles exists and has values, use it; otherwise fall back to customElementStyles
  const sectionStyles = (section.styles && Object.keys(section.styles).length > 0)
    ? section.styles
    : {
        ...(section.customElementStyles?.section || {}),
        ...defaultSectionStyles, // Include defaults if no styles exist
      };
  
  // Only save changed values (compared to defaults)
  const changedSectionStyles = getChangedValues(sectionStyles, defaultSectionStyles);
  
  // CRITICAL: Always save overlay-related properties if they exist (similar to typography)
  // These are needed for proper overlay rendering
  const overlayKeys = [
    'overlayColor',
    'overlayOpacity',
  ];
  
  // Add overlay properties from sectionStyles if they exist (even if they match defaults)
  // This ensures user selections are always saved
  overlayKeys.forEach(key => {
    if (sectionStyles[key] !== undefined && sectionStyles[key] !== null) {
      changedSectionStyles[key] = sectionStyles[key];
    }
  });
  
  // Prepare elements for storage (only changed values)
  const customElements = section.customElements || [];
  const customElementStyles = section.customElementStyles || {};
  const customElementProps = section.customElementProps || {};
  
  const elementIds = prepareElementsForStorage(
    customElements,
    customElementStyles,
    customElementProps
  );
  
  return {
    componentId: section.customId ? undefined : undefined, // Will be set by caller
    variant: 'A', // Default variant, can be changed
    style: changedSectionStyles, // Only changed section styles
    elementIds: elementIds // Only changed element styles and props
  };
}

/**
 * Prepare all sections for database storage
 */
export function prepareSectionsForStorage(sections: Section[]): Array<{
  sectionId: string;
  componentType: string;
  componentId?: string;
  variant?: string;
  style: Record<string, any>;
  elementIds: Array<{
    elementId: string;
    elementType: string;
    style: Record<string, any>;
    data: Record<string, any>;
    order: number;
  }>;
}> {
  return sections
    .filter(section => section.componentType) // Only custom components
    .map(section => ({
      ...prepareSectionForStorage(section),
      sectionId: section.id, // Include sectionId for matching
      componentType: section.componentType || '', // Include componentType
    }));
}

