'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleInputKeyDown } from '../../../utils/helpers';
import ColorPickerWithTheme from '../../ui/ColorPickerWithTheme';
import { resolveColor, ColorSource } from '../../../utils/colorResolution';

interface ListElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function ListElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: ListElementSettingsProps) {
  // Get list items as string (one per line)
  const getItemsString = () => {
    if (!element.data?.items) return '';
    if (typeof element.data.items === 'string') return element.data.items;
    if (Array.isArray(element.data.items)) return element.data.items.join('\n');
    return '';
  };

  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">List Items</label>
            <textarea
              value={getItemsString()}
              onChange={(e) => {
                const items = e.target.value.split('\n').filter(item => item.trim().length > 0);
                updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, items: items } });
              }}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Enter items, one per line"
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-1">Enter each item on a new line</p>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">List Type</label>
            <select
              value={element.data?.listType || 'ul'}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { data: { ...element.data, listType: e.target.value as any } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="ul">Unordered (Bullets)</option>
              <option value="ol">Ordered (Numbers)</option>
            </select>
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* List Style */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">List Style</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">List Style Type</label>
              <select
                value={element.data?.listStyle || element.styles.listStyleType || 'disc'}
                onChange={(e) => {
                  updateElement(sectionId, rowId, columnId, element.id, { 
                    data: { ...element.data, listStyle: e.target.value },
                    styles: { ...element.styles, listStyleType: e.target.value }
                  });
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="disc">Disc (•)</option>
                <option value="circle">Circle (○)</option>
                <option value="square">Square (■)</option>
                <option value="none">None</option>
                <option value="decimal">Decimal (1, 2, 3)</option>
                <option value="decimal-leading-zero">Decimal Leading Zero (01, 02, 03)</option>
                <option value="lower-alpha">Lower Alpha (a, b, c)</option>
                <option value="upper-alpha">Upper Alpha (A, B, C)</option>
                <option value="lower-roman">Lower Roman (i, ii, iii)</option>
                <option value="upper-roman">Upper Roman (I, II, III)</option>
              </select>
            </div>
          </div>

          {/* Colors */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors</h3>
            <div className="mb-3">
              {(() => {
                const textColorSource = element.styles.textColorSource as ColorSource | undefined;
                const resolved = resolveColor(
                  element.styles.color && element.styles.color !== 'transparent' ? element.styles.color : '#000000',
                  textColorSource,
                  '',
                  '#000000',
                  'text',
                  'list'
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
                    elementType="list"
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
