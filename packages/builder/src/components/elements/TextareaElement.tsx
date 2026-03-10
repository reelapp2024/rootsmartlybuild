'use client';

import React from 'react';
import { Element } from '../../types/builder';

interface TextareaElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function TextareaElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  updateElement,
}: TextareaElementProps) {
  const textareaStyle: React.CSSProperties = {
    ...currentElementStyles,
    padding: currentElementStyles.padding || '12px',
    borderRadius: currentElementStyles.borderRadius || '6px',
    border: currentElementStyles.border || '1px solid #d1d5db',
    fontSize: currentElementStyles.fontSize || '1rem',
    width: currentElementStyles.width || '100%',
    minHeight: currentElementStyles.minHeight || '100px',
    resize: builderMode ? 'none' : currentElementStyles.resize || 'vertical',
  };

  return (
    <textarea
      placeholder={element.data?.placeholder || 'Enter text...'}
      value={builderMode ? undefined : (element.data?.value || '')}
      readOnly={builderMode}
      onClick={(e) => {
        if (builderMode) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onChange={(e) => {
        if (!builderMode) {
          updateElement(sectionId, rowId, colId, element.id, { 
            data: { ...element.data, value: e.target.value } 
          });
        }
      }}
      style={textareaStyle}
    >
      {builderMode ? undefined : (element.data?.value || '')}
    </textarea>
  );
}

export default React.memo(TextareaElement);
