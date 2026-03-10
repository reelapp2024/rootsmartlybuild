'use client';

import React from 'react';
import { Column } from '../../types/builder';
import ColorPicker from '../ui/ColorPicker';
import BreakpointBadge from '../ui/BreakpointBadge';
import BoxSpacingControl from '../controls/BoxSpacingControl';
import { Maximize2, Minus, Move, Grid3x3, AlignLeft, AlignCenter, AlignRight, LayoutList, Box, ArrowUpDown, Type, Upload, X, Image as ImageIcon, Link, Layers, Eye, Square, CornerDownRight, Video, PlayCircle, Plus, Trash2, Sparkles, Zap } from 'lucide-react';
import { handleNumberKeyDown as HandleNumberKeyDownType, handleInputKeyDown as HandleInputKeyDownType } from '../../utils/helpers';

interface ColumnSettingsProps {
  column: Column;
  sectionId: string;
  rowId: string;
  activeTab: 'content' | 'style' | 'advanced';
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  parentRowLayoutType: 'block' | 'flex' | 'grid';
  updateColumn: (sectionId: string, rowId: string, columnId: string, updates: Partial<Column>) => void;
  getBreakpointStyles: (styles: any) => any;
  handleInputKeyDown: typeof HandleInputKeyDownType;
  handleNumberKeyDown: typeof HandleNumberKeyDownType;
}

export default function ColumnSettings({
  column,
  sectionId,
  rowId,
  activeTab,
  activeBreakpoint,
  parentRowLayoutType,
  updateColumn,
  getBreakpointStyles,
  handleInputKeyDown,
  handleNumberKeyDown,
}: ColumnSettingsProps) {
  return (
    <>
      {/* Layout Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Element Count Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Columns are containers for elements.</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Box className="w-3.5 h-3.5" />
                Elements: <span className="font-medium text-gray-700">{(column.elements || []).length}</span>
              </span>
              <span className="flex items-center gap-1">
                {parentRowLayoutType === 'flex' ? (
                  <LayoutList className="w-3.5 h-3.5" />
                ) : parentRowLayoutType === 'grid' ? (
                  <Grid3x3 className="w-3.5 h-3.5" />
                ) : (
                  <Box className="w-3.5 h-3.5" />
                )}
                Parent Layout: <span className="font-medium text-gray-700 capitalize">{parentRowLayoutType}</span>
              </span>
            </div>
          </div>

          {/* Width Controls */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Maximize2 className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Width & Size</h3>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5" />
                Width {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
              </label>
              <input
                type="text"
                value={getBreakpointStyles(column.styles).width || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, width: e.target.value } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
                        [activeBreakpoint]: { ...bpStyles, width: e.target.value } 
                      } 
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, getBreakpointStyles(column.styles).width || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, width: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, width: val } 
                          } 
                        });
                      }
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 100%, 300px, 1fr"
              />
              <p className="text-xs text-gray-500 mt-1.5">Leave empty for auto. Grid: use fr units. Flex: use px, %, or auto.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5" />
                  Min Width {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(column.styles).minWidth || ''}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, minWidth: e.target.value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, minWidth: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, getBreakpointStyles(column.styles).minWidth || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, minWidth: val } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
                              [activeBreakpoint]: { ...bpStyles, minWidth: val } 
                            } 
                          });
                        }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 200px"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Max Width {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(column.styles).maxWidth || ''}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, maxWidth: e.target.value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, maxWidth: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, getBreakpointStyles(column.styles).maxWidth || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, maxWidth: val } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
                              [activeBreakpoint]: { ...bpStyles, maxWidth: val } 
                            } 
                          });
                        }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 500px"
                />
              </div>
            </div>
          </div>

          {/* Flex Properties */}
          {parentRowLayoutType === 'flex' && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <LayoutList className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Flex Properties</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Flex Grow {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(column.styles).flexGrow !== undefined ? String(getBreakpointStyles(column.styles).flexGrow) : ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value));
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, flexGrow: value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, flexGrow: value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(column.styles).flexGrow !== undefined ? String(getBreakpointStyles(column.styles).flexGrow) : '', (val) => {
                          const numVal = val === '' ? undefined : Number(val);
                          if (activeBreakpoint === 'desktop') {
                            updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, flexGrow: numVal } });
                          } else {
                            const bpStyles = column.styles[activeBreakpoint] || {};
                            updateColumn(sectionId, rowId, column.id, { 
                              styles: { 
                                ...column.styles, 
                                [activeBreakpoint]: { ...bpStyles, flexGrow: numVal } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">How much to grow</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Minus className="w-3.5 h-3.5" />
                    Flex Shrink {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(column.styles).flexShrink !== undefined ? String(getBreakpointStyles(column.styles).flexShrink) : ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value));
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, flexShrink: value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, flexShrink: value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, getBreakpointStyles(column.styles).flexShrink !== undefined ? String(getBreakpointStyles(column.styles).flexShrink) : '', (val) => {
                          const numVal = val === '' ? undefined : Number(val);
                          if (activeBreakpoint === 'desktop') {
                            updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, flexShrink: numVal } });
                          } else {
                            const bpStyles = column.styles[activeBreakpoint] || {};
                            updateColumn(sectionId, rowId, column.id, { 
                              styles: { 
                                ...column.styles, 
                                [activeBreakpoint]: { ...bpStyles, flexShrink: numVal } 
                              } 
                            });
                          }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">How much to shrink</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Box className="w-3.5 h-3.5" />
                    Flex Basis {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(column.styles).flexBasis || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, flexBasis: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, flexBasis: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., auto, 200px"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Initial size</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  {getBreakpointStyles(column.styles).alignSelf === 'flex-start' ? (
                    <AlignLeft className="w-3.5 h-3.5" />
                  ) : getBreakpointStyles(column.styles).alignSelf === 'flex-end' ? (
                    <AlignRight className="w-3.5 h-3.5" />
                  ) : (
                    <AlignCenter className="w-3.5 h-3.5" />
                  )}
                  Align Self {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                </label>
                <select
                  value={getBreakpointStyles(column.styles).alignSelf || 'auto'}
                  onChange={(e) => {
                    const value = e.target.value as 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, alignSelf: value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, alignSelf: value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="auto">Auto</option>
                  <option value="flex-start">Flex Start</option>
                  <option value="flex-end">Flex End</option>
                  <option value="center">Center</option>
                  <option value="stretch">Stretch</option>
                  <option value="baseline">Baseline</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Override parent align-items for this column</p>
              </div>
            </div>
          )}

          {/* Grid Properties */}
          {parentRowLayoutType === 'grid' && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Grid3x3 className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Grid Properties</h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Grid3x3 className="w-3.5 h-3.5" />
                  Grid Column Span {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                </label>
                <select
                  value={(() => {
                    const gridCol = getBreakpointStyles(column.styles).gridColumn;
                    if (!gridCol) return 'auto';
                    // Try to match with presets
                    if (gridCol === 'span 1' || gridCol === '1 / 2') return 'auto'; // span 1 = auto (1 column)
                    if (gridCol === 'span 2' || gridCol === '1 / 3') return 'span 2';
                    if (gridCol === 'span 3' || gridCol === '1 / 4') return 'span 3';
                    if (gridCol === 'span 4' || gridCol === '1 / 5') return 'span 4';
                    if (gridCol === 'span 5' || gridCol === '1 / 6') return 'span 5';
                    if (gridCol === 'span 6' || gridCol === '1 / 7') return 'span 6';
                    return 'custom';
                  })()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'custom') return;
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, gridColumn: value === 'auto' ? undefined : value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, gridColumn: value === 'auto' ? undefined : value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                >
                  <option value="auto">Auto (1 column)</option>
                  <option value="span 2">Span 2 Columns</option>
                  <option value="span 3">Span 3 Columns</option>
                  <option value="span 4">Span 4 Columns</option>
                  <option value="span 5">Span 5 Columns</option>
                  <option value="span 6">Span 6 Columns</option>
                  <option value="custom">Custom...</option>
                </select>
                
                {/* Custom Grid Column Input */}
                {(() => {
                  const gridCol = getBreakpointStyles(column.styles).gridColumn;
                  const isCustom = gridCol && !['span 1', 'span 2', 'span 3', 'span 4', 'span 5', 'span 6', 'auto'].includes(gridCol);
                  return isCustom ? (
                    <input
                      type="text"
                      value={gridCol || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, gridColumn: e.target.value } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
                              [activeBreakpoint]: { ...bpStyles, gridColumn: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 1 / 3, span 2"
                    />
                  ) : null;
                })()}
                <p className="text-xs text-gray-500 mt-1.5">Examples: "span 2", "1 / 3", "1 / span 2"</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    {getBreakpointStyles(column.styles).justifySelf === 'start' ? (
                      <AlignLeft className="w-3.5 h-3.5" />
                    ) : getBreakpointStyles(column.styles).justifySelf === 'end' ? (
                      <AlignRight className="w-3.5 h-3.5" />
                    ) : (
                      <AlignCenter className="w-3.5 h-3.5" />
                    )}
                    Justify Self {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <select
                    value={getBreakpointStyles(column.styles).justifySelf || 'auto'}
                    onChange={(e) => {
                      const value = e.target.value as 'auto' | 'start' | 'end' | 'center' | 'stretch';
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, justifySelf: value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, justifySelf: value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="start">Start</option>
                    <option value="end">End</option>
                    <option value="center">Center</option>
                    <option value="stretch">Stretch</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">Horizontal alignment</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    {getBreakpointStyles(column.styles).alignSelf === 'flex-start' ? (
                      <AlignLeft className="w-3.5 h-3.5" />
                    ) : getBreakpointStyles(column.styles).alignSelf === 'flex-end' ? (
                      <AlignRight className="w-3.5 h-3.5" />
                    ) : (
                      <AlignCenter className="w-3.5 h-3.5" />
                    )}
                    Align Self {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                  </label>
                  <select
                    value={getBreakpointStyles(column.styles).alignSelf || 'auto'}
                    onChange={(e) => {
                      const value = e.target.value as 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, alignSelf: value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, alignSelf: value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="flex-start">Start</option>
                    <option value="flex-end">End</option>
                    <option value="center">Center</option>
                    <option value="stretch">Stretch</option>
                    <option value="baseline">Baseline</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">Vertical alignment</p>
                </div>
              </div>
            </div>
          )}

          {/* Order */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Display Order</h3>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Order {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
              </label>
              <input
                type="number"
                value={getBreakpointStyles(column.styles).order !== undefined ? String(getBreakpointStyles(column.styles).order) : ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : Number(e.target.value);
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, order: value } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
                        [activeBreakpoint]: { ...bpStyles, order: value } 
                      } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1.5">Change display order (lower numbers appear first)</p>
            </div>
          </div>

          {/* Text Alignment */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Text Alignment</h3>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                {getBreakpointStyles(column.styles).textAlign === 'left' ? (
                  <AlignLeft className="w-3.5 h-3.5" />
                ) : getBreakpointStyles(column.styles).textAlign === 'right' ? (
                  <AlignRight className="w-3.5 h-3.5" />
                ) : (
                  <AlignCenter className="w-3.5 h-3.5" />
                )}
                Text Alignment {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
              </label>
              <select
                value={getBreakpointStyles(column.styles).textAlign || 'left'}
                onChange={(e) => {
                  const value = e.target.value as 'left' | 'center' | 'right' | 'justify';
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, textAlign: value } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
                        [activeBreakpoint]: { ...bpStyles, textAlign: value } 
                      } 
                    });
                  }
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
              <p className="text-xs text-gray-500 mt-1.5">Text alignment for column content</p>
            </div>
          </div>

          {/* Height Settings */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Minus className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Height Settings {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>

            {/* Min Height */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <Minus className="w-3.5 h-3.5" />
                <span>Min Height {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={column.styles} property="minHeight" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={getBreakpointStyles(column.styles).minHeight || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, minHeight: e.target.value } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
                        [activeBreakpoint]: { ...bpStyles, minHeight: e.target.value } 
                      } 
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, getBreakpointStyles(column.styles).minHeight || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, minHeight: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, minHeight: val } 
                          } 
                        });
                      }
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 200px, 50vh"
              />
              <p className="text-xs text-gray-500 mt-1.5">Leave empty for auto height</p>
            </div>

            {/* Height */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <Minus className="w-3.5 h-3.5" />
                <span>Height {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={column.styles} property="height" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={getBreakpointStyles(column.styles).height || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, height: e.target.value } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
                        [activeBreakpoint]: { ...bpStyles, height: e.target.value } 
                      } 
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, getBreakpointStyles(column.styles).height || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, height: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, height: val } 
                          } 
                        });
                      }
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 300px, 100vh"
              />
              <p className="text-xs text-gray-500 mt-1.5">Leave empty for auto height</p>
            </div>

            {/* Max Height */}
            <div>
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                <Minus className="w-3.5 h-3.5" />
                <span>Max Height {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                <BreakpointBadge styles={column.styles} property="maxHeight" activeBreakpoint={activeBreakpoint} />
              </label>
              <input
                type="text"
                value={getBreakpointStyles(column.styles).maxHeight || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, maxHeight: e.target.value } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
                        [activeBreakpoint]: { ...bpStyles, maxHeight: e.target.value } 
                      } 
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleInputKeyDown(e);
                  } else {
                    handleNumberKeyDown(e, getBreakpointStyles(column.styles).maxHeight || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, maxHeight: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, maxHeight: val } 
                          } 
                        });
                      }
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 500px, 80vh"
              />
              <p className="text-xs text-gray-500 mt-1.5">Leave empty for no max height</p>
            </div>
          </div>
        </div>
      )}

      {/* Style Tab - Column container styles only */}
      {activeTab === 'style' && (
        <>
          <div>
            <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1.5">
              <span>Column Background Color {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
              <BreakpointBadge styles={column.styles} property="backgroundColor" activeBreakpoint={activeBreakpoint} />
            </label>
            <ColorPicker
              value={getBreakpointStyles(column.styles).backgroundColor || '#ffffff'}
              onChange={(color) => {
                if (activeBreakpoint === 'desktop') {
                  updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundColor: color, backgroundImage: '' } });
                } else {
                  const bpStyles = column.styles[activeBreakpoint] || {};
                  updateColumn(sectionId, rowId, column.id, { 
                    styles: { 
                      ...column.styles, 
                      [activeBreakpoint]: { ...bpStyles, backgroundColor: color, backgroundImage: '' } 
                    } 
                  });
                }
              }}
              showTransparent={true}
              isTransparent={getBreakpointStyles(column.styles).backgroundColor === 'transparent'}
              onTransparentToggle={() => {
                const currentBg = getBreakpointStyles(column.styles).backgroundColor;
                const newBg = currentBg === 'transparent' ? '#ffffff' : 'transparent';
                if (activeBreakpoint === 'desktop') {
                  updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundColor: newBg, backgroundImage: '' } });
                } else {
                  const bpStyles = column.styles[activeBreakpoint] || {};
                  updateColumn(sectionId, rowId, column.id, { 
                    styles: { 
                      ...column.styles, 
                      [activeBreakpoint]: { ...bpStyles, backgroundColor: newBg, backgroundImage: '' } 
                    } 
                  });
                }
              }}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
              <span>Column Background Image {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</span>
              <BreakpointBadge styles={column.styles} property="backgroundImage" activeBreakpoint={activeBreakpoint} />
            </label>
            
            {/* Image Preview */}
            {getBreakpointStyles(column.styles).backgroundImage && (
              <div className="mb-3 relative">
                <div className="relative w-full h-32 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                  <img
                    src={getBreakpointStyles(column.styles).backgroundImage}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    onClick={() => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundImage: undefined } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        const { backgroundImage, ...restBpStyles } = bpStyles;
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                  value={getBreakpointStyles(column.styles).backgroundImage || ''}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundImage: e.target.value, backgroundColor: 'transparent' } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
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
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundImage: reader.result as string, backgroundColor: 'transparent' } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
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
          {getBreakpointStyles(column.styles).backgroundImage && (
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
                    src={getBreakpointStyles(column.styles).backgroundImage}
                    alt="Background"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: getBreakpointStyles(column.styles).overlayColor && getBreakpointStyles(column.styles).overlayColor !== 'transparent' 
                        ? getBreakpointStyles(column.styles).overlayColor 
                        : (getBreakpointStyles(column.styles).backgroundColor && getBreakpointStyles(column.styles).backgroundColor !== 'transparent' 
                          ? getBreakpointStyles(column.styles).backgroundColor 
                          : '#000000'),
                      opacity: parseFloat(getBreakpointStyles(column.styles).overlayOpacity || '0.5'),
                    }}
                  />
                </div>
              </div>

              {/* Overlay Color */}
              <div className="mb-4">
                <ColorPicker
                  value={getBreakpointStyles(column.styles).overlayColor && getBreakpointStyles(column.styles).overlayColor !== 'transparent' ? getBreakpointStyles(column.styles).overlayColor : (getBreakpointStyles(column.styles).backgroundColor && getBreakpointStyles(column.styles).backgroundColor !== 'transparent' ? getBreakpointStyles(column.styles).backgroundColor : '#000000')}
                  onChange={(color) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, overlayColor: color } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, overlayColor: color } 
                        } 
                      });
                    }
                  }}
                  label="Overlay Color"
                  showTransparent={false}
                />
              </div>

              {/* Overlay Opacity */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Opacity
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={getBreakpointStyles(column.styles).overlayOpacity || '0.5'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, overlayOpacity: e.target.value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, overlayOpacity: e.target.value } 
                        } 
                      });
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{Math.round((parseFloat(getBreakpointStyles(column.styles).overlayOpacity || '0.5') * 100))}%</span>
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
                value={getBreakpointStyles(column.styles).backgroundVideo || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundVideo: e.target.value } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
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
            {getBreakpointStyles(column.styles).backgroundVideo && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="col-video-autoplay"
                    checked={getBreakpointStyles(column.styles).backgroundVideoAutoplay !== false}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundVideoAutoplay: e.target.checked } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoAutoplay: e.target.checked } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="col-video-autoplay" className="text-xs text-gray-700 cursor-pointer">Autoplay</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="col-video-loop"
                    checked={getBreakpointStyles(column.styles).backgroundVideoLoop !== false}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundVideoLoop: e.target.checked } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoLoop: e.target.checked } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="col-video-loop" className="text-xs text-gray-700 cursor-pointer">Loop</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="col-video-muted"
                    checked={getBreakpointStyles(column.styles).backgroundVideoMuted !== false}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundVideoMuted: e.target.checked } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoMuted: e.target.checked } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="col-video-muted" className="text-xs text-gray-700 cursor-pointer">Muted</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="col-video-overlay"
                    checked={getBreakpointStyles(column.styles).backgroundVideoOverlay === true}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, backgroundVideoOverlay: e.target.checked } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, backgroundVideoOverlay: e.target.checked } 
                          } 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="col-video-overlay" className="text-xs text-gray-700 cursor-pointer">Show Overlay (uses overlay color/opacity)</label>
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
              {getBreakpointStyles(column.styles).gradientColors && (
                <button
                  onClick={() => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          gradientColors: undefined,
                          gradientType: undefined,
                          gradientAngle: undefined,
                          gradientDirection: undefined
                        } 
                      });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      const { gradientColors, gradientType, gradientAngle, gradientDirection, ...restBpStyles } = bpStyles;
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
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
                value={getBreakpointStyles(column.styles).gradientType || 'linear'}
                onChange={(e) => {
                  const value = e.target.value as 'linear' | 'radial';
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, gradientType: value } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
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
                const currentStyles = getBreakpointStyles(column.styles);
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
                              updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, gradientColors: gradientStr } });
                            } else {
                              const bpStyles = column.styles[activeBreakpoint] || {};
                              updateColumn(sectionId, rowId, column.id, { 
                                styles: { 
                                  ...column.styles, 
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
                              updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, gradientColors: gradientStr } });
                            } else {
                              const bpStyles = column.styles[activeBreakpoint] || {};
                              updateColumn(sectionId, rowId, column.id, { 
                                styles: { 
                                  ...column.styles, 
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
                                updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, gradientColors: gradientStr } });
                              } else {
                                const bpStyles = column.styles[activeBreakpoint] || {};
                                updateColumn(sectionId, rowId, column.id, { 
                                  styles: { 
                                    ...column.styles, 
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
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, gradientColors: gradientStr } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
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
            {getBreakpointStyles(column.styles).gradientType === 'linear' && (
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Angle (degrees)
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(column.styles).gradientAngle || '90deg'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, gradientAngle: e.target.value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
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
            {getBreakpointStyles(column.styles).gradientType === 'radial' && (
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Direction
                </label>
                <select
                  value={getBreakpointStyles(column.styles).gradientDirection || 'center'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, gradientDirection: e.target.value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
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
            {getBreakpointStyles(column.styles).gradientColors && (
              <div className="mt-4">
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </label>
                <div
                  className="w-full h-24 rounded-lg border-2 border-gray-200"
                  style={{
                    background: (() => {
                      const currentStyles = getBreakpointStyles(column.styles);
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

          {/* Scroll Animations */}
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
                value={getBreakpointStyles(column.styles).animationType || 'none'}
                onChange={(e) => {
                  const value = e.target.value as any;
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, animationType: value } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
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
            {getBreakpointStyles(column.styles).animationType && getBreakpointStyles(column.styles).animationType !== 'none' && (
              <>
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Duration (seconds)
                  </label>
                  <input
                    type="text"
                    value={getBreakpointStyles(column.styles).animationDuration || '1s'}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, animationDuration: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).animationDelay || '0s'}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, animationDelay: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                  id="col-parallax-enabled"
                  checked={getBreakpointStyles(column.styles).parallaxEnabled === true}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, parallaxEnabled: e.target.checked } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, parallaxEnabled: e.target.checked } 
                        } 
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="col-parallax-enabled" className="text-xs text-gray-700 cursor-pointer">Enable Parallax</label>
              </div>
            </div>

            {/* Parallax Speed */}
            {getBreakpointStyles(column.styles).parallaxEnabled && (
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Speed
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(column.styles).parallaxSpeed || '0.5'}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, parallaxSpeed: e.target.value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
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
                    borderWidth: getBreakpointStyles(column.styles).borderWidth || 
                      `${getBreakpointStyles(column.styles).borderTopWidth || '0px'} ${getBreakpointStyles(column.styles).borderRightWidth || '0px'} ${getBreakpointStyles(column.styles).borderBottomWidth || '0px'} ${getBreakpointStyles(column.styles).borderLeftWidth || '0px'}`,
                    borderStyle: getBreakpointStyles(column.styles).borderStyle || 'solid',
                    borderColor: getBreakpointStyles(column.styles).borderColor || '#000000',
                    borderRadius: getBreakpointStyles(column.styles).borderRadius || 
                      (getBreakpointStyles(column.styles).borderTopLeftRadius || getBreakpointStyles(column.styles).borderTopRightRadius || getBreakpointStyles(column.styles).borderBottomRightRadius || getBreakpointStyles(column.styles).borderBottomLeftRadius
                        ? `${getBreakpointStyles(column.styles).borderTopLeftRadius || '0px'} ${getBreakpointStyles(column.styles).borderTopRightRadius || '0px'} ${getBreakpointStyles(column.styles).borderBottomRightRadius || '0px'} ${getBreakpointStyles(column.styles).borderBottomLeftRadius || '0px'}`
                        : '0px'),
                    backgroundColor: getBreakpointStyles(column.styles).backgroundColor || '#ffffff',
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
                    value={getBreakpointStyles(column.styles).borderWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderWidth: e.target.value, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderWidth: e.target.value, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderWidth: val, borderTopWidth: undefined, borderRightWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).borderTopWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderTopWidth: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderTopWidth: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderTopWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderTopWidth: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).borderRightWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderRightWidth: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderRightWidth: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderRightWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderRightWidth: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).borderBottomWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderBottomWidth: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderBottomWidth: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderBottomWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderBottomWidth: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).borderLeftWidth || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderLeftWidth: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderLeftWidth: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderLeftWidth || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderLeftWidth: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                value={getBreakpointStyles(column.styles).borderStyle || 'solid'}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderStyle: e.target.value as any } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
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
                value={getBreakpointStyles(column.styles).borderColor || '#000000'}
                onChange={(color) => {
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderColor: color } });
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).borderRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderRadius: e.target.value, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderRadius: e.target.value, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderRadius: val, borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomRightRadius: undefined, borderBottomLeftRadius: undefined } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).borderTopLeftRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderTopLeftRadius: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderTopLeftRadius: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderTopLeftRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderTopLeftRadius: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).borderTopRightRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderTopRightRadius: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderTopRightRadius: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderTopRightRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderTopRightRadius: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                  <label className="block text-xs text-gray-500 mb-1">Bottom Right</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(column.styles).borderBottomRightRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderBottomRightRadius: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderBottomRightRadius: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderBottomRightRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderBottomRightRadius: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                  <label className="block text-xs text-gray-500 mb-1">Bottom Left</label>
                  <input
                    type="text"
                    value={getBreakpointStyles(column.styles).borderBottomLeftRadius || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderBottomLeftRadius: e.target.value } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, borderBottomLeftRadius: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).borderBottomLeftRadius || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, borderBottomLeftRadius: val } });
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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

          {/* Position & Z-Index */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Square className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Position & Z-Index {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                  <Square className="w-3.5 h-3.5" />
                  <span>Position {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                  <BreakpointBadge styles={column.styles} property="position" activeBreakpoint={activeBreakpoint} />
                </label>
                <select
                  value={getBreakpointStyles(column.styles).position || 'static'}
                  onChange={(e) => {
                    const value = e.target.value as 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, position: value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
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
              {getBreakpointStyles(column.styles).position && getBreakpointStyles(column.styles).position !== 'static' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                      Top {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}
                    </label>
                    <input
                      type="text"
                      value={getBreakpointStyles(column.styles).top || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, top: e.target.value } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
                              [activeBreakpoint]: { ...bpStyles, top: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          handleInputKeyDown(e);
                        } else {
                          handleNumberKeyDown(e, getBreakpointStyles(column.styles).top || '', (val) => {
                            if (activeBreakpoint === 'desktop') {
                              updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, top: val } });
                            } else {
                              const bpStyles = column.styles[activeBreakpoint] || {};
                              updateColumn(sectionId, rowId, column.id, { 
                                styles: { 
                                  ...column.styles, 
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
                      value={getBreakpointStyles(column.styles).right || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, right: e.target.value } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
                              [activeBreakpoint]: { ...bpStyles, right: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          handleInputKeyDown(e);
                        } else {
                          handleNumberKeyDown(e, getBreakpointStyles(column.styles).right || '', (val) => {
                            if (activeBreakpoint === 'desktop') {
                              updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, right: val } });
                            } else {
                              const bpStyles = column.styles[activeBreakpoint] || {};
                              updateColumn(sectionId, rowId, column.id, { 
                                styles: { 
                                  ...column.styles, 
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
                      value={getBreakpointStyles(column.styles).bottom || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, bottom: e.target.value } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
                              [activeBreakpoint]: { ...bpStyles, bottom: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          handleInputKeyDown(e);
                        } else {
                          handleNumberKeyDown(e, getBreakpointStyles(column.styles).bottom || '', (val) => {
                            if (activeBreakpoint === 'desktop') {
                              updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, bottom: val } });
                            } else {
                              const bpStyles = column.styles[activeBreakpoint] || {};
                              updateColumn(sectionId, rowId, column.id, { 
                                styles: { 
                                  ...column.styles, 
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
                      value={getBreakpointStyles(column.styles).left || ''}
                      onChange={(e) => {
                        if (activeBreakpoint === 'desktop') {
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, left: e.target.value } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
                              [activeBreakpoint]: { ...bpStyles, left: e.target.value } 
                            } 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          handleInputKeyDown(e);
                        } else {
                          handleNumberKeyDown(e, getBreakpointStyles(column.styles).left || '', (val) => {
                            if (activeBreakpoint === 'desktop') {
                              updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, left: val } });
                            } else {
                              const bpStyles = column.styles[activeBreakpoint] || {};
                              updateColumn(sectionId, rowId, column.id, { 
                                styles: { 
                                  ...column.styles, 
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
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Z-Index {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                  <BreakpointBadge styles={column.styles} property="zIndex" activeBreakpoint={activeBreakpoint} />
                </label>
                <input
                  type="text"
                  value={getBreakpointStyles(column.styles).zIndex || ''}
                  onChange={(e) => {
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, zIndex: e.target.value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, zIndex: e.target.value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, getBreakpointStyles(column.styles).zIndex || '', (val) => {
                        if (activeBreakpoint === 'desktop') {
                          updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, zIndex: val } });
                        } else {
                          const bpStyles = column.styles[activeBreakpoint] || {};
                          updateColumn(sectionId, rowId, column.id, { 
                            styles: { 
                              ...column.styles, 
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
                    boxShadow: getBreakpointStyles(column.styles).boxShadow || 
                      `${getBreakpointStyles(column.styles).boxShadowOffsetX || '0px'} ${getBreakpointStyles(column.styles).boxShadowOffsetY || '0px'} ${getBreakpointStyles(column.styles).boxShadowBlur || '0px'} ${getBreakpointStyles(column.styles).boxShadowSpread || '0px'} ${getBreakpointStyles(column.styles).boxShadowColor || 'rgba(0, 0, 0, 0.1)'}`,
                  }}
                />
              </div>
            </div>

            {/* Shadow Color */}
            <div className="mb-4">
              <ColorPicker
                value={getBreakpointStyles(column.styles).boxShadowColor || 'rgba(0, 0, 0, 0.1)'}
                onChange={(color) => {
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadowColor: color } }); 
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).boxShadowOffsetX || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadowOffsetX: e.target.value } }); 
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetX: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).boxShadowOffsetX || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadowOffsetX: val } }); 
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).boxShadowOffsetY || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadowOffsetY: e.target.value } }); 
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowOffsetY: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).boxShadowOffsetY || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadowOffsetY: val } }); 
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).boxShadowBlur || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadowBlur: e.target.value } }); 
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowBlur: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).boxShadowBlur || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadowBlur: val } }); 
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                    value={getBreakpointStyles(column.styles).boxShadowSpread || ''}
                    onChange={(e) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadowSpread: e.target.value } }); 
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
                            [activeBreakpoint]: { ...bpStyles, boxShadowSpread: e.target.value } 
                          } 
                        });
                      }
                    }}
                    onKeyDown={(e) => handleNumberKeyDown(e, getBreakpointStyles(column.styles).boxShadowSpread || '', (val) => {
                      if (activeBreakpoint === 'desktop') {
                        updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadowSpread: val } }); 
                      } else {
                        const bpStyles = column.styles[activeBreakpoint] || {};
                        updateColumn(sectionId, rowId, column.id, { 
                          styles: { 
                            ...column.styles, 
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
                value={getBreakpointStyles(column.styles).boxShadow || ''}
                onChange={(e) => {
                  if (activeBreakpoint === 'desktop') {
                    updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, boxShadow: e.target.value, boxShadowColor: undefined, boxShadowOffsetX: undefined, boxShadowOffsetY: undefined, boxShadowBlur: undefined, boxShadowSpread: undefined } }); 
                  } else {
                    const bpStyles = column.styles[activeBreakpoint] || {};
                    updateColumn(sectionId, rowId, column.id, { 
                      styles: { 
                        ...column.styles, 
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

          {/* Overflow Controls */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Overflow Controls {activeBreakpoint !== 'desktop' && `(${activeBreakpoint})`}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Overflow {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                  <BreakpointBadge styles={column.styles} property="overflow" activeBreakpoint={activeBreakpoint} />
                </label>
                <select
                  value={getBreakpointStyles(column.styles).overflow || 'visible'}
                  onChange={(e) => {
                    const value = e.target.value as 'visible' | 'hidden' | 'scroll' | 'auto';
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, overflow: value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, overflow: value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="scroll">Scroll</option>
                  <option value="auto">Auto</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Controls how content overflows the column</p>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5" />
                  <span>Overflow X {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                  <BreakpointBadge styles={column.styles} property="overflowX" activeBreakpoint={activeBreakpoint} />
                </label>
                <select
                  value={getBreakpointStyles(column.styles).overflowX || 'visible'}
                  onChange={(e) => {
                    const value = e.target.value as 'visible' | 'hidden' | 'scroll' | 'auto';
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, overflowX: value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, overflowX: value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="scroll">Scroll</option>
                  <option value="auto">Auto</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Horizontal overflow control</p>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5" />
                  <span>Overflow Y {activeBreakpoint !== 'desktop' && <span className="text-gray-500">({activeBreakpoint})</span>}</span>
                  <BreakpointBadge styles={column.styles} property="overflowY" activeBreakpoint={activeBreakpoint} />
                </label>
                <select
                  value={getBreakpointStyles(column.styles).overflowY || 'visible'}
                  onChange={(e) => {
                    const value = e.target.value as 'visible' | 'hidden' | 'scroll' | 'auto';
                    if (activeBreakpoint === 'desktop') {
                      updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, overflowY: value } });
                    } else {
                      const bpStyles = column.styles[activeBreakpoint] || {};
                      updateColumn(sectionId, rowId, column.id, { 
                        styles: { 
                          ...column.styles, 
                          [activeBreakpoint]: { ...bpStyles, overflowY: value } 
                        } 
                      });
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="scroll">Scroll</option>
                  <option value="auto">Auto</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Vertical overflow control</p>
              </div>
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
                value={column.customId || ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  updateColumn(sectionId, rowId, column.id, { customId: value || undefined });
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., hero-column, content-column"
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
                value={column.customClasses || ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  updateColumn(sectionId, rowId, column.id, { customClasses: value || undefined });
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., my-custom-class another-class"
              />
              <p className="text-xs text-gray-500 mt-1.5">Add custom CSS classes separated by spaces</p>
            </div>
          </div>

          {/* Spacing Controls */}
          <div className="border-t pt-4">
            <BoxSpacingControl
              label="Margin"
              styles={getBreakpointStyles(column.styles)}
              breakpoint={activeBreakpoint}
              onChange={(partialStyles) => {
                if (activeBreakpoint === 'desktop') {
                  updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, ...partialStyles } });
                } else {
                  const breakpointStyles = getBreakpointStyles(column.styles);
                  const updatedBreakpointStyles = { ...breakpointStyles, ...partialStyles };
                  updateColumn(sectionId, rowId, column.id, {
                    styles: {
                      ...column.styles,
                      [activeBreakpoint]: updatedBreakpointStyles,
                    },
                  });
                }
              }}
            />
            <BoxSpacingControl
              label="Padding"
              styles={getBreakpointStyles(column.styles)}
              breakpoint={activeBreakpoint}
              onChange={(partialStyles) => {
                if (activeBreakpoint === 'desktop') {
                  updateColumn(sectionId, rowId, column.id, { styles: { ...column.styles, ...partialStyles } });
                } else {
                  const breakpointStyles = getBreakpointStyles(column.styles);
                  const updatedBreakpointStyles = { ...breakpointStyles, ...partialStyles };
                  updateColumn(sectionId, rowId, column.id, {
                    styles: {
                      ...column.styles,
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

