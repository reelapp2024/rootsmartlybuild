import React from 'react';
import { UNIFIED_DEFAULTS } from './unifiedDefaults';

/**
 * Section structures - shared across all components
 * LEGACY: This file now re-exports from unifiedDefaults.ts for backward compatibility
 * All new code should use unifiedDefaults.ts directly
 */
export const DEFAULT_SECTION_STRUCTURES: Record<string, {
  defaultStyle: React.CSSProperties;
  defaultProps?: any;
}> = {
  layout: {
    defaultStyle: UNIFIED_DEFAULTS.section.defaultStyle,
    defaultProps: UNIFIED_DEFAULTS.section.defaultProps,
  },
};

/**
 * Get section defaults by component type
 * Falls back to 'layout' if component type not found
 * LEGACY: Use getDefaultStyle('section') from unifiedDefaults.ts instead
 */
export function getSectionDefaults(componentType: string = 'layout'): {
  defaultStyle: React.CSSProperties;
  defaultProps: any;
} {
  return DEFAULT_SECTION_STRUCTURES[componentType] || DEFAULT_SECTION_STRUCTURES.layout;
}
