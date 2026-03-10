'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown as HandleNumberKeyDownType, handleInputKeyDown as HandleInputKeyDownType } from '../../../utils/helpers';
import ColorPicker from '../../ui/ColorPicker';
import ColorPickerWithTheme from '../../ui/ColorPickerWithTheme';
import BreakpointBadge from '../../ui/BreakpointBadge';
import IconPicker from '../../ui/IconPicker';
import ApiSettings from '../ApiSettings';
import { resolveColor, ColorSource, getColorSourceFieldName } from '../../../utils/colorResolution';
import { Type, AlignLeft, AlignCenter, AlignRight, Maximize2, Move, Minus, Layers, Square, Eye, CornerDownRight, Zap, Link as LinkIcon, Sparkles } from 'lucide-react';

interface HeadingElementSettingsProps {
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

export default function HeadingElementSettings({
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
}: HeadingElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          {/* Heading Text */}
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
              <Type className="w-3.5 h-3.5" />
              Heading Text
            </label>
            <input
              type="text"
              value={element.content.heading || ''}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, heading: e.target.value } })}
              onKeyDown={handleInputKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter heading text"
            />
            <p className="text-xs text-gray-500 mt-1.5">Main heading text content</p>
          </div>

          {/* Link Settings */}
          <div className="border-t pt-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Link Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Link URL
                </label>
                <input
                  type="text"
                  value={element.content.headingLink || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, headingLink: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com or #section"
                />
                <p className="text-xs text-gray-500 mt-1.5">Make heading clickable (leave empty to disable link)</p>
              </div>

              {element.content.headingLink && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5" />
                      Link Target
                    </label>
                    <select
                      value={element.content.headingLinkTarget || '_self'}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, headingLinkTarget: e.target.value as any } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="_self">Same Window</option>
                      <option value="_blank">New Tab</option>
                      <option value="_parent">Parent Frame</option>
                      <option value="_top">Top Frame</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1.5">How the link should open</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5" />
                      Link Rel (Optional)
                    </label>
                    <input
                      type="text"
                      value={element.content.headingLinkRel || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, headingLinkRel: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., noopener noreferrer"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">For security and SEO (auto-added for external links if empty)</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Icon Settings */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Icon Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <IconPicker
                  value={element.content.iconName || ''}
                  onChange={(icon) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, iconName: icon } })}
                  label="Icon"
                />
                <p className="text-xs text-gray-500 mt-1.5">Click the icon button to choose from emoji library or type custom emoji/icon</p>
              </div>

              {element.content.iconName && (
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Icon Position
                  </label>
                  <select
                    value={element.styles.iconPosition || 'left'}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, iconPosition: e.target.value as any } })}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">Position of icon relative to heading text</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Heading Styles */}
          <div className="space-y-6">
            {/* Heading Tag */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Type className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Heading Tag</h3>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  HTML Tag
                </label>
                <select
                  value={element.styles.headingTag || 'h2'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingTag: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="h1">H1</option>
                  <option value="h2">H2</option>
                  <option value="h3">H3</option>
                  <option value="h4">H4</option>
                  <option value="h5">H5</option>
                  <option value="h6">H6</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">HTML semantic tag for the heading</p>
              </div>
            </div>

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
                      // Must be a valid hex color, not transparent or CSS variable
                      // Helper function to convert RGB to hex
                      const rgbToHex = (rgb: string): string => {
                        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                        if (match) {
                          const r = parseInt(match[1], 10);
                          const g = parseInt(match[2], 10);
                          const b = parseInt(match[3], 10);
                          return '#' + [r, g, b].map(x => {
                            const hex = x.toString(16);
                            return hex.length === 1 ? '0' + hex : hex;
                          }).join('');
                        }
                        return rgb;
                      };
                      
                      let defaultColor = '#000000';
                      if (isUnchecking && typeof window !== 'undefined') {
                        const websiteContent = document.querySelector('[data-website-content="true"]');
                        const root = document.documentElement;
                        let color = '';
                        if (websiteContent) {
                          color = getComputedStyle(websiteContent).getPropertyValue('--color-heading').trim();
                        }
                        if (!color) {
                          color = getComputedStyle(root).getPropertyValue('--color-heading').trim();
                        }
                        // Validate and convert color - must be a valid hex color, not transparent or empty
                        if (color && 
                            color !== 'transparent' && 
                            color.trim() !== '' &&
                            !color.startsWith('var(')) {
                          // Convert RGB to hex if needed
                          if (color.startsWith('rgb')) {
                            defaultColor = rgbToHex(color);
                          } else if (color.startsWith('#')) {
                            defaultColor = color;
                          }
                          // If it's not RGB or hex, keep defaultColor as '#000000'
                        }
                        // If color is invalid, keep defaultColor as '#000000'
                      }
                      
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            useDefaultColor: e.target.checked,
                            // Initialize textColor with default color when unchecking (if not already set)
                            // Ensure we always use a valid hex color
                            ...(isUnchecking && !currentStyles.textColor ? { 
                              textColor: (defaultColor && defaultColor.startsWith('#')) ? defaultColor : '#000000' 
                            } : {})
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
                              // Ensure we always use a valid hex color
                              ...(isUnchecking && !bpStyles.textColor ? { 
                                textColor: (defaultColor && defaultColor.startsWith('#')) ? defaultColor : '#000000' 
                              } : {})
                            } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-xs text-gray-700 font-medium">Use Default Color</span>
                </label>
                
                {/* Use Default Background Color Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(() => {
                      const currentStyles = getBreakpointStyles(element.styles);
                      return currentStyles.useDefaultBackgroundColor !== undefined 
                        ? currentStyles.useDefaultBackgroundColor 
                        : true; // Default to true
                    })()}
                    onChange={(e) => {
                      const currentStyles = getBreakpointStyles(element.styles);
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            useDefaultBackgroundColor: e.target.checked
                          } 
                        });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { 
                              ...bpStyles, 
                              useDefaultBackgroundColor: e.target.checked
                            } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-xs text-gray-700 font-medium">Use Default Background Color</span>
                </label>
              </div>
              
              {/* Text Color */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Text Color {activeBreakpoint !== 'desktop' && <BreakpointBadge styles={element.styles} property="textColor" activeBreakpoint={activeBreakpoint} />}
                </label>
                {(() => {
                  const currentStyles = getBreakpointStyles(element.styles);
                  const useDefaultColor = currentStyles.useDefaultColor !== undefined 
                    ? currentStyles.useDefaultColor 
                    : true; // Default to true
                  
                  // Get the stored textColor value - read directly from element.styles
                  const storedTextColor = activeBreakpoint === 'desktop'
                    ? (element.styles?.textColor)
                    : (element.styles?.[activeBreakpoint]?.textColor);
                  
                  // Get default theme color for display
                  let defaultThemeColor = '#000000';
                  if (typeof window !== 'undefined') {
                    const websiteContent = document.querySelector('[data-website-content="true"]');
                    const root = document.documentElement;
                    let color = '';
                    if (websiteContent) {
                      color = getComputedStyle(websiteContent).getPropertyValue('--color-heading').trim();
                    }
                    if (!color) {
                      color = getComputedStyle(root).getPropertyValue('--color-heading').trim();
                    }
                    if (color && color !== 'transparent' && !color.startsWith('var(')) {
                      defaultThemeColor = color;
                    }
                  }
                  
                  // Determine display color: if useDefaultColor is true, show theme color; otherwise show custom color
                  let displayColor: string;
                  if (useDefaultColor) {
                    // Show theme color when checkbox is checked
                    displayColor = defaultThemeColor;
                  } else {
                    // Show custom color when checkbox is unchecked
                    // Use stored textColor if available and valid, otherwise use theme color as fallback
                    if (storedTextColor && 
                        typeof storedTextColor === 'string' && 
                        storedTextColor.trim() !== '' &&
                        storedTextColor !== 'transparent' &&
                        !storedTextColor.startsWith('var(')) {
                      displayColor = storedTextColor;
                    } else {
                      // Fallback to theme color if no custom color is set
                      displayColor = defaultThemeColor;
                    }
                  }
                  
                  // Ensure displayColor is always a valid hex color
                  if (!displayColor || 
                      displayColor === 'transparent' || 
                      displayColor.trim() === '' ||
                      displayColor.startsWith('var(') ||
                      (!displayColor.startsWith('#') && !displayColor.startsWith('rgb'))) {
                    displayColor = '#000000';
                  }
                  
                  // Convert RGB to hex if needed
                  if (displayColor.startsWith('rgb')) {
                    const match = displayColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                    if (match) {
                      const r = parseInt(match[1], 10);
                      const g = parseInt(match[2], 10);
                      const b = parseInt(match[3], 10);
                      displayColor = '#' + [r, g, b].map(x => {
                        const hex = x.toString(16);
                        return hex.length === 1 ? '0' + hex : hex;
                      }).join('');
                    }
                  }
                  
                  // Final check - must be hex format
                  if (!displayColor.startsWith('#')) {
                    displayColor = '#000000';
                  }

                  return (
                    <>
                      {useDefaultColor && (
                        <p className="text-xs text-gray-500 mb-2">
                          Using default text color from theme settings: {defaultThemeColor}
                        </p>
                      )}
                      <ColorPicker
                        value={displayColor}
                        onChange={(color) => {
                          // Validate and normalize color
                          if (!color || color === 'transparent' || color.trim() === '' || color.startsWith('var(')) {
                            color = '#000000';
                          }
                          
                          // Convert RGB to hex if needed
                          let finalColor = color;
                          if (color.startsWith('rgb')) {
                            const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                            if (match) {
                              const r = parseInt(match[1], 10);
                              const g = parseInt(match[2], 10);
                              const b = parseInt(match[3], 10);
                              finalColor = '#' + [r, g, b].map(x => {
                                const hex = x.toString(16);
                                return hex.length === 1 ? '0' + hex : hex;
                              }).join('');
                            }
                          } else if (!color.startsWith('#')) {
                            finalColor = '#000000';
                          }
                          
                          // Save color and set useDefaultColor to false
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                textColor: finalColor,
                                useDefaultColor: false
                              } 
                            });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { 
                                  ...bpStyles, 
                                  textColor: finalColor,
                                  useDefaultColor: false
                                } 
                              } 
                            });
                          }
                        }}
                        disabled={useDefaultColor}
                        showTransparent={false}
                        label={undefined}
                      />
                    </>
                  );
                })()}
                <p className="text-xs text-gray-500 mt-1.5">Color of the heading text</p>
              </div>
              
              {/* Font Family */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Font Family
                </label>
                {/* Use Default Site Font Checkbox */}
                <div className="mb-2">
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
                </div>
                <select
                  value={element.styles.headingFontFamily || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingFontFamily: e.target.value } })}
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
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                  <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</option>
                  <option value="Tahoma, sans-serif">Tahoma</option>
                  <option value="'Gill Sans', 'Gill Sans MT', sans-serif">Gill Sans</option>
                  <option value="'Segoe UI', Tahoma, sans-serif">Segoe UI</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Lato', sans-serif">Lato</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="'Playfair Display', serif">Playfair Display</option>
                  <option value="'Merriweather', serif">Merriweather</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Choose a font family for the heading</p>
              </div>

              {/* Font Size */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Font Size
                </label>
                <input
                  type="text"
                  value={element.styles.headingFontSize || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingFontSize: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.headingFontSize || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingFontSize: val } }), 0.1, 1, 5);
                    }
                  }}
                  disabled={(() => {
                    const currentStyles = getBreakpointStyles(element.styles);
                    return currentStyles.useDefaultSize !== undefined 
                      ? currentStyles.useDefaultSize 
                      : true;
                  })()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="e.g., 2rem, 32px"
                />
                <p className="text-xs text-gray-500 mt-1.5">Set the font size (px, rem, em)</p>
              </div>

              {/* Font Weight */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Font Weight
                </label>
                <select
                  value={element.styles.headingFontWeight || '700'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingFontWeight: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="100">100 - Thin</option>
                  <option value="200">200 - Extra Light</option>
                  <option value="300">300 - Light</option>
                  <option value="400">400 - Normal</option>
                  <option value="500">500 - Medium</option>
                  <option value="600">600 - Semi Bold</option>
                  <option value="700">700 - Bold</option>
                  <option value="800">800 - Extra Bold</option>
                  <option value="900">900 - Black</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Boldness of the text</p>
              </div>

              {/* Line Height */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5" />
                  Line Height
                </label>
                <input
                  type="text"
                  value={element.styles.headingLineHeight || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingLineHeight: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.headingLineHeight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingLineHeight: val } }), 0.1, 0.5, 1);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1.2, 1.5em"
                />
                <p className="text-xs text-gray-500 mt-1.5">Space between lines (unitless or with unit)</p>
              </div>

              {/* Letter Spacing */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Letter Spacing
                </label>
                <input
                  type="text"
                  value={element.styles.headingLetterSpacing || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingLetterSpacing: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.headingLetterSpacing || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingLetterSpacing: val } }), 0.01, 0.05, 0.1);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 0.05em, 2px"
                />
                <p className="text-xs text-gray-500 mt-1.5">Space between characters</p>
              </div>

              {/* Text Transform */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Text Transform
                </label>
                <select
                  value={element.styles.headingTextTransform || 'none'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingTextTransform: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="none">None</option>
                  <option value="uppercase">Uppercase</option>
                  <option value="lowercase">Lowercase</option>
                  <option value="capitalize">Capitalize</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Transform text case</p>
              </div>

              {/* Text Decoration */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Text Decoration
                </label>
                <select
                  value={element.styles.headingTextDecoration || 'none'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingTextDecoration: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="none">None</option>
                  <option value="underline">Underline</option>
                  <option value="line-through">Line Through</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Add text decoration</p>
              </div>
            </div>

            {/* Background */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Background {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
              </div>
              {/* Background Color */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  Background Color {activeBreakpoint !== 'desktop' && <BreakpointBadge styles={element.styles} property="backgroundColor" activeBreakpoint={activeBreakpoint} />}
                </label>
                
                {/* Use Default Background Color Checkbox */}
                <div className="mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(() => {
                        const currentStyles = getBreakpointStyles(element.styles);
                        return currentStyles.useDefaultBackgroundColor !== undefined 
                          ? currentStyles.useDefaultBackgroundColor 
                          : true; // Default to true
                      })()}
                      onChange={(e) => {
                        const currentStyles = getBreakpointStyles(element.styles);
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              useDefaultBackgroundColor: e.target.checked
                            } 
                          });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { 
                                ...bpStyles, 
                                useDefaultBackgroundColor: e.target.checked
                              } 
                            } 
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-xs text-gray-700 font-medium">Use Default Background Color</span>
                  </label>
                </div>

                {(() => {
                  const currentStyles = getBreakpointStyles(element.styles);
                  const useDefaultBackgroundColor = currentStyles.useDefaultBackgroundColor !== undefined 
                    ? currentStyles.useDefaultBackgroundColor 
                    : true; // Default to true
                  
                  // Get default color from CSS variable
                  let defaultColor = '#ffffff';
                  if (typeof window !== 'undefined' && useDefaultBackgroundColor) {
                    const websiteContent = document.querySelector('[data-website-content="true"]');
                    const root = document.documentElement;
                    let color = '';
                    if (websiteContent) {
                      color = getComputedStyle(websiteContent).getPropertyValue('--color-surface').trim();
                    }
                    if (!color) {
                      color = getComputedStyle(root).getPropertyValue('--color-surface').trim();
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
                          value={`var(--color-surface, ${defaultColor})`}
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
                        value={currentStyles.backgroundColor || '#ffffff'}
                        onChange={(color) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                backgroundColor: color 
                              } 
                            });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, backgroundColor: color } 
                              } 
                            });
                          }
                        }}
                        showTransparent={true}
                        isTransparent={currentStyles.backgroundColor === 'transparent'}
                        onTransparentToggle={() => {
                          const currentBg = currentStyles.backgroundColor;
                          const newBg = currentBg === 'transparent' ? '#ffffff' : 'transparent';
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, backgroundColor: newBg } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, backgroundColor: newBg } 
                              } 
                            });
                          }
                        }}
                        label={undefined}
                      />
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-500 mt-1.5">Background color for the heading element</p>
              </div>
            </div>

            {/* Border Controls */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Square className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Border {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
              </div>

              {/* Border Preview */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </label>
                <div className="relative w-full h-20 rounded-lg bg-gray-50 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                  <div
                    className="w-full h-full rounded-lg"
                    style={{
                      borderWidth: getBreakpointStyles(element.styles).borderWidth || 
                        `${getBreakpointStyles(element.styles).borderTopWidth || '0px'} ${getBreakpointStyles(element.styles).borderRightWidth || '0px'} ${getBreakpointStyles(element.styles).borderBottomWidth || '0px'} ${getBreakpointStyles(element.styles).borderLeftWidth || '0px'}`,
                      borderStyle: getBreakpointStyles(element.styles).borderStyle || 'solid',
                      borderColor: getBreakpointStyles(element.styles).borderColor || '#000000',
                      borderRadius: getBreakpointStyles(element.styles).borderRadius || 
                        (getBreakpointStyles(element.styles).borderTopLeftRadius || getBreakpointStyles(element.styles).borderTopRightRadius || getBreakpointStyles(element.styles).borderBottomRightRadius || getBreakpointStyles(element.styles).borderBottomLeftRadius
                          ? `${getBreakpointStyles(element.styles).borderTopLeftRadius || '0px'} ${getBreakpointStyles(element.styles).borderTopRightRadius || '0px'} ${getBreakpointStyles(element.styles).borderBottomRightRadius || '0px'} ${getBreakpointStyles(element.styles).borderBottomLeftRadius || '0px'}`
                          : '0px'),
                      backgroundColor: getBreakpointStyles(element.styles).backgroundColor || '#ffffff',
                    }}
                  />
                </div>
              </div>

              {/* Border Widths */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5" />
                  <span>Border Widths {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                  <BreakpointBadge styles={element.styles} property="borderWidth" activeBreakpoint={activeBreakpoint} />
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">All</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderWidth || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderWidth: e.target.value, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderWidth: e.target.value, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderWidth || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderWidth: val, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderWidth: val, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2px"
                      title="All sides (overrides individual)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Top</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderTopWidth || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopWidth: e.target.value, borderWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderTopWidth: e.target.value, borderWidth: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderTopWidth || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopWidth: val, borderWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderTopWidth: val, borderWidth: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Right</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderRightWidth || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRightWidth: e.target.value, borderWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderRightWidth: e.target.value, borderWidth: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderRightWidth || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRightWidth: val, borderWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderRightWidth: val, borderWidth: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderBottomWidth || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomWidth: e.target.value, borderWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderBottomWidth: e.target.value, borderWidth: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderBottomWidth || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomWidth: val, borderWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderBottomWidth: val, borderWidth: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Left</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderLeftWidth || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderLeftWidth: e.target.value, borderWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderLeftWidth: e.target.value, borderWidth: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderLeftWidth || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderLeftWidth: val, borderWidth: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderLeftWidth: val, borderWidth: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0px"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">"All" overrides individual side widths</p>
              </div>

              {/* Border Style */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  Border Style
                </label>
                <select
                  value={getBreakpointStyles(element.styles).borderStyle || 'solid'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderStyle: e.target.value as any } });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { ...bpStyles, borderStyle: e.target.value as any } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="none">None</option>
                </select>
              </div>

              {/* Border Color */}
              <div className="mb-4">
                <ColorPicker
                  value={getBreakpointStyles(element.styles).borderColor || '#000000'}
                  onChange={(color) => {
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderColor: color } });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { ...bpStyles, borderColor: color } 
                        } 
                      });
                    }
                  }}
                  label="Border Color"
                  showTransparent={false}
                />
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  Border Radius
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">All</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderRadius || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRadius: e.target.value, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderRadius: e.target.value, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderRadius || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRadius: val, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderRadius: val, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="8px"
                      title="All corners (overrides individual)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Top Left</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderTopLeftRadius || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopLeftRadius: e.target.value, borderRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderTopLeftRadius: e.target.value, borderRadius: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderTopLeftRadius || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopLeftRadius: val, borderRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderTopLeftRadius: val, borderRadius: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Top Right</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderTopRightRadius || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopRightRadius: e.target.value, borderRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderTopRightRadius: e.target.value, borderRadius: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderTopRightRadius || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopRightRadius: val, borderRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderTopRightRadius: val, borderRadius: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bottom Right</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderBottomRightRadius || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomRightRadius: e.target.value, borderRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderBottomRightRadius: e.target.value, borderRadius: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderBottomRightRadius || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomRightRadius: val, borderRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderBottomRightRadius: val, borderRadius: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bottom Left</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).borderBottomLeftRadius || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomLeftRadius: e.target.value, borderRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderBottomLeftRadius: e.target.value, borderRadius: undefined } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).borderBottomLeftRadius || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomLeftRadius: val, borderRadius: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, borderBottomLeftRadius: val, borderRadius: undefined } 
                            } 
                          });
                        }
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0px"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">"All" overrides individual corner radius</p>
              </div>
            </div>

            {/* Box Shadow */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Box Shadow {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
              </div>

              {/* Shadow Preview */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </label>
                <div className="relative w-full h-20 rounded-lg bg-gray-50 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                  <div
                    className="w-full h-full rounded-lg"
                    style={{
                      boxShadow: getBreakpointStyles(element.styles).boxShadow || 
                        (getBreakpointStyles(element.styles).boxShadowOffsetX || getBreakpointStyles(element.styles).boxShadowOffsetY || getBreakpointStyles(element.styles).boxShadowBlur || getBreakpointStyles(element.styles).boxShadowSpread || getBreakpointStyles(element.styles).boxShadowColor
                          ? `${getBreakpointStyles(element.styles).boxShadowOffsetX || '0px'} ${getBreakpointStyles(element.styles).boxShadowOffsetY || '0px'} ${getBreakpointStyles(element.styles).boxShadowBlur || '0px'} ${getBreakpointStyles(element.styles).boxShadowSpread || '0px'} ${getBreakpointStyles(element.styles).boxShadowColor || '#000000'}`
                          : 'none'),
                      backgroundColor: getBreakpointStyles(element.styles).backgroundColor || '#ffffff',
                    }}
                  />
                </div>
              </div>

              {/* Shadow Color */}
              <div className="mb-4">
                <ColorPicker
                  value={getBreakpointStyles(element.styles).boxShadowColor || '#000000'}
                  onChange={(color) => {
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowColor: color } });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { ...bpStyles, boxShadowColor: color } 
                        } 
                      });
                    }
                  }}
                  label="Shadow Color"
                  showTransparent={false}
                />
              </div>

              {/* Shadow Properties */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Offset X
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).boxShadowOffsetX || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowOffsetX: e.target.value, boxShadow: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetX: e.target.value, boxShadow: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).boxShadowOffsetX || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowOffsetX: val, boxShadow: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetX: val, boxShadow: undefined } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Offset Y
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).boxShadowOffsetY || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowOffsetY: e.target.value, boxShadow: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetY: e.target.value, boxShadow: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).boxShadowOffsetY || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowOffsetY: val, boxShadow: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetY: val, boxShadow: undefined } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Blur
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).boxShadowBlur || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowBlur: e.target.value, boxShadow: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowBlur: e.target.value, boxShadow: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).boxShadowBlur || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowBlur: val, boxShadow: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowBlur: val, boxShadow: undefined } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Spread
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).boxShadowSpread || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowSpread: e.target.value, boxShadow: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowSpread: e.target.value, boxShadow: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(element.styles).boxShadowSpread || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowSpread: val, boxShadow: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowSpread: val, boxShadow: undefined } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
              </div>

              {/* Custom Shadow */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  Custom Shadow
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(element.styles).boxShadow || ''}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadow: e.target.value, boxShadowOffsetX: undefined, boxShadowOffsetY: undefined, boxShadowBlur: undefined, boxShadowSpread: undefined, boxShadowColor: undefined } });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { ...bpStyles, boxShadow: e.target.value, boxShadowOffsetX: undefined, boxShadowOffsetY: undefined, boxShadowBlur: undefined, boxShadowSpread: undefined, boxShadowColor: undefined } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 0 4px 6px rgba(0,0,0,0.1)"
                />
                <p className="text-xs text-gray-500 mt-1.5">Custom shadow overrides individual properties</p>
              </div>
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
              <h3 className="text-sm font-semibold text-gray-700">Layout {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>
            
            <div className="space-y-4">
              {/* Display */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Display
                </label>
                <select
                  value={getBreakpointStyles(element.styles).display || 'block'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, display: e.target.value } });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { ...bpStyles, display: e.target.value } 
                        } 
                      });
                    }
                  }}
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

              {/* Flex Direction (only show if display is flex) */}
              {(getBreakpointStyles(element.styles).display === 'flex' || getBreakpointStyles(element.styles).display === 'inline-flex') && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                      Flex Direction
                    </label>
                    <select
                      value={getBreakpointStyles(element.styles).flexDirection || 'row'}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, flexDirection: e.target.value } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, flexDirection: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="row">Row</option>
                      <option value="column">Column</option>
                      <option value="row-reverse">Row Reverse</option>
                      <option value="column-reverse">Column Reverse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                      Flex Wrap
                    </label>
                    <select
                      value={getBreakpointStyles(element.styles).flexWrap || 'nowrap'}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, flexWrap: e.target.value } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, flexWrap: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="nowrap">No Wrap</option>
                      <option value="wrap">Wrap</option>
                      <option value="wrap-reverse">Wrap Reverse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      Gap
                    </label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).gap || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, gap: e.target.value } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, gap: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 16px, 1rem"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Spacing between flex items</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alignment */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <AlignLeft className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Alignment {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>
            
            <div className="space-y-4">
              {/* Text Alignment */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  {getBreakpointStyles(element.styles).headingTextAlign === 'left' ? (
                    <AlignLeft className="w-3.5 h-3.5" />
                  ) : getBreakpointStyles(element.styles).headingTextAlign === 'right' ? (
                    <AlignRight className="w-3.5 h-3.5" />
                  ) : (
                    <AlignCenter className="w-3.5 h-3.5" />
                  )}
                  Text Alignment
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingTextAlign: 'left' } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, headingTextAlign: 'left' } 
                          } 
                        });
                      }
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      getBreakpointStyles(element.styles).headingTextAlign === 'left'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingTextAlign: 'center' } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, headingTextAlign: 'center' } 
                          } 
                        });
                      }
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      getBreakpointStyles(element.styles).headingTextAlign === 'center'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, headingTextAlign: 'right' } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, headingTextAlign: 'right' } 
                          } 
                        });
                      }
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      getBreakpointStyles(element.styles).headingTextAlign === 'right'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <AlignRight className="w-4 h-4 mx-auto" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Horizontal text alignment</p>
              </div>

              {/* Align Items (for flex/grid) */}
              {(getBreakpointStyles(element.styles).display === 'flex' || getBreakpointStyles(element.styles).display === 'inline-flex' || getBreakpointStyles(element.styles).display === 'grid' || getBreakpointStyles(element.styles).display === 'inline-grid') && (
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <AlignLeft className="w-3.5 h-3.5" />
                    Align Items
                  </label>
                  <select
                    value={getBreakpointStyles(element.styles).alignItems || 'stretch'}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, alignItems: e.target.value } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, alignItems: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="stretch">Stretch</option>
                    <option value="flex-start">Flex Start</option>
                    <option value="flex-end">Flex End</option>
                    <option value="center">Center</option>
                    <option value="baseline">Baseline</option>
                  </select>
                </div>
              )}

              {/* Justify Content (for flex/grid) */}
              {(getBreakpointStyles(element.styles).display === 'flex' || getBreakpointStyles(element.styles).display === 'inline-flex' || getBreakpointStyles(element.styles).display === 'grid' || getBreakpointStyles(element.styles).display === 'inline-grid') && (
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <AlignCenter className="w-3.5 h-3.5" />
                    Justify Content
                  </label>
                  <select
                    value={getBreakpointStyles(element.styles).justifyContent || 'flex-start'}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, justifyContent: e.target.value } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, justifyContent: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="flex-start">Flex Start</option>
                    <option value="flex-end">Flex End</option>
                    <option value="center">Center</option>
                    <option value="space-between">Space Between</option>
                    <option value="space-around">Space Around</option>
                    <option value="space-evenly">Space Evenly</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Spacing */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Maximize2 className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Spacing {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>
            
            {/* Padding */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5" />
                <span>Padding {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="padding" activeBreakpoint={activeBreakpoint} />
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">All</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).padding || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, padding: e.target.value, paddingTop: undefined, paddingRight: undefined, paddingBottom: undefined, paddingLeft: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, padding: e.target.value, paddingTop: undefined, paddingRight: undefined, paddingBottom: undefined, paddingLeft: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).padding || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, padding: val, paddingTop: undefined, paddingRight: undefined, paddingBottom: undefined, paddingLeft: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, padding: val, paddingTop: undefined, paddingRight: undefined, paddingBottom: undefined, paddingLeft: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="20px"
                    title="All sides (overrides individual)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Top</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).paddingTop || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingTop: e.target.value, padding: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, paddingTop: e.target.value, padding: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).paddingTop || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingTop: val, padding: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, paddingTop: val, padding: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Right</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).paddingRight || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingRight: e.target.value, padding: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, paddingRight: e.target.value, padding: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).paddingRight || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingRight: val, padding: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, paddingRight: val, padding: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).paddingBottom || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingBottom: e.target.value, padding: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, paddingBottom: e.target.value, padding: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).paddingBottom || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingBottom: val, padding: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, paddingBottom: val, padding: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Left</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).paddingLeft || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingLeft: e.target.value, padding: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, paddingLeft: e.target.value, padding: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).paddingLeft || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingLeft: val, padding: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, paddingLeft: val, padding: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">"All" overrides individual side padding</p>
            </div>

            {/* Margin */}
            <div>
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5" />
                <span>Margin {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="margin" activeBreakpoint={activeBreakpoint} />
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">All</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).margin || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, margin: e.target.value, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, margin: e.target.value, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).margin || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, margin: val, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, margin: val, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="20px"
                    title="All sides (overrides individual)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Top</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).marginTop || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginTop: e.target.value, margin: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, marginTop: e.target.value, margin: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).marginTop || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginTop: val, margin: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, marginTop: val, margin: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Right</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).marginRight || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginRight: e.target.value, margin: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, marginRight: e.target.value, margin: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).marginRight || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginRight: val, margin: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, marginRight: val, margin: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).marginBottom || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginBottom: e.target.value, margin: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, marginBottom: e.target.value, margin: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).marginBottom || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginBottom: val, margin: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, marginBottom: val, margin: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Left</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(element.styles).marginLeft || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginLeft: e.target.value, margin: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, marginLeft: e.target.value, margin: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(element.styles).marginLeft || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginLeft: val, margin: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, marginLeft: val, margin: undefined } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">"All" overrides individual side margin</p>
            </div>
          </div>

          {/* Position */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Move className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Position {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Position
                </label>
                <select
                  value={getBreakpointStyles(element.styles).position || 'relative'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, position: e.target.value } });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { ...bpStyles, position: e.target.value } 
                        } 
                      });
                    }
                  }}
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

              {(getBreakpointStyles(element.styles).position === 'absolute' || getBreakpointStyles(element.styles).position === 'fixed' || getBreakpointStyles(element.styles).position === 'relative' || getBreakpointStyles(element.styles).position === 'sticky') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Top</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).top || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, top: e.target.value } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, top: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Right</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).right || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, right: e.target.value } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, right: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bottom</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).bottom || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, bottom: e.target.value } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, bottom: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Left</label>
                    <input
                      type="text"
                      value={getBreakpointStyles(element.styles).left || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, left: e.target.value } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, left: e.target.value } 
                            } 
                          });
                        }
                      }}
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
                  value={getBreakpointStyles(element.styles).zIndex || ''}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, zIndex: e.target.value } });
                    } else {
                      const bpStyles = element.styles[activeBreakpoint] || {};
                      updateElement(sectionId, rowId, columnId, element.id, { 
                        styles: { 
                          ...element.styles, 
                          [activeBreakpoint]: { ...bpStyles, zIndex: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, getBreakpointStyles(element.styles).zIndex || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, zIndex: val } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: { ...bpStyles, zIndex: val } 
                            } 
                          });
                        }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1, 10, 999"
                />
                <p className="text-xs text-gray-500 mt-1.5">Stacking order (higher values appear on top)</p>
              </div>
            </div>
          </div>

          {/* Custom Attributes */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Custom Attributes</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Custom ID
                </label>
                <input
                  type="text"
                  value={element.customId || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { customId: e.target.value })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., my-heading-id"
                />
                <p className="text-xs text-gray-500 mt-1.5">Custom HTML ID attribute</p>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Custom CSS Classes
                </label>
                <input
                  type="text"
                  value={element.customClasses || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { customClasses: e.target.value })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., custom-class another-class"
                />
                <p className="text-xs text-gray-500 mt-1.5">Space-separated CSS class names</p>
              </div>
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

