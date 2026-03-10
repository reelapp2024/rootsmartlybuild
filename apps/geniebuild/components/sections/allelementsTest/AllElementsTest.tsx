import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';

interface AllElementsTestProps {
  section: Section;
  onTextEdit?: (key: any, value: string) => void;
  onImageClick?: () => void;
  buttonClass: string;
  onElementSelect?: (elementId: string) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  defaultSizes?: any;
  defaultTypography?: any;
}

/**
 * AllElementsTest Section
 * 
 * This section contains all 25 elements for testing purposes.
 * It displays all elements in a grid layout for easy testing and debugging.
 */
export const AllElementsTest: React.FC<AllElementsTestProps> = ({
  section,
  onTextEdit,
  buttonClass,
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false,
  defaultSizes,
  defaultTypography
}) => {
  const { content, styles } = section;
  const elements = section.elements || [];

  // Create all 25 elements if they don't exist
  const allElementTypes: Array<{ type: string; label: string; content: any; style: any }> = [
    // Basic Elements (13)
    { type: 'heading', label: 'Heading', content: { text: 'Sample Heading', htmlTag: 'h2' }, style: { color: styles.titleColor || '#F8FAFC' } },
    { type: 'text', label: 'Text', content: { text: 'This is a sample text element for testing.', textSize: 'base' }, style: { color: styles.textColor || '#D1D5DB' } },
    { type: 'button', label: 'Button', content: { text: 'Click Me', link: '' }, style: { backgroundColor: styles.buttonBackgroundColor || '#E11D48', color: styles.buttonTextColor || '#FFFFFF' } },
    { type: 'image', label: 'Image', content: { imageUrl: 'http://localhost:1111/files/placeholder.jpg', imageAlt: 'Sample Image' }, style: { width: '200px', height: '150px' } },
    { type: 'video', label: 'Video', content: { videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoTitle: 'Sample Video' }, style: { width: '100%', maxWidth: '560px' } },
    { type: 'icon', label: 'Icon', content: { icon: 'fa-star', iconSize: '24px' }, style: { color: styles.accentColor || '#F59E0B' } },
    { type: 'icon-box', label: 'Icon Box', content: { icon: 'fa-check-circle', title: 'Icon Box', description: 'Sample icon box element' }, style: { backgroundColor: 'transparent' } },
    { type: 'image-box', label: 'Image Box', content: { imageUrl: 'http://localhost:1111/files/placeholder.jpg', title: 'Image Box', description: 'Sample image box element' }, style: {} },
    { type: 'list', label: 'List', content: { items: ['Item 1', 'Item 2', 'Item 3'], listType: 'ul' }, style: { color: styles.textColor || '#D1D5DB' } },
    { type: 'star-rating', label: 'Star Rating', content: { rating: 4.5, maxRating: 5 }, style: { color: styles.accentColor || '#F59E0B' } },
    { type: 'badge', label: 'Badge', content: { text: 'New', variant: 'primary' }, style: { backgroundColor: styles.accentColor || '#F59E0B', color: '#FFFFFF' } },
    { type: 'highlight-text', label: 'Highlight Text', content: { text: 'This is highlighted text', highlightColor: '#F59E0B' }, style: { color: styles.textColor || '#D1D5DB' } },
    { type: 'blockquote', label: 'Blockquote', content: { text: 'This is a sample blockquote for testing purposes.', author: 'Test Author' }, style: { borderColor: styles.accentColor || '#F59E0B', color: styles.textColor || '#D1D5DB' } },
    
    // Advanced Elements (12)
    { type: 'accordion', label: 'Accordion', content: { items: [{ title: 'Item 1', content: 'Content 1' }, { title: 'Item 2', content: 'Content 2' }] }, style: {} },
    { type: 'toggle', label: 'Toggle', content: { label: 'Toggle Switch', checked: false }, style: {} },
    { type: 'tabs', label: 'Tabs', content: { tabs: [{ label: 'Tab 1', content: 'Content 1' }, { label: 'Tab 2', content: 'Content 2' }] }, style: {} },
    { type: 'progress-bar', label: 'Progress Bar', content: { value: 75, max: 100, label: 'Progress' }, style: { backgroundColor: styles.accentColor || '#F59E0B' } },
    { type: 'counter', label: 'Counter', content: { value: 100, label: 'Count', prefix: '', suffix: '+' }, style: { color: styles.titleColor || '#F8FAFC' } },
    { type: 'testimonial', label: 'Testimonial', content: { quote: 'Great service!', author: 'John Doe', role: 'CEO', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' }, style: {} },
    { type: 'review-carousel', label: 'Review Carousel', content: { reviews: [{ rating: 5, text: 'Excellent!', author: 'Jane' }] }, style: {} },
    { type: 'alert-box', label: 'Alert Box', content: { message: 'This is an alert message', type: 'info' }, style: { backgroundColor: '#3B82F6', color: '#FFFFFF' } },
    { type: 'pricing-table', label: 'Pricing Table', content: { plans: [{ name: 'Basic', price: '$9', features: ['Feature 1', 'Feature 2'] }] }, style: {} },
    { type: 'flip-box', label: 'Flip Box', content: { frontTitle: 'Front', backTitle: 'Back', frontContent: 'Front content', backContent: 'Back content' }, style: {} },
    { type: 'call-to-action', label: 'Call to Action', content: { text: 'Get Started', subText: 'Start your free trial today' }, style: { backgroundColor: styles.buttonBackgroundColor || '#E11D48', color: styles.buttonTextColor || '#FFFFFF' } },
    { type: 'countdown-timer', label: 'Countdown Timer', content: { targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), text: 'Offer Ends In' }, style: { accentColor: styles.accentColor || '#F59E0B' } },
  ];

  // Ensure all elements exist, create them if missing
  const ensureAllElements = (): WebsiteElement[] => {
    const existingElements = [...elements];
    const existingTypes = new Set(existingElements.map(el => el.type));
    
    allElementTypes.forEach((elementDef, index) => {
      if (!existingTypes.has(elementDef.type as any)) {
        existingElements.push({
          id: `element-${section.id}-${elementDef.type}-${index}`,
          type: elementDef.type as any,
          content: elementDef.content,
          style: elementDef.style,
          settings: {}
        });
      }
    });
    
    return existingElements;
  };

  // Use ElementsSection to render all elements
  const sectionWithAllElements: Section = {
    ...section,
    elements: ensureAllElements()
  };

  return (
    <div 
      className={`${styles.maxWidth || 'max-w-7xl'} mx-auto px-6 ${styles.paddingTop || 'py-24'} ${styles.paddingBottom || 'py-24'}`}
      style={{ backgroundColor: styles.backgroundColor || 'transparent' }}
    >
      <div className="mb-12 text-center">
        {React.createElement(
          (styles.titleHeadingTag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
          {
            className: 'font-bold mb-4',
            style: { color: styles.titleColor || '#F8FAFC', textAlign: 'center' }
          },
          content.title || 'All Elements Test Section'
        )}
        {content.subtitle && (
          <p 
            className="text-lg mb-8"
            style={{ color: styles.subtitleColor || styles.textColor || '#D1D5DB', textAlign: 'center' }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allElementTypes.map((elementDef, index) => {
          const element = sectionWithAllElements.elements?.find(el => el.type === elementDef.type);
          if (!element) return null;

          return (
            <div 
              key={element.id}
              className="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                  {elementDef.label}
                </span>
                <span className="ml-2 text-xs text-white/30">
                  ({elementDef.type})
                </span>
              </div>
              <div className="min-h-[100px]">
                <ElementsSection
                  section={{
                    ...sectionWithAllElements,
                    elements: [element]
                  }}
                  onTextEdit={onTextEdit || (() => {})}
                  onElementUpdate={onElementUpdate || ((elementId, updates) => {
                    // Handle element updates if needed
                  })}
                  onElementSelect={onElementSelect}
                  selectedElementId={selectedElementId}
                  buttonClass={buttonClass}
                  readOnly={readOnly}
                  themeColors={{
                    titleColor: section.styles?.titleColor,
                    textColor: section.styles?.textColor,
                    accentColor: section.styles?.accentColor,
                    buttonBackgroundColor: section.styles?.buttonBackgroundColor,
                    buttonTextColor: section.styles?.buttonTextColor,
                    backgroundColor: section.styles?.backgroundColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
