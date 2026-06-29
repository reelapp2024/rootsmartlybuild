import { useEffect, useRef } from 'react';

/**
 * Studio interface type for component helpers
 */
export interface ComponentStudio {
  addCustomElement?: (elementType: string, elId: string, addAtFirst?: boolean, parentElId?: string) => void;
  updateCustomElementProps?: (elId: string, props: any) => void;
  updateCustomElementStyle?: (elId: string, style: React.CSSProperties) => void;
  getCustomElements?: () => Array<{ id: string; type: string; elId: string; order: number }>;
  getElementProps?: (elId: string) => any;
}

/**
 * Default element configuration type
 */
export interface DefaultElement {
  elId: string;
  type: string;
  order: number;
  defaultProps: Record<string, any>;
  defaultStyle: React.CSSProperties;
  parentElId?: string; // Optional parent element ID
}

/**
 * Element prop resolver function type
 * Takes element and resolved data, returns props to use
 */
export type ElementPropResolver = (
  element: DefaultElement,
  resolvedData: Record<string, any>
) => Record<string, any>;

/**
 * Initialize default elements in the builder
 * This is a reusable function that can be used by any component
 * 
 * @param options Configuration options
 * @returns Object with initialization state
 */
export function useElementInitialization(options: {
  __studio?: ComponentStudio;
  __nodeId?: string;
  defaultElements: DefaultElement[];
  resolvedData?: Record<string, any>;
  loading?: boolean;
  propResolver?: ElementPropResolver;
  skipElements?: string[]; // Element IDs to skip during initialization
  containerElements?: { elId: string; parentElId?: string }[]; // Container elements to create first
}) {
  const {
    __studio,
    __nodeId,
    defaultElements,
    resolvedData = {},
    loading = false,
    propResolver,
    skipElements = [],
    containerElements = []
  } = options;

  const initializationDoneRef = useRef(false);
  const initializationAttemptedRef = useRef(false);

  useEffect(() => {
    if (initializationDoneRef.current || !__studio || !__nodeId || !__studio?.addCustomElement) return;
    if (initializationAttemptedRef.current) return;

    const customElements = __studio?.getCustomElements?.() || [];

    // Only initialize if DB is completely empty
    if (customElements.length === 0) {
      // If loading is true, wait for it to finish
      if (loading) {
        return; // Wait for loading to finish
      }

      initializationAttemptedRef.current = true;

      // First, create container elements (if specified)
      containerElements.forEach((container) => {
        const element = defaultElements.find(el => el.elId === container.elId);
        if (element) {
          __studio?.addCustomElement?.(element.type, element.elId, false, container.parentElId);
          __studio?.updateCustomElementProps?.(element.elId, element.defaultProps);
          __studio?.updateCustomElementStyle?.(element.elId, element.defaultStyle);
        }
      });

      // Then, create child elements
      defaultElements.forEach((element) => {
        // Skip container elements (already created) or explicitly skipped elements
        if (containerElements.some(c => c.elId === element.elId) || skipElements.includes(element.elId)) {
          return;
        }

        // Determine parentElId - use from element config, containerElements, or default
        const parentElId = element.parentElId || 
          containerElements[containerElements.length - 1]?.elId || 
          undefined;

        // Add element
        __studio?.addCustomElement?.(element.type, element.elId, false, parentElId);

        // Resolve props - use custom resolver if provided, otherwise use default props
        let props: any = { ...element.defaultProps };
        if (propResolver) {
          props = { ...props, ...propResolver(element, resolvedData) };
        }

        __studio?.updateCustomElementProps?.(element.elId, props);
        __studio?.updateCustomElementStyle?.(element.elId, element.defaultStyle);
      });

      setTimeout(() => {
        initializationDoneRef.current = true;
      }, 500);
    } else {
      initializationDoneRef.current = true;
    }
  }, [__studio, __nodeId, resolvedData, loading, defaultElements, propResolver, skipElements, containerElements]);

  return {
    isInitialized: initializationDoneRef.current,
    isInitializing: initializationAttemptedRef.current && !initializationDoneRef.current
  };
}

/**
 * Update existing elements with API data (only if they don't have user-edited content)
 * This preserves user edits while allowing API data to update default values
 * 
 * @param options Configuration options
 */
export function useElementApiUpdate(options: {
  apiData?: Record<string, any>;
  __studio?: ComponentStudio;
  updateRules: Array<{
    elId: string;
    apiKey: string; // Key in apiData to use
    propKey: string; // Property key to update (e.g., 'text', 'imageUrl')
    defaultValue?: string; // Default value to check against
    checkFunction?: (currentValue: any, apiValue: any, defaultValue?: string) => boolean;
  }>;
}) {
  const { apiData, __studio, updateRules } = options;

  useEffect(() => {
    if (!apiData || !__studio || !__studio?.updateCustomElementProps || !__studio?.getCustomElements) return;

    const customElements = __studio.getCustomElements() || [];
    if (customElements.length === 0) return; // Elements not initialized yet

    // Apply update rules
    updateRules.forEach((rule) => {
      const element = customElements.find((el: any) => el.elId === rule.elId);
      if (!element) return;

      const apiValue = apiData[rule.apiKey];
      if (!apiValue || (typeof apiValue === 'string' && apiValue.trim() === '')) return;

      const elProps = __studio?.getElementProps?.(element.elId) || {};
      const currentValue = elProps[rule.propKey] || '';

      // Check if we should update (use custom check function or default logic)
      const shouldUpdate = rule.checkFunction
        ? rule.checkFunction(currentValue, apiValue, rule.defaultValue)
        : !currentValue || currentValue === apiValue || (rule.defaultValue && currentValue.includes(rule.defaultValue));

      if (shouldUpdate) {
        const updateProps: Record<string, any> = {};
        updateProps[rule.propKey] = apiValue;
        
        // Handle special cases (e.g., title needs both text and heading)
        if (rule.elId === 'title' && (rule.propKey === 'text' || rule.propKey === 'heading')) {
          updateProps.text = apiValue;
          updateProps.heading = apiValue;
        }

        // Log update for debugging
        if (typeof window !== 'undefined' && (window as any).__DEV__) {
          console.log(`[useElementApiUpdate] Updating ${rule.elId}.${rule.propKey} with API value:`, apiValue);
        }

        __studio.updateCustomElementProps?.(element.elId, updateProps);
      }
    });
  }, [apiData, __studio, updateRules]);
}

/**
 * Create element rendering helpers
 * Returns helper functions for getting styles, props, and checking selection
 */
export function useElementHelpers(options: {
  __studio?: {
    getElementStyle?: (elId: string) => React.CSSProperties;
    getElementProps?: (elId: string) => any;
    selectedEl?: { nodeId: string; elId: string } | null;
  };
  __nodeId?: string;
  fallbackValues?: Record<string, any>;
  debug?: boolean;
}) {
  const { __studio, __nodeId, fallbackValues = {}, debug = false } = options;

  const builderMode = !!(__studio && (__studio as any).updateCustomElementProps);

  const getElStyle = (elId: string, elementType: string = '') => {
    const { getElementStyle } = require('./elementHelpers');
    const styles = getElementStyle(elId, elementType, __studio?.getElementStyle);
    if (debug && typeof window !== 'undefined') {
      console.log(`[Component] getElStyle(${elId}, ${elementType}):`, styles);
    }
    return styles;
  };

  const getElProps = (elId: string, elementType: string = '') => {
    const { getElementProps } = require('./elementHelpers');
    const props = getElementProps(elId, elementType, __studio?.getElementProps, fallbackValues);
    if (debug && typeof window !== 'undefined') {
      console.log(`[Component] getElProps(${elId}, ${elementType}):`, props);
    }
    return props;
  };

  const isElSelected = (elId: string) => {
    const { isElementSelected } = require('./elementHelpers');
    return isElementSelected(elId, __nodeId, __studio?.selectedEl);
  };

  return {
    builderMode,
    getElStyle,
    getElProps,
    isElSelected
  };
}

