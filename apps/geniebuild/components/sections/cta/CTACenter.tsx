
import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';

interface CTAProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
}

export const CTACenter: React.FC<CTAProps> = ({ 
  section, 
  onTextEdit, 
  buttonClass, 
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false 
}) => {
  const { content, styles } = section;
  
  // Element IDs - must match what App.tsx expects
  const titleId = `${section.id}-cta-title`;
  const subtitleId = `${section.id}-cta-subtitle`;
  const buttonId = `${section.id}-cta-button`;

  // Get elements from section.elements (they exist after first edit)
  const titleElement = section.elements?.find(e => e.id === titleId);
  const subtitleElement = section.elements?.find(e => e.id === subtitleId);
  const buttonElement = section.elements?.find(e => e.id === buttonId);
  
  // Theme colors for ElementsSection - pass complete section.styles for unified styling
  // This ensures all global styles are available as fallbacks
  const styleAny = styles as any;
  const themeColors = {
    ...styles, // Include all section.styles properties
    // Explicitly map button style properties for clarity
    buttonFontWeight: styleAny.buttonFontWeight || styleAny.fontWeight,
    buttonFontSize: styleAny.buttonSize || styleAny.buttonFontSize || styleAny.fontSize,
    buttonAlign: styleAny.buttonAlign || styles.textAlign,
    buttonFontFamily: styleAny.buttonFontFamily || styleAny.fontFamily,
    // Map heading style properties
    titleFontWeight: styleAny.titleFontWeight || styleAny.fontWeight,
    titleFontSize: styleAny.titleSize || styleAny.fontSize,
    titleAlign: styleAny.titleAlign || styles.textAlign,
    titleFontFamily: styleAny.titleFontFamily || styleAny.fontFamily,
    // Map text/subtitle style properties
    subtitleFontWeight: styleAny.subtitleFontWeight || styleAny.fontWeight,
    subtitleFontSize: styleAny.subtitleSize || styleAny.fontSize,
    subtitleAlign: styleAny.subtitleAlign || styles.textAlign,
    subtitleFontFamily: styleAny.subtitleFontFamily || styleAny.fontFamily,
    // Global fallback properties
    fontWeight: styleAny.fontWeight,
    fontSize: styleAny.fontSize,
    textAlign: styles.textAlign,
    fontFamily: styleAny.fontFamily,
  };
  
  // Helper to create fallback element if it doesn't exist (matches App.tsx virtual element pattern)
  const getTitleElement = (): WebsiteElement => {
    if (titleElement) return titleElement;
    
    return {
      id: titleId,
      type: 'heading',
      content: {
        text: content.title || '',
        htmlTag: (styles.titleHeadingTag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      },
      style: {
        color: styles.titleColor || ''
      }
    };
  };
  
  const getSubtitleElement = (): WebsiteElement => {
    if (subtitleElement) return subtitleElement;
    
    return {
      id: subtitleId,
      type: 'text',
      content: {
        text: content.subtitle || '',
        textSize: 'base' as 'base' | 'small' | 'large' | 'xl'
      },
      style: {
        color: styles.subtitleColor || styles.textColor || ''
      }
    };
  };
  
  const getButtonElement = (): WebsiteElement => {
    if (buttonElement) return buttonElement;
    
    return {
      id: buttonId,
      type: 'button',
      content: {
        text: content.ctaText || '',
        link: content.ctaHref || ''
      },
      style: {
        backgroundColor: styles.buttonBackgroundColor || '',
        color: styles.buttonTextColor || ''
      }
    };
  };

  return (
    <div className="mx-auto px-6 relative z-10 max-w-4xl text-center">
      {/* Render Title using ElementsSection - unwrapped for custom layout */}
      <div className="mb-6">
        <ElementsSection
          section={{
            ...section,
            elements: [getTitleElement()]
          }}
          onTextEdit={onTextEdit}
          onElementUpdate={onElementUpdate || (() => {})}
          onElementSelect={onElementSelect}
          selectedElementId={selectedElementId}
          buttonClass={buttonClass}
          readOnly={readOnly}
          isWrapped={false}
          themeColors={themeColors}
        />
      </div>
      
      {/* Render Subtitle using ElementsSection - unwrapped for custom layout */}
      <div className="mb-10 opacity-90">
        <ElementsSection
          section={{
            ...section,
            elements: [getSubtitleElement()]
          }}
          onTextEdit={onTextEdit}
          onElementUpdate={onElementUpdate || (() => {})}
          onElementSelect={onElementSelect}
          selectedElementId={selectedElementId}
          buttonClass={buttonClass}
          readOnly={readOnly}
          isWrapped={false}
          themeColors={themeColors}
        />
      </div>
      
      {/* Render Button using headless ElementsSection */}
      <div className="w-full">
        <ElementsSection 
          isWrapped={false}
          section={{
            ...section,
            elements: [getButtonElement()]
          }}
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
  );
};
