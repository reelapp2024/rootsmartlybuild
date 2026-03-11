import React, { useState } from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';
import { useTheme } from '@ui/blocks';

interface FAQMulticolorProps {
  section: Section;
  isSelected?: boolean;
  onTextEdit: (key: any, value: string) => void;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
}

export const FAQMulticolor: React.FC<FAQMulticolorProps> = ({
  section,
  onTextEdit,
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false,
}) => {
  const { content, styles } = section;
  const { themeData } = useTheme();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const styleAny = styles as any;
  
  // Theme colors
  const themeColors = {
    ...styles,
    titleColor: styles.titleColor || themeData?.heading,
    textColor: styles.textColor || themeData?.description,
    subtitleColor: styles.subtitleColor || styles.textColor || themeData?.description,
    fontWeight: styleAny.fontWeight,
    fontSize: styleAny.fontSize,
    textAlign: styles.textAlign || 'center',
    fontFamily: styleAny.fontFamily,
  };

  // Get theme colors
  const colors = {
    heading: themeData?.heading || styles.titleColor || '#1F2937',
    description: themeData?.description || styles.textColor || '#6B7280',
    primaryButton: themeData?.primaryButton?.bg || styles.buttonBackgroundColor || '#E11D48',
    badge: {
      background: themeData?.badge?.background || `${themeData?.primaryButton?.bg || '#E11D48'}26`,
      text: themeData?.badge?.text || themeData?.heading || '#F8FAFC'
    }
  };

  // Element IDs
  const badgeId = `${section.id}-faq-badge`;
  
  // Get badge element
  const badgeElement = section.elements?.find(e => e.id === badgeId);
  
  // Professional dry helper for hydrated elements
  const getEl = (idSuffix: string, fallbackType: any, fallbackContent: any, fallbackStyle: any): WebsiteElement => {
    const fullId = `${section.id}-faq-${idSuffix}`;
    const existingElement = section.elements?.find(e => e.id === fullId);
    if (existingElement) return existingElement;
    
    return { id: fullId, type: fallbackType, content: fallbackContent, style: fallbackStyle };
  };
  
  // Helper to create badge element
  const getBadgeElement = (): WebsiteElement => {
    if (badgeElement) return badgeElement;
    return {
      id: badgeId,
      type: 'badge',
      content: {
        text: content.badgeText || 'FAQ'
      },
      style: {} // Let ElementsSection use theme badge colors by default
    };
  };

  // Safely catch dynamic AI DB data or use fallbacks
  const activeItems = content.items || content.faq || content.faqs || [
    { question: 'How does the billing work?', answer: 'We offer flexible pricing plans depending on your needs. You can choose to be billed monthly or annually.' },
    { question: 'Can I cancel my subscription anytime?', answer: 'Yes, you can cancel your subscription at any time without any hidden fees or penalties.' },
    { question: 'Do you offer a free trial?', answer: 'Yes, we offer a 14-day free trial on all our premium plans so you can test the features before committing.' }
  ];

  const toggleFAQ = (index: number) => {
    if (readOnly) return;
    setOpenFAQ(openFAQ === index ? null : index);
  };

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
              readOnly={readOnly} 
              themeColors={themeColors} 
              buttonClass=""
            />
          </div>
          
          <div className="mb-4">
            <ElementsSection 
              isWrapped={false} 
              section={{ ...section, elements: [getEl('title', 'heading', { text: content.title || 'Frequently Asked Questions', htmlTag: 'h2' }, { color: colors.heading })] }} 
              onElementSelect={onElementSelect} 
              selectedElementId={selectedElementId} 
              onElementUpdate={onElementUpdate || (() => {})} 
              onTextEdit={onTextEdit} 
              readOnly={readOnly} 
              themeColors={themeColors} 
              buttonClass=""
            />
          </div>
          
          {content.subtitle && (
            <div className="max-w-2xl mx-auto">
              <ElementsSection 
                isWrapped={false} 
                section={{ ...section, elements: [getEl('subtitle', 'text', { text: content.subtitle, textSize: 'base' }, { color: colors.description })] }} 
                onElementSelect={onElementSelect} 
                selectedElementId={selectedElementId} 
                onElementUpdate={onElementUpdate || (() => {})} 
                onTextEdit={onTextEdit} 
                readOnly={readOnly} 
                themeColors={themeColors} 
                buttonClass=""
              />
            </div>
          )}
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {activeItems.map((item: any, index: number) => {
              const questionId = `${section.id}-faq-q-${index}`;
              const answerId = `${section.id}-faq-a-${index}`;
              
              const questionEl = section.elements?.find(e => e.id === questionId) || {
                id: questionId,
                type: 'text',
                content: { text: item.question || item.title || 'Question', textSize: 'base' },
                style: { fontWeight: 'semibold' }
              };
              
              const answerEl = section.elements?.find(e => e.id === answerId) || {
                id: answerId,
                type: 'text',
                content: { text: item.answer || item.content || 'Answer', textSize: 'base' },
                style: {}
              };

              return (
                <div 
                  key={index} 
                  className="group bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
                  style={{
                    border: `1px solid ${colors.primaryButton}26`
                  }}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-left flex items-center justify-between transition-all duration-300"
                    style={{
                      backgroundColor: openFAQ === index ? `${colors.primaryButton}14` : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (openFAQ !== index && !readOnly) {
                        e.currentTarget.style.backgroundColor = `${colors.primaryButton}0D`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (openFAQ !== index) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: openFAQ === index ? colors.primaryButton : `${colors.primaryButton}26`
                        }}
                      >
                        <i className={`fa-solid fa-circle-question text-white text-sm sm:text-base`}></i>
                      </div>
                      <div className="flex-1">
                        <ElementsSection 
                          isWrapped={false} 
                          section={{ ...section, elements: [questionEl] }} 
                          onElementSelect={onElementSelect} 
                          selectedElementId={selectedElementId} 
                          onElementUpdate={onElementUpdate || (() => {})} 
                          onTextEdit={onTextEdit} 
                          readOnly={readOnly} 
                          themeColors={themeColors} 
                          buttonClass=""
                        />
                      </div>
                    </div>
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: openFAQ === index ? colors.primaryButton : `${colors.primaryButton}26`,
                        transform: openFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    >
                      {openFAQ === index ? (
                        <i className="fa-solid fa-chevron-up text-white text-xs sm:text-sm"></i>
                      ) : (
                        <i className="fa-solid fa-chevron-down text-xs sm:text-sm" style={{ color: colors.primaryButton }}></i>
                      )}
                    </div>
                  </button>
                  
                  {openFAQ === index && (
                    <div 
                      className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 transition-all duration-300"
                      style={{
                        borderTop: `1px solid ${colors.primaryButton}33`
                      }}
                    >
                      <div className="pt-4">
                        <ElementsSection 
                          isWrapped={false} 
                          section={{ ...section, elements: [answerEl] }} 
                          onElementSelect={onElementSelect} 
                          selectedElementId={selectedElementId} 
                          onElementUpdate={onElementUpdate || (() => {})} 
                          onTextEdit={onTextEdit} 
                          readOnly={readOnly} 
                          themeColors={themeColors} 
                          buttonClass=""
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-2xl mx-auto max-w-2xl"
            style={{
              backgroundColor: `${colors.primaryButton}14`,
              border: `1px solid ${colors.primaryButton}33`
            }}
          >
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-message text-sm sm:text-base" style={{ color: colors.primaryButton }}></i>
              <span className="text-gray-900 font-semibold text-sm sm:text-base">Still have questions?</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-phone text-sm sm:text-base" style={{ color: colors.primaryButton }}></i>
              <span className="text-gray-600 text-sm sm:text-base">
                <span className="font-bold text-gray-900">Call us</span> for immediate help
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
