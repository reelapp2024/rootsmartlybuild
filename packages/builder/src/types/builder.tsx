// Type definitions for the builder
// Element interface - individual elements inside a column
export interface Element {
  id: string;
  customId?: string;
  customClasses?: string;
  type: 'heading' | 'text' | 'image' | 'button' | 'video' | 'icon' | 'html';
  // API Configuration
  api?: {
    enabled?: boolean;
    url?: string;
    method?: 'GET' | 'POST';
    refreshInterval?: number; // in milliseconds, 0 = no auto-refresh
    dataPath?: string; // JSON path to extract data (e.g., "data.title")
    fallbackToContent?: boolean; // Use element.content if API fails
  };
  content: {
    heading?: string;
    headingLink?: string;
    headingLinkTarget?: '_self' | '_blank' | '_parent' | '_top';
    headingLinkRel?: string;
    description?: string;
    descriptionHtml?: string;
    text?: string;
    imageUrl?: string;
    imageUrlMobile?: string;
    imageUrlTablet?: string;
    imageUrlDesktop?: string;
    imageAlt?: string;
    imageCaption?: string;
    imageLink?: string;
    buttonText?: string;
    buttonLink?: string;
    buttonType?: 'link' | 'button' | 'submit';
    buttonTarget?: '_self' | '_blank' | '_parent' | '_top';
    buttonRel?: string;
    iconName?: string;
    buttonDisabled?: boolean;
    buttonLoading?: boolean;
    videoUrl?: string;
    videoSourceType?: 'youtube' | 'vimeo' | 'direct' | 'custom';
    htmlCode?: string;
    htmlCodeMobile?: string;
    htmlCodeTablet?: string;
    htmlCodeDesktop?: string;
  };
  styles: {
    textColor?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    borderWidth?: string;
    borderTopWidth?: string;
    borderRightWidth?: string;
    borderBottomWidth?: string;
    borderLeftWidth?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderTopStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderRightStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderBottomStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderLeftStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderColor?: string;
    borderTopColor?: string;
    borderRightColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderRadius?: string;
    borderTopLeftRadius?: string;
    borderTopRightRadius?: string;
    borderBottomRightRadius?: string;
    borderBottomLeftRadius?: string;
    boxShadow?: string;
    boxShadowColor?: string;
    boxShadowBlur?: string;
    boxShadowSpread?: string;
    boxShadowOffsetX?: string;
    boxShadowOffsetY?: string;
    headingFontFamily?: string;
    headingFontSize?: string;
    headingFontWeight?: string;
    headingLineHeight?: string;
    headingTextAlign?: 'left' | 'center' | 'right' | 'justify';
    headingLetterSpacing?: string;
    headingTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    headingTextDecoration?: 'none' | 'underline' | 'line-through';
    headingTag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    descriptionFontFamily?: string;
    descriptionFontSize?: string;
    descriptionFontWeight?: string;
    descriptionLineHeight?: string;
    descriptionTextAlign?: 'left' | 'center' | 'right' | 'justify';
    descriptionLetterSpacing?: string;
    descriptionTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    descriptionTextDecoration?: 'none' | 'underline' | 'line-through';
    buttonColor?: string;
    buttonHoverColor?: string;
    buttonTextColor?: string;
    buttonHoverTextColor?: string;
    buttonActiveColor?: string;
    buttonActiveTextColor?: string;
    buttonDisabledColor?: string;
    buttonDisabledTextColor?: string;
    buttonSize?: 'small' | 'medium' | 'large' | 'custom';
    buttonPadding?: string;
    buttonPaddingTop?: string;
    buttonPaddingRight?: string;
    buttonPaddingBottom?: string;
    buttonPaddingLeft?: string;
    buttonWidth?: string;
    buttonHeight?: string;
    buttonMinWidth?: string;
    buttonMaxWidth?: string;
    buttonGap?: string;
    buttonFontFamily?: string;
    buttonFontSize?: string;
    buttonFontWeight?: string;
    buttonLineHeight?: string;
    buttonLetterSpacing?: string;
    buttonTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    buttonTextDecoration?: 'none' | 'underline' | 'line-through';
    buttonBorderRadius?: string;
    buttonBorderTopLeftRadius?: string;
    buttonBorderTopRightRadius?: string;
    buttonBorderBottomLeftRadius?: string;
    buttonBorderBottomRightRadius?: string;
    buttonBorderWidth?: string;
    buttonBorderTopWidth?: string;
    buttonBorderRightWidth?: string;
    buttonBorderBottomWidth?: string;
    buttonBorderLeftWidth?: string;
    buttonBorderColor?: string;
    buttonBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    buttonAlignment?: 'left' | 'center' | 'right' | 'full';
    buttonBoxShadow?: string;
    buttonTextShadow?: string;
    buttonOpacity?: string;
    buttonTransform?: string;
    buttonHoverTransform?: string;
    buttonHoverTransition?: string;
    buttonHoverBoxShadow?: string;
    // Button Phase 3 - Active & Focus States
    buttonFocusOutline?: string;
    buttonFocusOutlineColor?: string;
    buttonFocusRingColor?: string;
    buttonFocusRingWidth?: string;
    // Button Phase 3 - Animations
    buttonAnimation?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
    buttonAnimationDuration?: string;
    buttonAnimationDelay?: string;
    buttonAnimationIteration?: string;
    // Button Phase 3 - Responsive
    buttonWidthMobile?: string;
    buttonWidthTablet?: string;
    buttonPaddingMobile?: string;
    buttonPaddingTablet?: string;
    buttonFontSizeMobile?: string;
    buttonFontSizeTablet?: string;
    // Button Phase 3 - Accessibility
    buttonAriaLabel?: string;
    buttonAriaDescription?: string;
    buttonAriaPressed?: boolean;
    buttonAriaExpanded?: boolean;
    // Button Phase 3 - Advanced
    buttonCustomClass?: string;
    buttonOnClick?: string;
    iconSize?: string;
    iconColor?: string;
    iconPosition?: 'left' | 'right' | 'top' | 'bottom';
    // General element properties
    width?: string;
    height?: string;
    opacity?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    // Video-specific properties
    videoWidth?: string;
    videoHeight?: string;
    videoAspectRatio?: '16:9' | '4:3' | '1:1' | '21:9' | '9:16' | 'custom';
    videoAutoplay?: boolean;
    videoLoop?: boolean;
    videoMuted?: boolean;
    videoControls?: boolean;
    videoPreload?: 'none' | 'metadata' | 'auto';
    videoPoster?: string;
    videoLazyLoad?: boolean;
    videoOverlayText?: string;
    videoOverlayColor?: string;
    videoOverlayOpacity?: string;
    videoAlignment?: 'left' | 'center' | 'right' | 'full';
    // HTML-specific properties
    htmlWidth?: string;
    htmlHeight?: string;
    htmlMaxWidth?: string;
    htmlMaxHeight?: string;
    htmlMinWidth?: string;
    htmlMinHeight?: string;
    htmlOverflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    htmlOverflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
    htmlOverflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
    htmlAlignment?: 'left' | 'center' | 'right' | 'justify';
    htmlVerticalAlign?: 'top' | 'middle' | 'bottom';
    htmlSanitize?: boolean;
    htmlAllowScripts?: boolean;
    htmlLazyLoad?: boolean;
    htmlDeferScripts?: boolean;
    // Description-specific properties
    descriptionOverlayColor?: string;
    descriptionOverlayOpacity?: string;
    // Image-specific properties
    imageWidth?: string;
    imageHeight?: string;
    imageMinWidth?: string;
    imageMaxWidth?: string;
    imageMinHeight?: string;
    imageMaxHeight?: string;
    imageAspectRatio?: '16:9' | '4:3' | '1:1' | '21:9' | '9:16' | 'original' | 'custom';
    imageObjectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    imageObjectPosition?: 'top' | 'center' | 'bottom' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right' | 'custom';
    imageObjectPositionX?: string;
    imageObjectPositionY?: string;
    imageAlignment?: 'left' | 'center' | 'right' | 'full';
    imageOpacity?: string;
    imageFilter?: string;
    imageFilterGrayscale?: string;
    imageFilterBlur?: string;
    imageFilterBrightness?: string;
    imageFilterContrast?: string;
    imageFilterSaturate?: string;
    imageHoverOpacity?: string;
    imageHoverScale?: string;
    imageHoverFilter?: string;
    imageTransitionDuration?: string;
    // Image Phase 3 - Performance
    imageLazyLoad?: boolean;
    imagePlaceholder?: string;
    imagePlaceholderColor?: string;
    imageBlurPlaceholder?: boolean;
    // Image Phase 3 - Responsive (breakpoint-specific)
    imageWidthMobile?: string;
    imageWidthTablet?: string;
    imageHeightMobile?: string;
    imageHeightTablet?: string;
    imageObjectFitMobile?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    imageObjectFitTablet?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    imageAlignmentMobile?: 'left' | 'center' | 'right' | 'full';
    imageAlignmentTablet?: 'left' | 'center' | 'right' | 'full';
    // Image Phase 3 - Overlay
    imageOverlayText?: string;
    imageOverlayColor?: string;
    imageOverlayOpacity?: string;
    imageOverlayPosition?: 'top' | 'center' | 'bottom';
    mobile?: Partial<Element['styles']>;
    tablet?: Partial<Element['styles']>;
    desktop?: Partial<Element['styles']>;
  };
}

// Column interface - now a container for multiple elements
export interface Column {
  id: string;
  customId?: string;
  customClasses?: string;
  elements: Element[]; // Array of elements inside the column
  styles: {
    backgroundColor?: string;
    backgroundImage?: string;
    // Background Video
    backgroundVideo?: string;
    backgroundVideoAutoplay?: boolean;
    backgroundVideoLoop?: boolean;
    backgroundVideoMuted?: boolean;
    backgroundVideoOverlay?: boolean;
    // Gradient Background
    gradientType?: 'linear' | 'radial';
    gradientColors?: string; // JSON string of color stops
    gradientAngle?: string; // For linear: '0deg' to '360deg'
    gradientDirection?: string; // For radial: 'center', 'top', 'bottom', etc.
    // Animations
    animationType?: 'none' | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoomIn' | 'zoomOut';
    animationDelay?: string; // e.g., '0s', '0.5s'
    animationDuration?: string; // e.g., '1s', '2s';
    // Parallax
    parallaxEnabled?: boolean;
    parallaxSpeed?: string; // e.g., '0.5', '1', '2'
    // Overlay
    overlayColor?: string;
    overlayOpacity?: string;
    textColor?: string;
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    borderWidth?: string;
    borderTopWidth?: string;
    borderRightWidth?: string;
    borderBottomWidth?: string;
    borderLeftWidth?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderTopStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderRightStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderBottomStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderLeftStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderColor?: string;
    borderTopColor?: string;
    borderRightColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderRadius?: string;
    borderTopLeftRadius?: string;
    borderTopRightRadius?: string;
    borderBottomRightRadius?: string;
    borderBottomLeftRadius?: string;
    boxShadow?: string;
    boxShadowColor?: string;
    boxShadowBlur?: string;
    boxShadowSpread?: string;
    boxShadowOffsetX?: string;
    boxShadowOffsetY?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    // Height Controls
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    // Overflow Controls
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
    // Layout properties
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    flexGrow?: string | number;
    flexShrink?: string | number;
    flexBasis?: string;
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    gridColumn?: string;
    gridRow?: string;
    gridColumnStart?: string;
    gridColumnEnd?: string;
    gridRowStart?: string;
    gridRowEnd?: string;
    justifySelf?: 'auto' | 'start' | 'end' | 'center' | 'stretch';
    order?: number;
    // Position & Z-Index
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    zIndex?: string;
    mobile?: Partial<Column['styles']>;
    tablet?: Partial<Column['styles']>;
    desktop?: Partial<Column['styles']>;
  };
}

export interface Row {
  id: string;
  customId?: string;
  customClasses?: string;
  columns: Column[];
  styles: {
    backgroundColor?: string;
    backgroundImage?: string;
    // Background Video
    backgroundVideo?: string;
    backgroundVideoAutoplay?: boolean;
    backgroundVideoLoop?: boolean;
    backgroundVideoMuted?: boolean;
    backgroundVideoOverlay?: boolean;
    // Gradient Background
    gradientType?: 'linear' | 'radial';
    gradientColors?: string; // JSON string of color stops
    gradientAngle?: string; // For linear: '0deg' to '360deg'
    gradientDirection?: string; // For radial: 'center', 'top', 'bottom', etc.
    // Animations
    animationType?: 'none' | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoomIn' | 'zoomOut';
    animationDelay?: string; // e.g., '0s', '0.5s'
    animationDuration?: string; // e.g., '1s', '2s'
    // Parallax
    parallaxEnabled?: boolean;
    parallaxSpeed?: string; // e.g., '0.5', '1', '2'
    // Overlay
    overlayColor?: string;
    overlayOpacity?: string;
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    borderWidth?: string;
    borderTopWidth?: string;
    borderRightWidth?: string;
    borderBottomWidth?: string;
    borderLeftWidth?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderTopStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderRightStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderBottomStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderLeftStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderColor?: string;
    borderTopColor?: string;
    borderRightColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderRadius?: string;
    borderTopLeftRadius?: string;
    borderTopRightRadius?: string;
    borderBottomRightRadius?: string;
    borderBottomLeftRadius?: string;
    boxShadow?: string;
    boxShadowColor?: string;
    boxShadowBlur?: string;
    boxShadowSpread?: string;
    boxShadowOffsetX?: string;
    boxShadowOffsetY?: string;
    gap?: string;
    rowSpacing?: string;
    // Layout properties
    layoutType?: 'block' | 'flex' | 'grid';
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    gridTemplateColumns?: string;
    flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    rowGap?: string;
    width?: string;
    height?: string;
    minWidth?: string;
    maxWidth?: string;
    minHeight?: string;
    maxHeight?: string;
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
    // Position & Z-Index
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    zIndex?: string;
    mobile?: Partial<Row['styles']>;
    tablet?: Partial<Row['styles']>;
    desktop?: Partial<Row['styles']>;
  };
}

export interface Section {
  id: string;
  customId?: string;
  customClasses?: string;
  componentType?: string; // For custom components from registry (e.g., "HeroSection", "TestimonialSection")
  projectId?: string; // Project ID to pass to components
  // Storage for custom component element styles and props
  customElementStyles?: Record<string, React.CSSProperties>; // elId -> styles
  customElementProps?: Record<string, any>; // elId -> props (e.g., { text: "...", heading: "..." })
  // Custom component elements (for dynamic element management)
  customElements?: Array<{
    id: string;
    type: 'heading' | 'text' | 'description' | 'button' | 'image' | 'video' | 'icon' | 'html';
    elId: string; // Internal element ID used by component
    order: number; // For sorting/reordering
  }>;
  rows: Row[];
  styles: {
    // New nested background object architecture
    background?: {
      type: 'none' | 'color' | 'gradient' | 'image' | 'video';
      color?: string;
      image?: {
        url: string;
        position?: string;
        size?: string;
        repeat?: string;
      };
      gradient?: {
        type?: 'linear' | 'radial';
        colors?: Array<{ color: string; stop: string }>;
        angle?: string;
        direction?: string;
      };
      video?: {
        url?: string;
        autoplay?: boolean;
        loop?: boolean;
        muted?: boolean;
      };
      overlay?: {
        enabled?: boolean;
        color?: string;
        opacity?: number;
        blendMode?: string;
      };
    };
    // Legacy flat background properties (for backward compatibility)
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundType?: 'none' | 'color' | 'gradient' | 'image' | 'video';
    // Background Video
    backgroundVideo?: string;
    backgroundVideoUrl?: string;
    backgroundVideoAutoplay?: boolean;
    backgroundVideoLoop?: boolean;
    backgroundVideoMuted?: boolean;
    backgroundVideoOverlay?: boolean;
    backgroundVideoPoster?: string;
    backgroundVideoDisableOnMobile?: boolean;
    // Gradient Background
    gradientType?: 'linear' | 'radial';
    gradientColors?: string; // JSON string of color stops: [{color: '#ff0000', stop: '0%'}, {color: '#0000ff', stop: '100%'}]
    gradientAngle?: string; // For linear: '0deg' to '360deg'
    gradientDirection?: string; // For radial: 'center', 'top', 'bottom', etc.
    // Background Image Properties
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundRepeat?: string;
    backgroundAttachment?: string;
    // Animations
    animationType?: 'none' | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoomIn' | 'zoomOut';
    animationDelay?: string; // e.g., '0s', '0.5s'
    animationDuration?: string; // e.g., '1s', '2s'
    // Parallax
    parallaxEnabled?: boolean;
    parallaxSpeed?: string; // e.g., '0.5', '1', '2'
    overlayColor?: string;
    overlayOpacity?: string;
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    borderWidth?: string;
    borderTopWidth?: string;
    borderRightWidth?: string;
    borderBottomWidth?: string;
    borderLeftWidth?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderTopStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderRightStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderBottomStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderLeftStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderColor?: string;
    borderTopColor?: string;
    borderRightColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderRadius?: string;
    borderTopLeftRadius?: string;
    borderTopRightRadius?: string;
    borderBottomRightRadius?: string;
    borderBottomLeftRadius?: string;
    boxShadow?: string;
    boxShadowColor?: string;
    boxShadowBlur?: string;
    boxShadowSpread?: string;
    boxShadowOffsetX?: string;
    boxShadowOffsetY?: string;
    // Layout properties
    containerWidth?: 'full' | 'boxed';
    maxWidth?: string;
    containerAlignment?: 'left' | 'center' | 'right';
    minHeight?: string;
    height?: string;
    width?: string;
    layoutType?: 'block' | 'flex' | 'grid';
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    gridTemplateColumns?: string;
    rowGap?: string;
    gap?: string;
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    zIndex?: string;
    mobile?: Partial<Section['styles']>;
    tablet?: Partial<Section['styles']>;
    desktop?: Partial<Section['styles']>;
  };
}

// Type aliases for compatibility
export type ElementType = Element;
export type ColumnType = Column;

