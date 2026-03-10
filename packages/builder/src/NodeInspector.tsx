import React, { useState, useMemo } from "react";
import { useStudio } from "./store";
import { useTheme, type ThemeName, type FontName } from "@ui/blocks";
import SettingsSidebar from "./components/sidebar/SettingsSidebar";
import ThemeSelector from "./components/ui/ThemeSelector";
import CustomColorPicker from "./components/ui/CustomColorPicker";
import { handleNumberKeyDown, handleInputKeyDown } from "./utils/helpers";

export default function NodeInspector({ onHide }: { onHide?: () => void }) {
  const {
    sections,
    selectedElement,
    setSelectedElement,
    activeBreakpoint,
    builderMode,
    updateSection,
    updateRow,
    updateColumn,
    updateElement,
    updateCustomElementStyle,
    updateCustomElementProps,
    getCustomElementStyle,
    getCustomElementProps,
    getBreakpointStyles,
    addCustomElement,
    removeCustomElement,
    setTheme,
    theme,
    setFont,
    font,
    sidebarMode,
  } = useStudio();

  // Use theme hook - now safe (returns defaults if ThemeProvider not available)
  const { setTheme: setGlobalTheme, setFont: setGlobalFont } = useTheme();
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');

  // Extract projectId, pageId, and userId from URL
  const { projectId, pageId, userId } = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return {
        projectId: params.get('projectId') || '',
        pageId: params.get('pageId') || '',
        userId: params.get('userId') || localStorage.getItem('userId') || ''
      };
    }
    return { projectId: '', pageId: '', userId: '' };
  }, []);

  const handleThemeChange = (newTheme: ThemeName) => {
    setTheme(newTheme);
    setGlobalTheme(newTheme);
  };

  const handleFontChange = (newFont: FontName) => {
    setFont(newFont);
    setGlobalFont(newFont);
  };

  // CRITICAL: Single sidebar state management
  // sidebarMode === null → sidebar closed, render nothing
  if (sidebarMode === null) {
    return null;
  }

  // sidebarMode === 'elements' → show Elements List (via SettingsSidebar)
  // sidebarMode === 'settings' → show Settings Panel (via SettingsSidebar)
  // SettingsSidebar handles rendering the correct panel based on sidebarMode
  if (sidebarMode === 'elements' || sidebarMode === 'settings') {
    return (
      <SettingsSidebar
        sections={sections}
        selectedElement={selectedElement}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeBreakpoint={activeBreakpoint}
        builderMode={builderMode}
        updateSection={updateSection}
        updateRow={updateRow}
        updateColumn={updateColumn}
        updateElement={updateElement}
        updateCustomElementStyle={updateCustomElementStyle}
        updateCustomElementProps={updateCustomElementProps}
        getCustomElementStyle={getCustomElementStyle}
        getCustomElementProps={getCustomElementProps}
        getBreakpointStyles={getBreakpointStyles}
        addCustomElement={addCustomElement}
        removeCustomElement={removeCustomElement}
        handleInputKeyDown={handleInputKeyDown}
        handleNumberKeyDown={handleNumberKeyDown}
        projectId={projectId}
        pageId={pageId}
      />
    );
  }

  // Fallback: If no element is selected and sidebarMode is not set, show theme/font settings
  // This should rarely happen now, but kept for backward compatibility
  if (!selectedElement) {
    return (
      <div
        style={{
          width: '100%',
          background: 'white',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(to right, #f9fafb, #ffffff)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', margin: 0 }}>Settings</h2>
            {onHide && (
              <button
                onClick={onHide}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Select a section, row, column, or element to edit.</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: 0 }}>
          {projectId && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <ThemeSelector 
                  projectId={projectId} 
                  userId={userId}
                  onThemeChange={(newTheme) => {
                    const themeName = newTheme as ThemeName;
                    handleThemeChange(themeName);
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <CustomColorPicker 
                  projectId={projectId} 
                  userId={userId}
                  onSave={(colors) => {
                    console.log('[NodeInspector] Custom theme saved:', colors);
                    handleThemeChange('custom');
                  }}
                />
              </div>
            </>
          )}
          
          {!projectId && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Theme</h4>
              <select
                value={theme}
                onChange={(e) => {
                  const v = e.target.value as ThemeName;
                  handleThemeChange(v);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="crimson-jet">Crimson Jet</option>
                <option value="indigo-sand">Indigo Sand</option>
                <option value="saffron-charcoal">Saffron Charcoal</option>
                <option value="mint-slate">Mint Slate</option>
                <option value="marine-teal">Marine Teal</option>
                <option value="royal-plum">Royal Plum</option>
                <option value="electric-cobalt">Electric Cobalt</option>
                <option value="copper-forest">Copper Forest</option>
                <option value="ruby-night">Ruby Night</option>
                <option value="citrus-navy">Citrus Navy</option>
              </select>
            </div>
          )}

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Font Family</h4>
            <select
              value={font}
              onChange={(e) => {
                const v = e.target.value as FontName;
                handleFontChange(v);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="inter">Inter</option>
              <option value="roboto">Roboto</option>
              <option value="open-sans">Open Sans</option>
              <option value="poppins">Poppins</option>
              <option value="lato">Lato</option>
              <option value="montserrat">Montserrat</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  // Use SettingsSidebar for selected elements
  return (
      <SettingsSidebar
      sections={sections}
      selectedElement={selectedElement}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      activeBreakpoint={activeBreakpoint}
      builderMode={builderMode}
      updateSection={updateSection}
      updateRow={updateRow}
      updateColumn={updateColumn}
      updateElement={updateElement}
      updateCustomElementStyle={updateCustomElementStyle}
      updateCustomElementProps={updateCustomElementProps}
      getCustomElementStyle={getCustomElementStyle}
      getCustomElementProps={getCustomElementProps}
      getBreakpointStyles={getBreakpointStyles}
      addCustomElement={addCustomElement}
      removeCustomElement={removeCustomElement}
      handleInputKeyDown={handleInputKeyDown}
      handleNumberKeyDown={handleNumberKeyDown}
      projectId={projectId}
      pageId={pageId}
    />
  );
}
