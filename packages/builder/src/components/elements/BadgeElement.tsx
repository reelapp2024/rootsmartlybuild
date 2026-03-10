'use client';

import React from 'react';
import { Element } from '../../types/builder';

interface BadgeElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function BadgeElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  updateElement,
}: BadgeElementProps) {
  const badgeStyle: React.CSSProperties = {
    ...currentElementStyles,
    display: 'inline-block',
    padding: currentElementStyles.padding || '4px 8px',
    borderRadius: currentElementStyles.borderRadius || '4px',
    backgroundColor: currentElementStyles.backgroundColor || '#3b82f6',
    color: currentElementStyles.color || '#ffffff',
  };

  return (
    <span
      style={badgeStyle}
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
      {element.data?.text || 'Badge'}
    </span>
  );
}

export default React.memo(BadgeElement);
