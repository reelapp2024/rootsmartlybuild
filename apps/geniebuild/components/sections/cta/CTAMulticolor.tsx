import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';
import { useTheme } from '@ui/blocks';

interface CTAProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: Partial<WebsiteElement>) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
}

export const CTAMulticolor: React.FC<CTAProps> = ({ 
  section, 
  onTextEdit, 
  buttonClass, 
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false 
}) => {
  const { content, styles } = section;
  const { themeData } = useTheme();
  
  // Element IDs
  const titleId = `${section.id}-cta-title`;
  const subtitleId = `${section.id}-cta-subtitle`;
  const primaryButtonId = `${section.id}-cta-primary-button`;
  const secondaryButtonId = `${section.id}-cta-secondary-button`;

  // Get elements from section.elements
  const titleElement = section.elements?.find(e => e.id === titleId);
  const subtitleElement = section.elements?.find(e => e.id === subtitleId);
  const primaryButtonElement = section.elements?.find(e => e.id === primaryButtonId);
  const secondaryButtonElement = section.elements?.find(e => e.id === secondaryButtonId);
  
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
    heading: themeData?.heading || styles.titleColor || '#FFFFFF',
    description: themeData?.description || styles.textColor || '#FFFFFF',
    surface: themeData?.surface || styles.backgroundColor || '#0E1214',
    primaryButton: themeData?.primaryButton?.bg || styles.buttonBackgroundColor || '#E11D48',
    primaryButtonText: themeData?.primaryButton?.text || styles.buttonTextColor || '#FFFFFF',
    primaryButtonHover: themeData?.primaryButton?.hover || '#BE123C',
    secondaryButton: themeData?.secondaryButton?.bg || 'rgba(255, 255, 255, 0.95)',
    secondaryButtonText: themeData?.secondaryButton?.text || themeData?.primaryButton?.bg || '#E11D48',
    secondaryButtonBorder: themeData?.secondaryButton?.border || themeData?.primaryButton?.bg || '#E11D48',
    secondaryButtonHover: themeData?.secondaryButton?.hover || themeData?.primaryButton?.bg || '#E11D48',
    accent: themeData?.accent || styles.accentColor || '#F59E0B',
    gradient: {
      from: themeData?.gradient?.from || '#0E1214',
      to: themeData?.gradient?.to || '#1F2937'
    },
    trust: themeData?.trust || {
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
        text: content.title || 'What are you waiting for?',
        htmlTag: 'h2' as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
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
        text: content.subtitle || 'Contact us for our services',
        textSize: 'base' as 'base' | 'small' | 'large' | 'xl'
      },
      style: {
        color: colors.description
      }
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
        text: content.secondaryCtaText || 'Book Online',
        link: content.secondaryCtaHref || '#'
      },
      style: {
        backgroundColor: colors.secondaryButton,
        color: colors.secondaryButtonText,
        borderColor: colors.secondaryButtonBorder
      }
    };
  };

  return (
    <section 
      className="py-16 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.gradient.from}, ${colors.gradient.to})`
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }}></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full animate-pulse" style={{ animationDelay: '1s', backgroundColor: colors.primaryButton }}></div>
        <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full animate-pulse" style={{ animationDelay: '2s', backgroundColor: colors.accent }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-16 text-center relative z-10">
        
        {/* Section Header */}
        <div className="mb-8">
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
          <div className="mt-4">
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
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
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
        <div className="flex flex-wrap justify-center gap-6" style={{ color: colors.description }}>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: colors.trust.dot1 }}
            ></div>
            <span className="text-xs font-semibold">24/7 Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: colors.primaryButton }}
            ></div>
            <span className="text-xs font-semibold">Licensed & Insured</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: colors.trust.dot3 }}
            ></div>
            <span className="text-xs font-semibold">Same Day Service</span>
          </div>
        </div>
      </div>
    </section>
  );
};
