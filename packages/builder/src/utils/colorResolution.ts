/**
 * Color Resolution Utility
 * Centralized logic for resolving theme vs custom colors
 */

export type ColorSource = 'default' | 'custom';

export interface ColorResolution {
  value: string;
  source: ColorSource;
  displayValue: string; // The actual CSS value to use
  themeVariable?: string; // Theme variable if source is 'theme'
}

/**
 * Get default color from CSS variables (like useDefaultSize does)
 */
function getDefaultColorFromCSS(colorType: 'text' | 'background', elementType?: string): string {
  if (typeof window === 'undefined') {
    // Fallback for SSR
    if (colorType === 'text') {
      if (elementType === 'heading') return 'var(--color-heading, #0f172a)';
      if (elementType === 'button') return 'var(--color-primary-text, #ffffff)';
      return 'var(--color-text, #000000)';
    }
    // Background
    if (elementType === 'button') return 'var(--color-primary-bg, #3b82f6)';
    return 'var(--color-surface, #ffffff)';
  }

  const websiteContent = document.querySelector('[data-website-content="true"]');
  const root = document.documentElement;
  
  let cssVarName = '';
  if (colorType === 'text') {
    if (elementType === 'heading') {
      cssVarName = '--color-heading';
    } else if (elementType === 'button') {
      cssVarName = '--color-primary-text';
    } else {
      cssVarName = '--color-text';
    }
  } else {
    // Background
    if (elementType === 'button') {
      cssVarName = '--color-primary-bg';
    } else {
      cssVarName = '--color-surface';
    }
  }
  
  let color = '';
  if (websiteContent) {
    color = getComputedStyle(websiteContent).getPropertyValue(cssVarName).trim();
  }
  if (!color) {
    color = getComputedStyle(root).getPropertyValue(cssVarName).trim();
  }
  
  // Return CSS variable if found, otherwise return with fallback
  if (color) {
    return `var(${cssVarName}, ${color})`;
  }
  
  // Fallback values
  if (colorType === 'text') {
    if (elementType === 'heading') return 'var(--color-heading, #0f172a)';
    if (elementType === 'button') return 'var(--color-primary-text, #ffffff)';
    return 'var(--color-text, #000000)';
  }
  // Background
  if (elementType === 'button') return 'var(--color-primary-bg, #3b82f6)';
  return 'var(--color-surface, #ffffff)';
}

/**
 * Resolve color value and source
 * Handles backward compatibility with existing data
 */
export function resolveColor(
  colorValue: string | undefined,
  colorSource: ColorSource | undefined,
  defaultThemeVariable: string,
  defaultCustomColor: string = '#000000',
  colorType?: 'text' | 'background',
  elementType?: string
): ColorResolution {
  // Backward compatibility: infer source if not explicitly set
  if (colorSource === undefined) {
    if (!colorValue) {
      return {
        value: defaultCustomColor,
        source: 'custom',
        displayValue: defaultCustomColor,
      };
    }
    
    // Otherwise, it's a custom color
    return {
      value: colorValue,
      source: 'custom',
      displayValue: colorValue,
    };
  }
  
  // Explicit source provided
  if (colorSource === 'default') {
    // Get theme color from CSS variables (like useDefaultSize does)
    const themeColor = colorType && elementType 
      ? getDefaultColorFromCSS(colorType, elementType)
      : 'inherit';
    
    return {
      value: colorValue || defaultCustomColor, // Preserve custom color even when using default
      source: 'default',
      displayValue: themeColor, // Use theme color from CSS variables
      themeVariable: undefined,
    };
  }
  
  // Custom source
  return {
    value: colorValue || defaultCustomColor,
    source: 'custom',
    displayValue: colorValue || defaultCustomColor,
  };
}

/**
 * Get color source field name for a color property
 */
export function getColorSourceFieldName(colorProperty: string): string {
  return `${colorProperty}Source`;
}

/**
 * Get default theme variable for a color type
 */
export function getDefaultThemeVariable(
  colorType: 'text' | 'background',
  elementType?: string
): string {
  if (colorType === 'text') {
    if (elementType === 'heading') {
      return 'var(--color-heading)';
    }
    if (elementType === 'button') {
      return 'var(--color-primary-text)';
    }
    return 'var(--color-text)';
  }
  
  // Background
  if (elementType === 'button') {
    return 'var(--color-primary)';
  }
  return 'var(--color-surface)';
}

/**
 * Check if a color value is a CSS variable
 */
export function isThemeColor(colorValue: string | undefined): boolean {
  return colorValue !== undefined && colorValue.startsWith('var(');
}
