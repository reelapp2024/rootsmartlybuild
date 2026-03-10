'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown, handleInputKeyDown } from '../../../utils/helpers';
import { Image as ImageIcon, Upload, Link as LinkIcon, FileText, Maximize2, Tablet, Smartphone, Move, Layers, Eye, Zap, Settings, Monitor, Minus, Square, AlignLeft, AlignCenter, AlignRight, Filter, Sparkles } from 'lucide-react';

interface ImageElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function ImageElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: ImageElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          {/* Image Source */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Image Source</h3>
            </div>
            
            <div className="space-y-4">
              {/* Image URL */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Image URL
                </label>
                <input
                  type="text"
                  value={element.content.imageUrlDesktop || element.content.imageUrl || ''}
                  onChange={(e) => {
                    // Update both for backward compatibility
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      content: { 
                        ...element.content, 
                        imageUrl: e.target.value,
                        imageUrlDesktop: e.target.value
                      } 
                    });
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1.5">Enter image URL or upload from your device</p>
              </div>

              {/* Divider with "OR" */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Image
                </label>
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                      <Upload className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Click to upload
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP (Max 10MB)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (limit to 10MB for images)
                        if (file.size > 10 * 1024 * 1024) {
                          alert('File size is too large. Please use an image smaller than 10MB or upload to a hosting service.');
                          return;
                        }
                        
                        // Check file type
                        if (!file.type.startsWith('image/')) {
                          alert('Please select a valid image file.');
                          return;
                        }
                        
                        // Create object URL for the image
                        const objectUrl = URL.createObjectURL(file);
                        updateElement(sectionId, rowId, columnId, element.id, { 
                          content: { 
                            ...element.content, 
                            imageUrl: objectUrl,
                            imageUrlDesktop: objectUrl
                          } 
                        });
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1.5">Default image (used for desktop and fallback)</p>
              </div>
            </div>
          </div>

          {/* Image Properties */}
          <div className="border-t pt-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Image Properties</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Alt Text
                </label>
                <input
                  type="text"
                  value={element.content.imageAlt || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, imageAlt: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the image for accessibility"
                />
                <p className="text-xs text-gray-500 mt-1.5">Important for SEO and accessibility</p>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Caption
                </label>
                <input
                  type="text"
                  value={element.content.imageCaption || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, imageCaption: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional image caption"
                />
                <p className="text-xs text-gray-500 mt-1.5">Optional caption text displayed below the image</p>
              </div>
            </div>
          </div>

          {/* Link Settings */}
          <div className="border-t pt-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Link Settings</h3>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5" />
                Image Link
              </label>
              <input
                type="text"
                value={element.content.imageLink || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, imageLink: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com (optional)"
              />
              <p className="text-xs text-gray-500 mt-1.5">Make image clickable by adding a link (leave empty to disable)</p>
            </div>
          </div>

          {/* Responsive Images */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Maximize2 className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Responsive Images</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">Set different images for different breakpoints. If not set, desktop image will be used.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Tablet className="w-3.5 h-3.5" />
                  Tablet Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={element.content.imageUrlTablet || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, imageUrlTablet: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to use desktop image"
                />
                <p className="text-xs text-gray-500 mt-1.5">Image URL for tablet devices</p>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={element.content.imageUrlMobile || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, imageUrlMobile: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to use desktop image"
                />
                <p className="text-xs text-gray-500 mt-1.5">Image URL for mobile devices</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Image Dimensions */}
          <div className="mb-4 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Maximize2 className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Image Dimensions</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  Aspect Ratio
                </label>
                <select
                  value={element.styles.imageAspectRatio || '16:9'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageAspectRatio: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="21:9">21:9 (Ultrawide)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="original">Original (No aspect ratio)</option>
                <option value="custom">Custom</option>
              </select>
              <p className="text-xs text-gray-500 mt-1.5">Maintain image proportions</p>
            </div>
            
            {/* Width and Height - Always visible for full flexibility */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Width
                </label>
                <input
                  type="text"
                  value={element.styles.imageWidth || element.styles.width || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageWidth: e.target.value, width: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageWidth || element.styles.width || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageWidth: val, width: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 100%, 800px, auto"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Height
                </label>
                <input
                  type="text"
                  value={element.styles.imageHeight || element.styles.height || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageHeight: e.target.value, height: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageHeight || element.styles.height || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageHeight: val, height: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., auto, 450px, 50%"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5" />
                  Min Width
                </label>
                <input
                  type="text"
                  value={element.styles.imageMinWidth || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageMinWidth: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageMinWidth || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageMinWidth: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 200px"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Max Width
                </label>
                <input
                  type="text"
                  value={element.styles.imageMaxWidth || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageMaxWidth: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageMaxWidth || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageMaxWidth: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1200px"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5" />
                  Min Height
                </label>
                <input
                  type="text"
                  value={element.styles.imageMinHeight || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageMinHeight: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageMinHeight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageMinHeight: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 200px"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Max Height
                </label>
                <input
                  type="text"
                  value={element.styles.imageMaxHeight || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageMaxHeight: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageMaxHeight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageMaxHeight: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 800px"
                />
              </div>
            </div>
            </div>
          </div>

          {/* Image Display */}
          <div className="mb-4 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Image Display</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Object Fit
                </label>
                <select
                  value={element.styles.imageObjectFit || 'cover'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageObjectFit: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fill">Fill</option>
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                  <option value="none">None</option>
                  <option value="scale-down">Scale Down</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">How the image should be resized to fit its container</p>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Object Position
                </label>
                <select
                  value={element.styles.imageObjectPosition || 'center'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageObjectPosition: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top left">Top Left</option>
                  <option value="top right">Top Right</option>
                  <option value="bottom left">Bottom Left</option>
                  <option value="bottom right">Bottom Right</option>
                  <option value="custom">Custom</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Position of the image within its container</p>
              </div>
              
              {element.styles.imageObjectPosition === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                      Position X
                    </label>
                    <input
                      type="text"
                      value={element.styles.imageObjectPositionX || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageObjectPositionX: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 50%, 20px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5" />
                      Position Y
                    </label>
                    <input
                      type="text"
                      value={element.styles.imageObjectPositionY || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageObjectPositionY: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 50%, 20px"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <AlignLeft className="w-3.5 h-3.5" />
                  Image Alignment
                </label>
                <select
                  value={element.styles.imageAlignment || 'left'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageAlignment: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="full">Full Width</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Horizontal alignment of the image</p>
              </div>
            </div>
          </div>

          {/* Image Styling */}
          <div className="mb-4 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Image Styling</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Opacity
                </label>
                <input
                  type="text"
                  value={element.styles.imageOpacity || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageOpacity: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageOpacity || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageOpacity: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1, 0.8, 0.5"
                />
                <p className="text-xs text-gray-500 mt-1.5">0 (transparent) to 1 (opaque)</p>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Grayscale
                </label>
                <input
                  type="text"
                  value={element.styles.imageFilterGrayscale || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterGrayscale: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageFilterGrayscale || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterGrayscale: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 0%, 50%, 100%"
                />
                <p className="text-xs text-gray-500 mt-1.5">0% (color) to 100% (grayscale)</p>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Blur
                </label>
                <input
                  type="text"
                  value={element.styles.imageFilterBlur || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterBlur: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageFilterBlur || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterBlur: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 0px, 5px, 10px"
                />
                <p className="text-xs text-gray-500 mt-1.5">Blur amount applied to the image</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Brightness
                  </label>
                  <input
                    type="text"
                    value={element.styles.imageFilterBrightness || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterBrightness: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.imageFilterBrightness || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterBrightness: val } }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 1, 1.2, 0.8"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Contrast
                  </label>
                  <input
                    type="text"
                    value={element.styles.imageFilterContrast || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterContrast: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.imageFilterContrast || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterContrast: val } }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 1, 1.5, 0.8"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Saturation
                </label>
                <input
                  type="text"
                  value={element.styles.imageFilterSaturate || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterSaturate: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageFilterSaturate || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageFilterSaturate: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1, 1.5, 0 (grayscale)"
                />
                <p className="text-xs text-gray-500 mt-1.5">1 (normal) to 0 (grayscale) or higher (more saturated)</p>
              </div>
            </div>
          </div>

          {/* Hover Effects */}
          <div className="mb-4 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Hover Effects</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Hover Opacity
                </label>
                <input
                  type="text"
                  value={element.styles.imageHoverOpacity || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageHoverOpacity: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageHoverOpacity || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageHoverOpacity: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 0.8, 0.9"
                />
                <p className="text-xs text-gray-500 mt-1.5">Opacity on hover (0 to 1)</p>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Hover Scale
                </label>
                <input
                  type="text"
                  value={element.styles.imageHoverScale || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageHoverScale: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.imageHoverScale || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageHoverScale: val } }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1.05, 1.1"
                />
                <p className="text-xs text-gray-500 mt-1.5">Scale factor on hover (1 = no change, 1.1 = 10% larger)</p>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Hover Filter
                </label>
                <input
                  type="text"
                  value={element.styles.imageHoverFilter || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageHoverFilter: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., brightness(1.2) contrast(1.1)"
                />
                <p className="text-xs text-gray-500 mt-1.5">CSS filter to apply on hover</p>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  Transition Duration
                </label>
                <input
                  type="text"
                  value={element.styles.imageTransitionDuration || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageTransitionDuration: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 0.3s, 500ms"
                />
                <p className="text-xs text-gray-500 mt-1.5">Duration for hover transitions</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <>
          {/* Performance */}
          <div className="mb-4 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Performance</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  Lazy Load
                </label>
                <input
                  type="checkbox"
                  checked={element.styles.imageLazyLoad || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageLazyLoad: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500">Load image only when it's about to enter viewport</p>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Placeholder URL
                </label>
                <input
                  type="text"
                  value={element.styles.imagePlaceholder || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imagePlaceholder: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/placeholder.jpg"
                />
                <p className="text-xs text-gray-500 mt-1.5">Low-quality placeholder image to show while loading</p>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Placeholder Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.styles.imagePlaceholderColor && element.styles.imagePlaceholderColor !== 'transparent' ? element.styles.imagePlaceholderColor : '#E5E7EB'}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imagePlaceholderColor: e.target.value } })}
                    className="flex-1 h-10 border border-gray-300 rounded-lg"
                    disabled={element.styles.imagePlaceholderColor === 'transparent'}
                  />
                  <button
                    onClick={() => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imagePlaceholderColor: element.styles.imagePlaceholderColor === 'transparent' ? '#E5E7EB' : 'transparent' } })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                      element.styles.imagePlaceholderColor === 'transparent'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {element.styles.imagePlaceholderColor === 'transparent' ? '✓' : 'T'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Background color while image loads</p>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Blur Placeholder
                </label>
                <input
                  type="checkbox"
                  checked={element.styles.imageBlurPlaceholder || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageBlurPlaceholder: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500">Apply blur effect to placeholder image</p>
            </div>
          </div>

          {/* Responsive Settings */}
          <div className="mb-4 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Responsive Settings</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">Override default settings for specific breakpoints</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-3.5 h-3.5 text-gray-600" />
                  <h4 className="text-xs font-semibold text-gray-700">Mobile</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      Width
                    </label>
                    <input
                      type="text"
                      value={element.styles.imageWidthMobile || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageWidthMobile: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 100%, 300px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      Height
                    </label>
                    <input
                      type="text"
                      value={element.styles.imageHeightMobile || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageHeightMobile: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., auto, 200px"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      Object Fit
                    </label>
                    <select
                      value={element.styles.imageObjectFitMobile || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageObjectFitMobile: e.target.value as any } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Use Default</option>
                      <option value="fill">Fill</option>
                      <option value="contain">Contain</option>
                      <option value="cover">Cover</option>
                      <option value="none">None</option>
                      <option value="scale-down">Scale Down</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <AlignLeft className="w-3 h-3" />
                      Alignment
                    </label>
                    <select
                      value={element.styles.imageAlignmentMobile || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageAlignmentMobile: e.target.value as any } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Use Default</option>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="full">Full Width</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tablet className="w-3.5 h-3.5 text-gray-600" />
                  <h4 className="text-xs font-semibold text-gray-700">Tablet</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      Width
                    </label>
                    <input
                      type="text"
                      value={element.styles.imageWidthTablet || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageWidthTablet: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 100%, 600px"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      Height
                    </label>
                    <input
                      type="text"
                      value={element.styles.imageHeightTablet || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageHeightTablet: e.target.value } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., auto, 400px"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      Object Fit
                    </label>
                    <select
                      value={element.styles.imageObjectFitTablet || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageObjectFitTablet: e.target.value as any } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Use Default</option>
                      <option value="fill">Fill</option>
                      <option value="contain">Contain</option>
                      <option value="cover">Cover</option>
                      <option value="none">None</option>
                      <option value="scale-down">Scale Down</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <AlignLeft className="w-3 h-3" />
                      Alignment
                    </label>
                    <select
                      value={element.styles.imageAlignmentTablet || ''}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageAlignmentTablet: e.target.value as any } })}
                      onKeyDown={handleInputKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Use Default</option>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="full">Full Width</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Overlay */}
          <div className="mb-4 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Image Overlay</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Overlay Text
                </label>
                <input
                  type="text"
                  value={element.styles.imageOverlayText || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageOverlayText: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional overlay text"
                />
                <p className="text-xs text-gray-500 mt-1.5">Text to display over the image</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Overlay Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={element.styles.imageOverlayColor && element.styles.imageOverlayColor !== 'transparent' ? element.styles.imageOverlayColor : '#000000'}
                      onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageOverlayColor: e.target.value } })}
                      className="flex-1 h-10 border border-gray-300 rounded-lg"
                      disabled={element.styles.imageOverlayColor === 'transparent'}
                    />
                    <button
                      onClick={() => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageOverlayColor: element.styles.imageOverlayColor === 'transparent' ? '#000000' : 'transparent' } })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                        element.styles.imageOverlayColor === 'transparent'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {element.styles.imageOverlayColor === 'transparent' ? '✓' : 'T'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Overlay Opacity
                  </label>
                  <input
                    type="text"
                    value={element.styles.imageOverlayOpacity || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageOverlayOpacity: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.imageOverlayOpacity || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageOverlayOpacity: val } }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 0.5, 0.8"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">0 (transparent) to 1 (opaque)</p>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" />
                  Overlay Position
                </label>
                <select
                  value={element.styles.imageOverlayPosition || 'center'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, imageOverlayPosition: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Vertical position of overlay text</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

