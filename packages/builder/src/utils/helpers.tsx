'use client';

// Helper function to parse CSS value and extract number and unit
export const parseValue = (value: string): { num: number; unit: string } => {
  if (!value || value.trim() === '') return { num: 0, unit: 'px' };
  const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
  if (match) {
    return { num: parseFloat(match[1]) || 0, unit: match[2] || 'px' };
  }
  return { num: 0, unit: 'px' };
};

// Helper function to format value with unit
export const formatValue = (num: number, unit: string): string => {
  if (num === 0) return '';
  return `${num}${unit}`;
};

// Keyboard handler for number inputs
export const handleNumberKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  currentValue: string,
  onChange: (value: string) => void,
  step: number = 1,
  shiftStep: number = 10,
  ctrlStep: number = 50
) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    const { num, unit } = parseValue(currentValue);
    const increment = e.shiftKey 
      ? (e.key === 'ArrowUp' ? shiftStep : -shiftStep)
      : e.ctrlKey || e.metaKey
      ? (e.key === 'ArrowUp' ? ctrlStep : -ctrlStep)
      : (e.key === 'ArrowUp' ? step : -step);
    const newValue = formatValue(num + increment, unit);
    onChange(newValue);
  }
};

// General keyboard handler for all inputs (Enter to blur, Escape to cancel)
export const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.currentTarget.blur();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.currentTarget.blur();
  }
};

// Helper function to build box shadow CSS
export const buildBoxShadow = (styles: any) => {
  if (styles.boxShadow) return styles.boxShadow;
  if (styles.boxShadowColor || styles.boxShadowBlur || styles.boxShadowOffsetX || styles.boxShadowOffsetY) {
    const offsetX = styles.boxShadowOffsetX || '0px';
    const offsetY = styles.boxShadowOffsetY || '0px';
    const blur = styles.boxShadowBlur || '0px';
    const spread = styles.boxShadowSpread || '0px';
    const color = styles.boxShadowColor || 'rgba(0, 0, 0, 0.1)';
    return `${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
  }
  return undefined;
};

// Helper function to build border CSS
export const buildBorderStyle = (styles: any) => {
  const borderStyle: any = {};
  
  if (styles.borderWidth) {
    borderStyle.borderWidth = styles.borderWidth;
    borderStyle.borderStyle = styles.borderStyle || 'solid';
    borderStyle.borderColor = styles.borderColor || '#000000';
  } else {
    if (styles.borderTopWidth) {
      borderStyle.borderTopWidth = styles.borderTopWidth;
      borderStyle.borderTopStyle = styles.borderTopStyle || styles.borderStyle || 'solid';
      borderStyle.borderTopColor = styles.borderTopColor || styles.borderColor || '#000000';
    }
    if (styles.borderRightWidth) {
      borderStyle.borderRightWidth = styles.borderRightWidth;
      borderStyle.borderRightStyle = styles.borderRightStyle || styles.borderStyle || 'solid';
      borderStyle.borderRightColor = styles.borderRightColor || styles.borderColor || '#000000';
    }
    if (styles.borderBottomWidth) {
      borderStyle.borderBottomWidth = styles.borderBottomWidth;
      borderStyle.borderBottomStyle = styles.borderBottomStyle || styles.borderStyle || 'solid';
      borderStyle.borderBottomColor = styles.borderBottomColor || styles.borderColor || '#000000';
    }
    if (styles.borderLeftWidth) {
      borderStyle.borderLeftWidth = styles.borderLeftWidth;
      borderStyle.borderLeftStyle = styles.borderLeftStyle || styles.borderStyle || 'solid';
      borderStyle.borderLeftColor = styles.borderLeftColor || styles.borderColor || '#000000';
    }
  }
  
  if (styles.borderRadius) {
    borderStyle.borderRadius = styles.borderRadius;
  }
  
  return borderStyle;
};

// Helper to get styles for current breakpoint
export const getBreakpointStyles = (styles: any, activeBreakpoint: 'desktop' | 'tablet' | 'mobile' = 'desktop') => {
  if (!styles) return {};
  
  // Start with base styles
  const baseStyles = { ...styles };
  delete baseStyles.mobile;
  delete baseStyles.tablet;
  delete baseStyles.desktop;
  
  // Apply breakpoint-specific overrides
  let mergedStyles;
  if (activeBreakpoint === 'mobile' && styles.mobile) {
    mergedStyles = { ...baseStyles, ...styles.mobile };
  } else if (activeBreakpoint === 'tablet' && styles.tablet) {
    mergedStyles = { ...baseStyles, ...styles.tablet };
  } else if (activeBreakpoint === 'desktop') {
    // Desktop uses base styles, or desktop-specific if exists
    if (styles.desktop) {
      mergedStyles = { ...baseStyles, ...styles.desktop };
    } else {
      mergedStyles = baseStyles;
    }
  } else {
    mergedStyles = baseStyles;
  }
  
  // Remove conflicting properties: if shorthand exists, remove individual properties
  if (mergedStyles.padding) {
    delete mergedStyles.paddingTop;
    delete mergedStyles.paddingRight;
    delete mergedStyles.paddingBottom;
    delete mergedStyles.paddingLeft;
  }
  if (mergedStyles.margin) {
    delete mergedStyles.marginTop;
    delete mergedStyles.marginRight;
    delete mergedStyles.marginBottom;
    delete mergedStyles.marginLeft;
  }
  
  return mergedStyles;
};

// Check if property has breakpoint-specific value
export const hasBreakpointValue = (styles: any, property: string, breakpoint: 'desktop' | 'tablet' | 'mobile'): boolean => {
  if (!styles) return false;
  if (breakpoint === 'desktop') {
    // Desktop: check if desktop-specific override exists
    return styles.desktop?.[property] !== undefined;
  } else {
    // Tablet/Mobile: check if breakpoint-specific value exists
    return styles[breakpoint]?.[property] !== undefined;
  }
};

// Get all breakpoint values for a property
export const getBreakpointValues = (styles: any, property: string) => {
  if (!styles) return { desktop: undefined, tablet: undefined, mobile: undefined };
  
  const baseStyles = { ...styles };
  delete baseStyles.mobile;
  delete baseStyles.tablet;
  delete baseStyles.desktop;
  
  return {
    desktop: styles.desktop?.[property] ?? baseStyles[property],
    tablet: styles.tablet?.[property] ?? baseStyles[property],
    mobile: styles.mobile?.[property] ?? baseStyles[property]
  };
};

// Check if values differ across breakpoints
export const hasBreakpointDifferences = (styles: any, property: string): boolean => {
  if (!styles) return false;
  
  const baseStyles = { ...styles };
  delete baseStyles.mobile;
  delete baseStyles.tablet;
  delete baseStyles.desktop;
  
  const desktop = styles.desktop?.[property] ?? baseStyles[property];
  const tablet = styles.tablet?.[property] ?? baseStyles[property];
  const mobile = styles.mobile?.[property] ?? baseStyles[property];
  
  return desktop !== tablet || desktop !== mobile || tablet !== mobile;
};


