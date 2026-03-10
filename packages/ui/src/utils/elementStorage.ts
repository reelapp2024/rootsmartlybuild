import type React from 'react';
import { getElementDefaults as getUnifiedDefaults, getDefaultStyle, getDefaultProps } from '../constants/unifiedDefaults';

/**
 * Compare two objects and return only the differences
 * Used to save only changed values to database
 */
export function getChangedValues(
  current: Record<string, any>,
  defaults: Record<string, any>
): Record<string, any> {
  const changed: Record<string, any> = {};
  
  // Check all current values
  Object.keys(current).forEach(key => {
    const currentValue = current[key];
    const defaultValue = defaults[key];
    
    // Only save if value is different from default
    // Handle undefined/null cases
    if (currentValue !== undefined && currentValue !== null) {
      if (defaultValue === undefined || defaultValue === null) {
        // Current has value but default doesn't - save it
        changed[key] = currentValue;
      } else if (JSON.stringify(currentValue) !== JSON.stringify(defaultValue)) {
        // Values are different - save the changed value
        changed[key] = currentValue;
      }
    }
  });
  
  return changed;
}

/**
 * Get element defaults from UNIFIED_DEFAULTS (single source of truth)
 */
export function getElementDefaults(elementType: string): {
  defaultStyle: Record<string, any>;
  defaultProps: Record<string, any>;
} {
  return {
    defaultStyle: getDefaultStyle(elementType),
    defaultProps: getDefaultProps(elementType),
  };
}

/**
 * Merge defaults with DB values (DB values override defaults)
 * Used when loading from database
 */
export function mergeWithDefaults(
  dbValues: Record<string, any> | undefined,
  defaults: Record<string, any>
): Record<string, any> {
  if (!dbValues || Object.keys(dbValues).length === 0) {
    return defaults;
  }
  
  // Start with defaults, then override with DB values
  return {
    ...defaults,
    ...dbValues
  };
}

/**
 * Check if a value is different from default
 */
export function isValueChanged(
  value: any,
  defaultValue: any
): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  
  if (defaultValue === undefined || defaultValue === null) {
    return true; // Value exists but default doesn't
  }
  
  return JSON.stringify(value) !== JSON.stringify(defaultValue);
}

/**
 * Prepare element data for database storage
 * Only includes changed values (not defaults)
 * CRITICAL: Typography-related properties are ALWAYS saved if they exist
 */
export function prepareElementForStorage(
  elementId: string,
  elementType: string,
  currentStyles: Record<string, any>,
  currentProps: Record<string, any>
): {
  elementId: string;
  elementType: string;
  style: Record<string, any>;
  data: Record<string, any>;
} {
  const defaults = getElementDefaults(elementType);
  
  // Only save changed styles and props
  const changedStyles = getChangedValues(currentStyles, defaults.defaultStyle);
  const changedProps = getChangedValues(currentProps, defaults.defaultProps);
  
  // CRITICAL: Always save typography-related properties if they exist
  // These are needed for proper font size/family resolution
  // Save ALL typography properties that are set, regardless of defaults
  const typographyKeys = [
    'fontSize',
    'defaultFontSizeType',
    'fontFamily',
    'fontWeight',
    'fontStyle',
    'textTransform',
    'textDecoration',
    'lineHeight',
    'letterSpacing',
    'wordSpacing',
    'headingFontSize',
    'headingFontFamily',
    'headingFontWeight',
    'headingTextTransform',
    'headingTextDecoration',
    'headingLineHeight',
    'headingLetterSpacing',
    'useDefaultColor', // Keep for color toggle
  ];
  
  // Add typography properties from currentStyles if they exist (even if they match defaults)
  // This ensures user selections (like "text-base" vs custom size) are always saved
  typographyKeys.forEach(key => {
    if (currentStyles[key] !== undefined && currentStyles[key] !== null) {
      changedStyles[key] = currentStyles[key];
    }
  });
  
  // Also check for typography in meta (for text/heading elements)
  // CRITICAL: Save meta properties for font size type resolution
  if (currentStyles.meta && typeof currentStyles.meta === 'object') {
    if (currentStyles.meta.defaultFontSizeType !== undefined) {
      changedStyles.meta = changedStyles.meta || {};
      changedStyles.meta.defaultFontSizeType = currentStyles.meta.defaultFontSizeType;
    }
    // Note: useDefaultSize is deprecated, but keep for backward compatibility
    if (currentStyles.meta.useDefaultSize !== undefined) {
      changedStyles.meta = changedStyles.meta || {};
      changedStyles.meta.useDefaultSize = currentStyles.meta.useDefaultSize;
    }
  }
  
  // CRITICAL: If defaultFontSizeType is set at root level (not in meta), save it
  // This handles the case where TypographyControl sets it directly
  if (currentStyles.defaultFontSizeType !== undefined && currentStyles.defaultFontSizeType !== null) {
    changedStyles.defaultFontSizeType = currentStyles.defaultFontSizeType;
  }
  
  return {
    elementId,
    elementType,
    style: changedStyles,
    data: changedProps
  };
}

/**
 * Build hierarchical structure from flat elements array
 * Converts flat array with parentElId to nested children structure
 */
function buildHierarchicalStructure(
  customElements: Array<{ id: string; type: string; elId: string; order: number; parentElId?: string }>,
  customElementStyles: Record<string, Record<string, any>>,
  customElementProps: Record<string, Record<string, any>>
): Array<{
  elementId: string;
  elementType: string;
  style: Record<string, any>;
  data: Record<string, any>;
  order: number;
  children?: Array<any>;
}> {
  // Get all root elements (no parent)
  const rootElements = customElements
    .filter(el => !(el as any).parentElId)
    .sort((a, b) => a.order - b.order);
  
  // Recursive function to build children
  const buildElementWithChildren = (element: { id: string; type: string; elId: string; order: number; parentElId?: string }): any => {
    const currentStyles = customElementStyles[element.elId] || {};
    const currentProps = customElementProps[element.elId] || {};
    
    const prepared = prepareElementForStorage(
      element.elId,
      element.type,
      currentStyles,
      currentProps
    );
    
    // Find children of this element
    const children = customElements
      .filter(el => (el as any).parentElId === element.elId)
      .sort((a, b) => a.order - b.order)
      .map(child => buildElementWithChildren(child));
    
    const result: any = {
      ...prepared,
      elementType: element.type || 'text', // Ensure elementType is always present
      order: element.order || 0
    };
    
    // Only add children array if there are children
    if (children.length > 0) {
      result.children = children;
    }
    
    // Double-check: ensure elementType is present (required by backend)
    if (!result.elementType) {
      console.warn(`[prepareElementsForStorage] Missing elementType for elementId: ${element.elId}, using 'text' as fallback`);
      result.elementType = 'text';
    }
    
    return result;
  };
  
  // Build hierarchical structure starting from root elements
  return rootElements.map(element => buildElementWithChildren(element));
}

/**
 * Prepare all elements for database storage (hierarchical structure)
 */
export function prepareElementsForStorage(
  customElements: Array<{ id: string; type: string; elId: string; order: number; parentElId?: string | undefined }>,
  customElementStyles: Record<string, Record<string, any>>,
  customElementProps: Record<string, Record<string, any>>
): Array<{
  elementId: string;
  elementType: string;
  style: Record<string, any>;
  data: Record<string, any>;
  order: number;
  children?: Array<any>;
}> {
  return buildHierarchicalStructure(customElements, customElementStyles, customElementProps);
}

/**
 * Flatten hierarchical element tree back to flat builder format
 * Converts hierarchical structure (with children) → flat arrays (customElements, customElementStyles, customElementProps)
 * Used when loading pages from database into the builder
 */
/**
 * Create a new element by type using defaults from DEFAULT_ELEMENT_STRUCTURES
 * Returns a hierarchical element node ready for insertion
 */
export function createElementByType(elementType: string): {
  elementId: string;
  elementType: string;
  style: Record<string, any>;
  data: Record<string, any>;
  order: number;
  children: any[];
} {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const elementId = `${elementType}-${timestamp}-${randomId}`;
  
  // Get defaults from single source of truth
  const defaults = getElementDefaults(elementType);
  
  // Create element with hierarchical structure
  return {
    elementId,
    elementType,
    style: { ...defaults.defaultStyle },
    data: { ...defaults.defaultProps },
    order: 0, // Will be updated by store action
    children: []
  };
}

/**
 * Create an empty section with a root container element
 * Enforces the invariant: Every section MUST have exactly ONE root container
 */
export function createEmptySectionWithRootContainer(): {
  section: {
    id: string;
    customId: string;
    componentType: string;
    customElements: Array<{
      id: string;
      type: string;
      elId: string;
      order: number;
      parentElId?: undefined;
    }>;
    customElementProps: Record<string, any>;
    customElementStyles: Record<string, React.CSSProperties>;
    rows: any[];
    styles: any;
  };
} {
  const timestamp = Date.now();
  const sectionId = `section-${timestamp}`;
  const containerElId = `container-${timestamp}`;
  
  // Get container defaults from single source of truth
  const containerDefaults = getElementDefaults('container');
  
  // Create root container element
  const rootContainer = {
    id: `custom-el-${timestamp}`,
    type: 'container',
    elId: containerElId,
    order: 0,
    parentElId: undefined, // Root level - no parent
  };
  
  return {
    section: {
      id: sectionId,
      customId: `section-layout-${timestamp}`,
      componentType: 'layout', // Use 'layout' for element-only sections
      customElements: [rootContainer], // Always start with root container
      customElementProps: {
        [containerElId]: containerDefaults.defaultProps || {},
      },
      customElementStyles: {
        [containerElId]: containerDefaults.defaultStyle || {},
      },
      rows: [], // Empty rows - we use customElements instead
      styles: {
        // Get section defaults from unified defaults (single source of truth)
        ...getDefaultStyle('section'),
      },
    },
  };
}

export function flattenElementsForBuilder(
  hierarchicalElements: Array<{
    elementId: string;
    elementType: string;
    style?: Record<string, any>;
    data?: Record<string, any>;
    order?: number;
    children?: Array<any>;
  }>
): {
  customElements: Array<{ id: string; type: string; elId: string; order: number; parentElId?: string }>;
  customElementStyles: Record<string, Record<string, any>>;
  customElementProps: Record<string, Record<string, any>>;
} {
  const customElements: Array<{ id: string; type: string; elId: string; order: number; parentElId?: string }> = [];
  const customElementStyles: Record<string, Record<string, any>> = {};
  const customElementProps: Record<string, Record<string, any>> = {};

  // Recursive function to flatten elements
  const flattenElement = (
    element: {
      elementId: string;
      elementType: string;
      style?: Record<string, any>;
      data?: Record<string, any>;
      order?: number;
      children?: Array<any>;
    },
    parentElId?: string,
    index: number = 0
  ) => {
    const elId = element.elementId;
    const elementType = element.elementType || 'text';
    const order = element.order !== undefined ? element.order : index;

    // Add to flat customElements array
    customElements.push({
      id: `custom-el-${elId}-${index}`,
      type: elementType,
      elId: elId,
      order: order,
      parentElId: parentElId,
    });

    // Store styles (merge with defaults if needed)
    if (element.style && Object.keys(element.style).length > 0) {
      customElementStyles[elId] = { ...element.style };
    } else {
      customElementStyles[elId] = {};
    }

    // Store props/data
    if (element.data && Object.keys(element.data).length > 0) {
      customElementProps[elId] = { ...element.data };
    } else {
      customElementProps[elId] = {};
    }

    // Recursively process children
    if (element.children && Array.isArray(element.children) && element.children.length > 0) {
      element.children.forEach((child, childIndex) => {
        flattenElement(child, elId, childIndex);
      });
    }
  };

  // Process all root elements
  hierarchicalElements.forEach((element, index) => {
    flattenElement(element, undefined, index);
  });

  return {
    customElements,
    customElementStyles,
    customElementProps,
  };
}