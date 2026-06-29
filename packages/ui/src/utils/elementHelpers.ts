import React from 'react';
import { DEFAULT_ELEMENT_STRUCTURES } from '../constants/elementStructures';
import { themes } from '../themes/themePresets';
import { normalizeStyles } from './styleNormalization';

/**
 * Check if a color matches any theme color (heading, description, button, etc.)
 * This helps us detect when an element has a theme color stored and should use CSS variables instead
 */
export function isThemeColor(color: string | undefined, colorType: 'heading' | 'description' | 'button-bg' | 'button-text' | 'accent' | 'surface' = 'button-bg'): boolean {
  if (!color || color.startsWith('var(') || color.startsWith('rgb') || color.startsWith('rgba')) {
    return false;
  }
  
  // Normalize color (remove spaces, convert to uppercase)
  const normalizedColor = color.trim().toUpperCase();
  
  // Check all themes
  for (const themeName in themes) {
    const theme = themes[themeName];
    if (!theme) continue;
    
    let themeColor: string | undefined;
    switch (colorType) {
      case 'heading':
        themeColor = theme.heading;
        break;
      case 'description':
        themeColor = theme.description;
        break;
      case 'button-bg':
        themeColor = theme.primaryButton?.bg;
        break;
      case 'button-text':
        themeColor = theme.primaryButton?.text;
        break;
      case 'accent':
        themeColor = theme.accent;
        break;
      case 'surface':
        themeColor = theme.surface;
        break;
    }
    
    if (themeColor && normalizedColor === themeColor.trim().toUpperCase()) {
      return true;
    }
  }
  
  return false;
}

/**
 * Replace theme colors in styles with CSS variables
 * This ensures elements update when themes change
 * Also ensures elements without colors get theme colors by default
 */
export function replaceThemeColorsWithCSSVars(styles: React.CSSProperties, elementType: string): React.CSSProperties {
  const processedStyles = { ...styles };
  
  // Helper to check if color is empty/transparent/invalid
  const isEmptyColor = (color: string | undefined): boolean => {
    if (!color) return true;
    const normalized = color.trim().toLowerCase();
    return normalized === '' || 
           normalized === 'transparent' || 
           normalized === 'rgba(0,0,0,0)' || 
           normalized === 'rgba(0, 0, 0, 0)' ||
           normalized.startsWith('rgba(0,0,0,0)') ||
           normalized.startsWith('rgba(0, 0, 0, 0)');
  };
  
  // Process color property - respect useDefaultColor flag
  // Check if useDefaultColor is set (defaults to true if not set)
  const useDefaultColor = (processedStyles as any).useDefaultColor !== undefined 
    ? (processedStyles as any).useDefaultColor 
    : true;
  
  // CRITICAL: When useDefaultColor is false, prioritize textColor (custom color from DB) over color
  // textColor is the field name we save in the database, so it contains the user's custom color
  // IMPORTANT: Keep textColor in styles so EditableHeading/EditableText can read it directly
  if (!useDefaultColor && (processedStyles as any).textColor) {
    // If useDefaultColor is false and textColor exists, use it as the custom color
    const textColorValue = String((processedStyles as any).textColor);
    // Only use textColor if it's a valid custom color (not transparent, not CSS variable, not empty)
    if (textColorValue && 
        textColorValue !== 'transparent' && 
        textColorValue.trim() !== '' &&
        !textColorValue.startsWith('var(') &&
        !isEmptyColor(textColorValue)) {
      // Set color to the custom textColor value, but keep textColor in styles for direct access
      processedStyles.color = textColorValue;
      // DON'T delete textColor - EditableHeading/EditableText need to read it
    }
  } else if ((processedStyles as any).textColor && !processedStyles.color) {
    // If useDefaultColor is true or textColor exists but color doesn't, map textColor to color
    processedStyles.color = (processedStyles as any).textColor;
    // Keep textColor in styles for direct access
  }
  
  const currentColor = processedStyles.color ? String(processedStyles.color) : undefined;
  
  // Only replace with theme color if useDefaultColor is true OR color is empty/transparent
  // If useDefaultColor is false and we have a valid custom color, keep it as-is
  if (useDefaultColor) {
    // When useDefaultColor is true, always use theme color
    if (isEmptyColor(currentColor) || !currentColor || !currentColor.startsWith('var(')) {
      // If no color or transparent, use theme color based on element type
      if (elementType === 'heading') {
        processedStyles.color = 'var(--color-heading, #0f172a)';
      } else if (elementType === 'text') {
        processedStyles.color = 'var(--color-description, #64748b)';
      } else if (elementType === 'button' && !currentColor?.startsWith('var(')) {
        // For buttons, check if it's a theme color
        if (currentColor && isThemeColor(currentColor, 'button-text')) {
          processedStyles.color = 'var(--color-primary-text, #ffffff)';
        } else if (isEmptyColor(currentColor)) {
          processedStyles.color = 'var(--color-primary-text, #ffffff)';
        }
      } else if (currentColor && !currentColor.startsWith('var(')) {
        // Check if it's a theme color for other elements
        if (isThemeColor(currentColor, 'heading')) {
          processedStyles.color = 'var(--color-heading, #0f172a)';
        } else if (isThemeColor(currentColor, 'description')) {
          processedStyles.color = 'var(--color-description, #64748b)';
        } else if (isThemeColor(currentColor, 'button-text')) {
          processedStyles.color = 'var(--color-primary-text, #ffffff)';
        }
      }
    }
  } else {
    // When useDefaultColor is false, preserve custom colors
    // Only replace if color is empty/transparent/invalid
    if (isEmptyColor(currentColor) || !currentColor) {
      // Only use theme color as fallback if no custom color is set
      if (elementType === 'heading') {
        processedStyles.color = 'var(--color-heading, #0f172a)';
      } else if (elementType === 'text') {
        processedStyles.color = 'var(--color-description, #64748b)';
      }
    } else if (currentColor.startsWith('var(')) {
      // If color is a CSS variable but useDefaultColor is false, we need to get the actual custom color
      // This shouldn't happen if textColor was properly mapped above, but handle it just in case
      // Keep the CSS variable as fallback (this case shouldn't occur in normal flow)
    }
    // If we have a valid custom color (not CSS variable, not transparent), keep it as-is
  }
  
  // Process backgroundColor property - ALWAYS ensure theme colors are used for buttons
  const currentBg = processedStyles.backgroundColor ? String(processedStyles.backgroundColor) : undefined;
  if (elementType === 'button') {
    // Buttons should ALWAYS have a background color from theme
    if (isEmptyColor(currentBg) || !currentBg || !currentBg.startsWith('var(')) {
      if (currentBg && isThemeColor(currentBg, 'button-bg')) {
        processedStyles.backgroundColor = 'var(--color-primary-bg, #2563eb)';
      } else if (isEmptyColor(currentBg) || !currentBg) {
        processedStyles.backgroundColor = 'var(--color-primary-bg, #2563eb)';
      }
    }
  } else if (elementType === 'container' || elementType === 'row' || elementType === 'column') {
    // Containers should use surface color if not set or if it's a theme surface color
    // Use dark background like multicolor theme
    if (isEmptyColor(currentBg) || !currentBg || !currentBg.startsWith('var(')) {
      if (currentBg && isThemeColor(currentBg, 'surface')) {
        processedStyles.backgroundColor = 'var(--color-surface, #0E1214)';
      } else if (isEmptyColor(currentBg) || !currentBg) {
        processedStyles.backgroundColor = 'var(--color-surface, #0E1214)';
      }
    }
    // Also ensure text color is set for containers (light text on dark background)
    if (!processedStyles.color || isEmptyColor(String(processedStyles.color || ''))) {
      processedStyles.color = 'var(--color-heading, #F8FAFC)';
    }
  } else if (currentBg && !currentBg.startsWith('var(') && isThemeColor(currentBg, 'button-bg')) {
    // For any other element with button-bg color, use CSS variable
    processedStyles.backgroundColor = 'var(--color-primary-bg, #2563eb)';
  }
  
  // Process borderColor property
  if (processedStyles.borderColor) {
    const borderColor = String(processedStyles.borderColor);
    if (!borderColor.startsWith('var(') && isThemeColor(borderColor, 'button-bg')) {
      processedStyles.borderColor = 'var(--color-primary-bg, #2563eb)';
    }
  }
  
  return processedStyles;
}

/**
 * Maps custom property keys to standard CSS keys
 * Handles component-specific property mappings (e.g., headingFontSize -> fontSize)
 */
export function mapElementStyles(rawStyles: Record<string, any>): React.CSSProperties {
  const mappedStyles: React.CSSProperties = {};
  
  Object.keys(rawStyles).forEach((key) => {
    let cssKey = key;
    
    // Map heading-specific keys to standard CSS keys
    if (key === 'headingFontSize') cssKey = 'fontSize';
    else if (key === 'headingFontWeight') cssKey = 'fontWeight';
    else if (key === 'headingTextAlign') cssKey = 'textAlign';
    else if (key === 'headingLineHeight') cssKey = 'lineHeight';
    else if (key === 'headingLetterSpacing') cssKey = 'letterSpacing';
    else if (key === 'headingTextTransform') cssKey = 'textTransform';
    else if (key === 'headingTextDecoration') cssKey = 'textDecoration';
    else if (key === 'headingFontFamily') cssKey = 'fontFamily';
    else if (key === 'textColor') {
      // Map textColor to color, but also keep textColor in the styles
      // This allows EditableHeading/EditableText to read textColor directly
      cssKey = 'color';
      // Also preserve textColor in the mapped styles for direct access
      (mappedStyles as any).textColor = rawStyles[key];
    }
    
    // Keep other keys as-is
    (mappedStyles as any)[cssKey] = rawStyles[key];
  });
  
  return mappedStyles;
}

/**
 * Get element styles with fallback: DB styles -> default styles
 * Also replaces theme colors with CSS variables so elements update with theme changes
 */
export function getElementStyle(
  elId: string,
  elementType: string,
  getStyleFromStore?: (elId: string) => React.CSSProperties | undefined
): React.CSSProperties {
  // Try to get from store (DB) first
  const dbStyles = getStyleFromStore ? getStyleFromStore(elId) : undefined;
  
  let finalStyles: React.CSSProperties;
  
  // Get theme typography defaults (for fallback when element styles are undefined)
  // CRITICAL: Reads from global theme data (set by ThemeProvider), NEVER from CSS variables
  const getThemeTypography = (): React.CSSProperties => {
    if (typeof window !== 'undefined') {
      // Get theme data from global store (set by ThemeProvider)
      const themeData = (window as any).__THEME_DATA__;
      if (!themeData) {
        return {}; // No theme data = no typography defaults
      }
      
      // Element-specific typography mapping
      // Note: Font sizes for headings use browser defaults (h1-h6), not theme
      const typographyMap: Record<string, React.CSSProperties> = {
        heading: {
          fontFamily: themeData.defaultFont || undefined,
          // Heading font sizes use browser defaults (h1=3rem, h2=2.5rem, etc.)
          fontSize: undefined, // Let browser defaults handle it
          color: undefined, // Color resolved via CSS variables in replaceThemeColorsWithCSSVars
        },
        text: {
          fontFamily: themeData.defaultFont || undefined,
          fontSize: themeData.textSizes?.base || undefined,
          color: undefined, // Color resolved via CSS variables in replaceThemeColorsWithCSSVars
        },
        button: {
          fontFamily: themeData.defaultFont || undefined,
          fontSize: themeData.buttonFontSize || undefined,
          color: undefined, // Color resolved via CSS variables in replaceThemeColorsWithCSSVars
        },
      };
      
      // Return element-specific typography or fallback to text
      return typographyMap[elementType] || typographyMap.text;
    }
    
    // Fallback when window is undefined (SSR)
    return {};
  };

  if (dbStyles && Object.keys(dbStyles).length > 0) {
    // Map custom keys to CSS keys (e.g., headingFontFamily -> fontFamily)
    let mappedStyles: React.CSSProperties;
    if ((dbStyles as any).fontFamily) {
      // Already mapped, use as-is
      mappedStyles = dbStyles;
    } else {
      // Map custom keys to CSS keys
      mappedStyles = mapElementStyles(dbStyles);
    }
    
    // CRITICAL: Normalize builder-friendly keys to CSS keys (gridColumns, gridRows, width: "full", etc.)
    mappedStyles = normalizeStyles(mappedStyles);
    
    // CRITICAL TYPOGRAPHY MERGE: Merge theme typography when element styles are undefined
    const themeTypography = getThemeTypography();
    const typographyKeys = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'wordSpacing', 'textTransform', 'textDecoration', 'color'];
    
    // Build resolved styles: theme first, then element overrides
    const resolvedStyles: React.CSSProperties = {
      ...themeTypography,
      // Element overrides MUST win (but only if defined - undefined means use theme)
      ...Object.keys(mappedStyles).reduce((acc, key) => {
        const value = (mappedStyles as any)[key];
        // Only include if value is defined (not undefined, not null, not empty string for typography)
        if (typographyKeys.includes(key)) {
          // For typography keys, undefined/null means use theme, empty string also means use theme
          if (value !== undefined && value !== null && value !== '') {
            (acc as any)[key] = value;
          }
        } else {
          // For non-typography keys, include all defined values
          if (value !== undefined && value !== null) {
            (acc as any)[key] = value;
          }
        }
        return acc;
      }, {} as React.CSSProperties),
    };
    
    // CRITICAL: Remove conflicting properties based on display type
    // If display is grid, remove flex properties
    if (resolvedStyles.display === 'grid') {
      delete (resolvedStyles as any).flex;
      delete (resolvedStyles as any).flexWrap;
      delete (resolvedStyles as any).flexGrow;
      delete (resolvedStyles as any).flexShrink;
      delete (resolvedStyles as any).flexBasis;
      delete (resolvedStyles as any).alignContent;
    }
    
    // If display is flex, remove grid properties
    if (resolvedStyles.display === 'flex') {
      delete (resolvedStyles as any).gridGap;
      delete (resolvedStyles as any).gridAutoFlow;
      delete (resolvedStyles as any).gridAutoColumns;
      delete (resolvedStyles as any).gridAutoRows;
      delete (resolvedStyles as any).justifyItems;
    }
    
    // AUTO-MIGRATION: Convert 'block' or 'box' to 'flex' for containers
    // This ensures old pages with block/box containers continue to work
    if (elementType === 'container' && (resolvedStyles.display === 'block' || resolvedStyles.display === 'box' || resolvedStyles.display === undefined)) {
      resolvedStyles.display = 'flex';
    }
    
    // If display is block (for non-container elements), remove both flex and grid properties
    if (resolvedStyles.display === 'block' && elementType !== 'container') {
      delete (resolvedStyles as any).flex;
      delete (resolvedStyles as any).flexWrap;
      delete (resolvedStyles as any).flexGrow;
      delete (resolvedStyles as any).flexShrink;
      delete (resolvedStyles as any).flexBasis;
      delete (resolvedStyles as any).flexDirection;
      delete (resolvedStyles as any).alignContent;
      delete (resolvedStyles as any).justifyContent;
      delete (resolvedStyles as any).alignItems;
      delete (resolvedStyles as any).gap;
      delete (resolvedStyles as any).gridGap;
      delete (resolvedStyles as any).gridAutoFlow;
      delete (resolvedStyles as any).gridAutoColumns;
      delete (resolvedStyles as any).gridAutoRows;
      delete (resolvedStyles as any).justifyItems;
    }
    
    // Replace theme colors with CSS variables
    finalStyles = replaceThemeColorsWithCSSVars(resolvedStyles, elementType);
  } else {
    // Fallback to default styles from element structure
    const elementDefaults = DEFAULT_ELEMENT_STRUCTURES[elementType];
    const defaultStyles = elementDefaults?.defaultStyle || {};
    
    // Merge theme typography with defaults
    const themeTypography = getThemeTypography();
    const mergedDefaults: React.CSSProperties = {
      ...themeTypography,
      ...defaultStyles,
    };
    
    // Also process defaults to ensure CSS variables are used
    finalStyles = replaceThemeColorsWithCSSVars(mergedDefaults, elementType);
  }
  
  // Debug logging removed for performance
  
  return finalStyles;
}

/**
 * Get element props with fallback: DB props -> default props
 */
export function getElementProps(
  elId: string,
  elementType: string,
  getPropsFromStore?: (elId: string) => any,
  fallbackValues?: Record<string, any>
): any {
  // Try to get from store (DB) first
  const dbProps = getPropsFromStore ? getPropsFromStore(elId) : undefined;
  
  if (dbProps && Object.keys(dbProps).length > 0) {
    return dbProps;
  }
  
  // Fallback to default props from element structure
  const elementDefaults = DEFAULT_ELEMENT_STRUCTURES[elementType];
  const defaultProps = elementDefaults?.defaultProps || {};
  
  // Merge with fallback values if provided
  if (fallbackValues) {
    return { ...defaultProps, ...fallbackValues };
  }
  
  return defaultProps;
}

/**
 * Check if an element is selected
 */
export function isElementSelected(
  elId: string,
  nodeId: string | undefined,
  selectedEl?: { nodeId: string; elId: string } | null
): boolean {
  return !!(
    selectedEl &&
    selectedEl.nodeId === nodeId &&
    selectedEl.elId === elId
  );
}

