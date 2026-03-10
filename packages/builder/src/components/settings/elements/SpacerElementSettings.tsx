'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown, handleInputKeyDown } from '../../../utils/helpers';
import ColorPickerWithTheme from '../../ui/ColorPickerWithTheme';
import { resolveColor, ColorSource } from '../../../utils/colorResolution';

interface SpacerElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function SpacerElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: SpacerElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <p className="text-sm text-gray-500">Spacer element - no content settings available.</p>
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Size */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Size</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Height</label>
                <input
                  type="text"
                  value={element.styles.height || element.styles.minHeight || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, height: e.target.value, minHeight: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.height || element.styles.minHeight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, height: val, minHeight: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 24px, 2rem"
                />
              </div>
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
                  placeholder="e.g., 100%, 50px"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors</h3>
            <div className="mb-3">
              {(() => {
                const backgroundColorSource = element.styles.backgroundColorSource as ColorSource | undefined;
                const resolved = resolveColor(
                  element.styles.backgroundColor && element.styles.backgroundColor !== 'transparent' ? element.styles.backgroundColor : 'transparent',
                  backgroundColorSource,
                  '',
                  'transparent',
                  'background',
                  'spacer'
                );
                
                return (
                  <ColorPickerWithTheme
                    value={resolved.value}
                    onChange={(color) => {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, backgroundColor: color } });
                    }}
                    showTransparent={true}
                    isTransparent={element.styles.backgroundColor === 'transparent' || !element.styles.backgroundColor}
                    onTransparentToggle={() => {
                      const newColor = element.styles.backgroundColor === 'transparent' || !element.styles.backgroundColor ? '#f3f4f6' : 'transparent';
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
                    elementType="spacer"
                    defaultCustomColor="#f3f4f6"
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
