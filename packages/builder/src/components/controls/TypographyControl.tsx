'use client';

import React, { useState, useEffect } from 'react';
import { Type, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface TypographyControlProps {
  label?: string;
  styles: any;
  onChange: (partialStyles: any) => void;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  elementType?: string;
  defaultStyles?: any; // For reset functionality
  projectId?: string; // For theme loading
  defaultFont?: string; // Theme default font
}

// Font family options for non-text elements
const FONT_FAMILY_OPTIONS = [
  { value: '', label: 'Default (Theme Font)' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Nunito, sans-serif', label: 'Nunito' },
  { value: 'Oswald, sans-serif', label: 'Oswald' },
  { value: 'Raleway, sans-serif', label: 'Raleway' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  { value: 'Source Sans Pro, sans-serif', label: 'Source Sans Pro' },
  { value: 'Ubuntu, sans-serif', label: 'Ubuntu' },
  { value: 'Bebas Neue, sans-serif', label: 'Bebas Neue' },
  { value: 'Comfortaa, sans-serif', label: 'Comfortaa' },
  { value: 'Crimson Text, serif', label: 'Crimson Text' },
  { value: 'Dancing Script, cursive', label: 'Dancing Script' },
  { value: 'Pacifico, cursive', label: 'Pacifico' },
];

// Font family options for TEXT elements (includes "Use Default Site Font" and "System Font")
const TEXT_FONT_FAMILY_OPTIONS = [
  { value: '__default__', label: 'Use Default Site Font' },
  { value: 'system-ui, sans-serif', label: 'System Font' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Nunito, sans-serif', label: 'Nunito' },
  { value: 'Oswald, sans-serif', label: 'Oswald' },
  { value: 'Raleway, sans-serif', label: 'Raleway' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  { value: 'Source Sans Pro, sans-serif', label: 'Source Sans Pro' },
  { value: 'Ubuntu, sans-serif', label: 'Ubuntu' },
  { value: 'Bebas Neue, sans-serif', label: 'Bebas Neue' },
  { value: 'Comfortaa, sans-serif', label: 'Comfortaa' },
  { value: 'Crimson Text, serif', label: 'Crimson Text' },
  { value: 'Dancing Script, cursive', label: 'Dancing Script' },
  { value: 'Pacifico, cursive', label: 'Pacifico' },
];

// Font size source options for TEXT elements
const TEXT_FONT_SIZE_SOURCE_OPTIONS = [
  { value: 'text-base', label: 'Theme (Text Base)' },
  { value: 'text-small', label: 'Theme (Text Small)' },
  { value: 'text-large', label: 'Theme (Text Large)' },
  { value: 'text-xl', label: 'Theme (Text XL)' },
  { value: '__custom__', label: 'Custom' },
];

export default function TypographyControl({
  label = 'Typography',
  styles,
  onChange,
  breakpoint,
  elementType,
  defaultStyles = {},
  projectId,
  defaultFont = 'Inter, sans-serif',
}: TypographyControlProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [themeDefaultFont, setThemeDefaultFont] = useState<string>(defaultFont);

  // Load theme font on mount
  // CRITICAL: Theme font is ONLY for element resolution, NEVER applied globally
  useEffect(() => {
    if (defaultFont) {
      setThemeDefaultFont(defaultFont);
    } else {
      // Default fallback - do NOT read from CSS variables
      setThemeDefaultFont('Inter, sans-serif');
    }
  }, [defaultFont]);

  // Get current breakpoint styles
  const getBreakpointStyles = (allStyles: any) => {
    if (breakpoint === 'desktop') {
      return allStyles || {};
    }
    return allStyles?.[breakpoint] || {};
  };

  const currentStyles = getBreakpointStyles(styles);
  const defaultBreakpointStyles = getBreakpointStyles(defaultStyles);

  // Map heading-specific keys to standard keys
  const getHeadingKey = (key: string): string => {
    if (elementType === 'heading') {
      const headingMap: Record<string, string> = {
        'fontFamily': 'headingFontFamily',
        'fontSize': 'headingFontSize',
        'fontWeight': 'headingFontWeight',
        'textTransform': 'headingTextTransform',
        'textDecoration': 'headingTextDecoration',
        'lineHeight': 'headingLineHeight',
        'letterSpacing': 'headingLetterSpacing',
      };
      return headingMap[key] || key;
    }
    return key;
  };

  // Get current value with fallback (handles heading-specific keys)
  const getValue = (key: string): any => {
    const headingKey = getHeadingKey(key);
    // Try heading-specific key first, then standard key
    const value = currentStyles[headingKey] || currentStyles[key] || defaultBreakpointStyles[headingKey] || defaultBreakpointStyles[key];
    // Return value as-is (can be string, number, or undefined)
    // parseValue will handle type normalization
    return value !== undefined && value !== null ? value : '';
  };

  // Get toggle state (only for color)
  const getToggleValue = (key: string): boolean => {
    if (key !== 'color') return false;
    return Boolean(currentStyles['useDefaultColor'] ?? defaultBreakpointStyles['useDefaultColor'] ?? false);
  };

  // Resolve theme value for display (does not save)
  const resolveThemeValue = (key: string): any => {
    const value = getValue(key);
    if (value !== undefined && value !== null && value !== '') {
      return value; // User override exists
    }

    // Resolve from theme/CSS variables (ONLY from scoped website content area)
    if (key === 'fontFamily' || key === 'headingFontFamily') {
      return themeDefaultFont;
    }
    if (key === 'fontSize' || key === 'headingFontSize') {
      if (typeof window !== 'undefined') {
        // Get theme data from global store (set by ThemeProvider)
        const themeData = (window as any).__THEME_DATA__;
        if (themeData) {
          if (elementType === 'heading') {
            return '2rem'; // Heading sizes use browser defaults
          } else {
            return themeData.textSizes?.base || '1rem';
          }
        }
        return elementType === 'heading' ? '2rem' : '1rem';
      }
      return elementType === 'heading' ? '2rem' : '1rem';
    }
    if (key === 'color' || key === 'textColor') {
      // Color is resolved via CSS variables in replaceThemeColorsWithCSSVars
      // Return undefined to allow theme fallback
      return undefined;
    }
    return value;
  };

  // Handle value change (handles heading-specific keys)
  // CRITICAL: Write undefined (not empty string) to allow theme fallback
  const handleChange = (key: string, value: string) => {
    const headingKey = getHeadingKey(key);
    const updates: any = {};
    
    // Normalize: empty string, null, undefined all become undefined
    const normalizedValue = (value === '' || value === null || value === undefined) ? undefined : value;
    
    // For heading elements, update both heading-specific and standard keys for compatibility
    if (elementType === 'heading') {
      updates[headingKey] = normalizedValue;
      // Also update standard key for consistency
      if (headingKey !== key) {
        updates[key] = normalizedValue;
      }
    } else {
      updates[key] = normalizedValue;
    }

    if (breakpoint === 'desktop') {
      onChange(updates);
    } else {
      const breakpointStyles = { ...currentStyles, ...updates };
      onChange({ [breakpoint]: breakpointStyles });
    }
  };

  // Handle toggle change (only for color)
  const handleToggleChange = (checked: boolean) => {
    const updates: any = {
      useDefaultColor: checked,
    };

    // When toggle is ON, delete color (let theme resolve)
    // When toggle is OFF, keep current value (or empty)
    if (checked) {
      const headingKey = getHeadingKey('color');
      if (elementType === 'heading') {
        updates[headingKey] = undefined;
        updates['color'] = undefined;
        updates['textColor'] = undefined;
      } else {
        updates['color'] = undefined;
        updates['textColor'] = undefined;
      }
    }

    if (breakpoint === 'desktop') {
      onChange(updates);
    } else {
      const breakpointStyles = { ...currentStyles, ...updates };
      onChange({ [breakpoint]: breakpointStyles });
    }
  };

  // Handle font size source change for TEXT elements
  const handleFontSizeSourceChange = (source: string) => {
    const updates: any = {};
    
    if (source === '__custom__') {
      // Custom: clear defaultFontSizeType, keep fontSize
      updates.defaultFontSizeType = undefined;
      // fontSize is set by user input, keep current or leave undefined
    } else {
      // Theme size: set defaultFontSizeType, clear fontSize
      updates.defaultFontSizeType = source;
      updates.fontSize = undefined;
    }

    if (breakpoint === 'desktop') {
      onChange(updates);
    } else {
      const breakpointStyles = { ...currentStyles, ...updates };
      onChange({ [breakpoint]: breakpointStyles });
    }
  };

  // Handle font family change for TEXT elements
  const handleTextFontFamilyChange = (value: string) => {
    const updates: any = {};
    
    if (value === '__default__') {
      // Use Default Site Font: clear fontFamily (theme will resolve)
      updates.fontFamily = undefined;
    } else {
      // Custom font or System Font: set fontFamily
      updates.fontFamily = value;
    }

    if (breakpoint === 'desktop') {
      onChange(updates);
    } else {
      const breakpointStyles = { ...currentStyles, ...updates };
      onChange({ [breakpoint]: breakpointStyles });
    }
  };

  // Get current font size source for TEXT elements
  const getFontSizeSource = (): string => {
    // If fontSize exists, it's custom
    if (currentStyles.fontSize || defaultBreakpointStyles.fontSize) {
      return '__custom__';
    }
    // Otherwise, use defaultFontSizeType or fallback to text-base
    return currentStyles.defaultFontSizeType ?? defaultBreakpointStyles.defaultFontSizeType ?? 'text-base';
  };

  // Get current font family value for TEXT elements (for dropdown display)
  const getTextFontFamilyValue = (): string => {
    // If fontFamily exists, it's custom
    const fontFamily = getValue('fontFamily');
    if (fontFamily) {
      return fontFamily;
    }
    // Otherwise, it's default (theme will resolve)
    return '__default__';
  };

  // Handle reset
  const handleReset = () => {
    const resetKeys = [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'textTransform',
      'fontStyle',
      'textDecoration',
      'lineHeight',
      'letterSpacing',
      'wordSpacing',
    ];

    const updates: any = {};
    resetKeys.forEach((key) => {
      const headingKey = getHeadingKey(key);
      const defaultValue = defaultBreakpointStyles[headingKey] || defaultBreakpointStyles[key];
      
      if (elementType === 'heading') {
        updates[headingKey] = defaultValue || undefined;
        if (headingKey !== key) {
          updates[key] = defaultValue || undefined;
        }
      } else {
        updates[key] = defaultValue || undefined;
      }
    });

    if (breakpoint === 'desktop') {
      onChange(updates);
    } else {
      const breakpointStyles = { ...currentStyles, ...updates };
      onChange({ [breakpoint]: breakpointStyles });
    }
  };

  // Extract numeric value and unit (safe version)
  const parseValue = (
    value: any,
    defaultUnit: string = 'px'
  ): { number: string; unit: string } => {
    // Normalize value
    if (value === undefined || value === null) {
      return { number: '', unit: defaultUnit };
    }

    // Convert numbers to string
    if (typeof value === 'number') {
      return { number: String(value), unit: defaultUnit };
    }

    // Ensure string
    if (typeof value !== 'string') {
      return { number: '', unit: defaultUnit };
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return { number: '', unit: defaultUnit };
    }

    const match = trimmed.match(/^(-?[\d.]+)([a-z%]*)$/i);

    if (!match) {
      return { number: trimmed, unit: defaultUnit };
    }

    return {
      number: match[1],
      unit: match[2] || defaultUnit,
    };
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none',
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          cursor: 'pointer',
          borderBottom: '1px solid #e5e7eb',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Type size={16} style={{ color: '#64748b' }} />
          <label
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
            }}
          >
            {label}
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            title="Reset to defaults"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <RotateCcw size={14} />
          </button>
          {isExpanded ? <ChevronUp size={16} style={{ color: '#64748b' }} /> : <ChevronDown size={16} style={{ color: '#64748b' }} />}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Font Family */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Font Family
            </label>
            {elementType === 'text' ? (
              <select
                value={getTextFontFamilyValue()}
                onChange={(e) => handleTextFontFamilyChange(e.target.value)}
                style={inputStyle}
              >
                {TEXT_FONT_FAMILY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={getValue('fontFamily') || ''}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                style={inputStyle}
              >
                {FONT_FAMILY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Font Size */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Font Size
            </label>
            {elementType === 'text' ? (
              <>
                {/* Font Size Source Dropdown */}
                <select
                  value={getFontSizeSource()}
                  onChange={(e) => handleFontSizeSourceChange(e.target.value)}
                  style={{ ...inputStyle, marginBottom: '8px' }}
                >
                  {TEXT_FONT_SIZE_SOURCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {/* Custom Font Size Input (only shown when Custom is selected) */}
                {getFontSizeSource() === '__custom__' && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={parseValue(getValue('fontSize')).number}
                      onChange={(e) => {
                        const { unit } = parseValue(getValue('fontSize'));
                        const num = e.target.value.replace(/[^\d.]/g, '');
                        handleChange('fontSize', num ? `${num}${unit}` : '');
                      }}
                      placeholder="16"
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    />
                    <select
                      value={parseValue(getValue('fontSize')).unit}
                      onChange={(e) => {
                        const { number } = parseValue(getValue('fontSize'));
                        handleChange('fontSize', number ? `${number}${e.target.value}` : '');
                      }}
                      style={{ ...inputStyle, width: '60px' }}
                    >
                      <option value="px">px</option>
                      <option value="em">em</option>
                      <option value="rem">rem</option>
                    </select>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Heading: Theme Default vs Custom */}
                <select
                  value={(() => {
                    // If fontSize exists, it's custom
                    if (currentStyles.fontSize || defaultBreakpointStyles.fontSize) {
                      return '__custom__';
                    }
                    // Otherwise, it's theme default
                    return '__theme__';
                  })()}
                  onChange={(e) => {
                    if (e.target.value === '__theme__') {
                      // Theme Default: clear fontSize (theme will resolve by tag)
                      const updates: any = {
                        fontSize: undefined,
                      };
                      if (breakpoint === 'desktop') {
                        onChange(updates);
                      } else {
                        const breakpointStyles = { ...currentStyles, ...updates };
                        onChange({ [breakpoint]: breakpointStyles });
                      }
                    } else {
                      // Custom: keep current fontSize or set default
                      const updates: any = {};
                      if (!currentStyles.fontSize && !defaultBreakpointStyles.fontSize) {
                        updates.fontSize = '2rem'; // Default custom size
                      }
                      if (breakpoint === 'desktop') {
                        onChange(updates);
                      } else {
                        const breakpointStyles = { ...currentStyles, ...updates };
                        onChange({ [breakpoint]: breakpointStyles });
                      }
                    }
                  }}
                  style={{ ...inputStyle, marginBottom: '8px' }}
                >
                  <option value="__theme__">Theme Default</option>
                  <option value="__custom__">Custom</option>
                </select>
                {/* Custom Font Size Input (only shown when Custom is selected) */}
                {(() => {
                  // Show custom input if fontSize exists
                  return Boolean(currentStyles.fontSize || defaultBreakpointStyles.fontSize);
                })() && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={parseValue(getValue('fontSize')).number}
                      onChange={(e) => {
                        const { unit } = parseValue(getValue('fontSize'));
                        const num = e.target.value.replace(/[^\d.]/g, '');
                        const updates: any = {
                          fontSize: num ? `${num}${unit}` : undefined,
                        };
                        if (breakpoint === 'desktop') {
                          onChange(updates);
                        } else {
                          const breakpointStyles = { ...currentStyles, ...updates };
                          onChange({ [breakpoint]: breakpointStyles });
                        }
                      }}
                      placeholder="16"
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    />
                    <select
                      value={parseValue(getValue('fontSize')).unit}
                      onChange={(e) => {
                        const { number } = parseValue(getValue('fontSize'));
                        const updates: any = {
                          fontSize: number ? `${number}${e.target.value}` : undefined,
                        };
                        if (breakpoint === 'desktop') {
                          onChange(updates);
                        } else {
                          const breakpointStyles = { ...currentStyles, ...updates };
                          onChange({ [breakpoint]: breakpointStyles });
                        }
                      }}
                      style={{ ...inputStyle, width: '60px' }}
                    >
                      <option value="px">px</option>
                      <option value="em">em</option>
                      <option value="rem">rem</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Font Weight */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Font Weight
            </label>
            <select
              value={getValue('fontWeight') || '400'}
              onChange={(e) => handleChange('fontWeight', e.target.value)}
              style={inputStyle}
            >
              <option value="100">100 - Thin</option>
              <option value="200">200 - Extra Light</option>
              <option value="300">300 - Light</option>
              <option value="400">400 - Normal</option>
              <option value="500">500 - Medium</option>
              <option value="600">600 - Semi Bold</option>
              <option value="700">700 - Bold</option>
              <option value="800">800 - Extra Bold</option>
              <option value="900">900 - Black</option>
            </select>
          </div>

          {/* Font Style */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Font Style
            </label>
            <select
              value={getValue('fontStyle') || 'normal'}
              onChange={(e) => handleChange('fontStyle', e.target.value)}
              style={inputStyle}
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
              <option value="oblique">Oblique</option>
            </select>
          </div>

          {/* Text Transform */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Text Transform
            </label>
            <select
              value={getValue('textTransform') || 'none'}
              onChange={(e) => handleChange('textTransform', e.target.value)}
              style={inputStyle}
            >
              <option value="none">None</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </div>

          {/* Text Decoration */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Text Decoration
            </label>
            <select
              value={getValue('textDecoration') || 'none'}
              onChange={(e) => handleChange('textDecoration', e.target.value)}
              style={inputStyle}
            >
              <option value="none">None</option>
              <option value="underline">Underline</option>
              <option value="overline">Overline</option>
              <option value="line-through">Line Through</option>
            </select>
          </div>

          {/* Line Height */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Line Height
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={parseValue(getValue('lineHeight'), '').number}
                onChange={(e) => {
                  const { unit } = parseValue(getValue('lineHeight'), '');
                  const num = e.target.value.replace(/[^\d.]/g, '');
                  handleChange('lineHeight', num ? `${num}${unit || ''}` : '');
                }}
                placeholder="1.5"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
              <select
                value={parseValue(getValue('lineHeight'), '').unit || ''}
                onChange={(e) => {
                  const { number } = parseValue(getValue('lineHeight'), '');
                  handleChange('lineHeight', number ? `${number}${e.target.value || ''}` : '');
                }}
                style={{ ...inputStyle, width: '60px' }}
              >
                <option value="">unitless</option>
                <option value="px">px</option>
                <option value="em">em</option>
                <option value="rem">rem</option>
              </select>
            </div>
          </div>

          {/* Letter Spacing */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Letter Spacing
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={parseValue(getValue('letterSpacing')).number}
                onChange={(e) => {
                  const { unit } = parseValue(getValue('letterSpacing'));
                  const num = e.target.value.replace(/[^\d.]/g, '');
                  handleChange('letterSpacing', num ? `${num}${unit}` : '');
                }}
                placeholder="0"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
              <select
                value={parseValue(getValue('letterSpacing')).unit || 'px'}
                onChange={(e) => {
                  const { number } = parseValue(getValue('letterSpacing'));
                  handleChange('letterSpacing', number ? `${number}${e.target.value}` : '');
                }}
                style={{ ...inputStyle, width: '60px' }}
              >
                <option value="px">px</option>
                <option value="em">em</option>
                <option value="rem">rem</option>
              </select>
            </div>
          </div>

          {/* Word Spacing */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Word Spacing
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={parseValue(getValue('wordSpacing')).number}
                onChange={(e) => {
                  const { unit } = parseValue(getValue('wordSpacing'));
                  const num = e.target.value.replace(/[^\d.]/g, '');
                  handleChange('wordSpacing', num ? `${num}${unit}` : '');
                }}
                placeholder="0"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
              <select
                value={parseValue(getValue('wordSpacing')).unit || 'px'}
                onChange={(e) => {
                  const { number } = parseValue(getValue('wordSpacing'));
                  handleChange('wordSpacing', number ? `${number}${e.target.value}` : '');
                }}
                style={{ ...inputStyle, width: '60px' }}
              >
                <option value="px">px</option>
                <option value="em">em</option>
                <option value="rem">rem</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
