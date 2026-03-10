'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker, RgbaColorPicker } from 'react-colorful';
import { X, Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  showTransparent?: boolean;
  onTransparentToggle?: () => void;
  isTransparent?: boolean;
  label?: string;
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
];

// Helper functions to convert between hex and RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

export default function ColorPicker({
  value,
  onChange,
  disabled = false,
  showTransparent = true,
  onTransparentToggle,
  isTransparent = false,
  label,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexValue, setHexValue] = useState(value || '#ffffff');
  const [rgbValue, setRgbValue] = useState({ r: 255, g: 255, b: 255 });
  const [isValidHex, setIsValidHex] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (value && value !== 'transparent') {
      setHexValue(value);
      const rgb = hexToRgb(value);
      if (rgb) {
        setRgbValue(rgb);
      }
    } else if (isTransparent) {
      // Keep last color value even when transparent
      // Don't reset hexValue when transparent is on
    }
  }, [value, isTransparent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Set initial position to top-left
      setPosition({ x: 0, y: 0 });
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && popoverRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
    e.preventDefault();
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // If user types "transparent", ignore it (transparent is set via toggle)
    if (input.toLowerCase() === 'transparent') {
      return;
    }
    
    setHexValue(input);
    
    const hexPattern = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexPattern.test(input) || input === '') {
      setIsValidHex(true);
      if (input.startsWith('#')) {
        onChange(input);
        const rgb = hexToRgb(input);
        if (rgb) {
          setRgbValue(rgb);
        }
        // If transparent is on, turn it off when color is entered
        if (isTransparent && onTransparentToggle) {
          onTransparentToggle();
        }
      } else if (input.length > 0) {
        const color = `#${input}`;
        onChange(color);
        const rgb = hexToRgb(color);
        if (rgb) {
          setRgbValue(rgb);
        }
        // If transparent is on, turn it off when color is entered
        if (isTransparent && onTransparentToggle) {
          onTransparentToggle();
        }
      }
    } else {
      setIsValidHex(false);
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const newRgb = { ...rgbValue, [channel]: Math.max(0, Math.min(255, val)) };
    setRgbValue(newRgb);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexValue(hex);
    onChange(hex);
    // If transparent is on, turn it off when color is selected
    if (isTransparent && onTransparentToggle) {
      onTransparentToggle();
    }
  };

  const handleColorPickerChange = (color: string) => {
    setHexValue(color);
    onChange(color);
    const rgb = hexToRgb(color);
    if (rgb) {
      setRgbValue(rgb);
    }
    // If transparent is on, turn it off when color is selected
    if (isTransparent && onTransparentToggle) {
      onTransparentToggle();
    }
  };

  const handlePresetClick = (color: string) => {
    setHexValue(color);
    onChange(color);
    const rgb = hexToRgb(color);
    if (rgb) {
      setRgbValue(rgb);
    }
    // If transparent is on, turn it off when color is selected
    if (isTransparent && onTransparentToggle) {
      onTransparentToggle();
    }
    setIsOpen(false);
  };

  const displayColor = isTransparent ? 'transparent' : (value || '#ffffff');
  const previewColor = displayColor === 'transparent' ? '#e5e7eb' : displayColor;

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs text-gray-600 mb-1">{label}</label>
      )}
      <div className="flex gap-2">
        {/* Color Preview Button - Opens Color Picker */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            relative flex-shrink-0 w-12 h-10 rounded border-2 transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
          `}
          style={{
            backgroundColor: previewColor,
          }}
        >
          {isTransparent && (
            <div className="absolute inset-0 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-500" />
            </div>
          )}
          {isTransparent && (
            <div 
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
              }}
            />
          )}
        </button>

        {/* Hex Input */}
        <input
          type="text"
          value={isTransparent ? 'transparent' : (hexValue || '')}
          onChange={handleHexChange}
          disabled={disabled}
          placeholder="#ffffff"
          className={`
            flex-1 px-3 py-2 border rounded text-sm font-mono
            ${isValidHex || isTransparent ? 'border-gray-300' : 'border-red-300 bg-red-50'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-white'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          `}
        />

        {/* Transparent Toggle */}
        {showTransparent && onTransparentToggle && (
          <button
            type="button"
            onClick={onTransparentToggle}
            disabled={disabled}
            className={`
              px-3 py-2 rounded text-xs font-medium border transition-all
              ${isTransparent
                ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={isTransparent ? 'Make opaque' : 'Make transparent'}
          >
            {isTransparent ? <Check className="w-4 h-4" /> : 'T'}
          </button>
        )}
      </div>

      {/* Complete Color Picker Popover */}
      {isOpen && !disabled && (
        <div
          ref={popoverRef}
          className="fixed z-50 p-3 bg-white border border-gray-200 rounded-lg shadow-xl cursor-move"
          style={{ 
            minWidth: '320px',
            left: position.x || 0, 
            top: position.y || 0,
            transform: 'none'
          }}
        >
          {/* Draggable Header */}
          <div 
            className="flex items-center justify-between mb-2 cursor-move select-none"
            onMouseDown={handleDragStart}
          >
            <h3 className="text-xs font-semibold text-gray-700">Color Picker</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Color Picker Wheel */}
          <div className="mb-2" onMouseDown={(e) => e.stopPropagation()}>
            <HexColorPicker
              color={hexValue === 'transparent' || !hexValue ? '#ffffff' : hexValue}
              onChange={handleColorPickerChange}
              style={{ width: '100%', height: '120px' }}
            />
          </div>

          {/* Color Preview */}
          <div className="mb-2" onMouseDown={(e) => e.stopPropagation()}>
            <div
              className="w-full h-10 rounded border border-gray-300 mb-1"
              style={{ backgroundColor: previewColor }}
            >
              {isTransparent && (
                <div 
                  className="w-full h-full rounded opacity-50"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                  }}
                />
              )}
            </div>
            <div className="text-center">
              <p className="text-xs font-mono text-gray-600">{displayColor}</p>
            </div>
          </div>

          {/* RGB Inputs */}
          <div className="mb-2" onMouseDown={(e) => e.stopPropagation()}>
            <p className="text-xs text-gray-600 mb-1">RGB</p>
            <div className="grid grid-cols-3 gap-1">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">R</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgbValue.r}
                  onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                  className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">G</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgbValue.g}
                  onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                  className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">B</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgbValue.b}
                  onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                  className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Preset Colors */}
          <div onMouseDown={(e) => e.stopPropagation()}>
            <p className="text-xs text-gray-600 mb-1">Preset Colors</p>
            <div className="flex gap-1 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handlePresetClick(color)}
                  className={`
                    w-6 h-6 rounded border transition-all hover:scale-110 flex-shrink-0
                    ${value === color ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-300'}
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
