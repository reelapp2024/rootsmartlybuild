/**
 * UNIFIED DEFAULTS - SINGLE SOURCE OF TRUTH
 * 
 * This file re-exports from unifiedDefaults.ts to ensure
 * all parts of the builder use the same source of truth.
 * 
 * IMPORTANT: All defaults are in packages/ui/src/constants/unifiedDefaults.ts
 */

import { 
  getDefaultStyle as getUnifiedDefaultStyle, 
  getDefaultProps as getUnifiedDefaultProps, 
  getPropertyDefault,
  getPropertyDefaults,
  getElementDefaults as getUnifiedElementDefaults,
} from '@ui/constants/unifiedDefaults';

/**
 * Get default props for an element type
 * Used by: ElementPropertyGroup definitions
 */
export function getDefaultProps(elementType: string): Record<string, any> {
  return getUnifiedDefaultProps(elementType);
}

/**
 * Get default styles for an element type
 * Used by: ElementPropertyGroup definitions (for style defaults)
 */
export function getDefaultStyles(elementType: string): React.CSSProperties {
  return getUnifiedDefaultStyle(elementType);
}

/**
 * Get a specific default prop value for an element type
 * Used by: ElementProperty defaultValue assignments
 */
export function getDefaultPropValue(elementType: string, propKey: string): any {
  // First try propertyDefaults (sidebar UI defaults)
  const propertyDefault = getPropertyDefault(elementType, propKey);
  if (propertyDefault !== undefined) {
    return propertyDefault;
  }
  
  // Fallback to defaultProps
  const defaults = getUnifiedDefaultProps(elementType);
  return defaults[propKey] || defaults[propKey.toLowerCase()] || undefined;
}

/**
 * Get property default value for sidebar UI
 * This is the main function to use in property definitions
 */
export function getPropertyDefaultValue(elementType: string, propertyKey: string): any {
  return getPropertyDefault(elementType, propertyKey);
}

/**
 * Get all defaults (props + styles) for an element type
 */
export function getElementDefaults(elementType: string): {
  defaultProps: Record<string, any>;
  defaultStyle: React.CSSProperties;
} {
  return getUnifiedElementDefaults(elementType);
}
