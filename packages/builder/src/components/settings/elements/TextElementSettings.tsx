'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown as HandleNumberKeyDownType, handleInputKeyDown as HandleInputKeyDownType } from '../../../utils/helpers';
import ApiSettings from '../ApiSettings';
import ColorPicker from '../../ui/ColorPicker';
import BreakpointBadge from '../../ui/BreakpointBadge';
import { Type, Square, Maximize2 } from 'lucide-react';

interface TextElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
  getBreakpointStyles: (styles: any) => any;
  handleInputKeyDown: typeof HandleInputKeyDownType;
  handleNumberKeyDown: typeof HandleNumberKeyDownType;
}

export default function TextElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  activeBreakpoint,
  updateElement,
  getBreakpointStyles,
  handleInputKeyDown,
  handleNumberKeyDown,
}: TextElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Heading</label>
            <input
              type="text"
              value={element.content.heading || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, heading: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={element.content.description || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, description: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              rows={4}
            />
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Typography */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Typography</h3>
            </div>
            
            {/* Default Settings Checkboxes - Grouped together */}
            <div className="mb-4 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-700 mb-2">Default Settings</div>
              
              {/* Use Default Site Font Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(() => {
                    const currentStyles = getBreakpointStyles(element.styles);
                    return currentStyles.useDefaultFont !== undefined 
                      ? currentStyles.useDefaultFont 
                      : true; // Default to true
                  })()}
                  onChange={(e) => {
                    const currentStyles = getBreakpointStyles(element.styles);
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          useDefaultFont: e.target.checked
                        } 
                      });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { 
                            ...bpStyles, 
                            useDefaultFont: e.target.checked
                          } 
                        } 
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-xs text-gray-700 font-medium">Use Default Site Font</span>
              </label>
              
              {/* Use Default Size Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(() => {
                    const currentStyles = getBreakpointStyles(element.styles);
                    return currentStyles.useDefaultSize !== undefined 
                      ? currentStyles.useDefaultSize 
                      : true; // Default to true
                  })()}
                  onChange={(e) => {
                    const currentStyles = getBreakpointStyles(element.styles);
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          useDefaultSize: e.target.checked
                        } 
                      });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { 
                            ...bpStyles, 
                            useDefaultSize: e.target.checked
                          } 
                        } 
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-xs text-gray-700 font-medium">Use Default Size</span>
              </label>
              
              {/* Use Default Color Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(() => {
                    const currentStyles = getBreakpointStyles(element.styles);
                    return currentStyles.useDefaultColor !== undefined 
                      ? currentStyles.useDefaultColor 
                      : true; // Default to true
                  })()}
                  onChange={(e) => {
                    const currentStyles = getBreakpointStyles(element.styles);
                    const isUnchecking = !e.target.checked;
                    
                    // Get current default color to initialize textColor if unchecking
                    let defaultColor = '#000000';
                    if (isUnchecking && typeof window !== 'undefined') {
                      const websiteContent = document.querySelector('[data-website-content="true"]');
                      const root = document.documentElement;
                      let color = '';
                      if (websiteContent) {
                        color = getComputedStyle(websiteContent).getPropertyValue('--color-text').trim();
                      }
                      if (!color) {
                        color = getComputedStyle(root).getPropertyValue('--color-text').trim();
                      }
                      if (color) {
                        defaultColor = color;
                      }
                    }
                    
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          useDefaultColor: e.target.checked,
                          // Initialize textColor with default color when unchecking (if not already set)
                          ...(isUnchecking && !currentStyles.textColor ? { textColor: defaultColor } : {})
                        } 
                      });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { 
                            ...bpStyles, 
                            useDefaultColor: e.target.checked,
                            // Initialize textColor with default color when unchecking (if not already set)
                            ...(isUnchecking && !bpStyles.textColor ? { textColor: defaultColor } : {})
                          } 
                        } 
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-xs text-gray-700 font-medium">Use Default Color</span>
              </label>
            </div>
            
            {/* Font Family */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                Font Family
              </label>
              <select
                value={element.styles.fontFamily || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, fontFamily: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                disabled={(() => {
                  const currentStyles = getBreakpointStyles(element.styles);
                  return currentStyles.useDefaultFont !== undefined 
                    ? currentStyles.useDefaultFont 
                    : true;
                })()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Default</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                <option value="'Times New Roman', Times, serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', Courier, monospace">Courier New</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Open Sans', sans-serif">Open Sans</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Montserrat', sans-serif">Montserrat</option>
                <option value="'Poppins', sans-serif">Poppins</option>
              </select>
              {(() => {
                const currentStyles = getBreakpointStyles(element.styles);
                const useDefaultFont = currentStyles.useDefaultFont !== undefined 
                  ? currentStyles.useDefaultFont 
                  : true;
                if (useDefaultFont && typeof window !== 'undefined') {
                  const websiteContent = document.querySelector('[data-website-content="true"]');
                  const root = document.documentElement;
                  let font = '';
                  if (websiteContent) {
                    font = getComputedStyle(websiteContent).getPropertyValue('--font-family').trim();
                  }
                  if (!font) {
                    font = getComputedStyle(root).getPropertyValue('--font-family').trim();
                  }
                  if (font) {
                    return <p className="text-xs text-gray-500 mt-1.5">Using default site font from theme settings: {font.split(',')[0].replace(/['"]/g, '')}</p>;
                  }
                }
                return <p className="text-xs text-gray-500 mt-1.5">Choose a font family for the text</p>;
              })()}
            </div>

            {/* Font Size */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5" />
                Font Size
              </label>
              <input
                type="text"
                value={element.styles.fontSize || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, fontSize: e.target.value } })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, element.styles.fontSize || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, fontSize: val } }), 0.1, 1, 5);
                  }
                }}
                disabled={(() => {
                  const currentStyles = getBreakpointStyles(element.styles);
                  return currentStyles.useDefaultSize !== undefined 
                    ? currentStyles.useDefaultSize 
                    : true;
                })()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., 1rem, 16px"
              />
              {(() => {
                const currentStyles = getBreakpointStyles(element.styles);
                const useDefaultSize = currentStyles.useDefaultSize !== undefined 
                  ? currentStyles.useDefaultSize 
                  : true;
                if (useDefaultSize && typeof window !== 'undefined') {
                  const websiteContent = document.querySelector('[data-website-content="true"]');
                  const root = document.documentElement;
                  let size = '';
                  if (websiteContent) {
                    size = getComputedStyle(websiteContent).getPropertyValue('--text-size-base').trim();
                  }
                  if (!size) {
                    size = getComputedStyle(root).getPropertyValue('--text-size-base').trim();
                  }
                  if (size) {
                    return <p className="text-xs text-gray-500 mt-1.5">Using default size from theme settings: {size}</p>;
                  }
                }
                return <p className="text-xs text-gray-500 mt-1.5">Set the font size (px, rem, em)</p>;
              })()}
            </div>
            
            {/* Text Color */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                Text Color {activeBreakpoint !== 'desktop' && <BreakpointBadge styles={element.styles} property="textColor" activeBreakpoint={activeBreakpoint} />}
              </label>
              {(() => {
                // Read useDefaultColor directly from element.styles to get the latest value
                // This ensures we have the most up-to-date state
                const useDefaultColorFromStyles = activeBreakpoint === 'desktop'
                  ? (element.styles?.useDefaultColor)
                  : (element.styles?.[activeBreakpoint]?.useDefaultColor);
                
                const useDefaultColor = useDefaultColorFromStyles !== undefined 
                  ? useDefaultColorFromStyles 
                  : true; // Default to true
                
                const currentStyles = getBreakpointStyles(element.styles);
                
                // Always get default color from CSS variable (for reference)
                let defaultColor = '#000000';
                if (typeof window !== 'undefined') {
                  const websiteContent = document.querySelector('[data-website-content="true"]');
                  const root = document.documentElement;
                  let color = '';
                  if (websiteContent) {
                    color = getComputedStyle(websiteContent).getPropertyValue('--color-text').trim();
                  }
                  if (!color) {
                    color = getComputedStyle(root).getPropertyValue('--color-text').trim();
                  }
                  if (color) {
                    defaultColor = color;
                  }
                }

                // When useDefaultColor is true: show theme color
                // When useDefaultColor is false: show stored textColor, or defaultColor if not set yet
                // IMPORTANT: Read textColor directly from element.styles to ensure we get the latest value
                const storedTextColor = activeBreakpoint === 'desktop' 
                  ? (element.styles?.textColor)
                  : (element.styles?.[activeBreakpoint]?.textColor);
                
                const displayColor = useDefaultColor 
                  ? defaultColor 
                  : (storedTextColor || currentStyles.textColor || defaultColor);

                return (
                  <div className="space-y-2">
                    {useDefaultColor && (
                      <p className="text-xs text-gray-500 mb-1">
                        Using default text color from theme settings: {defaultColor}
                      </p>
                    )}
                    <ColorPicker
                      value={displayColor}
                      onChange={(color) => {
                        // When user changes color, ensure useDefaultColor is false
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              textColor: color,
                              useDefaultColor: false // Explicitly set to false when color is changed
                            } 
                          });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { 
                                ...bpStyles, 
                                textColor: color,
                                useDefaultColor: false // Explicitly set to false when color is changed
                              } 
                            } 
                          });
                        }
                      }}
                      disabled={useDefaultColor}
                      showTransparent={false}
                      label={undefined}
                    />
                  </div>
                );
              })()}
              <p className="text-xs text-gray-500 mt-1.5">Color of the text</p>
            </div>
          </div>
        </>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <>
          <div className="text-sm text-gray-500 mb-4">No advanced settings for text element</div>
          
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


