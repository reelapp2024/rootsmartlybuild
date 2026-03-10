'use client';

import React, { useCallback, useRef } from 'react';
import { Element } from '../../types/builder';
import { useApiData } from '../../hooks/useApiData';

interface TextElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function TextElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  updateElement,
}: TextElementProps) {
  // Fetch API data if enabled
  const { data: apiData, loading: apiLoading } = useApiData<{ text?: string; content?: string; description?: string }>(
    {
      enabled: element.api?.enabled || false,
      url: element.api?.url,
      method: element.api?.method || 'GET',
      refreshInterval: element.api?.refreshInterval || 0,
      dataPath: element.api?.dataPath,
      fallbackToContent: element.api?.fallbackToContent !== false,
    },
    { text: element.content.text }
  );

  // Resolve text content: API data → element.content (API wins)
  const resolvedText = apiData?.text || apiData?.content || apiData?.description || element.content.text || '';

  // Resolve text color - check useDefaultTextColor flag (like useDefaultFont/useDefaultSize)
  const useDefaultTextColor = currentElementStyles.useDefaultTextColor !== undefined 
    ? currentElementStyles.useDefaultTextColor 
    : true; // Default to true
  
  let textColor = '#000000';
  if (useDefaultTextColor) {
    // Get default color from CSS variable (like useDefaultSize does)
    if (typeof window !== 'undefined') {
      const websiteContent = document.querySelector('[data-website-content="true"]');
      const root = document.documentElement;
      let color = '';
      if (websiteContent) {
        color = getComputedStyle(websiteContent).getPropertyValue('--color-text').trim();
      }
      if (!color) {
        color = getComputedStyle(root).getPropertyValue('--color-text').trim();
      }
      if (color) {
        textColor = `var(--color-text, ${color})`;
      } else {
        textColor = 'var(--color-text, #000000)';
      }
    } else {
      textColor = 'var(--color-text, #000000)';
    }
  } else {
    // Use custom color
    textColor = currentElementStyles.textColor || '#000000';
  }

  return (
    <div>
      {element.content.heading && (
        <h2
          contentEditable={builderMode}
          suppressContentEditableWarning
          className="mb-4 outline-none focus:ring-2 focus:ring-blue-400 rounded px-2"
          style={{
            fontFamily: currentElementStyles.headingFontFamily,
            fontSize: currentElementStyles.headingFontSize || '1.875rem',
            fontWeight: currentElementStyles.headingFontWeight || '700',
            lineHeight: currentElementStyles.headingLineHeight || '1.2',
            textAlign: currentElementStyles.headingTextAlign || 'left',
            letterSpacing: currentElementStyles.headingLetterSpacing,
            textTransform: currentElementStyles.headingTextTransform || 'none',
            textDecoration: currentElementStyles.headingTextDecoration || 'none',
            color: textColor,
          }}
          onClick={(e) => {
            if (builderMode) {
              // Don't stop propagation - let parent handle selection
              // Only prevent if we're actually editing (contentEditable is focused)
              if (document.activeElement !== e.currentTarget) {
                // Not currently editing, allow selection
                return;
              }
              // Currently editing, prevent selection to allow text editing
              e.stopPropagation();
            }
          }}
          onMouseDown={(e) => {
            if (builderMode) {
              // If not currently focused, select the element first
              if (document.activeElement !== e.currentTarget) {
                e.stopPropagation();
                // Trigger selection via parent
                const wrapper = e.currentTarget.closest('[data-element-type="element"]');
                if (wrapper) {
                  wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                }
              }
            }
          }}
          onBlur={(e) => {
            const newHeading = e.currentTarget.textContent || '';
            // Only update if content actually changed
            if (newHeading !== element.content.heading) {
              updateElement(sectionId, rowId, colId, element.id, { content: { ...element.content, heading: newHeading } });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        >
          {element.content.heading}
        </h2>
      )}
      {element.content.description && (
        <p
          contentEditable={builderMode}
          suppressContentEditableWarning
          className="outline-none focus:ring-2 focus:ring-blue-400 rounded px-2"
          style={{
            fontFamily: currentElementStyles.descriptionFontFamily,
            fontSize: currentElementStyles.descriptionFontSize || '1.125rem',
            fontWeight: currentElementStyles.descriptionFontWeight || '400',
            lineHeight: currentElementStyles.descriptionLineHeight || '1.5',
            textAlign: currentElementStyles.descriptionTextAlign || 'left',
            letterSpacing: currentElementStyles.descriptionLetterSpacing,
            textTransform: currentElementStyles.descriptionTextTransform || 'none',
            textDecoration: currentElementStyles.descriptionTextDecoration || 'none',
            color: textColor,
          }}
          onClick={(e) => {
            if (builderMode) {
              // Don't stop propagation - let parent handle selection
              // Only prevent if we're actually editing (contentEditable is focused)
              if (document.activeElement !== e.currentTarget) {
                // Not currently editing, allow selection
                return;
              }
              // Currently editing, prevent selection to allow text editing
              e.stopPropagation();
            }
          }}
          onMouseDown={(e) => {
            if (builderMode) {
              // If not currently focused, select the element first
              if (document.activeElement !== e.currentTarget) {
                e.stopPropagation();
                // Trigger selection via parent
                const wrapper = e.currentTarget.closest('[data-element-type="element"]');
                if (wrapper) {
                  wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                }
              }
            }
          }}
          onBlur={(e) => {
            const newDescription = e.currentTarget.textContent || '';
            // Only update if content actually changed
            if (newDescription !== element.content.description) {
              updateElement(sectionId, rowId, colId, element.id, { content: { ...element.content, description: newDescription } });
            }
          }}
        >
          {apiLoading ? 'Loading...' : (element.content.description || '')}
        </p>
      )}
      {resolvedText && !element.content.heading && !element.content.description && (
        <p
          contentEditable={builderMode}
          suppressContentEditableWarning
          className="outline-none focus:ring-2 focus:ring-blue-400 rounded px-2"
          style={{
            fontFamily: currentElementStyles.fontFamily,
            fontSize: currentElementStyles.fontSize || '1rem',
            fontWeight: currentElementStyles.fontWeight || '400',
            lineHeight: currentElementStyles.lineHeight || '1.5',
            textAlign: currentElementStyles.textAlign || 'left',
            color: textColor,
          }}
          onClick={(e) => {
            if (builderMode) {
              // Don't stop propagation - let parent handle selection
              // Only prevent if we're actually editing (contentEditable is focused)
              if (document.activeElement !== e.currentTarget) {
                // Not currently editing, allow selection
                return;
              }
              // Currently editing, prevent selection to allow text editing
              e.stopPropagation();
            }
          }}
          onMouseDown={(e) => {
            if (builderMode) {
              // If not currently focused, select the element first
              if (document.activeElement !== e.currentTarget) {
                e.stopPropagation();
                // Trigger selection via parent
                const wrapper = e.currentTarget.closest('[data-element-type="element"]');
                if (wrapper) {
                  wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                }
              }
            }
          }}
          onBlur={(e) => {
            const newText = e.currentTarget.textContent || '';
            // Only update if content actually changed
            if (newText !== element.content.text) {
              updateElement(sectionId, rowId, colId, element.id, { content: { ...element.content, text: newText } });
            }
          }}
        >
          {apiLoading ? 'Loading...' : resolvedText}
        </p>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(TextElement, (prevProps, nextProps) => {
  // Re-render if element content or styles changed
  if (prevProps.element.id !== nextProps.element.id) return false;
  if (prevProps.element.content.text !== nextProps.element.content.text) return false;
  if (prevProps.element.content.heading !== nextProps.element.content.heading) return false;
  if (prevProps.element.content.description !== nextProps.element.content.description) return false;
  if (JSON.stringify(prevProps.element.styles) !== JSON.stringify(nextProps.element.styles)) return false;
  if (JSON.stringify(prevProps.currentElementStyles) !== JSON.stringify(nextProps.currentElementStyles)) return false;
  if (prevProps.builderMode !== nextProps.builderMode) return false;
  if (prevProps.sectionId !== nextProps.sectionId) return false;
  if (prevProps.rowId !== nextProps.rowId) return false;
  if (prevProps.colId !== nextProps.colId) return false;
  // Props are equal, skip re-render
  return true;
});
