import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';

interface HeroProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
}

export const HeroGeometric: React.FC<HeroProps> = ({ 
  section, 
  onTextEdit, 
  buttonClass, 
  onElementSelect, 
  onElementUpdate,
  selectedElementId, 
  readOnly = false 
}) => {
  const { content, styles } = section;
  const styleAny = styles as any;

  // Element IDs - must match what App.tsx expects
  const titleId = `${section.id}-hero-title`;
  const subtitleId = `${section.id}-hero-subtitle`;
  const buttonId = `${section.id}-hero-button`;
  const badgeId = `${section.id}-hero-badge`;

  // Get elements from section.elements (they exist after first edit)
  const titleElement = section.elements?.find(e => e.id === titleId);
  const subtitleElement = section.elements?.find(e => e.id === subtitleId);
  const buttonElement = section.elements?.find(e => e.id === buttonId);
  const badgeElement = section.elements?.find(e => e.id === badgeId);
  
  // Theme colors for ElementsSection - pass complete section.styles for unified styling
  // This ensures all global styles are available as fallbacks
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
        htmlTag: (styles.titleHeadingTag || 'h1') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
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
  
  const getIconElement = (): WebsiteElement => {
    const iconId = `${section.id}-hero-badge-icon`;
    const existing = section.elements?.find(e => e.id === iconId);
    if (existing) return existing;
    
    return {
      id: iconId,
      type: 'icon',
      content: { iconClass: 'fa-solid fa-wand-magic-sparkles' },
      style: { color: styles.accentColor || '#3b82f6' } // Links to the section's accent color
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

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    if (onElementSelect) onElementSelect(elementId);
  };
  
  // Check if geometry is enabled (default to true)
  const enableGeometry = styles.enableGeometry !== undefined ? styles.enableGeometry : true;
  
  // Get badge text from element or fallback to section content
  const badgeText = badgeElement?.content.text || content.badgeText || 'New Generation Builder';

  return (
    <div className="relative min-h-[80vh] flex items-center overflow-hidden py-20">
      {/* GEOMETRY OVERLAY - appears on top of section background (additional decorative elements for HeroGeometric) */}
      {enableGeometry && (
        <div className="absolute inset-0 z-[1] pointer-events-none">
          {/* Large Gradient Orb - specific to HeroGeometric variant */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* LEFT COLUMN: TEXT CONTENT */}
        <div className="lg:col-span-7 text-left">
          {/* Badge Decorator - Use element styles if available */}
          <div 
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 transition-all ${!readOnly ? 'outline-none cursor-text rounded-lg' : ''} ${selectedElementId === badgeId ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-white/10'}`}
            style={{
              backgroundColor: badgeElement?.style?.backgroundColor || 'rgba(255, 255, 255, 0.05)',
              color: badgeElement?.style?.color || '#60a5fa',
              borderColor: badgeElement?.style?.borderColor || 'rgba(255, 255, 255, 0.1)',
              fontSize: badgeElement?.style?.fontSize || '10px',
              fontWeight: badgeElement?.style?.fontWeight || 'bold',
              textTransform: (badgeElement?.style?.textTransform as any) || 'uppercase',
              letterSpacing: badgeElement?.style?.letterSpacing || '0.2em',
              padding: (typeof badgeElement?.style?.padding === 'string' ? badgeElement.style.padding : '4px 12px') || '4px 12px',
              borderRadius: (typeof badgeElement?.style?.borderRadius === 'string' ? badgeElement.style.borderRadius : '9999px') || '9999px'
            } as React.CSSProperties}
            contentEditable={!readOnly}
            suppressContentEditableWarning={!readOnly}
            onClick={(e) => handleElementClick(e, badgeId)}
            onBlur={(e) => {
              const newText = e.currentTarget.textContent || '';
              // Update element if it exists, otherwise update section content
              if (badgeElement && onElementUpdate) {
                // Element exists, update it directly
                onElementUpdate(badgeId, { content: { text: newText } });
              } else {
                // Fallback to section content
                onTextEdit('badgeText', newText);
              }
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {badgeText}
          </div>

          {/* Render Title using ElementsSection - unwrapped for custom layout */}
          <div className="mb-8">
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
          <div className="mb-10 opacity-60">
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
          <div className="w-full mb-10">
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

        {/* RIGHT COLUMN: ABSTRACT VISUALS */}
        <div className="lg:col-span-5 hidden lg:block relative">
          <div className="relative w-full aspect-square">
            {/* Main Glass Card */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl transform rotate-3 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="w-full h-full opacity-20 bg-gradient-to-br from-blue-500 to-purple-600" />
                <div className="absolute">
                  <ElementsSection 
                    isWrapped={false} 
                    section={{ ...section, elements: [getIconElement()] }} 
                    onElementSelect={onElementSelect} 
                    selectedElementId={selectedElementId} 
                    onElementUpdate={onElementUpdate || (() => {})} 
                    onTextEdit={onTextEdit} 
                    readOnly={readOnly} 
                    themeColors={themeColors} 
                  />
                </div>
            </div>
            
            {/* Floating Mini Cards */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-600 rounded-2xl p-4 shadow-xl transform -rotate-6 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-8 h-1 bg-white/30 rounded mb-2" />
                <div className="w-12 h-1 bg-white/30 rounded" />
            </div>

            <div className="absolute -bottom-10 -right-6 w-48 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl transform rotate-12">
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="mt-4 w-full h-2 bg-white/5 rounded" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
