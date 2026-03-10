'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

interface ThemeSelectorProps {
  projectId: string;
  userId: string;
  onThemeChange?: (theme: string) => void;
}

// Preset themes matching packages/ui/src/index.ts
const PRESET_THEMES = [
  { id: 'crimson-jet', name: 'Crimson Jet', colors: { primary: '#E11D48', surface: '#0E1214' } },
  { id: 'indigo-sand', name: 'Indigo Sand', colors: { primary: '#4F46E5', surface: '#0F1222' } },
  { id: 'saffron-charcoal', name: 'Saffron Charcoal', colors: { primary: '#FDB022', surface: '#121212' } },
  { id: 'mint-slate', name: 'Mint Slate', colors: { primary: '#22C55E', surface: '#0B1412' } },
  { id: 'marine-teal', name: 'Marine Teal', colors: { primary: '#0EA5A4', surface: '#0B1720' } },
  { id: 'royal-plum', name: 'Royal Plum', colors: { primary: '#A855F7', surface: '#120C18' } },
  { id: 'electric-cobalt', name: 'Electric Cobalt', colors: { primary: '#2563EB', surface: '#0A1220' } },
  { id: 'copper-forest', name: 'Copper Forest', colors: { primary: '#D97706', surface: '#0D1512' } },
  { id: 'ruby-night', name: 'Ruby Night', colors: { primary: '#DC2626', surface: '#140A0D' } },
  { id: 'citrus-navy', name: 'Citrus Navy', colors: { primary: '#F59E0B', surface: '#0A1224' } },
];

export default function ThemeSelector({ projectId, userId, onThemeChange }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('crimson-jet');
  const [loading, setLoading] = useState(false);

  // Load current theme from API
  useEffect(() => {
    const loadTheme = async () => {
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
          if (data.success && data.data?.theme) {
            setSelectedTheme(data.data.theme);
          }
        }
      } catch (error) {
        console.error('[ThemeSelector] Failed to load theme:', error);
      }
    };

    if (projectId) {
      loadTheme();
    }
  }, [projectId]);

  const handleThemeSelect = async (themeId: string) => {
    if (loading) return;
    
    setLoading(true);
    setSelectedTheme(themeId);

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
          theme: themeId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[ThemeSelector] Theme updated:', data);
        
        // Reload page to apply theme (or use a more elegant state update)
        if (onThemeChange) {
          onThemeChange(themeId);
        } else {
          // Apply theme via CSS variables immediately
          applyThemeToDocument(themeId);
        }
      } else {
        console.error('[ThemeSelector] Failed to update theme');
        // Revert selection on error
        const prevTheme = await fetch(`${apiUrl}/getThemeSettings?projectId=${projectId}`)
          .then(r => r.json())
          .then(d => d.data?.theme || 'crimson-jet');
        setSelectedTheme(prevTheme);
      }
    } catch (error) {
      console.error('[ThemeSelector] Error updating theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeToDocument = (themeId: string) => {
    // This will be handled by ThemeProvider, but we can trigger a reload
    // or update CSS variables directly here if needed
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeId } }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-800">Theme Colors</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {PRESET_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            disabled={loading}
            className={`
              relative p-3 rounded-lg border-2 transition-all
              ${selectedTheme === theme.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div 
                className="flex-1 h-6 rounded border border-gray-300"
                style={{ backgroundColor: theme.colors.surface }}
              />
            </div>
            <p className="text-xs font-medium text-gray-700 text-left">
              {theme.name}
            </p>
            {selectedTheme === theme.id && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-blue-600" />
              </div>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-xs text-gray-500 text-center">Updating theme...</p>
      )}
    </div>
  );
}


