import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';
import { useTheme } from '@ui/blocks';

interface TestimonialsMulticolorProps {
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

export const TestimonialsMulticolor: React.FC<TestimonialsMulticolorProps> = ({ 
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
  const { themeData } = useTheme();

  // Element IDs for section title and subtitle
  const titleId = `${section.id}-testimonials-title`;
  const subtitleId = `${section.id}-testimonials-subtitle`;
  const badgeId = `${section.id}-testimonials-badge`;

  // Get elements from section.elements
  const titleElement = section.elements?.find(e => e.id === titleId);
  const subtitleElement = section.elements?.find(e => e.id === subtitleId);
  const badgeElement = section.elements?.find(e => e.id === badgeId);
  
  // Theme colors
  const styleAny = styles as any;
  const themeColors = {
    ...styles,
    titleColor: styles.titleColor || themeData?.heading,
    textColor: styles.textColor || themeData?.description,
    subtitleColor: styles.subtitleColor || styles.textColor || themeData?.description,
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
    heading: themeData?.heading || styles.titleColor || '#1F2937',
    description: themeData?.description || styles.textColor || '#6B7280',
    primaryButton: themeData?.primaryButton?.bg || styles.buttonBackgroundColor || '#E11D48',
    accent: themeData?.accent || styles.accentColor || '#F59E0B',
    badge: {
      background: themeData?.badge?.background || `${themeData?.primaryButton?.bg || '#E11D48'}26`,
      text: themeData?.badge?.text || themeData?.heading || '#F8FAFC'
    }
  };
  
  // Helper to create badge element
  const getBadgeElement = (): WebsiteElement => {
    if (badgeElement) return badgeElement;
    return {
      id: badgeId,
      type: 'badge',
      content: {
        text: content.badgeText || 'Customer Reviews'
      },
      style: {} // Let ElementsSection use theme badge colors by default
    };
  };
  
  // Helper to create fallback element
  const getTitleElement = (): WebsiteElement => {
    if (titleElement) return titleElement;
    
    return {
      id: titleId,
      type: 'heading',
      content: {
        text: content.title || 'What Our Customers Say',
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
        text: content.subtitle || "Don't just take our word for it. Here's what our satisfied customers have to say about our services.",
        textSize: 'base' as 'base' | 'small' | 'large' | 'xl'
      },
      style: {
        color: colors.description
      }
    };
  };

  // Get testimonials items
  const items = content.items || content.testimonials || [
    { title: 'Review 1', description: 'Excellent service!', author: 'John Doe', rating: 5 },
    { title: 'Review 2', description: 'Very satisfied!', author: 'Jane Smith', rating: 5 }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-8 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
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
          
          <div className="mb-4">
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
          
          <div className="max-w-2xl mx-auto">
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

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item: any, index: number) => {
            const elementPrefix = `${section.id}-testim-${index}`;
            
            const getEl = (idSuffix: string, fallbackType: any, fallbackContent: any, fallbackStyle: any): WebsiteElement => {
              const fullId = `${elementPrefix}-${idSuffix}`;
              return section.elements?.find(e => e.id === fullId) || {
                id: fullId, type: fallbackType, content: fallbackContent, style: fallbackStyle
              };
            };

            return (
              <div 
                key={item.id || index} 
                className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl flex flex-col h-full"
                style={{
                  border: `1px solid ${colors.primaryButton}26`
                }}
              >
                {/* Hover Border Effect */}
                <div 
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    border: `2px solid ${colors.primaryButton}66`,
                    boxShadow: `0 0 20px ${colors.primaryButton}33`
                  }}
                ></div>

                {/* Quote Icon */}
                <div className="flex justify-center mb-6">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primaryButton}, ${colors.accent})`
                    }}
                  >
                    <i className="fa-solid fa-quote-left text-white text-xl"></i>
                  </div>
                </div>

                {/* Stars Rating */}
                <div className="mb-6 flex justify-center">
                  <ElementsSection 
                    isWrapped={false} 
                    section={{ ...section, elements: [getEl('stars', 'star-rating', { rating: item.rating || 5, maxRating: 5 }, { color: colors.accent })] }} 
                    onElementSelect={onElementSelect} 
                    selectedElementId={selectedElementId} 
                    onElementUpdate={onElementUpdate || (() => {})} 
                    onTextEdit={onTextEdit} 
                    buttonClass={buttonClass}
                    readOnly={readOnly} 
                    themeColors={themeColors} 
                  />
                </div>

                {/* Review Text */}
                <div className="relative flex-1 mb-6">
                  <ElementsSection 
                    isWrapped={false} 
                    section={{ ...section, elements: [getEl('quote', 'text', { text: item.description || item.quote || item.content || item.text || 'Excellent product.', textSize: 'base' }, { fontStyle: 'italic', opacity: '0.9', textAlign: 'center' })] }} 
                    onElementSelect={onElementSelect} 
                    selectedElementId={selectedElementId} 
                    onElementUpdate={onElementUpdate || (() => {})} 
                    onTextEdit={onTextEdit} 
                    buttonClass={buttonClass}
                    readOnly={readOnly} 
                    themeColors={themeColors} 
                  />
                </div>

                {/* Customer Name */}
                <div className="text-center mt-auto">
                  <div 
                    className="inline-block px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: `${colors.primaryButton}1A`
                    }}
                  >
                    <ElementsSection 
                      isWrapped={false} 
                      section={{ ...section, elements: [getEl('author', 'text', { text: item.author || item.customer_name || item.name || 'User', textSize: 'small' }, { fontWeight: 'bold', textAlign: 'center' })] }} 
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

                {/* Bottom Accent Line */}
                <div 
                  className="h-1 rounded-full transition-all duration-500 group-hover:w-full mt-4 mx-auto"
                  style={{
                    width: '3rem',
                    background: `linear-gradient(90deg, ${colors.primaryButton}, ${colors.accent})`
                  }}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-2xl mx-auto max-w-4xl"
            style={{
              backgroundColor: `${colors.primaryButton}14`,
              border: `1px solid ${colors.primaryButton}33`
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fa-solid fa-star text-yellow-400 text-sm"></i>
                ))}
              </div>
              <span className="text-gray-900 font-bold text-sm sm:text-base lg:text-lg">5.0</span>
            </div>
            <div className="hidden sm:block w-px h-6 lg:h-8 bg-gray-300"></div>
            <div className="text-gray-600 text-sm sm:text-base">
              <span className="font-bold text-gray-900">{items.length}+</span> Happy Customers
            </div>
            <div className="hidden sm:block w-px h-6 lg:h-8 bg-gray-300"></div>
            <div className="text-gray-600 text-sm sm:text-base">
              <span className="font-bold text-gray-900">100%</span> Satisfaction Rate
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
