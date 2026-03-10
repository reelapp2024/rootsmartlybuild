import React, { useMemo, useEffect, useRef, useState } from 'react';
import { ElementProperty, ElementPropertyGroup } from '../../elementProperties';
import ColorPicker from '../ui/ColorPicker';
import IconPicker from '../ui/IconPicker';
import TextRewriteModal from '../ui/TextRewriteModal';
import BoxSpacingControl from '../controls/BoxSpacingControl';
import AlignmentControl from '../controls/AlignmentControl';
import TypographyControl from '../controls/TypographyControl';
import { LayoutGrid, Columns, Sparkles } from 'lucide-react';
import { loadGoogleFont } from '@ui/utils/fontLoader';
import { useSearchParams } from 'react-router-dom';

interface ElementPropertyEditorProps {
  elementProperties: ElementPropertyGroup;
  currentProps: Record<string, any>;
  currentStyles: React.CSSProperties;
  activeTab: 'content' | 'style' | 'advanced';
  onPropsChange: (props: Record<string, any>) => void;
  onStylesChange: (styles: React.CSSProperties) => void;
  elId?: string; // Optional: element ID for context detection
  sectionId?: string; // Optional: section ID for context detection
  // For "Apply to all" functionality
  sections?: any[]; // All sections to search through
  updateCustomElementStyle?: (sectionId: string, elId: string, styles: React.CSSProperties) => void;
  getCustomElements?: (sectionId: string) => Array<{ id: string; type: string; elId: string; order: number; parentElId?: string }>;
  getCustomElementStyle?: (sectionId: string, elId: string) => React.CSSProperties; // To get current styles
  getCustomElementProps?: (sectionId: string, elId: string) => any; // To get current props for redistribution
  updateCustomElementProps?: (sectionId: string, elId: string, props: any) => void; // To update props for redistributed elements
  elementType?: string; // Current element type (heading, text, button, etc.)
  addCustomElement?: (sectionId: string, elementType: 'heading' | 'text' | 'button' | 'image' | 'video' | 'icon' | 'html' | 'container', elId: string, addAtFirst?: boolean, parentElId?: string) => void; // For creating flex structure children
  removeCustomElement?: (sectionId: string, elId: string) => void; // For removing children when rebuilding structure
}

export default function ElementPropertyEditor({
  elementProperties,
  currentProps,
  currentStyles,
  activeTab,
  onPropsChange,
  onStylesChange,
  elId,
  sectionId,
  sections = [],
  updateCustomElementStyle,
  getCustomElements,
  getCustomElementStyle,
  getCustomElementProps,
  updateCustomElementProps,
  elementType,
  addCustomElement,
  removeCustomElement,
}: ElementPropertyEditorProps) {
  // ============================================================
  // CRITICAL: ALL HOOKS MUST BE AT THE TOP - NO EXCEPTIONS
  // ============================================================
  // All hooks must execute unconditionally and in the same order every render
  
  // State hooks
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconPickerKey, setIconPickerKey] = useState<string>('');
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [rewritePropertyKey, setRewritePropertyKey] = useState<string>('');
  const [defaultFont, setDefaultFont] = useState<string>('Inter, sans-serif');
  
  // Router hooks
  const [searchParams] = useSearchParams();
  
  // Refs
  const fontStyleRef = useRef<HTMLStyleElement | null>(null);
  
  // Computed values from URL params (safe - no hooks)
  const projectId = searchParams.get('projectId') || undefined;
  const pageId = searchParams.get('pageId') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const activeBreakpoint = (searchParams.get('breakpoint') as 'desktop' | 'tablet' | 'mobile') || 'desktop';
  
  // Memoized values - MUST be at top level
  const supportsTypography = useMemo(() => {
    return Boolean(
      elementType &&
      [
        'heading',
        'text',
        'richText',
        'button',
        'link',
        'list',
        'icon',
        'badge',
        'label',
      ].includes(elementType)
    );
  }, [elementType]);
  
  const supportsAlignment = useMemo(() => {
    if (!elementType) return false;
    const alignmentElements = ['heading', 'text', 'button', 'image', 'icon', 'divider', 'video', 'link', 'badge', 'label'];
    return alignmentElements.includes(elementType);
  }, [elementType]);
  
  const isContainer = useMemo(() => {
    return elementProperties.elementId === 'container';
  }, [elementProperties.elementId]);
  
  const displayType = useMemo(() => {
    let dt = (currentStyles as any)?.display || 'flex';
    // SANITIZE: Force 'flex' for containers if display is 'block', 'box', or undefined
    if (isContainer && (dt === 'block' || dt === 'box' || dt === undefined)) {
      dt = 'flex';
    }
    return dt;
  }, [currentStyles, isContainer]);
  
  const properties = useMemo(() => {
    const allProperties = elementProperties.properties[activeTab] || [];
    
    if (!isContainer || activeTab !== 'style') {
      return allProperties;
    }
    
    return allProperties.filter((property) => {
      // Always show the display type selector
      if (property.key === 'display') {
        return true;
      }
      
      // Check if property should be shown based on display type
      if (property.showWhen) {
        if (Array.isArray(property.showWhen)) {
          return property.showWhen.includes(displayType);
        }
        return property.showWhen === displayType;
      }
      
      // Show properties that don't have showWhen condition
      return true;
    });
  }, [elementProperties, activeTab, isContainer, displayType]);
  
  // Effect hooks - MUST be at top level
  
  // Load default font from database on mount and when theme changes
  // CRITICAL: Theme font is ONLY for element resolution, NEVER applied globally
  useEffect(() => {
    const loadDefaultFont = async () => {
      if (!projectId || typeof window === 'undefined') {
        // Default fallback - do NOT read from CSS variables
        setDefaultFont('Inter, sans-serif');
        return;
      }
      
      try {
        const viteApiUrl = (window as any).__API_URL__ || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
        const apiUrl = viteApiUrl || 'https://apis.smartlybuild.dev/admin/v1';
        const fullApiUrl = apiUrl.includes('/admin/v1') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/admin/v1`;
        
        const response = await fetch(`${fullApiUrl}/getThemeSettings?projectId=${projectId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const themeSettings = data.data;
            // Get font from defaultFont (separate key) or fallback to customColors.fontFamily
            const dbFont = themeSettings.defaultFont || themeSettings.customColors?.fontFamily;
            if (dbFont) {
              setDefaultFont(dbFont);
              // DO NOT set CSS variables - theme font is resolved at render time only
            } else {
              setDefaultFont('Inter, sans-serif');
            }
          }
        }
      } catch (error) {
        console.error('[ElementPropertyEditor] Failed to load default font:', error);
        setDefaultFont('Inter, sans-serif');
      }
    };
    
    // Load immediately
    loadDefaultFont();
    
    // Listen for theme changes
    const handleThemeChange = () => {
      setTimeout(() => {
        loadDefaultFont();
      }, 200); // Delay to ensure theme is fully loaded
    };
    
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, [projectId]);
  
  useEffect(() => {
    // Create or get style element for font dropdown previews
    if (!fontStyleRef.current && typeof window !== 'undefined') {
      fontStyleRef.current = document.createElement('style');
      fontStyleRef.current.id = 'font-dropdown-previews';
      document.head.appendChild(fontStyleRef.current);
    }
    
    // Load all fonts and create preview styles
    if (fontStyleRef.current) {
      const allFonts = [
        { value: 'Arial, sans-serif', name: 'Arial' },
        { value: 'Helvetica, sans-serif', name: 'Helvetica' },
        { value: 'Georgia, serif', name: 'Georgia' },
        { value: 'Times New Roman, serif', name: 'Times New Roman' },
        { value: 'Verdana, sans-serif', name: 'Verdana' },
        { value: 'Courier New, monospace', name: 'Courier New' },
        { value: 'Roboto, sans-serif', name: 'Roboto' },
        { value: 'Open Sans, sans-serif', name: 'Open Sans' },
        { value: 'Lato, sans-serif', name: 'Lato' },
        { value: 'Montserrat, sans-serif', name: 'Montserrat' },
        { value: 'Playfair Display, serif', name: 'Playfair Display' },
        { value: 'Raleway, sans-serif', name: 'Raleway' },
        { value: 'Poppins, sans-serif', name: 'Poppins' },
        { value: 'Inter, sans-serif', name: 'Inter' },
        { value: 'Nunito, sans-serif', name: 'Nunito' },
        { value: 'Oswald, sans-serif', name: 'Oswald' },
        { value: 'Merriweather, serif', name: 'Merriweather' },
        { value: 'Source Sans Pro, sans-serif', name: 'Source Sans Pro' },
        { value: 'Ubuntu, sans-serif', name: 'Ubuntu' },
        { value: 'Dancing Script, cursive', name: 'Dancing Script' },
        { value: 'Pacifico, cursive', name: 'Pacifico' },
        { value: 'Comfortaa, sans-serif', name: 'Comfortaa' },
        { value: 'Bebas Neue, sans-serif', name: 'Bebas Neue' },
        { value: 'Crimson Text, serif', name: 'Crimson Text' },
      ];
      
      // Load all fonts
      allFonts.forEach(font => {
        loadGoogleFont(font.value);
      });
      
      // Create CSS for font previews in dropdown options and select element
      const cssRules = allFonts.map(font => {
        // Escape special characters in font value for CSS selector
        const escapedValue = font.value.replace(/"/g, '\\"').replace(/'/g, "\\'");
        return `option[value="${escapedValue}"] { font-family: ${font.value} !important; }`;
      }).join('\n');
      
      // Also add rule for select elements with font-family style attribute
      const selectRule = `select[style*="font-family"] { font-family: inherit !important; }`;
      
      fontStyleRef.current.textContent = cssRules + '\n' + selectRule;
    }
    
    return () => {
      // Cleanup on unmount
      if (fontStyleRef.current && fontStyleRef.current.parentNode) {
        fontStyleRef.current.parentNode.removeChild(fontStyleRef.current);
        fontStyleRef.current = null;
      }
    };
  }, []);

  const handlePropertyChange = (key: string, value: any) => {
    onPropsChange({ ...currentProps, [key]: value });
  };

  const handleStyleChange = (key: string, value: any) => {
    // If fontFamily is being changed, load the font immediately
    if (key === 'fontFamily' || key === 'headingFontFamily') {
      const fontFamily = value || '';
      if (fontFamily && fontFamily.trim() !== '') {
        // Load font immediately when changed
        loadGoogleFont(fontFamily);
      }
    }
    
    // Debug logging for alignment properties
    if (key === 'justifyContent' || key === 'alignItems') {
      console.log(`[ElementPropertyEditor] Setting ${key} to:`, value, {
        currentStyles,
        newValue: { ...currentStyles, [key]: value }
      });
    }
    
    onStylesChange({ ...currentStyles, [key]: value });
  };

  const renderPropertyInput = (property: ElementProperty) => {
    // Get the actual value from database/backend
    // Only use defaultValue if the property is truly not set (undefined or not in object)
    let value: any;
    if (property.category === 'style') {
      // Map heading-specific keys to their CSS equivalents for lookup
      // e.g., headingTextAlign -> textAlign, headingFontSize -> fontSize
      let lookupKey = property.key;
      if (property.key === 'headingTextAlign') lookupKey = 'textAlign';
      else if (property.key === 'headingFontSize') lookupKey = 'fontSize';
      else if (property.key === 'headingFontWeight') lookupKey = 'fontWeight';
      else if (property.key === 'headingLineHeight') lookupKey = 'lineHeight';
      else if (property.key === 'headingLetterSpacing') lookupKey = 'letterSpacing';
      else if (property.key === 'headingTextTransform') lookupKey = 'textTransform';
      else if (property.key === 'headingTextDecoration') lookupKey = 'textDecoration';
      else if (property.key === 'headingFontFamily') lookupKey = 'fontFamily';
      else if (property.key === 'textColor') lookupKey = 'color';
      
      // Try both the original key and the mapped key
      // Use the mapped key first (e.g., textAlign for headingTextAlign), then fall back to original key
      // Check if property exists in currentStyles using 'in' operator (handles empty string, null, 0, false correctly)
      const hasMappedKey = currentStyles && lookupKey in currentStyles;
      const hasOriginalKey = currentStyles && property.key in currentStyles;
      
      let styleValue: any;
      if (hasMappedKey) {
        styleValue = (currentStyles as any)[lookupKey];
      } else if (hasOriginalKey) {
        styleValue = (currentStyles as any)[property.key];
      } else {
        styleValue = undefined;
      }
      
      // Debug logging disabled for performance
      // if (property.key === 'textAlign' || property.key === 'headingTextAlign') {
      //   console.log(`[ElementPropertyEditor] ${property.key} value lookup:`, {
      //     propertyKey: property.key,
      //     lookupKey,
      //     currentStylesKeys: currentStyles ? Object.keys(currentStyles) : [],
      //     currentStyles,
      //     hasMappedKey,
      //     hasOriginalKey,
      //     mappedValue: hasMappedKey ? (currentStyles as any)[lookupKey] : undefined,
      //     originalValue: hasOriginalKey ? (currentStyles as any)[property.key] : undefined,
      //     styleValue,
      //     defaultValue: property.defaultValue,
      //     finalValue: styleValue !== undefined ? styleValue : (property.defaultValue ?? '')
      //   });
      // }
      
      // If property exists in DB (even as empty string, null, 0, or false), use it; otherwise use default
      value = styleValue !== undefined ? styleValue : (property.defaultValue ?? '');
    } else {
      const propValue = currentProps[property.key];
      // Check if property exists in currentProps (even if it's empty string, null, 0, or false)
      const hasValue = property.key in (currentProps || {});
      value = hasValue ? propValue : (property.defaultValue ?? '');
    }

    switch (property.type) {
      case 'text':
      case 'url':
        // Check if this is a text content field
        const isTextContentField = property.category === 'content' && 
          (property.key === 'text' || property.key === 'heading' || property.key === 'description' || property.key === 'buttonText');
        
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              if (property.category === 'style') {
                handleStyleChange(property.key, e.target.value);
              } else {
                handlePropertyChange(property.key, e.target.value);
              }
            }}
            placeholder={property.placeholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isTextContentField && (
                <button
                  type="button"
                  onClick={() => {
                    setRewritePropertyKey(property.key);
                    setRewriteModalOpen(true);
                  }}
                  className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1.5"
                  title="Rewrite text with AI"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Rewrite</span>
                </button>
              )}
            </div>
            {isTextContentField && value && (
              <p className="text-xs text-gray-500">
                Word count: {value.trim().split(/\s+/).filter(word => word.length > 0).length} words
              </p>
            )}
          </div>
        );

      case 'textarea':
        // Check if this is a text content field (text, heading text, description, etc.)
        const isTextContent = property.category === 'content' && 
          (property.key === 'text' || property.key === 'heading' || property.key === 'description' || property.key === 'buttonText');
        
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
          <textarea
            value={value}
            onChange={(e) => {
              if (property.category === 'style') {
                handleStyleChange(property.key, e.target.value);
              } else {
                handlePropertyChange(property.key, e.target.value);
              }
            }}
            placeholder={property.placeholder}
            rows={4}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isTextContent && (
                <button
                  type="button"
                  onClick={() => {
                    setRewritePropertyKey(property.key);
                    setRewriteModalOpen(true);
                  }}
                  className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1.5 self-start"
                  title="Rewrite text with AI"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Rewrite</span>
                </button>
              )}
            </div>
            {isTextContent && value && (
              <p className="text-xs text-gray-500">
                Word count: {value.trim().split(/\s+/).filter(word => word.length > 0).length} words
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const numValue = parseFloat(e.target.value) || 0;
              if (property.category === 'style') {
                handleStyleChange(property.key, numValue);
              } else {
                handlePropertyChange(property.key, numValue);
              }
            }}
            min={property.min}
            max={property.max}
            step={property.step}
            placeholder={property.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'color':
        const handleColorChange = (newColor: string) => {
          if (property.category === 'style') {
            handleStyleChange(property.key, newColor);
          } else {
            handlePropertyChange(property.key, newColor);
          }
        };
        
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value ?? '#000000'}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
            <input
              type="text"
              value={value ?? ''}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder={property.placeholder}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'toggle':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value !== undefined ? value : (property.defaultValue ?? false)}
              onChange={(e) => {
                if (property.category === 'style') {
                  handleStyleChange(property.key, e.target.checked);
                } else {
                  handlePropertyChange(property.key, e.target.checked);
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{property.label}</span>
          </label>
        );

      case 'select':
        // Check if this is a font family selector
        const isFontSelector = property.key === 'fontFamily' || property.key === 'headingFontFamily';
        
        // SANITIZE: For container.display, ensure value is only 'flex' or 'grid'
        // If value is 'block', 'box', or not in options, force to 'flex'
        // NOTE: Only containers can switch between flex/grid. Sections are always block-level.
        if (isContainer && property.key === 'display') {
          const validValues = property.options?.map(opt => opt.value) || [];
          if (!validValues.includes(value) || value === 'block' || value === 'box') {
            value = 'flex'; // Force to flex if invalid
          }
        }
        
        // TODO: Add explicit grid layout controls for containers when display === 'grid'
        // Grid properties to add:
        // - gridTemplateColumns (e.g., "1fr 1fr", "repeat(3, 1fr)", "auto-fit")
        // - rowGap (spacing between rows)
        // - columnGap (spacing between columns)
        // - alignItems (grid item alignment)
        // - justifyItems (grid item justification)
        // These should only appear when container.display === 'grid'
        
        // Extract clean font name (remove quotes, get first font family)
        const getFontDisplayName = (fontString: string) => {
          if (!fontString) return 'Inter';
          // Remove quotes if present
          const cleaned = fontString.replace(/['"]/g, '');
          // Get first font family name (before comma)
          const firstFont = cleaned.split(',')[0].trim();
          // Remove any remaining quotes
          return firstFont.replace(/['"]/g, '') || 'Inter';
        };
        
        return (
          <select
            value={value ?? ''}
            onChange={(e) => {
              if (property.category === 'style') {
                handleStyleChange(property.key, e.target.value);
              } else {
                handlePropertyChange(property.key, e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            style={isFontSelector && value ? { fontFamily: value } : undefined}
          >
            {property.options?.map((option) => {
              // For font selectors, apply font to each option (CSS injection handles !important)
              const optionStyle = isFontSelector && option.value 
                ? { fontFamily: option.value } 
                : undefined;
              
              return (
                <option 
                  key={option.value} 
                  value={option.value}
                  style={optionStyle}
                >
                {option.label}
              </option>
              );
            })}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => {
                if (property.category === 'style') {
                  handleStyleChange(property.key, e.target.checked);
                } else {
                  handlePropertyChange(property.key, e.target.checked);
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable</span>
          </label>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              value={value ?? 0}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value);
                if (property.category === 'style') {
                  handleStyleChange(property.key, numValue);
                } else {
                  handlePropertyChange(property.key, numValue);
                }
              }}
              min={property.min}
              max={property.max}
              step={property.step}
              className="w-full"
            />
            <div className="text-sm text-gray-600 text-center">
              {value ?? 0}
            </div>
          </div>
        );

      case 'icon':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              if (property.category === 'style') {
                handleStyleChange(property.key, e.target.value);
              } else {
                handlePropertyChange(property.key, e.target.value);
              }
            }}
            placeholder={property.placeholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  setIconPickerKey(property.key);
                  setIconPickerOpen(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Browse
              </button>
            </div>
            {value && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <i 
                  className={`${value} icon-preview`}
                  style={{ fontSize: '1.5rem' }}
                ></i>
                <code className="text-xs text-gray-600">{value}</code>
              </div>
            )}
            {iconPickerOpen && iconPickerKey === property.key && (
              <IconPicker
                value={value}
                onChange={(newValue) => {
                  if (property.category === 'style') {
                    handleStyleChange(property.key, newValue);
                  } else {
                    handlePropertyChange(property.key, newValue);
                  }
                  setIconPickerOpen(false);
                }}
                onClose={() => setIconPickerOpen(false)}
              />
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => {
              if (property.category === 'style') {
                handleStyleChange(property.key, e.target.value);
              } else {
                handlePropertyChange(property.key, e.target.value);
              }
            }}
            placeholder={property.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  // Render container type selector with icons
  const renderContainerTypeSelector = () => {
    if (!isContainer || activeTab !== 'style') return null;
    
    // ONLY flex and grid - block/box removed
    const containerTypes = [
      { value: 'flex', label: 'Flex', icon: Columns },
      { value: 'grid', label: 'Grid', icon: LayoutGrid },
    ];
    
    return (
      <div className="mb-6 pb-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Container Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {containerTypes.map((type) => {
            const Icon = type.icon;
            const isActive = displayType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => handleStyleChange('display', type.value)}
                className={`
                  flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all
                  ${isActive 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                title={type.label}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render flex structure selector (Elementor-style icon grid)
  const renderFlexStructureSelector = () => {
    // Only show for flex containers
    if (!isContainer || activeTab !== 'style' || displayType !== 'flex') return null;
    
    // Elementor-style flex structure presets
    // Structure: { id, label, flexDirection, children: [{ width, responsive }] }
    const flexStructures = [
      // FIRST ROW: Direction presets
      {
        id: 'vertical-stack',
        label: 'Vertical Stack',
        flexDirection: 'column',
        children: [{ width: '100%' }], // Single child, full width
      },
      {
        id: 'horizontal-row',
        label: 'Horizontal Row',
        flexDirection: 'row',
        children: [{ width: '100%' }], // Single child, full width
      },
      // SECOND GROUP: Single row splits
      {
        id: '2col-50-50',
        label: '2 Columns (50/50)',
        flexDirection: 'row',
        children: [{ width: '50%' }, { width: '50%' }],
      },
      {
        id: '2col-33-66',
        label: '2 Columns (33/66)',
        flexDirection: 'row',
        children: [{ width: '33.33%' }, { width: '66.67%' }],
      },
      {
        id: '3col-33-33-33',
        label: '3 Columns (33/33/33)',
        flexDirection: 'row',
        children: [{ width: '33.33%' }, { width: '33.33%' }, { width: '33.33%' }],
      },
      {
        id: '4col-25-25-25-25',
        label: '4 Columns (25/25/25/25)',
        flexDirection: 'row',
        children: [{ width: '25%' }, { width: '25%' }, { width: '25%' }, { width: '25%' }],
      },
      // THIRD GROUP: Multi-row mixed structures (via flex-wrap)
      {
        id: '2x2-grid',
        label: '2×2 Grid',
        flexDirection: 'row',
        children: [
          { width: '50%' }, // Row 1, Col 1
          { width: '50%' }, // Row 1, Col 2
          { width: '50%' }, // Row 2, Col 1 (wraps)
          { width: '50%' }, // Row 2, Col 2 (wraps)
        ],
      },
      {
        id: 'top-full-bottom-2col',
        label: 'Top Full + Bottom 2 Columns',
        flexDirection: 'row',
        children: [
          { width: '100%' }, // Row 1: Full width (wraps)
          { width: '50%' },  // Row 2, Col 1
          { width: '50%' },  // Row 2, Col 2
        ],
      },
      {
        id: 'left-col-right-stacked',
        label: 'Left Column + Right Stacked',
        flexDirection: 'row',
        children: [
          { width: '50%' }, // Left column
          { width: '50%', nested: true, nestedChildren: [{ width: '100%' }, { width: '100%' }] }, // Right container with 2 stacked children
        ],
      },
      {
        id: '3-top-1-bottom',
        label: '3 on Top + 1 Full Bottom',
        flexDirection: 'row',
        children: [
          { width: '33.33%' }, // Row 1, Col 1
          { width: '33.33%' }, // Row 1, Col 2
          { width: '33.33%' }, // Row 1, Col 3
          { width: '100%' },   // Row 2: Full width (wraps)
        ],
      },
      {
        id: 'asymmetric-masonry',
        label: 'Asymmetric Masonry',
        flexDirection: 'row',
        children: [
          { width: '50%' },   // Row 1, Col 1
          { width: '50%' },   // Row 1, Col 2
          { width: '33.33%' }, // Row 2, Col 1
          { width: '33.33%' }, // Row 2, Col 2
          { width: '33.33%' }, // Row 2, Col 3
        ],
      },
      {
        id: 'complex-layout',
        label: 'Complex Layout',
        flexDirection: 'row',
        children: [
          { width: '66.67%' }, // Row 1, Col 1 (2/3)
          { width: '33.33%' },  // Row 1, Col 2 (1/3)
          { width: '33.33%' },  // Row 2, Col 1 (wraps)
          { width: '33.33%' },  // Row 2, Col 2
          { width: '33.33%' },  // Row 2, Col 3
        ],
      },
    ];
    
    // Check if container already has children
    const existingChildren = getCustomElements && elId && sectionId 
      ? getCustomElements(sectionId).filter((el: any) => el.parentElId === elId)
      : [];
    const hasChildren = existingChildren.length > 0;
    
    const handleStructureSelect = (structure: typeof flexStructures[0]) => {
      if (!addCustomElement || !elId || !sectionId || !updateCustomElementStyle || !onStylesChange || !removeCustomElement || !getCustomElements) return;
      
      // CRITICAL: Structure selection is REPLACEMENT, not append
      // Step 1: Get existing children of this container
      const allElements = getCustomElements(sectionId);
      const existingChildren = allElements.filter((el: any) => el.parentElId === elId);
      
      // Step 2: Store existing children data (for redistribution)
      // Only redistribute simple elements (non-containers) to avoid nested slot issues
      // Containers with children are complex and will be removed
      const existingChildrenData = existingChildren
        .filter((el: any) => {
          // Only redistribute simple elements (not containers)
          // Containers might have nested children which complicates redistribution
          return el.type !== 'container';
        })
        .map((el: any) => ({
          elId: el.elId,
          type: el.type,
          props: getCustomElementProps ? getCustomElementProps(sectionId, el.elId) : {},
          styles: getCustomElementStyle ? getCustomElementStyle(sectionId, el.elId) : {},
          order: el.order || 0,
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order for proper redistribution
      
      // Step 3: DELETE all existing direct children of this container
      // Note: We only delete direct children - nested children are preserved within their parent containers
      existingChildren.forEach((child: any) => {
        removeCustomElement(sectionId, child.elId);
      });
      
      // Step 4: Update container flexDirection and flexWrap
      onStylesChange({
        ...currentStyles,
        flexDirection: structure.flexDirection,
        flexWrap: 'wrap', // Required for multi-row layouts
      });
      
      // Step 5: Create new slot containers per structure
      // CRITICAL: Slot containers must fill the entire parent container space
      const baseTimestamp = Date.now();
      const newSlotIds: string[] = [];
      
      // Calculate which row each child belongs to (for multi-row layouts)
      const calculateRowAssignments = () => {
        if (structure.flexDirection === 'column') {
          return structure.children.map((_, i) => i); // Each child is a row
        }
        
        // For row direction, calculate which row each child belongs to
        let currentRow = 0;
        let currentRowWidth = 0;
        const rowAssignments: number[] = [];
        
        structure.children.forEach((child: any) => {
          const width = parseFloat(child.width);
          if (currentRowWidth + width > 100.01) { // Account for rounding
            currentRow++;
            currentRowWidth = width;
          } else {
            currentRowWidth += width;
          }
          rowAssignments.push(currentRow);
        });
        
        return rowAssignments;
      };
      
      const rowAssignments = calculateRowAssignments();
      const numRows = Math.max(...rowAssignments) + 1;
      
      // For direction presets, create single slot that fills entire container
      if (structure.id === 'vertical-stack' || structure.id === 'horizontal-row') {
        if (structure.children.length > 0) {
          const slotElId = `container-slot-${baseTimestamp}-0-${Math.random().toString(36).substr(2, 9)}`;
          newSlotIds.push(slotElId);
          addCustomElement(sectionId, 'container', slotElId, false, elId);
          
          setTimeout(() => {
            // Single slot fills entire container
            const slotStyles: React.CSSProperties = {
              display: 'flex',
              flexDirection: 'column',
              flexWrap: 'wrap',
              minHeight: '100px', // Minimum height for visibility
              boxSizing: 'border-box',
            };
            
            if (structure.flexDirection === 'row') {
              // Horizontal row: slot should fill width and height
              slotStyles.width = '100%';
              slotStyles.height = '100%';
              slotStyles.flexBasis = '100%';
              slotStyles.flexGrow = 1;
              slotStyles.flexShrink = 0;
            } else {
              // Vertical stack: slot should fill width and height
              slotStyles.width = '100%';
              slotStyles.height = '100%';
              slotStyles.flexBasis = '100%';
              slotStyles.flexGrow = 1;
              slotStyles.flexShrink = 0;
            }
            
            updateCustomElementStyle(sectionId, slotElId, slotStyles);
          }, 100);
        }
      } else {
        // For multi-child structures, create all slot containers with proper dimensions
        structure.children.forEach((child: any, index) => {
          const slotElId = `container-slot-${baseTimestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`;
          newSlotIds.push(slotElId);
          
          // Create slot container
          addCustomElement(sectionId, 'container', slotElId, false, elId);
          
          // Set slot styles based on flex direction
          setTimeout(() => {
            const rowIndex = rowAssignments[index];
            const slotStyles: React.CSSProperties = {
              display: 'flex',
              flexDirection: 'column',
              flexWrap: 'wrap',
              minWidth: 0,
              boxSizing: 'border-box',
              minHeight: '100px', // Minimum height for visibility
            };
            
            if (structure.flexDirection === 'row') {
              // Row direction: set width based on preset percentage, height fills row
              slotStyles.width = child.width;
              slotStyles.flexBasis = child.width;
              slotStyles.flexShrink = 0;
              slotStyles.flexGrow = 0;
              // Height should fill the row (calculated as 100% / numRows)
              slotStyles.height = `${100 / numRows}%`;
              slotStyles.minHeight = '100px';
            } else {
              // Column direction: set height based on preset percentage, width fills container
              slotStyles.height = child.width; // In column, width percentage represents height
              slotStyles.flexBasis = child.width;
              slotStyles.flexShrink = 0;
              slotStyles.flexGrow = 0;
              // Width should fill the container
              slotStyles.width = '100%';
            }
            
            updateCustomElementStyle(sectionId, slotElId, slotStyles);
            
            // If this slot has nested children (for left-col-right-stacked structure)
            if (child.nested && child.nestedChildren && Array.isArray(child.nestedChildren)) {
              child.nestedChildren.forEach((nestedChild: any, nestedIndex: number) => {
                const nestedSlotElId = `container-slot-${baseTimestamp}-${index}-nested-${nestedIndex}-${Math.random().toString(36).substr(2, 9)}`;
                addCustomElement(sectionId, 'container', nestedSlotElId, false, slotElId);
                
                setTimeout(() => {
                  // Nested slots fill their parent slot
                  updateCustomElementStyle(sectionId, nestedSlotElId, {
                    width: nestedChild.width,
                    height: '100%',
                    flexBasis: nestedChild.width,
                    minWidth: 0,
                    flexShrink: 0,
                    flexGrow: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    flexWrap: 'wrap',
                    minHeight: '100px',
                    boxSizing: 'border-box',
                  } as React.CSSProperties);
                }, 100 * (index + 1) + 50 * (nestedIndex + 1));
              });
            }
          }, 100 * (index + 1)); // Stagger creation
        });
      }
      
      // Step 6: Redistribute existing elements into new slots (round-robin)
      // Wait for slots to be created, then redistribute
      setTimeout(() => {
        existingChildrenData.forEach((existingChild, index) => {
          // Find target slot (round-robin)
          const targetSlotIndex = index % newSlotIds.length;
          const targetSlotId = newSlotIds[targetSlotIndex];
          
          if (targetSlotId) {
            // Recreate element in the target slot
            const newElId = `${existingChild.type}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
            addCustomElement(sectionId, existingChild.type as any, newElId, false, targetSlotId);
            
            // Restore props and styles
            setTimeout(() => {
              if (updateCustomElementStyle) {
                updateCustomElementStyle(sectionId, newElId, existingChild.styles as React.CSSProperties);
              }
              if (updateCustomElementProps && existingChild.props) {
                updateCustomElementProps(sectionId, newElId, existingChild.props);
              }
            }, 200 * (index + 1));
          }
        });
      }, 500); // Wait for all slots to be created
    };
    
    // Render icon for each structure (Elementor-style visual representation)
    const renderStructureIcon = (structure: typeof flexStructures[0]) => {
      const iconSize = 40;
      const padding = 4; // Padding from button edges
      const gap = 1.5;
      const strokeWidth = 1;
      const contentSize = iconSize - (padding * 2); // Available space after padding
      
      // Special handling for vertical-stack (column direction) - show vertical arrow
      if (structure.id === 'vertical-stack') {
        const centerX = iconSize / 2;
        const arrowStartY = padding + 8;
        const arrowEndY = iconSize - padding - 8;
        const arrowHeadSize = 4;
        
        return (
          <svg width={iconSize} height={iconSize} viewBox={`0 0 ${iconSize} ${iconSize}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Vertical arrow line */}
            <line
              x1={centerX}
              y1={arrowStartY}
              x2={centerX}
              y2={arrowEndY}
              stroke="currentColor"
              strokeWidth={strokeWidth + 0.5}
              strokeLinecap="round"
            />
            {/* Arrow head pointing down */}
            <path
              d={`M ${centerX} ${arrowEndY} L ${centerX - arrowHeadSize} ${arrowEndY - arrowHeadSize} L ${centerX + arrowHeadSize} ${arrowEndY - arrowHeadSize} Z`}
              fill="currentColor"
            />
          </svg>
        );
      }
      
      // Special handling for horizontal-row (row direction) - show horizontal arrow
      if (structure.id === 'horizontal-row') {
        const centerY = iconSize / 2;
        const arrowStartX = padding + 8;
        const arrowEndX = iconSize - padding - 8;
        const arrowHeadSize = 4;
        
        return (
          <svg width={iconSize} height={iconSize} viewBox={`0 0 ${iconSize} ${iconSize}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Horizontal arrow line */}
            <line
              x1={arrowStartX}
              y1={centerY}
              x2={arrowEndX}
              y2={centerY}
              stroke="currentColor"
              strokeWidth={strokeWidth + 0.5}
              strokeLinecap="round"
            />
            {/* Arrow head pointing right */}
            <path
              d={`M ${arrowEndX} ${centerY} L ${arrowEndX - arrowHeadSize} ${centerY - arrowHeadSize} L ${arrowEndX - arrowHeadSize} ${centerY + arrowHeadSize} Z`}
              fill="currentColor"
            />
          </svg>
        );
      }
      
      // Special handling for left-col-right-stacked
      if (structure.id === 'left-col-right-stacked') {
        const leftWidth = (50 / 100) * contentSize;
        const rightWidth = (50 / 100) * contentSize;
        const rightHeight = (contentSize - gap) / 2;
        
        // Calculate positions and ensure x + width < iconSize - padding
        const leftX = padding;
        const leftRectWidth = Math.min(leftWidth - gap, iconSize - padding - leftX);
        const leftRectHeight = Math.min(contentSize - gap, iconSize - padding - padding);
        
        const rightX = padding + leftWidth + gap;
        const rightRectWidth = Math.min(rightWidth - gap, iconSize - padding - rightX);
        const rightRectHeight = Math.min(rightHeight - gap, iconSize - padding - padding);
        
        return (
          <svg width={iconSize} height={iconSize} viewBox={`0 0 ${iconSize} ${iconSize}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Left column - full height */}
            <rect
              x={leftX}
              y={padding}
              width={leftRectWidth}
              height={leftRectHeight}
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              rx="1"
            />
            {/* Right top */}
            <rect
              x={rightX}
              y={padding}
              width={rightRectWidth}
              height={rightRectHeight}
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              rx="1"
            />
            {/* Right bottom */}
            <rect
              x={rightX}
              y={padding + rightHeight + gap}
              width={rightRectWidth}
              height={rightRectHeight}
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              rx="1"
            />
          </svg>
        );
      }
      
      // Calculate rows for multi-row layouts
      const calculateRows = () => {
        if (structure.flexDirection === 'column') {
          return structure.children.map((_, i) => i); // Each child is a row
        }
        
        // For row direction, calculate which row each child belongs to
        let currentRow = 0;
        let currentRowWidth = 0;
        const rowAssignments: number[] = [];
        
        structure.children.forEach((child: any) => {
          const width = parseFloat(child.width);
          if (currentRowWidth + width > 100.01) { // Account for rounding
            currentRow++;
            currentRowWidth = width;
          } else {
            currentRowWidth += width;
          }
          rowAssignments.push(currentRow);
        });
        
        return rowAssignments;
      };
      
      const rows = calculateRows();
      const numRows = Math.max(...rows) + 1;
      const rowHeight = (contentSize - (numRows - 1) * gap) / numRows;
      
      return (
        <svg width={iconSize} height={iconSize} viewBox={`0 0 ${iconSize} ${iconSize}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {structure.children.map((child: any, index) => {
            const widthPercent = parseFloat(child.width);
            const isRow = structure.flexDirection === 'row';
            const rowIndex = rows[index];
            
            if (isRow) {
              // Calculate x position based on previous children in same row
              let x = padding;
              for (let i = 0; i < index; i++) {
                if (rows[i] === rowIndex) {
                  x += (parseFloat(structure.children[i].width) / 100) * contentSize + gap;
                }
              }
              
              const calculatedWidth = (widthPercent / 100) * contentSize;
              const y = padding + rowIndex * (rowHeight + gap);
              
              // CRITICAL: Ensure x + width < iconSize - padding (strict right edge constraint)
              // This ensures the rectangle never touches the right edge
              const maxAllowedXPlusWidth = iconSize - padding;
              const maxWidth = maxAllowedXPlusWidth - x;
              const rectWidth = Math.min(calculatedWidth - gap, maxWidth - 0.1); // Subtract 0.1 to ensure strict <
              
              // CRITICAL: Ensure y + height < iconSize - padding (strict bottom edge constraint)
              const maxAllowedYPlusHeight = iconSize - padding;
              const maxHeight = maxAllowedYPlusHeight - y;
              const rectHeight = Math.min(rowHeight - gap, maxHeight - 0.1); // Subtract 0.1 to ensure strict <
              
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width={Math.max(0, rectWidth)}
                  height={Math.max(0, rectHeight)}
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  rx="1"
                />
              );
            } else {
              // Vertical layout
              const y = padding + structure.children.slice(0, index).reduce((sum, c: any) => {
                const prevIndex = structure.children.indexOf(c);
                return sum + ((parseFloat(c.width) / 100) * contentSize) + gap;
              }, 0);
              const calculatedHeight = (widthPercent / 100) * contentSize;
              
              const x = padding;
              // CRITICAL: Ensure x + width < iconSize - padding (strict right edge constraint)
              const maxAllowedXPlusWidth = iconSize - padding;
              const maxWidth = maxAllowedXPlusWidth - x;
              const rectWidth = Math.min(contentSize - gap, maxWidth - 0.1); // Subtract 0.1 to ensure strict <
              
              // CRITICAL: Ensure y + height < iconSize - padding (strict bottom edge constraint)
              const maxAllowedYPlusHeight = iconSize - padding;
              const maxHeight = maxAllowedYPlusHeight - y;
              const rectHeight = Math.min(calculatedHeight - gap, maxHeight - 0.1); // Subtract 0.1 to ensure strict <
              
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width={Math.max(0, rectWidth)}
                  height={Math.max(0, rectHeight)}
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  rx="1"
                />
              );
            }
          })}
        </svg>
      );
    };
    
    return (
      <div className="mb-6 pb-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select your structure
        </label>
        <div className="grid grid-cols-2 gap-2 p-2">
          {flexStructures.map((structure) => (
            <button
              key={structure.id}
              type="button"
              onClick={() => handleStructureSelect(structure)}
              className="
                flex items-center justify-center p-1.5 rounded border border-gray-200 
                bg-white hover:border-blue-400 hover:bg-blue-50 
                transition-all aspect-square
              "
              title={structure.label}
            >
              <div className="w-full h-full text-gray-600 flex items-center justify-center">
                {renderStructureIcon(structure)}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (properties.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        No {activeTab} properties available for this element.
      </div>
    );
  }

  // Get current text value for rewrite modal
  const getCurrentTextForRewrite = () => {
    if (!rewritePropertyKey) return '';
    return currentProps[rewritePropertyKey] ?? '';
  };

  // Detect service name from element context
  // Check if element is in a service container or has service-related text
  const getServiceName = (): string | undefined => {
    // Use elId prop if available, otherwise fall back to elementProperties.elementId
    const elementId = elId || elementProperties.elementId || '';
    
    // Check if element ID contains service-related patterns
    // Format examples: service-{service-name}-{index}-heading, service-{service-name}-{index}-text
    if (elementId.includes('service-') || elementId.includes('Service-')) {
      // Try to extract service name from element ID
      // Pattern: service-{service-name}-{optional-index}-{type}
      const serviceMatch = elementId.match(/service-([^-]+(?:-[^-]+)*?)(?:-\d+)?-(?:heading|text|image|description|container)/i);
      if (serviceMatch && serviceMatch[1]) {
        // Convert kebab-case to readable name
        const serviceName = serviceMatch[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return serviceName;
      }
      
      // Alternative pattern: service-{service-name}-{index} (without type suffix)
      const altMatch = elementId.match(/service-([^-]+(?:-[^-]+)*?)(?:-\d+)?$/i);
      if (altMatch && altMatch[1]) {
        const serviceName = altMatch[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return serviceName;
      }
    }

    // Check if current text contains service-related keywords
    const currentText = getCurrentTextForRewrite();
    if (currentText) {
      // Look for service name patterns in the text or element props
      const serviceKeywords = ['service', 'Service'];
      const hasServiceContext = serviceKeywords.some(keyword => 
        elementId.toLowerCase().includes(keyword.toLowerCase()) || 
        currentText.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasServiceContext) {
        // Try to find service name in element props (if available)
        // For service elements, the heading might contain the service name
        const headingText = currentProps.heading || currentProps.text || '';
        if (headingText && headingText.length < 100 && headingText.length > 0) {
          // If heading is short, it might be the service name
          return headingText;
        }
      }
    }

    return undefined;
  };

  // Handle rewrite completion
  const handleRewriteComplete = (rewrittenText: string) => {
    if (rewritePropertyKey) {
      handlePropertyChange(rewritePropertyKey, rewrittenText);
    }
    setRewriteModalOpen(false);
    setRewritePropertyKey('');
  };

  // Helper to get breakpoint-aware styles
  const getBreakpointStyles = (styles: any) => {
    if (activeBreakpoint === 'desktop') {
      return styles || {};
    }
    return styles?.[activeBreakpoint] || {};
  };

  // Helper to update styles with breakpoint awareness
  const handleSpacingChange = (partialStyles: any) => {
    if (activeBreakpoint === 'desktop') {
      onStylesChange({ ...currentStyles, ...partialStyles });
    } else {
      const breakpointStyles = { ...getBreakpointStyles(currentStyles), ...partialStyles };
      onStylesChange({
        ...currentStyles,
        [activeBreakpoint]: breakpointStyles,
      });
    }
  };

  // ============================================================
  // ALL HOOKS COMPLETE - NOW SAFE TO HAVE LOGIC AND JSX
  // ============================================================

  return (
    <>
    <div className="space-y-4">
        {renderContainerTypeSelector()}
        {renderFlexStructureSelector()}
        
        {/* Alignment Control - Style Tab Only */}
        {activeTab === 'style' && supportsAlignment && (
          <AlignmentControl
            label="Alignment"
            styles={currentStyles}
            breakpoint={activeBreakpoint}
            onChange={handleSpacingChange}
            elementType={elementType}
            property="textAlign"
          />
        )}

        {/* Typography Control - Style Tab Only */}
        {activeTab === 'style' && supportsTypography && (
          <TypographyControl
            label="Typography"
            styles={currentStyles}
            breakpoint={activeBreakpoint}
            onChange={handleSpacingChange}
            elementType={elementType}
            defaultStyles={{}}
            projectId={projectId}
            defaultFont={defaultFont}
          />
        )}
        
        {/* Margin & Padding Controls - Advanced Tab Only */}
        {activeTab === 'advanced' && (
          <>
            <BoxSpacingControl
              label="Margin"
              styles={currentStyles}
              breakpoint={activeBreakpoint}
              onChange={handleSpacingChange}
            />
            <BoxSpacingControl
              label="Padding"
              styles={currentStyles}
              breakpoint={activeBreakpoint}
              onChange={handleSpacingChange}
            />
          </>
        )}
        
        {properties
          .filter((property) => {
            // Hide display dropdown if we have icon selector
            if (property.key === 'display' && isContainer) return false;
            // Hide individual margin/padding inputs in ALL tabs (replaced by BoxSpacingControl in Advanced tab)
            const spacingKeys = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 
                                 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                                 'margin', 'padding']; // Also hide shorthand properties
            if (spacingKeys.includes(property.key)) {
              return false;
            }
            // Hide old textAlign/headingTextAlign dropdowns (replaced by AlignmentControl in Style tab)
            if ((property.key === 'textAlign' || property.key === 'headingTextAlign') && supportsAlignment && activeTab === 'style') {
              return false;
            }
            // Hide legacy default checkboxes (replaced by TypographyControl)
            const legacyKeys = ['useDefaultFont', 'useDefaultSize', 'useDefaultColor'];
            if (legacyKeys.includes(property.key)) {
              return false;
            }
            // Hide old typography inputs (replaced by TypographyControl in Style tab)
            if (supportsTypography && activeTab === 'style') {
              const typographyKeys = [
                'fontFamily',
                'fontSize',
                'fontWeight',
                'textTransform',
                'fontStyle',
                'textDecoration',
                'lineHeight',
                'letterSpacing',
                'wordSpacing',
                // Heading-specific keys
                'headingFontFamily',
                'headingFontSize',
                'headingFontWeight',
                'headingTextTransform',
                'headingTextDecoration',
                'headingLineHeight',
                'headingLetterSpacing',
              ];
              if (typographyKeys.includes(property.key)) {
                return false;
              }
            }
            return true;
          })
          .map((property) => (
        <div key={property.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {property.label}
          </label>
          {renderPropertyInput(property)}
        </div>
      ))}
    </div>

      {/* Text Rewrite Modal */}
      {rewriteModalOpen && (
        <TextRewriteModal
          isOpen={rewriteModalOpen}
          onClose={() => {
            setRewriteModalOpen(false);
            setRewritePropertyKey('');
          }}
          currentText={getCurrentTextForRewrite()}
          onRewrite={handleRewriteComplete}
          serviceName={getServiceName()}
          projectId={projectId}
          userId={userId}
          pageId={pageId}
        />
      )}

      {/* Icon Picker Modal */}
      {iconPickerOpen && iconPickerKey && (
        <IconPicker
          value={currentProps[iconPickerKey] || ''}
          onChange={(newValue) => {
            handlePropertyChange(iconPickerKey, newValue);
            setIconPickerOpen(false);
          }}
          onClose={() => {
            setIconPickerOpen(false);
            setIconPickerKey('');
          }}
        />
      )}
    </>
  );
}


