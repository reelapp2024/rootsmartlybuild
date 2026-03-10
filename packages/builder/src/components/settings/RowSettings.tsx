'use client';

import React from 'react';
import { Row } from '../../types/builder';
import ColorPicker from '../ui/ColorPicker';
import BreakpointBadge from '../ui/BreakpointBadge';
import BoxSpacingControl from '../controls/BoxSpacingControl';
import { Upload, X, Image as ImageIcon, Link, Layers, Eye, Square, Move, CornerDownRight, Zap, Maximize2, Box, AlignLeft, AlignCenter, AlignRight, Minus, LayoutGrid, LayoutList, Grid3x3, Video, PlayCircle, Plus, Trash2, Sparkles } from 'lucide-react';
import { handleNumberKeyDown as HandleNumberKeyDownType, handleInputKeyDown as HandleInputKeyDownType } from '../../utils/helpers';

interface RowSettingsProps {
  row: Row;
  sectionId: string;
  activeTab: 'content' | 'style' | 'advanced';
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  updateRow: (sectionId: string, rowId: string, updates: Partial<Row>) => void;
  getBreakpointStyles: (styles: any) => any;
  handleInputKeyDown: typeof HandleInputKeyDownType;
  handleNumberKeyDown: typeof HandleNumberKeyDownType;
}

export default function RowSettings({
  row,
  sectionId,
  activeTab,
  activeBreakpoint,
  updateRow,
  getBreakpointStyles,
  handleInputKeyDown,
  handleNumberKeyDown,
}: RowSettingsProps) {
  return (
    <>
      {/* Layout Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Layout Type */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Layout Type</h3>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                {getBreakpointStyles(row.styles).layoutType === 'flex' ? (
                  <LayoutList className="w-3.5 h-3.5" />
                ) : getBreakpointStyles(row.styles).layoutType === 'grid' ? (
                  <Grid3x3 className="w-3.5 h-3.5" />
                ) : (
                  <Box className="w-3.5 h-3.5" />
                )}
                Display {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
              </label>
              <select
                value={getBreakpointStyles(row.styles).layoutType || 'grid'}
                onChange={(e) => {
                  const value = e.target.value as 'block' | 'flex' | 'grid';
                  if (activeBreakpoint === 'desktop') {
                    updateRow(sectionId, row.id, { styles: { ...row.styles, layoutType: value } });
                  } else {
                    const bpStyles = row.styles[activeBreakpoint] || {};
                    updateRow(sectionId, row.id, { 
                      styles: { 
                        ...row.styles, 
                        [activeBreakpoint]: { ...bpStyles, layoutType: value } 
                      } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="grid">Grid</option>
                <option value="flex">Flex</option>
                <option value="block">Block</option>
              </select>
            </div>

            {/* Grid Properties (only if grid) */}
            {getBreakpointStyles(row.styles).layoutType === 'grid' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Grid3x3 className="w-3.5 h-3.5" />
                    Grid Template Columns {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).gridTemplateColumns || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, gridTemplateColumns: e.target.value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, gridTemplateColumns: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., repeat(3, 1fr), 1fr 2fr"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Examples: "repeat(3, 1fr)", "1fr 2fr", "200px 1fr"</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Column Gap {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).gap || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, gap: e.target.value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, gap: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(row.styles).gap || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateRow(sectionId, row.id, { styles: { ...row.styles, gap: val } });
                          } else {
                            const bpStyles = row.styles[activeBreakpoint] || {};
                            updateRow(sectionId, row.id, { 
                              styles: { 
                                ...row.styles, 
                                [activeBreakpoint]: { ...bpStyles, gap: val } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 24px, 1.5rem"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Spacing between columns</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Row Gap {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).rowGap || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, rowGap: e.target.value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, rowGap: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(row.styles).rowGap || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateRow(sectionId, row.id, { styles: { ...row.styles, rowGap: val } });
                          } else {
                            const bpStyles = row.styles[activeBreakpoint] || {};
                            updateRow(sectionId, row.id, { 
                              styles: { 
                                ...row.styles, 
                                [activeBreakpoint]: { ...bpStyles, rowGap: val } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 24px, 1.5rem"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Spacing between grid rows</p>
                </div>
              </div>
            )}

            {/* Flex Properties (only if flex) */}
            {getBreakpointStyles(row.styles).layoutType === 'flex' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Flex Direction {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <select
                    value={getBreakpointStyles(row.styles).flexDirection || 'row'}
                    onChange={(e) => {
                      const value = e.target.value as 'row' | 'column' | 'row-reverse' | 'column-reverse';
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, flexDirection: value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, flexDirection: value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="row">Row (Horizontal)</option>
                    <option value="column">Column (Vertical)</option>
                    <option value="row-reverse">Row Reverse</option>
                    <option value="column-reverse">Column Reverse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    {getBreakpointStyles(row.styles).justifyContent === 'flex-start' ? (
                      <AlignLeft className="w-3.5 h-3.5" />
                    ) : getBreakpointStyles(row.styles).justifyContent === 'flex-end' ? (
                      <AlignRight className="w-3.5 h-3.5" />
                    ) : (
                      <AlignCenter className="w-3.5 h-3.5" />
                    )}
                    Justify Content {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <select
                    value={getBreakpointStyles(row.styles).justifyContent || 'flex-start'}
                    onChange={(e) => {
                      const value = e.target.value as 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, justifyContent: value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, justifyContent: value } 
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
                  <p className="text-xs text-gray-500 mt-1.5">Main axis alignment (horizontal if row, vertical if column)</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    {getBreakpointStyles(row.styles).alignItems === 'flex-start' ? (
                      <AlignLeft className="w-3.5 h-3.5" />
                    ) : getBreakpointStyles(row.styles).alignItems === 'flex-end' ? (
                      <AlignRight className="w-3.5 h-3.5" />
                    ) : (
                      <AlignCenter className="w-3.5 h-3.5" />
                    )}
                    Align Items {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <select
                    value={getBreakpointStyles(row.styles).alignItems || 'stretch'}
                    onChange={(e) => {
                      const value = e.target.value as 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, alignItems: value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, alignItems: value } 
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
                    <option value="stretch">Stretch</option>
                    <option value="baseline">Baseline</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">Cross axis alignment (vertical if row, horizontal if column)</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Gap {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).gap || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, gap: e.target.value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, gap: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(row.styles).gap || '', (val) => {
                          if (activeBreakpoint === 'desktop') {
                            updateRow(sectionId, row.id, { styles: { ...row.styles, gap: val } });
                          } else {
                            const bpStyles = row.styles[activeBreakpoint] || {};
                            updateRow(sectionId, row.id, { 
                              styles: { 
                                ...row.styles, 
                                [activeBreakpoint]: { ...bpStyles, gap: val } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 24px, 1.5rem"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Spacing between flex items</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <LayoutList className="w-3.5 h-3.5" />
                    Flex Wrap {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <select
                    value={getBreakpointStyles(row.styles).flexWrap || 'nowrap'}
                    onChange={(e) => {
                      const value = e.target.value as 'nowrap' | 'wrap' | 'wrap-reverse';
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, flexWrap: value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, flexWrap: value } 
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
                  <p className="text-xs text-gray-500 mt-1.5">Allow items to wrap to next line</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          <div>
            <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1.5">
              <span>Row Background Color {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
              <BreakpointBadge styles={row.styles} property="backgroundColor" activeBreakpoint={activeBreakpoint} />
            </label>
            <ColorPicker
              value={getBreakpointStyles(row.styles).backgroundColor || '#f3f4f6'}
              onChange={(color) => {
                if (activeBreakpoint === 'desktop') {
                  updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundColor: color, backgroundImage: '' } }); 
                } else {
                  const bpStyles = row.styles[activeBreakpoint] || {};
                  updateRow(sectionId, row.id, { 
                    styles: { 
                      ...row.styles, 
                      [activeBreakpoint]: { ...bpStyles, backgroundColor: color, backgroundImage: '' } 
                    } 
                  });
                }
              }}
              showTransparent={true}
              isTransparent={getBreakpointStyles(row.styles).backgroundColor === 'transparent'}
              onTransparentToggle={() => {
                const currentBg = getBreakpointStyles(row.styles).backgroundColor;
                const newBg = currentBg === 'transparent' ? '#f3f4f6' : 'transparent';
                if (activeBreakpoint === 'desktop') {
                  updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundColor: newBg, backgroundImage: '' } }); 
                } else {
                  const bpStyles = row.styles[activeBreakpoint] || {};
                  updateRow(sectionId, row.id, { 
                    styles: { 
                      ...row.styles, 
                      [activeBreakpoint]: { ...bpStyles, backgroundColor: newBg, backgroundImage: '' } 
                    } 
                  });
                }
              }}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Row Background Image {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}
            </label>
            
            {/* Image Preview */}
            {getBreakpointStyles(row.styles).backgroundImage && (
              <div className="mb-3 relative">
                <div className="relative w-full h-32 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                  <img
                    src={getBreakpointStyles(row.styles).backgroundImage}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    onClick={() => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundImage: undefined } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        const { backgroundImage, ...restBpStyles } = bpStyles;
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
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
                  value={getBreakpointStyles(row.styles).backgroundImage || ''}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundImage: e.target.value, backgroundColor: 'transparent' } });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
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
                          updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundImage: reader.result as string, backgroundColor: 'transparent' } });
                        } else {
                          const bpStyles = row.styles[activeBreakpoint] || {};
                          updateRow(sectionId, row.id, { 
                            styles: { 
                              ...row.styles, 
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
          {getBreakpointStyles(row.styles).backgroundImage && (
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
                    src={getBreakpointStyles(row.styles).backgroundImage}
                    alt="Background"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: getBreakpointStyles(row.styles).overlayColor && getBreakpointStyles(row.styles).overlayColor !== 'transparent' 
                        ? getBreakpointStyles(row.styles).overlayColor 
                        : (getBreakpointStyles(row.styles).backgroundColor && getBreakpointStyles(row.styles).backgroundColor !== 'transparent' 
                          ? getBreakpointStyles(row.styles).backgroundColor 
                          : '#000000'),
                      opacity: parseFloat(getBreakpointStyles(row.styles).overlayOpacity || '0.5'),
                    }}
                  />
                </div>
              </div>

              {/* Overlay Color */}
              <div className="mb-4">
                <ColorPicker
                  value={getBreakpointStyles(row.styles).overlayColor && getBreakpointStyles(row.styles).overlayColor !== 'transparent' ? getBreakpointStyles(row.styles).overlayColor : (getBreakpointStyles(row.styles).backgroundColor && getBreakpointStyles(row.styles).backgroundColor !== 'transparent' ? getBreakpointStyles(row.styles).backgroundColor : '#000000')}
                  onChange={(color) => {
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { styles: { ...row.styles, overlayColor: color } });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
                          [activeBreakpoint]: { ...bpStyles, overlayColor: color } 
                        } 
                      });
                    }
                  }}
                  showTransparent={true}
                  isTransparent={getBreakpointStyles(row.styles).overlayColor === 'transparent'}
                  onTransparentToggle={() => {
                    const currentOverlay = getBreakpointStyles(row.styles).overlayColor;
                    const newOverlay = currentOverlay === 'transparent' ? '#000000' : 'transparent';
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { styles: { ...row.styles, overlayColor: newOverlay } });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
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
                    {Math.round((parseFloat(getBreakpointStyles(row.styles).overlayOpacity || '0.5')) * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={getBreakpointStyles(row.styles).overlayOpacity || '0.5'}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, overlayOpacity: e.target.value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, overlayOpacity: e.target.value } 
                          } 
                        });
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #e5e7eb 0%, #3b82f6 ${(parseFloat(getBreakpointStyles(row.styles).overlayOpacity || '0.5') * 100)}%, #e5e7eb ${(parseFloat(getBreakpointStyles(row.styles).overlayOpacity || '0.5') * 100)}%, #e5e7eb 100%)`
                    }}
                  />
                  <style jsx>{`
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

          {/* Background Video */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Background Video {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>

            {/* Video URL */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                <Link className="w-3.5 h-3.5" />
                Video URL
              </label>
              <input
                type="text"
                value={getBreakpointStyles(row.styles).backgroundVideo || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundVideo: e.target.value } });
                  } else {
                    const bpStyles = row.styles[activeBreakpoint] || {};
                    updateRow(sectionId, row.id, { 
                      styles: { 
                        ...row.styles, 
                        [activeBreakpoint]: { ...bpStyles, backgroundVideo: e.target.value } 
                      } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/video.mp4"
              />
              <p className="text-xs text-gray-500 mt-1.5">Supports MP4, WebM, OGG formats</p>
            </div>

            {/* Video Controls */}
            {getBreakpointStyles(row.styles).backgroundVideo && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="row-video-autoplay"
                    checked={getBreakpointStyles(row.styles).backgroundVideoAutoplay !== false}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundVideoAutoplay: e.target.checked } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoAutoplay: e.target.checked } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="row-video-autoplay" className="text-xs text-gray-700 cursor-pointer">Autoplay</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="row-video-loop"
                    checked={getBreakpointStyles(row.styles).backgroundVideoLoop !== false}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundVideoLoop: e.target.checked } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoLoop: e.target.checked } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="row-video-loop" className="text-xs text-gray-700 cursor-pointer">Loop</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="row-video-muted"
                    checked={getBreakpointStyles(row.styles).backgroundVideoMuted !== false}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundVideoMuted: e.target.checked } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoMuted: e.target.checked } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="row-video-muted" className="text-xs text-gray-700 cursor-pointer">Muted</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="row-video-overlay"
                    checked={getBreakpointStyles(row.styles).backgroundVideoOverlay === true}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, backgroundVideoOverlay: e.target.checked } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoOverlay: e.target.checked } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="row-video-overlay" className="text-xs text-gray-700 cursor-pointer">Show Overlay (uses overlay color/opacity)</label>
                </div>
              </div>
            )}
          </div>

          {/* Gradient Background Builder */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Gradient Background {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
              </div>
              {getBreakpointStyles(row.styles).gradientColors && (
                <button
                  onClick={() => {
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
                          gradientColors: undefined,
                          gradientType: undefined,
                          gradientAngle: undefined,
                          gradientDirection: undefined
                        } 
                      });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      const { gradientColors, gradientType, gradientAngle, gradientDirection, ...restBpStyles } = bpStyles;
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
                          [activeBreakpoint]: restBpStyles 
                        } 
                      });
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  title="Remove Gradient"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>

            {/* Gradient Type */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Gradient Type
              </label>
              <select
                value={getBreakpointStyles(row.styles).gradientType || 'linear'}
                onChange={(e) => {
                  const value = e.target.value as 'linear' | 'radial';
                  if (activeBreakpoint === 'desktop') {
                    updateRow(sectionId, row.id, { styles: { ...row.styles, gradientType: value } });
                  } else {
                    const bpStyles = row.styles[activeBreakpoint] || {};
                    updateRow(sectionId, row.id, { 
                      styles: { 
                        ...row.styles, 
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

            {/* Gradient Colors */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Color Stops
              </label>
              {(() => {
                const currentStyles = getBreakpointStyles(row.styles);
                const gradientColors = currentStyles.gradientColors ? JSON.parse(currentStyles.gradientColors) : [{ color: '#ff0000', stop: '0%' }, { color: '#0000ff', stop: '100%' }];
                
                return (
                  <div className="space-y-2">
                    {gradientColors.map((stop: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <ColorPicker
                          value={stop.color}
                          onChange={(color) => {
                            const newStops = [...gradientColors];
                            newStops[idx].color = color;
                            const gradientStr = JSON.stringify(newStops);
                            if (activeBreakpoint === 'desktop') {
                              updateRow(sectionId, row.id, { styles: { ...row.styles, gradientColors: gradientStr } });
                            } else {
                              const bpStyles = row.styles[activeBreakpoint] || {};
                              updateRow(sectionId, row.id, { 
                                styles: { 
                                  ...row.styles, 
                                  [activeBreakpoint]: { ...bpStyles, gradientColors: gradientStr } 
                                } 
                              });
                            }
                          }}
                          label=""
                          showTransparent={false}
                        />
                        <input
                          type="text"
                          value={stop.stop}
                          onChange={(e) => {
                            const newStops = [...gradientColors];
                            newStops[idx].stop = e.target.value;
                            const gradientStr = JSON.stringify(newStops);
                            if (activeBreakpoint === 'desktop') {
                              updateRow(sectionId, row.id, { styles: { ...row.styles, gradientColors: gradientStr } });
                            } else {
                              const bpStyles = row.styles[activeBreakpoint] || {};
                              updateRow(sectionId, row.id, { 
                                styles: { 
                                  ...row.styles, 
                                  [activeBreakpoint]: { ...bpStyles, gradientColors: gradientStr } 
                                } 
                              });
                            }
                          }}
                          className="w-20 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0%"
                        />
                        {gradientColors.length > 2 && (
                          <button
                            onClick={() => {
                              const newStops = gradientColors.filter((_: any, i: number) => i !== idx);
                              const gradientStr = JSON.stringify(newStops);
                              if (activeBreakpoint === 'desktop') {
                                updateRow(sectionId, row.id, { styles: { ...row.styles, gradientColors: gradientStr } });
                              } else {
                                const bpStyles = row.styles[activeBreakpoint] || {};
                                updateRow(sectionId, row.id, { 
                                  styles: { 
                                    ...row.styles, 
                                    [activeBreakpoint]: { ...bpStyles, gradientColors: gradientStr } 
                                  } 
                                });
                              }
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newStops = [...gradientColors, { color: '#00ff00', stop: '50%' }];
                        const gradientStr = JSON.stringify(newStops);
                        if (activeBreakpoint === 'desktop') {
                          updateRow(sectionId, row.id, { styles: { ...row.styles, gradientColors: gradientStr } });
                        } else {
                          const bpStyles = row.styles[activeBreakpoint] || {};
                          updateRow(sectionId, row.id, { 
                            styles: { 
                              ...row.styles, 
                              [activeBreakpoint]: { ...bpStyles, gradientColors: gradientStr } 
                            } 
                          });
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-3 h-3" />
                      Add Color Stop
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Gradient Angle (for linear) */}
            {getBreakpointStyles(row.styles).gradientType === 'linear' && (
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Angle (degrees)
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(row.styles).gradientAngle || '90deg'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { styles: { ...row.styles, gradientAngle: e.target.value } });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
                          [activeBreakpoint]: { ...bpStyles, gradientAngle: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="90deg"
                />
              </div>
            )}

            {/* Gradient Direction (for radial) */}
            {getBreakpointStyles(row.styles).gradientType === 'radial' && (
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Direction
                </label>
                <select
                  value={getBreakpointStyles(row.styles).gradientDirection || 'center'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { styles: { ...row.styles, gradientDirection: e.target.value } });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
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
                  <option value="top left">Top Left</option>
                  <option value="top right">Top Right</option>
                  <option value="bottom left">Bottom Left</option>
                  <option value="bottom right">Bottom Right</option>
                </select>
              </div>
            )}

            {/* Gradient Preview */}
            {getBreakpointStyles(row.styles).gradientColors && (
              <div className="mt-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </label>
                <div
                  className="w-full h-24 rounded-lg border-2 border-gray-200"
                  style={{
                    background: (() => {
                      const currentStyles = getBreakpointStyles(row.styles);
                      const colors = JSON.parse(currentStyles.gradientColors);
                      const colorStops = colors.map((c: any) => `${c.color} ${c.stop}`).join(', ');
                      if (currentStyles.gradientType === 'radial') {
                        return `radial-gradient(${currentStyles.gradientDirection || 'center'}, ${colorStops})`;
                      }
                      return `linear-gradient(${currentStyles.gradientAngle || '90deg'}, ${colorStops})`;
                    })()
                  }}
                />
              </div>
            )}
          </div>

          {/* Animations */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <PlayCircle className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Scroll Animations {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>

            {/* Animation Type */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <PlayCircle className="w-3.5 h-3.5" />
                Animation Type
              </label>
              <select
                value={getBreakpointStyles(row.styles).animationType || 'none'}
                onChange={(e) => {
                  const value = e.target.value as any;
                  if (activeBreakpoint === 'desktop') {
                    updateRow(sectionId, row.id, { styles: { ...row.styles, animationType: value } });
                  } else {
                    const bpStyles = row.styles[activeBreakpoint] || {};
                    updateRow(sectionId, row.id, { 
                      styles: { 
                        ...row.styles, 
                        [activeBreakpoint]: { ...bpStyles, animationType: value } 
                      } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">None</option>
                <option value="fadeIn">Fade In</option>
                <option value="slideUp">Slide Up</option>
                <option value="slideDown">Slide Down</option>
                <option value="slideLeft">Slide Left</option>
                <option value="slideRight">Slide Right</option>
                <option value="zoomIn">Zoom In</option>
                <option value="zoomOut">Zoom Out</option>
              </select>
            </div>

            {/* Animation Duration */}
            {getBreakpointStyles(row.styles).animationType && getBreakpointStyles(row.styles).animationType !== 'none' && (
              <>
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Duration (seconds)
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).animationDuration || '1s'}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, animationDuration: e.target.value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, animationDuration: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1s"
                  />
                </div>

                {/* Animation Delay */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Delay (seconds)
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).animationDelay || '0s'}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, animationDelay: e.target.value } });
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, animationDelay: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0s"
                  />
                </div>
              </>
            )}
          </div>

          {/* Parallax Effect */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Parallax Effect {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>

            {/* Parallax Enabled */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="row-parallax-enabled"
                  checked={getBreakpointStyles(row.styles).parallaxEnabled === true}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { styles: { ...row.styles, parallaxEnabled: e.target.checked } });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
                          [activeBreakpoint]: { ...bpStyles, parallaxEnabled: e.target.checked } 
                        } 
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="row-parallax-enabled" className="text-xs text-gray-700 cursor-pointer">Enable Parallax</label>
              </div>
            </div>

            {/* Parallax Speed */}
            {getBreakpointStyles(row.styles).parallaxEnabled && (
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Speed
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(row.styles).parallaxSpeed || '0.5'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { styles: { ...row.styles, parallaxSpeed: e.target.value } });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
                          [activeBreakpoint]: { ...bpStyles, parallaxSpeed: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.5"
                />
                <p className="text-xs text-gray-500 mt-1.5">Lower values = slower parallax (0.1-2.0 recommended)</p>
              </div>
            )}
          </div>

          {/* Spacing */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Spacing</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Gap Between Columns</label>
              <input
                type="text"
                value={row.styles.gap || ''}
                onChange={(e) => updateRow(sectionId, row.id, { styles: { ...row.styles, gap: e.target.value } })}
                onKeyDown={(e) => handleNumberKeyDown(e, row.styles.gap || '', (val) => updateRow(sectionId, row.id, { styles: { ...row.styles, gap: val } }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., 24px, 1.5rem"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Row Spacing (Bottom Margin)</label>
              <input
                type="text"
                value={row.styles.rowSpacing || ''}
                onChange={(e) => updateRow(sectionId, row.id, { styles: { ...row.styles, rowSpacing: e.target.value, marginBottom: e.target.value } })}
                onKeyDown={(e) => handleNumberKeyDown(e, row.styles.rowSpacing || '', (val) => updateRow(sectionId, row.id, { styles: { ...row.styles, rowSpacing: val, marginBottom: val } }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., 20px"
              />
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
                    borderWidth: getBreakpointStyles(row.styles).borderWidth || 
                      `${getBreakpointStyles(row.styles).borderTopWidth || '0px'} ${getBreakpointStyles(row.styles).borderRightWidth || '0px'} ${getBreakpointStyles(row.styles).borderBottomWidth || '0px'} ${getBreakpointStyles(row.styles).borderLeftWidth || '0px'}`,
                    borderStyle: getBreakpointStyles(row.styles).borderStyle || 'solid',
                    borderColor: getBreakpointStyles(row.styles).borderColor || '#000000',
                    borderRadius: getBreakpointStyles(row.styles).borderRadius || 
                      (getBreakpointStyles(row.styles).borderTopLeftRadius || getBreakpointStyles(row.styles).borderTopRightRadius || getBreakpointStyles(row.styles).borderBottomRightRadius || getBreakpointStyles(row.styles).borderBottomLeftRadius
                        ? `${getBreakpointStyles(row.styles).borderTopLeftRadius || '0px'} ${getBreakpointStyles(row.styles).borderTopRightRadius || '0px'} ${getBreakpointStyles(row.styles).borderBottomRightRadius || '0px'} ${getBreakpointStyles(row.styles).borderBottomLeftRadius || '0px'}`
                        : '0px'),
                    backgroundColor: getBreakpointStyles(row.styles).backgroundColor || '#ffffff',
                  }}
                />
              </div>
            </div>

            {/* Border Widths - All in One Row */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Move className="w-3.5 h-3.5" />
                Border Widths
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">All</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).borderWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderWidth: e.target.value, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderWidth: e.target.value, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderWidth: val, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
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
                    value={getBreakpointStyles(row.styles).borderTopWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderTopWidth: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderTopWidth: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderTopWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderTopWidth: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderTopWidth: val } 
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
                    value={getBreakpointStyles(row.styles).borderRightWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderRightWidth: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderRightWidth: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderRightWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderRightWidth: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderRightWidth: val } 
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
                    value={getBreakpointStyles(row.styles).borderBottomWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderBottomWidth: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderBottomWidth: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderBottomWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderBottomWidth: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderBottomWidth: val } 
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
                    value={getBreakpointStyles(row.styles).borderLeftWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderLeftWidth: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderLeftWidth: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderLeftWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderLeftWidth: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderLeftWidth: val } 
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
                value={getBreakpointStyles(row.styles).borderStyle || 'solid'}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateRow(sectionId, row.id, { styles: { ...row.styles, borderStyle: e.target.value as any } }); 
                  } else {
                    const bpStyles = row.styles[activeBreakpoint] || {};
                    updateRow(sectionId, row.id, { 
                      styles: { 
                        ...row.styles, 
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
                value={getBreakpointStyles(row.styles).borderColor || '#000000'}
                onChange={(color) => {
                  if (activeBreakpoint === 'desktop') {
                    updateRow(sectionId, row.id, { styles: { ...row.styles, borderColor: color } }); 
                  } else {
                    const bpStyles = row.styles[activeBreakpoint] || {};
                    updateRow(sectionId, row.id, { 
                      styles: { 
                        ...row.styles, 
                        [activeBreakpoint]: { ...bpStyles, borderColor: color } 
                      } 
                    });
                  }
                }}
                label="Border Color"
                showTransparent={false}
              />
            </div>

            {/* Border Radius - All in One Row */}
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
                    value={getBreakpointStyles(row.styles).borderRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderRadius: e.target.value, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderRadius: e.target.value, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderRadius: val, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
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
                    value={getBreakpointStyles(row.styles).borderTopLeftRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderTopLeftRadius: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderTopLeftRadius: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderTopLeftRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderTopLeftRadius: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderTopLeftRadius: val } 
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
                    value={getBreakpointStyles(row.styles).borderTopRightRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderTopRightRadius: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderTopRightRadius: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderTopRightRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderTopRightRadius: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderTopRightRadius: val } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">B Right</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).borderBottomRightRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderBottomRightRadius: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderBottomRightRadius: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderBottomRightRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderBottomRightRadius: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderBottomRightRadius: val } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">B Left</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).borderBottomLeftRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderBottomLeftRadius: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderBottomLeftRadius: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).borderBottomLeftRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, borderBottomLeftRadius: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderBottomLeftRadius: val } 
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
              <div className="relative w-full h-20 rounded-lg bg-gray-50 border-2 border-gray-200 flex items-center justify-center overflow-visible">
                <div
                  className="w-16 h-16 rounded-lg bg-white"
                  style={{
                    boxShadow: getBreakpointStyles(row.styles).boxShadow || 
                      `${getBreakpointStyles(row.styles).boxShadowOffsetX || '0px'} ${getBreakpointStyles(row.styles).boxShadowOffsetY || '0px'} ${getBreakpointStyles(row.styles).boxShadowBlur || '0px'} ${getBreakpointStyles(row.styles).boxShadowSpread || '0px'} ${getBreakpointStyles(row.styles).boxShadowColor || 'rgba(0, 0, 0, 0.1)'}`,
                  }}
                />
              </div>
            </div>

            {/* Shadow Color */}
            <div className="mb-4">
              <ColorPicker
                value={getBreakpointStyles(row.styles).boxShadowColor || 'rgba(0, 0, 0, 0.1)'}
                onChange={(color) => {
                  if (activeBreakpoint === 'desktop') {
                    updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadowColor: color } }); 
                  } else {
                    const bpStyles = row.styles[activeBreakpoint] || {};
                    updateRow(sectionId, row.id, { 
                      styles: { 
                        ...row.styles, 
                        [activeBreakpoint]: { ...bpStyles, boxShadowColor: color } 
                      } 
                    });
                  }
                }}
                label="Shadow Color"
                showTransparent={false}
              />
            </div>

            {/* Shadow Properties - All in One Row */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Move className="w-3.5 h-3.5" />
                Shadow Properties
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Offset X</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).boxShadowOffsetX || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadowOffsetX: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetX: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).boxShadowOffsetX || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadowOffsetX: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetX: val } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Offset Y</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).boxShadowOffsetY || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadowOffsetY: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetY: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).boxShadowOffsetY || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadowOffsetY: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetY: val } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Blur</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).boxShadowBlur || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadowBlur: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowBlur: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).boxShadowBlur || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadowBlur: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowBlur: val } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Spread</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(row.styles).boxShadowSpread || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadowSpread: e.target.value } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowSpread: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(row.styles).boxShadowSpread || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadowSpread: val } }); 
                      } else {
                        const bpStyles = row.styles[activeBreakpoint] || {};
                        updateRow(sectionId, row.id, { 
                          styles: { 
                            ...row.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowSpread: val } 
                          } 
                        });
                      }
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0px"
                  />
                </div>
              </div>
            </div>

            {/* Custom Shadow */}
            <div>
              <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Custom Shadow
              </label>
              <input
                type="text"
                value={getBreakpointStyles(row.styles).boxShadow || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateRow(sectionId, row.id, { styles: { ...row.styles, boxShadow: e.target.value, boxShadowColor: undefined, boxShadowOffsetX: undefined, boxShadowOffsetY: undefined, boxShadowBlur: undefined, boxShadowSpread: undefined } }); 
                  } else {
                    const bpStyles = row.styles[activeBreakpoint] || {};
                    updateRow(sectionId, row.id, { 
                      styles: { 
                        ...row.styles, 
                        [activeBreakpoint]: { ...bpStyles, boxShadow: e.target.value, boxShadowColor: undefined, boxShadowOffsetX: undefined, boxShadowOffsetY: undefined, boxShadowBlur: undefined, boxShadowSpread: undefined } 
                      } 
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 0 4px 6px rgba(0,0,0,0.1)"
              />
              <p className="text-xs text-gray-500 mt-1.5">Overrides individual properties above</p>
            </div>
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
                value={row.customId || ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  updateRow(sectionId, row.id, { customId: value || undefined });
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., hero-row, content-row"
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
                value={row.customClasses || ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  updateRow(sectionId, row.id, { customClasses: value || undefined });
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., my-custom-class another-class"
              />
              <p className="text-xs text-gray-500 mt-1.5">Add custom CSS classes separated by spaces</p>
            </div>
          </div>

          {/* Position & Z-Index */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Square className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Position & Z-Index</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  Position {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                </label>
                <select
                  value={getBreakpointStyles(row.styles).position || 'static'}
                  onChange={(e) => {
                    const value = e.target.value as 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { styles: { ...row.styles, position: value } });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
                          [activeBreakpoint]: { ...bpStyles, position: value } 
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
              </div>

              {/* Position Values (only if not static) */}
              {getBreakpointStyles(row.styles).position && getBreakpointStyles(row.styles).position !== 'static' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                      Top {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                    </label>
                    <input
                      type="text"
                      value={getBreakpointStyles(row.styles).top || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateRow(sectionId, row.id, { styles: { ...row.styles, top: e.target.value } });
                        } else {
                          const bpStyles = row.styles[activeBreakpoint] || {};
                          updateRow(sectionId, row.id, { 
                            styles: { 
                              ...row.styles, 
                              [activeBreakpoint]: { ...bpStyles, top: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          handleInputKeyDown(e);
                        } else {
                          handleNumberKeyDown(e, getBreakpointStyles(row.styles).top || '', (val) => {
                            if (activeBreakpoint === 'desktop') {
                              updateRow(sectionId, row.id, { styles: { ...row.styles, top: val } });
                            } else {
                              const bpStyles = row.styles[activeBreakpoint] || {};
                              updateRow(sectionId, row.id, { 
                                styles: { 
                                  ...row.styles, 
                                  [activeBreakpoint]: { ...bpStyles, top: val } 
                                } 
                              });
                            }
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                      Right {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                    </label>
                    <input
                      type="text"
                      value={getBreakpointStyles(row.styles).right || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateRow(sectionId, row.id, { styles: { ...row.styles, right: e.target.value } });
                        } else {
                          const bpStyles = row.styles[activeBreakpoint] || {};
                          updateRow(sectionId, row.id, { 
                            styles: { 
                              ...row.styles, 
                              [activeBreakpoint]: { ...bpStyles, right: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          handleInputKeyDown(e);
                        } else {
                          handleNumberKeyDown(e, getBreakpointStyles(row.styles).right || '', (val) => {
                            if (activeBreakpoint === 'desktop') {
                              updateRow(sectionId, row.id, { styles: { ...row.styles, right: val } });
                            } else {
                              const bpStyles = row.styles[activeBreakpoint] || {};
                              updateRow(sectionId, row.id, { 
                                styles: { 
                                  ...row.styles, 
                                  [activeBreakpoint]: { ...bpStyles, right: val } 
                                } 
                              });
                            }
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                      Bottom {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                    </label>
                    <input
                      type="text"
                      value={getBreakpointStyles(row.styles).bottom || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateRow(sectionId, row.id, { styles: { ...row.styles, bottom: e.target.value } });
                        } else {
                          const bpStyles = row.styles[activeBreakpoint] || {};
                          updateRow(sectionId, row.id, { 
                            styles: { 
                              ...row.styles, 
                              [activeBreakpoint]: { ...bpStyles, bottom: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          handleInputKeyDown(e);
                        } else {
                          handleNumberKeyDown(e, getBreakpointStyles(row.styles).bottom || '', (val) => {
                            if (activeBreakpoint === 'desktop') {
                              updateRow(sectionId, row.id, { styles: { ...row.styles, bottom: val } });
                            } else {
                              const bpStyles = row.styles[activeBreakpoint] || {};
                              updateRow(sectionId, row.id, { 
                                styles: { 
                                  ...row.styles, 
                                  [activeBreakpoint]: { ...bpStyles, bottom: val } 
                                } 
                              });
                            }
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                      Left {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                    </label>
                    <input
                      type="text"
                      value={getBreakpointStyles(row.styles).left || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateRow(sectionId, row.id, { styles: { ...row.styles, left: e.target.value } });
                        } else {
                          const bpStyles = row.styles[activeBreakpoint] || {};
                          updateRow(sectionId, row.id, { 
                            styles: { 
                              ...row.styles, 
                              [activeBreakpoint]: { ...bpStyles, left: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          handleInputKeyDown(e);
                        } else {
                          handleNumberKeyDown(e, getBreakpointStyles(row.styles).left || '', (val) => {
                            if (activeBreakpoint === 'desktop') {
                              updateRow(sectionId, row.id, { styles: { ...row.styles, left: val } });
                            } else {
                              const bpStyles = row.styles[activeBreakpoint] || {};
                              updateRow(sectionId, row.id, { 
                                styles: { 
                                  ...row.styles, 
                                  [activeBreakpoint]: { ...bpStyles, left: val } 
                                } 
                              });
                            }
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 0px, 10%"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Z-Index {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(row.styles).zIndex || ''}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateRow(sectionId, row.id, { styles: { ...row.styles, zIndex: e.target.value } });
                    } else {
                      const bpStyles = row.styles[activeBreakpoint] || {};
                      updateRow(sectionId, row.id, { 
                        styles: { 
                          ...row.styles, 
                          [activeBreakpoint]: { ...bpStyles, zIndex: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, getBreakpointStyles(row.styles).zIndex || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateRow(sectionId, row.id, { styles: { ...row.styles, zIndex: val } });
                        } else {
                          const bpStyles = row.styles[activeBreakpoint] || {};
                          updateRow(sectionId, row.id, { 
                            styles: { 
                              ...row.styles, 
                              [activeBreakpoint]: { ...bpStyles, zIndex: val } 
                            } 
                          });
                        }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 10, 100, auto"
                />
                <p className="text-xs text-gray-500 mt-1.5">Controls layer ordering</p>
              </div>
            </div>
          </div>

          {/* Spacing Controls */}
          <div className="border-t pt-4">
            <BoxSpacingControl
              label="Margin"
              styles={getBreakpointStyles(row.styles)}
              breakpoint={activeBreakpoint}
              onChange={(partialStyles) => {
                if (activeBreakpoint === 'desktop') {
                  updateRow(sectionId, row.id, { styles: { ...row.styles, ...partialStyles } });
                } else {
                  const breakpointStyles = getBreakpointStyles(row.styles);
                  const updatedBreakpointStyles = { ...breakpointStyles, ...partialStyles };
                  updateRow(sectionId, row.id, {
                    styles: {
                      ...row.styles,
                      [activeBreakpoint]: updatedBreakpointStyles,
                    },
                  });
                }
              }}
            />
            <BoxSpacingControl
              label="Padding"
              styles={getBreakpointStyles(row.styles)}
              breakpoint={activeBreakpoint}
              onChange={(partialStyles) => {
                if (activeBreakpoint === 'desktop') {
                  updateRow(sectionId, row.id, { styles: { ...row.styles, ...partialStyles } });
                } else {
                  const breakpointStyles = getBreakpointStyles(row.styles);
                  const updatedBreakpointStyles = { ...breakpointStyles, ...partialStyles };
                  updateRow(sectionId, row.id, {
                    styles: {
                      ...row.styles,
                      [activeBreakpoint]: updatedBreakpointStyles,
                    },
                  });
                }
              }}
            />
          </div>
        </>
      )}
    </>
  );
}

