'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Save, X } from 'lucide-react';

interface CustomColorPickerProps {
  projectId: string;
  userId: string;
  onSave?: (colors: any) => void;
}

interface ColorScheme {
  heading: string;
  description: string;
  surface: string;
  overlay: { color: string; blend: string };
  primaryButton: { bg: string; text: string; hover: string };
  secondaryButton: { bg: string; text: string; border: string; hover: string };
  accent: string;
  gradient: { from: string; to: string };
  ring: string;
  shadow: string;
  badge: { text: string; background: string };
  trust: { text: string; dot1: string; dot2: string; dot3: string };
}

export default function CustomColorPicker({ projectId, userId, onSave }: CustomColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [colors, setColors] = useState<ColorScheme>({
    heading: '#000000',
    description: '#666666',
    surface: '#FFFFFF',
    overlay: { color: 'rgba(0,0,0,0)', blend: 'multiply' },
    primaryButton: { bg: '#000000', text: '#FFFFFF', hover: '#333333' },
    secondaryButton: { bg: 'transparent', text: '#000000', border: '#000000', hover: 'rgba(0,0,0,0.1)' },
    accent: '#000000',
    gradient: { from: '#FFFFFF', to: '#F0F0F0' },
    ring: '#000000',
    shadow: 'rgba(0,0,0,0.1)',
    badge: { text: '#000000', background: 'rgba(0,0,0,0.1)' },
    trust: { text: '#666666', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#F59E0B' }
  });
  const [loading, setLoading] = useState(false);

  // Load existing custom theme
  useEffect(() => {
    const loadCustomTheme = async () => {
      try {
        const apiUrl = (window as any).__API_URL__ || '';
        const response = await fetch(`${apiUrl}/getThemeSettings?projectId=${projectId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.customColors) {
            setColors(data.data.customColors);
          }
        }
      } catch (error) {
        console.error('[CustomColorPicker] Failed to load custom theme:', error);
      }
    };

    if (projectId && isOpen) {
      loadCustomTheme();
    }
  }, [projectId, isOpen]);

  const handleColorChange = (path: string[], value: string) => {
    setColors(prev => {
      const newColors = { ...prev };
      let current: any = newColors;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] = { ...current[path[i]] };
      }
      
      current[path[path.length - 1]] = value;
      return newColors;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const apiUrl = (window as any).__API_URL__ || '';
      const response = await fetch(`${apiUrl}/updateProjectTheme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          projectId,
          userId,
          theme: 'custom',
          customColors: colors
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[CustomColorPicker] Custom theme saved:', data);
        if (onSave) {
          onSave(colors);
        }
        setIsOpen(false);
        // Trigger theme reload
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'custom' } }));
      } else {
        console.error('[CustomColorPicker] Failed to save custom theme');
      }
    } catch (error) {
      console.error('[CustomColorPicker] Error saving custom theme:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
      >
        <Palette className="w-4 h-4" />
        Create Custom Theme
      </button>
    );
  }

  return (
    <div className="space-y-4 border-2 border-purple-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          Custom Color Theme
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {/* Text Colors */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Heading Color</label>
          <input
            type="color"
            value={colors.heading}
            onChange={(e) => handleColorChange(['heading'], e.target.value)}
            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description Color</label>
          <input
            type="color"
            value={colors.description}
            onChange={(e) => handleColorChange(['description'], e.target.value)}
            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Surface/Background Color</label>
          <input
            type="color"
            value={colors.surface}
            onChange={(e) => handleColorChange(['surface'], e.target.value)}
            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        {/* Primary Button */}
        <div className="border-t pt-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Primary Button</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Background</label>
              <input
                type="color"
                value={colors.primaryButton.bg}
                onChange={(e) => handleColorChange(['primaryButton', 'bg'], e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Text</label>
              <input
                type="color"
                value={colors.primaryButton.text}
                onChange={(e) => handleColorChange(['primaryButton', 'text'], e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hover</label>
              <input
                type="color"
                value={colors.primaryButton.hover}
                onChange={(e) => handleColorChange(['primaryButton', 'hover'], e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Secondary Button */}
        <div className="border-t pt-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Secondary Button</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Text</label>
              <input
                type="color"
                value={colors.secondaryButton.text}
                onChange={(e) => handleColorChange(['secondaryButton', 'text'], e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Border</label>
              <input
                type="color"
                value={colors.secondaryButton.border}
                onChange={(e) => handleColorChange(['secondaryButton', 'border'], e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Accent */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Accent Color</label>
          <input
            type="color"
            value={colors.accent}
            onChange={(e) => handleColorChange(['accent'], e.target.value)}
            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Custom Theme'}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}


