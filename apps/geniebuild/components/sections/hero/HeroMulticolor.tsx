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

export const HeroMulticolor: React.FC<HeroProps> = ({ 
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
    // Merge theme data for fallbacks
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
  
  // Get theme colors for overlay
  const primaryColor = themeData?.primaryButton?.bg || styles.buttonBackgroundColor || '#E11D48';
  const accentColor = themeData?.accent || styles.accentColor || '#F59E0B';
  const headingColor = themeData?.heading || styles.titleColor || '#F8FAFC';
  const descriptionColor = themeData?.description || styles.textColor || '#C7CDD6';
  
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
        color: styles.titleColor || themeData?.heading || ''
      }
    };
  };
  
  const getSubtitleElement = (): WebsiteElement => {
    if (subtitleElement) return subtitleElement;
    return {
      id: subtitleId,
      type: 'text',
      content: {
        text: content.subtitle || 'Professional plumbers available 24/7 for all your emergency plumbing needs.',
        textSize: 'large' as 'base' | 'small' | 'large' | 'xl'
      },
      style: {
        color: styles.subtitleColor || styles.textColor || themeData?.description || ''
      }
    };
  };
  
  const getBadgeElement = (): WebsiteElement => {
    if (badgeElement) return badgeElement;
    return {
      id: badgeId,
      type: 'badge',
      content: {
        text: content.badgeText || 'Trusted by 10,000+ Customers'
      },
      style: {}
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
        backgroundColor: styles.buttonBackgroundColor || '',
        color: styles.buttonTextColor || ''
      }
    };
  };
  
  const getSecondaryButtonElement = (): WebsiteElement => {
    if (secondaryButtonElement) return secondaryButtonElement;
    return {
      id: secondaryButtonId,
      type: 'button',
      content: {
        text: content.secondaryCtaText || 'Get Estimate',
        link: content.secondaryCtaHref || '#'
      },
      style: {
        backgroundColor: styles.secondaryButtonBackgroundColor || 'transparent',
        color: styles.secondaryButtonTextColor || ''
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
  
  // Get overlay from theme or section styles
  const overlayColor = styles.overlayColor || themeData?.overlay?.color || `rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.8)`;
  const overlayOpacity = styles.overlayOpacityValue ? parseFloat(styles.overlayOpacityValue) : 0.8;
  const overlayBlendMode = styles.overlayBlendMode || themeData?.overlay?.blend || 'multiply';

  return (
    <section
      className="relative min-h-[80vh] md:min-h-[85vh] flex items-center justify-center py-8 px-4 md:px-16 transition-all duration-300 overflow-hidden"
      style={{
        backgroundColor: themeData?.surface || styles.backgroundColor || '#0E1214'
      }}
    >
      {/* Background Image */}
      {bgImageUrl && (
        <div className="absolute inset-0 w-full h-full z-0">
          <ElementsSection
            isWrapped={false}
            section={{ ...section, elements: [getImageElement()] }}
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
      
      {/* Background Overlay with Gradient */}
      <div 
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(135deg, ${overlayColor} 0%, ${overlayColor.replace(/[\d.]+\)$/g, '0.7)')} 50%, ${accentColor}CC 100%)`,
          mixBlendMode: overlayBlendMode as any,
        }}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-[1] pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full opacity-10 animate-bounce" style={{ backgroundColor: headingColor }}></div>
        <div className="absolute top-32 right-20 w-16 h-16 rounded-full opacity-20 animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 rounded-full opacity-15 animate-pulse" style={{ backgroundColor: headingColor }}></div>
        <div className="absolute bottom-40 right-10 w-24 h-24 rounded-full opacity-10 animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 md:px-16 py-8 z-10 max-w-6xl relative">
        <div className="text-center space-y-6">
          {/* Trust Badge */}
          {content.badgeText && (
            <div className="inline-block">
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

          {/* Main Headline */}
          <div className="space-y-3">
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
          </div>

          {/* Subheadline */}
          <div className="max-w-4xl mx-auto">
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
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            {content.ctaText && (
              <div className="relative group">
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
              </div>
            )}
            
            {content.secondaryCtaText && (
              <div className="relative group">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
