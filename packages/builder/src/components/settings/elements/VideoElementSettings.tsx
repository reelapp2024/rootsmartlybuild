'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown, handleInputKeyDown } from '../../../utils/helpers';

interface VideoElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function VideoElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: VideoElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Source Type</label>
            <select
              value={element.content.videoSourceType || 'youtube'}
              onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, videoSourceType: e.target.value as 'youtube' | 'vimeo' | 'direct' | 'custom' } })}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="direct">Direct Video URL (MP4, WebM, etc.)</option>
              <option value="custom">Custom Embed Code</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {element.content.videoSourceType === 'youtube' && 'Paste YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)'}
              {element.content.videoSourceType === 'vimeo' && 'Paste Vimeo video URL (e.g., https://vimeo.com/VIDEO_ID)'}
              {element.content.videoSourceType === 'direct' && 'Paste direct video URL (e.g., https://example.com/video.mp4)'}
              {element.content.videoSourceType === 'custom' && 'Paste custom iframe embed code'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {element.content.videoSourceType === 'custom' ? 'Custom Embed Code' : 'Video URL'}
            </label>
            {element.content.videoSourceType === 'custom' ? (
              <textarea
                value={element.content.videoUrl || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, videoUrl: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                rows={6}
                placeholder="<iframe src='...' ...></iframe>"
              />
            ) : (
              <>
                <input
                  type="text"
                  value={element.content.videoUrl || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, videoUrl: e.target.value } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                  placeholder={
                    element.content.videoSourceType === 'youtube' 
                      ? 'https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID'
                      : element.content.videoSourceType === 'vimeo'
                      ? 'https://vimeo.com/VIDEO_ID'
                      : 'https://example.com/video.mp4'
                  }
                />
                {element.content.videoSourceType === 'direct' && (
                  <div className="mb-2">
                    <label className="block text-xs text-gray-600 mb-1">Or Upload Video File</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Check file size (limit to 100MB for browser performance)
                          if (file.size > 100 * 1024 * 1024) {
                            alert('File size is too large. Please use a file smaller than 100MB or upload to a hosting service.');
                            return;
                          }
                          
                          // Create object URL for the video file
                          const objectUrl = URL.createObjectURL(file);
                          updateElement(sectionId, rowId, columnId, element.id, { 
                            content: { 
                              ...element.content, 
                              videoUrl: objectUrl 
                            } 
                          });
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload MP4, WebM, OGG, or other video formats (Max 100MB)
                    </p>
                  </div>
                )}
              </>
            )}
            {element.content.videoSourceType !== 'custom' && (
              <p className="text-xs text-gray-500 mt-1">
                {element.content.videoSourceType === 'youtube' && 'Supports both youtube.com/watch?v= and youtu.be/ formats'}
                {element.content.videoSourceType === 'vimeo' && 'Supports vimeo.com/VIDEO_ID format'}
                {element.content.videoSourceType === 'direct' && 'Supports MP4, WebM, OGG, and other video formats. You can paste a URL or upload a file.'}
              </p>
            )}
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Video Dimensions */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Video Dimensions</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Aspect Ratio</label>
              <select
                value={element.styles.videoAspectRatio || '16:9'}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoAspectRatio: e.target.value as any } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="21:9">21:9 (Ultrawide)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {element.styles.videoAspectRatio === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <input
                    type="text"
                    value={element.styles.videoWidth || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoWidth: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.videoWidth || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoWidth: val } }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., 100%, 800px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Height</label>
                  <input
                    type="text"
                    value={element.styles.videoHeight || ''}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoHeight: e.target.value } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleInputKeyDown(e);
                      } else {
                        handleNumberKeyDown(e, element.styles.videoHeight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoHeight: val } }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g., auto, 450px"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Video Player Controls */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Player Controls</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Autoplay</label>
                <input
                  type="checkbox"
                  checked={element.styles.videoAutoplay || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoAutoplay: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Loop</label>
                <input
                  type="checkbox"
                  checked={element.styles.videoLoop || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoLoop: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Muted</label>
                <input
                  type="checkbox"
                  checked={element.styles.videoMuted || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoMuted: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Show Controls</label>
                <input
                  type="checkbox"
                  checked={element.styles.videoControls !== false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoControls: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">Preload</label>
                <select
                  value={element.styles.videoPreload || 'metadata'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoPreload: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="none">None</option>
                  <option value="metadata">Metadata</option>
                  <option value="auto">Auto</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">When to start loading the video</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <>
          {/* Video Poster/Thumbnail */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Poster/Thumbnail</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Poster Image URL</label>
              <input
                type="text"
                value={element.styles.videoPoster || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoPoster: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="https://example.com/poster.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">Image shown before video loads (for direct videos only)</p>
            </div>
          </div>

          {/* Video Loading */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Loading</h3>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-gray-600">Lazy Load</label>
              <input
                type="checkbox"
                checked={element.styles.videoLazyLoad || false}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoLazyLoad: e.target.checked } })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500">Load video only when it's about to enter viewport</p>
          </div>

          {/* Video Overlay */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Overlay</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Overlay Text</label>
              <input
                type="text"
                value={element.styles.videoOverlayText || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoOverlayText: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Optional overlay text"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Overlay Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.styles.videoOverlayColor && element.styles.videoOverlayColor !== 'transparent' ? element.styles.videoOverlayColor : '#000000'}
                    onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoOverlayColor: e.target.value } })}
                    className="flex-1 h-10 border border-gray-300 rounded"
                    disabled={element.styles.videoOverlayColor === 'transparent'}
                  />
                  <button
                    onClick={() => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoOverlayColor: element.styles.videoOverlayColor === 'transparent' ? '#000000' : 'transparent' } })}
                    className={`px-3 py-2 rounded text-xs font-medium border ${
                      element.styles.videoOverlayColor === 'transparent'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {element.styles.videoOverlayColor === 'transparent' ? '✓' : 'T'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Overlay Opacity</label>
                <input
                  type="text"
                  value={element.styles.videoOverlayOpacity || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoOverlayOpacity: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.videoOverlayOpacity || '', (val) => {
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 1) {
                          updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoOverlayOpacity: val } });
                        }
                      }, 0.01, 0, 1);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="0.5"
                />
                <p className="text-xs text-gray-500 mt-1">0 to 1 (e.g., 0.5 = 50%)</p>
              </div>
            </div>
          </div>

          {/* Video Alignment */}
          <div className="mb-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Alignment</h3>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Video Alignment</label>
              <select
                value={element.styles.videoAlignment || 'center'}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, videoAlignment: e.target.value as any } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="full">Full Width</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">How the video is aligned within its container</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}


