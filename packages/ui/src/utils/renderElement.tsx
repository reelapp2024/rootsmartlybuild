import React, { useEffect } from 'react';
import { DEFAULT_ELEMENT_STRUCTURES, getElementStructure } from '../constants/elementStructures';
import { RenderElementControls } from './renderElementControls';
import { getElementStyle, getElementProps, isElementSelected, isThemeColor } from './elementHelpers';
import { loadGoogleFont } from './fontLoader';
import { addResponsiveStyles, getResponsiveFontSize, getResponsivePadding, getResponsiveGap, getResponsiveGridColumns } from './responsiveStyles';
import { ContainerHoverOverlay, detectContainerType } from './containerHoverOverlay';

// Helper function to get default font from theme data (NOT CSS variables)
// CRITICAL: Typography is resolved inline per element, never via CSS variables
const getDefaultFontFromTheme = (): string => {
  if (typeof window === 'undefined') {
    return 'Inter, sans-serif';
  }
  
  // Get theme data from global store (set by ThemeProvider)
  const themeData = (window as any).__THEME_DATA__;
  return themeData?.defaultFont || 'Inter, sans-serif';
};

// CRITICAL: Canonical font size resolution functions
// These are the SINGLE SOURCE OF TRUTH for font size resolution

/**
 * Resolve text font size from element styles and theme (CANONICAL RULE)
 * CANONICAL RULE:
 * - IF styles.fontSize exists → USE styles.fontSize (CUSTOM)
 * - ELSE IF styles.defaultFontSizeType exists → RESOLVE FROM THEME
 * - ELSE → FALLBACK → theme.textSizes.base
 */
function resolveTextFontSize(styles: any): string {
  const theme = typeof window !== 'undefined' ? (window as any).__THEME_DATA__ : null;

  // IF styles.fontSize exists → USE styles.fontSize (CUSTOM)
  if (styles?.fontSize) {
    return styles.fontSize;
  }

  // ELSE IF styles.defaultFontSizeType exists → RESOLVE FROM THEME
  const type = styles?.defaultFontSizeType || 'text-base';

  if (theme?.textSizes) {
    const map: Record<string, string> = {
      'text-small': theme.textSizes.small || '0.875rem',
      'text-base': theme.textSizes.base || '1rem',
      'text-large': theme.textSizes.large || '1.125rem',
      'text-xl': theme.textSizes.xl || '1.25rem',
    };
    return map[type] || map['text-base'];
  }

  // ELSE → FALLBACK → theme.textSizes.base
  return '1rem';
}

/**
 * Resolve heading font size from element styles and theme (CANONICAL RULE)
 * CANONICAL RULE:
 * - IF styles.fontSize exists → USE styles.fontSize (CUSTOM)
 * - ELSE → RESOLVE FROM THEME BY TAG
 */
function resolveHeadingFontSize(styles: any, tag: string): string {
  const theme = typeof window !== 'undefined' ? (window as any).__THEME_DATA__ : null;

  // IF styles.fontSize exists → USE styles.fontSize (CUSTOM)
  if (styles?.fontSize || styles?.headingFontSize) {
    return styles.fontSize || styles.headingFontSize;
  }

  // ELSE → RESOLVE FROM THEME BY TAG
  const headingTag = tag || 'h2';

  if (theme?.headingSizes) {
    const map: Record<string, string> = {
      h1: theme.headingSizes.h1 || '3rem',
      h2: theme.headingSizes.h2 || '2.5rem',
      h3: theme.headingSizes.h3 || '2rem',
      h4: theme.headingSizes.h4 || '1.5rem',
      h5: theme.headingSizes.h5 || '1.25rem',
      h6: theme.headingSizes.h6 || '1rem',
    };
    return map[headingTag] || map['h2'];
  }

  // Fallback
  return '2rem';
}

// Helper to add mobile responsive styles to any element style
// This must be defined outside renderElement so it can be used by EditableHeading and EditableText
// CRITICAL: This function MUST NOT modify fontSize - fontSize is applied LAST with !important
const addMobileResponsiveStyles = (
  baseStyles: React.CSSProperties, 
  elementType?: string
): React.CSSProperties => {
  const responsive = addResponsiveStyles(baseStyles, elementType);
  
  // DO NOT apply responsive font sizes here - fontSize is applied LAST with !important
  // This prevents override issues
  
  // Apply responsive padding
  if (baseStyles.padding) {
    responsive.padding = getResponsivePadding(baseStyles.padding as string | number);
  }
  
  // Apply responsive gap for containers
  if (baseStyles.gap && (elementType === 'container' || elementType === 'row' || elementType === 'column')) {
    responsive.gap = getResponsiveGap(baseStyles.gap as string | number);
  }
  
  return responsive;
};

// Editable Heading Component - uses hooks properly
interface EditableHeadingProps {
  elId: string;
  displayText: string;
  headingTag: string;
  elProps: any;
  elStyles: React.CSSProperties;
  isSelected: boolean;
  builderMode: boolean;
  elementDefaults: any;
  onSelect: (e: React.MouseEvent, type: string) => void;
  onUpdateProps?: (elId: string, props: any) => void;
  isHovered?: boolean;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  isGridChild?: boolean;
  isFlexChild?: boolean;
}

const EditableHeading: React.FC<EditableHeadingProps> = ({
  elId,
  displayText,
  headingTag,
  elProps,
  elStyles,
  isSelected,
  builderMode,
  elementDefaults,
  onSelect,
  onUpdateProps,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  isGridChild = false,
  isFlexChild = false
}) => {
  const editRef = React.useRef<HTMLElement>(null);
  const isEditable = builderMode && isSelected;
  const wasClickedRef = React.useRef(false);
  const HeadingComponent = headingTag as keyof JSX.IntrinsicElements;
  
  // No default font sizes - let browser defaults handle it based on heading tag
  
  // Sync text from props when changed from sidebar (don't auto-focus)
  React.useEffect(() => {
    if (isEditable && editRef.current) {
      const isCurrentlyFocused = document.activeElement === editRef.current;
      const currentText = editRef.current.textContent || '';
      
      if (displayText !== currentText && !isCurrentlyFocused) {
        editRef.current.textContent = displayText;
      }
    }
  }, [isEditable, displayText]);
  
  // Force remount when headingTag changes by updating ref
  React.useEffect(() => {
    if (editRef.current) {
      const currentTag = editRef.current.tagName.toLowerCase();
      if (currentTag !== headingTag) {
        // Tag changed - React will handle remount via key
        editRef.current = null;
      }
    }
  }, [headingTag]);

  // Handle font injection for real-time updates
  // Always inject style tag with !important for element-specific fonts
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const styleId = `font-override-${elId}`;
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // CRITICAL: Font family resolution (CANONICAL RULE)
    // IF fontFamily exists → USE fontFamily (CUSTOM)
    // ELSE → USE theme default font
    const fontFamily = (elStyles as any).fontFamily || (elStyles as any).headingFontFamily;
    
    if (fontFamily && fontFamily.trim() !== '') {
      // Custom font: load and apply
      loadGoogleFont(fontFamily);
      styleElement.textContent = `[data-el-id="${elId}"] { font-family: ${fontFamily} !important; }`;
    } else {
      // Theme default: use theme font
      const defaultFont = getDefaultFontFromTheme();
      styleElement.textContent = `[data-el-id="${elId}"] { font-family: ${defaultFont} !important; }`;
    }
  }, [elStyles, elId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wasClickedRef.current = true;
    // Immediate selection for smooth UX
    onSelect(e, 'heading');
    
    // Small delay for focus to allow selection to process first
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (editRef.current && wasClickedRef.current) {
          editRef.current.focus();
          const selection = window.getSelection();
          if (selection && editRef.current) {
            if (selection.rangeCount === 0) {
              const range = document.createRange();
              range.selectNodeContents(editRef.current);
              range.collapse(false);
              selection.addRange(range);
            }
          }
        }
      }, 10);
    });
  };

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const newText = e.currentTarget.textContent || '';
    if (onUpdateProps) {
      onUpdateProps(elId, {
        ...elProps,
        text: newText,
        heading: newText
      });
    }
  };

  const handleBlur = () => {
    wasClickedRef.current = false;
    if (editRef.current && onUpdateProps) {
      const finalText = editRef.current.textContent || '';
      onUpdateProps(elId, {
        ...elProps,
        text: finalText,
        heading: finalText
      });
    }
  };

  // Use React.createElement to dynamically create the element type
  // This ensures React properly handles tag changes (h1 -> h2, etc.)
  return React.createElement(
    HeadingComponent,
    {
      key: `${elId}-${headingTag}`,
      ref: editRef as any,
      'data-el-id': elId,
      'data-el-type': 'heading',
      contentEditable: isEditable,
      suppressContentEditableWarning: true,
      onClick: handleClick,
      onMouseDown: (e: React.MouseEvent) => {
        if (builderMode) {
          e.stopPropagation();
          wasClickedRef.current = true;
        }
      },
      onMouseEnter: onMouseEnter,
      onMouseLeave: onMouseLeave,
      onInput: handleInput,
      onBlur: handleBlur,
      style: {
        ...(() => {
          // Build base styles
          const headingStyles = { ...elementDefaults.defaultStyle, ...elStyles };
          
          // DO NOT set fontSize here - it will be applied LAST after responsive adjustments
          
          // Check if useDefaultColor is enabled
          // CRITICAL: If textColor or color is explicitly set, useDefaultColor should be false
          const hasCustomColor = (elStyles as any).textColor || elStyles.color;
          const useDefaultColor = (elStyles as any).useDefaultColor !== undefined 
            ? (elStyles as any).useDefaultColor 
            : !hasCustomColor; // Default to false if custom color exists, true otherwise
          
          // Determine final color based on useDefaultColor flag
          let finalColor: string;
          if (useDefaultColor) {
            // Use theme color from CSS variable, fallback to black for visibility on white backgrounds
            // If no theme available, use black directly
            finalColor = 'var(--color-heading, #000000)';
          } else {
            // When useDefaultColor is false, prioritize textColor (DB field) over color (mapped field)
            // textColor is what we save in the database, so it contains the user's custom color
            const textColorValue = (elStyles as any).textColor;
            const colorValue = elStyles.color;
            
            // First check textColor (direct from DB), then color (mapped), then fallback to theme
            let customColor: string | undefined;
            if (textColorValue && 
                typeof textColorValue === 'string' && 
                textColorValue.trim() !== '' &&
                textColorValue !== 'transparent' &&
                !textColorValue.startsWith('var(')) {
              customColor = textColorValue;
            } else if (colorValue && 
                       typeof colorValue === 'string' && 
                       colorValue.trim() !== '' &&
                       colorValue !== 'transparent' &&
                       !colorValue.startsWith('var(')) {
              customColor = colorValue;
            }
            
            // Use custom color if valid, otherwise fallback to theme (or black if no theme)
            if (customColor && !isThemeColor(customColor, 'heading')) {
              finalColor = customColor;
            } else {
              // Fallback to theme if custom color is invalid or not set, use black if no theme
              finalColor = 'var(--color-heading, #000000)';
            }
          }
          
          // Apply color to headingStyles
          headingStyles.color = finalColor;
          
          // Remove textColor if present (we've already converted it to color)
          delete (headingStyles as any).textColor;
          
          // Build final heading styles with responsive adjustments
          const finalHeadingStyles = addMobileResponsiveStyles(headingStyles, 'heading');
          
          // Remove headingFontSize if present (use fontSize instead)
          delete (finalHeadingStyles as any).headingFontSize;
          
          return finalHeadingStyles;
        })(),
        // CRITICAL: fontFamily resolution (CANONICAL RULE)
        // IF fontFamily exists → USE fontFamily (CUSTOM)
        // ELSE → USE theme default font
        fontFamily: (() => {
          const customFont = (elStyles as any).fontFamily || (elStyles as any).headingFontFamily;
          if (customFont && customFont.trim() !== '') {
            return customFont;
          }
          // Theme default
          return getDefaultFontFromTheme();
        })(),
        // CRITICAL: textAlign must be explicitly applied to override any CSS rules
        // Use actual value from elStyles if it exists (even if empty string), otherwise use headingTextAlign, then defaults
        textAlign: (elStyles as any).textAlign !== undefined 
          ? (elStyles as any).textAlign 
          : ((elStyles as any).headingTextAlign !== undefined 
              ? (elStyles as any).headingTextAlign 
              : (elementDefaults.defaultStyle.textAlign || elementDefaults.defaultStyle.headingTextAlign || undefined)),
        // BUILDER VISUALIZATION: Element overlays are handled in ElementWrapper
        position: 'relative',
        cursor: builderMode ? 'text' : undefined,
        minHeight: builderMode ? '1.2em' : undefined,
        userSelect: builderMode ? 'text' : undefined,
        transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
        // CRITICAL: Apply font size LAST (after all other properties) to prevent override
        // Inline styles already have highest specificity
        fontSize: (() => {
          const resolvedFontSize = resolveHeadingFontSize(elStyles, headingTag);
          return resolvedFontSize || undefined;
        })(),
      },
    },
    displayText
  );
};

// Editable Text Component - uses hooks properly
interface EditableTextProps {
  elId: string;
  displayText: string;
  elProps: any;
  elStyles: React.CSSProperties;
  isSelected: boolean;
  builderMode: boolean;
  elementDefaults: any;
  onSelect: (e: React.MouseEvent, type: string) => void;
  onUpdateProps?: (elId: string, props: any) => void;
  isHovered?: boolean;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  isGridChild?: boolean;
  isFlexChild?: boolean;
}

const EditableText: React.FC<EditableTextProps> = ({
  elId,
  displayText,
  elProps,
  elStyles,
  isSelected,
  builderMode,
  elementDefaults,
  onSelect,
  onUpdateProps,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  isGridChild = false,
  isFlexChild = false
}) => {
  const editRef = React.useRef<HTMLParagraphElement>(null);
  
  // Load font when fontFamily changes and inject style tag for real-time updates
  React.useEffect(() => {
    // CRITICAL: Font family resolution (CANONICAL RULE)
    // IF fontFamily exists → USE fontFamily (CUSTOM)
    // ELSE → USE theme default font
    if (typeof window !== 'undefined') {
      const styleId = `font-override-${elId}`;
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      const fontFamily = (elStyles as any).fontFamily;
      if (fontFamily && fontFamily.trim() !== '') {
        // Custom font: load and apply
        loadGoogleFont(fontFamily);
        styleElement.textContent = `[data-el-id="${elId}"] { font-family: ${fontFamily} !important; }`;
      } else {
        // Theme default: use theme font
        const defaultFont = getDefaultFontFromTheme();
        styleElement.textContent = `[data-el-id="${elId}"] { font-family: ${defaultFont} !important; }`;
      }
    }
  }, [elStyles, elId]);
  const isEditable = builderMode && isSelected;
  const wasClickedRef = React.useRef(false);

  // Sync text from props when changed from sidebar (don't auto-focus)
  React.useEffect(() => {
    if (isEditable && editRef.current) {
      const isCurrentlyFocused = document.activeElement === editRef.current;
      const currentText = editRef.current.textContent || '';
      
      if (displayText !== currentText && !isCurrentlyFocused) {
        editRef.current.textContent = displayText;
      }
    }
  }, [isEditable, displayText]);

  // Handle font injection for real-time updates
  // Always inject style tag with !important for element-specific fonts
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const styleId = `font-override-${elId}`;
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // CRITICAL: Font family resolution (CANONICAL RULE)
    // IF fontFamily exists → USE fontFamily (CUSTOM)
    // ELSE → USE theme default font
    const fontFamily = (elStyles as any).fontFamily;
    if (fontFamily && fontFamily.trim() !== '') {
      // Custom font: load and apply
      loadGoogleFont(fontFamily);
      styleElement.textContent = `[data-el-id="${elId}"] { font-family: ${fontFamily} !important; }`;
    } else {
      // Theme default: use theme font
      const defaultFont = getDefaultFontFromTheme();
      styleElement.textContent = `[data-el-id="${elId}"] { font-family: ${defaultFont} !important; }`;
    }
  }, [elStyles, elId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wasClickedRef.current = true;
    // Always select the element first when clicking anywhere on it
    // Immediate selection for smooth UX
    onSelect(e, 'text');
    
    // If clicking on text (not already focused), select element then allow editing
    if (document.activeElement !== editRef.current) {
      // Use requestAnimationFrame for smooth selection, then focus
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (editRef.current && wasClickedRef.current) {
            editRef.current.focus();
            const selection = window.getSelection();
            if (selection && editRef.current) {
              if (selection.rangeCount === 0) {
                const range = document.createRange();
                range.selectNodeContents(editRef.current);
                range.collapse(false);
                selection.addRange(range);
              }
            }
          }
        }, 10);
      });
    }
  };

  const handleInput = (e: React.FormEvent<HTMLParagraphElement>) => {
    const newText = e.currentTarget.textContent || '';
    if (onUpdateProps) {
      onUpdateProps(elId, {
        ...elProps,
        text: newText
      });
    }
  };

  const handleBlur = () => {
    wasClickedRef.current = false;
    if (editRef.current && onUpdateProps) {
      const finalText = editRef.current.textContent || '';
      onUpdateProps(elId, {
        ...elProps,
        text: finalText
      });
    }
  };

  return (
    <p
      ref={editRef}
      data-el-id={elId}
      data-el-type="text"
      contentEditable={isEditable}
      suppressContentEditableWarning
      onClick={handleClick}
      onMouseDown={(e) => {
        if (builderMode) {
          e.stopPropagation();
          wasClickedRef.current = true;
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onInput={handleInput}
      onBlur={handleBlur}
      onFocus={(e) => {
        e.stopPropagation();
      }}
      style={{
        ...(() => {
          // CRITICAL: Resolve text font size using canonical resolution function
          // CRITICAL: Resolve text font size using canonical resolution function
          const resolvedFontSize = resolveTextFontSize(elStyles);
          
          // Get color value - prioritize textColor (DB field name) over color (mapped field)
          // textColor is what we save in the database, so check it first
          const customColor = (elStyles as any).textColor || elStyles.color;
          
          // Determine final color based on useDefaultColor flag
          // CRITICAL: If color or textColor is explicitly set, useDefaultColor should be false
          const hasCustomColorForText = (elStyles as any).textColor || elStyles.color;
          const useDefaultColorForText = (elStyles as any).useDefaultColor !== undefined 
            ? (elStyles as any).useDefaultColor 
            : !hasCustomColorForText; // Default to false if custom color exists, true otherwise
          
          let finalColor: string;
          if (useDefaultColorForText) {
            // Use theme color from CSS variable, fallback to black for visibility on white backgrounds
            finalColor = 'var(--color-description, #000000)';
          } else {
            // Use custom color if provided and valid, otherwise fallback to theme
            if (customColor && 
                typeof customColor === 'string' && 
                customColor.trim() !== '' &&
                customColor !== 'transparent' &&
                !customColor.startsWith('var(') && 
                !isThemeColor(customColor, 'description')) {
              finalColor = customColor;
            } else {
              // Fallback to theme if custom color is invalid or not set, use black for visibility
              finalColor = 'var(--color-description, #000000)';
            }
          }
          
          // Build text styles - ensure color is explicitly set
          const textStyles = addMobileResponsiveStyles({
            ...elementDefaults.defaultStyle,
            ...elStyles,
            // Explicitly set color last to ensure it overrides any color from elStyles
            color: finalColor,
          }, 'text');
          
          // Remove textColor if present (we've already converted it to color)
          delete (textStyles as any).textColor;
          
          // Handle width/height: empty string or undefined should use default or auto
          if (textStyles.width === '' || textStyles.width === undefined) {
            textStyles.width = elementDefaults.defaultStyle.width || '100%';
          } else if (String(textStyles.width).trim().toLowerCase() === 'auto') {
            textStyles.width = 'auto';
          }
          
          if (textStyles.height === '' || textStyles.height === undefined) {
            textStyles.height = elementDefaults.defaultStyle.height || 'auto';
          } else if (String(textStyles.height).trim().toLowerCase() === 'auto') {
            textStyles.height = 'auto';
          }
          
          // Remove min/max width/height if empty
          if (textStyles.minWidth === '' || textStyles.minWidth === undefined) {
            delete textStyles.minWidth;
          }
          if (textStyles.maxWidth === '' || textStyles.maxWidth === undefined) {
            delete textStyles.maxWidth;
          }
          if (textStyles.minHeight === '' || textStyles.minHeight === undefined) {
            delete textStyles.minHeight;
          }
          if (textStyles.maxHeight === '' || textStyles.maxHeight === undefined) {
            delete textStyles.maxHeight;
          }
          
          // DO NOT set fontSize here - it will be applied LAST after all other properties
          
          return textStyles;
        })(),
        // CRITICAL: fontFamily must be applied AFTER spreading to ensure it overrides everything
        // CRITICAL: fontFamily resolution (CANONICAL RULE)
        // IF fontFamily exists → USE fontFamily (CUSTOM)
        // ELSE → USE theme default font
        fontFamily: (() => {
          const customFont = (elStyles as any).fontFamily;
          if (customFont && customFont.trim() !== '') {
            return customFont;
          }
          // Theme default
          return getDefaultFontFromTheme();
        })(),
        // CRITICAL: textAlign must be explicitly applied to override any CSS rules
        // Use actual value from elStyles if it exists (even if empty string), otherwise use defaults
        textAlign: (elStyles as any).textAlign !== undefined 
          ? (elStyles as any).textAlign 
          : (elementDefaults.defaultStyle.textAlign || undefined),
        // BUILDER VISUALIZATION: Element overlays are handled in ElementWrapper
        position: 'relative',
        cursor: builderMode ? 'text' : undefined,
        minHeight: builderMode ? '1.2em' : undefined,
        userSelect: builderMode ? 'text' : undefined,
        // CRITICAL: Apply font size LAST (after all other properties) to prevent override
        // Inline styles already have highest specificity
        fontSize: (() => {
          const resolvedFontSize = resolveTextFontSize(elStyles);
          return resolvedFontSize || undefined;
        })(),
      }}
    >
      {displayText}
    </p>
  );
};

interface RenderElementProps {
  element: { id: string; type: string; elId: string; order: number };
  elementIdx: number;
  sortedElements: Array<{ id: string; type: string; elId: string; order: number }>;
  elProps: any;
  elStyles: React.CSSProperties;
  isSelected: boolean;
  builderMode: boolean;
  __nodeId?: string;
  __studio?: {
    selectElement?: (nodeId: string, elId: string, type: string) => void;
    moveCustomElement?: (elId: string, direction: 'up' | 'down') => void;
    removeCustomElement?: (elId: string) => void;
    duplicateCustomElement?: (elId: string) => void;
    updateCustomElementProps?: (elId: string, props: any) => void;
    onElementContextMenu?: (e: React.MouseEvent, elId: string, elementType: string) => void;
    getElementProps?: (elId: string) => any;
    getElementStyle?: (elId: string) => React.CSSProperties;
    setHoveredElement?: (elId: string | null) => void;
    hoveredElId?: string | null;
    getElementMenuItems?: (elId: string, elementType: string) => import('./renderElementControls').ElementControlMenuItem[];
    SelectionMenuComponent?: React.ComponentType<{ items: import('./renderElementControls').ElementControlMenuItem[]; position?: string; buttonClassName?: string }>;
  };
  // Optional: component-specific overrides for element structures
  elementOverrides?: Record<string, { defaultStyle?: Partial<React.CSSProperties>; defaultProps?: any }>;
  // Optional: component-specific fallback values (e.g., resolved.title, resolved.description)
  fallbackValues?: Record<string, any>;
  // Optional: custom renderers for specific element types
  customRenderers?: Record<string, (props: RenderElementProps) => React.ReactNode>;
}

/**
 * Shared utility to render any element type
 * Handles all standard element types with consistent behavior
 * Allows component-specific overrides and custom renderers
 */
export function renderElement({
  element,
  elementIdx,
  sortedElements,
  elProps,
  elStyles,
  isSelected,
  builderMode,
  __nodeId,
  __studio,
  elementOverrides = {},
  fallbackValues = {},
  customRenderers = {}
}: RenderElementProps): React.ReactNode {
  const { type, elId, id } = element;

  // Font injection is handled in individual element components (EditableHeading, EditableText, etc.)
  // and in switch cases for buttons and other elements
  // Font family resolution follows canonical rule: custom font if exists, else theme default

  // Check for custom renderer first
  if (customRenderers[type]) {
    return customRenderers[type]({
      element,
      elementIdx,
      sortedElements,
      elProps,
      elStyles,
      isSelected,
      builderMode,
      __nodeId,
      __studio,
      elementOverrides,
      fallbackValues,
      customRenderers
    });
  }

  // Get element structure with optional overrides
  const elementDefaults = getElementStructure(type, elementOverrides[type]);
  
  // Check if this element is a child of a grid/flex container
  // This is passed via elementOverrides[type]._parentDisplay
  // Default to false if not set (for root elements or non-grid children)
  const parentDisplay = (elementOverrides[type] as any)?._parentDisplay;
  const layoutInfo = (elementOverrides[type] as any)?._layoutInfo;
  const isGridChild = parentDisplay === 'grid' ? true : false;
  const isFlexChild = parentDisplay === 'flex' ? true : false;
  
  // CRITICAL: Debug logging for grid child detection
  if (typeof window !== 'undefined' && (window as any).__DEV__ && isGridChild) {
    console.log(`[renderElement] Grid child detected for ${elId} (${type}):`, {
      parentDisplay,
      isGridChild,
      elementOverrides: elementOverrides[type]
    });
  }

  // Helper to handle element selection with smooth feedback
  const handleSelect = (e: React.MouseEvent, elementType: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (__nodeId && __studio?.selectElement) {
      // Immediate selection for smooth UX
      __studio.selectElement(__nodeId, elId, elementType);
    }
  };

  // Helper to handle hover enter
  // NOTE: For containers, hover is handled by ContainerHoverOverlay via event delegation
  // This handler is kept for non-container elements
  const handleMouseEnter = (e: React.MouseEvent) => {
    // For containers, don't stop propagation - let event delegation handle it
    const isContainer = type === 'container' || type === 'row' || type === 'column';
    if (!isContainer) {
      e.stopPropagation();
    }
    if (builderMode && __studio?.setHoveredElement && !isContainer) {
      __studio.setHoveredElement(elId);
    }
  };

  // Helper to handle hover leave
  // NOTE: For containers, hover is handled by ContainerHoverOverlay via event delegation
  const handleMouseLeave = (e: React.MouseEvent) => {
    const isContainer = type === 'container' || type === 'row' || type === 'column';
    if (!isContainer) {
      e.stopPropagation();
      if (builderMode && __studio?.setHoveredElement) {
        // Only clear if this is the currently hovered element
        if (__studio.hoveredElId === elId) {
          __studio.setHoveredElement(null);
        }
      }
    }
  };

  // Check if this element is hovered (but not selected)
  const isHovered = builderMode && __studio?.hoveredElId === elId && !isSelected;

  // Helper to get display text with fallbacks
  const getDisplayText = (keys: string[], fallbackKey?: string) => {
    for (const key of keys) {
      if (elProps[key]) return elProps[key];
    }
    if (fallbackKey && fallbackValues[fallbackKey]) return fallbackValues[fallbackKey];
    return elementDefaults.defaultProps.text || elementDefaults.defaultProps[keys[0]] || '';
  };

  // Helper to add mobile responsive styles to any element style
  const addMobileResponsiveStyles = (baseStyles: React.CSSProperties): React.CSSProperties => ({
    ...baseStyles,
    maxWidth: '100%',
    boxSizing: 'border-box',
    // Add word wrap for text elements
    ...(type === 'text' || type === 'heading' || type === 'label' || type === 'badge' || type === 'link' ? {
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const,
      wordBreak: 'break-word' as const,
    } : {}),
  });

  // Container wrapper for all elements - mobile responsive
  // isGridChild: if true, this element is a direct child of a grid container, so don't force width: 100%
  const ElementWrapper = ({ children, containerStyle = {}, isGridChild = false, isFlexChild = false }: { children: React.ReactNode; containerStyle?: React.CSSProperties; isGridChild?: boolean; isFlexChild?: boolean }) => {
    // elId is available in closure from renderElement function
    // CRITICAL: For grid children, remove width and maxWidth from containerStyle to prevent full-width spanning
    const finalContainerStyle = isGridChild 
      ? (() => {
          const { width, maxWidth, ...rest } = containerStyle;
          return rest;
        })()
      : containerStyle;
    
    // Build base wrapper style
    const baseWrapperStyle: React.CSSProperties = {
      position: 'relative',
      boxSizing: 'border-box',
      pointerEvents: 'auto', // Ensure wrapper doesn't block clicks
    };
    
    // BUILDER VISUALIZATION: Apply cell-based styles for grid/flex children
    // This makes elements fill their grid/flex cell visually, showing symmetric layout boxes
    const cellVisualizationStyles: React.CSSProperties = builderMode && (isGridChild || isFlexChild) ? {
      // For grid: Fill the grid cell completely
      ...(isGridChild ? {
        width: '100%', // Fill grid cell width
        height: '100%', // Fill grid cell height
        minHeight: '60px', // Minimum cell height for visibility
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
      } : {}),
      // For flex: Fill the flex slot
      ...(isFlexChild ? {
        width: '100%', // Fill flex slot width
        minHeight: '40px', // Minimum slot height for visibility
        flex: '1 1 auto', // Allow flex to distribute space
      } : {}),
    } : {};
    
    // BUILDER VISUALIZATION: Cell-based overlays for grid/flex children (removed - using element overlays instead)
    const cellOutlineStyles: React.CSSProperties = {};
    
    // Apply finalContainerStyle first (but remove width/maxWidth for grid children)
    // CRITICAL: In builder mode, ElementWrapper must NOT inherit padding/margin from parent
    // Each element owns its own spacing styles
    const wrapperStyle: React.CSSProperties = {
      ...baseWrapperStyle,
      // Only apply layout-related styles from containerStyle, never spacing
      ...(builderMode ? {
        // Explicitly exclude padding/margin from containerStyle inheritance
        ...Object.fromEntries(
          Object.entries(finalContainerStyle).filter(([key]) => 
            key !== 'padding' && key !== 'margin' && 
            key !== 'paddingTop' && key !== 'paddingRight' && key !== 'paddingBottom' && key !== 'paddingLeft' &&
            key !== 'marginTop' && key !== 'marginRight' && key !== 'marginBottom' && key !== 'marginLeft'
          )
        ),
        // Element's own padding/margin come from elStyles, not containerStyle
        padding: 0,
        margin: 0,
      } : finalContainerStyle),
      ...cellVisualizationStyles, // Apply cell visualization styles
      ...cellOutlineStyles, // Apply cell-based outline styles
      // CRITICAL: For grid children, ALWAYS override width/maxWidth AFTER applying containerStyle
      // This ensures grid items don't span full width
      ...(isGridChild ? { 
        width: '100%', // Fill grid cell (builder visualization)
        maxWidth: 'none',
        minWidth: 0, // Allow grid to shrink items if needed
        // CRITICAL: Ensure grid items don't span multiple columns
        gridColumn: 'auto',
        gridRow: 'auto',
        // Ensure the wrapper itself doesn't force full width
        boxSizing: 'border-box',
        // CRITICAL: Don't let the wrapper interfere with grid item placement
        display: builderMode ? 'flex' : 'block', // Use flex in builder for cell visualization
      } : { 
        width: finalContainerStyle.width || (isFlexChild && builderMode ? '100%' : '100%'), 
        maxWidth: finalContainerStyle.maxWidth || (isFlexChild && builderMode ? 'none' : '100%') 
      }),
    };
    
    if (typeof window !== 'undefined' && (window as any).__DEV__ && isGridChild) {
      console.log(`[ElementWrapper] Grid child ${elId}:`, {
        isGridChild,
        wrapperStyle: { ...wrapperStyle },
        originalContainerStyle: containerStyle,
        finalContainerStyle,
        computedWidth: wrapperStyle.width,
        computedMaxWidth: wrapperStyle.maxWidth
      });
    }
    
    return (
      <div
        style={wrapperStyle}
      onClick={(e) => {
        // Only handle clicks in builder mode - in custom sites, let all clicks pass through
        if (!builderMode) {
          return; // Don't interfere with clicks in custom sites
        }
        // Stop propagation if clicking on controls area (they handle their own clicks)
        // But allow clicks on interactive elements (buttons, links) to pass through
        const target = e.target as HTMLElement;
        if (target.closest('[data-element-controls]')) {
          e.stopPropagation();
        }
        // Don't stop propagation for buttons, links, or other interactive elements
        if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
          return; // Let the click pass through
        }
      }}
      onMouseDown={(e) => {
        // Only handle mouseDown in builder mode - in custom sites, let all clicks pass through
        if (!builderMode) {
          return; // Don't interfere with clicks in custom sites
        }
        // Stop propagation if clicking on controls area
        // But allow clicks on interactive elements to pass through
        const target = e.target as HTMLElement;
        if (target.closest('[data-element-controls]')) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onContextMenu={(e) => {
        // Handle right-click context menu for element
        if (builderMode && __studio?.onElementContextMenu) {
          __studio.onElementContextMenu(e, elId, type);
        }
      }}
    >
        {/* ELEMENT OVERLAY: Chrome DevTools-style highlighting - ALL elements (including grid/flex children) */}
        {builderMode && (isSelected || isHovered) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '1.5px solid #f97316',
              backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.08)',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              zIndex: 1002, // Higher than container overlay (1001) to sit above
              // Ensure overlay is visible on all 4 sides, not clipped
              overflow: 'visible',
            }}
          />
        )}
      <div data-element-controls>
      <RenderElementControls
        elementIdx={elementIdx}
        sortedElements={sortedElements}
        elId={elId}
        isSelected={isSelected}
        builderMode={builderMode}
          onMoveUp={(elId) => {
            __studio?.moveCustomElement?.(elId, 'up');
          }}
          onMoveDown={(elId) => {
            __studio?.moveCustomElement?.(elId, 'down');
          }}
          onDelete={(elId) => {
            __studio?.removeCustomElement?.(elId);
          }}
          menuItems={__studio?.getElementMenuItems?.(elId, type) || []}
          SelectionMenuComponent={__studio?.SelectionMenuComponent}
          elementType={type}
      />
      </div>
      {children}
    </div>
    );
  };

  // Render based on element type
  switch (type) {
    case 'heading': {
      const displayText = getDisplayText(['text', 'heading'], elId === 'title' ? 'title' : undefined);
      const headingTag = elProps.headingTag || 'h1';
      
      return (
        <ElementWrapper key={`heading-wrapper-${elId}-${headingTag}`} isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <EditableHeading
            key={`heading-${elId}-${headingTag}`}
            elId={elId}
            displayText={displayText}
            headingTag={headingTag}
            elProps={elProps}
            elStyles={elStyles}
            isSelected={isSelected}
            builderMode={builderMode}
            elementDefaults={elementDefaults}
            onSelect={handleSelect}
            onUpdateProps={__studio?.updateCustomElementProps}
            isHovered={isHovered}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            isGridChild={isGridChild}
            isFlexChild={isFlexChild}
          />
        </ElementWrapper>
      );
    }

    case 'text': {
      const displayText = getDisplayText(['text'], undefined);
      
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <EditableText
            elId={elId}
            displayText={displayText}
            elProps={elProps}
            elStyles={elStyles}
            isSelected={isSelected}
            builderMode={builderMode}
            elementDefaults={elementDefaults}
            onSelect={handleSelect}
            onUpdateProps={__studio?.updateCustomElementProps}
            isHovered={isHovered}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            isGridChild={isGridChild}
            isFlexChild={isFlexChild}
          />
        </ElementWrapper>
      );
    }

    case 'image': {
      // CRITICAL: Get imageUrl from props - prioritize user-set URL over default
      // Check multiple possible sources: imageUrl, imageUrlDesktop, or default
      const imageUrl = elProps.imageUrl || elProps.imageUrlDesktop || elementDefaults.defaultProps.imageUrl;
      
      // CRITICAL: Only use default if imageUrl is truly empty/undefined/null
      // If user has set ANY value (even if invalid), use it - don't fallback to default
      const hasUserSetUrl = elProps.imageUrl || elProps.imageUrlDesktop;
      const displayUrl = (imageUrl && imageUrl.trim() !== '') 
        ? imageUrl 
        : (hasUserSetUrl ? imageUrl : 'https://picsum.photos/seed/picsum/200/300'); // Only use default if user hasn't set anything
      
      const isExternalImage = displayUrl && (displayUrl.startsWith('http://') || displayUrl.startsWith('https://'));
      
      // Check if image has a link
      const imageLink = elProps.imageLink;
      const hasLink = imageLink && imageLink.trim() !== '';
      
      // Image element with all styles
      const imageElement = (
        <img
          data-el-id={elId}
          data-el-type="image"
          onClick={(e) => {
            if (builderMode) {
              e.preventDefault();
              e.stopPropagation();
              handleSelect(e, 'image');
            } else if (hasLink) {
              // In custom sites, let link handle navigation
              e.stopPropagation();
            }
          }}
          onMouseDown={(e) => {
            if (builderMode) {
              e.preventDefault();
              e.stopPropagation();
              // Immediate selection on mousedown for smooth UX (like input/textarea)
              handleSelect(e, 'image');
            } else if (hasLink) {
              // In custom sites, let link handle clicks
              e.stopPropagation();
            }
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          src={displayUrl}
          alt={elProps.imageAlt ?? elementDefaults.defaultProps.imageAlt ?? ''}
          crossOrigin={isExternalImage ? 'anonymous' : undefined}
          loading="lazy"
          onError={(e) => {
            // Silently handle image load errors to prevent console spam
            const target = e.target as HTMLImageElement;
            // CRITICAL: Only fallback to default if user hasn't explicitly set an image URL
            // If user set a URL that fails, don't override it - let them see the broken image
            const hasUserSetUrl = elProps.imageUrl || elProps.imageUrlDesktop;
            if (!hasUserSetUrl && target.src && !target.src.includes('placeholder') && !target.src.includes('via.placeholder') && !target.src.includes('picsum')) {
              target.src = 'https://picsum.photos/seed/picsum/200/300';
            }
          }}
          style={addMobileResponsiveStyles({
            ...elementDefaults.defaultStyle,
            ...elStyles,
            // CRITICAL: Apply width and height from styles (imageWidth/imageHeight or width/height)
            width: elStyles.imageWidth || elStyles.width || elementDefaults.defaultStyle?.width,
            height: elStyles.imageHeight || elStyles.height || elementDefaults.defaultStyle?.height,
            minWidth: elStyles.imageMinWidth || elStyles.minWidth,
            maxWidth: elStyles.imageMaxWidth || elStyles.maxWidth || '100%',
            minHeight: elStyles.imageMinHeight || elStyles.minHeight,
            maxHeight: elStyles.imageMaxHeight || elStyles.maxHeight,
            objectFit: elStyles.imageObjectFit || elStyles.objectFit || 'cover',
            objectPosition: elStyles.imageObjectPosition || elStyles.objectPosition || 'center',
            // Ensure image is not transparent by default
            opacity: elStyles.opacity !== undefined ? elStyles.opacity : (elementDefaults.defaultStyle?.opacity !== undefined ? elementDefaults.defaultStyle.opacity : 1),
            // Element overlays are handled in ElementWrapper
            position: 'relative',
            cursor: builderMode ? 'pointer' : (hasLink ? 'pointer' : undefined),
            pointerEvents: 'auto', // CRITICAL: Ensure image is clickable in builder mode
            zIndex: builderMode ? 10 : undefined, // Ensure image is above overlays when in builder mode
            transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            display: 'block', // Ensure image displays correctly
          }, type)}
        />
      );
      
      // If image has a link, wrap it in an <a> tag
      if (hasLink) {
        // Normalize link URL
        let normalizedLink = imageLink.trim();
        if (normalizedLink.includes('.') && 
            !normalizedLink.startsWith('http://') && 
            !normalizedLink.startsWith('https://') && 
            !normalizedLink.startsWith('mailto:') && 
            !normalizedLink.startsWith('tel:') && 
            !normalizedLink.startsWith('#') &&
            !normalizedLink.startsWith('/')) {
          normalizedLink = `https://${normalizedLink}`;
        }
        
        return (
          <ElementWrapper containerStyle={{ display: 'flex', justifyContent: 'center' }} isGridChild={isGridChild} isFlexChild={isFlexChild}>
            <a
              href={builderMode ? 'javascript:void(0)' : normalizedLink}
              target={builderMode ? undefined : '_blank'}
              rel={builderMode ? undefined : 'noopener noreferrer'}
              onClick={(e) => {
                if (builderMode) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(e, 'image');
                } else {
                  // In custom sites, let browser handle navigation
                  e.stopPropagation();
                }
              }}
              onMouseDown={(e) => {
                if (builderMode) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(e, 'image');
                } else {
                  // In custom sites, let link handle clicks
                  e.stopPropagation();
                }
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{
                display: 'inline-block',
                textDecoration: 'none',
                outline: 'none',
                pointerEvents: builderMode ? 'auto' : 'auto',
                cursor: builderMode ? 'pointer' : 'pointer',
              }}
            >
              {imageElement}
            </a>
          </ElementWrapper>
        );
      }
      
      // No link - render image directly
      return (
        <ElementWrapper containerStyle={{ display: 'flex', justifyContent: 'center' }} isGridChild={isGridChild} isFlexChild={isFlexChild}>
          {imageElement}
        </ElementWrapper>
      );
    }

    case 'video': {
      const videoUrl = elProps.videoUrl || elementDefaults.defaultProps.videoUrl;
      // Only render video if URL is valid and not empty
      const isValidVideoUrl = videoUrl && 
        videoUrl.trim() !== '' && 
        (videoUrl.startsWith('http://') || videoUrl.startsWith('https://') || videoUrl.startsWith('/') || videoUrl.startsWith('./'));
      const isExternalVideo = videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'));
      
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <div
            data-el-id={elId}
            data-el-type="video"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelect(e, 'video');
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                // Immediate selection on mousedown for smooth UX
                handleSelect(e, 'video');
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '100%',
              maxWidth: '100%',
              // Element overlays are handled in ElementWrapper
              borderRadius: '4px',
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
              cursor: builderMode ? 'pointer' : undefined,
            }}
          >
            {isValidVideoUrl ? (
              <video
                onClick={(e) => {
                  // Stop propagation to prevent wrapper click, but allow video controls
                    e.stopPropagation();
                  // Select element in builder mode
                  if (builderMode) {
                    handleSelect(e, 'video');
                  }
                }}
                onMouseDown={(e) => {
                  if (builderMode) {
                    // Select element first
                    e.stopPropagation();
                    handleSelect(e, 'video');
                    // Don't prevent default - allow video controls to work
                  }
                }}
                src={videoUrl}
                controls
                crossOrigin={isExternalVideo ? 'anonymous' : undefined}
                onError={(e) => {
                  // Silently handle video load errors to prevent console spam
                  const target = e.target as HTMLVideoElement;
                  if (target.src) {
                    target.style.display = 'none';
                  }
                }}
                style={addMobileResponsiveStyles({
                  ...elementDefaults.defaultStyle,
                  ...elStyles,
                  position: 'relative',
                  width: '100%',
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  border: 'none',
                  outline: 'none', // Remove default outline, we use wrapper outline
                }, 'video')}
              />
            ) : (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(e, 'video');
                }}
                onMouseDown={(e) => {
                  if (builderMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(e, 'video');
                  }
                }}
                style={addMobileResponsiveStyles({
                  ...elementDefaults.defaultStyle,
                  ...elStyles,
                  position: 'relative',
                  width: '100%',
                  maxWidth: '100%',
                  minHeight: '200px',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  border: '2px dashed #d1d5db',
                  cursor: builderMode ? 'pointer' : undefined,
                  transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
                }, 'video')}
              >
                {builderMode ? 'Click to add video URL' : 'No video URL'}
              </div>
            )}
          </div>
        </ElementWrapper>
      );
    }

    case 'icon': {
      return (
        <ElementWrapper containerStyle={{ display: 'flex', justifyContent: 'center' }} isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <i
            data-el-id={elId}
            data-el-type="icon"
            onClick={(e) => {
              e.preventDefault();
              handleSelect(e, 'icon');
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                // Immediate selection on mousedown for smooth UX (like input/textarea)
                handleSelect(e, 'icon');
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`${elProps.iconClass || elementDefaults.defaultProps.iconClass || 'fas fa-star'} fa-icon-builder`}
            style={{
              ...addMobileResponsiveStyles({
                ...elementDefaults.defaultStyle,
                ...elStyles,
              }, type),
              // CRITICAL: Font Awesome icon display properties
              display: 'inline-block',
              fontStyle: 'normal',
              fontVariant: 'normal',
              textRendering: 'auto',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              cursor: builderMode ? 'pointer' : undefined,
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            }}
          />
        </ElementWrapper>
      );
    }

    case 'link': {
      return (
        <ElementWrapper containerStyle={{ display: 'flex', justifyContent: 'center' }} isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <a
            data-el-id={elId}
            data-el-type="link"
            onClick={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(e, 'link');
              }
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(e, 'link');
              }
            }}
            onContextMenu={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            href={builderMode ? 'javascript:void(0)' : (elProps.href || elementDefaults.defaultProps.href)}
            tabIndex={builderMode ? -1 : undefined}
            style={addMobileResponsiveStyles({
              ...elementDefaults.defaultStyle,
              ...elStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              cursor: builderMode ? 'pointer' : undefined,
              pointerEvents: builderMode ? 'auto' : undefined,
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            })}
          >
            {elProps.text || elementDefaults.defaultProps.text}
          </a>
        </ElementWrapper>
      );
    }

    case 'divider': {
      // CRITICAL: Check if user has set any margin properties
      const hasUserMargin = elStyles.margin !== undefined || 
                            elStyles.marginTop !== undefined || 
                            elStyles.marginRight !== undefined || 
                            elStyles.marginBottom !== undefined || 
                            elStyles.marginLeft !== undefined;
      
      // CRITICAL: Build margin styles properly - prioritize individual margin properties over shorthand
      // This ensures marginBottom, marginTop, etc. are not overridden by margin shorthand
      const marginStyles: React.CSSProperties = (() => {
        // If user has set shorthand margin, use it
        if (elStyles.margin !== undefined) {
          return { margin: elStyles.margin };
        }
        // If user has set any individual margin properties, use them
        if (hasUserMargin) {
          return {
            marginTop: elStyles.marginTop !== undefined ? elStyles.marginTop : (elementDefaults.defaultStyle?.marginTop || undefined),
            marginRight: elStyles.marginRight !== undefined ? elStyles.marginRight : (elementDefaults.defaultStyle?.marginRight || undefined),
            marginBottom: elStyles.marginBottom !== undefined ? elStyles.marginBottom : (elementDefaults.defaultStyle?.marginBottom || undefined),
            marginLeft: elStyles.marginLeft !== undefined ? elStyles.marginLeft : (elementDefaults.defaultStyle?.marginLeft || undefined),
          };
        }
        // Only apply builder default margin if user hasn't set any margins
        if (builderMode) {
          return { margin: '16px 0' };
        }
        // Use default from elementDefaults if available
        if (elementDefaults.defaultStyle?.margin) {
          return { margin: elementDefaults.defaultStyle.margin };
        }
        return {};
      })();
      
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <hr
            data-el-id={elId}
            onClick={(e) => {
              e.preventDefault();
              handleSelect(e, 'divider');
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                // Immediate selection on mousedown for smooth UX (like input/textarea)
                handleSelect(e, 'divider');
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              ...elementDefaults.defaultStyle,
              // CRITICAL: Remove margin properties from elStyles before spreading to avoid conflicts
              ...Object.fromEntries(
                Object.entries(elStyles).filter(([key]) => 
                  key !== 'margin' && 
                  key !== 'marginTop' && 
                  key !== 'marginRight' && 
                  key !== 'marginBottom' && 
                  key !== 'marginLeft'
                )
              ),
              // CRITICAL: Apply margin styles AFTER removing margin properties from elStyles
              // This ensures marginBottom and other margin properties are correctly applied
              ...marginStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              minHeight: builderMode ? '4px' : undefined,
              cursor: builderMode ? 'pointer' : undefined,
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            }}
          />
        </ElementWrapper>
      );
    }

    case 'spacer': {
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <div
            data-el-id={elId}
            data-el-type="spacer"
            onClick={(e) => {
              e.preventDefault();
              handleSelect(e, 'spacer');
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                // Immediate selection on mousedown for smooth UX (like input/textarea)
                handleSelect(e, 'spacer');
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={addMobileResponsiveStyles({
              ...elementDefaults.defaultStyle,
              ...elStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              minHeight: builderMode ? '32px' : undefined,
              backgroundColor: builderMode && !isSelected ? 'rgba(0, 0, 0, 0.05)' : undefined,
              cursor: builderMode ? 'pointer' : undefined,
              border: builderMode && !isSelected ? '1px dashed #d1d5db' : undefined,
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            }, 'spacer')}
          />
        </ElementWrapper>
      );
    }

    case 'badge': {
      return (
        <ElementWrapper containerStyle={{ display: 'flex', justifyContent: 'center' }} isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <span
            data-el-id={elId}
            data-el-type="badge"
            onClick={(e) => {
              e.preventDefault();
              handleSelect(e, 'badge');
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                // Immediate selection on mousedown for smooth UX (like input/textarea)
                handleSelect(e, 'badge');
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={addMobileResponsiveStyles({
              ...elementDefaults.defaultStyle,
              ...elStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              cursor: builderMode ? 'pointer' : undefined,
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            }, type)}
          >
            {elProps.text || elementDefaults.defaultProps.text}
          </span>
        </ElementWrapper>
      );
    }

    case 'button': {
      // Handle font injection and hover/click animations for buttons
      if (typeof window !== 'undefined') {
        const styleId = `button-styles-${elId}`;
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        
        // Font styles (CANONICAL RULE)
        // IF fontFamily exists → USE fontFamily (CUSTOM)
        // ELSE → USE theme default font
        let fontStyle = '';
        const fontFamily = (elStyles as any).fontFamily;
        if (fontFamily && fontFamily.trim() !== '') {
          loadGoogleFont(fontFamily);
          fontStyle = `font-family: ${fontFamily} !important;`;
        } else {
          const defaultFont = getDefaultFontFromTheme();
          fontStyle = `font-family: ${defaultFont} !important;`;
        }
        
        // Hover and click animation styles
        const hoverStyle = (elStyles as any).hoverStyle || 'scale';
        const clickStyle = (elStyles as any).clickStyle || 'press';
        const hoverBg = (elStyles as any).hoverBackgroundColor;
        const hoverText = (elStyles as any).hoverTextColor;
        const clickBg = (elStyles as any).clickBackgroundColor;
        const clickText = (elStyles as any).clickTextColor;
        
        // Generate hover styles - work in both builder and custom sites
        let hoverCSS = '';
        if (hoverStyle !== 'none') {
          const hoverBgColor = hoverBg || 'var(--color-primary-hover, #1d4ed8)';
          const hoverTextColor = hoverText || '';
          
          hoverCSS = `
            [data-el-id="${elId}"]:hover,
            [data-el-id="${elId}"][data-el-type="button"]:hover,
            button[data-el-id="${elId}"]:hover,
            a[data-el-id="${elId}"]:hover {
              ${hoverTextColor ? `color: ${hoverTextColor} !important;` : ''}
              ${hoverBgColor ? `background-color: ${hoverBgColor} !important;` : ''}
              transition: all 0.3s ease !important;
            `;
          
          switch (hoverStyle) {
            case 'scale':
              hoverCSS += `transform: scale(1.05) !important;`;
              break;
            case 'lift':
              hoverCSS += `transform: translateY(-4px) !important; box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;`;
              break;
            case 'glow':
              hoverCSS += `box-shadow: 0 0 20px ${hoverBgColor || 'rgba(37, 99, 235, 0.6)'} !important;`;
              break;
            case 'shrink':
              hoverCSS += `transform: scale(0.95) !important;`;
              break;
            case 'rotate':
              hoverCSS += `transform: rotate(5deg) scale(1.05) !important;`;
              break;
          }
          hoverCSS += `}`;
        }
        
        // Generate click/active styles - work in both builder and custom sites
        let clickCSS = '';
        if (clickStyle !== 'none') {
          const clickBgColor = clickBg || 'var(--color-primary-hover, #1d4ed8)';
          const clickTextColor = clickText || '';
          
          clickCSS = `
            [data-el-id="${elId}"]:active,
            [data-el-id="${elId}"][data-el-type="button"]:active,
            button[data-el-id="${elId}"]:active,
            a[data-el-id="${elId}"]:active {
              ${clickTextColor ? `color: ${clickTextColor} !important;` : ''}
              ${clickBgColor ? `background-color: ${clickBgColor} !important;` : ''}
              transition: all 0.1s ease !important;
            `;
          
          switch (clickStyle) {
            case 'press':
              clickCSS += `transform: scale(0.95) translateY(2px) !important; box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;`;
              break;
            case 'bounce':
              clickCSS += `transform: scale(0.9) !important; animation: buttonBounce${elId} 0.3s ease !important;`;
              break;
            case 'pulse':
              clickCSS += `transform: scale(1.1) !important; animation: buttonPulse${elId} 0.3s ease !important;`;
              break;
            case 'ripple':
              clickCSS += `transform: scale(0.98) !important; box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7) !important; animation: buttonRipple${elId} 0.6s ease !important;`;
              break;
            case 'shrink':
              clickCSS += `transform: scale(0.9) !important;`;
              break;
          }
          clickCSS += `}`;
        }
        
        // Combine all styles - update on every render to ensure real-time updates
        const allStyles = `
          ${fontStyle ? `[data-el-id="${elId}"], [data-el-id="${elId}"][data-el-type="button"], button[data-el-id="${elId}"], a[data-el-id="${elId}"] { ${fontStyle} }` : ''}
          ${hoverCSS}
          ${clickCSS}
          ${clickStyle === 'bounce' || clickStyle === 'pulse' || clickStyle === 'ripple' ? `
            @keyframes buttonBounce${elId} {
              0%, 100% { transform: scale(0.9); }
              50% { transform: scale(1.05); }
            }
            @keyframes buttonPulse${elId} {
              0%, 100% { transform: scale(1.1); }
              50% { transform: scale(1.15); }
            }
            @keyframes buttonRipple${elId} {
              0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
              100% { box-shadow: 0 0 0 20px rgba(37, 99, 235, 0); }
            }
          ` : ''}
        `;
        
        styleElement.textContent = allStyles;
      }
      
      const buttonText = elProps.buttonText ?? elProps.text ?? elementDefaults.defaultProps.text ?? 'Button';
      // Prioritize href over buttonLink (buttonLink is legacy property name)
      // Only use buttonLink if href is not set or is empty/invalid
      let href = elProps.href;
      if (!href || href === '#' || (typeof href === 'string' && href.trim() === '')) {
        href = elProps.buttonLink;
      }
      if (!href || href === '#' || (typeof href === 'string' && href.trim() === '')) {
        href = elementDefaults.defaultProps.href;
      }
      
      // Get target from props, with fallback to default
      let target = elProps.target;
      if (!target || (target !== '_self' && target !== '_blank')) {
        target = elementDefaults.defaultProps?.target || '_self';
      }
      // Ensure target is always a valid value
      if (target !== '_self' && target !== '_blank') {
        target = '_self';
      }
      
      // Normalize href: add protocol if missing for external URLs
      if (href && href !== '#' && typeof href === 'string' && href.trim() !== '') {
        const trimmedHref = href.trim();
        // If it looks like a URL but doesn't have a protocol, add https://
        if (trimmedHref.includes('.') && 
            !trimmedHref.startsWith('http://') && 
            !trimmedHref.startsWith('https://') && 
            !trimmedHref.startsWith('mailto:') && 
            !trimmedHref.startsWith('tel:') && 
            !trimmedHref.startsWith('#') &&
            !trimmedHref.startsWith('/')) {
          href = `https://${trimmedHref}`;
        } else {
          href = trimmedHref;
        }
      }
      
      // Check if href is valid (not empty, not just '#')
      const hasValidHref = href && href !== '#' && (typeof href === 'string' && href.trim() !== '');
      
      // If button has valid href and not in builder mode, render as link styled as button
      if (hasValidHref && !builderMode) {
        // In custom sites, render link directly without any wrapper to ensure clicks work
        return (
          <a
            data-el-id={elId}
            data-el-type="button"
            href={href}
            target={target}
            rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            onClick={(e) => {
              // In custom sites, ensure navigation works
              // Stop propagation to prevent parent container handlers from interfering
              // But DON'T prevent default - let browser handle navigation
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // Stop mouseDown propagation to prevent parent handlers from interfering
              e.stopPropagation();
            }}
              style={(() => {
                // Check if colors are explicitly set (not CSS variables and not theme colors)
                const bgIsThemeColor = isThemeColor(elStyles.backgroundColor, 'button-bg');
                const hasExplicitBg = elStyles.backgroundColor && 
                  !elStyles.backgroundColor.startsWith('var(') &&
                  !bgIsThemeColor;
                
                const colorIsThemeText = isThemeColor(elStyles.color, 'button-text') || 
                  elStyles.color === '#ffffff' || 
                  elStyles.color === '#FFFFFF';
                const hasExplicitColor = elStyles.color && 
                  !elStyles.color.startsWith('var(') &&
                  !colorIsThemeText;
                
                // ALWAYS use CSS variables for buttons - they should respond to theme changes
                // Only use explicit colors if they're NOT theme colors (user explicitly set a custom color)
                const finalBg = (hasExplicitBg && !bgIsThemeColor)
                  ? elStyles.backgroundColor 
                  : 'var(--color-primary-bg, #2563eb)';
                const finalColor = (hasExplicitColor && !colorIsThemeText)
                  ? elStyles.color 
                  : 'var(--color-primary-text, #ffffff)';
                const finalBorder = elStyles.borderColor && !elStyles.borderColor.startsWith('var(') && !isThemeColor(elStyles.borderColor, 'button-bg')
                  ? elStyles.borderColor 
                  : 'var(--color-primary-bg, #2563eb)';

                return addMobileResponsiveStyles({
                  ...elementDefaults.defaultStyle,
                  ...elStyles,
                  // Apply theme colors
                  backgroundColor: finalBg,
                  color: finalColor,
                  borderColor: finalBorder || undefined,
                  // Ensure fontFamily is explicitly applied
                  // CRITICAL: fontFamily resolution (CANONICAL RULE)
                  // IF fontFamily exists → USE fontFamily (CUSTOM)
                  // ELSE → USE theme default font
                  fontFamily: (() => {
                    const customFont = (elStyles as any).fontFamily;
                    if (customFont && customFont.trim() !== '') {
                      return customFont;
                    }
                    // Theme default
                    return getDefaultFontFromTheme();
                  })(),
                  textDecoration: 'none',
                  display: 'inline-block',
                  outline: isSelected ? "1.5px solid #f97316" : (isHovered ? "1.5px solid rgba(249, 115, 22, 0.6)" : undefined),
                  outlineOffset: isSelected ? "2px" : (isHovered ? "2px" : undefined),
                  position: 'relative',
                  cursor: 'pointer',
                  pointerEvents: 'auto', // Ensure link is clickable
                  zIndex: 9999, // Very high z-index to ensure link is above all other elements
                  isolation: 'isolate', // Create new stacking context
                  transition: 'all 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease, outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
                  transform: 'scale(1)',
                  willChange: 'transform, box-shadow',
                }, 'button');
              })()}
            >
              {buttonText}
            </a>
        );
      }
      
      // In builder mode or no href, render as button
      return (
        <ElementWrapper containerStyle={{ display: 'inline-flex', width: '100%', justifyContent: 'center', pointerEvents: 'auto' }} isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <button
            data-el-id={elId}
            data-el-type="button"
            onClick={(e) => {
              if (builderMode) {
                // Don't prevent default on click - let active state show
                // Only stop propagation to prevent parent handlers
                e.stopPropagation();
                handleSelect(e, 'button');
              } else if (href && href !== '#' && href.trim() !== '') {
                // In non-builder mode with valid href, navigate
                e.preventDefault();
                e.stopPropagation(); // Stop propagation to prevent wrapper from interfering
                
                // Normalize href again for button clicks
                let normalizedHref = href.trim();
                if (normalizedHref.includes('.') && !normalizedHref.startsWith('http://') && !normalizedHref.startsWith('https://') && !normalizedHref.startsWith('mailto:') && !normalizedHref.startsWith('tel:') && !normalizedHref.startsWith('#')) {
                  normalizedHref = `https://${normalizedHref}`;
                }
                
                if (target === '_blank') {
                  window.open(normalizedHref, '_blank', 'noopener,noreferrer');
                } else if (normalizedHref.startsWith('#')) {
                  // Handle anchor links
                  const element = document.querySelector(normalizedHref);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    // Fallback: try to navigate to the hash
                    window.location.hash = normalizedHref;
                  }
                } else {
                  // Handle regular links
                  window.location.href = normalizedHref;
                }
              }
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                // Don't prevent default - let active state show for click animations
                // Only stop propagation to prevent parent handlers
                e.stopPropagation();
                // Don't call handleSelect here - let onClick handle it to avoid double selection
              } else if (href && href !== '#' && href.trim() !== '') {
                // In non-builder mode with valid href, don't prevent default - let click work
                e.stopPropagation(); // Just stop propagation, don't prevent default
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            type="button"
            style={(() => {
              // Check if colors are explicitly set (not CSS variables and not theme colors)
              // If a color matches a theme color, we should use CSS variables so it updates with theme changes
              const bgIsThemeColor = isThemeColor(elStyles.backgroundColor, 'button-bg');
              const hasExplicitBg = elStyles.backgroundColor && 
                !elStyles.backgroundColor.startsWith('var(') &&
                !bgIsThemeColor;
              
              // For text color, check if it's a theme button text color
              const colorIsThemeText = isThemeColor(elStyles.color, 'button-text') || 
                elStyles.color === '#ffffff' || 
                elStyles.color === '#FFFFFF';
              const hasExplicitColor = elStyles.color && 
                !elStyles.color.startsWith('var(') &&
                !colorIsThemeText;
              
              // ALWAYS use CSS variables for buttons - they should respond to theme changes
              // Only use explicit colors if they're NOT theme colors (user explicitly set a custom color)
              // Force CSS variables for buttons to ensure theme colors apply
              const finalBg = (hasExplicitBg && !bgIsThemeColor && elStyles.backgroundColor && !elStyles.backgroundColor.startsWith('var('))
                ? elStyles.backgroundColor 
                : 'var(--color-primary-bg, #2563eb)';
              const finalColor = (hasExplicitColor && !colorIsThemeText && elStyles.color && !elStyles.color.startsWith('var('))
                ? elStyles.color 
                : 'var(--color-primary-text, #ffffff)';
              const finalBorder = elStyles.borderColor && !elStyles.borderColor.startsWith('var(') && !isThemeColor(elStyles.borderColor, 'button-bg')
                ? elStyles.borderColor 
                : 'var(--color-primary-bg, #2563eb)';

              // Debug logging removed for performance

              // CRITICAL: Button font size resolution (CANONICAL RULE)
              // IF fontSize exists → USE fontSize (CUSTOM)
              // ELSE → USE theme default button font size
              let fontSizeToUse: string | undefined = undefined;
              if (elStyles.fontSize) {
                // Custom size
                fontSizeToUse = elStyles.fontSize;
              } else {
                // Theme default: get from theme data
                if (typeof window !== 'undefined') {
                  const themeData = (window as any).__THEME_DATA__;
                  fontSizeToUse = themeData?.buttonFontSize || '1rem';
                } else {
                  fontSizeToUse = '1rem';
                }
              }
              
              // Build button styles - prioritize CSS variables for theme colors
              // Start with default styles but exclude backgroundColor and color (we'll set them explicitly)
              const { backgroundColor: _, color: __, ...defaultStylesWithoutColors } = elementDefaults.defaultStyle;
              const { backgroundColor: ___, color: ____, ...elStylesWithoutColors } = elStyles;
              
              const buttonStyles = addMobileResponsiveStyles({
                ...defaultStylesWithoutColors,
                ...elStylesWithoutColors,
                // Apply resolved fontSize (canonical rule)
                fontSize: fontSizeToUse,
                // ALWAYS use CSS variables for buttons - force theme colors
                backgroundColor: finalBg,
                color: finalColor,
                borderColor: finalBorder || elStyles.border || undefined,
                  // Ensure fontFamily is explicitly applied
                  // CRITICAL: fontFamily resolution (CANONICAL RULE)
                  // IF fontFamily exists → USE fontFamily (CUSTOM)
                  // ELSE → USE theme default font
                  fontFamily: (() => {
                    const customFont = (elStyles as any).fontFamily;
                    if (customFont && customFont.trim() !== '') {
                      return customFont;
                    }
                    // Theme default
                    return getDefaultFontFromTheme();
                  })(),
                outline: isSelected ? "1.5px solid #f97316" : (isHovered ? "1.5px solid rgba(249, 115, 22, 0.6)" : undefined),
                outlineOffset: isSelected ? "2px" : (isHovered ? "2px" : undefined),
                position: 'relative',
                cursor: builderMode ? 'pointer' : (href ? 'pointer' : undefined),
                pointerEvents: 'auto', // Ensure button is clickable
                zIndex: 10, // Ensure button is above other elements
                transition: 'all 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease, outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
                transform: 'scale(1)',
                willChange: 'transform, box-shadow',
              }, 'button');
              
              // Force CSS variables if not already set (handle transparent/empty cases)
              const bgStr = String(buttonStyles.backgroundColor || '').trim();
              if (!buttonStyles.backgroundColor || 
                  bgStr === 'transparent' || 
                  bgStr === '' ||
                  bgStr === 'rgba(0,0,0,0)' ||
                  bgStr === 'rgba(0, 0, 0, 0)' ||
                  bgStr === '#ffffff' ||
                  bgStr === '#FFFFFF' ||
                  bgStr === 'white') {
                buttonStyles.backgroundColor = 'var(--color-primary-bg, #2563eb)';
              }
              const colorStr = String(buttonStyles.color || '').trim();
              if (!buttonStyles.color || 
                  colorStr === 'transparent' || 
                  colorStr === '' ||
                  colorStr === 'rgba(0,0,0,0)' ||
                  colorStr === 'rgba(0, 0, 0, 0)' ||
                  colorStr === '#000000' ||
                  colorStr === '#000' ||
                  colorStr === 'black') {
                buttonStyles.color = 'var(--color-primary-text, #ffffff)';
              }
              
              return buttonStyles;
            })()}
            // Hover and click animations are now handled via CSS, no need for inline handlers
          >
            {buttonText}
          </button>
        </ElementWrapper>
      );
    }

    case 'html': {
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <div
            data-el-id={elId}
            data-el-type="html"
            onClick={(e) => {
              e.preventDefault();
              handleSelect(e, 'html');
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                // Immediate selection on mousedown for smooth UX (like input/textarea)
                handleSelect(e, 'html');
              }
            }}
            dangerouslySetInnerHTML={{ __html: elProps.htmlContent || elementDefaults.defaultProps.htmlContent }}
            style={addMobileResponsiveStyles({
              ...elementDefaults.defaultStyle,
              ...elStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              cursor: builderMode ? 'pointer' : undefined,
              minHeight: builderMode ? '40px' : undefined,
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            }, 'html')}
          />
        </ElementWrapper>
      );
    }

    case 'container': {
      // Find children elements (elements with this container as parent)
      const childElements = sortedElements
        .filter(el => {
          // Check if element has parentElId matching this container's elId
          const parentElId = (el as any).parentElId;
          // Strict comparison to ensure exact match (handles undefined/null cases)
          return parentElId !== undefined && parentElId !== null && parentElId === elId;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // CONTAINER BACKGROUND: Support backgroundType (none | color | gradient | image)
      // Backward compatibility: infer backgroundType from existing properties
      const backgroundType = elStyles.backgroundType || (() => {
        if (elStyles.gradientColors) return 'gradient';
        if (elStyles.backgroundImage && elStyles.backgroundImage.trim() !== '') return 'image';
        if (elStyles.backgroundColor && elStyles.backgroundColor !== 'transparent' && elStyles.backgroundColor !== '') return 'color';
        return 'none';
      })();
      
      const bgImage = elStyles.backgroundImage;
      const bgImageOpacity = elStyles.backgroundImageOpacity !== undefined ? elStyles.backgroundImageOpacity : 1;
      const bgColor = elStyles.backgroundColor;
      const bgStr = String(bgColor || '').trim();
      
      // Determine background color (fallback when image has opacity or for color background)
      // CRITICAL: In builder mode, containers should have NO default background color - only show colors on hover/selection
      const containerBgColor = (() => {
        if (backgroundType === 'color' && bgColor && bgStr !== 'transparent' && bgStr !== '' && bgStr !== 'rgba(0,0,0,0)' && bgStr !== 'rgba(0, 0, 0, 0)') {
          if (bgColor.startsWith('var(') || isThemeColor(bgColor, 'surface')) {
            return bgColor.startsWith('var(') ? bgColor : 'var(--color-surface, #0E1214)';
          }
          return bgColor;
        }
        // For image/gradient backgrounds, use transparent
        if (backgroundType === 'image' || backgroundType === 'gradient') {
          return 'transparent';
        }
        // CRITICAL: No default background color - containers should be transparent by default
        // Colors only appear on hover/selection via ContainerHoverOverlay
        return 'transparent';
      })();
      
      // Build gradient background string
      const buildGradientBackground = (): string | null => {
        if (backgroundType !== 'gradient' || !elStyles.gradientColors) return null;
        try {
          const colors = typeof elStyles.gradientColors === 'string' 
            ? JSON.parse(elStyles.gradientColors) 
            : elStyles.gradientColors;
          const colorStops = Array.isArray(colors) 
            ? colors.map((c: any) => `${c.color || c} ${c.stop || ''}`).join(', ')
            : '';
          if (!colorStops) return null;
          
          const gradientType = elStyles.gradientType || 'linear';
          if (gradientType === 'radial') {
            return `radial-gradient(${elStyles.gradientDirection || 'center'}, ${colorStops})`;
          }
          // Linear gradient - use gradientAngle or gradientDirection
          const angle = elStyles.gradientAngle || elStyles.gradientDirection || '90deg';
          return `linear-gradient(${angle}, ${colorStops})`;
        } catch (e) {
          console.error('[Container] Error parsing gradient colors:', e);
          return null;
        }
      };
      
      const gradientBackground = buildGradientBackground();
      
      // Get container opacity (for background only, not children)
      const containerOpacity = elStyles.opacity !== undefined ? elStyles.opacity : 1;
      
      // Determine if we need special background rendering (image or gradient)
      const needsBackgroundRendering = (backgroundType === 'image' && bgImage && bgImage.trim() !== '') || 
                                       (backgroundType === 'gradient' && gradientBackground);
      
      if (needsBackgroundRendering) {
        const bgImageUrl = backgroundType === 'image' && bgImage 
          ? (bgImage.startsWith('url(') ? bgImage : `url('${bgImage}')`)
          : null;
        
        return (
          <ElementWrapper>
            {/* CRITICAL: Container wrapper - margin moves container, padding affects children */}
            <div
              data-el-id={elId}
              data-el-type={type}
              style={{
                // CRITICAL: Container margin moves container itself (Elementor behavior)
                // Support both shorthand margin and individual margin properties
                ...(elStyles.margin !== undefined 
                  ? { margin: elStyles.margin }
                  : {
                      marginTop: elStyles.marginTop !== undefined ? elStyles.marginTop : (elementDefaults.defaultStyle?.marginTop || undefined),
                      marginRight: elStyles.marginRight !== undefined ? elStyles.marginRight : (elementDefaults.defaultStyle?.marginRight || undefined),
                      marginBottom: elStyles.marginBottom !== undefined ? elStyles.marginBottom : (elementDefaults.defaultStyle?.marginBottom || undefined),
                      marginLeft: elStyles.marginLeft !== undefined ? elStyles.marginLeft : (elementDefaults.defaultStyle?.marginLeft || undefined),
                    }
                ),
                // CRITICAL: Responsive containment
                boxSizing: 'border-box',
                maxWidth: '100%',
                position: 'relative',
                // CRITICAL: Prevent margin collapse in builder mode
                ...(builderMode ? {
                  display: 'table',
                  width: '100%',
                } : {}),
              }}
            >
              {/* Container content layer - padding affects children */}
              <div
                data-el-type={type}
                data-display={elStyles.display || elementDefaults.defaultStyle?.display || (type === 'container' ? 'flex' : undefined)}
                data-flex-direction={elStyles.flexDirection}
                data-grid-columns={(elStyles as any).gridColumns}
                data-grid-cols-set={(elStyles.display === 'grid' && ((elStyles as any).gridColumns || elStyles.gridTemplateColumns)) ? 'true' : undefined}
                style={(() => {
                  const baseStyles = addMobileResponsiveStyles({
                    position: 'relative',
                    // CRITICAL: Container padding affects children (spacing inside container)
                    padding: elStyles.padding !== undefined ? elStyles.padding : undefined,
                    // CRITICAL: Responsive containment
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                    // Don't apply opacity here - it would affect children
                    // Container styles
                    // Start with defaults, but exclude layout-specific properties
                    ...(Object.keys(elementDefaults.defaultStyle || {}).reduce((acc, key) => {
                      const layoutProps = ['gridTemplateColumns', 'gridTemplateRows', 'flexDirection', 'justifyContent', 'alignItems', 'display', 'gap', 'backgroundColor', 'backgroundImage', 'opacity', 'margin', 'padding'];
                      if (layoutProps.includes(key)) {
                        return acc;
                      }
                      (acc as any)[key] = (elementDefaults.defaultStyle as any)[key];
                      return acc;
                    }, {} as React.CSSProperties)),
                    color: elStyles.color && !elStyles.color.startsWith('var(') && !isThemeColor(elStyles.color, 'heading')
                      ? elStyles.color
                      : (elStyles.color || 'var(--color-heading, #F8FAFC)'),
                    // Layout properties (will be added below)
                  }, type);
                  // CRITICAL: Explicitly remove opacity from main container div - it should NEVER be applied here
                  // Opacity is only applied to background layers, not the main container div
                  delete (baseStyles as any).opacity;
                  
                  // CONTAINER HOVER: Remove inline outline for containers in builder mode
                  // The ContainerHoverOverlay component handles container visualization
                  if (builderMode) {
                    delete (baseStyles as any).outline;
                    delete (baseStyles as any).outlineOffset;
                  }
                  
                  return baseStyles;
                })()}
              onClick={(e) => {
                // Only handle clicks in builder mode - in custom sites, let all clicks pass through
                if (!builderMode) {
                  // In custom sites, check if click is on an interactive element (button, link) and let it pass through
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                    return; // Let the click pass through to the link/button
                  }
                  return; // Don't interfere with clicks in custom sites
                }
                // CRITICAL: For sections, only select when clicking directly on section (not children)
                if (elId === 'section') {
                  if (e.target === e.currentTarget && __nodeId && __studio?.selectElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    __studio.selectElement(__nodeId, elId, type);
                  }
                } else {
                  // For other containers, normal selection
                  e.preventDefault();
                  handleSelect(e, type);
                }
              }}
              onMouseDown={(e) => {
                // Only handle mouseDown in builder mode - in custom sites, let all clicks pass through
                if (!builderMode) {
                  // In custom sites, check if click is on an interactive element (button, link) and let it pass through
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                    return; // Let the click pass through to the link/button
                  }
                  return; // Don't interfere with clicks in custom sites
                }
                // CRITICAL: For sections, only select when clicking directly on section (not children)
                if (elId === 'section') {
                  if (e.target === e.currentTarget && __nodeId && __studio?.selectElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    __studio.selectElement(__nodeId, elId, type);
                  }
                } else {
                  // For other containers, normal selection
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(e, type);
                }
              }}
              onContextMenu={(e) => {
                if (builderMode && __studio?.onElementContextMenu) {
                  e.preventDefault();
                  e.stopPropagation();
                  __studio.onElementContextMenu(e, elId, type);
                }
              }}
              onMouseEnter={(e) => {
                handleMouseEnter(e);
                // Container hover visualization is handled by ContainerHoverOverlay
              }}
              onMouseLeave={(e) => {
                handleMouseLeave(e);
              }}
            >
              {/* Background layers - apply only when backgroundType is not 'none' */}
              {backgroundType !== 'none' && (
                <>
                  {/* Background color layer (for color type or fallback) */}
                  {backgroundType === 'color' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: containerBgColor,
                        opacity: containerOpacity,
                        borderRadius: elStyles.borderRadius || '0',
                        overflow: elStyles.overflow === 'hidden' ? 'hidden' : undefined,
                        zIndex: 0,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  
                  {/* Background gradient layer */}
                  {backgroundType === 'gradient' && gradientBackground && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: gradientBackground,
                        backgroundSize: '100% 100%',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: containerOpacity,
                        borderRadius: elStyles.borderRadius || '0',
                        overflow: elStyles.overflow === 'hidden' ? 'hidden' : undefined,
                        zIndex: backgroundType === 'gradient' ? 0 : 1,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  
                  {/* Background image layer */}
                  {backgroundType === 'image' && bgImageUrl && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: bgImageUrl,
                        backgroundSize: elStyles.backgroundSize || 'cover',
                        backgroundPosition: elStyles.backgroundPosition || 'center',
                        backgroundRepeat: elStyles.backgroundRepeat || 'no-repeat',
                        // backgroundAttachment NOT supported for containers (only sections)
                        opacity: bgImageOpacity * containerOpacity,
                        borderRadius: elStyles.borderRadius || '0',
                        overflow: elStyles.overflow === 'hidden' ? 'hidden' : undefined,
                        zIndex: 1,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </>
              )}
              {/* Content layer - always at full opacity so children are not affected */}
              <div
                data-el-type={type}
                data-display={elStyles.display || elementDefaults.defaultStyle?.display || (type === 'container' ? 'flex' : undefined)}
                data-flex-direction={elStyles.flexDirection}
                data-grid-columns={(elStyles as any).gridColumns}
                data-grid-cols-set={(() => {
                  const display = elStyles.display || elementDefaults.defaultStyle?.display || (type === 'container' ? 'flex' : undefined);
                  return (display === 'grid' && ((elStyles as any).gridColumns || elStyles.gridTemplateColumns)) ? 'true' : undefined;
                })()}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  opacity: 1, // Explicitly set to 1 so children maintain their own opacity
                  // CRITICAL: Responsive containment - prevent children from escaping
                  boxSizing: 'border-box',
                  maxWidth: '100%',
                  // CRITICAL: Container padding affects children (spacing inside container)
                  padding: elStyles.padding !== undefined ? elStyles.padding : undefined,
                  // Apply all layout and other styles here
                  ...addMobileResponsiveStyles({
                    // Layout properties
                    ...(() => {
                      // AUTO-MIGRATION: Convert 'block' or 'box' to 'flex' for containers
                      // This ensures old pages with block/box containers continue to work
                      let actualDisplay = elStyles.display || elementDefaults.defaultStyle?.display || (type === 'container' ? 'flex' : undefined);
                      if (type === 'container' && (actualDisplay === 'block' || actualDisplay === 'box' || actualDisplay === undefined)) {
                        actualDisplay = 'flex'; // Force flex for containers
                      }
                      
                      if (actualDisplay === 'flex') {
                        const justifyContent = elStyles.justifyContent !== undefined && elStyles.justifyContent !== null && elStyles.justifyContent !== '' 
                          ? elStyles.justifyContent 
                          : (elementDefaults.defaultStyle?.justifyContent !== undefined ? elementDefaults.defaultStyle.justifyContent : 'flex-start');
                        const alignItems = elStyles.alignItems !== undefined && elStyles.alignItems !== null && elStyles.alignItems !== ''
                          ? elStyles.alignItems 
                          : (elementDefaults.defaultStyle?.alignItems !== undefined ? elementDefaults.defaultStyle.alignItems : 'flex-start');
                        
                        return {
                          display: 'flex',
                          flexDirection: elStyles.flexDirection !== undefined ? elStyles.flexDirection : (elementDefaults.defaultStyle?.flexDirection || 'column'),
                          flexWrap: elStyles.flexWrap !== undefined ? elStyles.flexWrap : (elementDefaults.defaultStyle?.flexWrap || 'wrap'), // REQUIRED for flex structure selector
                          justifyContent,
                          alignItems,
                          gap: elStyles.gap !== undefined ? elStyles.gap : (elementDefaults.defaultStyle?.gap || '16px'),
                          // CRITICAL: Remove ALL grid properties when flex
                          gridTemplateColumns: undefined,
                          gridTemplateRows: undefined,
                          gridGap: undefined,
                          gridAutoFlow: undefined,
                          gridAutoColumns: undefined,
                          gridAutoRows: undefined,
                          justifyItems: undefined,
                          gridColumn: undefined,
                          gridRow: undefined,
                        };
                      }
                      
                      if (actualDisplay === 'grid') {
                        // Get gridColumns value - can be string number ('1', '2', etc.) or 'auto'
                        const gridColumnsValue = (elStyles as any).gridColumns;
                        const gridRowsValue = (elStyles as any).gridRows;
                        
                        // Debug logging for grid layout
                        if (typeof window !== 'undefined' && (window as any).__DEV__) {
                          console.log(`[renderElement] Grid container ${elId} (content layer):`, {
                            display: actualDisplay,
                            gridColumnsValue,
                            gridRowsValue,
                            gridTemplateColumns: elStyles.gridTemplateColumns,
                            gridTemplateRows: elStyles.gridTemplateRows,
                            allElStyles: elStyles
                          });
                        }
                        
                        // Determine gridTemplateColumns
                        let gridTemplateColumns: string;
                        if (elStyles.gridTemplateColumns) {
                          // User explicitly set gridTemplateColumns, use it
                          gridTemplateColumns = elStyles.gridTemplateColumns;
                        } else if (gridColumnsValue === 'auto' || gridColumnsValue === undefined || gridColumnsValue === null || gridColumnsValue === '') {
                          // Auto or empty - use auto-fit
                          gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                        } else {
                          // Convert gridColumns (string number) to gridTemplateColumns
                          const numColumns = parseInt(String(gridColumnsValue), 10);
                          if (!isNaN(numColumns) && numColumns > 0) {
                            // Use minmax(0, 1fr) for symmetric, equal-width columns
                            gridTemplateColumns = `repeat(${numColumns}, minmax(0, 1fr))`;
                          } else {
                            gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                          }
                        }
                        
                        // Determine gridTemplateRows
                        let gridTemplateRows: string;
                        if (elStyles.gridTemplateRows) {
                          gridTemplateRows = elStyles.gridTemplateRows;
                        } else if (gridRowsValue === 'auto' || gridRowsValue === undefined || gridRowsValue === null || gridRowsValue === '') {
                          gridTemplateRows = 'auto';
                        } else {
                          const numRows = parseInt(String(gridRowsValue), 10);
                          if (!isNaN(numRows) && numRows > 0) {
                            gridTemplateRows = `repeat(${numRows}, auto)`;
                          } else {
                            gridTemplateRows = 'auto';
                          }
                        }
                        
                        // Grid will be made responsive via CSS media queries
                        // Debug logging disabled for performance
                        // if (typeof window !== 'undefined' && (window as any).__DEV__) {
                        //   console.log(`[renderElement] Final grid layout (content layer) for ${elId}:`, {
                        //     display: 'grid',
                        //     gridTemplateColumns,
                        //     gridTemplateRows,
                        //     gridColumnsValue,
                        //     elStylesGridTemplateColumns: elStyles.gridTemplateColumns,
                        //   });
                        // }
                        
                        return {
                          display: 'grid',
                          // CRITICAL: Set gridTemplateColumns - this MUST be applied as inline style to override CSS
                          gridTemplateColumns: gridTemplateColumns,
                          gridTemplateRows,
                          gap: elStyles.gap !== undefined ? getResponsiveGap(elStyles.gap as string | number) : getResponsiveGap(elementDefaults.defaultStyle?.gap || '16px'),
                          // CRITICAL: Ensure items flow row by row (default, but explicit is better)
                          gridAutoFlow: elStyles.gridAutoFlow || 'row',
                          justifyContent: elStyles.justifyContent !== undefined && elStyles.justifyContent !== null && elStyles.justifyContent !== ''
                            ? elStyles.justifyContent 
                            : (elementDefaults.defaultStyle?.justifyContent !== undefined ? elementDefaults.defaultStyle.justifyContent : 'start'),
                          alignItems: elStyles.alignItems !== undefined && elStyles.alignItems !== null && elStyles.alignItems !== ''
                            ? elStyles.alignItems 
                            : (elementDefaults.defaultStyle?.alignItems !== undefined ? elementDefaults.defaultStyle.alignItems : 'start'),
                          // CRITICAL: Remove ALL flex-specific properties when grid
                          flexDirection: undefined,
                          flex: undefined,
                          flexWrap: undefined,
                          flexGrow: undefined,
                          flexShrink: undefined,
                          flexBasis: undefined,
                          alignContent: undefined, // flex-specific
                        };
                      }
                      
                      // Block display removed for containers - auto-migrated to flex above
                      // This block handler is kept for non-container elements (e.g., label, badge)
                      if (actualDisplay === 'block' && type !== 'container') {
                        return {
                          display: 'block',
                          // CRITICAL: Remove ALL flex and grid properties when block
                          flexDirection: undefined,
                          flex: undefined,
                          flexWrap: undefined,
                          flexGrow: undefined,
                          flexShrink: undefined,
                          flexBasis: undefined,
                          justifyContent: undefined,
                          alignItems: undefined,
                          alignContent: undefined,
                          gap: undefined,
                          gridTemplateColumns: undefined,
                          gridTemplateRows: undefined,
                          gridGap: undefined,
                          gridAutoFlow: undefined,
                          gridAutoColumns: undefined,
                          gridAutoRows: undefined,
                          justifyItems: undefined,
                        };
                      }
                      
                      return {};
                    })(),
                    // Other styles
                    // CRITICAL: NO default padding - padding should only be applied if explicitly set by user
                    // Layout containers should have NO padding, only content containers should have padding
                    padding: elStyles.padding !== undefined ? elStyles.padding : undefined,
                    borderRadius: elStyles.borderRadius !== undefined ? elStyles.borderRadius : (elementDefaults.defaultStyle?.borderRadius || '0'),
                    border: elStyles.border !== undefined ? elStyles.border : (elementDefaults.defaultStyle?.border || 'none'),
                    // CRITICAL: Container width behavior
                    // Layout containers: width: 100%, no maxWidth by default
                    // Content containers: width: 100%, maxWidth if set, margin: 0 auto if maxWidth
                    // Grid children: width: auto, maxWidth: none
                    width: isGridChild 
                      ? (elStyles.width !== undefined ? elStyles.width : 'auto')
                      : (elStyles.width !== undefined ? elStyles.width : '100%'),
                    height: elStyles.height !== undefined ? elStyles.height : (elementDefaults.defaultStyle?.height || 'auto'),
                    minHeight: elStyles.minHeight !== undefined ? elStyles.minHeight : (elementDefaults.defaultStyle?.minHeight || 'auto'),
                    // CRITICAL: For grid children, don't force maxWidth - let grid handle sizing
                    maxWidth: isGridChild
                      ? (elStyles.maxWidth !== undefined ? elStyles.maxWidth : 'none')
                      : (elStyles.maxWidth !== undefined ? elStyles.maxWidth : undefined), // No default maxWidth for containers
                    // CRITICAL: Center content containers when maxWidth is set
                    margin: (elStyles.maxWidth && !isGridChild) ? '0 auto' : (elStyles.margin || undefined),
                    cursor: builderMode ? 'pointer' : undefined,
                  }, type),
                }}
              >
                {/* CONTAINER OVERLAY: Chrome DevTools-style highlighting */}
                {builderMode && type === 'container' && (isSelected || isHovered) && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      border: `2px solid rgba(22, 163, 74, ${isSelected ? 1 : 0.6})`,
                      backgroundColor: `rgba(22, 163, 74, ${isSelected ? 0.06 : 0.04})`,
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                      zIndex: 1001,
                    }}
                  />
                )}
                {/* GRID INTERNAL LAYOUT: Show column and row lines for grid containers */}
                {builderMode && type === 'container' && (() => {
                  const display = elStyles.display || elementDefaults.defaultStyle?.display || 'flex';
                  // ONLY show layout lines when THIS container is selected/hovered (not children)
                  if (display === 'grid' && (isSelected || isHovered)) {
                    // Calculate grid columns
                    const gridColumnsValue = (elStyles as any).gridColumns;
                    let numColumns = 1;
                    if (gridColumnsValue && typeof gridColumnsValue === 'string' && !isNaN(parseInt(gridColumnsValue))) {
                      numColumns = parseInt(gridColumnsValue);
                    } else if (elStyles.gridTemplateColumns) {
                      // Try to extract number from gridTemplateColumns (e.g., "repeat(3, 1fr)" -> 3)
                      const match = elStyles.gridTemplateColumns.match(/repeat\((\d+)/);
                      if (match) {
                        numColumns = parseInt(match[1]);
                      }
                    }
                    
                    // Calculate grid rows
                    let numRows = 1;
                    if (elStyles.gridTemplateRows) {
                      const match = elStyles.gridTemplateRows.match(/repeat\((\d+)/);
                      if (match) {
                        numRows = parseInt(match[1]);
                      }
                    }
                    
                    const gap = elStyles.gap || '16px';
                    const gapValue = typeof gap === 'string' ? parseFloat(gap) || 16 : gap;
                    const columnGap = (elStyles as any).columnGap || gap;
                    const rowGap = (elStyles as any).rowGap || gap;
                    const columnGapValue = typeof columnGap === 'string' ? parseFloat(columnGap) || 16 : columnGap;
                    const rowGapValue = typeof rowGap === 'string' ? parseFloat(rowGap) || 16 : rowGap;
                    
                    // Build column dividers (vertical lines)
                    const columnDividers: string[] = [];
                    if (numColumns > 1) {
                      for (let i = 1; i < numColumns; i++) {
                        const position = `calc(${i} * (100% / ${numColumns}) + ${(i - 0.5) * columnGapValue}px)`;
                        columnDividers.push(`transparent 0, transparent calc(${position} - 0.5px), rgba(147, 51, 234, 0.45) calc(${position} - 0.5px), rgba(147, 51, 234, 0.45) calc(${position} + 0.5px), transparent calc(${position} + 0.5px)`);
                      }
                    }
                    
                    // Build row dividers (horizontal lines)
                    const rowDividers: string[] = [];
                    if (numRows > 1) {
                      for (let i = 1; i < numRows; i++) {
                        const position = `calc(${i} * (100% / ${numRows}) + ${(i - 0.5) * rowGapValue}px)`;
                        rowDividers.push(`transparent 0, transparent calc(${position} - 0.5px), rgba(147, 51, 234, 0.45) calc(${position} - 0.5px), rgba(147, 51, 234, 0.45) calc(${position} + 0.5px), transparent calc(${position} + 0.5px)`);
                      }
                    }
                    
                    // Combine column and row gradients
                    const backgrounds: string[] = [];
                    if (columnDividers.length > 0) {
                      backgrounds.push(`linear-gradient(to right, ${columnDividers.join(', ')})`);
                    }
                    if (rowDividers.length > 0) {
                      backgrounds.push(`linear-gradient(to bottom, ${rowDividers.join(', ')})`);
                    }
                    
                    if (backgrounds.length > 0) {
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: backgrounds.join(', '),
                            pointerEvents: 'none',
                            zIndex: 1000, // Below container overlay
                          }}
                        />
                      );
                    }
                  }
                  return null;
                })()}
                {/* FLEX INTERNAL LAYOUT: Show flow direction lines for flex containers */}
                {builderMode && type === 'container' && (() => {
                  const display = elStyles.display || elementDefaults.defaultStyle?.display || 'flex';
                  // ONLY show layout lines when THIS container is selected/hovered (not children)
                  if (display === 'flex' && (isSelected || isHovered)) {
                    const flexDirection = elStyles.flexDirection || 'row';
                    const gap = elStyles.gap || '16px';
                    const gapValue = typeof gap === 'string' ? parseFloat(gap) || 16 : gap;
                    
                    // Show main axis flow line
                    const isRow = flexDirection === 'row' || flexDirection === 'row-reverse';
                    const isColumn = flexDirection === 'column' || flexDirection === 'column-reverse';
                    
                    // Show subtle dashed lines between children (optional)
                    // This will be handled by a separate overlay that shows child separators
                    const flowLineColor = 'rgba(22, 163, 74, 0.35)';
                    
                    // Main axis indicator line (center of container)
                    return (
                      <>
                        {/* Main axis flow line */}
                        <div
                          style={{
                            position: 'absolute',
                            ...(isRow ? {
                              top: '50%',
                              left: 0,
                              right: 0,
                              height: '1px',
                              transform: 'translateY(-50%)',
                              background: `repeating-linear-gradient(to right, ${flowLineColor} 0, ${flowLineColor} 8px, transparent 8px, transparent 16px)`,
                            } : {
                              left: '50%',
                              top: 0,
                              bottom: 0,
                              width: '1px',
                              transform: 'translateX(-50%)',
                              background: `repeating-linear-gradient(to bottom, ${flowLineColor} 0, ${flowLineColor} 8px, transparent 8px, transparent 16px)`,
                            }),
                            pointerEvents: 'none',
                            zIndex: 1000, // Below container overlay
                          }}
                        />
                      </>
                    );
                  }
                  return null;
                })()}
                {/* LAYOUT TYPE BADGE: Show FLEX/GRID badge on containers ONLY when selected or hovered (Chrome DevTools style) */}
                {builderMode && type === 'container' && (isSelected || isHovered) && (() => {
                  const display = elStyles.display || elementDefaults.defaultStyle?.display || 'flex';
                  if (display === 'flex' || display === 'grid') {
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          zIndex: 1002,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: display === 'flex' ? 'rgba(22, 163, 74, 0.8)' : 'rgba(147, 51, 234, 0.8)',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 600,
                          pointerEvents: 'none',
                          textTransform: 'uppercase',
                          opacity: 0.8,
                        }}
                      >
                        {display === 'flex' ? 'FLEX' : 'GRID'}
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Render child elements inside container */}
                {childElements.length > 0 ? childElements.map((childElement, childIdx) => {
                  const childElId = childElement.elId;
                  // Get child element props and styles using helper functions - MUST pass store functions!
                  const childElProps = getElementProps(childElId, childElement.type, __studio?.getElementProps, fallbackValues);
                  const childElStyles = getElementStyle(childElId, childElement.type, __studio?.getElementStyle);
                  const childIsSelected = isElementSelected(childElId, __nodeId, __studio?.selectedEl);
                  
                  // Determine if parent is a grid container
                  const parentDisplay = elStyles.display || elementDefaults.defaultStyle?.display || (type === 'container' ? 'flex' : undefined);
                  const parentIsGrid = parentDisplay === 'grid';
                  
                  // For grid containers, children should be direct grid items (no wrapper div with width: 100%)
                  // For flex/block containers, wrap children in a div for proper layout
                  if (parentIsGrid) {
                    // Grid child - render directly without wrapper div
                    return (
                      <React.Fragment key={childElement.id || childElId}>
                        {renderElement({
                          element: childElement,
                          elementIdx: childIdx,
                          sortedElements: sortedElements,
                          elProps: childElProps,
                          elStyles: childElStyles,
                          isSelected: childIsSelected,
                          builderMode,
                          __nodeId,
                          __studio,
                          elementOverrides: {
                            ...elementOverrides,
                            [childElement.type]: {
                              ...(elementOverrides[childElement.type] || {}),
                              _parentDisplay: 'grid',
                            },
                          },
                          fallbackValues,
                          customRenderers
                        })}
                      </React.Fragment>
                    );
                  } else {
                    // Flex/Block container - wrap in div for proper layout
                    // CRITICAL: Wrapper div must NOT inherit parent container's padding/margin
                    // Only apply layout-related styles, never spacing styles
                    return (
                      <div 
                        key={childElement.id || childElId} 
                        style={{ 
                          position: 'relative', 
                          width: '100%',
                          // EXPLICITLY prevent style inheritance from parent
                          padding: 0,
                          margin: 0,
                        }}
                      >
                        {renderElement({
                          element: childElement,
                          elementIdx: childIdx,
                          sortedElements: sortedElements,
                          elProps: childElProps,
                          elStyles: childElStyles, // Child's own styles, not parent's
                          isSelected: childIsSelected,
                          builderMode,
                          __nodeId,
                          __studio,
                          elementOverrides,
                          fallbackValues,
                          customRenderers
                        })}
                      </div>
                    );
                  }
                }) : null}
                </div>
              </div>
            </div>
          </ElementWrapper>
        );
      }
      
      // Standard rendering (no special background image/gradient handling needed)
      // CONTAINER BACKGROUND: Support backgroundType (none | color | gradient | image)
      // Backward compatibility: infer backgroundType from existing properties
      const backgroundTypeNoBg = elStyles.backgroundType || (() => {
        if (elStyles.gradientColors) return 'gradient';
        if (elStyles.backgroundImage && elStyles.backgroundImage.trim() !== '') return 'image';
        if (elStyles.backgroundColor && elStyles.backgroundColor !== 'transparent' && elStyles.backgroundColor !== '') return 'color';
        return 'none';
      })();
      
      const bgImageNoBg = elStyles.backgroundImage;
      const bgImageOpacityNoBg = elStyles.backgroundImageOpacity !== undefined ? elStyles.backgroundImageOpacity : 1;
      const bgColorNoBg = elStyles.backgroundColor;
      const bgStrNoBg = String(bgColorNoBg || '').trim();
      
      // Determine background color
      // CRITICAL: In builder mode, containers should have NO default background color - only show colors on hover/selection
      const containerBgColorNoBg = (() => {
        if (backgroundTypeNoBg === 'color' && bgColorNoBg && bgStrNoBg !== 'transparent' && bgStrNoBg !== '' && bgStrNoBg !== 'rgba(0,0,0,0)' && bgStrNoBg !== 'rgba(0, 0, 0, 0)') {
          if (bgColorNoBg.startsWith('var(') || isThemeColor(bgColorNoBg, 'surface')) {
            return bgColorNoBg.startsWith('var(') ? bgColorNoBg : 'var(--color-surface, #0E1214)';
          }
          return bgColorNoBg;
        }
        if (backgroundTypeNoBg === 'image' || backgroundTypeNoBg === 'gradient') {
          return 'transparent';
        }
        // CRITICAL: No default background color - containers should be transparent by default
        // Colors only appear on hover/selection via ContainerHoverOverlay
        return 'transparent';
      })();
      
      // Build gradient background string
      const buildGradientBackgroundNoBg = (): string | null => {
        if (backgroundTypeNoBg !== 'gradient' || !elStyles.gradientColors) return null;
        try {
          const colors = typeof elStyles.gradientColors === 'string' 
            ? JSON.parse(elStyles.gradientColors) 
            : elStyles.gradientColors;
          const colorStops = Array.isArray(colors) 
            ? colors.map((c: any) => `${c.color || c} ${c.stop || ''}`).join(', ')
            : '';
          if (!colorStops) return null;
          
          const gradientType = elStyles.gradientType || 'linear';
          if (gradientType === 'radial') {
            return `radial-gradient(${elStyles.gradientDirection || 'center'}, ${colorStops})`;
          }
          const angle = elStyles.gradientAngle || elStyles.gradientDirection || '90deg';
          return `linear-gradient(${angle}, ${colorStops})`;
        } catch (e) {
          console.error('[Container] Error parsing gradient colors:', e);
          return null;
        }
      };
      
      const gradientBackgroundNoBg = buildGradientBackgroundNoBg();
      const bgImageUrlNoBg = backgroundTypeNoBg === 'image' && bgImageNoBg 
        ? (bgImageNoBg.startsWith('url(') ? bgImageNoBg : `url('${bgImageNoBg}')`)
        : null;
      
      // Get container opacity (for background only, not children)
      const containerOpacityNoBg = elStyles.opacity !== undefined ? elStyles.opacity : 1;
      
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <div
            data-el-id={elId}
            onClick={(e) => {
              // Only handle clicks in builder mode - in custom sites, let all clicks pass through
              if (!builderMode) {
                // In custom sites, check if click is on an interactive element (button, link) and let it pass through
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                  return; // Let the click pass through to the link/button
                }
                return; // Don't interfere with clicks in custom sites
              }
              e.preventDefault();
              handleSelect(e, type);
            }}
            onMouseDown={(e) => {
              // Only handle mouseDown in builder mode - in custom sites, let all clicks pass through
              if (!builderMode) {
                // In custom sites, check if click is on an interactive element (button, link) and let it pass through
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                  return; // Let the click pass through to the link/button
                }
                return; // Don't interfere with clicks in custom sites
              }
              e.preventDefault();
              e.stopPropagation();
              handleSelect(e, type);
            }}
            onContextMenu={(e) => {
              if (builderMode && __studio?.onElementContextMenu) {
                e.preventDefault();
                e.stopPropagation();
                __studio.onElementContextMenu(e, elId, type);
              }
            }}
            style={(() => {
              const baseStyles = addMobileResponsiveStyles({
                position: 'relative',
                // CRITICAL: Main container div should NOT have display/flex/grid properties
                // These should ONLY be on the inner content layer div
                // Don't apply opacity here - it would affect children
                // Container styles - exclude ALL layout properties
                ...(Object.keys(elementDefaults.defaultStyle || {}).reduce((acc, key) => {
                  // Exclude ALL layout properties - they go on the inner content layer, not the main container
                  const layoutProps = ['gridTemplateColumns', 'gridTemplateRows', 'flexDirection', 'justifyContent', 'alignItems', 'display', 'gap', 'gridAutoFlow', 'gridGap', 'backgroundColor', 'opacity', 'flex', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis'];
                  if (layoutProps.includes(key)) {
                    return acc; // Skip these - they'll be set on the inner content layer div
                  }
                  (acc as any)[key] = (elementDefaults.defaultStyle as any)[key];
                  return acc;
                }, {} as React.CSSProperties)),
                // Ensure text color is set for containers (light text on dark background)
                color: elStyles.color && !elStyles.color.startsWith('var(') && !isThemeColor(elStyles.color, 'heading')
                  ? elStyles.color
                  : (elStyles.color || 'var(--color-heading, #F8FAFC)'),
                // IMPORTANT: Apply elStyles AFTER base styles, but EXCLUDE ALL layout properties
                // Layout properties (display, grid, flex) should ONLY be on the inner content layer div, NOT the outer container
                // Also exclude opacity and backgroundColor (handled by background layers)
                ...(Object.keys(elStyles || {}).reduce((acc, key) => {
                  // CRITICAL: Exclude ALL layout properties and padding from outer container - they go on inner content layer only
                  // Margin stays on outer container (moves container), padding goes on inner (affects children)
                  const layoutProps = ['display', 'flexDirection', 'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns', 'gridTemplateRows', 'gridAutoFlow', 'gridGap', 'gridAutoColumns', 'gridAutoRows', 'justifyItems', 'gridColumn', 'gridRow', 'flex', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis', 'alignContent', 'opacity', 'backgroundColor', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
                  if (layoutProps.includes(key)) {
                    return acc; // Skip - these go on inner content layer div only, not outer container
                  }
                  
                  (acc as any)[key] = (elStyles as any)[key];
                  return acc;
                }, {} as React.CSSProperties)),
                // Remove non-CSS properties from final styles
                ...((elStyles as any).itemsPerRow ? { itemsPerRow: undefined } : {}),
                ...((elStyles as any).gridColumns ? { gridColumns: undefined } : {}),
                ...((elStyles as any).gridRows ? { gridRows: undefined } : {}),
                // FIX ISSUE 1: Remove legacy selection outline for containers
                // Container selection is handled by ContainerHoverOverlay system
                outline: undefined, // Containers use overlay system, not legacy outline
                outlineOffset: undefined,
                cursor: builderMode ? 'pointer' : undefined,
                minHeight: builderMode ? '40px' : undefined,
                transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
              }, type);
              // CRITICAL: Explicitly remove opacity from main container div - it should NEVER be applied here
              // Opacity is only applied to background layers, not the main container div
              delete (baseStyles as any).opacity;
              return baseStyles;
            })()}
          >
            {/* Background layers - apply only when backgroundType is not 'none' */}
            {backgroundTypeNoBg !== 'none' && (
              <>
                {/* Background color layer (for color type or fallback) */}
                {backgroundTypeNoBg === 'color' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: containerBgColorNoBg,
                      opacity: containerOpacityNoBg,
                      borderRadius: elStyles.borderRadius || '0',
                      overflow: elStyles.overflow === 'hidden' ? 'hidden' : undefined,
                      zIndex: 0,
                      pointerEvents: 'none',
                    }}
                  />
                )}
                
                {/* Background gradient layer */}
                {backgroundTypeNoBg === 'gradient' && gradientBackgroundNoBg && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: gradientBackgroundNoBg,
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: containerOpacityNoBg,
                      borderRadius: elStyles.borderRadius || '0',
                      overflow: elStyles.overflow === 'hidden' ? 'hidden' : undefined,
                      zIndex: 0,
                      pointerEvents: 'none',
                    }}
                  />
                )}
                
                {/* Background image layer */}
                {backgroundTypeNoBg === 'image' && bgImageUrlNoBg && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: bgImageUrlNoBg,
                      backgroundSize: elStyles.backgroundSize || 'cover',
                      backgroundPosition: elStyles.backgroundPosition || 'center',
                      backgroundRepeat: elStyles.backgroundRepeat || 'no-repeat',
                      // backgroundAttachment NOT supported for containers (only sections)
                      opacity: bgImageOpacityNoBg * containerOpacityNoBg,
                      borderRadius: elStyles.borderRadius || '0',
                      overflow: elStyles.overflow === 'hidden' ? 'hidden' : undefined,
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </>
            )}
            {/* Content layer - always at full opacity so children are not affected */}
            {/* CRITICAL: This div must have the same grid/flex layout as the main container */}
            <div
              data-el-type={type}
              data-display={elStyles.display || elementDefaults.defaultStyle?.display || (type === 'container' ? 'flex' : undefined)}
              data-flex-direction={elStyles.flexDirection}
              data-grid-columns={(elStyles as any).gridColumns}
              data-grid-cols-set={(() => {
                const display = elStyles.display || elementDefaults.defaultStyle?.display || (type === 'container' ? 'flex' : undefined);
                return (display === 'grid' && ((elStyles as any).gridColumns || elStyles.gridTemplateColumns)) ? 'true' : undefined;
              })()}
              style={{
                position: 'relative',
                zIndex: 1,
                opacity: 1, // Explicitly set to 1 so children maintain their own opacity
                // CRITICAL: Apply the same layout styles as the main container
                ...addMobileResponsiveStyles({
                  // Layout properties - same logic as content layer with background image
                  ...(() => {
                    const actualDisplay = elStyles.display || elementDefaults.defaultStyle?.display || (type === 'container' ? 'flex' : undefined);
                    
                    if (actualDisplay === 'flex') {
                      const justifyContent = elStyles.justifyContent !== undefined && elStyles.justifyContent !== null && elStyles.justifyContent !== '' 
                        ? elStyles.justifyContent 
                        : (elementDefaults.defaultStyle?.justifyContent !== undefined ? elementDefaults.defaultStyle.justifyContent : 'flex-start');
                      const alignItems = elStyles.alignItems !== undefined && elStyles.alignItems !== null && elStyles.alignItems !== ''
                        ? elStyles.alignItems 
                        : (elementDefaults.defaultStyle?.alignItems !== undefined ? elementDefaults.defaultStyle.alignItems : 'flex-start');
                      
                      return {
                        display: 'flex',
                        flexDirection: elStyles.flexDirection !== undefined ? elStyles.flexDirection : (elementDefaults.defaultStyle?.flexDirection || 'column'),
                        justifyContent,
                        alignItems,
                        gap: elStyles.gap !== undefined ? elStyles.gap : (elementDefaults.defaultStyle?.gap || '16px'),
                        // CRITICAL: Remove ALL grid properties when flex
                        gridTemplateColumns: undefined,
                        gridTemplateRows: undefined,
                        gridGap: undefined,
                        gridAutoFlow: undefined,
                        gridAutoColumns: undefined,
                        gridAutoRows: undefined,
                        justifyItems: undefined,
                        gridColumn: undefined,
                        gridRow: undefined,
                      };
                    }
                    
                    if (actualDisplay === 'grid') {
                      // Get gridColumns value - can be string number ('1', '2', etc.) or 'auto'
                      const gridColumnsValue = (elStyles as any).gridColumns;
                      const gridRowsValue = (elStyles as any).gridRows;
                      
                      // Determine gridTemplateColumns
                      // CRITICAL: Use minmax(0, 1fr) for symmetric column distribution
                      // This ensures equal column widths and proper row/column structure
                      let gridTemplateColumns: string;
                      if (elStyles.gridTemplateColumns) {
                        gridTemplateColumns = elStyles.gridTemplateColumns;
                      } else if (gridColumnsValue === 'auto' || gridColumnsValue === undefined || gridColumnsValue === null || gridColumnsValue === '') {
                        gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                      } else {
                        const numColumns = parseInt(String(gridColumnsValue), 10);
                        if (!isNaN(numColumns) && numColumns > 0) {
                          // Use minmax(0, 1fr) for symmetric, equal-width columns
                          gridTemplateColumns = `repeat(${numColumns}, minmax(0, 1fr))`;
                        } else {
                          gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                        }
                      }
                      
                      // Determine gridTemplateRows
                      let gridTemplateRows: string;
                      if (elStyles.gridTemplateRows) {
                        gridTemplateRows = elStyles.gridTemplateRows;
                      } else if (gridRowsValue === 'auto' || gridRowsValue === undefined || gridRowsValue === null || gridRowsValue === '') {
                        gridTemplateRows = 'auto';
                      } else {
                        const numRows = parseInt(String(gridRowsValue), 10);
                        if (!isNaN(numRows) && numRows > 0) {
                          gridTemplateRows = `repeat(${numRows}, auto)`;
                        } else {
                          gridTemplateRows = 'auto';
                        }
                      }
                      
                      // Debug logging disabled for performance
                      // console.log(`[renderElement] Content layer (no bg) grid layout for ${elId}:`, {
                      //   display: 'grid',
                      //   gridTemplateColumns,
                      //   gridTemplateRows,
                      //   gridColumnsValue,
                      // });
                      
                      return {
                        display: 'grid',
                        gridTemplateColumns: gridTemplateColumns,
                        gridTemplateRows,
                        gap: elStyles.gap !== undefined ? getResponsiveGap(elStyles.gap as string | number) : getResponsiveGap(elementDefaults.defaultStyle?.gap || '16px'),
                        // CRITICAL: Ensure items flow row by row (default, but explicit is better)
                        gridAutoFlow: elStyles.gridAutoFlow || 'row',
                        justifyContent: elStyles.justifyContent !== undefined && elStyles.justifyContent !== null && elStyles.justifyContent !== ''
                          ? elStyles.justifyContent 
                          : (elementDefaults.defaultStyle?.justifyContent !== undefined ? elementDefaults.defaultStyle.justifyContent : 'start'),
                        alignItems: elStyles.alignItems !== undefined && elStyles.alignItems !== null && elStyles.alignItems !== ''
                          ? elStyles.alignItems 
                          : (elementDefaults.defaultStyle?.alignItems !== undefined ? elementDefaults.defaultStyle.alignItems : 'start'),
                        // CRITICAL: Remove ALL flex-specific properties when grid
                        flexDirection: undefined,
                        flex: undefined,
                        flexWrap: undefined,
                        flexGrow: undefined,
                        flexShrink: undefined,
                        flexBasis: undefined,
                        alignContent: undefined, // flex-specific
                      };
                    }
                    
                    if (actualDisplay === 'block') {
                      return {
                        display: 'block',
                        // CRITICAL: Remove ALL flex and grid properties when block
                        flexDirection: undefined,
                        flex: undefined,
                        flexWrap: undefined,
                        flexGrow: undefined,
                        flexShrink: undefined,
                        flexBasis: undefined,
                        justifyContent: undefined,
                        alignItems: undefined,
                        alignContent: undefined,
                        gap: undefined,
                        gridTemplateColumns: undefined,
                        gridTemplateRows: undefined,
                        gridGap: undefined,
                        gridAutoFlow: undefined,
                        gridAutoColumns: undefined,
                        gridAutoRows: undefined,
                        justifyItems: undefined,
                      };
                    }
                    
                    return {};
                  })(),
                  // CRITICAL: Container padding affects children (spacing inside container)
                  padding: elStyles.padding !== undefined ? elStyles.padding : undefined,
                  borderRadius: elStyles.borderRadius !== undefined ? elStyles.borderRadius : (elementDefaults.defaultStyle?.borderRadius || '0'),
                  border: elStyles.border !== undefined ? elStyles.border : (elementDefaults.defaultStyle?.border || 'none'),
                }, type),
              }}
            >
            {/* Render child elements inside container */}
            {childElements.length > 0 ? childElements.map((childElement, childIdx) => {
              const childElId = childElement.elId;
              // Get child element props and styles using helper functions - MUST pass store functions!
              const childElProps = getElementProps(childElId, childElement.type, __studio?.getElementProps, fallbackValues);
              const childElStyles = getElementStyle(childElId, childElement.type, __studio?.getElementStyle);
              const childIsSelected = isElementSelected(childElId, __nodeId, __studio?.selectedEl);
              
              // CRITICAL: For grid containers, child elements must be DIRECT children of the grid
              // No wrapper div - the rendered element itself becomes the grid item
              // For non-grid containers (flex, block), we can use a wrapper for layout control
              const containerDisplay = elStyles.display || elementDefaults.defaultStyle?.display || (type === 'container' ? 'flex' : undefined);
              const isGridContainer = containerDisplay === 'grid';
              const isFlexContainer = containerDisplay === 'flex';
              
              // CRITICAL: Debug logging for grid container children
              if (typeof window !== 'undefined' && (window as any).__DEV__ && isGridContainer) {
                console.log(`[renderElement] Rendering grid child ${childElId} in container ${elId}:`, {
                  containerDisplay,
                  isGridContainer,
                  childElementType: childElement.type,
                  childElStyles,
                  gridColumns: (elStyles as any).gridColumns,
                  gridTemplateColumns: elStyles.gridTemplateColumns
                });
              }
              
              // BUILDER VISUALIZATION: For grid/flex containers, pass layout info to children
              // This allows children to render with cell-based visualization
              const layoutInfo = builderMode && (isGridContainer || isFlexContainer) ? {
                isGridChild: isGridContainer,
                isFlexChild: isFlexContainer,
                containerGap: elStyles.gap || '16px',
                gridColumns: (elStyles as any).gridColumns,
                gridTemplateColumns: elStyles.gridTemplateColumns,
                flexDirection: elStyles.flexDirection,
                childIndex: childIdx,
                totalChildren: childElements.length,
              } : undefined;
              
              const renderedChild = renderElement({
                element: childElement,
                elementIdx: childIdx,
                sortedElements: sortedElements, // Pass ALL elements, not just children, so nested containers can find their children
                elProps: childElProps,
                elStyles: childElStyles,
                isSelected: childIsSelected,
                builderMode,
                __nodeId,
                __studio,
                elementOverrides: {
                  ...elementOverrides,
                  // CRITICAL: Pass parent display type so ElementWrapper can adjust width for grid children
                  [childElement.type]: {
                    ...(elementOverrides[childElement.type] || {}),
                    _parentDisplay: containerDisplay, // Internal prop to indicate parent display type
                    _layoutInfo: layoutInfo, // Pass layout info for cell-based visualization
                  }
                },
                fallbackValues,
                customRenderers
              });
              
              // For grid containers: render child directly (no wrapper) so it becomes a grid item
              // For non-grid containers: wrap in a div for layout control
              if (isGridContainer) {
                // Grid item - render directly, no wrapper
                // Add a React key directly to the rendered element if it's a React element
                return React.isValidElement(renderedChild) 
                  ? React.cloneElement(renderedChild, { key: childElement.id || childElId } as any)
                  : <React.Fragment key={childElement.id || childElId}>{renderedChild}</React.Fragment>;
              } else {
                // Non-grid container - use wrapper for layout control
                return (
                  <div key={childElement.id || childElId} style={{ position: 'relative', width: '100%' }}>
                    {renderedChild}
                  </div>
                );
              }
            }) : null}
            </div>
          </div>
        </ElementWrapper>
      );
    }

    case 'list': {
      // Get list items - can be from textarea (newline-separated) or array
      let items: string[] = [];
      if (elProps.items) {
        if (typeof elProps.items === 'string') {
          // Split by newlines and filter empty lines
          items = elProps.items.split('\n').filter((item: string) => item.trim().length > 0);
        } else if (Array.isArray(elProps.items)) {
          items = elProps.items;
        }
      }
      
      // Fallback to default items if none provided
      if (items.length === 0) {
        items = elementDefaults.defaultProps.items || ['Item 1', 'Item 2', 'Item 3'];
      }
      
      // Get list type (ul or ol)
      const listType = elProps.listType || 'ul';
      const ListComponent = listType === 'ol' ? 'ol' : 'ul';
      
      // Get list style - map from elProps.listStyle or elStyles.listStyleType
      // CSS property is listStyleType, but we store it as listStyle in props
      const listStyleType = elProps.listStyle || elStyles.listStyleType || elementDefaults.defaultStyle.listStyleType || 'disc';
      
      // Build list styles - merge defaults with custom styles
      const listStyles: React.CSSProperties = addMobileResponsiveStyles({
        ...elementDefaults.defaultStyle,
        ...elStyles,
        listStyleType: listStyleType, // Apply list style type (disc, circle, decimal, etc.)
        // BUILDER VISUALIZATION: For grid/flex children, outline is shown on wrapper, not element
        outline: (isGridChild || isFlexChild) && builderMode ? undefined : (isSelected ? "2px solid #f97316" : undefined),
        outlineOffset: (isGridChild || isFlexChild) && builderMode ? undefined : (isSelected ? "2px" : undefined),
        position: 'relative',
        cursor: builderMode ? 'pointer' : undefined,
        paddingLeft: elStyles.paddingLeft || elementDefaults.defaultStyle.paddingLeft || '20px',
        margin: elStyles.margin || elementDefaults.defaultStyle.margin || '0',
        transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
      }, 'list');
      
      // Build item styles - mobile responsive
      const itemStyles: React.CSSProperties = {
        color: elStyles.color || elementDefaults.defaultStyle.color || '#0f172a',
        fontSize: elStyles.fontSize || elementDefaults.defaultStyle.fontSize || '1rem',
        padding: elStyles.padding || '4px 0',
        lineHeight: elStyles.lineHeight || elementDefaults.defaultStyle.lineHeight || '1.5',
        maxWidth: '100%',
        wordWrap: 'break-word' as const,
        overflowWrap: 'break-word' as const,
        boxSizing: 'border-box',
      };
      
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <ListComponent
            data-el-id={elId}
            data-el-type="list"
            onClick={(e) => {
              e.preventDefault();
              handleSelect(e, 'list');
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                // Immediate selection on mousedown for smooth UX (like input/textarea)
                handleSelect(e, 'list');
              }
            }}
            style={listStyles}
          >
            {items.map((item: string, idx: number) => (
              <li key={idx} style={itemStyles}>
                {item.trim()}
              </li>
            ))}
          </ListComponent>
        </ElementWrapper>
      );
    }

    case 'input': {
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <input
            data-el-id={elId}
            data-el-type="input"
            onClick={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(e, 'input');
              }
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.stopPropagation();
              }
            }}
            onFocus={(e) => {
              if (builderMode) {
                e.target.blur();
                handleSelect(e as any, 'input');
              }
            }}
            type={elProps.type || elementDefaults.defaultProps.type}
            placeholder={elProps.placeholder || elementDefaults.defaultProps.placeholder}
            readOnly={builderMode && !isSelected}
            style={addMobileResponsiveStyles({
              ...elementDefaults.defaultStyle,
              ...elStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              cursor: builderMode ? 'pointer' : undefined,
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            }, 'input')}
          />
        </ElementWrapper>
      );
    }

    case 'textarea': {
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <textarea
            data-el-id={elId}
            data-el-type="textarea"
            onClick={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(e, 'textarea');
              }
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.stopPropagation();
              }
            }}
            onFocus={(e) => {
              if (builderMode) {
                e.target.blur();
                handleSelect(e as any, 'textarea');
              }
            }}
            placeholder={elProps.placeholder || elementDefaults.defaultProps.placeholder}
            readOnly={builderMode && !isSelected}
            style={addMobileResponsiveStyles({
              ...elementDefaults.defaultStyle,
              ...elStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              cursor: builderMode ? 'pointer' : undefined,
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            }, 'textarea')}
          />
        </ElementWrapper>
      );
    }

    case 'select': {
      const options = elProps.options || elementDefaults.defaultProps.options || [];
      const selectValue = elProps.value || elProps.selectedValue || (options.length > 0 ? options[0] : '');
      
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <select
            data-el-id={elId}
            data-el-type="select"
            onClick={(e) => {
              // Stop propagation to prevent section selection
                e.stopPropagation();
              // Select element in builder mode (but don't prevent default - allow dropdown)
              if (builderMode) {
                handleSelect(e, 'select');
              }
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                // Select element immediately on mousedown for smooth UX
                e.stopPropagation();
                // Don't prevent default - allow native dropdown to open
                handleSelect(e, 'select');
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onChange={(e) => {
              if (builderMode && __studio?.updateCustomElementProps) {
                // Update props when value changes
                __studio.updateCustomElementProps(elId, {
                  ...elProps,
                  value: e.target.value,
                  selectedValue: e.target.value,
                });
              }
            }}
            value={selectValue}
            disabled={false} // Never disable - allow selection and interaction
            style={addMobileResponsiveStyles({
              ...elementDefaults.defaultStyle,
              ...elStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              cursor: builderMode ? 'pointer' : undefined,
              minHeight: builderMode ? '40px' : undefined,
              width: '100%',
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            }, 'select')}
          >
            {options.map((option: string, idx: number) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        </ElementWrapper>
      );
    }

    case 'label': {
      return (
        <ElementWrapper>
          <label
            data-el-id={elId}
            data-el-type="label"
            onClick={(e) => {
              e.preventDefault();
              handleSelect(e, 'label');
            }}
            onMouseDown={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
                // Immediate selection on mousedown for smooth UX (like input/textarea)
                handleSelect(e, 'label');
              }
            }}
            style={{
              ...elementDefaults.defaultStyle,
              ...elStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              cursor: builderMode ? 'pointer' : undefined,
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
              // Mobile responsive
              maxWidth: '100%',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              boxSizing: 'border-box',
            }}
          >
            {elProps.text || elementDefaults.defaultProps.text}
          </label>
        </ElementWrapper>
      );
    }

    default:
      // Fallback for unknown element types
      return (
        <ElementWrapper isGridChild={isGridChild} isFlexChild={isFlexChild}>
          <div
            data-el-id={elId}
            onClick={(e) => handleSelect(e, type)}
            style={addMobileResponsiveStyles({
              ...elStyles,
              // Element overlays are handled in ElementWrapper
              position: 'relative',
              padding: '8px',
              border: '1px dashed #ccc',
              transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
            }, type)}
          >
            Unknown element type: {type}
          </div>
        </ElementWrapper>
      );
  }
}

