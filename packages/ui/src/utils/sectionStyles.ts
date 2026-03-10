import { useMemo } from 'react';

/**
 * Build section background based on explicit backgroundType
 * Priority: backgroundType > backward compatibility (gradientColors > API image > backgroundImage > backgroundColor)
 */
export function buildSectionBackground(options: {
  customStyles: Record<string, any>;
  apiImage?: string;
  defaultBackground?: string;
}): string {
  const { customStyles, apiImage, defaultBackground = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" } = options;

  // Get explicit backgroundType (with backward compatibility)
  const backgroundType = customStyles.backgroundType || (() => {
    // Backward compatibility: infer backgroundType from existing properties
    if (customStyles.backgroundVideoUrl) return 'video';
    if (customStyles.gradientColors) return 'gradient';
    if (apiImage || customStyles.backgroundImage) return 'image';
    if (customStyles.backgroundColor && customStyles.backgroundColor !== 'transparent') return 'color';
    return 'none';
  })();

  // Apply background based on explicit backgroundType
  if (backgroundType === 'none') {
    return 'transparent';
  }

  if (backgroundType === 'color') {
    return customStyles.backgroundColor || 'transparent';
  }

  if (backgroundType === 'image') {
    // Priority 1: API image
    if (apiImage) {
      return `url('${apiImage}')`;
    }
    // Priority 2: Custom backgroundImage
    if (customStyles.backgroundImage) {
      // Check if it's a gradient (legacy support)
      if (customStyles.backgroundImage.startsWith('linear-gradient') || 
          customStyles.backgroundImage.startsWith('radial-gradient')) {
        return customStyles.backgroundImage;
      }
      // It's an image URL
      return `url('${customStyles.backgroundImage}')`;
    }
    // Fallback if image type selected but no image
    return 'transparent';
  }

  if (backgroundType === 'gradient') {
    if (customStyles.gradientColors) {
      try {
        const colors = typeof customStyles.gradientColors === 'string' 
          ? JSON.parse(customStyles.gradientColors) 
          : customStyles.gradientColors;
        const colorStops = Array.isArray(colors) 
          ? colors.map((c: any) => `${c.color || c} ${c.stop || ''}`).join(', ')
          : '';
        if (customStyles.gradientType === 'radial') {
          return `radial-gradient(${customStyles.gradientDirection || 'center'}, ${colorStops})`;
        }
        return `linear-gradient(${customStyles.gradientAngle || '90deg'}, ${colorStops})`;
      } catch (e) {
        console.error('[SectionStyles] Error parsing gradient colors:', e);
      }
    }
    // Fallback for gradient type
    return defaultBackground;
  }

  if (backgroundType === 'video') {
    // Video backgrounds are handled separately in rendering
    // Return transparent here - video element will be rendered separately
    return 'transparent';
  }

  // Fallback: Use theme surface color as default
  return 'var(--color-surface, #0E1214)';
}

/**
 * Check if background is an image (not gradient or color)
 */
export function isImageBackground(background: string): boolean {
  return background.startsWith('url(') && 
         !background.startsWith('linear-gradient') && 
         !background.startsWith('radial-gradient');
}

/**
 * Build section styles with proper defaults and merging
 * Returns both section styles and background image wrapper info for opacity support
 */
export function useSectionStyles(options: {
  customStyles: Record<string, any>;
  apiImage?: string;
  defaultBackground?: string;
  isSelected: boolean;
  propsStyle?: React.CSSProperties;
  defaultMinHeight?: number;
}): {
  sectionStyle: React.CSSProperties;
  backgroundWrapper: React.CSSProperties | null;
  overlay: React.CSSProperties | null;
  videoBackground: { url: string; poster?: string } | null;
} {
  const {
    customStyles,
    apiImage,
    defaultBackground,
    isSelected,
    propsStyle = {},
    defaultMinHeight = 500
  } = options;

  return useMemo(() => {
    const backgroundType = customStyles.backgroundType || (() => {
      if (customStyles.backgroundVideoUrl) return 'video';
      if (customStyles.gradientColors) return 'gradient';
      if (apiImage || customStyles.backgroundImage) return 'image';
      if (customStyles.backgroundColor && customStyles.backgroundColor !== 'transparent') return 'color';
      return 'none';
    })();
    
    const background = buildSectionBackground({ customStyles, apiImage, defaultBackground });
    const isImageBg = isImageBackground(background);
    const bgImageOpacity = customStyles.backgroundImageOpacity !== undefined ? customStyles.backgroundImageOpacity : 1;
    const needsBgWrapper = isImageBg && bgImageOpacity < 1;
    const isVideoBg = backgroundType === 'video' && customStyles.backgroundVideoUrl;
    
    // Handle overlay: overlayEnabled, overlayColor, overlayOpacity
    const overlayEnabled = customStyles.overlayEnabled !== false; // Default to true if not explicitly false
    const overlayColor = customStyles.overlayColor || 'rgba(0, 0, 0, 0.6)'; // Default dark overlay
    const overlayOpacity = customStyles.overlayOpacity !== undefined ? customStyles.overlayOpacity : 0.6;
    
    // Convert overlayColor + overlayOpacity to rgba if needed
    let finalOverlayColor = overlayColor;
    if (typeof overlayColor === 'string') {
      if (overlayColor.startsWith('rgba(')) {
        // Extract existing rgba values and apply overlayOpacity
        const rgbaMatch = overlayColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (rgbaMatch) {
          finalOverlayColor = `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${overlayOpacity})`;
        }
      } else if (overlayColor.startsWith('rgb(')) {
        // Convert rgb to rgba with overlayOpacity
        const rgbMatch = overlayColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          finalOverlayColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${overlayOpacity})`;
        }
      } else if (overlayColor.startsWith('#')) {
        // Convert hex color to rgba with overlayOpacity
        const hex = overlayColor.replace('#', '');
        if (hex.length === 6 || hex.length === 3) {
          const r = hex.length === 6 ? parseInt(hex.substring(0, 2), 16) : parseInt(hex[0] + hex[0], 16);
          const g = hex.length === 6 ? parseInt(hex.substring(2, 4), 16) : parseInt(hex[1] + hex[1], 16);
          const b = hex.length === 6 ? parseInt(hex.substring(4, 6), 16) : parseInt(hex[2] + hex[2], 16);
          finalOverlayColor = `rgba(${r}, ${g}, ${b}, ${overlayOpacity})`;
        }
      }
    }

    // Handle padding - ensure full width (NO horizontal padding)
    // Sections must NEVER have default horizontal padding
    // Only allow vertical padding if explicitly set by user
    let finalPadding: string | undefined = undefined;
    if (customStyles.padding !== undefined && customStyles.padding !== null && customStyles.padding !== '') {
      const sectionPadding = String(customStyles.padding);
      if (sectionPadding.includes(' ')) {
        // If padding has multiple values, extract only vertical (top/bottom)
        const parts = sectionPadding.split(' ');
        if (parts.length >= 2) {
          finalPadding = `${parts[0]} 0`; // top/bottom only, no left/right
        } else {
          finalPadding = sectionPadding;
        }
      } else {
        // Single value - apply only to top/bottom, not sides
        finalPadding = `${sectionPadding} 0`;
      }
    }
    // If no padding is set, use 0 (no padding at all)
    if (finalPadding === undefined) {
      finalPadding = '0';
    }

    // Clean up conflicting properties
    const { 
      paddingLeft: _paddingLeft, 
      paddingRight: _paddingRight, 
      marginLeft: _marginLeft, 
      marginRight: _marginRight,
      backgroundColor: _backgroundColor, // Remove backgroundColor - we handle it explicitly based on backgroundType
      ...cleanCustomStyles 
    } = customStyles;
    const { 
      paddingLeft: __paddingLeft, 
      paddingRight: __paddingRight, 
      marginLeft: ___marginLeft, 
      marginRight: ____marginRight,
      backgroundColor: __backgroundColor, // Remove backgroundColor from propsStyle too
      ...cleanPropsStyle 
    } = propsStyle;

    // CRITICAL: SECTION DEFAULTS (Elementor-style):
    // - display: block (ALWAYS block-level, NEVER flex/grid)
    // - width: 100% (full width)
    // - maxWidth: none (no max-width constraint)
    // - position: relative (for absolute positioning of children)
    // - overflow: visible (no clipping)
    // Note: Sections should NEVER have flex/grid layouts - only containers inside sections should have layouts
    // This is a strict rule: Sections are structural wrappers only

    // Build base styles
    const baseStyles: React.CSSProperties = {
      position: customStyles.position || "relative",
      width: "100%",
      maxWidth: customStyles.maxWidth !== undefined ? customStyles.maxWidth : "none", // Default to none, not 100%
      minHeight: customStyles.minHeight || defaultMinHeight,
      height: customStyles.height,
      boxSizing: "border-box",
      // CRITICAL: Sections are ALWAYS block-level (Elementor-style)
      // Never allow flex/grid layouts on sections
      display: "block",
      // Background - handle image with opacity using wrapper approach
      // Don't apply opacity here - it would affect children. Opacity will be applied to background layers only.
      ...(needsBgWrapper ? {
        // When using background image with opacity, set base background color ONLY if backgroundType is color
        position: 'relative' as const,
        backgroundColor: backgroundType === 'color' ? (customStyles.backgroundColor || 'transparent') : 'transparent',
      } : {
        // Normal background (no opacity needed)
        background: background,
        backgroundSize: isImageBg ? (customStyles.backgroundSize || 'cover') : undefined,
        backgroundPosition: isImageBg ? (customStyles.backgroundPosition || 'center') : undefined,
        backgroundRepeat: isImageBg ? (customStyles.backgroundRepeat || 'no-repeat') : undefined,
        backgroundAttachment: isImageBg ? (customStyles.backgroundAttachment || 'scroll') : undefined,
        // CRITICAL: Only apply backgroundColor when backgroundType is 'color'
        // For image/gradient/video, backgroundColor must be transparent or undefined
        backgroundColor: backgroundType === 'color' ? (customStyles.backgroundColor || 'transparent') : (backgroundType === 'none' ? 'transparent' : undefined),
      }),
      // Don't apply opacity to section element - it would affect all children
      // Opacity will be applied to background layers only via bgWrapperStyles
      // Colors and text - use theme colors (like multicolor theme)
      color: customStyles.color || "var(--color-heading, #F8FAFC)",
      textAlign: (customStyles.textAlign as any) || "center",
      // Spacing - ensure full width
      padding: finalPadding,
      paddingTop: customStyles.paddingTop,
      paddingBottom: customStyles.paddingBottom,
      paddingLeft: 0,
      paddingRight: 0,
      margin: customStyles.margin || 0,
      marginTop: customStyles.marginTop || 0,
      marginBottom: customStyles.marginBottom || 0,
      marginLeft: 0,
      marginRight: 0,
      // Overflow - default to visible (no clipping)
      overflow: customStyles.overflow !== undefined ? customStyles.overflow : "visible",
      overflowX: customStyles.overflowX,
      overflowY: customStyles.overflowY,
      // Positioning
      top: customStyles.top,
      right: customStyles.right,
      bottom: customStyles.bottom,
      left: customStyles.left,
      zIndex: customStyles.zIndex || 1,
      // Borders and shadows
      border: customStyles.border,
      borderTop: customStyles.borderTop,
      borderRight: customStyles.borderRight,
      borderBottom: customStyles.borderBottom,
      borderLeft: customStyles.borderLeft,
      borderRadius: customStyles.borderRadius,
      boxShadow: customStyles.boxShadow,
      // FIX ISSUE 1: Remove legacy selection outline for sections
      // Section selection is handled by ContainerHoverOverlay system
      outline: undefined, // Sections use overlay system, not legacy outline
      outlineOffset: undefined,
      transition: 'outline 0.15s ease-in-out, outline-offset 0.15s ease-in-out',
    };

    // Merge with any remaining custom styles and props
    const finalStyles = {
      ...baseStyles,
      ...cleanCustomStyles,
      ...cleanPropsStyle,
    };
    
    // Get section opacity (for background only, not children)
    const sectionOpacity = customStyles.opacity !== undefined ? customStyles.opacity : 1;
    
    // Return styles, background wrapper, and overlay info
    return {
      sectionStyle: finalStyles,
      backgroundWrapper: needsBgWrapper ? {
        backgroundImage: background,
        backgroundSize: customStyles.backgroundSize || 'cover',
        backgroundPosition: customStyles.backgroundPosition || 'center',
        backgroundRepeat: customStyles.backgroundRepeat || 'no-repeat',
        opacity: bgImageOpacity * sectionOpacity, // Combine both opacities
      } : (sectionOpacity < 1 && backgroundType === 'color' ? {
        // If section has opacity but no background image AND backgroundType is color, create a background color layer
        backgroundColor: customStyles.backgroundColor || 'transparent',
        opacity: sectionOpacity,
      } : null),
      overlay: overlayEnabled && (isImageBg || isVideoBg) ? {
        backgroundColor: finalOverlayColor,
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 1, // Above background (zIndex 0), below content (zIndex 2+)
        pointerEvents: 'none' as const, // Allow clicks to pass through to section
      } : null,
      videoBackground: isVideoBg ? {
        url: customStyles.backgroundVideoUrl,
        poster: customStyles.backgroundVideoPoster || undefined,
      } : null,
    };
  }, [customStyles, apiImage, defaultBackground, isSelected, propsStyle, defaultMinHeight]);
}

