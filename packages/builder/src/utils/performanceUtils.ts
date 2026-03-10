/**
 * Performance optimization utilities
 * These functions are extracted to prevent inline function creation on every render
 */

/**
 * Memoized style builder functions
 * These are pure functions that can be safely memoized
 */

/**
 * Build border style object from element styles
 */
export function buildBorderStyleMemo(styles: any): React.CSSProperties {
  if (!styles) return {};
  
  const borderStyle: React.CSSProperties = {};
  
  if (styles.borderWidth) {
    borderStyle.borderWidth = styles.borderWidth;
  } else if (styles.borderTopWidth || styles.borderRightWidth || styles.borderBottomWidth || styles.borderLeftWidth) {
    borderStyle.borderTopWidth = styles.borderTopWidth;
    borderStyle.borderRightWidth = styles.borderRightWidth;
    borderStyle.borderBottomWidth = styles.borderBottomWidth;
    borderStyle.borderLeftWidth = styles.borderLeftWidth;
  }
  
  if (styles.borderStyle) {
    borderStyle.borderStyle = styles.borderStyle;
  }
  
  if (styles.borderColor) {
    borderStyle.borderColor = styles.borderColor;
  }
  
  if (styles.borderRadius) {
    borderStyle.borderRadius = styles.borderRadius;
  }
  
  return borderStyle;
}

/**
 * Build box shadow from element styles
 */
export function buildBoxShadowMemo(styles: any): string | undefined {
  if (!styles) return undefined;
  return styles.boxShadow || undefined;
}

/**
 * Build margin style object from element styles
 */
export function buildMarginStyle(styles: any): React.CSSProperties {
  if (!styles) return {};
  
  if (styles.margin) {
    return { margin: styles.margin };
  }
  
  if (styles.marginTop || styles.marginRight || styles.marginBottom || styles.marginLeft) {
    return {
      marginTop: styles.marginTop,
      marginRight: styles.marginRight,
      marginBottom: styles.marginBottom,
      marginLeft: styles.marginLeft,
    };
  }
  
  return {};
}

/**
 * Check if element is selected (memoized comparison)
 */
export function isElementSelected(
  selectedElement: any,
  elementId: string,
  sectionId: string,
  rowId: string,
  colId: string
): boolean {
  return selectedElement?.type === 'element' &&
    selectedElement.id === elementId &&
    selectedElement.sectionId === sectionId &&
    selectedElement.rowId === rowId &&
    selectedElement.columnId === colId;
}

/**
 * Debounce function for text input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for frequent updates
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
