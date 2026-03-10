
import React from 'react';
import { Section } from '../../../types';
import { getHeadingSizeClass } from '../../../utils/headingSizeUtils';

interface PricingProps {
  section: Section;
  isSelected: boolean;
  onTextEdit: (key: any, value: string) => void;
  onItemEdit: (itemId: string, updates: any) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
  titleClass: string;
  titleStyle?: React.CSSProperties;
  buttonClass: string;
}

export const PricingCards: React.FC<PricingProps> = ({ section, isSelected, onTextEdit, onItemEdit, onRemoveItem, onAddItem, titleClass, titleStyle, buttonClass }) => {
  const { content } = section;

  const updateFeature = (itemId: string, features: string[], index: number, newValue: string) => {
    const newFeatures = [...features];
    newFeatures[index] = newValue;
    onItemEdit(itemId, { features: newFeatures });
  };

  const addFeature = (itemId: string, features: string[]) => {
    onItemEdit(itemId, { features: [...features, "New Feature"] });
  };

  const removeFeature = (itemId: string, features: string[], index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    onItemEdit(itemId, { features: newFeatures });
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        {(() => {
          const headingTag = (styles.titleHeadingTag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
          return React.createElement(
            headingTag,
            {
              key: `pricing-title-${headingTag}-${section.id}`,
              className: `${titleClass.replace(/text-\w+(\s+md:text-\w+)?/g, getHeadingSizeClass(headingTag, styles.titleSize || 'text-3xl md:text-5xl'))} outline-none focus:ring-2 ring-white rounded px-2`,
              style: titleStyle,
              contentEditable: true,
              suppressContentEditableWarning: true,
              onBlur: (e: any) => onTextEdit('title', e.currentTarget.textContent || '')
            },
            content.title
          );
        })()}
        <p className="opacity-60 text-lg outline-none focus:ring-2 ring-white rounded px-2 max-w-2xl mx-auto" contentEditable suppressContentEditableWarning onBlur={(e) => onTextEdit('subtitle', e.currentTarget.textContent || '')}>{content.subtitle}</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {content.items?.map((item) => (
          <div key={item.id} className="relative group/item bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col hover:border-white/30 transition-colors">
            {isSelected && <button onClick={(e) => {e.stopPropagation(); onRemoveItem(item.id);}} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center text-xs z-20">×</button>}
            
            <h3 className="text-xl font-bold mb-2 outline-none focus:ring-2 ring-white rounded px-1" contentEditable suppressContentEditableWarning onBlur={(e) => onItemEdit(item.id, { title: e.currentTarget.textContent })}>{item.title}</h3>
            
            <div className="flex items-baseline mb-4">
                <div className="text-5xl font-bold outline-none focus:ring-2 ring-white rounded px-1" contentEditable suppressContentEditableWarning onBlur={(e) => onItemEdit(item.id, { price: e.currentTarget.textContent })}>{item.price}</div>
                <span className="text-base font-normal opacity-50 ml-1">/mo</span>
            </div>
            
            <p className="opacity-60 mb-8 outline-none focus:ring-2 ring-white rounded px-1 min-h-[1.5em]" contentEditable suppressContentEditableWarning onBlur={(e) => onItemEdit(item.id, { description: e.currentTarget.textContent })}>{item.description}</p>
            
            <ul className="space-y-4 mb-8 flex-1">
              {(item.features || []).map((f, i) => (
                <li key={i} className="flex items-center gap-2 group/feature">
                  <span className="text-green-500">✓</span>
                  <span className="outline-none focus:ring-2 ring-white rounded px-1 flex-1" contentEditable suppressContentEditableWarning onBlur={(e) => updateFeature(item.id, item.features || [], i, e.currentTarget.textContent || '')}>{f}</span>
                  {isSelected && (
                      <button onClick={() => removeFeature(item.id, item.features || [], i)} className="text-red-500 opacity-0 group-hover/feature:opacity-100 px-2 text-xs hover:bg-white/10 rounded">✕</button>
                  )}
                </li>
              ))}
               {isSelected && (
                 <li className="pt-2">
                   <button onClick={() => addFeature(item.id, item.features || [])} className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">+ Add Feature</button>
                 </li>
               )}
            </ul>
            
            <button className={buttonClass + ' w-full py-4 text-lg'}>Get Started</button>
          </div>
        ))}

        {isSelected && (
           <button 
             onClick={(e) => {e.stopPropagation(); onAddItem();}} 
             className="border-2 border-dashed border-white/20 rounded-3xl p-8 hover:border-white/40 hover:bg-white/5 transition flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs gap-4 min-h-[400px]"
           >
             <span className="text-2xl">+</span> Add Plan
           </button>
         )}
      </div>
    </div>
  );
};
