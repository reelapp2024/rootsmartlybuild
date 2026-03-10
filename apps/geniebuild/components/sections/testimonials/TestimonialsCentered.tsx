import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';

interface TestimonialsCenteredProps {
  section: Section;
  isSelected: boolean;
  onTextEdit: (key: any, value: string) => void;
  onItemEdit: (itemId: string, updates: any) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
  titleClass: string;
  titleStyle?: React.CSSProperties;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  buttonClass?: string;
}

export const TestimonialsCentered: React.FC<TestimonialsCenteredProps> = ({ 
  section, 
  isSelected, 
  onTextEdit, 
  onItemEdit, 
  onRemoveItem, 
  onAddItem,
  titleClass,
  titleStyle,
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false,
  buttonClass = ''
}) => {
  const { content, styles } = section;

  // Element IDs for section title and subtitle
  const titleId = `${section.id}-testimonials-title`;
  const subtitleId = `${section.id}-testimonials-subtitle`;

  // Get elements from section.elements (they exist after first edit)
  const titleElement = section.elements?.find(e => e.id === titleId);
  const subtitleElement = section.elements?.find(e => e.id === subtitleId);
  
  // Theme colors for ElementsSection
  const styleAny = styles as any;
  const themeColors = {
    ...styles,
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
  
  // Helper to create fallback element if it doesn't exist
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
        color: styles.titleColor || '',
        fontSize: styles.titleSize || '',
        fontWeight: styleAny.titleFontWeight || styleAny.fontWeight || 'bold',
        textAlign: (styleAny.titleAlign || styles.textAlign || 'center') as 'left' | 'center' | 'right' | 'justify',
        fontFamily: styleAny.titleFontFamily || styleAny.fontFamily || undefined,
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
        color: styles.subtitleColor || styles.textColor || '',
        fontWeight: styleAny.subtitleFontWeight || styleAny.fontWeight || '400',
        textAlign: (styleAny.subtitleAlign || styles.textAlign || 'center') as 'left' | 'center' | 'right' | 'justify',
        fontFamily: styleAny.subtitleFontFamily || styleAny.fontFamily || undefined,
      }
    };
  };

  // Safely catch live data from DB whether it's named items, testimonials, or reviews
  const activeItems = content.testimonials || content.reviews || content.items;
  const items = Array.isArray(activeItems) && activeItems.length > 0
    ? activeItems
    : [
        { id: 'default-1', author: 'John Doe', role: 'CEO at TechCorp', description: 'This platform completely revolutionized how our team builds websites. The unified architecture is brilliant.', avatar: 'https://i.pravatar.cc/150?img=11' },
        { id: 'default-2', author: 'Sarah Jenkins', role: 'Lead Designer', description: 'The level of control I have over every single element without writing custom CSS is exactly what I have been looking for.', avatar: 'https://i.pravatar.cc/150?img=5' },
        { id: 'default-3', author: 'Michael Chen', role: 'Developer', description: 'Highly recommended for any serious creator.', avatar: 'https://i.pravatar.cc/150?img=8' }
      ];

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Render Title */}
      <div className="mb-4 text-center">
        <ElementsSection
          section={{ ...section, elements: [getTitleElement()] }}
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
      
      {/* Render Subtitle */}
      {content.subtitle && (
        <div className="mb-16 text-center opacity-70 max-w-2xl mx-auto">
          <ElementsSection
            section={{ ...section, elements: [getSubtitleElement()] }}
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
      )}

      {/* Testimonials Centered Layout */}
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {items.map((item: any, index: number) => {
          const elementPrefix = `${section.id}-testim-${index}`;
          
          // Clean helper to grab existing element or fallback
          const getEl = (idSuffix: string, fallbackType: any, fallbackContent: any, fallbackStyle: any): WebsiteElement => {
            const fullId = `${elementPrefix}-${idSuffix}`;
            return section.elements?.find(e => e.id === fullId) || {
              id: fullId, type: fallbackType, content: fallbackContent, style: fallbackStyle
            };
          };

          return (
            <div 
              key={item.id} 
              className="relative group/item py-8 border-b border-white/10 last:border-0"
            >
              {isSelected && !readOnly && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center text-xs z-20"
                >
                  ×
                </button>
              )}
              
              {/* Stars Rating - Centered */}
              <div className="mb-6 flex justify-center">
                <ElementsSection 
                  isWrapped={false} 
                  section={{ ...section, elements: [getEl('stars', 'star-rating', { rating: 5 }, { color: styles.accentColor || '#F59E0B' })] }} 
                  onElementSelect={onElementSelect} 
                  selectedElementId={selectedElementId} 
                  onElementUpdate={onElementUpdate || (() => {})} 
                  onTextEdit={onTextEdit} 
                  buttonClass={buttonClass}
                  readOnly={readOnly} 
                  themeColors={themeColors} 
                />
              </div>
              
              {/* Quote/Description - Large Text */}
              <div className="mb-8">
                <ElementsSection 
                  isWrapped={false} 
                  section={{ ...section, elements: [getEl('quote', 'text', { text: item.description || item.quote || item.content || item.text || '', textSize: 'xl' }, { fontStyle: 'italic', fontWeight: '300' })] }} 
                  onElementSelect={onElementSelect} 
                  selectedElementId={selectedElementId} 
                  onElementUpdate={onElementUpdate || (() => {})} 
                  onTextEdit={onTextEdit} 
                  buttonClass={buttonClass}
                  readOnly={readOnly} 
                  themeColors={themeColors} 
                />
              </div>
              
              {/* Author Info - Centered Stack */}
              <div className="flex flex-col items-center gap-4">
                {/* Avatar - Centered and now SELECTABLE! */}
                <div className="shrink-0">
                  <ElementsSection 
                    isWrapped={false} 
                    section={{ ...section, elements: [getEl('avatar', 'image', { imageUrl: item.avatar || item.image || item.imageUrl || '', alt: item.author || item.name || 'Avatar' }, { width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' })] }} 
                    onElementSelect={onElementSelect} 
                    selectedElementId={selectedElementId} 
                    onElementUpdate={onElementUpdate || (() => {})} 
                    onTextEdit={onTextEdit} 
                    buttonClass={buttonClass}
                    readOnly={readOnly} 
                    themeColors={themeColors} 
                  />
                </div>
                
                {/* Name and Role - Centered */}
                <div className="text-center">
                  <div className="mb-1">
                    <ElementsSection 
                      isWrapped={false} 
                      section={{ ...section, elements: [getEl('name', 'heading', { text: item.author || item.name || item.title || '', htmlTag: 'h6' }, { fontWeight: 'bold' })] }} 
                      onElementSelect={onElementSelect} 
                      selectedElementId={selectedElementId} 
                      onElementUpdate={onElementUpdate || (() => {})} 
                      onTextEdit={onTextEdit} 
                      buttonClass={buttonClass}
                      readOnly={readOnly} 
                      themeColors={themeColors} 
                    />
                  </div>
                  <div>
                    <ElementsSection 
                      isWrapped={false} 
                      section={{ ...section, elements: [getEl('role', 'text', { text: item.role || '', textSize: 'small' }, { opacity: '0.5' })] }} 
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
              </div>
            </div>
          );
        })}
        
        {/* Add Testimonial Button */}
        {isSelected && !readOnly && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddItem();
            }} 
            className="border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs gap-2 min-h-[200px] rounded-lg py-8 w-full"
          >
            <span className="text-2xl">+</span>
            Add Testimonial
          </button>
        )}
      </div>
    </div>
  );
};