'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { Element } from '../../types/builder';
import { useApiData } from '../../hooks/useApiData';

interface HeadingElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  setSelectedElement: (element: {
    type: 'element';
    id: string;
    sectionId: string;
    rowId: string;
    columnId: string;
  }) => void;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function HeadingElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  setSelectedElement,
  updateElement,
}: HeadingElementProps) {
  const HeadingTag = (element.styles.headingTag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  // Fetch API data if enabled
  const { data: apiData, loading: apiLoading } = useApiData<string | { heading?: string; title?: string; text?: string }>(
    {
      enabled: element.api?.enabled || false,
      url: element.api?.url,
      method: element.api?.method || 'GET',
      refreshInterval: element.api?.refreshInterval || 0,
      dataPath: element.api?.dataPath,
      fallbackToContent: element.api?.fallbackToContent !== false,
    },
    element.content.heading
  );

  // Resolve heading content: API data → element.content (API wins)
  // Handle both string (when dataPath is used) and object (when full response) cases
  const resolvedHeading = typeof apiData === 'string' 
    ? apiData 
    : (apiData?.heading || apiData?.title || apiData?.text || element.content.heading || '');
  
  // Get icon position and gap
  const iconPosition = currentElementStyles.iconPosition || 'left';
  const iconGap = currentElementStyles.iconSize ? `calc(${currentElementStyles.iconSize} * 0.4)` : '8px';
  const iconSize = currentElementStyles.iconSize || '1em';
  // Resolve text color - check useDefaultTextColor flag (like useDefaultFont/useDefaultSize)
  const useDefaultTextColor = currentElementStyles.useDefaultTextColor !== undefined 
    ? currentElementStyles.useDefaultTextColor 
    : true; // Default to true
  
  let textColor = '#000000';
  if (useDefaultTextColor) {
    // Get default color from CSS variable (like useDefaultSize does)
    if (typeof window !== 'undefined') {
      const websiteContent = document.querySelector('[data-website-content="true"]');
      const root = document.documentElement;
      let color = '';
      if (websiteContent) {
        color = getComputedStyle(websiteContent).getPropertyValue('--color-heading').trim();
      }
      if (!color) {
        color = getComputedStyle(root).getPropertyValue('--color-heading').trim();
      }
      if (color) {
        textColor = `var(--color-heading, ${color})`;
      } else {
        textColor = 'var(--color-heading, #0f172a)';
      }
    } else {
      textColor = 'var(--color-heading, #0f172a)';
    }
  } else {
    // Use custom color
    textColor = currentElementStyles.textColor || '#000000';
  }
  const iconColor = currentElementStyles.iconColor || textColor || '#000000';

  // Get link properties
  const headingLink = element.content.headingLink;
  const linkTarget = element.content.headingLinkTarget || '_self';
  const linkRel = element.content.headingLinkRel || (headingLink && headingLink.startsWith('http') ? 'noopener noreferrer' : '');

  // Get flex direction for icon positioning
  const getFlexDirection = () => {
    if (!element.content.iconName) return 'row';
    return (iconPosition === 'top' || iconPosition === 'bottom') ? 'column' : 'row';
  };

  // Get icon order
  const getIconOrder = () => {
    if (!element.content.iconName) return {};
    return iconPosition === 'right' ? { order: 2 } : { order: 0 };
  };

  // Get text order
  const getTextOrder = () => {
    if (!element.content.iconName) return {};
    return iconPosition === 'right' ? { order: 1 } : { order: 1 };
  };

  // Helper to check if icon is Font Awesome
  const isFontAwesome = (iconName: string) => iconName && iconName.startsWith('fa-');

  // Render icon component
  const renderIcon = () => {
    if (!element.content.iconName) return null;
    
    const iconStyle = {
      fontSize: iconSize,
      color: iconColor,
      display: 'inline-flex',
      alignItems: 'center',
    };

    if (isFontAwesome(element.content.iconName)) {
      return (
        <i 
          className={`fa ${element.content.iconName}`}
          style={iconStyle}
        />
      );
    }
    
    return (
      <span style={iconStyle}>
        {element.content.iconName}
      </span>
    );
  };

  // Heading content with icon
  const headingContent = (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: getFlexDirection() as any,
        alignItems: 'center',
        gap: iconGap,
        width: '100%',
      }}
    >
      {element.content.iconName && iconPosition !== 'right' && iconPosition !== 'bottom' && (
        <span 
          style={{ 
            ...getIconOrder(),
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {renderIcon()}
        </span>
      )}
      <span
        contentEditable={builderMode}
        suppressContentEditableWarning
        className="outline-none focus:ring-2 focus:ring-blue-400 rounded px-2"
        style={getTextOrder()}
        onBlur={(e) => {
          if (!builderMode) return;
          const newHeading = e.currentTarget.textContent || '';
          // Only update if content actually changed
          if (newHeading !== element.content.heading) {
            updateElement(sectionId, rowId, colId, element.id, { content: { ...element.content, heading: newHeading } });
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        onClick={(e) => {
          if (builderMode) {
            e.stopPropagation();
            setSelectedElement({
              type: 'element',
              id: element.id,
              sectionId,
              rowId,
              columnId: colId,
            });
          }
        }}
      >
        {apiLoading ? 'Loading...' : (resolvedHeading || 'Heading')}
      </span>
      {element.content.iconName && (iconPosition === 'right' || iconPosition === 'bottom') && (
        <span 
          style={{ 
            ...getIconOrder(),
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {renderIcon()}
        </span>
      )}
    </div>
  );

  // Heading style
  const headingStyle: React.CSSProperties = {
    fontFamily: currentElementStyles.headingFontFamily,
    fontSize: currentElementStyles.headingFontSize || '1.875rem',
    fontWeight: currentElementStyles.headingFontWeight || '700',
    lineHeight: currentElementStyles.headingLineHeight || '1.2',
    textAlign: currentElementStyles.headingTextAlign || 'left',
    letterSpacing: currentElementStyles.headingLetterSpacing,
    textTransform: currentElementStyles.headingTextTransform || 'none',
    textDecoration: currentElementStyles.headingTextDecoration || 'none',
    color: textColor,
    display: 'block',
    width: '100%',
  };

  // If link is provided and not in builder mode, wrap in anchor tag
  if (headingLink && !builderMode) {
    return (
      <HeadingTag style={headingStyle}>
        <a
          href={headingLink}
          target={linkTarget}
          rel={linkRel || undefined}
          style={{
            color: 'inherit',
            textDecoration: 'inherit',
            display: 'inline-flex',
            width: '100%',
          }}
        >
          {headingContent}
        </a>
      </HeadingTag>
    );
  }

  // Default rendering
  return (
    <HeadingTag
      style={headingStyle}
      onClick={(e) => {
        if (builderMode) {
          e.stopPropagation();
          setSelectedElement({
            type: 'element',
            id: element.id,
            sectionId,
            rowId,
            columnId: colId,
          });
        }
      }}
    >
      {headingContent}
    </HeadingTag>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(HeadingElement, (prevProps, nextProps) => {
  // Re-render if element content or styles changed
  if (prevProps.element.id !== nextProps.element.id) return false;
  if (prevProps.element.content.heading !== nextProps.element.content.heading) return false;
  if (prevProps.element.content.iconName !== nextProps.element.content.iconName) return false;
  if (prevProps.element.content.headingLink !== nextProps.element.content.headingLink) return false;
  if (JSON.stringify(prevProps.element.styles) !== JSON.stringify(nextProps.element.styles)) return false;
  if (JSON.stringify(prevProps.currentElementStyles) !== JSON.stringify(nextProps.currentElementStyles)) return false;
  if (prevProps.builderMode !== nextProps.builderMode) return false;
  if (prevProps.sectionId !== nextProps.sectionId) return false;
  if (prevProps.rowId !== nextProps.rowId) return false;
  if (prevProps.colId !== nextProps.colId) return false;
  // Props are equal, skip re-render
  return true;
});
