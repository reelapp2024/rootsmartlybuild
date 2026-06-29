import React from 'react';
import { renderElement } from './renderElement';

/**
 * Render root elements from a sorted elements array
 * This is a reusable function for rendering elements in components
 */
export function renderRootElements(options: {
  sortedElements: Array<{ id: string; type: string; elId: string; order: number; parentElId?: string }>;
  getElProps: (elId: string, elementType: string) => any;
  getElStyle: (elId: string, elementType: string) => React.CSSProperties;
  isElSelected: (elId: string) => boolean;
  builderMode: boolean;
  __nodeId?: string;
  __studio?: any;
  fallbackValues?: Record<string, any>;
  propResolvers?: Record<string, (elProps: any, apiData?: any, resolved?: any) => any>;
  apiData?: any;
  resolved?: any;
}) {
  const {
    sortedElements,
    getElProps,
    getElStyle,
    isElSelected,
    builderMode,
    __nodeId,
    __studio,
    fallbackValues = {},
    propResolvers = {},
    apiData,
    resolved
  } = options;

  // Find root elements (elements without parentElId)
  const rootElements = sortedElements.filter(el => {
    const parentElId = (el as any).parentElId;
    return !parentElId || parentElId === undefined || parentElId === null;
  });

  if (rootElements.length === 0) {
    console.warn('[ElementRendering] No root elements found. Total elements:', sortedElements.length);
    return null;
  }

  return (
    <>
      {rootElements.map((element, elementIdx) => {
        const elId = element.elId;
        const elProps = getElProps(elId, element.type);
        const elStyles = getElStyle(elId, element.type);
        const isSelected = isElSelected(elId);

        let finalProps: any = { ...elProps };

        // Apply custom prop resolvers if provided
        if (propResolvers[elId]) {
          finalProps = { ...finalProps, ...propResolvers[elId](elProps, apiData, resolved) };
        }

        // Generate element key
        const headingTag = finalProps.headingTag || 'h1';
        const apiKey = apiData ? JSON.stringify(apiData) : '';
        const elementKey = element.id || `element-${elId}-${element.order}-${elementIdx}-${headingTag}-${apiKey}`;

        return (
          <div key={elementKey} style={{ position: 'relative', width: '100%', zIndex: elId === 'background-image' ? 0 : 2 }}>
            {renderElement({
              element: { ...element, id: elementKey },
              elementIdx,
              sortedElements, // Pass full sortedElements array so renderElement can find children
              elProps: finalProps,
              elStyles,
              isSelected,
              builderMode,
              __nodeId,
              __studio: {
                ...__studio,
                getElementProps: __studio?.getElementProps,
                getElementStyle: __studio?.getElementStyle,
                updateCustomElementProps: __studio?.updateCustomElementProps,
                duplicateCustomElement: __studio?.duplicateCustomElement,
                onElementContextMenu: __studio?.onElementContextMenu,
              },
              elementOverrides: {},
              fallbackValues,
            })}
          </div>
        );
      })}
    </>
  );
}

