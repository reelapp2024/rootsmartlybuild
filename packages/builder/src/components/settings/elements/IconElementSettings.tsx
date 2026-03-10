'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown, handleInputKeyDown } from '../../../utils/helpers';
import ColorPickerWithTheme from '../../ui/ColorPickerWithTheme';
import { resolveColor, ColorSource } from '../../../utils/colorResolution';

interface IconElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function IconElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: IconElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon Name/Emoji</label>
            <input
              type="text"
              value={element.content.iconName || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, iconName: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="e.g., →, ⭐, 🚀, or icon class name"
            />
            <p className="text-xs text-gray-500 mt-1">Enter emoji, Unicode symbol, or icon class name</p>
          </div>

          {element.content.iconName && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon Position</label>
              <select
                value={element.styles.iconPosition || 'left'}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, iconPosition: e.target.value as any } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          )}
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Icon Colors */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Icon Colors</h3>
            <div className="mb-3">
              {(() => {
                const textColorSource = element.styles.textColorSource as ColorSource | undefined;
                const resolved = resolveColor(
                  element.styles.textColor && element.styles.textColor !== 'transparent' ? element.styles.textColor : '#000000',
                  textColorSource,
                  '',
                  '#000000',
                  'text',
                  'icon'
                );
                
                return (
                  <ColorPickerWithTheme
                    value={resolved.value}
                    onChange={(color) => {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, textColor: color } });
                    }}
                    showTransparent={true}
                    isTransparent={element.styles.textColor === 'transparent'}
                    onTransparentToggle={() => {
                      const newColor = element.styles.textColor === 'transparent' ? '#000000' : 'transparent';
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, textColor: newColor } });
                    }}
                    label="Icon Color"
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
                    elementType="icon"
                    defaultCustomColor="#000000"
                  />
                );
              })()}
            </div>
          </div>

          {/* Icon Size */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Icon Size</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Icon Size</label>
                <input
                  type="text"
                  value={element.styles.iconSize || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, iconSize: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.iconSize || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, iconSize: val } }));
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
                  placeholder="e.g., 24px, auto"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Height</label>
                <input
                  type="text"
                  value={element.styles.height || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, height: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.height || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, height: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 24px, auto"
                />
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

          {/* Padding and Margin */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Spacing</h3>
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Padding</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Top</label>
                  <input
                    type="text"
                    value={element.styles.paddingTop || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingTop: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.paddingTop || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingTop: val } }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Right</label>
                  <input
                    type="text"
                    value={element.styles.paddingRight || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingRight: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.paddingRight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingRight: val } }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                  <input
                    type="text"
                    value={element.styles.paddingBottom || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingBottom: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.paddingBottom || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingBottom: val } }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Left</label>
                  <input
                    type="text"
                    value={element.styles.paddingLeft || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingLeft: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.paddingLeft || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingLeft: val } }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="0px"
                  />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Margin</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Top</label>
                  <input
                    type="text"
                    value={element.styles.marginTop || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginTop: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.marginTop || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginTop: val } }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Right</label>
                  <input
                    type="text"
                    value={element.styles.marginRight || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginRight: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.marginRight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginRight: val } }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bottom</label>
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
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Left</label>
                  <input
                    type="text"
                    value={element.styles.marginLeft || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginLeft: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.marginLeft || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginLeft: val } }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="0px"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <>
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Icon Alignment</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Text Alignment</label>
              <select
                value={element.styles.textAlign || 'left'}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, textAlign: e.target.value as any } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </>
      )}
    </>
  );
}

