'use client';

import React from 'react';
import { Element } from '../../types/builder';
import { useApiData } from '../../hooks/useApiData';

interface ButtonElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function ButtonElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  updateElement,
}: ButtonElementProps) {
  // Fetch API data if enabled
  const { data: apiData, loading: apiLoading } = useApiData<{ buttonText?: string; text?: string; label?: string; title?: string }>(
    {
      enabled: element.api?.enabled || false,
      url: element.api?.url,
      method: element.api?.method || 'GET',
      refreshInterval: element.api?.refreshInterval || 0,
      dataPath: element.api?.dataPath,
      fallbackToContent: element.api?.fallbackToContent !== false,
    },
    { buttonText: element.content.buttonText }
  );

  // Resolve button text: API data → element.content (API wins)
  const resolvedButtonText = apiData?.buttonText || apiData?.text || apiData?.label || apiData?.title || element.content.buttonText || 'Button';

  const styles = currentElementStyles || {};

  // Resolve button colors - check useDefaultButton, useDefaultBackgroundColor, useDefaultTextColor flags
  const useDefaultButton = styles.useDefaultButton !== undefined ? styles.useDefaultButton : true;
  const useDefaultBackgroundColor = styles.useDefaultBackgroundColor !== undefined ? styles.useDefaultBackgroundColor : true;
  const useDefaultTextColor = styles.useDefaultTextColor !== undefined ? styles.useDefaultTextColor : true;
  
  let buttonColor = '#3b82f6';
  if (useDefaultButton || useDefaultBackgroundColor) {
    // Get default color from CSS variable
    if (typeof window !== 'undefined') {
      const websiteContent = document.querySelector('[data-website-content="true"]');
      const root = document.documentElement;
      let color = '';
      if (websiteContent) {
        color = getComputedStyle(websiteContent).getPropertyValue('--color-primary-bg').trim();
      }
      if (!color) {
        color = getComputedStyle(root).getPropertyValue('--color-primary-bg').trim();
      }
      if (color) {
        buttonColor = `var(--color-primary-bg, ${color})`;
      } else {
        buttonColor = 'var(--color-primary-bg, #3b82f6)';
      }
    } else {
      buttonColor = 'var(--color-primary-bg, #3b82f6)';
    }
  } else {
    buttonColor = styles.buttonColor && styles.buttonColor !== 'transparent' ? styles.buttonColor : '#3b82f6';
  }
  
  let buttonTextColor = '#ffffff';
  if (useDefaultButton || useDefaultTextColor) {
    // Get default color from CSS variable
    if (typeof window !== 'undefined') {
      const websiteContent = document.querySelector('[data-website-content="true"]');
      const root = document.documentElement;
      let color = '';
      if (websiteContent) {
        color = getComputedStyle(websiteContent).getPropertyValue('--color-primary-text').trim();
      }
      if (!color) {
        color = getComputedStyle(root).getPropertyValue('--color-primary-text').trim();
      }
      if (color) {
        buttonTextColor = `var(--color-primary-text, ${color})`;
      } else {
        buttonTextColor = 'var(--color-primary-text, #ffffff)';
      }
    } else {
      buttonTextColor = 'var(--color-primary-text, #ffffff)';
    }
  } else {
    buttonTextColor = styles.buttonTextColor && styles.buttonTextColor !== 'transparent' ? styles.buttonTextColor : '#ffffff';
  }

  // Get padding based on size preset or custom
  const getPadding = () => {
    if (styles.buttonPaddingTop || styles.buttonPaddingRight || styles.buttonPaddingBottom || styles.buttonPaddingLeft) {
      return {
        paddingTop: styles.buttonPaddingTop,
        paddingRight: styles.buttonPaddingRight,
        paddingBottom: styles.buttonPaddingBottom,
        paddingLeft: styles.buttonPaddingLeft,
      };
    }
    if (styles.buttonPadding) {
      return { padding: styles.buttonPadding };
    }
    // Default based on size
    if (styles.buttonSize === 'small') return { padding: '8px 16px' };
    if (styles.buttonSize === 'large') return { padding: '16px 32px' };
    return { padding: '12px 24px' };
  };

  // Get font size based on size preset or custom
  const getFontSize = () => {
    if (styles.buttonFontSize) return styles.buttonFontSize;
    if (styles.buttonSize === 'small') return '14px';
    if (styles.buttonSize === 'large') return '18px';
    return '16px';
  };

  // Get border width
  const getBorderWidth = () => {
    if (styles.buttonBorderTopWidth || styles.buttonBorderRightWidth || styles.buttonBorderBottomWidth || styles.buttonBorderLeftWidth) {
      return {
        borderTopWidth: styles.buttonBorderTopWidth,
        borderRightWidth: styles.buttonBorderRightWidth,
        borderBottomWidth: styles.buttonBorderBottomWidth,
        borderLeftWidth: styles.buttonBorderLeftWidth,
      };
    }
    return { borderWidth: styles.buttonBorderWidth || '0px' };
  };

  // Get alignment
  const getAlignment = (): React.CSSProperties => {
    const alignment = styles.buttonAlignment || styles.textAlign || 'center';
    switch (alignment) {
      case 'left': return { textAlign: 'left' as const };
      case 'right': return { textAlign: 'right' as const };
      case 'full': return { width: '100%', display: 'block' };
      default: return { textAlign: 'center' as const };
    }
  };

  // Get icon position and gap
  const iconPosition = styles.iconPosition || 'left';
  const iconGap = styles.buttonGap || (element.content.iconName ? '8px' : '0');
  
  const getIconOrder = () => {
    if (!element.content.iconName) return {};
    return iconPosition === 'right' ? { order: 2 } : { order: 0 };
  };

  const getTextOrder = () => {
    if (!element.content.iconName) return {};
    return iconPosition === 'right' ? { order: 0 } : { order: 1 };
  };

  const getFlexDirection = () => {
    if (!element.content.iconName) return 'row';
    return (iconPosition === 'top' || iconPosition === 'bottom') ? 'column' : 'row';
  };

  // Generate unique ID for hover/active/focus styles
  const buttonId = `button-${element.id}`;
  const hasHoverEffects = !builderMode && (styles.buttonHoverTransform || styles.buttonHoverBoxShadow);
  const hasActiveState = !builderMode && (styles.buttonActiveColor || styles.buttonActiveTextColor);
  const hasFocusRing = !builderMode && (styles.buttonFocusRingColor || styles.buttonFocusRingWidth);

  // Build animation style
  const getAnimationStyle = () => {
    if (!styles.buttonAnimation || styles.buttonAnimation === 'none') return {};
    
    const duration = styles.buttonAnimationDuration || '1s';
    const delay = styles.buttonAnimationDelay || '0s';
    const iteration = styles.buttonAnimationIteration || '1';
    
    let animationName = '';
    switch (styles.buttonAnimation) {
      case 'fade': animationName = 'fadeIn'; break;
      case 'slide': animationName = 'slideIn'; break;
      case 'bounce': animationName = 'bounce'; break;
      case 'pulse': animationName = 'pulse'; break;
      default: return {};
    }
    
    return {
      animation: `${animationName} ${duration} ${delay} ${iteration}`,
    };
  };

  // Build focus ring style
  const getFocusRingStyle = () => {
    if (!styles.buttonFocusRingColor && !styles.buttonFocusRingWidth) return {};
    const ringColor = styles.buttonFocusRingColor || '#3b82f6';
    const ringWidth = styles.buttonFocusRingWidth || '2px';
    return {
      '--focus-ring-color': ringColor,
      '--focus-ring-width': ringWidth,
    } as React.CSSProperties;
  };

  // Get responsive values based on breakpoint (we'll need activeBreakpoint prop)
  // For now, using desktop values as default
  const getResponsiveValue = (desktop: string | undefined, tablet: string | undefined, mobile: string | undefined) => {
    // TODO: Add activeBreakpoint prop to ButtonElement
    return desktop || tablet || mobile;
  };

  // Get responsive button width
  const responsiveWidth = getResponsiveValue(
    styles.buttonWidth,
    styles.buttonWidthTablet,
    styles.buttonWidthMobile
  );

  // Get responsive font size
  const responsiveFontSize = getResponsiveValue(
    styles.buttonFontSize,
    styles.buttonFontSizeTablet,
    styles.buttonFontSizeMobile
  ) || getFontSize();

  // Get responsive padding
  const responsivePadding = getResponsiveValue(
    styles.buttonPadding,
    styles.buttonPaddingTablet,
    styles.buttonPaddingMobile
  );

  const buttonStyle: React.CSSProperties = {
    backgroundColor: buttonColor,
    color: buttonTextColor,
    ...(responsivePadding ? { padding: responsivePadding } : getPadding()),
    fontSize: responsiveFontSize,
    fontFamily: styles.buttonFontFamily,
    fontWeight: styles.buttonFontWeight || '500',
    lineHeight: styles.buttonLineHeight,
    letterSpacing: styles.buttonLetterSpacing,
    textTransform: styles.buttonTextTransform || 'none',
    textDecoration: styles.buttonTextDecoration || 'none',
    borderRadius: styles.buttonBorderRadius || '6px',
    ...getBorderWidth(),
    borderStyle: styles.buttonBorderStyle || 'solid',
    borderColor: styles.buttonBorderColor || 'transparent',
    boxShadow: styles.buttonBoxShadow,
    textShadow: styles.buttonTextShadow,
    opacity: styles.buttonOpacity || '1',
    transform: styles.buttonTransform,
    width: responsiveWidth || styles.buttonWidth || (styles.buttonAlignment === 'full' ? '100%' : undefined),
    minWidth: styles.buttonMinWidth,
    maxWidth: styles.buttonMaxWidth,
    height: styles.buttonHeight,
    display: 'inline-flex',
    flexDirection: getFlexDirection() as any,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iconGap,
    transition: styles.buttonHoverTransition || 'all 0.3s ease',
    cursor: builderMode ? 'default' : 'pointer',
    outline: styles.buttonFocusOutline,
    outlineColor: styles.buttonFocusOutlineColor,
    ...getAnimationStyle(),
    ...getFocusRingStyle(),
  };

  const containerStyle = {
    ...getAlignment(),
  };

  // Get button type
  const buttonType = element.content.buttonType || 'link';
  const isDisabled = element.content.buttonDisabled || false;
  const isLoading = element.content.buttonLoading || false;

  // Get link target and rel
  const getLinkTarget = () => {
    if (buttonType !== 'link') return undefined;
    if (element.content.buttonTarget) return element.content.buttonTarget;
    // Auto-detect for external links
    if (element.content.buttonLink?.startsWith('http')) return '_blank';
    return '_self';
  };

  const getLinkRel = () => {
    if (buttonType !== 'link') return undefined;
    if (element.content.buttonRel) return element.content.buttonRel;
    // Auto-add for external links
    if (element.content.buttonLink?.startsWith('http') && element.content.buttonTarget === '_blank') {
      return 'noopener noreferrer';
    }
    return undefined;
  };

  // Apply disabled styles
  if (isDisabled && !builderMode) {
    buttonStyle.opacity = '0.6';
    buttonStyle.cursor = 'not-allowed';
    buttonStyle.pointerEvents = 'none';
  }

  // Button content
  const buttonContent = (
    <>
      {isLoading && (
        <span className="inline-block animate-spin mr-2" style={{ fontSize: '14px' }}>
          ⟳
        </span>
      )}
      {element.content.iconName && iconPosition !== 'right' && iconPosition !== 'bottom' && (
        <span 
          style={{ 
            fontSize: styles.iconSize || '20px', 
            color: styles.iconColor || buttonTextColor,
            ...getIconOrder(),
          }}
        >
          {element.content.iconName}
        </span>
      )}
      <span
        contentEditable={builderMode && !isLoading}
        suppressContentEditableWarning
        className="outline-none focus:ring-2 focus:ring-blue-400 rounded px-1"
        style={getTextOrder()}
        onBlur={(e) => {
          if (!builderMode) return;
          const newText = e.currentTarget.textContent || '';
          updateElement(sectionId, rowId, colId, element.id, { content: { ...element.content, buttonText: newText } }); 
        }}
      >
        {apiLoading ? 'Loading...' : resolvedButtonText}
      </span>
      {element.content.iconName && (iconPosition === 'right' || iconPosition === 'bottom') && (
        <span 
          style={{ 
            fontSize: styles.iconSize || '20px', 
            color: styles.iconColor || buttonTextColor,
            ...getIconOrder(),
          }}
        >
          {element.content.iconName}
        </span>
      )}
    </>
  );

  // Build ARIA attributes
  const ariaAttributes: any = {};
  if (styles.buttonAriaLabel) ariaAttributes['aria-label'] = styles.buttonAriaLabel;
  if (styles.buttonAriaDescription) ariaAttributes['aria-describedby'] = styles.buttonAriaDescription;
  if (styles.buttonAriaPressed !== undefined) ariaAttributes['aria-pressed'] = styles.buttonAriaPressed;
  if (styles.buttonAriaExpanded !== undefined) ariaAttributes['aria-expanded'] = styles.buttonAriaExpanded;

  // Build custom className
  const customClassName = styles.buttonCustomClass ? styles.buttonCustomClass.split(' ').filter(Boolean).join(' ') : '';

  // Handle onClick
  const handleClick = (e: React.MouseEvent) => {
    if (builderMode) return;
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (styles.buttonOnClick) {
      try {
        // eslint-disable-next-line no-eval
        eval(styles.buttonOnClick);
      } catch (error) {
        console.error('Button onClick error:', error);
      }
    }
  };

  return (
    <>
      {/* Animation keyframes */}
      {styles.buttonAnimation && styles.buttonAnimation !== 'none' && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from { transform: translateY(-10px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `
        }} />
      )}
      {/* Hover, Active, Focus styles */}
      {(hasHoverEffects || hasActiveState || hasFocusRing) && (
        <style dangerouslySetInnerHTML={{
          __html: `
            .${buttonId}:hover {
              ${styles.buttonHoverTransform ? `transform: ${styles.buttonHoverTransform} !important;` : ''}
              ${styles.buttonHoverBoxShadow ? `box-shadow: ${styles.buttonHoverBoxShadow} !important;` : ''}
            }
            .${buttonId}:active {
              ${styles.buttonActiveColor ? `background-color: ${styles.buttonActiveColor} !important;` : ''}
              ${styles.buttonActiveTextColor ? `color: ${styles.buttonActiveTextColor} !important;` : ''}
            }
            .${buttonId}:focus {
              ${styles.buttonFocusRingColor && styles.buttonFocusRingWidth 
                ? `box-shadow: 0 0 0 ${styles.buttonFocusRingWidth} ${styles.buttonFocusRingColor} !important;` 
                : ''}
            }
          `
        }} />
      )}
      <div style={containerStyle}>
        {buttonType === 'link' && (
          <a
            href={isDisabled ? undefined : (element.content.buttonLink || '#')}
            target={getLinkTarget()}
            rel={getLinkRel()}
            className={`${buttonId} ${customClassName} ${builderMode ? 'pointer-events-none' : ''}`}
            style={buttonStyle}
            onClick={handleClick}
            {...ariaAttributes}
            onMouseEnter={(e) => {
              if (!builderMode && !isDisabled) {
                e.currentTarget.style.backgroundColor = styles.buttonHoverColor || buttonColor || '#2563eb';
                e.currentTarget.style.color = styles.buttonHoverTextColor || buttonTextColor || '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!builderMode && !isDisabled) {
                e.currentTarget.style.backgroundColor = buttonColor;
                e.currentTarget.style.color = buttonTextColor;
              }
            }}
          >
            {buttonContent}
          </a>
        )}
        {buttonType === 'button' && (
          <button
            type="button"
            disabled={isDisabled}
            className={`${buttonId} ${customClassName} ${builderMode ? 'pointer-events-none' : ''}`}
            style={buttonStyle}
            onClick={handleClick}
            {...ariaAttributes}
            onMouseEnter={(e) => {
              if (!builderMode && !isDisabled) {
                e.currentTarget.style.backgroundColor = styles.buttonHoverColor || buttonColor || '#2563eb';
                e.currentTarget.style.color = styles.buttonHoverTextColor || buttonTextColor || '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!builderMode && !isDisabled) {
                e.currentTarget.style.backgroundColor = buttonColor;
                e.currentTarget.style.color = buttonTextColor;
              }
            }}
          >
            {buttonContent}
          </button>
        )}
        {buttonType === 'submit' && (
          <button
            type="submit"
            disabled={isDisabled}
            className={`${buttonId} ${customClassName} ${builderMode ? 'pointer-events-none' : ''}`}
            style={buttonStyle}
            onClick={handleClick}
            {...ariaAttributes}
            onMouseEnter={(e) => {
              if (!builderMode && !isDisabled) {
                e.currentTarget.style.backgroundColor = styles.buttonHoverColor || buttonColor || '#2563eb';
                e.currentTarget.style.color = styles.buttonHoverTextColor || buttonTextColor || '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!builderMode && !isDisabled) {
                e.currentTarget.style.backgroundColor = buttonColor;
                e.currentTarget.style.color = buttonTextColor;
              }
            }}
          >
            {buttonContent}
          </button>
        )}
      </div>
    </>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(ButtonElement, (prevProps, nextProps) => {
  // Re-render if element content or styles changed
  if (prevProps.element.id !== nextProps.element.id) return false;
  if (prevProps.element.content.buttonText !== nextProps.element.content.buttonText) return false;
  if (JSON.stringify(prevProps.element.styles) !== JSON.stringify(nextProps.element.styles)) return false;
  if (JSON.stringify(prevProps.currentElementStyles) !== JSON.stringify(nextProps.currentElementStyles)) return false;
  if (prevProps.builderMode !== nextProps.builderMode) return false;
  if (prevProps.sectionId !== nextProps.sectionId) return false;
  if (prevProps.rowId !== nextProps.rowId) return false;
  if (prevProps.colId !== nextProps.colId) return false;
  // Props are equal, skip re-render
  return true;
});
