'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown, handleInputKeyDown } from '../../../utils/helpers';

interface DividerElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function DividerElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: DividerElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <p className="text-sm text-gray-500">Divider element - no content settings available.</p>
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Border & Width */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Divider Style</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width</label>
                <input
                  type="text"
                  value={element.styles.width || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, width: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.width || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, width: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 100%, 50%"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Border Style</label>
                <input
                  type="text"
                  value={element.styles.borderTop || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTop: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 1px solid #ccc"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Opacity</label>
              <input
                type="text"
                value={element.styles.opacity || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, opacity: e.target.value } })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, element.styles.opacity || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, opacity: val } }));
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., 1, 0.8"
              />
            </div>
          </div>
        </>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <>
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">CSS Class</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Custom CSS Class</label>
              <input
                type="text"
                value={element.customClasses || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { customClasses: e.target.value })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="custom-class-name"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
