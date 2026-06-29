import React from 'react';

interface DynamicFAIconProps {
  iconClass: string; // e.g., "fas fa-car"
  fallbackClass?: string; // e.g., "fas fa-star"
  className?: string; // CSS classes like "text-4xl"
  style?: React.CSSProperties; // Inline styles
}

/**
 * DynamicFAIcon - Uses FontAwesome CDN instead of bundled library
 * 
 * This component now uses CSS classes directly instead of React components.
 * FontAwesome is loaded via CDN in layout.tsx, saving ~400KB from bundle.
 * 
 * Functionality remains exactly the same - all iconClass props work as before.
 */
const DynamicFAIcon: React.FC<DynamicFAIconProps> = ({
  iconClass,
  fallbackClass = 'fas fa-star',
  className = 'text-4xl text-green-500',
  style,
}) => {
  // Validate and clean icon class
  // Supports formats: "fas fa-car", "fa-car", "car"
  const normalizeIconClass = (icon: string): string => {
    if (!icon) return '';
    
    // Remove extra spaces
    icon = icon.trim();
    
    // If already in "fas fa-*" format, return as is
    if (icon.startsWith('fas fa-')) {
      return icon;
    }
    
    // If in "fa-*" format, add "fas" prefix
    if (icon.startsWith('fa-')) {
      return `fas ${icon}`;
    }
    
    // If just icon name, add full prefix
    if (!icon.includes(' ')) {
      return `fas fa-${icon}`;
    }
    
    // Return as is if already formatted
    return icon;
  };

  // Get the icon class to use (with fallback)
  const finalIconClass = normalizeIconClass(iconClass) || normalizeIconClass(fallbackClass);

  // Return <i> tag with FontAwesome classes (CDN handles the rest)
  return (
    <i 
      className={`${finalIconClass} ${className || ''}`.trim()} 
      style={style}
      aria-hidden="true"
    />
  );
};

export default DynamicFAIcon;
