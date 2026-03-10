import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { colorThemes, getThemeByName, defaultTheme } from '../colors.js';
import CleaningHeader from '../components/CleaningHeader';
import CleaningFooter from '../components/CleaningFooter';
import { Check, Palette, Save, Settings, Eye } from 'lucide-react';

const CleaningColorPicker = () => {
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customThemes, setCustomThemes] = useState([]);
  const [editingTheme, setEditingTheme] = useState(null);
  const [customTheme, setCustomTheme] = useState({
    name: "New Custom Theme",
    elements: {
      heading: "#FFFFFF",
      description: "#F1D9DE",
      surface: "#1A0F12",
      overlay: { color: "rgba(24, 10, 12, 0.4)", blend: "multiply" },
      primaryButton: { bg: "#F43F5E", text: "#FFFFFF", hover: "#BE123C" },
      secondaryButton: { bg: "transparent", text: "#FFFFFF", border: "#FDA4AF", hover: "rgba(253,164,175,0.14)" },
      accent: "#F59E0B",
      gradient: { from: "#1A0F12", to: "#2A161A" },
      ring: "#FDA4AF",
      shadow: "rgba(0,0,0,0.44)"
    }
  });

  // Load saved theme and custom themes from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    const savedCustomThemes = localStorage.getItem('customThemes');
    
    if (savedCustomThemes) {
      setCustomThemes(JSON.parse(savedCustomThemes));
    }
    
    if (savedTheme) {
      if (savedTheme === 'Custom') {
        const customThemeData = localStorage.getItem('customTheme');
        if (customThemeData) {
          const parsedCustomTheme = JSON.parse(customThemeData);
          setSelectedTheme('Custom');
          setCurrentTheme(parsedCustomTheme);
        }
      } else if (colorThemes.find(theme => theme.name === savedTheme)) {
        setSelectedTheme(savedTheme);
        setCurrentTheme(getThemeByName(savedTheme));
      }
    }
  }, []);

  const handleThemeChange = (themeName) => {
    setSelectedTheme(themeName);
    setCurrentTheme(getThemeByName(themeName));
    localStorage.setItem('cleaningTheme', themeName);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: themeName }
    }));
  };

  const handleCustomColorChange = (colorType, value) => {
    setCustomTheme(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [colorType]: value
      }
    }));
  };

  const handleCustomButtonColorChange = (buttonType, colorType, value) => {
    setCustomTheme(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [buttonType]: {
          ...prev.elements[buttonType],
          [colorType]: value
        }
      }
    }));
  };

  const saveCustomTheme = () => {
    const newCustomThemes = [...customThemes, { ...customTheme, id: Date.now() }];
    setCustomThemes(newCustomThemes);
    localStorage.setItem('customThemes', JSON.stringify(newCustomThemes));
    
    // Apply the theme
    setSelectedTheme('Custom');
    setCurrentTheme(customTheme);
    localStorage.setItem('cleaningTheme', 'Custom');
    localStorage.setItem('customTheme', JSON.stringify(customTheme));
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: 'Custom', customTheme: customTheme }
    }));
    
    // Reset form
    setCustomTheme({
      name: "New Custom Theme",
      elements: {
        heading: "#FFFFFF",
        description: "#F1D9DE",
        surface: "#1A0F12",
        overlay: { color: "rgba(24, 10, 12, 0.4)", blend: "multiply" },
        primaryButton: { bg: "#F43F5E", text: "#FFFFFF", hover: "#BE123C" },
        secondaryButton: { bg: "transparent", text: "#FFFFFF", border: "#FDA4AF", hover: "rgba(253,164,175,0.14)" },
        accent: "#F59E0B",
        gradient: { from: "#1A0F12", to: "#2A161A" },
        ring: "#FDA4AF",
        shadow: "rgba(0,0,0,0.44)"
      }
    });
    setEditingTheme(null);
  };

  const editCustomTheme = (theme) => {
    setCustomTheme(theme);
    setEditingTheme(theme.id);
  };

  const updateCustomTheme = () => {
    const updatedThemes = customThemes.map(theme => 
      theme.id === editingTheme ? customTheme : theme
    );
    setCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
    
    // Apply the updated theme
    setSelectedTheme('Custom');
    setCurrentTheme(customTheme);
    localStorage.setItem('cleaningTheme', 'Custom');
    localStorage.setItem('customTheme', JSON.stringify(customTheme));
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: 'Custom', customTheme: customTheme }
    }));
    
    setEditingTheme(null);
  };

  const deleteCustomTheme = (themeId) => {
    const updatedThemes = customThemes.filter(theme => theme.id !== themeId);
    setCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
  };

  const applyCustomTheme = (theme) => {
    setSelectedTheme('Custom');
    setCurrentTheme(theme);
    localStorage.setItem('cleaningTheme', 'Custom');
    localStorage.setItem('customTheme', JSON.stringify(theme));
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: 'Custom', customTheme: theme }
    }));
  };

  const resetCustomTheme = () => {
    setCustomTheme({
      name: "New Custom Theme",
      elements: {
        heading: "#FFFFFF",
        description: "#F1D9DE",
        surface: "#1A0F12",
        overlay: { color: "rgba(24, 10, 12, 0.4)", blend: "multiply" },
        primaryButton: { bg: "#F43F5E", text: "#FFFFFF", hover: "#BE123C" },
        secondaryButton: { bg: "transparent", text: "#FFFFFF", border: "#FDA4AF", hover: "rgba(253,164,175,0.14)" },
        accent: "#F59E0B",
        gradient: { from: "#1A0F12", to: "#2A161A" },
        ring: "#FDA4AF",
        shadow: "rgba(0,0,0,0.44)"
      }
    });
    setEditingTheme(null);
  };


  return (
    <HelmetProvider>
      <div className="min-h-screen bg-gray-50">
        <CleaningHeader />
        
        {/* Admin Panel Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="w-8 h-8 text-gray-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Theme Settings</h1>
                  <p className="text-gray-600">Customize your website's appearance</p>
                </div>
              </div>
              
              {/* Simple Custom Colors Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCustomPicker(!showCustomPicker)}
                  style={{
                    background: '#3B82F6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = '#2563EB';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = '#3B82F6';
                  }}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  {showCustomPicker ? 'Hide Custom' : 'Custom Colors'}
                </button>
                <button
                  onClick={() => window.open('/', '_blank')}
                  style={{
                    background: '#6B7280',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = '#4B5563';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = '#6B7280';
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Custom Color Picker */}
        {showCustomPicker && (
          <section className="py-8 bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Custom Themes List */}
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Your Custom Themes</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage your saved custom themes</p>
                  </div>
                  
                  <div className="p-6">
                    {customThemes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Palette className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No custom themes yet</p>
                        <p className="text-sm">Create your first custom theme below</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customThemes.map((theme) => (
                          <div key={theme.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-8 h-8 rounded border"
                                style={{ background: `linear-gradient(135deg, ${theme.elements.surface}, ${theme.elements.gradient.to})` }}
                              ></div>
                              <div>
                                <h4 className="font-medium text-gray-800">{theme.name}</h4>
                                <div className="flex space-x-1">
                                  <div 
                                    className="w-3 h-3 rounded border"
                                    style={{ backgroundColor: theme.elements.primaryButton.bg }}
                                  ></div>
                                  <div 
                                    className="w-3 h-3 rounded border"
                                    style={{ backgroundColor: theme.elements.accent }}
                                  ></div>
                                  <div 
                                    className="w-3 h-3 rounded border"
                                    style={{ backgroundColor: theme.elements.ring }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => applyCustomTheme(theme)}
                                style={{
                                  background: '#2563EB',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.background = '#1D4ED8';
                                  target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.background = '#2563EB';
                                  target.style.transform = 'scale(1)';
                                }}
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => editCustomTheme(theme)}
                                style={{
                                  background: '#6B7280',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.background = '#4B5563';
                                  target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.background = '#6B7280';
                                  target.style.transform = 'scale(1)';
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteCustomTheme(theme.id)}
                                style={{
                                  background: '#DC2626',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.background = '#B91C1C';
                                  target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  const target = e.target as HTMLButtonElement;
                                  target.style.background = '#DC2626';
                                  target.style.transform = 'scale(1)';
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Create/Edit Custom Theme */}
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {editingTheme ? 'Edit Custom Theme' : 'Create New Theme'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {editingTheme ? 'Modify your custom theme colors' : 'Design your own color theme'}
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Theme Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme Name</label>
                        <input
                          type="text"
                          value={customTheme.name}
                          onChange={(e) => setCustomTheme(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter theme name"
                        />
                      </div>

                      {/* Color Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Heading</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={customTheme.elements.heading}
                              onChange={(e) => handleCustomColorChange('heading', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customTheme.elements.heading}
                              onChange={(e) => handleCustomColorChange('heading', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border rounded"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Description</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={customTheme.elements.description}
                              onChange={(e) => handleCustomColorChange('description', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customTheme.elements.description}
                              onChange={(e) => handleCustomColorChange('description', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border rounded"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Surface</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={customTheme.elements.surface}
                              onChange={(e) => handleCustomColorChange('surface', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customTheme.elements.surface}
                              onChange={(e) => handleCustomColorChange('surface', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border rounded"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Accent</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={customTheme.elements.accent}
                              onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customTheme.elements.accent}
                              onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border rounded"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Primary BG</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={customTheme.elements.primaryButton.bg}
                              onChange={(e) => handleCustomButtonColorChange('primaryButton', 'bg', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customTheme.elements.primaryButton.bg}
                              onChange={(e) => handleCustomButtonColorChange('primaryButton', 'bg', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border rounded"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Primary Text</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={customTheme.elements.primaryButton.text}
                              onChange={(e) => handleCustomButtonColorChange('primaryButton', 'text', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customTheme.elements.primaryButton.text}
                              onChange={(e) => handleCustomButtonColorChange('primaryButton', 'text', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border rounded"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Gradient From</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={customTheme.elements.gradient.from}
                              onChange={(e) => handleCustomColorChange('gradient', { ...customTheme.elements.gradient, from: e.target.value })}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customTheme.elements.gradient.from}
                              onChange={(e) => handleCustomColorChange('gradient', { ...customTheme.elements.gradient, from: e.target.value })}
                              className="flex-1 px-2 py-1 text-xs border rounded"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Gradient To</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={customTheme.elements.gradient.to}
                              onChange={(e) => handleCustomColorChange('gradient', { ...customTheme.elements.gradient, to: e.target.value })}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customTheme.elements.gradient.to}
                              onChange={(e) => handleCustomColorChange('gradient', { ...customTheme.elements.gradient, to: e.target.value })}
                              className="flex-1 px-2 py-1 text-xs border rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live Preview */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
                        <div 
                          className="rounded-lg p-4 text-white"
                          style={{
                            background: `linear-gradient(135deg, ${customTheme.elements.surface}, ${customTheme.elements.gradient.to})`
                          }}
                        >
                          <h5 className="text-lg font-bold mb-2" style={{ color: customTheme.elements.heading }}>
                            {customTheme.name}
                          </h5>
                          <p className="text-sm mb-4" style={{ color: customTheme.elements.description }}>
                            This is how your theme will look
                          </p>
                          <div className="flex gap-2">
                            <div 
                              className="px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: customTheme.elements.primaryButton.bg,
                                color: customTheme.elements.primaryButton.text
                              }}
                            >
                              Primary Button
                            </div>
                            <div 
                              className="px-3 py-1 rounded text-xs font-medium border"
                              style={{
                                backgroundColor: customTheme.elements.secondaryButton.bg,
                                color: customTheme.elements.secondaryButton.text,
                                borderColor: customTheme.elements.secondaryButton.border
                              }}
                            >
                              Secondary Button
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        {editingTheme ? (
                          <>
                            <button
                              onClick={updateCustomTheme}
                              style={{
                                background: '#059669',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: '1'
                              }}
                              onMouseEnter={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.background = '#047857';
                                target.style.transform = 'scale(1.02)';
                              }}
                              onMouseLeave={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.background = '#059669';
                                target.style.transform = 'scale(1)';
                              }}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Update Theme
                            </button>
                            <button
                              onClick={resetCustomTheme}
                              style={{
                                background: '#6B7280',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.background = '#4B5563';
                                target.style.transform = 'scale(1.02)';
                              }}
                              onMouseLeave={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.background = '#6B7280';
                                target.style.transform = 'scale(1)';
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={saveCustomTheme}
                              style={{
                                background: '#2563EB',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: '1'
                              }}
                              onMouseEnter={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.background = '#1D4ED8';
                                target.style.transform = 'scale(1.02)';
                              }}
                              onMouseLeave={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.background = '#2563EB';
                                target.style.transform = 'scale(1)';
                              }}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Theme
                            </button>
                            <button
                              onClick={resetCustomTheme}
                              style={{
                                background: '#6B7280',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.background = '#4B5563';
                                target.style.transform = 'scale(1.02)';
                              }}
                              onMouseLeave={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.background = '#6B7280';
                                target.style.transform = 'scale(1)';
                              }}
                            >
                              Reset
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Theme Selection */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Select Theme</h3>
                <p className="text-sm text-gray-600 mt-1">Choose from predefined themes or create custom colors</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {colorThemes.map((theme, index) => (
                    <div
                      key={theme.name}
                      className={`relative rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedTheme === theme.name 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleThemeChange(theme.name)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-800">{theme.name}</h4>
                          {selectedTheme === theme.name && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        
                        {/* Color Preview */}
                        <div 
                          className="rounded-lg p-3 text-white mb-3"
                          style={{
                            background: `linear-gradient(135deg, ${theme.elements.surface}, ${theme.elements.gradient.to})`
                          }}
                        >
                          <div className="text-sm font-medium mb-2" style={{ color: theme.elements.heading }}>
                            Sample Heading
                          </div>
                          <div className="text-xs mb-3" style={{ color: theme.elements.description }}>
                            Sample description text
                          </div>
                          
                          <div className="flex gap-2">
                            <div 
                              className="px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: theme.elements.primaryButton.bg,
                                color: theme.elements.primaryButton.text
                              }}
                            >
                              Primary
                            </div>
                            <div 
                              className="px-3 py-1 rounded text-xs font-medium border"
                              style={{
                                backgroundColor: theme.elements.secondaryButton.bg,
                                color: theme.elements.secondaryButton.text,
                                borderColor: theme.elements.secondaryButton.border
                              }}
                            >
                              Secondary
                            </div>
                          </div>
                        </div>
                        
                        {/* Color Palette */}
                        <div className="flex flex-wrap gap-1">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: theme.elements.surface }}
                            title="Surface"
                          ></div>
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: theme.elements.heading }}
                            title="Heading"
                          ></div>
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: theme.elements.primaryButton.bg }}
                            title="Primary"
                          ></div>
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: theme.elements.accent }}
                            title="Accent"
                          ></div>
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: theme.elements.ring }}
                            title="Ring"
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Current Theme Status */}
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-green-800">
                    Theme Applied Successfully
                  </h3>
                  <p className="text-green-700 mt-1">
                    <strong>{currentTheme.name}</strong> theme is now active across your entire website.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CleaningFooter />
      </div>
    </HelmetProvider>
  );
};

export default CleaningColorPicker;
