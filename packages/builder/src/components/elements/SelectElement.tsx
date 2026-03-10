'use client';

import React from 'react';
import { Element } from '../../types/builder';

interface SelectElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function SelectElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  updateElement,
}: SelectElementProps) {
  const selectStyle: React.CSSProperties = {
    ...currentElementStyles,
    padding: currentElementStyles.padding || '12px',
    borderRadius: currentElementStyles.borderRadius || '6px',
    border: currentElementStyles.border || '1px solid #d1d5db',
    fontSize: currentElementStyles.fontSize || '1rem',
    width: currentElementStyles.width || '100%',
  };

  const options = element.data?.options || ['Option 1', 'Option 2', 'Option 3'];
  const optionsArray = Array.isArray(options) ? options : (typeof options === 'string' ? options.split('\n') : []);

  return (
    <select
      value={builderMode ? undefined : (element.data?.value || '')}
      disabled={builderMode}
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
      style={selectStyle}
    >
      {optionsArray.map((opt: string, idx: number) => (
        <option key={idx} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export default React.memo(SelectElement);
