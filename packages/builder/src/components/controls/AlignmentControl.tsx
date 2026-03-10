'use client';

import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface AlignmentControlProps {
  label?: string;
  styles: any;
  onChange: (partialStyles: any) => void;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  elementType?: string;
  property?: 'textAlign' | 'alignSelf' | 'justifyContent';
}

export default function AlignmentControl({
  label = 'Alignment',
  styles,
  onChange,
  breakpoint,
  elementType,
  property = 'textAlign',
}: AlignmentControlProps) {
  // Get current breakpoint styles
  const getBreakpointStyles = (allStyles: any) => {
    if (breakpoint === 'desktop') {
      return allStyles || {};
    }
    return allStyles?.[breakpoint] || {};
  };

  const currentStyles = getBreakpointStyles(styles);

  // Get current alignment value
  const getCurrentValue = (): 'left' | 'center' | 'right' | 'justify' => {
    // For heading elements, check both headingTextAlign and textAlign
    let value = currentStyles[property];
    if (elementType === 'heading' && !value) {
      value = currentStyles['headingTextAlign'] || currentStyles['textAlign'];
    }
    if (value === 'left' || value === 'center' || value === 'right' || value === 'justify') {
      return value;
    }
    if (value === 'flex-start' || value === 'start') return 'left';
    if (value === 'flex-end' || value === 'end') return 'right';
    return 'left'; // Default
  };

  const currentValue = getCurrentValue();

  // Handle alignment change
  const handleAlignmentChange = (value: 'left' | 'center' | 'right' | 'justify') => {
    let cssValue: string;
    
    // Map alignment value to CSS based on property type
    if (property === 'textAlign') {
      cssValue = value;
    } else if (property === 'alignSelf') {
      cssValue = value === 'left' ? 'flex-start' : value === 'right' ? 'flex-end' : value === 'center' ? 'center' : 'stretch';
    } else if (property === 'justifyContent') {
      cssValue = value === 'left' ? 'flex-start' : value === 'right' ? 'flex-end' : value === 'center' ? 'center' : 'space-between';
    } else {
      cssValue = value;
    }

    const updates: any = {
      [property]: cssValue,
    };

    // For heading elements, also update headingTextAlign for backward compatibility
    if (elementType === 'heading' && property === 'textAlign') {
      updates['headingTextAlign'] = cssValue;
    }

    if (breakpoint === 'desktop') {
      onChange(updates);
    } else {
      // Update breakpoint-specific styles
      const breakpointStyles = { ...currentStyles, ...updates };
      onChange({ [breakpoint]: breakpointStyles });
    }
  };

  const alignmentOptions: Array<{ value: 'left' | 'center' | 'right' | 'justify'; icon: React.ReactNode; label: string }> = [
    { value: 'left', icon: <AlignLeft size={16} />, label: 'Left' },
    { value: 'center', icon: <AlignCenter size={16} />, label: 'Center' },
    { value: 'right', icon: <AlignRight size={16} />, label: 'Right' },
  ];

  // Add justify option for text-based elements
  if (property === 'textAlign' && (elementType === 'text' || elementType === 'heading' || elementType === 'button')) {
    alignmentOptions.push({ value: 'justify', icon: <AlignJustify size={16} />, label: 'Justify' });
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
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

      <div
        style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: '#f1f5f9',
          padding: '4px',
          borderRadius: '6px',
        }}
      >
        {alignmentOptions.map((option) => {
          const isActive = currentValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleAlignmentChange(option.value)}
              title={option.label}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#3b82f6' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {option.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
