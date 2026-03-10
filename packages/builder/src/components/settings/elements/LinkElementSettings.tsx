'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleInputKeyDown } from '../../../utils/helpers';
import ColorPickerWithTheme from '../../ui/ColorPickerWithTheme';
import { resolveColor, ColorSource } from '../../../utils/colorResolution';

interface LinkElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function LinkElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: LinkElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Link Text</label>
            <input
              type="text"
              value={element.data?.text || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, text: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Enter link text"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
            <input
              type="text"
              value={element.data?.href || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, href: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="https://example.com or #section"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Link Target</label>
            <select
              value={element.data?.target || '_self'}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, target: e.target.value as any } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="_self">Same Window</option>
              <option value="_blank">New Window</option>
            </select>
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Colors */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors</h3>
            <div className="mb-3">
              {(() => {
                const textColorSource = element.styles.textColorSource as ColorSource | undefined;
                const resolved = resolveColor(
                  element.styles.color && element.styles.color !== 'transparent' ? element.styles.color : '#3b82f6',
                  textColorSource,
                  '',
                  '#3b82f6',
                  'text',
                  'link'
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
                      const newColor = element.styles.color === 'transparent' ? '#3b82f6' : 'transparent';
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, color: newColor } });
                    }}
                    label="Link Color"
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
                    elementType="link"
                    defaultCustomColor="#3b82f6"
                  />
                );
              })()}
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Opacity</label>
              <input
                type="text"
                value={element.styles.opacity || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, opacity: e.target.value } })}
                onKeyDown={handleInputKeyDown}
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
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Link Attributes</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Rel Attribute</label>
              <input
                type="text"
                value={element.data?.rel || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, rel: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., noopener, noreferrer"
              />
            </div>
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
