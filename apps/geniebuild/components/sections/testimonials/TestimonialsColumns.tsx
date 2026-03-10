import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';

interface TestimonialsColumnsProps {
  section: Section;
  isSelected?: boolean;
  onTextEdit: (key: any, value: string) => void;
  onItemEdit?: (itemId: string, updates: any) => void;
  onRemoveItem?: (id: string) => void;
  onAddItem?: () => void;
  titleClass?: string;
  titleStyle?: React.CSSProperties;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  buttonClass?: string;
}

export const TestimonialsColumns: React.FC<TestimonialsColumnsProps> = ({ 
  section, 
  isSelected = false, 
  onTextEdit, 
  onRemoveItem, 
  onAddItem,
  onElementSelect,
  onElementUpdate,
  selectedElementId,
  readOnly = false,
  buttonClass = ''
}) => {
  const { content, styles } = section;
  const styleAny = styles as any;

  // Theme colors for global fallback inheritance
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

  // --- SECTION HEADERS ---
  const titleId = `${section.id}-testimonials-title`;
  const subtitleId = `${section.id}-testimonials-subtitle`;

  const getTitleElement = (): WebsiteElement => {
    return section.elements?.find(e => e.id === titleId) || {
      id: titleId, type: 'heading', 
      content: { text: content.title || '', htmlTag: (styles.titleHeadingTag || 'h2') as any },
      style: { color: styles.titleColor, fontSize: styles.titleSize, fontWeight: themeColors.titleFontWeight || 'bold', textAlign: (themeColors.titleAlign || 'center') as any, fontFamily: themeColors.titleFontFamily }
    };
  };

  const getSubtitleElement = (): WebsiteElement => {
    return section.elements?.find(e => e.id === subtitleId) || {
      id: subtitleId, type: 'text', 
      content: { text: content.subtitle || '', textSize: 'base' },
      style: { color: styles.subtitleColor || styles.textColor, fontWeight: themeColors.subtitleFontWeight || '400', textAlign: (themeColors.subtitleAlign || 'center') as any, fontFamily: themeColors.subtitleFontFamily }
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
    <div className={`${styles.maxWidth || 'max-w-6xl'} mx-auto px-6`}>
      
      {/* HEADER SECTION */}
      <div className="mb-16 text-center max-w-3xl mx-auto">
        <div className="mb-4">
          <ElementsSection isWrapped={false} section={{ ...section, elements: [getTitleElement()] }} onElementSelect={onElementSelect} selectedElementId={selectedElementId} onElementUpdate={onElementUpdate || (() => {})} onTextEdit={onTextEdit} buttonClass={buttonClass} readOnly={readOnly} themeColors={themeColors} />
        </div>
        {content.subtitle && (
          <div className="opacity-70">
            <ElementsSection isWrapped={false} section={{ ...section, elements: [getSubtitleElement()] }} onElementSelect={onElementSelect} selectedElementId={selectedElementId} onElementUpdate={onElementUpdate || (() => {})} onTextEdit={onTextEdit} buttonClass={buttonClass} readOnly={readOnly} themeColors={themeColors} />
          </div>
        )}
      </div>

      {/* COLUMNS LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {items.map((item: any, index: number) => {
          const elementPrefix = `${section.id}-testim-${index}`;
          
          // PROFESSIONAL DRY HELPER: Replaces 50 lines of duplicate fallback code
          const getEl = (idSuffix: string, fallbackType: any, fallbackContent: any, fallbackStyle: any): WebsiteElement => {
            const fullId = `${elementPrefix}-${idSuffix}`;
            return section.elements?.find(e => e.id === fullId) || {
              id: fullId, type: fallbackType, content: fallbackContent, style: fallbackStyle
            };
          };

          return (
            <div key={item.id} className="relative group/item p-8 border-l-4 bg-gradient-to-r from-white/5 to-transparent rounded-r-2xl" style={{ borderColor: styles.accentColor || '#3b82f6' }}>
              
              {/* Delete Item Button */}
              {isSelected && !readOnly && onRemoveItem && (
                <button onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} className="absolute -top-3 -right-3 bg-red-500 text-white w-7 h-7 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
              
              {/* Quote Mark Decoration */}
              <div className="text-6xl text-white/10 absolute top-4 left-6 font-serif pointer-events-none select-none">"</div>
              
              {/* 1. Quote Text */}
              <div className="mb-8 relative z-10 pt-4">
                <ElementsSection isWrapped={false} section={{ ...section, elements: [getEl('quote', 'text', { text: item.description || item.quote || item.content || item.text || '', textSize: 'large' }, { fontStyle: 'italic', opacity: '0.9', lineHeight: '1.7' })] }} onElementSelect={onElementSelect} selectedElementId={selectedElementId} onElementUpdate={onElementUpdate || (() => {})} onTextEdit={onTextEdit} buttonClass={buttonClass} readOnly={readOnly} themeColors={themeColors} />
              </div>

              {/* 2. Star Rating */}
              <div className="mb-8 flex justify-start relative z-10">
                <ElementsSection isWrapped={false} section={{ ...section, elements: [getEl('stars', 'star-rating', { rating: 5, maxRating: 5 }, { color: styles.accentColor || '#F59E0B', fontSize: '14px' })] }} onElementSelect={onElementSelect} selectedElementId={selectedElementId} onElementUpdate={onElementUpdate || (() => {})} onTextEdit={onTextEdit} buttonClass={buttonClass} readOnly={readOnly} themeColors={themeColors} />
              </div>
              
              {/* 3. User Profile Block */}
              <div className="flex items-center gap-4 relative z-10">
                {/* Avatar */}
                <div className="shrink-0">
                  <ElementsSection isWrapped={false} section={{ ...section, elements: [getEl('avatar', 'image', { imageUrl: item.avatar || item.image || item.imageUrl || '', alt: item.author || item.name || 'Avatar' }, { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' })] }} onElementSelect={onElementSelect} selectedElementId={selectedElementId} onElementUpdate={onElementUpdate || (() => {})} onTextEdit={onTextEdit} buttonClass={buttonClass} readOnly={readOnly} themeColors={themeColors} />
                </div>
                
                {/* Name & Role */}
                <div className="text-left flex-1">
                  <div className="mb-0.5">
                    <ElementsSection isWrapped={false} section={{ ...section, elements: [getEl('name', 'heading', { text: item.author || item.name || item.title || '', htmlTag: 'h6' }, { fontWeight: 'bold', margin: '0' })] }} onElementSelect={onElementSelect} selectedElementId={selectedElementId} onElementUpdate={onElementUpdate || (() => {})} onTextEdit={onTextEdit} buttonClass={buttonClass} readOnly={readOnly} themeColors={themeColors} />
                  </div>
                  <div>
                    <ElementsSection isWrapped={false} section={{ ...section, elements: [getEl('role', 'text', { text: item.role || '', textSize: 'small' }, { opacity: '0.6', margin: '0' })] }} onElementSelect={onElementSelect} selectedElementId={selectedElementId} onElementUpdate={onElementUpdate || (() => {})} onTextEdit={onTextEdit} buttonClass={buttonClass} readOnly={readOnly} themeColors={themeColors} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Add Testimonial Button */}
        {isSelected && !readOnly && onAddItem && (
          <button onClick={(e) => { e.stopPropagation(); onAddItem(); }} className="border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 transition-all flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs gap-3 min-h-[250px] rounded-2xl w-full group">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-blue-500/20 group-hover:text-blue-400">
              <i className="fa-solid fa-plus text-lg"></i>
            </div>
            Add Testimonial
          </button>
        )}
      </div>
    </div>
  );
};