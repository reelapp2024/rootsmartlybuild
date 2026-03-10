'use client';

import React, { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import { resolveColor, ColorSource } from '../../utils/colorResolution';

interface ColorPickerWithThemeProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  showTransparent?: boolean;
  onTransparentToggle?: () => void;
  isTransparent?: boolean;
  label?: string;
  // Color source props
  colorSource: ColorSource; // Explicit source: 'default' | 'custom'
  onColorSourceChange: (source: ColorSource) => void; // Callback when source changes
  colorType?: 'text' | 'background'; // For label text
  elementType?: string; // Element type for theme color resolution (heading, text, button, icon, etc.)
  activeBreakpoint?: 'desktop' | 'tablet' | 'mobile';
  // Breakpoint badge component (optional)
  breakpointBadge?: React.ReactNode;
  // Default custom color when switching from default
  defaultCustomColor?: string;
}

/**
 * ColorPicker with "Use Default Color" checkbox
 * Similar to "Use Default Site Font" and "Use Default Size"
 */
export default function ColorPickerWithTheme({
  value,
  onChange,
  disabled = false,
  showTransparent = true,
  onTransparentToggle,
  isTransparent = false,
  label,
  colorSource,
  onColorSourceChange,
  colorType = 'text',
  elementType,
  activeBreakpoint,
  breakpointBadge,
  defaultCustomColor = '#000000',
}: ColorPickerWithThemeProps) {
  // Resolve color using centralized utility
  const resolved = resolveColor(value, colorSource, '', defaultCustomColor, colorType, elementType);
  
  // Store last custom color when switching to default
  const [lastCustomColor, setLastCustomColor] = useState<string>(
    resolved.source === 'custom' ? resolved.value : defaultCustomColor
  );

  // Update lastCustomColor when value changes (if it's a custom color)
  useEffect(() => {
    if (colorSource === 'custom' && value && value !== 'transparent') {
      setLastCustomColor(value);
    }
  }, [value, colorSource]);

  // Handle default color toggle
  const handleDefaultToggle = (checked: boolean) => {
    if (checked) {
      // Switching to default - save current custom color if using custom source
      if (colorSource === 'custom' && value && value !== 'transparent') {
        setLastCustomColor(value);
      }
      onColorSourceChange('default');
    } else {
      // Switching from default - restore last custom color
      if (lastCustomColor) {
        onChange(lastCustomColor);
      }
      onColorSourceChange('custom');
    }
  };

  // Handle color change (only when using custom)
  const handleColorChange = (color: string) => {
    if (colorSource === 'custom') {
      setLastCustomColor(color);
      onChange(color);
    }
  };

  // Get display value for color picker
  const pickerValue = colorSource === 'default' ? lastCustomColor : (value || defaultCustomColor);
  const useDefaultColor = colorSource === 'default';

  return (
    <div className="space-y-2">
      {/* Label with breakpoint badge */}
      {label && (
        <div className="flex items-center gap-1.5 mb-2">
          <label className="block text-xs text-gray-600">{label}</label>
          {breakpointBadge}
        </div>
      )}

      {/* Use Default Color Checkbox - Similar to "Use Default Site Font" */}
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useDefaultColor}
            onChange={(e) => handleDefaultToggle(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-xs text-gray-700 font-medium">
            Use Default {colorType === 'text' ? 'Text' : 'Background'} Color
          </span>
        </label>
      </div>

      {/* Color Picker (disabled when using default) */}
      <div className={useDefaultColor ? 'opacity-60 pointer-events-none' : ''}>
        <ColorPicker
          value={pickerValue}
          onChange={handleColorChange}
          disabled={disabled || useDefaultColor}
          showTransparent={showTransparent && !useDefaultColor}
          onTransparentToggle={useDefaultColor ? undefined : onTransparentToggle}
          isTransparent={isTransparent && !useDefaultColor}
          label={undefined} // Label already shown above
        />
      </div>

      {/* Default Color Info (when using default) */}
      {useDefaultColor && (
        <p className="text-xs text-gray-500 mt-1">
          Using default {colorType === 'text' ? 'text' : 'background'} color from theme settings: {resolved.displayValue}
        </p>
      )}
    </div>
  );
}
