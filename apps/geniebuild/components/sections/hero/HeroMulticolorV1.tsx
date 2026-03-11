import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';
import { useTheme } from '@ui/blocks';

interface HeroProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onImageClick: () => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: Partial<WebsiteElement>) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
}

export const HeroMulticolorV1: React.FC<HeroProps> = ({ 
  section, 
  onTextEdit, 
  onImageClick, 
  buttonClass, 
  onElementSelect, 
  onElementUpdate, 
  selectedElementId, 
  readOnly = false 
}) => {
  const { content, styles } = section;
  const { themeData } = useTheme();
  
  // Element IDs
  const titleId = `${section.id}-hero-title`;
  const subtitleId = `${section.id}-hero-subtitle`;
  const primaryButtonId = `${section.id}-hero-primary-button`;
  const secondaryButtonId = `${section.id}-hero-secondary-button`;
  const badgeId = `${section.id}-hero-badge`;
  const imageId = `${section.id}-hero-image`;
  const trustIndicator1Id = `${section.id}-hero-trust-1`;
  const trustIndicator2Id = `${section.id}-hero-trust-2`;
  const trustIndicator3Id = `${section.id}-hero-trust-3`;

  // Get elements from section.elements
  const titleElement = section.elements?.find(e => e.id === titleId);
  const subtitleElement = section.elements?.find(e => e.id === subtitleId);
  const primaryButtonElement = section.elements?.find(e => e.id === primaryButtonId);
  const secondaryButtonElement = section.elements?.find(e => e.id === secondaryButtonId);
  const badgeElement = section.elements?.find(e => e.id === badgeId);
  const imageElement = section.elements?.find(e => e.id === imageId);
  
  // Theme colors
  const styleAny = styles as any;
  const themeColors = {
    ...styles,
    titleColor: styles.titleColor || themeData?.heading,
    textColor: styles.textColor || themeData?.description,
    subtitleColor: styles.subtitleColor || styles.textColor || themeData?.description,
    buttonFontWeight: styleAny.buttonFontWeight || styleAny.fontWeight,
    buttonFontSize: styleAny.buttonSize || styleAny.buttonFontSize || styleAny.fontSize,
    buttonAlign: styleAny.buttonAlign || styles.textAlign,
    buttonFontFamily: styleAny.buttonFontFamily || styleAny.fontFamily,
    titleFontWeight: styleAny.titleFontWeight || styleAny.fontWeight,
    titleFontSize: styleAny.titleSize || styleAny.fontSize,
    titleAlign: styleAny.titleAlign || styles.textAlign,
    titleFontFamily: styleAny.titleFontFamily || styleAny.fontFamily,
    subtitleFontWeight: styleAny.subtitleFontWeight || styleAny.fontWeight,
    subtitleFontSize: styleAny.subtitleSize || styleAny.fontSize,
    subtitleAlign: styleAny.subtitleAlign || styles.textAlign,
    subtitleFontFamily: styleAny.subtitleFontFamily || styleAny.fontFamily,
    fontWeight: styleAny.fontWeight,
    fontSize: styleAny.fontSize,
    textAlign: styles.textAlign,
    fontFamily: styleAny.fontFamily,
  };
  
  // Get theme colors
  const colors = {
    heading: themeData?.heading || styles.titleColor || '#F8FAFC',
    description: themeData?.description || styles.textColor || '#C7CDD6',
    surface: themeData?.surface || styles.backgroundColor || '#0E1214',
    primaryButton: themeData?.primaryButton?.bg || styles.buttonBackgroundColor || '#E11D48',
    primaryButtonText: themeData?.primaryButton?.text || styles.buttonTextColor || '#FFFFFF',
    secondaryButton: themeData?.secondaryButton?.bg || styles.secondaryButtonBackgroundColor || 'transparent',
    secondaryButtonText: themeData?.secondaryButton?.text || styles.secondaryButtonTextColor || '#F8FAFC',
    secondaryButtonBorder: themeData?.secondaryButton?.border || styles.accentColor || '#F43F5E',
    accent: themeData?.accent || styles.accentColor || '#F59E0B',
    gradient: {
      from: themeData?.gradient?.from || '#0E1214',
      to: themeData?.gradient?.to || '#1F2937'
    },
    overlay: {
      color: themeData?.overlay?.color || 'rgba(14, 16, 20, 0)',
      blend: themeData?.overlay?.blend || 'multiply'
    },
    badge: {
      background: themeData?.badge?.background || 'rgba(225,29,72,0.15)',
      text: themeData?.badge?.text || '#F8FAFC'
    },
    trust: themeData?.trust || {
      text: '#C7CDD6',
      dot1: '#22C55E',
      dot2: '#3B82F6',
      dot3: '#F59E0B'
    }
  };
  
  // Helper to create fallback elements
  const getTitleElement = (): WebsiteElement => {
    if (titleElement) return titleElement;
    return {
      id: titleId,
      type: 'heading',
      content: {
        text: content.title || 'Emergency Plumbing Service',
        htmlTag: (styles.titleHeadingTag || 'h1') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      },
      style: {
        color: colors.heading
      }
    };
  };
  
  const getSubtitleElement = (): WebsiteElement => {
    if (subtitleElement) return subtitleElement;
    return {
      id: subtitleId,
      type: 'text',
      content: {
        text: content.subtitle || 'Professional plumbers available 24/7 for all your emergency plumbing needs. Fast response, guaranteed satisfaction.',
        textSize: 'large' as 'base' | 'small' | 'large' | 'xl'
      },
      style: {
        color: colors.description
      }
    };
  };
  
  const getBadgeElement = (): WebsiteElement => {
    if (badgeElement) {
      // Return badge as-is - ElementsSection will handle theme colors
      // If badge has explicit colors that match theme, ElementsSection will still use theme
      // If badge has custom colors, ElementsSection will respect them
      return badgeElement;
    }
    // New badge - use empty style to let ElementsSection use theme defaults
    // This ensures badges update when theme changes
    return {
      id: badgeId,
      type: 'badge',
      content: {
        text: content.badgeText || 'Trusted by 10,000+ Customers'
      },
      style: {} // Let ElementsSection use theme badge colors by default
    };
  };
  
  const getPrimaryButtonElement = (): WebsiteElement => {
    if (primaryButtonElement) return primaryButtonElement;
    return {
      id: primaryButtonId,
      type: 'button',
      content: {
        text: content.ctaText || 'Call Now',
        link: content.ctaHref || '#'
      },
      style: {
        backgroundColor: colors.primaryButton,
        color: colors.primaryButtonText
      }
    };
  };
  
  const getSecondaryButtonElement = (): WebsiteElement => {
    if (secondaryButtonElement) return secondaryButtonElement;
    return {
      id: secondaryButtonId,
      type: 'button',
      content: {
        text: content.secondaryCtaText || 'Get Free Estimate',
        link: content.secondaryCtaHref || '#'
      },
      style: {
        backgroundColor: colors.secondaryButton,
        color: colors.secondaryButtonText,
        borderColor: colors.secondaryButtonBorder
      }
    };
  };
  
  const getImageElement = (): WebsiteElement => {
    if (imageElement) return imageElement;
    return {
      id: imageId,
      type: 'image',
      content: {
        imageUrl: content.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        alt: 'Hero Background'
      },
      style: {}
    };
  };

  // Get background image URL
  const bgImageUrl = content.imageUrl || imageElement?.content?.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-8 sm:py-12 lg:py-16 pb-16 sm:pb-20 lg:pb-24"
      style={{
        backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: colors.surface
      }}
    >
      {/* Two-layer overlay system (matching website multicolor theme) */}
      {/* Layer 1: Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors.gradient.from}, ${colors.gradient.to})`,
          mixBlendMode: colors.overlay.blend as any
        }}
      ></div>
      
      {/* Layer 2: Solid Color Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: colors.overlay.color
        }}
      ></div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: `${colors.primaryButton}66` }}></div>
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: `${colors.accent}4D`, animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: `${colors.primaryButton}80`, animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: `${colors.accent}66`, animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center lg:text-left space-y-6 relative z-20">
            
            {/* Badge */}
            {(content.badgeText || badgeElement) && (
              <div className="inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-2.5"
                style={{
                  backgroundColor: `${colors.primaryButton}33`,
                  border: `1px solid ${colors.primaryButton}66`
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.primaryButton }}
                ></div>
                <ElementsSection
                  isWrapped={false}
                  section={{ ...section, elements: [getBadgeElement()] }}
                  onElementSelect={onElementSelect}
                  selectedElementId={selectedElementId}
                  onElementUpdate={onElementUpdate || (() => {})}
                  onTextEdit={onTextEdit}
                  buttonClass={buttonClass}
                  readOnly={readOnly}
                  themeColors={themeColors}
                />
              </div>
            )}

            {/* Main Heading with Gradient Effect */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight">
              <ElementsSection
                isWrapped={false}
                section={{ ...section, elements: [getTitleElement()] }}
                onElementSelect={onElementSelect}
                selectedElementId={selectedElementId}
                onElementUpdate={onElementUpdate || (() => {})}
                onTextEdit={onTextEdit}
                buttonClass={buttonClass}
                readOnly={readOnly}
                themeColors={themeColors}
              />
            </h1>

            {/* Subheading */}
            <p 
              className="text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto lg:mx-0 leading-relaxed"
              style={{ color: colors.description }}
            >
              <ElementsSection
                isWrapped={false}
                section={{ ...section, elements: [getSubtitleElement()] }}
                onElementSelect={onElementSelect}
                selectedElementId={selectedElementId}
                onElementUpdate={onElementUpdate || (() => {})}
                onTextEdit={onTextEdit}
                buttonClass={buttonClass}
                readOnly={readOnly}
                themeColors={themeColors}
              />
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4">
              {content.ctaText && (
                <ElementsSection
                  isWrapped={false}
                  section={{ ...section, elements: [getPrimaryButtonElement()] }}
                  onElementSelect={onElementSelect}
                  selectedElementId={selectedElementId}
                  onElementUpdate={onElementUpdate || (() => {})}
                  onTextEdit={onTextEdit}
                  buttonClass={buttonClass}
                  readOnly={readOnly}
                  themeColors={themeColors}
                />
              )}
              
              {content.secondaryCtaText && (
                <ElementsSection
                  isWrapped={false}
                  section={{ ...section, elements: [getSecondaryButtonElement()] }}
                  onElementSelect={onElementSelect}
                  selectedElementId={selectedElementId}
                  onElementUpdate={onElementUpdate || (() => {})}
                  onTextEdit={onTextEdit}
                  buttonClass={buttonClass}
                  readOnly={readOnly}
                  themeColors={themeColors}
                />
              )}
            </div>

            {/* Trust Indicators */}
            <div 
              className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-8"
              style={{ color: colors.description }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.trust.dot1 }}></div>
                <span className="text-sm font-medium">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.trust.dot2 }}></div>
                <span className="text-sm font-medium">5-Star Rated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.trust.dot3 }}></div>
                <span className="text-sm font-medium">24/7 Available</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-16 md:h-24" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-background"/>
        </svg>
      </div>
    </section>
  );
};
