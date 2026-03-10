'use client';

import React from 'react';
import { Element } from '../../types/builder';

interface ListElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function ListElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  updateElement,
}: ListElementProps) {
  // Get list items from element data
  let items: string[] = [];
  if (element.data?.items) {
    if (typeof element.data.items === 'string') {
      items = element.data.items.split('\n').filter((item: string) => item.trim().length > 0);
    } else if (Array.isArray(element.data.items)) {
      items = element.data.items;
    }
  }
  
  // Fallback to default items
  if (items.length === 0) {
    items = ['Item 1', 'Item 2', 'Item 3'];
  }
  
  // Get list type (ul or ol)
  const listType = element.data?.listType || 'ul';
  const ListComponent = listType === 'ol' ? 'ol' : 'ul';
  const listStyleType = element.data?.listStyle || currentElementStyles.listStyleType || 'disc';

  const listStyle: React.CSSProperties = {
    listStyleType: listStyleType,
    paddingLeft: '20px',
    margin: '0',
    ...currentElementStyles,
  };

  return (
    <ListComponent style={listStyle}>
      {items.map((item: string, idx: number) => (
        <li 
          key={idx} 
          style={{ padding: '4px 0' }}
          contentEditable={builderMode}
          suppressContentEditableWarning
          onBlur={(e) => {
            if (!builderMode) return;
            const newText = e.currentTarget.textContent || '';
            const updatedItems = [...items];
            updatedItems[idx] = newText;
            updateElement(sectionId, rowId, colId, element.id, { 
              data: { ...element.data, items: updatedItems } 
            });
          }}
        >
          {item.trim()}
        </li>
      ))}
    </ListComponent>
  );
}

export default React.memo(ListElement);
