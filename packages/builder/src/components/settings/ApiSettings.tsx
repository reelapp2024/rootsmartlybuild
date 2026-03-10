'use client';

import React from 'react';
import { Element } from '../../types/builder';
import { Link, RefreshCw, Zap, Settings } from 'lucide-react';

interface ApiSettingsProps {
  element: Element;
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
  sectionId: string;
  rowId: string;
  columnId: string;
}

export default function ApiSettings({
  element,
  updateElement,
  sectionId,
  rowId,
  columnId,
}: ApiSettingsProps) {
  const apiConfig = element.api || {};

  const updateApiConfig = (updates: Partial<Element['api']>) => {
    updateElement(sectionId, rowId, columnId, element.id, {
      api: {
        ...apiConfig,
        ...updates,
      },
    });
  };

  // Get default API URL based on element type
  const getDefaultApiUrl = () => {
    const baseUrl = 'http://localhost:1111/api/monorepo';
    switch (element.type) {
      case 'heading':
        return `${baseUrl}/heading-content`;
      case 'text':
        return `${baseUrl}/text-content`;
      case 'text':
        return `${baseUrl}/description-content`;
      case 'button':
        return `${baseUrl}/button-content`;
      default:
        return `${baseUrl}/element-content`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-700">API Configuration</h3>
      </div>

      {/* Enable API */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-700">Enable Dynamic Content</label>
          <p className="text-xs text-gray-500 mt-0.5">Fetch content from API</p>
        </div>
        <input
          type="checkbox"
          checked={apiConfig.enabled || false}
          onChange={(e) => updateApiConfig({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>

      {apiConfig.enabled && (
        <>
          {/* API URL */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              API URL
            </label>
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={apiConfig.url || getDefaultApiUrl()}
                onChange={(e) => updateApiConfig({ url: e.target.value })}
                placeholder={getDefaultApiUrl()}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">API endpoint to fetch content from</p>
          </div>

          {/* HTTP Method */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              HTTP Method
            </label>
            <select
              value={apiConfig.method || 'GET'}
              onChange={(e) => updateApiConfig({ method: e.target.value as 'GET' | 'POST' })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          {/* Data Path */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Data Path (Optional)
            </label>
            <input
              type="text"
              value={apiConfig.dataPath || ''}
              onChange={(e) => updateApiConfig({ dataPath: e.target.value })}
              placeholder="data.title or data.content"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">JSON path to extract data (e.g., "data.title")</p>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Auto Refresh Interval (ms)
            </label>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={apiConfig.refreshInterval || 0}
                onChange={(e) => updateApiConfig({ refreshInterval: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">0 = no auto-refresh, 5000 = refresh every 5 seconds</p>
          </div>

          {/* Fallback to Content */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">Fallback to Static Content</label>
              <p className="text-xs text-gray-500 mt-0.5">Use element content if API fails</p>
            </div>
            <input
              type="checkbox"
              checked={apiConfig.fallbackToContent !== false}
              onChange={(e) => updateApiConfig({ fallbackToContent: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>

          {/* API Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Settings className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900">API Response Format</p>
                <p className="text-xs text-blue-700 mt-1">
                  API should return JSON with fields matching element type:
                </p>
                <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                  <li>Heading: <code className="bg-blue-100 px-1 rounded">heading</code>, <code className="bg-blue-100 px-1 rounded">title</code>, or <code className="bg-blue-100 px-1 rounded">text</code></li>
                  <li>Text: <code className="bg-blue-100 px-1 rounded">text</code>, <code className="bg-blue-100 px-1 rounded">content</code>, or <code className="bg-blue-100 px-1 rounded">description</code></li>
                  <li>Description: <code className="bg-blue-100 px-1 rounded">description</code> or <code className="bg-blue-100 px-1 rounded">descriptionHtml</code></li>
                  <li>Button: <code className="bg-blue-100 px-1 rounded">buttonText</code>, <code className="bg-blue-100 px-1 rounded">text</code>, or <code className="bg-blue-100 px-1 rounded">label</code></li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


