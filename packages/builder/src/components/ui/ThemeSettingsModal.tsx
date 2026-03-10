'use client';

import React, { useState, useEffect } from 'react';
import { X, Palette, Check, Settings } from 'lucide-react';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
  currentTheme?: string;
  onThemeChange?: (theme: string) => void;
}

// Preset themes matching packages/ui/src/index.ts
const PRESET_THEMES = [
  { id: 'crimson-jet', name: 'Crimson Jet', colors: { primary: '#E11D48', surface: '#0E1214', heading: '#F8FAFC' } },
  { id: 'indigo-sand', name: 'Indigo Sand', colors: { primary: '#4F46E5', surface: '#0F1222', heading: '#F8FAFC' } },
  { id: 'saffron-charcoal', name: 'Saffron Charcoal', colors: { primary: '#FDB022', surface: '#121212', heading: '#FFFFFF' } },
  { id: 'mint-slate', name: 'Mint Slate', colors: { primary: '#22C55E', surface: '#0B1412', heading: '#FFFFFF' } },
  { id: 'marine-teal', name: 'Marine Teal', colors: { primary: '#0EA5A4', surface: '#0B1720', heading: '#FFFFFF' } },
  { id: 'royal-plum', name: 'Royal Plum', colors: { primary: '#A855F7', surface: '#120C18', heading: '#FFFFFF' } },
  { id: 'electric-cobalt', name: 'Electric Cobalt', colors: { primary: '#2563EB', surface: '#0A1220', heading: '#F8FAFC' } },
  { id: 'copper-forest', name: 'Copper Forest', colors: { primary: '#D97706', surface: '#0D1512', heading: '#FFFFFF' } },
  { id: 'ruby-night', name: 'Ruby Night', colors: { primary: '#DC2626', surface: '#140A0D', heading: '#FFFFFF' } },
  { id: 'citrus-navy', name: 'Citrus Navy', colors: { primary: '#F59E0B', surface: '#0A1224', heading: '#FFFFFF' } },
];

interface CustomColorScheme {
  heading: string;
  description: string;
  surface: string;
  primaryButton: { bg: string; text: string; hover: string };
  secondaryButton: { bg: string; text: string; border: string; hover: string };
  accent: string;
  headingSizes?: { h1: string; h2: string; h3: string; h4: string; h5: string; h6: string };
  buttonSizes?: { small: string; medium: string; large: string; fontSize: string };
  textSizes?: { base: string; small: string; large: string; xl: string };
  fontFamily?: string;
}

export default function ThemeSettingsModal({
  isOpen,
  onClose,
  projectId,
  userId,
  currentTheme = 'crimson-jet',
  onThemeChange
}: ThemeSettingsModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme);
  const [showCustomColors, setShowCustomColors] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColorScheme>({
    heading: '#000000',
    description: '#666666',
    surface: '#FFFFFF',
    primaryButton: { bg: '#000000', text: '#FFFFFF', hover: '#333333' },
    secondaryButton: { bg: 'transparent', text: '#000000', border: '#000000', hover: 'rgba(0,0,0,0.1)' },
    accent: '#000000',
    headingSizes: { h1: '3rem', h2: '2.5rem', h3: '2rem', h4: '1.5rem', h5: '1.25rem', h6: '1rem' },
    buttonSizes: { small: '8px 16px', medium: '12px 24px', large: '16px 32px', fontSize: '1rem' },
    textSizes: { base: '1rem', small: '0.875rem', large: '1.125rem', xl: '1.25rem' },
    fontFamily: 'Inter, sans-serif'
  });
  
  const availableFonts = [
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans' },
    { value: 'Lato, sans-serif', label: 'Lato' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat' },
    { value: 'Playfair Display, serif', label: 'Playfair Display' },
    { value: 'Raleway, sans-serif', label: 'Raleway' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
    { value: 'Nunito, sans-serif', label: 'Nunito' },
    { value: 'Oswald, sans-serif', label: 'Oswald' },
    { value: 'Merriweather, serif', label: 'Merriweather' },
    { value: 'Source Sans Pro, sans-serif', label: 'Source Sans Pro' },
    { value: 'Ubuntu, sans-serif', label: 'Ubuntu' },
    { value: 'Dancing Script, cursive', label: 'Dancing Script' },
    { value: 'Pacifico, cursive', label: 'Pacifico' },
    { value: 'Comfortaa, sans-serif', label: 'Comfortaa' },
    { value: 'Bebas Neue, sans-serif', label: 'Bebas Neue' },
    { value: 'Crimson Text, serif', label: 'Crimson Text' },
  ];
  const [saving, setSaving] = useState(false);

  // Load current theme and custom colors
  useEffect(() => {
    if (isOpen && projectId) {
      loadThemeSettings();
    }
  }, [isOpen, projectId]);

  const loadThemeSettings = async () => {
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
        if (data.success && data.data) {
          const themeData = data.data;
          setSelectedTheme(themeData.theme || 'crimson-jet');
          
          if (themeData.theme === 'custom' && themeData.customColors) {
            setShowCustomColors(true);
            setCustomColors({
              ...customColors,
              ...themeData.customColors,
              headingSizes: themeData.customColors.headingSizes || customColors.headingSizes,
              buttonSizes: themeData.customColors.buttonSizes || customColors.buttonSizes,
              textSizes: themeData.customColors.textSizes || customColors.textSizes,
              fontFamily: themeData.defaultFont || themeData.customColors?.fontFamily || customColors.fontFamily
            });
          } else {
            setShowCustomColors(false);
            // Still load font/size settings for preset themes
            const defaultFont = themeData.defaultFont || themeData.customColors?.fontFamily || 'Inter, sans-serif';
            setCustomColors({
              ...customColors,
              headingSizes: themeData.customColors?.headingSizes || customColors.headingSizes,
              buttonSizes: themeData.customColors?.buttonSizes || customColors.buttonSizes,
              textSizes: themeData.customColors?.textSizes || customColors.textSizes,
              fontFamily: defaultFont
            });
          }
        }
      }
    } catch (error) {
      console.error('[ThemeSettingsModal] Failed to load theme:', error);
    }
  };

  const applyTheme = async (themeId: string, customColorsData?: CustomColorScheme) => {
    if (saving) return;
    
    setSaving(true);
    setSelectedTheme(themeId);

    try {
      const apiUrl = (window as any).__API_URL__ || '';
      const payload: any = {
        projectId,
        userId,
        theme: themeId
      };

      // Always include font/size settings for all themes (preset or custom)
      const fontSizeSettings = {
        headingSizes: customColorsData?.headingSizes || { h1: '3rem', h2: '2.5rem', h3: '2rem', h4: '1.5rem', h5: '1.25rem', h6: '1rem' },
        buttonSizes: customColorsData?.buttonSizes || { small: '8px 16px', medium: '12px 24px', large: '16px 32px', fontSize: '1rem' },
        textSizes: customColorsData?.textSizes || { base: '1rem', small: '0.875rem', large: '1.125rem', xl: '1.25rem' },
        fontFamily: customColorsData?.fontFamily || 'Inter, sans-serif'
      };
      
      if (themeId === 'custom' && customColorsData) {
        // Convert custom colors to full theme format
        payload.customColors = {
          heading: customColorsData.heading,
          description: customColorsData.description,
          surface: customColorsData.surface,
          overlay: { color: 'rgba(0,0,0,0)', blend: 'multiply' },
          primaryButton: customColorsData.primaryButton,
          secondaryButton: customColorsData.secondaryButton,
          accent: customColorsData.accent,
          gradient: { from: customColorsData.surface, to: customColorsData.surface },
          ring: customColorsData.accent,
          shadow: 'rgba(0,0,0,0.1)',
          badge: { text: customColorsData.heading, background: 'rgba(0,0,0,0.1)' },
          trust: { text: customColorsData.description, dot1: '#22C55E', dot2: '#3B82F6', dot3: '#F59E0B' },
          ...fontSizeSettings
        };
      } else {
        // For preset themes, save only font/size settings
        payload.customColors = fontSizeSettings;
      }
      
      // Add defaultStyles array for database (for all themes)
      payload.defaultStyles = [
        { tag: 'h1', fontSize: fontSizeSettings.headingSizes.h1 },
        { tag: 'h2', fontSize: fontSizeSettings.headingSizes.h2 },
        { tag: 'h3', fontSize: fontSizeSettings.headingSizes.h3 },
        { tag: 'h4', fontSize: fontSizeSettings.headingSizes.h4 },
        { tag: 'h5', fontSize: fontSizeSettings.headingSizes.h5 },
        { tag: 'h6', fontSize: fontSizeSettings.headingSizes.h6 },
        { tag: 'text-base', fontSize: fontSizeSettings.textSizes.base },
        { tag: 'text-small', fontSize: fontSizeSettings.textSizes.small },
        { tag: 'text-large', fontSize: fontSizeSettings.textSizes.large },
        { tag: 'text-xl', fontSize: fontSizeSettings.textSizes.xl }
      ];
      
      // Add defaultFont (separate key, not in defaultStyles)
      payload.defaultFont = customColorsData?.fontFamily || customColors.fontFamily || 'Inter, sans-serif';

      const response = await fetch(`${apiUrl}/updateProjectTheme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('[ThemeSettingsModal] Theme saved successfully, triggering reload');
        // Trigger theme reload in ThemeProvider - it will reload from API
        window.dispatchEvent(new CustomEvent('themeChanged', { 
          detail: { theme: themeId, customColors: payload.customColors, projectId: projectId } 
        }));
        
        // Also force a page reload of the theme styles by updating the style element
        // This ensures the webpage content inside builder gets updated
        if (typeof window !== 'undefined') {
          const styleElement = document.getElementById('theme-variables-style');
          if (styleElement) {
            // Remove and let ThemeProvider recreate it with new values
            styleElement.remove();
          }
        }
        
        if (onThemeChange) {
          onThemeChange(themeId);
        }
      } else {
        console.error('[ThemeSettingsModal] Failed to update theme');
      }
    } catch (error) {
      console.error('[ThemeSettingsModal] Error updating theme:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePresetThemeSelect = (themeId: string) => {
    setShowCustomColors(false);
    // Apply preset theme but keep current font/size settings
    const fontSizeOnly = {
      headingSizes: customColors.headingSizes,
      buttonSizes: customColors.buttonSizes,
      textSizes: customColors.textSizes,
      fontFamily: customColors.fontFamily
    };
    applyTheme(themeId, fontSizeOnly);
  };

  const handleCustomColorChange = (path: string[], value: string | any) => {
    const newColors = { ...customColors };
    let current: any = newColors;
    
    // If path is a single element and value is an object, replace the entire object
    if (path.length === 1 && typeof value === 'object') {
      (newColors as any)[path[0]] = value;
    } else {
      // Otherwise, navigate the path and set the value
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] = { ...current[path[i]] };
      }
      current[path[path.length - 1]] = value;
    }
    
    setCustomColors(newColors);
    
    // Apply instantly
    applyTheme('custom', newColors);
  };

  const handleCustomThemeToggle = () => {
    if (showCustomColors) {
      // Switch back to last preset
      applyTheme(selectedTheme === 'custom' ? 'crimson-jet' : selectedTheme);
      setShowCustomColors(false);
    } else {
      setShowCustomColors(true);
      applyTheme('custom', customColors);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f9fafb, #ffffff)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Palette className="w-6 h-6 text-purple-600" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
              Theme Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {!showCustomColors ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                  Preset Themes
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Select a preset theme to apply instantly to your website
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {PRESET_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handlePresetThemeSelect(theme.id)}
                      disabled={saving}
                      style={{
                        position: 'relative',
                        padding: '16px',
                        borderRadius: '8px',
                        border: selectedTheme === theme.id ? '2px solid #6366f1' : '2px solid #e5e7eb',
                        background: selectedTheme === theme.id ? '#eef2ff' : '#ffffff',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: saving ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!saving && selectedTheme !== theme.id) {
                          e.currentTarget.style.borderColor = '#c7d2fe';
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTheme !== theme.id) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              backgroundColor: theme.colors.primary,
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: '24px',
                              borderRadius: '4px',
                              backgroundColor: theme.colors.surface,
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                          />
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '2px',
                            backgroundColor: theme.colors.heading
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0, textAlign: 'left' }}>
                        {theme.name}
                      </p>
                      {selectedTheme === theme.id && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                          <Check className="w-4 h-4 text-indigo-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={handleCustomThemeToggle}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '2px dashed #c7d2fe',
                    background: 'linear-gradient(to right, #eef2ff, #f8fafc)',
                    color: '#6366f1',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#818cf8';
                    e.currentTarget.style.background = 'linear-gradient(to right, #e0e7ff, #eef2ff)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#c7d2fe';
                    e.currentTarget.style.background = 'linear-gradient(to right, #eef2ff, #f8fafc)';
                  }}
                >
                  <Settings className="w-5 h-5" />
                  Create Custom Theme
                </button>
              </div>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>
                  Custom Theme Colors
                </h3>
                <button
                  onClick={handleCustomThemeToggle}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Back to Presets
                </button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                    Heading Color
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customColors.heading}
                      onChange={(e) => handleCustomColorChange(['heading'], e.target.value)}
                      style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={customColors.heading}
                      onChange={(e) => handleCustomColorChange(['heading'], e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                    Description Color
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customColors.description}
                      onChange={(e) => handleCustomColorChange(['description'], e.target.value)}
                      style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={customColors.description}
                      onChange={(e) => handleCustomColorChange(['description'], e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                    Surface/Background Color
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customColors.surface}
                      onChange={(e) => handleCustomColorChange(['surface'], e.target.value)}
                      style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={customColors.surface}
                      onChange={(e) => handleCustomColorChange(['surface'], e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Primary Button</h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Background</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={customColors.primaryButton.bg}
                          onChange={(e) => handleCustomColorChange(['primaryButton', 'bg'], e.target.value)}
                          style={{ width: '50px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={customColors.primaryButton.bg}
                          onChange={(e) => handleCustomColorChange(['primaryButton', 'bg'], e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Text</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={customColors.primaryButton.text}
                          onChange={(e) => handleCustomColorChange(['primaryButton', 'text'], e.target.value)}
                          style={{ width: '50px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={customColors.primaryButton.text}
                          onChange={(e) => handleCustomColorChange(['primaryButton', 'text'], e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                    Accent Color
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customColors.accent}
                      onChange={(e) => handleCustomColorChange(['accent'], e.target.value)}
                      style={{ width: '60px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={customColors.accent}
                      onChange={(e) => handleCustomColorChange(['accent'], e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* Heading Font Sizes */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Heading Font Sizes</h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((tag) => (
                      <div key={tag}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                          {tag.toUpperCase()}
                        </label>
                        <input
                          type="text"
                          value={customColors.headingSizes?.[tag] || (tag === 'h1' ? '3rem' : tag === 'h2' ? '2.5rem' : tag === 'h3' ? '2rem' : tag === 'h4' ? '1.5rem' : tag === 'h5' ? '1.25rem' : '1rem')}
                          onChange={(e) => {
                            const newSizes = { ...(customColors.headingSizes || {}), [tag]: e.target.value };
                            handleCustomColorChange(['headingSizes'], newSizes);
                          }}
                          placeholder={tag === 'h1' ? '3rem' : tag === 'h2' ? '2.5rem' : tag === 'h3' ? '2rem' : tag === 'h4' ? '1.5rem' : tag === 'h5' ? '1.25rem' : '1rem'}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Button Sizes */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Button Sizes</h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Small Padding</label>
                      <input
                        type="text"
                        value={customColors.buttonSizes?.small || '8px 16px'}
                        onChange={(e) => {
                          const newSizes = { ...(customColors.buttonSizes || {}), small: e.target.value };
                          handleCustomColorChange(['buttonSizes'], newSizes);
                        }}
                        placeholder="8px 16px"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Medium Padding (Default)</label>
                      <input
                        type="text"
                        value={customColors.buttonSizes?.medium || '12px 24px'}
                        onChange={(e) => {
                          const newSizes = { ...(customColors.buttonSizes || {}), medium: e.target.value };
                          handleCustomColorChange(['buttonSizes'], newSizes);
                        }}
                        placeholder="12px 24px"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Large Padding</label>
                      <input
                        type="text"
                        value={customColors.buttonSizes?.large || '16px 32px'}
                        onChange={(e) => {
                          const newSizes = { ...(customColors.buttonSizes || {}), large: e.target.value };
                          handleCustomColorChange(['buttonSizes'], newSizes);
                        }}
                        placeholder="16px 32px"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Button Font Size</label>
                      <input
                        type="text"
                        value={customColors.buttonSizes?.fontSize || '1rem'}
                        onChange={(e) => {
                          const newSizes = { ...(customColors.buttonSizes || {}), fontSize: e.target.value };
                          handleCustomColorChange(['buttonSizes'], newSizes);
                        }}
                        placeholder="1rem"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Font Family Selection */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Default Site Font</h4>
                  <select
                    value={customColors.fontFamily || 'Inter, sans-serif'}
                    onChange={(e) => handleCustomColorChange(['fontFamily'], e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    {availableFonts.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Sizes */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Text Sizes</h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Base Text Size</label>
                      <input
                        type="text"
                        value={customColors.textSizes?.base || '1rem'}
                        onChange={(e) => {
                          const newSizes = { ...(customColors.textSizes || {}), base: e.target.value };
                          handleCustomColorChange(['textSizes'], newSizes);
                        }}
                        placeholder="1rem"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Small Text Size</label>
                      <input
                        type="text"
                        value={customColors.textSizes?.small || '0.875rem'}
                        onChange={(e) => {
                          const newSizes = { ...(customColors.textSizes || {}), small: e.target.value };
                          handleCustomColorChange(['textSizes'], newSizes);
                        }}
                        placeholder="0.875rem"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Large Text Size</label>
                      <input
                        type="text"
                        value={customColors.textSizes?.large || '1.125rem'}
                        onChange={(e) => {
                          const newSizes = { ...(customColors.textSizes || {}), large: e.target.value };
                          handleCustomColorChange(['textSizes'], newSizes);
                        }}
                        placeholder="1.125rem"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Extra Large Text Size</label>
                      <input
                        type="text"
                        value={customColors.textSizes?.xl || '1.25rem'}
                        onChange={(e) => {
                          const newSizes = { ...(customColors.textSizes || {}), xl: e.target.value };
                          handleCustomColorChange(['textSizes'], newSizes);
                        }}
                        placeholder="1.25rem"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, textAlign: 'center' }}>
            {saving ? 'Applying theme...' : 'Changes are applied instantly and saved automatically'}
          </p>
        </div>
      </div>
    </div>
  );
}


