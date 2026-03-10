'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown as HandleNumberKeyDownType, handleInputKeyDown as HandleInputKeyDownType } from '../../../utils/helpers';
import ColorPicker from '../../ui/ColorPicker';
import ColorPickerWithTheme from '../../ui/ColorPickerWithTheme';
import BreakpointBadge from '../../ui/BreakpointBadge';
import ApiSettings from '../ApiSettings';
import { resolveColor, ColorSource } from '../../../utils/colorResolution';
import { Type, AlignLeft, AlignCenter, AlignRight, Maximize2, Move, Minus, Layers, Square, Eye, CornerDownRight, Zap, Code, Link, Upload, Image as ImageIcon, X } from 'lucide-react';

interface DescriptionElementSettingsProps {
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

export default function DescriptionElementSettings({
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
}: DescriptionElementSettingsProps) {
  const currentStyles = getBreakpointStyles(element.styles);

  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          {/* Description Text / HTML */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Description Content</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Code className="w-3.5 h-3.5" />
                HTML Content
              </label>
              <textarea
                value={element.content.descriptionHtml || element.content.description || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { 
                  content: { ...element.content, descriptionHtml: e.target.value, description: e.target.value } 
                })}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                rows={8}
                placeholder="Enter HTML content..."
              />
              <p className="text-xs text-gray-500 mt-1.5">
                You can add HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;br&gt;, etc.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Typography */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Typography</h3>
            </div>
            
            {/* Text Color */}
            <div className="mb-4">
              {(() => {
                const textColorSource = currentStyles.textColorSource as ColorSource | undefined;
                const resolved = resolveColor(currentStyles.textColor, textColorSource, '', '#000000', 'text', 'text');
                
                return (
                  <ColorPickerWithTheme
                    value={resolved.value}
                    onChange={(color) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, textColor: color } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, textColor: color } 
                          } 
                        });
                      }
                    }}
                    showTransparent={false}
                    label={`Text Color ${activeBreakpoint !== 'desktop' ? `(${activeBreakpoint})` : ''}`}
                    breakpointBadge={activeBreakpoint !== 'desktop' ? <BreakpointBadge styles={element.styles} property="textColor" activeBreakpoint={activeBreakpoint} /> : undefined}
                    colorSource={resolved.source}
                    onColorSourceChange={(source) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            textColorSource: source
                          } 
                        });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { 
                              ...bpStyles, 
                              textColorSource: source
                            } 
                          } 
                        });
                      }
                    }}
                    colorType="text"
                    elementType="text"
                    activeBreakpoint={activeBreakpoint}
                    defaultCustomColor="#000000"
                  />
                );
              })()}
              <p className="text-xs text-gray-500 mt-1.5">Color of the description text</p>
            </div>
            
            {/* Font Family */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                <span>Font Family {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="descriptionFontFamily" activeBreakpoint={activeBreakpoint} />
              </label>
              <select
                value={currentStyles.descriptionFontFamily || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionFontFamily: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionFontFamily: e.target.value } } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <p className="text-xs text-gray-500 mt-1.5">Choose a font family for the description</p>
            </div>

            {/* Font Size */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Font Size {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="descriptionFontSize" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={currentStyles.descriptionFontSize || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionFontSize: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionFontSize: e.target.value } } 
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, currentStyles.descriptionFontSize || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionFontSize: val } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionFontSize: val } } 
                        });
                      }
                    }, 0.1, 1, 5);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 1rem, 16px"
              />
              <p className="text-xs text-gray-500 mt-1.5">Set the font size (px, rem, em)</p>
            </div>

            {/* Font Weight */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                <span>Font Weight {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="descriptionFontWeight" activeBreakpoint={activeBreakpoint} />
              </label>
              <select
                value={currentStyles.descriptionFontWeight || '400'}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionFontWeight: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionFontWeight: e.target.value } } 
                    });
                  }
                }}
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
                <span>Line Height {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="descriptionLineHeight" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={currentStyles.descriptionLineHeight || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionLineHeight: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionLineHeight: e.target.value } } 
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, currentStyles.descriptionLineHeight || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionLineHeight: val } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionLineHeight: val } } 
                        });
                      }
                    }, 0.1, 0.5, 1);
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
                <span>Letter Spacing {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="descriptionLetterSpacing" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={currentStyles.descriptionLetterSpacing || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionLetterSpacing: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionLetterSpacing: e.target.value } } 
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, currentStyles.descriptionLetterSpacing || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionLetterSpacing: val } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionLetterSpacing: val } } 
                        });
                      }
                    }, 0.01, 0.05, 0.1);
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
                <span>Text Transform {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="descriptionTextTransform" activeBreakpoint={activeBreakpoint} />
              </label>
              <select
                value={currentStyles.descriptionTextTransform || 'none'}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionTextTransform: e.target.value as any } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionTextTransform: e.target.value as any } } 
                    });
                  }
                }}
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
                <span>Text Decoration {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="descriptionTextDecoration" activeBreakpoint={activeBreakpoint} />
              </label>
              <select
                value={currentStyles.descriptionTextDecoration || 'none'}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionTextDecoration: e.target.value as any } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionTextDecoration: e.target.value as any } } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="line-through">Line Through</option>
              </select>
              <p className="text-xs text-gray-500 mt-1.5">Add text decoration</p>
            </div>

            {/* Text Alignment */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <AlignLeft className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Text Alignment</h3>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  {currentStyles.descriptionTextAlign === 'left' ? (
                    <AlignLeft className="w-3.5 h-3.5" />
                  ) : currentStyles.descriptionTextAlign === 'right' ? (
                    <AlignRight className="w-3.5 h-3.5" />
                  ) : (
                    <AlignCenter className="w-3.5 h-3.5" />
                  )}
                  Alignment
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionTextAlign: 'left' } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionTextAlign: 'left' } } 
                        });
                      }
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      currentStyles.descriptionTextAlign === 'left'
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
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionTextAlign: 'center' } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionTextAlign: 'center' } } 
                        });
                      }
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      currentStyles.descriptionTextAlign === 'center'
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
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionTextAlign: 'right' } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionTextAlign: 'right' } } 
                        });
                      }
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      currentStyles.descriptionTextAlign === 'right'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <AlignRight className="w-4 h-4 mx-auto" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Horizontal text alignment</p>
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Background {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1.5">
                <span>Background Color {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="backgroundColor" activeBreakpoint={activeBreakpoint} />
              </label>
              <ColorPicker
                value={currentStyles.backgroundColor || '#ffffff'}
                onChange={(color) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, backgroundColor: color, backgroundImage: currentStyles.backgroundImage ? '' : undefined } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, backgroundColor: color, backgroundImage: currentStyles.backgroundImage ? '' : undefined } } 
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
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, backgroundColor: newBg } } 
                    });
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1.5">Background color for the description element</p>
            </div>

            {/* Background Image */}
            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                <span>Background Image {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</span>
                <BreakpointBadge styles={element.styles} property="backgroundImage" activeBreakpoint={activeBreakpoint} />
              </label>
              
              {/* Image Preview */}
              {currentStyles.backgroundImage && (
                <div className="mb-3 relative">
                  <div className="relative w-full h-32 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                    <img
                      src={currentStyles.backgroundImage}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      onClick={() => {
                        if (activeBreakpoint === 'desktop') {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, backgroundImage: undefined } });
                        } else {
                          const bpStyles = element.styles[activeBreakpoint] || {};
                          const { backgroundImage, ...restBpStyles } = bpStyles;
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            styles: { 
                              ...element.styles, 
                              [activeBreakpoint]: restBpStyles 
                            } 
                          });
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* URL Input */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Link className="w-3.5 h-3.5" />
                  Image URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentStyles.backgroundImage || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, backgroundImage: e.target.value, backgroundColor: 'transparent' } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { 
                            ...element.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundImage: e.target.value, backgroundColor: 'transparent' } 
                          } 
                        });
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/image.jpg"
                    onKeyDown={handleInputKeyDown}
                  />
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Image
                </label>
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                      <ImageIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Click to upload
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">or drag and drop</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, backgroundImage: reader.result as string, backgroundColor: 'transparent' } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { 
                                ...element.styles, 
                                [activeBreakpoint]: { ...bpStyles, backgroundImage: reader.result as string, backgroundColor: 'transparent' } 
                              } 
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Background Overlay Controls */}
            {currentStyles.backgroundImage && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-700">Background Overlay</h3>
                </div>

                {/* Overlay Preview */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </label>
                  <div className="relative w-full h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                    <img
                      src={currentStyles.backgroundImage}
                      alt="Background"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: currentStyles.descriptionOverlayColor && currentStyles.descriptionOverlayColor !== 'transparent' 
                          ? currentStyles.descriptionOverlayColor 
                          : (currentStyles.backgroundColor && currentStyles.backgroundColor !== 'transparent' 
                            ? currentStyles.backgroundColor 
                            : '#000000'),
                        opacity: parseFloat(currentStyles.descriptionOverlayOpacity || '0.5'),
                      }}
                    />
                  </div>
                </div>

                {/* Overlay Color */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1.5">
                    <span>Overlay Color {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                    <BreakpointBadge styles={element.styles} property="descriptionOverlayColor" activeBreakpoint={activeBreakpoint} />
                  </label>
                  <ColorPicker
                    value={currentStyles.descriptionOverlayColor && currentStyles.descriptionOverlayColor !== 'transparent' ? currentStyles.descriptionOverlayColor : (currentStyles.backgroundColor && currentStyles.backgroundColor !== 'transparent' ? currentStyles.backgroundColor : '#000000')}
                    onChange={(color) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionOverlayColor: color } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionOverlayColor: color } } 
                        });
                      }
                    }}
                    showTransparent={false}
                  />
                </div>

                {/* Overlay Opacity */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Opacity {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                    <BreakpointBadge styles={element.styles} property="descriptionOverlayOpacity" activeBreakpoint={activeBreakpoint} />
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={currentStyles.descriptionOverlayOpacity || '0.5'}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, descriptionOverlayOpacity: e.target.value } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, descriptionOverlayOpacity: e.target.value } } 
                        });
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>{Math.round((parseFloat(currentStyles.descriptionOverlayOpacity || '0.5') * 100))}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            )}
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
                    borderWidth: currentStyles.borderWidth || 
                      `${currentStyles.borderTopWidth || '0px'} ${currentStyles.borderRightWidth || '0px'} ${currentStyles.borderBottomWidth || '0px'} ${currentStyles.borderLeftWidth || '0px'}`,
                    borderStyle: currentStyles.borderStyle || 'solid',
                    borderColor: currentStyles.borderColor || '#000000',
                    borderRadius: currentStyles.borderRadius || 
                      (currentStyles.borderTopLeftRadius || currentStyles.borderTopRightRadius || currentStyles.borderBottomRightRadius || currentStyles.borderBottomLeftRadius
                        ? `${currentStyles.borderTopLeftRadius || '0px'} ${currentStyles.borderTopRightRadius || '0px'} ${currentStyles.borderBottomRightRadius || '0px'} ${currentStyles.borderBottomLeftRadius || '0px'}`
                        : '0px'),
                    backgroundColor: currentStyles.backgroundColor || '#ffffff',
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
                    value={currentStyles.borderWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderWidth: e.target.value, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderWidth: e.target.value, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderWidth: val, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderWidth: val, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Top</label>
                  <input
                    type="text"
                    value={currentStyles.borderTopWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopWidth: e.target.value, borderWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderTopWidth: e.target.value, borderWidth: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderTopWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopWidth: val, borderWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderTopWidth: val, borderWidth: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Right</label>
                  <input
                    type="text"
                    value={currentStyles.borderRightWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRightWidth: e.target.value, borderWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderRightWidth: e.target.value, borderWidth: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderRightWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRightWidth: val, borderWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderRightWidth: val, borderWidth: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                  <input
                    type="text"
                    value={currentStyles.borderBottomWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomWidth: e.target.value, borderWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderBottomWidth: e.target.value, borderWidth: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderBottomWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomWidth: val, borderWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderBottomWidth: val, borderWidth: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Left</label>
                  <input
                    type="text"
                    value={currentStyles.borderLeftWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderLeftWidth: e.target.value, borderWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderLeftWidth: e.target.value, borderWidth: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderLeftWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderLeftWidth: val, borderWidth: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderLeftWidth: val, borderWidth: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2px"
                  />
                </div>
              </div>
            </div>

            {/* Border Style */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <span>Border Style {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="borderStyle" activeBreakpoint={activeBreakpoint} />
              </label>
              <select
                value={currentStyles.borderStyle || 'solid'}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderStyle: e.target.value as any } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderStyle: e.target.value as any } } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1.5">
                <span>Border Color {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="borderColor" activeBreakpoint={activeBreakpoint} />
              </label>
              <ColorPicker
                value={currentStyles.borderColor || '#000000'}
                onChange={(color) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderColor: color } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderColor: color } } 
                    });
                  }
                }}
              />
            </div>

            {/* Border Radius */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5" />
                <span>Border Radius {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="borderRadius" activeBreakpoint={activeBreakpoint} />
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">All</label>
                  <input
                    type="text"
                    value={currentStyles.borderRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRadius: e.target.value, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderRadius: e.target.value, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderRadius: val, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderRadius: val, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">TL</label>
                  <input
                    type="text"
                    value={currentStyles.borderTopLeftRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopLeftRadius: e.target.value, borderRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderTopLeftRadius: e.target.value, borderRadius: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderTopLeftRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopLeftRadius: val, borderRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderTopLeftRadius: val, borderRadius: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8px"
                    title="Top Left"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">TR</label>
                  <input
                    type="text"
                    value={currentStyles.borderTopRightRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopRightRadius: e.target.value, borderRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderTopRightRadius: e.target.value, borderRadius: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderTopRightRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderTopRightRadius: val, borderRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderTopRightRadius: val, borderRadius: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8px"
                    title="Top Right"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">BR</label>
                  <input
                    type="text"
                    value={currentStyles.borderBottomRightRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomRightRadius: e.target.value, borderRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderBottomRightRadius: e.target.value, borderRadius: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderBottomRightRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomRightRadius: val, borderRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderBottomRightRadius: val, borderRadius: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8px"
                    title="Bottom Right"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">BL</label>
                  <input
                    type="text"
                    value={currentStyles.borderBottomLeftRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomLeftRadius: e.target.value, borderRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderBottomLeftRadius: e.target.value, borderRadius: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.borderBottomLeftRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, borderBottomLeftRadius: val, borderRadius: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, borderBottomLeftRadius: val, borderRadius: undefined } } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8px"
                    title="Bottom Left"
                  />
                </div>
              </div>
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
                    boxShadow: currentStyles.boxShadow || 
                      (currentStyles.boxShadowOffsetX || currentStyles.boxShadowOffsetY || currentStyles.boxShadowBlur || currentStyles.boxShadowSpread || currentStyles.boxShadowColor
                        ? `${currentStyles.boxShadowOffsetX || '0px'} ${currentStyles.boxShadowOffsetY || '0px'} ${currentStyles.boxShadowBlur || '0px'} ${currentStyles.boxShadowSpread || '0px'} ${currentStyles.boxShadowColor || '#000000'}`
                        : 'none'),
                    backgroundColor: currentStyles.backgroundColor || '#ffffff',
                  }}
                />
              </div>
            </div>

            {/* Shadow Color */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1.5">
                <span>Shadow Color {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="boxShadowColor" activeBreakpoint={activeBreakpoint} />
              </label>
              <ColorPicker
                value={currentStyles.boxShadowColor || '#000000'}
                onChange={(color) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowColor: color } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadowColor: color } } 
                    });
                  }
                }}
              />
            </div>

            {/* Shadow Offset X */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <span>Offset X {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="boxShadowOffsetX" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={currentStyles.boxShadowOffsetX || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowOffsetX: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadowOffsetX: e.target.value } } 
                    });
                  }
                }}
                onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.boxShadowOffsetX || '', (val) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowOffsetX: val } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadowOffsetX: val } } 
                    });
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2px, -2px"
              />
            </div>

            {/* Shadow Offset Y */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <span>Offset Y {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="boxShadowOffsetY" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={currentStyles.boxShadowOffsetY || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowOffsetY: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadowOffsetY: e.target.value } } 
                    });
                  }
                }}
                onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.boxShadowOffsetY || '', (val) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowOffsetY: val } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadowOffsetY: val } } 
                    });
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2px, -2px"
              />
            </div>

            {/* Shadow Blur */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <span>Blur {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="boxShadowBlur" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={currentStyles.boxShadowBlur || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowBlur: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadowBlur: e.target.value } } 
                    });
                  }
                }}
                onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.boxShadowBlur || '', (val) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowBlur: val } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadowBlur: val } } 
                    });
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 4px"
              />
            </div>

            {/* Shadow Spread */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <span>Spread {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="boxShadowSpread" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={currentStyles.boxShadowSpread || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowSpread: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadowSpread: e.target.value } } 
                    });
                  }
                }}
                onKeyDown={(e) => handleNumberKeyDown(e, currentStyles.boxShadowSpread || '', (val) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadowSpread: val } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadowSpread: val } } 
                    });
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 0px"
              />
            </div>

            {/* Custom Shadow */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <span>Custom Shadow {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={element.styles} property="boxShadow" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={currentStyles.boxShadow || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, boxShadow: e.target.value } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, boxShadow: e.target.value } } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="e.g., 2px 2px 4px rgba(0,0,0,0.1)"
              />
              <p className="text-xs text-gray-500 mt-1.5">Override individual shadow properties with custom CSS</p>
            </div>
          </div>
        </>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <>
          {/* Custom Attributes */}
          <div className="border-t pt-4">
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
                  placeholder="e.g., my-description-id"
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

          {/* Padding */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Maximize2 className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Padding {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>
            
            {/* Padding - All in One Row */}
            <div>
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
                    value={currentStyles.padding || ''}
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
                        handleNumberKeyDown(e, currentStyles.padding || '', (val) => {
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
                    value={currentStyles.paddingTop || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingTop: e.target.value, padding: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, paddingTop: e.target.value, padding: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, currentStyles.paddingTop || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingTop: val, padding: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, paddingTop: val, padding: undefined } } 
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
                    value={currentStyles.paddingRight || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingRight: e.target.value, padding: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, paddingRight: e.target.value, padding: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, currentStyles.paddingRight || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingRight: val, padding: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, paddingRight: val, padding: undefined } } 
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
                    value={currentStyles.paddingBottom || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingBottom: e.target.value, padding: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, paddingBottom: e.target.value, padding: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, currentStyles.paddingBottom || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingBottom: val, padding: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, paddingBottom: val, padding: undefined } } 
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
                    value={currentStyles.paddingLeft || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingLeft: e.target.value, padding: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, paddingLeft: e.target.value, padding: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, currentStyles.paddingLeft || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, paddingLeft: val, padding: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, paddingLeft: val, padding: undefined } } 
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
          </div>

          {/* Margin */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Move className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Margin {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>
            
            {/* Margin - All in One Row */}
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
                    value={currentStyles.margin || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, margin: e.target.value, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, margin: e.target.value, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, currentStyles.margin || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, margin: val, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, margin: val, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined } } 
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
                    value={currentStyles.marginTop || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginTop: e.target.value, margin: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, marginTop: e.target.value, margin: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, currentStyles.marginTop || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginTop: val, margin: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, marginTop: val, margin: undefined } } 
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
                    value={currentStyles.marginRight || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginRight: e.target.value, margin: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, marginRight: e.target.value, margin: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, currentStyles.marginRight || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginRight: val, margin: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                            updateElement(sectionId, rowId, columnId, element.id, { 
                              styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, marginRight: val, margin: undefined } } 
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
                    value={currentStyles.marginBottom || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginBottom: e.target.value, margin: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, marginBottom: e.target.value, margin: undefined } } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, currentStyles.marginBottom || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginBottom: val, margin: undefined } });
                          } else {
                            const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, marginBottom: val, margin: undefined } } 
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
                value={currentStyles.marginLeft || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginLeft: e.target.value, margin: undefined } });
                  } else {
                    const bpStyles = element.styles[activeBreakpoint] || {};
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, marginLeft: e.target.value, margin: undefined } } 
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, currentStyles.marginLeft || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, marginLeft: val, margin: undefined } });
                      } else {
                        const bpStyles = element.styles[activeBreakpoint] || {};
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          styles: { ...element.styles, [activeBreakpoint]: { ...bpStyles, marginLeft: val, margin: undefined } } 
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
