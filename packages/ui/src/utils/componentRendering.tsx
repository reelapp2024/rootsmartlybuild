import React from 'react';

/**
 * Render empty state for components
 * Shows loading or initialization messages
 */
export function renderEmptyState(options: {
  builderMode: boolean;
  loading: boolean;
  loadingMessage?: string;
  initializingMessage?: string;
  emptyMessage?: string;
}): React.ReactNode {
  const {
    builderMode,
    loading,
    loadingMessage = 'Loading...',
    initializingMessage = 'Initializing default elements...',
    emptyMessage = 'No elements found'
  } = options;

  if (builderMode) {
    if (loading) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.7)',
          fontSize: '1rem',
        }}>
          <p>{loadingMessage}</p>
        </div>
      );
    }
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: 'rgba(255,255,255,0.7)',
        fontSize: '1rem',
      }}>
        <p>{initializingMessage}</p>
      </div>
    );
  }

  // In non-builder mode, return null (no elements means nothing to show)
  console.warn(`[Component] ${emptyMessage}`);
  return null;
}

/**
 * Get section styles from custom elements
 * Tries multiple approaches to retrieve section styles
 * Also checks propsStyle (component-level styles from section.styles)
 */
export function getSectionStyles(
  customElements: Array<any>,
  getElStyle: (elId: string, elementType?: string) => React.CSSProperties,
  sectionElId: string = 'section',
  propsStyle?: React.CSSProperties
): Record<string, any> {
  const sectionElement = customElements.find((el: any) => el.elId === sectionElId);
  
  let customStyles: any = {};
  
  // CRITICAL: First check propsStyle (component-level styles from section.styles)
  // This includes backgroundImage from componentIds[0].style
  if (propsStyle && typeof propsStyle === 'object' && !Array.isArray(propsStyle)) {
    customStyles = { ...propsStyle };
  }
  
  // Then, try to get styles for section element (if it exists as container)
  // Element-level styles override component-level styles
  if (sectionElement) {
    const elementStyles = getElStyle(sectionElId, "container") || getElStyle(sectionElId) || {};
    customStyles = { ...customStyles, ...elementStyles };
  }
  
  // If no styles found, try getting section styles directly (for custom site)
  if (!customStyles || Object.keys(customStyles).length === 0) {
    const fallbackStyles = getElStyle(sectionElId, "section") || getElStyle(sectionElId) || {};
    customStyles = { ...customStyles, ...fallbackStyles };
  }
  
  // Ensure we have an object
  if (!customStyles || typeof customStyles !== 'object' || Array.isArray(customStyles)) {
    customStyles = {};
  }
  
  return customStyles;
}

