'use client';

import React, { useMemo } from 'react';
import { Section } from '../../types/builder';
import ColorPicker from '../ui/ColorPicker';
import BreakpointBadge from '../ui/BreakpointBadge';
import BoxSpacingControl from '../controls/BoxSpacingControl';
import { Upload, X, Image as ImageIcon, Link, Layers, Eye, Square, Move, CornerDownRight, Zap, Maximize2, Box, AlignLeft, AlignCenter, AlignRight, Minus, LayoutGrid, LayoutList, Grid3x3, Video, PlayCircle, Plus, Trash2, Sparkles, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { getSectionTemplate, normalizeBackground } from '../../constants';

interface SectionSettingsProps {
  section: Section;
  sectionId: string;
  activeTab: 'content' | 'style' | 'advanced';
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  getBreakpointStyles: (styles: any) => any;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleNumberKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string,
    onChange: (value: string) => void,
    step?: number,
    shiftStep?: number,
    ctrlStep?: number
  ) => void;
}

export default function SectionSettings({
  section,
  sectionId,
  activeTab,
  activeBreakpoint,
  updateSection,
  getBreakpointStyles,
  handleInputKeyDown,
  handleNumberKeyDown,
}: SectionSettingsProps) {
  // STEP 2: Build Style Resolver - Merge default template with DB values
  const resolvedSectionStyles = useMemo(() => {
    const defaultTemplate = getSectionTemplate(section.componentType || 'default');
    const defaultStyles = defaultTemplate.styles || {};
    const currentStyles = section.styles || {};
    
    // Merge: defaults first, then current DB values (DB values override defaults)
    const merged = {
      ...defaultStyles,
      ...currentStyles,
    };
    
    // Normalize background object if needed
    if (!merged.background || typeof merged.background !== 'object' || !merged.background.type) {
      merged.background = normalizeBackground(merged);
    }
    
    return merged;
  }, [section.componentType, section.styles]);
  return (
    <>
      {/* Layout Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Container Settings - REMOVED: Sections don't control container layout */}

          {/* Layout Type, Grid Properties, Flex Properties, Items Layout, and Pagination removed */}
          {/* Sections are block-level wrappers only - layout controls belong to containers only */}

          {/* Content tab is now minimal - Layout moved to Style tab, Position/Overflow moved to Advanced tab */}
        </div>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Layout Group */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Maximize2 className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Layout</h3>
            </div>

            {/* Min Height */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5" />
                Min Height {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
              </label>
              <select
                value={(() => {
                  const minHeight = getBreakpointStyles(section.styles).minHeight;
                  if (minHeight === '100vh') return '100vh';
                  if (minHeight === 'auto' || minHeight === undefined) return 'auto';
                  return 'custom';
                })()}
                onChange={(e) => {
                  const value = e.target.value;
                  const minHeight = value === '100vh' ? '100vh' : value === 'auto' ? 'auto' : getBreakpointStyles(section.styles).minHeight || '100vh';
                  if (activeBreakpoint === 'desktop') {
                    updateSection(sectionId, { styles: { ...section.styles, minHeight } });
                  } else {
                    const bpStyles = section.styles[activeBreakpoint] || {};
                    updateSection(sectionId, { 
                      styles: { 
                        ...section.styles, 
                        [activeBreakpoint]: { ...bpStyles, minHeight } 
                      } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
              >
                <option value="auto">Auto</option>
                <option value="100vh">100vh (Full Viewport)</option>
                <option value="custom">Custom</option>
              </select>
              {(() => {
                const minHeight = getBreakpointStyles(section.styles).minHeight;
                return (minHeight && minHeight !== '100vh' && minHeight !== 'auto') || 
                       (minHeight === undefined && activeBreakpoint === 'desktop' && getBreakpointStyles(section.styles).minHeight === undefined) ? (
                <input
                  type="text"
                    value={minHeight || '100vh'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { styles: { ...section.styles, minHeight: e.target.value } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                            [activeBreakpoint]: { ...bpStyles, minHeight: e.target.value } 
                        } 
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 500px, 50vh"
                />
                ) : null;
              })()}
              </div>

            {/* Vertical Align */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <AlignCenter className="w-3.5 h-3.5" />
                Vertical Align {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
              </label>
              <select
                value={getBreakpointStyles(section.styles).verticalAlign || 'top'}
                onChange={(e) => {
                  const value = e.target.value as 'top' | 'middle' | 'bottom';
                  if (activeBreakpoint === 'desktop') {
                    updateSection(sectionId, { styles: { ...section.styles, verticalAlign: value } });
                  } else {
                    const bpStyles = section.styles[activeBreakpoint] || {};
                    updateSection(sectionId, { 
                      styles: { 
                        ...section.styles, 
                        [activeBreakpoint]: { ...bpStyles, verticalAlign: value } 
                      } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>

          {/* Background Group */}
          <div className="border-t pt-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Background</h3>
            </div>

          {/* Background Type Selector */}
            <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Background Type {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
              </label>
            <select
              value={(() => {
                // Use resolved styles first, then fallback to section.styles
                const bpResolved = getBreakpointStyles(resolvedSectionStyles);
                const bpSection = getBreakpointStyles(section.styles);
                
                // Check new background object structure first
                if (bpResolved.background?.type) {
                  return bpResolved.background.type;
                }
                if (bpSection.background?.type) {
                  return bpSection.background.type;
                }
                
                // Fallback: infer from existing properties
                if (bpResolved.backgroundType) return bpResolved.backgroundType;
                if (bpSection.backgroundType) return bpSection.backgroundType;
                if (bpResolved.backgroundVideoUrl || bpSection.backgroundVideoUrl) return 'video';
                if (bpResolved.gradientColors || bpSection.gradientColors) return 'gradient';
                if (bpResolved.backgroundImage || bpSection.backgroundImage) return 'image';
                if ((bpResolved.backgroundColor && bpResolved.backgroundColor !== 'transparent') || 
                    (bpSection.backgroundColor && bpSection.backgroundColor !== 'transparent')) return 'color';
                return 'none';
              })()}
                onChange={(e) => {
                const newType = e.target.value as 'none' | 'color' | 'image' | 'gradient' | 'video';
                const bpStyles = activeBreakpoint === 'desktop' ? section.styles : (section.styles[activeBreakpoint] || {});
                
                // Clear irrelevant properties when switching background types
                const clearedStyles: any = {};
                if (newType === 'color') {
                  clearedStyles.backgroundImage = undefined;
                  clearedStyles.gradientColors = undefined;
                  clearedStyles.backgroundVideoUrl = undefined;
                  clearedStyles.gradientType = undefined;
                  clearedStyles.gradientAngle = undefined;
                  clearedStyles.gradientDirection = undefined;
                } else if (newType === 'gradient') {
                  clearedStyles.backgroundImage = undefined;
                  clearedStyles.backgroundColor = 'transparent';
                  clearedStyles.backgroundVideoUrl = undefined;
                  // Set default gradient colors if not already set
                  const currentGradientColors = getBreakpointStyles(section.styles).gradientColors;
                  if (!currentGradientColors) {
                    clearedStyles.gradientColors = JSON.stringify([
                      { color: '#667eea', stop: '0%' },
                      { color: '#764ba2', stop: '100%' }
                    ]);
                  }
                  // Set default gradient type and angle if not set
                  if (!getBreakpointStyles(section.styles).gradientType) {
                    clearedStyles.gradientType = 'linear';
                  }
                  if (!getBreakpointStyles(section.styles).gradientAngle && !getBreakpointStyles(section.styles).gradientDirection) {
                    clearedStyles.gradientAngle = '90deg';
                  }
                } else if (newType === 'image') {
                  clearedStyles.gradientColors = undefined;
                  clearedStyles.backgroundColor = 'transparent';
                  clearedStyles.backgroundVideoUrl = undefined;
                  clearedStyles.gradientType = undefined;
                  clearedStyles.gradientAngle = undefined;
                  clearedStyles.gradientDirection = undefined;
                } else if (newType === 'video') {
                  clearedStyles.backgroundImage = undefined;
                  clearedStyles.gradientColors = undefined;
                  clearedStyles.backgroundColor = 'transparent';
                  clearedStyles.gradientType = undefined;
                  clearedStyles.gradientAngle = undefined;
                  clearedStyles.gradientDirection = undefined;
                } else if (newType === 'none') {
                  clearedStyles.backgroundImage = undefined;
                  clearedStyles.gradientColors = undefined;
                  clearedStyles.backgroundColor = 'transparent';
                  clearedStyles.backgroundVideoUrl = undefined;
                  clearedStyles.gradientType = undefined;
                  clearedStyles.gradientAngle = undefined;
                  clearedStyles.gradientDirection = undefined;
                }
                
                  if (activeBreakpoint === 'desktop') {
                    updateSection(sectionId, { 
                      styles: { 
                        ...section.styles, 
                      backgroundType: newType,
                      ...clearedStyles
                      } 
                    });
                  } else {
                  const currentBpStyles = section.styles[activeBreakpoint] || {};
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                      [activeBreakpoint]: { 
                        ...currentBpStyles, 
                        backgroundType: newType,
                        ...clearedStyles
                      } 
                      } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
              <option value="none">None</option>
              <option value="color">Color</option>
              <option value="gradient">Gradient</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              </select>
            </div>

          {/* Background Color (only show if backgroundType is "color") */}
          {(() => {
            const bgType = getBreakpointStyles(resolvedSectionStyles).background?.type || 
                          getBreakpointStyles(section.styles).backgroundType ||
                          (getBreakpointStyles(resolvedSectionStyles).backgroundVideoUrl ? 'video' : 
                           getBreakpointStyles(resolvedSectionStyles).gradientColors ? 'gradient' : 
                           getBreakpointStyles(resolvedSectionStyles).backgroundImage ? 'image' : 
                           (getBreakpointStyles(resolvedSectionStyles).backgroundColor && getBreakpointStyles(resolvedSectionStyles).backgroundColor !== 'transparent') ? 'color' : 'none');
            return bgType === 'color';
          })() && (
            <div className="space-y-3">
                <div>
                <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1.5">
                  <span>Background Color {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                  <BreakpointBadge styles={section.styles} property="backgroundColor" activeBreakpoint={activeBreakpoint} />
                  </label>
                <ColorPicker
                  value={(() => {
                    const resolved = getBreakpointStyles(resolvedSectionStyles);
                    const sectionStyles = getBreakpointStyles(section.styles);
                    return resolved.background?.color || 
                           resolved.backgroundColor || 
                           sectionStyles.backgroundColor || 
                           '#e5e7eb';
                  })()}
                  onChange={(color) => {
                      // Update both new background object and legacy backgroundColor
                      const updates: any = {
                        backgroundColor: color, // Legacy
                        backgroundType: 'color',
                        background: {
                          type: 'color',
                          color: color,
                          overlay: getBreakpointStyles(resolvedSectionStyles).background?.overlay || {
                            enabled: false,
                            color: '#000000',
                            opacity: 0.5,
                            blendMode: 'normal',
                          },
                        },
                      };
                      
                      if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                            ...updates,
                          } 
                        });
                      } else {
                        const bpStyles = section.styles[activeBreakpoint] || {};
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                            [activeBreakpoint]: { 
                              ...bpStyles, 
                              ...updates,
                            } 
                          }
                        });
                      }
                    }}
                  showTransparent={true}
                  isTransparent={getBreakpointStyles(section.styles).backgroundColor === 'transparent'}
                  onTransparentToggle={() => {
                    const currentBg = getBreakpointStyles(section.styles).backgroundColor;
                    const newBg = currentBg === 'transparent' ? '#e5e7eb' : 'transparent';
                      if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                          backgroundColor: newBg,
                          backgroundType: newBg === 'transparent' ? 'none' : 'color'
                        } 
                      });
                          } else {
                            const bpStyles = section.styles[activeBreakpoint] || {};
                            updateSection(sectionId, { 
                              styles: { 
                                ...section.styles, 
                          [activeBreakpoint]: { 
                            ...bpStyles, 
                            backgroundColor: newBg,
                            backgroundType: newBg === 'transparent' ? 'none' : 'color'
                              } 
                          }
                        });
                      }
                    }}
                  />
                </div>
              
              {/* Background Opacity removed - use Background Overlay instead (available for all background types) */}
              </div>
            )}

          {/* Background Image Controls (only show if backgroundType is "image") */}
          {getBreakpointStyles(section.styles).backgroundType === 'image' && (
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Section Background Image {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                  </label>
            
            {/* Image Preview */}
            {getBreakpointStyles(section.styles).backgroundImage && (
              <div className="mb-3 relative">
                <div className="relative w-full h-32 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                  <img
                    src={getBreakpointStyles(section.styles).backgroundImage}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    onClick={() => {
                      if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { styles: { ...section.styles, backgroundImage: undefined } });
                      } else {
                        const bpStyles = section.styles[activeBreakpoint] || {};
                        const { backgroundImage, ...restBpStyles } = bpStyles;
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
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
                  value={getBreakpointStyles(section.styles).backgroundImage || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, backgroundImage: e.target.value, backgroundColor: 'transparent' } });
                      } else {
                        const bpStyles = section.styles[activeBreakpoint] || {};
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, backgroundImage: e.target.value, backgroundColor: 'transparent' } 
                          } 
                        });
                      }
                    }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
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
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                              backgroundImage: reader.result as string, 
                              backgroundColor: 'transparent',
                              backgroundType: 'image'
                            } 
                          });
                          } else {
                            const bpStyles = section.styles[activeBreakpoint] || {};
                            updateSection(sectionId, { 
                              styles: { 
                                ...section.styles, 
                              [activeBreakpoint]: { 
                                ...bpStyles, 
                                backgroundImage: reader.result as string, 
                                backgroundColor: 'transparent',
                                backgroundType: 'image'
                              } 
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

            {/* Background Image Opacity removed - use Background Overlay instead */}

            {/* Background Size */}
            {getBreakpointStyles(section.styles).backgroundImage && (
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Background Size {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                </label>
                <select
                  value={getBreakpointStyles(section.styles).backgroundSize || 'cover'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, backgroundSize: e.target.value } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, backgroundSize: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            )}

            {/* Background Position */}
            {getBreakpointStyles(section.styles).backgroundImage && (
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Background Position {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                </label>
                <select
                  value={getBreakpointStyles(section.styles).backgroundPosition || 'center'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, backgroundPosition: e.target.value } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, backgroundPosition: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top left">Top Left</option>
                  <option value="top right">Top Right</option>
                  <option value="bottom left">Bottom Left</option>
                  <option value="bottom right">Bottom Right</option>
                </select>
              </div>
            )}

            {/* Background Repeat */}
            {getBreakpointStyles(section.styles).backgroundImage && (
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Grid3x3 className="w-3.5 h-3.5" />
                  Background Repeat {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                </label>
                <select
                  value={getBreakpointStyles(section.styles).backgroundRepeat || 'no-repeat'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, backgroundRepeat: e.target.value } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, backgroundRepeat: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="no-repeat">No Repeat</option>
                  <option value="repeat">Repeat</option>
                  <option value="repeat-x">Repeat X</option>
                  <option value="repeat-y">Repeat Y</option>
                </select>
              </div>
            )}

            {/* Background Attachment */}
            {getBreakpointStyles(section.styles).backgroundImage && (
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" />
                  Background Attachment {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                </label>
                <select
                  value={getBreakpointStyles(section.styles).backgroundAttachment || 'scroll'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, backgroundAttachment: e.target.value } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, backgroundAttachment: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="scroll">Scroll</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
            )}
            </div>
          )}

          {/* Gradient Controls (only show if backgroundType is "gradient") */}
          {getBreakpointStyles(section.styles).backgroundType === 'gradient' && (
            <div className="border-t pt-4 mt-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Gradient Settings</h3>
            </div>

              {/* Gradient Type */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gradient Type {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                </label>
                <select
                  value={getBreakpointStyles(section.styles).gradientType || 'linear'}
                  onChange={(e) => {
                    const value = e.target.value as 'linear' | 'radial';
                    if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, gradientType: value } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, gradientType: value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>

              {/* Gradient Direction/Angle */}
              {getBreakpointStyles(section.styles).gradientType !== 'radial' && (
                  <div>
                  <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    Gradient Angle {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                    </label>
                    <input
                      type="text"
                    value={getBreakpointStyles(section.styles).gradientAngle || '90deg'}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { styles: { ...section.styles, gradientAngle: e.target.value } });
                        } else {
                          const bpStyles = section.styles[activeBreakpoint] || {};
                          updateSection(sectionId, { 
                            styles: { 
                              ...section.styles, 
                            [activeBreakpoint]: { ...bpStyles, gradientAngle: e.target.value } 
                            }
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="90deg"
                    />
                  <p className="text-xs text-gray-500 mt-1.5">Enter angle (e.g., 90deg, 45deg, to right)</p>
                  </div>
              )}

              {/* Radial Gradient Direction */}
              {getBreakpointStyles(section.styles).gradientType === 'radial' && (
                  <div>
                  <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                    Gradient Direction {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                    </label>
                  <select
                    value={getBreakpointStyles(section.styles).gradientDirection || 'center'}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { styles: { ...section.styles, gradientDirection: e.target.value } });
                        } else {
                          const bpStyles = section.styles[activeBreakpoint] || {};
                          updateSection(sectionId, { 
                            styles: { 
                              ...section.styles, 
                            [activeBreakpoint]: { ...bpStyles, gradientDirection: e.target.value } 
                            } 
                          });
                        }
                      }}
                    onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                  </div>
              )}

              {/* Gradient Color A */}
                  <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  Color A (Start) {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                    </label>
                <ColorPicker
                  value={(() => {
                    const gradientColors = getBreakpointStyles(section.styles).gradientColors;
                    if (!gradientColors) return '#667eea';
                    try {
                      const colors = typeof gradientColors === 'string' ? JSON.parse(gradientColors) : gradientColors;
                      if (Array.isArray(colors) && colors.length > 0) {
                        return colors[0].color || colors[0] || '#667eea';
                      }
                    } catch (e) {}
                    return '#667eea';
                  })()}
                  onChange={(color) => {
                    const gradientColors = getBreakpointStyles(section.styles).gradientColors;
                    let colors: any[] = [];
                    try {
                      colors = typeof gradientColors === 'string' ? JSON.parse(gradientColors) : (gradientColors || []);
                      if (!Array.isArray(colors)) colors = [];
                    } catch (e) {
                      colors = [];
                    }
                    if (colors.length === 0) {
                      colors = [{ color: color, stop: '0%' }, { color: '#764ba2', stop: '100%' }];
                        } else {
                      colors[0] = { color: color, stop: colors[0]?.stop || '0%' };
                    }
                            if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, gradientColors: JSON.stringify(colors) } });
                            } else {
                              const bpStyles = section.styles[activeBreakpoint] || {};
                              updateSection(sectionId, { 
                                styles: { 
                                  ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, gradientColors: JSON.stringify(colors) } 
                            }
                          });
                        }
                      }}
                  showTransparent={false}
                    />
                  </div>

              {/* Gradient Color B */}
                  <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  Color B (End) {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                    </label>
                <ColorPicker
                  value={(() => {
                    const gradientColors = getBreakpointStyles(section.styles).gradientColors;
                    if (!gradientColors) return '#764ba2';
                    try {
                      const colors = typeof gradientColors === 'string' ? JSON.parse(gradientColors) : gradientColors;
                      if (Array.isArray(colors) && colors.length > 1) {
                        return colors[1].color || colors[1] || '#764ba2';
                      } else if (Array.isArray(colors) && colors.length === 1) {
                        return '#764ba2';
                      }
                    } catch (e) {}
                    return '#764ba2';
                  })()}
                  onChange={(color) => {
                    const gradientColors = getBreakpointStyles(section.styles).gradientColors;
                    let colors: any[] = [];
                    try {
                      colors = typeof gradientColors === 'string' ? JSON.parse(gradientColors) : (gradientColors || []);
                      if (!Array.isArray(colors)) colors = [];
                    } catch (e) {
                      colors = [];
                    }
                    if (colors.length === 0) {
                      colors = [{ color: '#667eea', stop: '0%' }, { color: color, stop: '100%' }];
                    } else if (colors.length === 1) {
                      colors.push({ color: color, stop: '100%' });
                        } else {
                      colors[1] = { color: color, stop: colors[1]?.stop || '100%' };
                    }
                            if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, gradientColors: JSON.stringify(colors) } });
                            } else {
                              const bpStyles = section.styles[activeBreakpoint] || {};
                              updateSection(sectionId, { 
                                styles: { 
                                  ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, gradientColors: JSON.stringify(colors) } 
                            }
                          });
                        }
                      }}
                  showTransparent={false}
                    />
                  </div>
                </div>
              )}

          {/* Video Background Controls (only show if backgroundType is "video") */}
          {getBreakpointStyles(section.styles).backgroundType === 'video' && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Video Background</h3>
              </div>

              {/* Video URL */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Link className="w-3.5 h-3.5" />
                  Video URL {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(section.styles).backgroundVideoUrl || ''}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, backgroundVideoUrl: e.target.value } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, backgroundVideoUrl: e.target.value } 
                        }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              {/* Video Poster */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Poster Image (Fallback) {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
            </label>
                <input
                  type="text"
                  value={getBreakpointStyles(section.styles).backgroundVideoPoster || ''}
                  onChange={(e) => {
                if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, backgroundVideoPoster: e.target.value } });
                } else {
                  const bpStyles = section.styles[activeBreakpoint] || {};
                  updateSection(sectionId, { 
                    styles: { 
                      ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, backgroundVideoPoster: e.target.value } 
                    } 
                  });
                }
              }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/poster.jpg"
                />
                <p className="text-xs text-gray-500 mt-1.5">Image shown before video loads</p>
          </div>

              {/* Video Settings */}
              <div className="space-y-3 mt-4">
                {/* Autoplay */}
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-gray-600 flex items-center gap-1">
                    <PlayCircle className="w-3.5 h-3.5" />
                    Autoplay
            </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = getBreakpointStyles(section.styles).backgroundVideoAutoplay !== false;
                      if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { styles: { ...section.styles, backgroundVideoAutoplay: !currentValue } });
                      } else {
                        const bpStyles = section.styles[activeBreakpoint] || {};
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoAutoplay: !currentValue } 
                          } 
                        });
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      getBreakpointStyles(section.styles).backgroundVideoAutoplay !== false ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        getBreakpointStyles(section.styles).backgroundVideoAutoplay !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Loop */}
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-gray-600 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" />
                    Loop
              </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = getBreakpointStyles(section.styles).backgroundVideoLoop !== false;
                    if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { styles: { ...section.styles, backgroundVideoLoop: !currentValue } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoLoop: !currentValue } 
                        } 
                      });
                    }
                  }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      getBreakpointStyles(section.styles).backgroundVideoLoop !== false ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        getBreakpointStyles(section.styles).backgroundVideoLoop !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
            </div>

                {/* Mute */}
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-gray-600 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" />
                    Mute
              </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = getBreakpointStyles(section.styles).backgroundVideoMuted !== false;
                        if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { styles: { ...section.styles, backgroundVideoMuted: !currentValue } });
                        } else {
                          const bpStyles = section.styles[activeBreakpoint] || {};
                          updateSection(sectionId, { 
                            styles: { 
                              ...section.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoMuted: !currentValue } 
                          } 
                        });
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      getBreakpointStyles(section.styles).backgroundVideoMuted !== false ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        getBreakpointStyles(section.styles).backgroundVideoMuted !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
            </div>

                {/* Disable on Mobile */}
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-gray-600 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" />
                    Disable on Mobile
                </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = getBreakpointStyles(section.styles).backgroundVideoDisableOnMobile === true;
                      if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { styles: { ...section.styles, backgroundVideoDisableOnMobile: !currentValue } });
                      } else {
                        const bpStyles = section.styles[activeBreakpoint] || {};
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoDisableOnMobile: !currentValue } 
                          } 
                        });
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      getBreakpointStyles(section.styles).backgroundVideoDisableOnMobile === true ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        getBreakpointStyles(section.styles).backgroundVideoDisableOnMobile === true ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
          </div>
          )}

          {/* Background Overlay Controls (show for ALL background types: gradient, color, image, video) */}
          {(getBreakpointStyles(section.styles).backgroundType === 'gradient' || 
            getBreakpointStyles(section.styles).backgroundType === 'color' || 
            getBreakpointStyles(section.styles).backgroundType === 'image' || 
            getBreakpointStyles(section.styles).backgroundType === 'video' ||
            getBreakpointStyles(section.styles).gradientColors ||
            getBreakpointStyles(section.styles).backgroundImage ||
            getBreakpointStyles(section.styles).backgroundVideoUrl ||
            (getBreakpointStyles(section.styles).backgroundColor && getBreakpointStyles(section.styles).backgroundColor !== 'transparent')) && (
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
                  {/* Background Preview */}
                  {(() => {
                    const bgType = getBreakpointStyles(section.styles).backgroundType || 
                      (getBreakpointStyles(section.styles).backgroundVideoUrl ? 'video' : 
                       getBreakpointStyles(section.styles).gradientColors ? 'gradient' : 
                       getBreakpointStyles(section.styles).backgroundImage ? 'image' : 
                       getBreakpointStyles(section.styles).backgroundColor && getBreakpointStyles(section.styles).backgroundColor !== 'transparent' ? 'color' : 'none');
                    
                    if (bgType === 'image' && getBreakpointStyles(section.styles).backgroundImage) {
                      return (
                  <img
                    src={getBreakpointStyles(section.styles).backgroundImage}
                    alt="Background"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                      );
                    }
                    if (bgType === 'gradient' && getBreakpointStyles(section.styles).gradientColors) {
                      try {
                        const colors = typeof getBreakpointStyles(section.styles).gradientColors === 'string' 
                          ? JSON.parse(getBreakpointStyles(section.styles).gradientColors) 
                          : getBreakpointStyles(section.styles).gradientColors;
                        const colorStops = Array.isArray(colors) 
                          ? colors.map((c: any) => `${c.color || c} ${c.stop || ''}`).join(', ')
                          : '';
                        const gradient = getBreakpointStyles(section.styles).gradientType === 'radial'
                          ? `radial-gradient(${getBreakpointStyles(section.styles).gradientDirection || 'center'}, ${colorStops})`
                          : `linear-gradient(${getBreakpointStyles(section.styles).gradientAngle || getBreakpointStyles(section.styles).gradientDirection || '90deg'}, ${colorStops})`;
                        return <div className="w-full h-full" style={{ background: gradient }} />;
                      } catch (e) {
                        return <div className="w-full h-full bg-gray-200" />;
                      }
                    }
                    if (bgType === 'color' && getBreakpointStyles(section.styles).backgroundColor) {
                      return <div className="w-full h-full" style={{ backgroundColor: getBreakpointStyles(section.styles).backgroundColor }} />;
                    }
                    if (bgType === 'video' && getBreakpointStyles(section.styles).backgroundVideoPoster) {
                      return (
                        <img
                          src={getBreakpointStyles(section.styles).backgroundVideoPoster}
                          alt="Video Poster"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      );
                    }
                    return <div className="w-full h-full bg-gray-200" />;
                  })()}
                  {/* Overlay Layer */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: getBreakpointStyles(section.styles).overlayColor && getBreakpointStyles(section.styles).overlayColor !== 'transparent' 
                        ? getBreakpointStyles(section.styles).overlayColor 
                        : '#000000',
                      opacity: parseFloat(getBreakpointStyles(section.styles).overlayOpacity || '0.5'),
                    }}
                  />
                </div>
              </div>

              {/* Overlay Color */}
              <div className="mb-4">
                <ColorPicker
                  value={(() => {
                    const resolved = getBreakpointStyles(resolvedSectionStyles);
                    const sectionStyles = getBreakpointStyles(section.styles);
                    // Check new background.overlay structure first
                    if (resolved.background?.overlay?.color && resolved.background.overlay.color !== 'transparent') {
                      return resolved.background.overlay.color;
                    }
                    if (sectionStyles.background?.overlay?.color && sectionStyles.background.overlay.color !== 'transparent') {
                      return sectionStyles.background.overlay.color;
                    }
                    // Fallback to legacy overlayColor
                    return (resolved.overlayColor && resolved.overlayColor !== 'transparent') || 
                           (sectionStyles.overlayColor && sectionStyles.overlayColor !== 'transparent') 
                           ? (resolved.overlayColor || sectionStyles.overlayColor) 
                           : '#000000';
                  })()}
                  onChange={(color) => {
                    const updates: any = {
                      overlayColor: color, // Legacy
                    };
                    
                    // Update new background.overlay structure
                    const currentBg = getBreakpointStyles(resolvedSectionStyles).background || getBreakpointStyles(section.styles).background;
                    if (currentBg) {
                      updates.background = {
                        ...currentBg,
                        overlay: {
                          ...(currentBg.overlay || {}),
                          enabled: true,
                          color: color,
                        },
                      };
                    } else {
                      // Create background object if it doesn't exist
                      const bgType = getBreakpointStyles(resolvedSectionStyles).backgroundType || 
                                    (getBreakpointStyles(resolvedSectionStyles).backgroundImage ? 'image' : 
                                     getBreakpointStyles(resolvedSectionStyles).gradientColors ? 'gradient' : 
                                     getBreakpointStyles(resolvedSectionStyles).backgroundColor ? 'color' : 'color');
                      updates.background = {
                        type: bgType,
                        overlay: {
                          enabled: true,
                          color: color,
                          opacity: getBreakpointStyles(resolvedSectionStyles).overlayOpacity || 0.5,
                          blendMode: 'normal',
                        },
                      };
                    }
                    
                    if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, ...updates } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, ...updates } 
                        } 
                      });
                    }
                  }}
                  showTransparent={true}
                  isTransparent={getBreakpointStyles(section.styles).overlayColor === 'transparent'}
                  onTransparentToggle={() => {
                    const currentOverlay = getBreakpointStyles(section.styles).overlayColor;
                    const newOverlay = currentOverlay === 'transparent' ? '#000000' : 'transparent';
                    if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, overlayColor: newOverlay } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, overlayColor: newOverlay } 
                        } 
                      });
                    }
                  }}
                  label={`Overlay Color ${activeBreakpoint !== 'desktop' ? `(${activeBreakpoint})` : ''}`}
                />
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs text-gray-600 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Opacity {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
                  </label>
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {(() => {
                      const resolved = getBreakpointStyles(resolvedSectionStyles);
                      const sectionStyles = getBreakpointStyles(section.styles);
                      const opacity = resolved.background?.overlay?.opacity || 
                                    sectionStyles.background?.overlay?.opacity ||
                                    parseFloat(resolved.overlayOpacity || sectionStyles.overlayOpacity || '0.5');
                      return Math.round(opacity * 100);
                    })()}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={(() => {
                      const resolved = getBreakpointStyles(resolvedSectionStyles);
                      const sectionStyles = getBreakpointStyles(section.styles);
                      return String(resolved.background?.overlay?.opacity || 
                                   sectionStyles.background?.overlay?.opacity ||
                                   parseFloat(resolved.overlayOpacity || sectionStyles.overlayOpacity || '0.5'));
                    })()}
                    onChange={(e) => {
                      const opacityValue = parseFloat(e.target.value);
                      const resolved = getBreakpointStyles(resolvedSectionStyles);
                      const sectionStyles = getBreakpointStyles(section.styles);
                      
                      // When opacity is changed, ensure overlayColor is set to black if not already set
                      const currentOverlayColor = resolved.background?.overlay?.color || 
                                                 sectionStyles.background?.overlay?.color ||
                                                 resolved.overlayColor || 
                                                 sectionStyles.overlayColor;
                      
                      const updates: any = { 
                        overlayOpacity: String(opacityValue), // Legacy
                      };
                      
                      // Update new background.overlay structure
                      const currentBg = resolved.background || sectionStyles.background;
                      if (currentBg) {
                        updates.background = {
                          ...currentBg,
                          overlay: {
                            ...(currentBg.overlay || {}),
                            enabled: true,
                            opacity: opacityValue,
                            color: currentOverlayColor && currentOverlayColor !== 'transparent' 
                              ? currentOverlayColor 
                              : '#000000',
                            blendMode: currentBg.overlay?.blendMode || 'normal',
                          },
                        };
                      } else {
                        // Create background object if it doesn't exist
                        const bgType = resolved.backgroundType || 
                                      (resolved.backgroundImage ? 'image' : 
                                       resolved.gradientColors ? 'gradient' : 
                                       resolved.backgroundColor ? 'color' : 'color');
                        updates.background = {
                          type: bgType,
                          overlay: {
                            enabled: true,
                            color: currentOverlayColor && currentOverlayColor !== 'transparent' 
                              ? currentOverlayColor 
                              : '#000000',
                            opacity: opacityValue,
                            blendMode: 'normal',
                          },
                        };
                      }
                      
                      // If overlayColor is not set or is transparent, set it to black by default
                      if (!currentOverlayColor || currentOverlayColor === 'transparent') {
                        updates.overlayColor = '#000000'; // Legacy
                      }
                      
                      if (activeBreakpoint === 'desktop') {
                        updateSection(sectionId, { styles: { ...section.styles, ...updates } });
                      } else {
                        const bpStyles = section.styles[activeBreakpoint] || {};
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                            [activeBreakpoint]: { ...bpStyles, ...updates } 
                          } 
                        });
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: (() => {
                        const resolved = getBreakpointStyles(resolvedSectionStyles);
                        const sectionStyles = getBreakpointStyles(section.styles);
                        const opacity = resolved.background?.overlay?.opacity || 
                                      sectionStyles.background?.overlay?.opacity ||
                                      parseFloat(resolved.overlayOpacity || sectionStyles.overlayOpacity || '0.5');
                        const opacityPercent = opacity * 100;
                        return `linear-gradient(to right, #e5e7eb 0%, #3b82f6 ${opacityPercent}%, #e5e7eb ${opacityPercent}%, #e5e7eb 100%)`;
                      })()
                    }}
                  />
                  <style>{`
                    .slider::-webkit-slider-thumb {
                      appearance: none;
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: #3b82f6;
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    .slider::-moz-range-thumb {
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: #3b82f6;
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                  `}</style>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Spacing Group */}
          <div className="border-t pt-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Box className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Spacing</h3>
            </div>
            <BoxSpacingControl
              label="Margin"
              styles={getBreakpointStyles(section.styles)}
              breakpoint={activeBreakpoint}
              onChange={(partialStyles) => {
                  if (activeBreakpoint === 'desktop') {
                  updateSection(sectionId, { styles: { ...section.styles, ...partialStyles } });
                  } else {
                  const breakpointStyles = getBreakpointStyles(section.styles);
                  const updatedBreakpointStyles = { ...breakpointStyles, ...partialStyles };
                    updateSection(sectionId, { 
                      styles: { 
                        ...section.styles, 
                      [activeBreakpoint]: updatedBreakpointStyles,
                    },
                    });
                  }
                }}
            />
            <BoxSpacingControl
              label="Padding"
              styles={getBreakpointStyles(section.styles)}
              breakpoint={activeBreakpoint}
              onChange={(partialStyles) => {
                      if (activeBreakpoint === 'desktop') {
                  updateSection(sectionId, { styles: { ...section.styles, ...partialStyles } });
                      } else {
                  const breakpointStyles = getBreakpointStyles(section.styles);
                  const updatedBreakpointStyles = { ...breakpointStyles, ...partialStyles };
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                      [activeBreakpoint]: updatedBreakpointStyles,
                    },
                        });
                      }
                    }}
                  />
                </div>
        </>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <>
          {/* Custom ID & Classes */}
            <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Custom Attributes</h3>
            </div>

            {/* Custom ID */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Custom ID
              </label>
                        <input
                          type="text"
                value={section.customId || ''}
                          onChange={(e) => {
                  const value = e.target.value.trim();
                  updateSection(sectionId, { customId: value || undefined });
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., hero-section, about-us"
              />
              <p className="text-xs text-gray-500 mt-1.5">Add a custom ID for CSS/JS targeting (no spaces, use hyphens)</p>
            </div>

            {/* Custom CSS Classes */}
            <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Custom CSS Classes
                </label>
                <input
                  type="text"
                value={section.customClasses || ''}
                  onChange={(e) => {
                  const value = e.target.value.trim();
                  updateSection(sectionId, { customClasses: value || undefined });
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., my-custom-class another-class"
                />
              <p className="text-xs text-gray-500 mt-1.5">Add custom CSS classes separated by spaces</p>
              </div>
              </div>

          {/* Position & Overflow */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Square className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Position & Overflow</h3>
            </div>
            <div className="space-y-4">
              {/* Position */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  Position {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
              </label>
              <select
                  value={getBreakpointStyles(section.styles).position || 'relative'}
                onChange={(e) => {
                    const value = e.target.value as 'relative' | 'sticky';
                  if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, position: value } });
                  } else {
                    const bpStyles = section.styles[activeBreakpoint] || {};
                    updateSection(sectionId, { 
                      styles: { 
                        ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, position: value } 
                      } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                  <option value="relative">Relative (Default)</option>
                  <option value="sticky">Sticky</option>
              </select>
            </div>

              {/* Z-Index */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Z-Index {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <input
                    type="text"
                  value={getBreakpointStyles(section.styles).zIndex || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, zIndex: e.target.value } });
                      } else {
                        const bpStyles = section.styles[activeBreakpoint] || {};
                        updateSection(sectionId, { 
                          styles: { 
                            ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, zIndex: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 10, 100"
                  />
                </div>

              {/* Overflow */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Overflow {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                </label>
                <select
                  value={getBreakpointStyles(section.styles).overflow || 'visible'}
                  onChange={(e) => {
                    const value = e.target.value as 'visible' | 'hidden';
                    if (activeBreakpoint === 'desktop') {
                      updateSection(sectionId, { styles: { ...section.styles, overflow: value } });
                    } else {
                      const bpStyles = section.styles[activeBreakpoint] || {};
                      updateSection(sectionId, { 
                        styles: { 
                          ...section.styles, 
                          [activeBreakpoint]: { ...bpStyles, overflow: value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="visible">Visible (Default)</option>
                  <option value="hidden">Hidden</option>
              </select>
            </div>
            </div>
          </div>

          {/* Responsive Visibility */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Responsive Visibility</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs text-gray-600 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                  Hide on Desktop
              </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = section.styles?.hideOnDesktop === true;
                    updateSection(sectionId, { styles: { ...section.styles, hideOnDesktop: !currentValue } });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    section.styles?.hideOnDesktop === true ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      section.styles?.hideOnDesktop === true ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="block text-xs text-gray-600 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Hide on Tablet
              </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = section.styles?.hideOnTablet === true;
                    updateSection(sectionId, { styles: { ...section.styles, hideOnTablet: !currentValue } });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    section.styles?.hideOnTablet === true ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      section.styles?.hideOnTablet === true ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
            </div>
              <div className="flex items-center justify-between">
                <label className="block text-xs text-gray-600 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Hide on Mobile
              </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = section.styles?.hideOnMobile === true;
                    updateSection(sectionId, { styles: { ...section.styles, hideOnMobile: !currentValue } });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    section.styles?.hideOnMobile === true ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      section.styles?.hideOnMobile === true ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
            </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
