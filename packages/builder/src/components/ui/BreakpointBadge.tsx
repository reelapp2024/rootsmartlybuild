'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { hasBreakpointValue, getBreakpointValues } from '../../utils/helpers';

interface BreakpointBadgeProps {
  styles: any;
  property: string;
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  className?: string;
}

export default function BreakpointBadge({ 
  styles, 
  property, 
  activeBreakpoint,
  className = '' 
}: BreakpointBadgeProps) {
  const hasValue = hasBreakpointValue(styles, property, activeBreakpoint);
  const values = getBreakpointValues(styles, property);
  
  // Don't show badge on desktop if no breakpoint-specific value exists
  if (activeBreakpoint === 'desktop' && !hasValue) {
    return null;
  }
  
  // Show badge for tablet/mobile if they have specific values or differ from desktop
  const showBadge = activeBreakpoint !== 'desktop' && (
    hasValue || 
    values[activeBreakpoint] !== values.desktop
  );
  
  if (!showBadge) {
    return null;
  }
  
  // Determine badge color
  const badgeColor = hasValue 
    ? 'bg-blue-100 text-blue-700 border-blue-300' 
    : 'bg-gray-100 text-gray-600 border-gray-300';
  
  const tooltipText = hasValue
    ? `Has ${activeBreakpoint}-specific value`
    : `Inherits from desktop (${values.desktop || 'none'})`;
  
  return (
    <div 
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${badgeColor} ${className}`}
      title={tooltipText}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${hasValue ? 'bg-blue-500' : 'bg-gray-400'}`} />
      <span className="hidden sm:inline">{activeBreakpoint}</span>
    </div>
  );
}


