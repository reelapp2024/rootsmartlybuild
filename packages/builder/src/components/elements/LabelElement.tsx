'use client';

import React from 'react';
import { Element } from '../../types/builder';

interface LabelElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function LabelElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  updateElement,
}: LabelElementProps) {
  const labelStyle: React.CSSProperties = {
    ...currentElementStyles,
    fontSize: currentElementStyles.fontSize || '0.875rem',
    fontWeight: currentElementStyles.fontWeight || '500',
    color: currentElementStyles.color || '#374151',
    marginBottom: currentElementStyles.marginBottom || '8px',
    display: 'block',
  };

  return (
    <label
      htmlFor={element.data?.htmlFor}
      style={labelStyle}
      contentEditable={builderMode}
      suppressContentEditableWarning
      onBlur={(e) => {
        if (!builderMode) return;
        const newText = e.currentTarget.textContent || '';
        updateElement(sectionId, rowId, colId, element.id, { 
          data: { ...element.data, text: newText } 
        });
      }}
    >
      {element.data?.text || 'Label'}
    </label>
  );
}

export default React.memo(LabelElement);
