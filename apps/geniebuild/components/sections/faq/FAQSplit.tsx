import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';

interface FAQSplitProps {
  section: Section;
  isSelected?: boolean;
  onTextEdit: (key: any, value: string) => void;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
}

export const FAQSplit: React.FC<FAQSplitProps> = ({
  section,
  onTextEdit,
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false,
}) => {
  const { content, styles } = section;
  const styleAny = styles as any;
  
  // Theme colors for global fallback inheritance (left-aligned for this variant)
  const themeColors = {
    ...styles,
    fontWeight: styleAny.fontWeight,
    fontSize: styleAny.fontSize,
    textAlign: 'left', 
    fontFamily: styleAny.fontFamily,
  };

  // Professional dry helper for hydrated elements
  const getEl = (idSuffix: string, fallbackType: any, fallbackContent: any, fallbackStyle: any): WebsiteElement => {
    const fullId = `${section.id}-faq-${idSuffix}`;
    const existingElement = section.elements?.find(e => e.id === fullId);
    if (existingElement) return existingElement;
    
    return { id: fullId, type: fallbackType, content: fallbackContent, style: fallbackStyle };
  };

  // Safely catch dynamic AI DB data or use fallbacks
  const activeItems = content.items || content.faq || content.faqs || [
    { title: 'How does the billing work?', content: 'We offer flexible pricing plans depending on your needs. You can choose to be billed monthly or annually.' },
    { title: 'Can I cancel my subscription anytime?', content: 'Yes, you can cancel your subscription at any time without any hidden fees or penalties.' },
    { title: 'Do you offer a free trial?', content: 'Yes, we offer a 14-day free trial on all our premium plans so you can test the features before committing.' }
  ];

  return (
    <div className={`${styles.maxWidth || 'max-w-6xl'} mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start`}>
      
      {/* LEFT COLUMN: Header Section (Sticky) */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 text-left">
        <div className="mb-4">
          <ElementsSection 
            isWrapped={false} 
            section={{ ...section, elements: [getEl('title', 'heading', { text: content.title || 'Frequently Asked Questions', htmlTag: 'h2' }, { fontWeight: 'bold' })] }} 
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
          <div className="opacity-70">
            <ElementsSection 
              isWrapped={false} 
              section={{ ...section, elements: [getEl('subtitle', 'text', { text: content.subtitle, textSize: 'large' }, {})] }} 
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

      {/* RIGHT COLUMN: Reusable Accordion Element */}
      <div className="lg:col-span-7">
        <ElementsSection 
          isWrapped={false} 
          section={{ ...section, elements: [getEl('accordion', 'accordion', { items: activeItems }, { accentColor: styles.accentColor || '#3b82f6' })] }} 
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
  );
};