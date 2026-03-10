'use client';

import React from 'react';
import { Element } from '../../../types/builder';
import { handleNumberKeyDown, handleInputKeyDown } from '../../../utils/helpers';

interface HtmlElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
}

export default function HtmlElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  updateElement,
}: HtmlElementSettingsProps) {
  return (
    <>
      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">HTML Code</label>
            <textarea
              value={element.content.htmlCodeDesktop || element.content.htmlCode || ''}
              onChange={(e) => {
                // Update both htmlCode and htmlCodeDesktop for backward compatibility
                updateElement(sectionId, rowId, columnId, element.id, { 
                  content: { 
                    ...element.content, 
                    htmlCode: e.target.value,
                    htmlCodeDesktop: e.target.value
                  } 
                });
              }}
              onKeyDown={handleInputKeyDown}
              className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
              rows={12}
              placeholder="<div>Enter your HTML code here...</div>"
            />
            <p className="text-xs text-gray-500 mt-1">
              Character count: {(element.content.htmlCodeDesktop || element.content.htmlCode || '').length}
              {' '}• This is the default HTML (used for desktop and fallback)
            </p>
          </div>

          {/* HTML Templates */}
          <div className="mb-3 border-t pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const buttonHtml = '<button style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Click Me</button>';
                  updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, htmlCode: buttonHtml, htmlCodeDesktop: buttonHtml } });
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Button
              </button>
              <button
                type="button"
                onClick={() => {
                  const cardHtml = '<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: white;"><h3 style="margin: 0 0 10px 0;">Card Title</h3><p style="margin: 0; color: #6b7280;">Card content goes here</p></div>';
                  updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, htmlCode: cardHtml, htmlCodeDesktop: cardHtml } });
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => {
                  const formHtml = '<form style="display: flex; flex-direction: column; gap: 10px;"><input type="text" placeholder="Name" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"><input type="email" placeholder="Email" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"><button type="submit" style="padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px;">Submit</button></form>';
                  updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, htmlCode: formHtml, htmlCodeDesktop: formHtml } });
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Form
              </button>
              <button
                type="button"
                onClick={() => {
                  const alertHtml = '<div style="padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;"><strong>Alert:</strong> This is an alert message</div>';
                  updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, htmlCode: alertHtml, htmlCodeDesktop: alertHtml } });
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Alert
              </button>
              <button
                type="button"
                onClick={() => {
                  const listHtml = '<ul style="list-style: disc; padding-left: 20px;"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
                  updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, htmlCode: listHtml, htmlCodeDesktop: listHtml } });
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                List
              </button>
              <button
                type="button"
                onClick={() => {
                  const tableHtml = '<table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #f3f4f6;"><th style="padding: 8px; border: 1px solid #d1d5db;">Header 1</th><th style="padding: 8px; border: 1px solid #d1d5db;">Header 2</th></tr></thead><tbody><tr><td style="padding: 8px; border: 1px solid #d1d5db;">Data 1</td><td style="padding: 8px; border: 1px solid #d1d5db;">Data 2</td></tr></tbody></table>';
                  updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, htmlCode: tableHtml, htmlCodeDesktop: tableHtml } });
                }}
                className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Table
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Click a template to insert HTML code</p>
          </div>

          {/* HTML File Upload */}
          <div className="mb-3 border-t pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload HTML File</label>
            <input
              type="file"
              accept=".html,.htm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Check file size (limit to 1MB for HTML files)
                  if (file.size > 1024 * 1024) {
                    alert('File size is too large. Please use a file smaller than 1MB.');
                    return;
                  }
                  
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const htmlContent = event.target?.result as string;
                    updateElement(sectionId, rowId, columnId, element.id, { 
                      content: { 
                        ...element.content, 
                        htmlCode: htmlContent,
                        htmlCodeDesktop: htmlContent
                      } 
                    });
                  };
                  reader.readAsText(file);
                }
              }}
              className="w-full p-2 border border-gray-300 rounded text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload .html or .htm file (Max 1MB)
            </p>
          </div>
        </>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <>
          {/* Container Settings */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Container Settings</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width</label>
                <input
                  type="text"
                  value={element.styles.htmlWidth || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlWidth: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.htmlWidth || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlWidth: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 100%, 800px, auto"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Height</label>
                <input
                  type="text"
                  value={element.styles.htmlHeight || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlHeight: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.htmlHeight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlHeight: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., auto, 400px"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Width</label>
                <input
                  type="text"
                  value={element.styles.htmlMinWidth || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlMinWidth: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.htmlMinWidth || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlMinWidth: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 300px"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Width</label>
                <input
                  type="text"
                  value={element.styles.htmlMaxWidth || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlMaxWidth: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.htmlMaxWidth || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlMaxWidth: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 1200px"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Height</label>
                <input
                  type="text"
                  value={element.styles.htmlMinHeight || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlMinHeight: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.htmlMinHeight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlMinHeight: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 200px"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Height</label>
                <input
                  type="text"
                  value={element.styles.htmlMaxHeight || ''}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlMaxHeight: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleInputKeyDown(e);
                    } else {
                      handleNumberKeyDown(e, element.styles.htmlMaxHeight || '', (val) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlMaxHeight: val } }));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., 800px"
                />
              </div>
            </div>
          </div>

          {/* Overflow Controls */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Overflow</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Overflow</label>
                <select
                  value={element.styles.htmlOverflow || 'visible'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlOverflow: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="scroll">Scroll</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Overflow X</label>
                <select
                  value={element.styles.htmlOverflowX || 'visible'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlOverflowX: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="scroll">Scroll</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Overflow Y</label>
                <select
                  value={element.styles.htmlOverflowY || 'visible'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlOverflowY: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="scroll">Scroll</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content Alignment */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Content Alignment</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Alignment</label>
                <select
                  value={element.styles.htmlAlignment || 'left'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlAlignment: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Vertical Alignment</label>
                <select
                  value={element.styles.htmlVerticalAlign || 'top'}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlVerticalAlign: e.target.value as any } })}
                  onKeyDown={handleInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <>
          {/* Responsive HTML */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Responsive HTML</h3>
            <p className="text-xs text-gray-500 mb-3">Set different HTML code for different breakpoints. If not set, desktop HTML will be used.</p>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Desktop HTML</label>
              <textarea
                value={element.content.htmlCodeDesktop || element.content.htmlCode || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, htmlCodeDesktop: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                rows={6}
                placeholder="Desktop HTML code..."
              />
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Tablet HTML (Optional)</label>
              <textarea
                value={element.content.htmlCodeTablet || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, htmlCodeTablet: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                rows={6}
                placeholder="Tablet HTML code (leave empty to use desktop)..."
              />
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Mobile HTML (Optional)</label>
              <textarea
                value={element.content.htmlCodeMobile || ''}
                onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { content: { ...element.content, htmlCodeMobile: e.target.value } })}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                rows={6}
                placeholder="Mobile HTML code (leave empty to use desktop)..."
              />
            </div>
          </div>

          {/* Security & Sanitization */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Security & Sanitization</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-gray-600">Sanitize HTML</label>
                  <p className="text-xs text-gray-500">Remove potentially dangerous HTML tags and attributes</p>
                </div>
                <input
                  type="checkbox"
                  checked={element.styles.htmlSanitize !== false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlSanitize: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-gray-600">Allow Scripts</label>
                  <p className="text-xs text-gray-500">Allow &lt;script&gt; tags to execute (use with caution)</p>
                </div>
                <input
                  type="checkbox"
                  checked={element.styles.htmlAllowScripts || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlAllowScripts: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-gray-600">Lazy Load</label>
                  <p className="text-xs text-gray-500">Load HTML content only when it enters viewport</p>
                </div>
                <input
                  type="checkbox"
                  checked={element.styles.htmlLazyLoad || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlLazyLoad: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-gray-600">Defer Scripts</label>
                  <p className="text-xs text-gray-500">Add defer attribute to script tags</p>
                </div>
                <input
                  type="checkbox"
                  checked={element.styles.htmlDeferScripts || false}
                  onChange={(e) => updateElement(sectionId, rowId, columnId, element.id, { styles: { ...element.styles, htmlDeferScripts: e.target.checked } })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}


