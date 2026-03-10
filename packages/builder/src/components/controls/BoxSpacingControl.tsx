'use client';

import React, { useState, useEffect } from 'react';
import { Link2, Link2Off } from 'lucide-react';

interface BoxSpacingControlProps {
  label: 'Margin' | 'Padding';
  styles: any;
  onChange: (partialStyles: any) => void;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
}

export default function BoxSpacingControl({
  label,
  styles,
  onChange,
  breakpoint,
}: BoxSpacingControlProps) {
  // Get current breakpoint styles
  const getBreakpointStyles = (allStyles: any) => {
    if (breakpoint === 'desktop') {
      return allStyles || {};
    }
    return allStyles?.[breakpoint] || {};
  };

  const currentStyles = getBreakpointStyles(styles);

  // Get property prefix (margin or padding)
  const prefix = label.toLowerCase() as 'margin' | 'padding';

  // Extract numeric value from style string (e.g., "20px" -> "20")
  const extractNumericValue = (value: string | undefined): string => {
    if (!value || typeof value !== 'string') return '';
    const numMatch = value.match(/^([\d.]+)/);
    return numMatch ? numMatch[1] : '';
  };

  // Initialize values from current styles
  const getInitialValues = () => {
    return {
      top: extractNumericValue(currentStyles[`${prefix}Top`]),
      right: extractNumericValue(currentStyles[`${prefix}Right`]),
      bottom: extractNumericValue(currentStyles[`${prefix}Bottom`]),
      left: extractNumericValue(currentStyles[`${prefix}Left`]),
    };
  };

  const [values, setValues] = useState(getInitialValues);
  const [linked, setLinked] = useState(false);

  // Update values when styles change externally
  useEffect(() => {
    setValues(getInitialValues());
  }, [styles, breakpoint]);

  // Update side value(s)
  const updateSide = (side: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    // Only allow numbers and decimal point
    const sanitized = value.replace(/[^\d.]/g, '');
    
    setValues((prev) => {
      const newValues = linked
        ? {
            top: sanitized,
            right: sanitized,
            bottom: sanitized,
            left: sanitized,
          }
        : { ...prev, [side]: sanitized };

      // Apply to styles
      applyValuesToStyles(newValues);
      
      return newValues;
    });
  };

  // Apply values to styles object
  const applyValuesToStyles = (vals: typeof values) => {
    const updates: any = {
      [`${prefix}Top`]: vals.top ? `${vals.top}px` : undefined,
      [`${prefix}Right`]: vals.right ? `${vals.right}px` : undefined,
      [`${prefix}Bottom`]: vals.bottom ? `${vals.bottom}px` : undefined,
      [`${prefix}Left`]: vals.left ? `${vals.left}px` : undefined,
      [`${prefix}`]: undefined, // Clear shorthand to prevent conflicts
    };

    if (breakpoint === 'desktop') {
      onChange(updates);
    } else {
      // Update breakpoint-specific styles
      const breakpointStyles = { ...currentStyles, ...updates };
      onChange({ [breakpoint]: breakpointStyles });
    }
  };

  // Handle "All" input change
  const handleAllChange = (value: string) => {
    const sanitized = value.replace(/[^\d.]/g, '');
    const newValues = {
      top: sanitized,
      right: sanitized,
      bottom: sanitized,
      left: sanitized,
    };
    setValues(newValues);
    applyValuesToStyles(newValues);
  };

  // Get "All" value (only show if all sides are equal)
  const getAllValue = () => {
    if (
      values.top === values.right &&
      values.top === values.bottom &&
      values.top === values.left &&
      values.top !== ''
    ) {
      return values.top;
    }
    return '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point, and numbers
    if (
      [8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 40) ||
      // Allow numbers and decimal point
      (e.keyCode >= 48 && e.keyCode <= 57) ||
      (e.keyCode >= 96 && e.keyCode <= 105)
    ) {
      return;
    }
    e.preventDefault();
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    fontSize: '13px',
    textAlign: 'center' as const,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none',
  };

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
        <button
          type="button"
          onClick={() => setLinked(!linked)}
          style={{
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: linked ? '#3b82f6' : '#64748b',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={linked ? 'Unlink sides' : 'Link sides'}
        >
          {linked ? (
            <Link2 size={14} />
          ) : (
            <Link2Off size={14} />
          )}
        </button>
      </div>

      {/* "All" input */}
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          placeholder="All"
          value={getAllValue()}
          onChange={(e) => handleAllChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            ...inputStyle,
            width: '100%',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        />
      </div>

      {/* Individual sides */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
        }}
      >
        {/* Top */}
        <div>
          <input
            type="text"
            value={values.top}
            onChange={(e) => updateSide('top', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          />
          <div
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: '2px',
            }}
          >
            Top
          </div>
        </div>

        {/* Right */}
        <div>
          <input
            type="text"
            value={values.right}
            onChange={(e) => updateSide('right', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          />
          <div
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: '2px',
            }}
          >
            Right
          </div>
        </div>

        {/* Bottom */}
        <div>
          <input
            type="text"
            value={values.bottom}
            onChange={(e) => updateSide('bottom', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          />
          <div
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: '2px',
            }}
          >
            Bottom
          </div>
        </div>

        {/* Left */}
        <div>
          <input
            type="text"
            value={values.left}
            onChange={(e) => updateSide('left', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          />
          <div
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: '2px',
            }}
          >
            Left
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '11px',
          color: '#94a3b8',
          marginTop: '4px',
          textAlign: 'right',
        }}
      >
        px
      </div>
    </div>
  );
}
