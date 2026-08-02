
export type SectionType = 'navbar' | 'header' | 'hero' | 'about' | 'features' | 'services' | 'cta' | 'process' | 'footer' | 'testimonials' | 'pricing' | 'image-banner' | 'elements' | 'canvas' | 'canvasShowcase' | 'faq' | 'why-choose-us' | 'guarantee' | 'areas' | 'aboutservice' | 'servicehero' | 'abouthero' | 'missionvision' | 'corevalues' | 'usp' | 'promise' | 'relatedservices' | 'contacthero' | 'contactinfo' | 'contactform' | 'blogshero' | 'blogssearch' | 'blogslist' | 'blogarticlehero' | 'blogcontent' | 'blogauthor' | 'blogcomments' | 'blogrelated' | 'legalhero' | 'legalcontent' | 'sublocations' | 'locationmap' | 'areashero' | 'areastestimonials' | 'areasfaq'
 /** @deprecated Legacy area-detail twins — SectionRouter maps these to homepage types */
 | 'locationhero' | 'locationabout' | 'locationservices' | 'locationwhychoose' | 'locationprocess'
 | 'locationcta' | 'locationguarantee' | 'locationpromise' | 'locationtestimonials' | 'locationareas' | 'locationfaq'
 | 'aboutwhychoose' | 'aboutcta' | 'aboutfaq'
 | 'contactcta' | 'contactfaq'
 | 'serviceslisthero' | 'serviceslistgrid' | 'serviceslistwhychoose' | 'serviceslistcta' | 'serviceslistguarantee' | 'serviceslistprocess' | 'serviceslistareas' | 'serviceslistfaq'
 | 'servicedetailhero' | 'servicedetailabout' | 'servicedetailservices' | 'servicedetailprocess' | 'servicedetailcta' | 'servicedetailwhychoose' | 'servicedetailguarantee' | 'servicedetailtestimonials' | 'servicedetailfaq';

export type ElementType =
  // Layout
  | 'row'
  | 'column'
  // Basic
  | 'card'
  | 'heading'
  | 'text' 
  | 'button'
  | 'cta-button'
  | 'image'
  | 'video' 
  | 'icon' 
  | 'icon-box' 
  | 'image-box' 
  | 'list' 
  | 'star-rating' 
  | 'badge' 
  | 'highlight-text' 
  | 'blockquote'
  // Advanced
  | 'accordion'
  | 'faq'
  | 'toggle'
  | 'tabs'
  | 'progress-bar'
  | 'counter'
  | 'testimonial'
  | 'review-carousel'
  | 'alert-box'
  | 'pricing-table'
  | 'flip-box'
  | 'call-to-action'
  | 'countdown-timer'
  | 'logo-cloud'
  | 'stat-card'
  | 'user-avatars'
  | 'feature-box'
  | 'testimonial-card'
  | 'pricing-item'
  | 'trust-strip'
  | 'nav-menu'
  // Layout helpers
  | 'divider'
  | 'spacer';

// Comprehensive Style Interface based on "Common Properties" request
export interface ElementStyle {
    // 1. Typography (Basic)
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: string;
    letterSpacing?: string;
    textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    textDecoration?: 'none' | 'underline' | 'line-through';
    fontStyle?: 'normal' | 'italic';

    // 2. Backgrounds
    backgroundColor?: string;
    backgroundType?: 'none' | 'color' | 'gradient' | 'image' | 'video';
    backgroundImage?: string;
    backgroundPosition?: string; // e.g. 'center center'
    backgroundSize?: 'cover' | 'contain' | 'auto' | string;
    backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    backgroundAttachment?: 'scroll' | 'fixed' | 'local';
    
    backgroundGradient?: {
        type: 'linear' | 'radial';
        angle?: number; // for linear
        colors: { color: string; stop: number }[]; // Gradient stops
    };
    
    backgroundOverlay?: {
        enabled: boolean;
        color?: string; // Solid or Gradient string
        opacity?: number;
        blendMode?: string; // mix-blend-mode
    };

    // 3. Dimensions
    width?: string;
    height?: string;
    minWidth?: string;
    minHeight?: string;
    maxWidth?: string;
    maxHeight?: string;
    aspectRatio?: string;

    // 4. Spacing (Margin & Padding)
    // Supports string "10px" or object for individual sides
    padding?: string | { top?: string; right?: string; bottom?: string; left?: string };
    margin?: string | { top?: string; right?: string; bottom?: string; left?: string };
    
    // 5. Outline
    outline?: string;
    outlineOffset?: string;
    outlineColor?: string;
    outlineStyle?: string;
    outlineWidth?: string;

    // 6. Box Model
    textShadow?: string;
    boxSizing?: 'content-box' | 'border-box';

    // 7. Layout & Positioning
    display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none';
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    zIndex?: number;
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';

    // 8. Flexbox Controls
    flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    alignContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch';
    gap?: string; // Row and Column gap
    rowGap?: string;
    columnGap?: string;
    
    // Flex Item props
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: string;
    order?: number;
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';

    // 9. Grid Controls
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    gridTemplateAreas?: string;
    gridAutoFlow?: 'row' | 'column' | 'row dense' | 'column dense';
    gridAutoColumns?: string;
    gridAutoRows?: string;
    justifyItems?: 'start' | 'end' | 'center' | 'stretch';
    justifySelf?: 'start' | 'end' | 'center' | 'stretch';
    placeItems?: string;
    placeContent?: string;

    // 10. Effects & Filters
    opacity?: number; // 0 to 1
    visibility?: 'visible' | 'hidden' | 'collapse';
    filter?: string; // blur(), brightness(), contrast(), grayscale(), hue-rotate(), invert(), opacity(), saturate(), sepia(), drop-shadow()
    backdropFilter?: string; // Same as filter but for backdrop
    mixBlendMode?: string;
    
    // 11. Transforms
    transform?: string; // rotate(), scale(), skew(), translate(), matrix()
    transformOrigin?: string;
    perspective?: string;
    backfaceVisibility?: 'visible' | 'hidden';

    // 12. Transitions & Animations
    transition?: string; // property duration timing-function delay
    animation?: string; // name duration timing-function delay iteration-count direction fill-mode play-state

    // 13. Advanced / Misc
    cursor?: string; // pointer, default, text, move, etc.
    pointerEvents?: 'auto' | 'none';
    userSelect?: 'auto' | 'none' | 'text' | 'all';
    
    // Responsive Visibility (Helper for UI logic)
    hiddenOnDesktop?: boolean;
    hiddenOnTablet?: boolean;
    hiddenOnMobile?: boolean;
    
    // Accent Color support for form elements/custom elements
    accentColor?: string;
    secondaryButtonBorderColor?: string;
    iconColor?: string;
    iconBackgroundColor?: string;
    subheadingColor?: string;
    iconBgColor?: string;
    secondaryHeadingColor?: string;

    // Icon / FeatureBox / IconBox / StatCard element-specific keys.
    // Kept strongly typed instead of smuggled via the index signature so the
    // sidebar style editors and renderers can autocomplete them.
    iconSize?: string;
    iconContainerSize?: string;
    iconBorderRadius?: string;
    iconBorderColor?: string;
    iconBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    iconBorderWidth?: string;
    iconBorderTopLeftRadius?: string;
    iconBorderTopRightRadius?: string;
    iconBorderBottomLeftRadius?: string;
    iconBorderBottomRightRadius?: string;
    iconShadow?: string;

    // Button element-specific
    buttonVariant?: 'primary' | 'secondary' | 'ghost' | 'outline';

    // Image element-specific
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    boxShadow?: string;

    // Border radius per-corner overrides (for card/image/feature-box)
    borderTopLeftRadius?: string;
    borderTopRightRadius?: string;
    borderBottomLeftRadius?: string;
    borderBottomRightRadius?: string;

    // Legacy flat border fields (deprecated but still written by some editors)
    borderColor?: string;
    borderWidth?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'none';
    border?: string;
    borderRadius?: string;

    // Allow generic string keys for extensibility (to be phased out)
    [key: string]: any;
}

export interface WebsiteElement {
  id: string;
  type: ElementType;
  
  // Custom ID and Classes for Advanced Control
  customId?: string;
  customClasses?: string;
  
  content: {
    text?: string; // Main Title / Heading / Button Text
    subText?: string; // Description / Subtitle
    // Text marquee support (used by HeroMarquee and any text element)
    enableMarquee?: boolean;
    marqueeSpeed?: '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
    marqueeDirection?: 'left' | 'right';
    htmlTag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div' | 'span';
    textSize?: 'base' | 'small' | 'large' | 'xl' | 'subheading'; // Text size variant for p tags
    link?: string;
    src?: string; 
    alt?: string;
    icon?: string; 
    
    // Lists (Accordion, Tabs, Reviews, Pricing Features)
    items?: { 
        title?: string; 
        content?: string; 
        icon?: string; 
        link?: string;
        author?: string; // Testimonial
        role?: string;   // Testimonial
        avatar?: string; // Testimonial
        rating?: number; // Review
        price?: string; // Pricing Table
        src?: string;   // Logo Cloud / User Avatars
        alt?: string;   // Logo Cloud
    }[]; 
    
    rating?: number; 
    scale?: number; 
    badgeText?: string;
    highlightWord?: string;
    author?: string; 
    authorRole?: string; 
    
    // Advanced Fields
    percentage?: number; // Progress bar
    showPercentage?: boolean; // Progress bar
    
    startNumber?: number; // Counter
    targetNumber?: number; // Counter
    duration?: number; // Counter/Animation
    prefix?: string; // Counter
    suffix?: string; // Counter
    
    targetDate?: string; // Countdown
    
    price?: string; // Pricing Table
    currency?: string; // Pricing Table
    period?: string; // Pricing Table
    isPopular?: boolean; // Pricing Table
    
    alertType?: 'success' | 'warning' | 'error' | 'info'; // Alert Box
    dismissible?: boolean; // Alert Box
    
    frontTitle?: string; // Flipbox
    frontDesc?: string; // Flipbox
    backTitle?: string; // Flipbox
    backDesc?: string; // Flipbox
    flipDirection?: 'left' | 'right' | 'top' | 'bottom'; // Flipbox
    trigger?: 'hover' | 'click'; // Flipbox
    
    layout?: 'inline' | 'stacked' | 'left' | 'top' | 'vertical' | 'horizontal'; // Tabs, Testimonial, CTA
    
    [key: string]: any; 
  };
  
  // Use the new comprehensive ElementStyle interface
  style: ElementStyle;

  /**
   * Per-breakpoint style overrides. Only the diff from `style` is stored.
   * Rendered via CSS media queries, so section components stay breakpoint-unaware.
   */
  tabletStyle?: Partial<ElementStyle>;
  mobileStyle?: Partial<ElementStyle>;
  
  settings?: {
    animation?: 'fade' | 'slide' | 'zoom' | 'none';
    delay?: string;
    className?: string; // Legacy support, prefer customClasses at root
    hidden?: boolean; 
    autoplay?: boolean; // Carousels
    loop?: boolean; // Carousels
    speed?: number; // Carousels
    
    // Advanced Interaction Settings
    scrollTrigger?: boolean;
    sticky?: boolean;
    stickyTop?: string;
    parallax?: boolean;
    
    [key: string]: any; 
  };
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize?: string; // Base size
  fontWeight: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  color?: string; // Optional override
}

export interface Section {
  id: string;
  type: SectionType;
  // Specific content for preset sections (hero, features, etc.)
  content: {
    title?: string;
    subtitle?: string;
    subtitleTextSize?: 'base' | 'small' | 'large' | 'xl' | 'subheading'; // Store textSize directly for Hero subtitle
    description?: string;
    ctaText?: string;
    ctaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    links?: { label: string; href: string }[];
    items?: {
      id?: string;
      title?: string;
      description?: string;
      icon?: string;
      price?: string;
      features?: string[];
      author?: string;
      role?: string;
      avatar?: string;
      style?: Record<string, unknown>;
      [key: string]: unknown;
    }[];
    logo?: string;
    logoImageUrl?: string;
    /** Section-level gallery from API (single or multiple); preferred over `imageUrl` in the renderer */
    images?: Array<string | { url: string; id?: string }>;
    imageUrl?: string;
    videoUrl?: string;
    badgeText?: string;
    icon?: string; // For icon elements in sections
    blockquote?: string;
    blockquoteAuthor?: string;
    highlightText?: string;
    listItems?: string[]; 
    projectId?: string; // For API-based navbar/footer
    brand?: string; // For footer brand name
    badge?: string; // For process/features sections
    // FAQ sections may receive data under various keys from the API
    faq?: unknown[];
    faqs?: unknown[];
    [key: string]: unknown;
  };
  // The new flexible structure for custom/elements sections
  elements?: WebsiteElement[]; 
  
  // Variant-specific styles storage (styles per variant)
  variantStyles?: Record<string, Partial<{
    backgroundColor: string;
    paddingTop: string;
    paddingBottom: string;
    paddingLeft?: string;
    paddingRight?: string;
    marginTop?: string;
    marginBottom?: string;
    marginLeft?: string;
    marginRight?: string;
    textAlign: 'left' | 'center' | 'right';
    maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
    background?: any;
    backgroundImage?: string;
    overlayOpacity?: string;
    overlayColor?: string;
    overlayOpacityValue?: string;
    overlayBlendMode?: string;
    enableGeometry?: boolean;
    textColor: string;
    titleColor?: string;
    titleSize?: string;
    titleAlign?: 'left' | 'center' | 'right' | 'justify';
    titleFontWeight?: string;
    titleTextTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    titleHeadingTag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    subtitleColor?: string;
    subtitleSize?: string;
    subtitleAlign?: 'left' | 'center' | 'right' | 'justify';
    subtitleFontWeight?: string;
    subtitleTextTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    descriptionColor?: string;
    descriptionSize?: string;
    descriptionTextTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    fontSize?: string;
    fontWeight?: string;
    accentColor: string;
    buttonBackgroundColor: string;
    buttonTextColor: string;
    buttonStyle?: 'rounded' | 'pill' | 'square';
    borderRadius?: string;
    secondaryButtonBackgroundColor?: string;
    secondaryButtonTextColor?: string;
    linkColor?: string;
    fontFamily?: string;
  }>>;
  
  // Default styles applied when a specific variant is selected
  variantOverrides?: Record<string, any>;

  /**
   * Per-breakpoint style overrides for the section itself (not its elements).
   * Only the diff from `styles` is stored; resolved via CSS media queries
   * targeting `[data-section-id="..."]` on the section renderer's root.
   */
  tabletStyles?: Partial<Section['styles']>;
  mobileStyles?: Partial<Section['styles']>;

  styles: {
    // Container
    backgroundColor?: string; // Deprecated - use background.type instead
    
    // Spacing
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    paddingX?: string; // Deprecated but kept for backward compatibility if needed
    
    marginTop?: string; 
    marginBottom?: string;
    marginLeft?: string;
    marginRight?: string;

    textAlign?: 'left' | 'center' | 'right';
    maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
    
    // New comprehensive background system
    background?: {
      type: 'color' | 'gradient' | 'image';
      // Top-level overlay (written by migrator/reducers; mirrored onto image.overlay when bg is an image)
      overlay?: {
        enabled: boolean;
        color?: string;
        opacity?: number;
        blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';
      };
      // For color
      color?: string;
      // For gradient
      gradient?: {
        type: 'linear' | 'radial';
        direction?: number; // 0-360 for linear
        stops: Array<{ color: string; position: number }>; // position: 0-100
      };
      // For image
      image?: {
        url: string;
        mode?: 'single' | 'multiple';
        images?: Array<{ url: string; id: string }>;
        carouselSettings?: {
          enabled: boolean;
          autoplay: boolean;
          duration: number; // Time between slides in ms
          transitionType: 'slide' | 'fade';
          transitionSpeed: number; // Transition duration in ms
          loop: boolean;
          pauseOnHover: boolean;
          buttonVariant?: 'minimal' | 'rounded' | 'square' | 'outline' | 'hidden';
        };
        position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right';
        size?: 'cover' | 'contain' | 'auto' | string; // Can be custom like "50% 50%"
        repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
        attachment?: 'scroll' | 'fixed' | 'local';
        overlay?: {
          enabled: boolean;
          color?: string;
          opacity?: number; // 0-1
          blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';
        };
      };
    };
    
    // Legacy flat background fields (deprecated, kept for backward compatibility)
    backgroundImage?: string;
    backgroundPosition?: string;
    backgroundSize?: string;
    backgroundRepeat?: string;
    backgroundAttachment?: string;
    overlayOpacity?: string;
    overlayColor?: string;
    overlayOpacityValue?: string;
    overlayBlendMode?: string;

    // Border
    border?: string;
    borderColor?: string;
    borderWidth?: string;
    borderStyle?: string;
    borderTop?: string;
    borderBottom?: string;
    borderLeft?: string;
    borderRight?: string;
    
    // Geometry settings
    enableGeometry?: boolean;
    
    variant?: string;
    backgroundPattern?: 'none' | 'dots-grid' | 'diagonal-lines' | 'plus-signs' | 'circuit' | 'topography' | 'blueprint' | 'honeycomb' | 'polka-dots' | 'zig-zag' | 'sparkles' | 'water-ripple';
    enableBackgroundShapes?: boolean;
    backgroundShapeType?: string;
    enableBackgroundAnimation?: boolean;
    backgroundAnimationSpeed?: string | number;
    topDividerShape?: string;
    bottomDividerShape?: string;
    topDividerHeight?: string | number;
    bottomDividerHeight?: string | number;
    topDividerColor?: string;
    bottomDividerColor?: string;
    buttonClass?: string;
    themeMode?: 'light' | 'dark';

    // Typography & Colors
    textColor?: string; 
    
    titleColor?: string;
    titleSize?: string;
    titleAlign?: 'left' | 'center' | 'right' | 'justify';
    titleFontWeight?: string;
    titleTextTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    titleHeadingTag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; // Heading level for section titles
    
    subtitleColor?: string;
    subtitleSize?: string;
    subtitleAlign?: 'left' | 'center' | 'right' | 'justify';
    subtitleFontWeight?: string;
    subtitleTextTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    
    descriptionColor?: string;
    descriptionSize?: string;
    descriptionTextTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    
    fontSize?: string;
    fontWeight?: string;
    
    accentColor?: string; 

    // Buttons
    buttonBackgroundColor?: string;
    buttonTextColor?: string;
    buttonStyle?: 'rounded' | 'pill' | 'square';
    
    borderRadius?: string; 

    secondaryButtonBackgroundColor?: string;
    secondaryButtonTextColor?: string;
    secondaryButtonBorderColor?: string;
    iconColor?: string;
    iconBackgroundColor?: string;
    subheadingColor?: string;
    iconBgColor?: string;
    secondaryHeadingColor?: string;

    linkColor?: string;

    cardBackgroundColor?: string;
    cardBorderColor?: string;

    // Typography size/weight/spacing aliases used by some components
    titleFontSize?: string;
    titleLetterSpacing?: string;
    subtitleFontSize?: string;
    subtitleLetterSpacing?: string;
    descriptionFontSize?: string;
    descriptionFontWeight?: string;
    descriptionLetterSpacing?: string;

    titleFontFamily?: string;
    subtitleFontFamily?: string;
    descriptionFontFamily?: string;
    buttonFontFamily?: string;
    // Legacy: used as a fallback for all categories
    fontFamily?: string;

    // Section-level icon-box style controls (also mirrored on element style)
    iconSize?: string;
    iconContainerSize?: string;
    iconBorderRadius?: string;
    iconBorderColor?: string;
    iconBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    iconBorderWidth?: string;
    iconBorderTopLeftRadius?: string;
    iconBorderTopRightRadius?: string;
    iconBorderBottomLeftRadius?: string;
    iconBorderBottomRightRadius?: string;
    iconShadow?: string;

    // Title/subtitle/description style extras
    titleFontStyle?: 'normal' | 'italic';
    subtitleFontStyle?: 'normal' | 'italic';
    descriptionFontStyle?: 'normal' | 'italic';
    subheadingFontSize?: string;
    subheadingFontWeight?: string;
    subheadingTextTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';

    // Button typography
    buttonFontWeight?: string;
    buttonFontSize?: string;
    buttonAlign?: 'left' | 'center' | 'right';
    buttonSize?: string;
    buttonTextTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    buttonLetterSpacing?: string;
    buttonBorderRadius?: string;
    buttonBorderColor?: string;
    buttonBorderWidth?: string;
    buttonBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    buttonPadding?: string;
    buttonShadow?: string;

    // Secondary button extras
    secondaryButtonText?: string;
    secondaryButtonBorder?: string;
    secondaryButtonBg?: string;

    // Filter/opacity effects on section
    filter?: string;
    opacity?: number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    aspectRatio?: string;
    boxShadow?: string;

    // Color/text extras for section-level editors
    color?: string;
    textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    lineHeight?: string;

    // Accordion color overrides (written by applyVariantRefresh + AccordionStylesBlock)
    accordionQuestionColor?: string;
    accordionAnswerColor?: string;
    accordionBackgroundColor?: string;
    accordionBorderColor?: string;
  };
}

/** Page-level SEO metadata. All fields optional; renderer falls back to defaults. */
export interface SEOMetadata {
  /** <title> tag. Max ~60 chars recommended. */
  title?: string;
  /** <meta name="description">. Max ~160 chars recommended. */
  description?: string;
  /** Comma-separated keywords. Modern search engines mostly ignore these,
   *  included for completeness and legacy indexers. */
  keywords?: string;
  /** <link rel="canonical"> — absolute URL of the authoritative page. */
  canonicalUrl?: string;
  /** OpenGraph title (falls back to title). */
  ogTitle?: string;
  /** OpenGraph description (falls back to description). */
  ogDescription?: string;
  /** OpenGraph image URL (also used for Twitter card). 1200×630 recommended. */
  ogImage?: string;
  /** OpenGraph type — 'website' (default), 'article', 'product', 'business.business' etc. */
  ogType?: string;
  /** OpenGraph site_name — the brand/site name shown above the preview card. */
  ogSiteName?: string;
  /** Twitter card type. */
  twitterCard?: 'summary' | 'summary_large_image';
  /** Twitter @site handle (e.g. "@brandhandle") — shown next to the card. */
  twitterSite?: string;
  /** robots directive — e.g., "index,follow" or "noindex,nofollow". */
  robots?: 'index,follow' | 'noindex,nofollow' | 'index,nofollow' | 'noindex,follow';
  /** Favicon URL override (absolute or /relative). */
  favicon?: string;
  /** Additional JSON-LD structured data string (raw JSON). */
  structuredData?: string;
  /**
   * ISO 639-1 language code (e.g. "en", "es", "fr") applied to <html lang>.
   * Drives screen-reader pronunciation + Google's language signal.
   */
  language?: string;
}

/**
 * A single editable page in the site. Sections here render between the
 * site-wide `globalSections` (navbar + footer) on the canvas.
 */
export interface WebsitePage {
  id: string;
  /** Human-readable name used in the Pages list ("Home", "Services"). */
  name: string;
  /** URL slug for the page ("/" for home, "/services", etc.). */
  slug: string;
  /** Page-specific sections (hero, features, about, cta, etc.). */
  sections: Section[];
  /** Per-page SEO metadata (falls back to site-level defaults at publish). */
  seo?: SEOMetadata;
}

/**
 * Site-wide default styles applied to every element of a given type. These
 * sit *between* the active theme tokens and per-element overrides:
 *   element.style → bulk section style → globalElementStyles → theme tokens → defaults
 *
 * Persists across theme switches — picking a different palette doesn't blow
 * away the user's brand-driven heading color or button styling.
 *
 * Every field is optional so partial overrides are fine.
 */
/**
 * Per-heading-level style overrides. Every level (h1–h6) supports independent
 * font + size controls plus separate dark / light color slots, so the same
 * h2 can render as one color over a dark hero and a different color over a
 * white services grid without per-section overrides.
 */
export interface HeadingLevelStyle {
  /** Color when the section is dark (default theme mode). */
  color?: string;
  /** Color when the section is light (themeMode='light'). */
  colorLight?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  /** Color of the highlighted last word in split-shape headings (dark sections). */
  highlightColor?: string;
  /** Highlight color for light sections. */
  highlightColorLight?: string;
}

export interface GlobalElementStyles {
  /**
   * Heading defaults — `all` applies to every heading regardless of level,
   * then h1..h6 layer on top per level. Resolution at render time:
   *   element.style → bulk → globalElementStyles.headings[hN] → globalElementStyles.headings.all → theme → defaults
   */
  headings?: {
    all?: HeadingLevelStyle;
    h1?: HeadingLevelStyle;
    h2?: HeadingLevelStyle;
    h3?: HeadingLevelStyle;
    h4?: HeadingLevelStyle;
    h5?: HeadingLevelStyle;
    h6?: HeadingLevelStyle;
  };
  /** @deprecated Replaced by `headings` (per-level + dark/light). Kept so old saves load. */
  heading?: {
    color?: string;
    fontFamily?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    highlightColor?: string;
  };
  text?: {
    color?: string;
    /** Color when the section is light. */
    colorLight?: string;
    fontFamily?: string;
    fontSize?: string;
    lineHeight?: string;
  };
  button?: {
    backgroundColor?: string;
    color?: string;
    hoverBackgroundColor?: string;
    hoverColor?: string;
    borderRadius?: string;
    padding?: string;
    fontWeight?: string;
  };
  link?: {
    color?: string;
    hoverColor?: string;
    underline?: 'always' | 'hover' | 'none';
  };
  icon?: {
    color?: string;
    backgroundColor?: string;
    size?: string;
  };
  list?: {
    color?: string;
    markerColor?: string;
    itemGap?: string;
  };
  badge?: {
    backgroundColor?: string;
    color?: string;
    borderRadius?: string;
  };
}

export interface WebsiteData {
  name: string;
  /**
   * Sections of the currently-active page, kept at top level so the 60+
   * existing references continue to work unchanged. The editor keeps this
   * in sync with `pages[currentPageId].sections` on every edit.
   */
  sections: Section[];
  /** Shared sections rendered on every page (typically [navbar, ..., footer]). */
  globalSections?: Section[];
  /** All editable pages in the site. Undefined on older data (single-page mode). */
  pages?: WebsitePage[];
  /** Which page is currently active in the editor. */
  currentPageId?: string;
  /**
   * @deprecated Page-level SEO now lives on WebsitePage.seo. Kept so old
   * saved data with top-level `seo` still loads correctly.
   */
  seo?: SEOMetadata;
  /**
   * Site-wide default styles per element type. Optional — when absent or a
   * field is empty, elements fall back to the active theme tokens.
   */
  globalElementStyles?: GlobalElementStyles;
  globalStyles: {
    primaryFont: string;
    themeMode: 'light' | 'dark';
    borderRadius: string;
    colors: {
        backgroundColor: string;
        textColor: string;
        titleColor: string;
        subtitleColor: string;
        accentColor: string;
        buttonBackgroundColor: string;
        buttonTextColor: string;
        linkColor: string;
        borderColor: string;
        overlayColor?: string; 
        subheadingColor?: string;
        iconColor?: string;
        iconBgColor?: string;
        secondaryHeadingColor?: string;
    };
    typography: {
        h1: TypographyStyle;
        h2: TypographyStyle;
        h3: TypographyStyle;
        p: TypographyStyle;
        button: TypographyStyle;
        link: TypographyStyle;
    };
  };
}
