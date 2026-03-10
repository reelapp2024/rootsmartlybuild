'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown, handleInputKeyDown } from '../../../utils/helpers';
import ColorPickerWithTheme from '../../ui/ColorPickerWithTheme';
import { resolveColor, ColorSource } from '../../../utils/colorResolution';

interface InputElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function InputElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: InputElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
            <input
              type="text"
              value={element.data?.placeholder || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, placeholder: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Placeholder text"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Input Type</label>
            <select
              value={element.data?.type || 'text'}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, type: e.target.value as any } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="password">Password</option>
              <option value="number">Number</option>
              <option value="tel">Phone</option>
              <option value="url">URL</option>
              <option value="date">Date</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Value</label>
            <input
              type="text"
              value={element.data?.value || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, value: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Default input value"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Name</label>
            <input
              type="text"
              value={element.data?.name || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, name: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Field name for form submission"
            />
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
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
                  placeholder="e.g., 6px, 50%"
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

          {/* Size & Font */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Size & Font</h3>
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
                  placeholder="e.g., 1rem, 16px"
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
                  placeholder="e.g., 100%, 300px"
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
                  element.styles.backgroundColor && element.styles.backgroundColor !== 'transparent' ? element.styles.backgroundColor : '#ffffff',
                  backgroundColorSource,
                  '',
                  '#ffffff',
                  'background',
                  'input'
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
                      const newColor = element.styles.backgroundColor === 'transparent' ? '#ffffff' : 'transparent';
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
                    elementType="input"
                    defaultCustomColor="#ffffff"
                  />
                );
              })()}
            </div>
            <div className="mb-3">
              {(() => {
                const textColorSource = element.styles.textColorSource as ColorSource | undefined;
                const resolved = resolveColor(
                  element.styles.color && element.styles.color !== 'transparent' ? element.styles.color : '#000000',
                  textColorSource,
                  '',
                  '#000000',
                  'text',
                  'input'
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
                      const newColor = element.styles.color === 'transparent' ? '#000000' : 'transparent';
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
                    elementType="input"
                    defaultCustomColor="#000000"
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
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Form Attributes</h3>
            <div className="mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={element.data?.required || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, required: e.target.checked } })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Required</span>
              </label>
            </div>
            <div className="mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={element.data?.disabled || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, disabled: e.target.checked } })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Disabled</span>
              </label>
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
