'use client';

import React from 'react';
import { Element } from '../../types/builder';

interface LinkElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function LinkElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  updateElement,
}: LinkElementProps) {
  const linkStyle: React.CSSProperties = {
    ...currentElementStyles,
    textDecoration: 'none',
    color: currentElementStyles.color || '#3b82f6',
  };

  return (
    <a
      href={builderMode ? 'javascript:void(0)' : (element.data?.href || '#')}
      onClick={(e) => {
        if (builderMode) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={linkStyle}
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
      {element.data?.text || 'Link'}
    </a>
  );
}

export default React.memo(LinkElement);
