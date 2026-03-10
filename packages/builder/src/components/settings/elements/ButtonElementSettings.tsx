'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleInputKeyDown } from '../../../utils/helpers';
import ApiSettings from '../ApiSettings';
import ColorPicker from '../../ui/ColorPicker';
import { Layers, AlignLeft, AlignCenter, AlignRight, Maximize2, Move, Square, Type } from 'lucide-react';

interface ButtonElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function ButtonElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: ButtonElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
            <input
              type="text"
              value={element.content.buttonText || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, buttonText: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Click Me"
            />
          </div>

          {/* Button Type */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Button Type</label>
            <select
              value={element.content.buttonType || 'link'}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, buttonType: e.target.value as any } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="link">Link (Anchor Tag)</option>
              <option value="button">Button (Button Tag)</option>
              <option value="submit">Submit (Form Submit)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {element.content.buttonType === 'link' && 'Creates an anchor tag for navigation'}
              {element.content.buttonType === 'button' && 'Creates a button tag (no default action)'}
              {element.content.buttonType === 'submit' && 'Creates a submit button for forms'}
            </p>
          </div>

          {/* Button Link (for link type) */}
          {(element.content.buttonType === 'link' || !element.content.buttonType) && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Button Link</label>
                <input
                  type="text"
                  value={element.content.buttonLink || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, buttonLink: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="https://example.com or #section"
                />
              </div>

              {/* Link Target */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Target</label>
                <select
                  value={element.content.buttonTarget || '_self'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, buttonTarget: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="_self">Same Window</option>
                  <option value="_blank">New Tab</option>
                  <option value="_parent">Parent Frame</option>
                  <option value="_top">Top Frame</option>
                </select>
              </div>

              {/* Link Rel */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Rel (Optional)</label>
                <input
                  type="text"
                  value={element.content.buttonRel || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, buttonRel: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., noopener noreferrer"
                />
                <p className="text-xs text-gray-500 mt-1">For security and SEO (auto-added for external links if empty)</p>
              </div>
            </>
          )}

          {/* Icon Settings */}
          <div className="mb-3 border-t pt-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Icon Settings</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Icon Name/Emoji</label>
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
                <label className="block text-xs text-gray-600 mb-1">Icon Position</label>
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
          </div>

          {/* Button States */}
          <div className="mb-3 border-t pt-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Button States</h3>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-gray-600">Disabled</label>
              <input
                type="checkbox"
                checked={element.content.buttonDisabled || false}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, buttonDisabled: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mb-3">Disable button interaction</p>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-gray-600">Loading State</label>
              <input
                type="checkbox"
                checked={element.content.buttonLoading || false}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, buttonLoading: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500">Show loading spinner (for async actions)</p>
          </div>
        </>
      )}

      {/* Style Tab - This will be very large, so I'll create it in parts */}
      {activeTab === 'style' && (
        <>
          {/* Default Settings Checkboxes - Grouped together */}
          <div className="mb-4 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">Default Settings</div>
            
            {/* Use Default Site Font Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={element.styles.useDefaultFont !== undefined 
                  ? element.styles.useDefaultFont 
                  : true} // Default to true
                onChange={(e) => {
                  updateElement(sectionId, rowId, columnId, element.id, { 
                    styles: { 
                      ...element.styles, 
                      useDefaultFont: e.target.checked
                    } 
                  });
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-xs text-gray-700 font-medium">Use Default Site Font</span>
            </label>
            
            {/* Use Default Size Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={element.styles.useDefaultSize !== undefined 
                  ? element.styles.useDefaultSize 
                  : true} // Default to true
                onChange={(e) => {
                  updateElement(sectionId, rowId, columnId, element.id, { 
                    styles: { 
                      ...element.styles, 
                      useDefaultSize: e.target.checked
                    } 
                  });
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-xs text-gray-700 font-medium">Use Default Size</span>
            </label>
            
            {/* Use Default Color Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={element.styles.useDefaultColor !== undefined 
                  ? element.styles.useDefaultColor 
                  : true} // Default to true
                onChange={(e) => {
                  updateElement(sectionId, rowId, columnId, element.id, { 
                    styles: { 
                      ...element.styles, 
                      useDefaultColor: e.target.checked
                    } 
                  });
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-xs text-gray-700 font-medium">Use Default Color</span>
            </label>
          </div>
          
          {/* Button Colors */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Button Colors</h3>
            
            {/* Use Default Button Checkbox */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={element.styles.useDefaultButton !== undefined 
                    ? element.styles.useDefaultButton 
                    : true} // Default to true
                  onChange={(e) => {
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { 
                        ...element.styles, 
                        useDefaultButton: e.target.checked
                      } 
                    });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-xs text-gray-700 font-medium">Use Default Button</span>
              </label>
            </div>
            
            <div className="space-y-4 mb-3">
              {/* Background Color */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  Background Color
                </label>
                
                {/* Use Default Background Color Checkbox */}
                <div className="mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={element.styles.useDefaultBackgroundColor !== undefined 
                        ? element.styles.useDefaultBackgroundColor 
                        : true} // Default to true
                      onChange={(e) => {
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            useDefaultBackgroundColor: e.target.checked
                          } 
                        });
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-xs text-gray-700 font-medium">Use Default Background Color</span>
                  </label>
                </div>

                {(() => {
                  const useDefaultBackgroundColor = element.styles.useDefaultBackgroundColor !== undefined 
                    ? element.styles.useDefaultBackgroundColor 
                    : true; // Default to true
                  
                  // Get default color from CSS variable
                  let defaultColor = '#3b82f6';
                  if (typeof window !== 'undefined' && useDefaultBackgroundColor) {
                    const websiteContent = document.querySelector('[data-website-content="true"]');
                    const root = document.documentElement;
                    let color = '';
                    if (websiteContent) {
                      color = getComputedStyle(websiteContent).getPropertyValue('--color-primary-bg').trim();
                    }
                    if (!color) {
                      color = getComputedStyle(root).getPropertyValue('--color-primary-bg').trim();
                    }
                    if (color) {
                      defaultColor = color;
                    }
                  }

                  if (useDefaultBackgroundColor) {
                    return (
                      <div className="space-y-2">
                        <input
                          type="text"
                          disabled
                          value={`var(--color-primary-bg, ${defaultColor})`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          Using default background color from theme settings: {defaultColor}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      <ColorPicker
                        value={element.styles.buttonColor && element.styles.buttonColor !== 'transparent' ? element.styles.buttonColor : '#3b82f6'}
                        onChange={(color) => {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonColor: color } });
                        }}
                        showTransparent={true}
                        isTransparent={element.styles.buttonColor === 'transparent'}
                        onTransparentToggle={() => {
                          const newColor = element.styles.buttonColor === 'transparent' ? '#3b82f6' : 'transparent';
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonColor: newColor } });
                        }}
                        label={undefined}
                      />
                    </div>
                  );
                })()}
              </div>
              
              {/* Text Color */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Text Color
                </label>
                
                {(() => {
                  const useDefaultColor = element.styles.useDefaultColor !== undefined 
                    ? element.styles.useDefaultColor 
                    : true; // Default to true
                  
                  // Get default color from CSS variable
                  let defaultColor = '#ffffff';
                  if (typeof window !== 'undefined' && useDefaultColor) {
                    const websiteContent = document.querySelector('[data-website-content="true"]');
                    const root = document.documentElement;
                    let color = '';
                    if (websiteContent) {
                      color = getComputedStyle(websiteContent).getPropertyValue('--color-primary-text').trim();
                    }
                    if (!color) {
                      color = getComputedStyle(root).getPropertyValue('--color-primary-text').trim();
                    }
                    if (color) {
                      defaultColor = color;
                    }
                  }

                  if (useDefaultColor) {
                    return (
                      <div className="space-y-2">
                        <input
                          type="text"
                          disabled
                          value={`var(--color-primary-text, ${defaultColor})`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          Using default text color from theme settings: {defaultColor}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      <ColorPicker
                        value={element.styles.buttonTextColor && element.styles.buttonTextColor !== 'transparent' ? element.styles.buttonTextColor : '#ffffff'}
                        onChange={(color) => {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonTextColor: color } });
                        }}
                        showTransparent={true}
                        isTransparent={element.styles.buttonTextColor === 'transparent'}
                        onTransparentToggle={() => {
                          const newColor = element.styles.buttonTextColor === 'transparent' ? '#ffffff' : 'transparent';
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonTextColor: newColor } });
                        }}
                        label={undefined}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Button Size & Spacing */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Button Size & Spacing</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Size Preset</label>
              <select
                value={element.styles.buttonSize || 'medium'}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonSize: e.target.value as any } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {element.styles.buttonSize === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <input
                    type="text"
                    value={element.styles.buttonWidth || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonWidth: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 200px, 100%"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Height</label>
                  <input
                    type="text"
                    value={element.styles.buttonHeight || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonHeight: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 40px, auto"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Width</label>
                <input
                  type="text"
                  value={element.styles.buttonMinWidth || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonMinWidth: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 120px"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Width</label>
                <input
                  type="text"
                  value={element.styles.buttonMaxWidth || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonMaxWidth: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 300px"
                />
              </div>
            </div>
          </div>

          {/* Button Typography */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Button Typography</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Font Family</label>
              <select
                value={element.styles.buttonFontFamily || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonFontFamily: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Default</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                <option value="'Times New Roman', Times, serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', Courier, monospace">Courier New</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="'Segoe UI', Tahoma, sans-serif">Segoe UI</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Open Sans', sans-serif">Open Sans</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Montserrat', sans-serif">Montserrat</option>
                <option value="'Poppins', sans-serif">Poppins</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                <input
                  type="text"
                  value={element.styles.buttonFontSize || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonFontSize: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 16px, 1rem"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
                <select
                  value={element.styles.buttonFontWeight || '500'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonFontWeight: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="100">100 (Thin)</option>
                  <option value="200">200 (Extra Light)</option>
                  <option value="300">300 (Light)</option>
                  <option value="400">400 (Normal)</option>
                  <option value="500">500 (Medium)</option>
                  <option value="600">600 (Semi Bold)</option>
                  <option value="700">700 (Bold)</option>
                  <option value="800">800 (Extra Bold)</option>
                  <option value="900">900 (Black)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Line Height</label>
                <input
                  type="text"
                  value={element.styles.buttonLineHeight || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonLineHeight: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 1.5, 24px"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Letter Spacing</label>
                <input
                  type="text"
                  value={element.styles.buttonLetterSpacing || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonLetterSpacing: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 0.5px"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Transform</label>
                <select
                  value={element.styles.buttonTextTransform || 'none'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonTextTransform: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="none">None</option>
                  <option value="uppercase">Uppercase</option>
                  <option value="lowercase">Lowercase</option>
                  <option value="capitalize">Capitalize</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Decoration</label>
                <select
                  value={element.styles.buttonTextDecoration || 'none'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonTextDecoration: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="none">None</option>
                  <option value="underline">Underline</option>
                  <option value="line-through">Line Through</option>
                </select>
              </div>
            </div>
          </div>

          {/* Button Border & Shape */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Button Border & Shape</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
              <input
                type="text"
                value={element.styles.buttonBorderRadius || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonBorderRadius: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., 6px, 50%"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Border Width</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Top</label>
                  <input
                    type="text"
                    value={element.styles.buttonBorderTopWidth || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonBorderTopWidth: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 2px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Right</label>
                  <input
                    type="text"
                    value={element.styles.buttonBorderRightWidth || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonBorderRightWidth: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 2px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                  <input
                    type="text"
                    value={element.styles.buttonBorderBottomWidth || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonBorderBottomWidth: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 2px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Left</label>
                  <input
                    type="text"
                    value={element.styles.buttonBorderLeftWidth || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonBorderLeftWidth: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 2px"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Border Style</label>
                <select
                  value={element.styles.buttonBorderStyle || 'solid'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonBorderStyle: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Border Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.styles.buttonBorderColor && element.styles.buttonBorderColor !== 'transparent' ? element.styles.buttonBorderColor : '#000000'}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonBorderColor: e.target.value } })}
                    className="flex-1 h-10 border border-gray-300 rounded"
                    disabled={element.styles.buttonBorderColor === 'transparent'}
                  />
                  <button
                    onClick={() => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonBorderColor: element.styles.buttonBorderColor === 'transparent' ? '#000000' : 'transparent' } })}
                    className={`px-3 py-2 rounded text-xs font-medium border ${
                      element.styles.buttonBorderColor === 'transparent'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {element.styles.buttonBorderColor === 'transparent' ? '✓' : 'T'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Button Effects */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Button Effects</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Box Shadow</label>
                <input
                  type="text"
                  value={element.styles.buttonBoxShadow || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonBoxShadow: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 0 2px 4px rgba(0,0,0,0.1)"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Shadow</label>
                <input
                  type="text"
                  value={element.styles.buttonTextShadow || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonTextShadow: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 1px 1px 2px rgba(0,0,0,0.5)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                <input
                  type="text"
                  value={element.styles.buttonOpacity || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonOpacity: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 1, 0.8"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Transform</label>
                <input
                  type="text"
                  value={element.styles.buttonTransform || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonTransform: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., scale(1.05)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hover Transform</label>
                <input
                  type="text"
                  value={element.styles.buttonHoverTransform || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonHoverTransform: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., scale(1.1)"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hover Transition</label>
                <input
                  type="text"
                  value={element.styles.buttonHoverTransition || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonHoverTransition: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., all 0.3s ease"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Hover Box Shadow</label>
              <input
                type="text"
                value={element.styles.buttonHoverBoxShadow || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonHoverBoxShadow: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., 0 4px 8px rgba(0,0,0,0.2)"
              />
            </div>
          </div>
        </>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <>
          {/* Layout */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Layout</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Display
                </label>
                <select
                  value={element.styles.display || 'inline-block'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, display: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="block">Block</option>
                  <option value="inline-block">Inline Block</option>
                  <option value="inline">Inline</option>
                  <option value="flex">Flex</option>
                  <option value="inline-flex">Inline Flex</option>
                  <option value="grid">Grid</option>
                  <option value="inline-grid">Inline Grid</option>
                  <option value="none">None</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Element display type</p>
              </div>
            </div>
          </div>

          {/* Spacing */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Maximize2 className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Spacing</h3>
            </div>
            
            <div className="space-y-4">
              {/* Padding */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Padding
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Top</label>
                    <input
                      type="text"
                      value={element.styles.buttonPaddingTop || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonPaddingTop: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 12px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Right</label>
                    <input
                      type="text"
                      value={element.styles.buttonPaddingRight || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonPaddingRight: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 24px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                    <input
                      type="text"
                      value={element.styles.buttonPaddingBottom || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonPaddingBottom: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 12px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Left</label>
                    <input
                      type="text"
                      value={element.styles.buttonPaddingLeft || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonPaddingLeft: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 24px"
                    />
                  </div>
                </div>
              </div>

              {/* Gap */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Icon Gap
                </label>
                <input
                  type="text"
                  value={element.styles.buttonGap || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonGap: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 8px"
                />
                <p className="text-xs text-gray-500 mt-1.5">Spacing between icon and text</p>
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <AlignLeft className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Alignment</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <AlignLeft className="w-3.5 h-3.5" />
                  Button Alignment
                </label>
                <select
                  value={element.styles.buttonAlignment || 'center'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonAlignment: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="full">Full Width</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Horizontal alignment of button</p>
              </div>
            </div>
          </div>

          {/* Position */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Move className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Position</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Position
                </label>
                <select
                  value={element.styles.position || 'relative'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, position: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="static">Static</option>
                  <option value="relative">Relative</option>
                  <option value="absolute">Absolute</option>
                  <option value="fixed">Fixed</option>
                  <option value="sticky">Sticky</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Element positioning type</p>
              </div>

              {(element.styles.position === 'absolute' || element.styles.position === 'fixed' || element.styles.position === 'relative' || element.styles.position === 'sticky') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Top</label>
                    <input
                      type="text"
                      value={element.styles.top || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, top: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Right</label>
                    <input
                      type="text"
                      value={element.styles.right || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, right: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bottom</label>
                    <input
                      type="text"
                      value={element.styles.bottom || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, bottom: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Left</label>
                    <input
                      type="text"
                      value={element.styles.left || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, left: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Z-Index
                </label>
                <input
                  type="text"
                  value={element.styles.zIndex || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, zIndex: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1, 10, 999"
                />
                <p className="text-xs text-gray-500 mt-1.5">Stacking order (higher values appear on top)</p>
              </div>
            </div>
          </div>

          {/* Hover States */}
          <div className="mb-4 border-t pt-4 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Hover States</h3>
            
            {/* Hover Animation */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Hover Animation</label>
              <select
                value={element.styles.buttonHoverAnimation || 'none'}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonHoverAnimation: e.target.value as any } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="scale">Scale</option>
                <option value="slide">Slide</option>
                <option value="bounce">Bounce</option>
                <option value="pulse">Pulse</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hover Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.styles.buttonHoverColor && element.styles.buttonHoverColor !== 'transparent' ? element.styles.buttonHoverColor : '#2563eb'}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonHoverColor: e.target.value } })}
                    className="flex-1 h-10 border border-gray-300 rounded"
                    disabled={element.styles.buttonHoverColor === 'transparent'}
                  />
                  <button
                    onClick={() => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonHoverColor: element.styles.buttonHoverColor === 'transparent' ? '#2563eb' : 'transparent' } })}
                    className={`px-3 py-2 rounded text-xs font-medium border ${
                      element.styles.buttonHoverColor === 'transparent'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {element.styles.buttonHoverColor === 'transparent' ? '✓' : 'T'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hover Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.styles.buttonHoverTextColor && element.styles.buttonHoverTextColor !== 'transparent' ? element.styles.buttonHoverTextColor : '#ffffff'}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonHoverTextColor: e.target.value } })}
                    className="flex-1 h-10 border border-gray-300 rounded"
                    disabled={element.styles.buttonHoverTextColor === 'transparent'}
                  />
                  <button
                    onClick={() => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonHoverTextColor: element.styles.buttonHoverTextColor === 'transparent' ? '#ffffff' : 'transparent' } })}
                    className={`px-3 py-2 rounded text-xs font-medium border ${
                      element.styles.buttonHoverTextColor === 'transparent'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {element.styles.buttonHoverTextColor === 'transparent' ? '✓' : 'T'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Click States */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Click States</h3>
            
            {/* Click Animation */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Click Animation</label>
              <select
                value={element.styles.buttonClickAnimation || 'none'}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonClickAnimation: e.target.value as any } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="scale">Scale</option>
                <option value="slide">Slide</option>
                <option value="bounce">Bounce</option>
                <option value="pulse">Pulse</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Click Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.styles.buttonActiveColor && element.styles.buttonActiveColor !== 'transparent' ? element.styles.buttonActiveColor : '#1d4ed8'}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonActiveColor: e.target.value } })}
                    className="flex-1 h-10 border border-gray-300 rounded"
                    disabled={element.styles.buttonActiveColor === 'transparent'}
                  />
                  <button
                    onClick={() => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonActiveColor: element.styles.buttonActiveColor === 'transparent' ? '#1d4ed8' : 'transparent' } })}
                    className={`px-3 py-2 rounded text-xs font-medium border ${
                      element.styles.buttonActiveColor === 'transparent'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {element.styles.buttonActiveColor === 'transparent' ? '✓' : 'T'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Click Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.styles.buttonActiveTextColor && element.styles.buttonActiveTextColor !== 'transparent' ? element.styles.buttonActiveTextColor : '#ffffff'}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonActiveTextColor: e.target.value } })}
                    className="flex-1 h-10 border border-gray-300 rounded"
                    disabled={element.styles.buttonActiveTextColor === 'transparent'}
                  />
                  <button
                    onClick={() => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonActiveTextColor: element.styles.buttonActiveTextColor === 'transparent' ? '#ffffff' : 'transparent' } })}
                    className={`px-3 py-2 rounded text-xs font-medium border ${
                      element.styles.buttonActiveTextColor === 'transparent'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {element.styles.buttonActiveTextColor === 'transparent' ? '✓' : 'T'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active & Focus States */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Active & Focus States</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Focus Outline</label>
              <input
                type="text"
                value={element.styles.buttonFocusOutline || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonFocusOutline: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., 2px solid, none"
              />
              <p className="text-xs text-gray-500 mt-1">CSS outline for focus state</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Focus Ring Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.styles.buttonFocusRingColor && element.styles.buttonFocusRingColor !== 'transparent' ? element.styles.buttonFocusRingColor : '#3b82f6'}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonFocusRingColor: e.target.value } })}
                    className="flex-1 h-10 border border-gray-300 rounded"
                    disabled={element.styles.buttonFocusRingColor === 'transparent'}
                  />
                  <button
                    onClick={() => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonFocusRingColor: element.styles.buttonFocusRingColor === 'transparent' ? '#3b82f6' : 'transparent' } })}
                    className={`px-3 py-2 rounded text-xs font-medium border ${
                      element.styles.buttonFocusRingColor === 'transparent'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {element.styles.buttonFocusRingColor === 'transparent' ? '✓' : 'T'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Focus Ring Width</label>
                <input
                  type="text"
                  value={element.styles.buttonFocusRingWidth || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonFocusRingWidth: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 2px, 4px"
                />
              </div>
            </div>
          </div>

          {/* Button Animations */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Button Animations</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Animation Type</label>
              <select
                value={element.styles.buttonAnimation || 'none'}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonAnimation: e.target.value as any } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="bounce">Bounce</option>
                <option value="pulse">Pulse</option>
              </select>
            </div>
            {element.styles.buttonAnimation && element.styles.buttonAnimation !== 'none' && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Duration</label>
                    <input
                      type="text"
                      value={element.styles.buttonAnimationDuration || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonAnimationDuration: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="e.g., 0.5s, 1s"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Delay</label>
                    <input
                      type="text"
                      value={element.styles.buttonAnimationDelay || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonAnimationDelay: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="e.g., 0s, 0.2s"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Iteration</label>
                  <input
                    type="text"
                    value={element.styles.buttonAnimationIteration || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonAnimationIteration: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 1, infinite"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of times to repeat (1, 2, infinite, etc.)</p>
                </div>
              </>
            )}
          </div>

          {/* Responsive Settings */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Responsive Settings</h3>
            <p className="text-xs text-gray-500 mb-3">Override default settings for specific breakpoints</p>
            
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Mobile</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <input
                    type="text"
                    value={element.styles.buttonWidthMobile || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonWidthMobile: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 100%, 200px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                  <input
                    type="text"
                    value={element.styles.buttonFontSizeMobile || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonFontSizeMobile: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 14px, 0.875rem"
                  />
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-xs text-gray-600 mb-1">Padding</label>
                <input
                  type="text"
                  value={element.styles.buttonPaddingMobile || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonPaddingMobile: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 10px 20px"
                />
              </div>
            </div>

            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Tablet</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <input
                    type="text"
                    value={element.styles.buttonWidthTablet || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonWidthTablet: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 100%, 250px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                  <input
                    type="text"
                    value={element.styles.buttonFontSizeTablet || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonFontSizeTablet: e.target.value } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 15px, 0.9375rem"
                  />
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-xs text-gray-600 mb-1">Padding</label>
                <input
                  type="text"
                  value={element.styles.buttonPaddingTablet || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonPaddingTablet: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 12px 24px"
                />
              </div>
            </div>
          </div>

          {/* Accessibility */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Accessibility</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">ARIA Label</label>
              <input
                type="text"
                value={element.styles.buttonAriaLabel || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonAriaLabel: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., Submit form, Navigate to home"
              />
              <p className="text-xs text-gray-500 mt-1">Accessible label for screen readers</p>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">ARIA Description</label>
              <input
                type="text"
                value={element.styles.buttonAriaDescription || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonAriaDescription: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Additional context for screen readers"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">ARIA Pressed</label>
                <input
                  type="checkbox"
                  checked={element.styles.buttonAriaPressed || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonAriaPressed: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">ARIA Expanded</label>
                <input
                  type="checkbox"
                  checked={element.styles.buttonAriaExpanded || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonAriaExpanded: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">ARIA attributes for toggle buttons and expandable content</p>
          </div>

          {/* Advanced Behavior */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Behavior</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Custom CSS Class</label>
              <input
                type="text"
                value={element.styles.buttonCustomClass || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonCustomClass: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., my-custom-button"
              />
              <p className="text-xs text-gray-500 mt-1">Add custom CSS classes to the button</p>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">OnClick Handler (JavaScript)</label>
              <textarea
                value={element.styles.buttonOnClick || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, buttonOnClick: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                rows={4}
                placeholder="e.g., console.log('clicked'); alert('Hello');"
              />
              <p className="text-xs text-gray-500 mt-1">Custom JavaScript code to execute on click (use with caution)</p>
            </div>
          </div>

          {/* API Settings */}
          <div className="border-t pt-4 mt-6">
            <ApiSettings
              element={element}
              updateElement={updateElement}
              sectionId={sectionId}
              rowId={rowId}
              columnId={columnId}
            />
          </div>
        </>
      )}
    </>
  );
}


