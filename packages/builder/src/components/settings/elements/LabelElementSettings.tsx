'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown, handleInputKeyDown } from '../../../utils/helpers';
import ColorPickerWithTheme from '../../ui/ColorPickerWithTheme';
import { resolveColor, ColorSource } from '../../../utils/colorResolution';

interface LabelElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function LabelElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: LabelElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Label Text</label>
            <input
              type="text"
              value={element.data?.text || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, text: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Enter label text"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">For (Element ID)</label>
            <input
              type="text"
              value={element.data?.htmlFor || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, htmlFor: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Element ID to associate with"
            />
            <p className="text-xs text-gray-500 mt-1">ID of the form element this label is for</p>
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Font */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Font</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                <input
                  type="text"
                  value={element.styles.fontSize || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, fontSize: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.fontSize || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, fontSize: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 0.875rem, 14px"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
                <input
                  type="text"
                  value={element.styles.fontWeight || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, fontWeight: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.fontWeight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, fontWeight: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 500, bold"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors</h3>
            <div className="mb-3">
              {(() => {
                const textColorSource = element.styles.textColorSource as ColorSource | undefined;
                const resolved = resolveColor(
                  element.styles.color && element.styles.color !== 'transparent' ? element.styles.color : '#374151',
                  textColorSource,
                  '',
                  '#374151',
                  'text',
                  'label'
                );
                
                return (
                  <ColorPickerWithTheme
                    value={resolved.value}
                    onChange={(color) => {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, color: color } });
                    }}
                    showTransparent={true}
                    isTransparent={element.styles.color === 'transparent'}
                    onTransparentToggle={() => {
                      const newColor = element.styles.color === 'transparent' ? '#374151' : 'transparent';
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, color: newColor } });
                    }}
                    label="Text Color"
                    colorSource={resolved.source}
                    onColorSourceChange={(source) => {
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          textColorSource: source
                        } 
                      });
                    }}
                    colorType="text"
                    elementType="label"
                    defaultCustomColor="#374151"
                  />
                );
              })()}
            </div>
          </div>

          {/* Spacing */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Spacing</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Margin Bottom</label>
              <input
                type="text"
                value={element.styles.marginBottom || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginBottom: e.target.value } })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, element.styles.marginBottom || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginBottom: val } }));
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., 8px"
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
