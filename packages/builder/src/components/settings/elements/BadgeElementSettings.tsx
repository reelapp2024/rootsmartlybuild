'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown, handleInputKeyDown } from '../../../utils/helpers';
import ColorPickerWithTheme from '../../ui/ColorPickerWithTheme';
import { resolveColor, ColorSource } from '../../../utils/colorResolution';

interface BadgeElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function BadgeElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: BadgeElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Badge Text</label>
            <input
              type="text"
              value={element.data?.text || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, text: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Enter badge text"
            />
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
                const backgroundColorSource = element.styles.backgroundColorSource as ColorSource | undefined;
                const resolved = resolveColor(
                  element.styles.backgroundColor && element.styles.backgroundColor !== 'transparent' ? element.styles.backgroundColor : '#3b82f6',
                  backgroundColorSource,
                  '',
                  '#3b82f6',
                  'background',
                  'badge'
                );
                
                return (
                  <ColorPickerWithTheme
                    value={resolved.value}
                    onChange={(color) => {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, backgroundColor: color } });
                    }}
                    showTransparent={true}
                    isTransparent={element.styles.backgroundColor === 'transparent'}
                    onTransparentToggle={() => {
                      const newColor = element.styles.backgroundColor === 'transparent' ? '#3b82f6' : 'transparent';
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, backgroundColor: newColor } });
                    }}
                    label="Background Color"
                    colorSource={resolved.source}
                    onColorSourceChange={(source) => {
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          backgroundColorSource: source
                        } 
                      });
                    }}
                    colorType="background"
                    elementType="badge"
                    defaultCustomColor="#3b82f6"
                  />
                );
              })()}
            </div>
            <div className="mb-3">
              {(() => {
                const textColorSource = element.styles.textColorSource as ColorSource | undefined;
                const resolved = resolveColor(
                  element.styles.color && element.styles.color !== 'transparent' ? element.styles.color : '#ffffff',
                  textColorSource,
                  '',
                  '#ffffff',
                  'text',
                  'badge'
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
                      const newColor = element.styles.color === 'transparent' ? '#ffffff' : 'transparent';
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
                    elementType="badge"
                    defaultCustomColor="#ffffff"
                  />
                );
              })()}
            </div>
          </div>

          {/* Border & Radius */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Border & Radius</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
                <input
                  type="text"
                  value={element.styles.borderRadius || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRadius: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.borderRadius || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRadius: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 12px, 50%"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Border</label>
                <input
                  type="text"
                  value={element.styles.border || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, border: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 1px solid #ccc"
                />
              </div>
            </div>
          </div>

          {/* Display & Opacity */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Display</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Display</label>
                <select
                  value={element.styles.display || 'inline-block'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, display: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="inline-block">Inline Block</option>
                  <option value="block">Block</option>
                  <option value="inline">Inline</option>
                </select>
              </div>
              <div>
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
