
import React from 'react';
import { Section } from '../../../types';
import { getHeadingSizeClass } from '../../../utils/headingSizeUtils';

interface FeaturesProps {
  section: Section;
  isSelected: boolean;
  onTextEdit: (key: any, value: string) => void;
  onItemEdit: (itemId: string, updates: any) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
}

export const FeaturesGrid: React.FC<FeaturesProps> = ({ section, isSelected, onTextEdit, onItemEdit, onAddItem, onRemoveItem }) => {
  const { content, styles } = section;
  const headingTag = (styles.titleHeadingTag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  return (
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      {React.createElement(
        headingTag,
        {
          key: `features-title-${headingTag}-${section.id}`, // Force re-render when tag changes
          className: `${getHeadingSizeClass(headingTag, styles.titleSize || 'text-3xl md:text-4xl')} font-bold mb-4 text-center outline-none focus:ring-2 ring-white rounded px-2`,
          style: {color: styles.titleColor},
          contentEditable: true,
          suppressContentEditableWarning: true,
          onBlur: (e: any) => onTextEdit('title', e.currentTarget.textContent || '')
        },
        content.title
      )}
      
      {content.subtitle && (
         <p 
            className="text-center opacity-70 max-w-2xl mx-auto mb-12 text-lg outline-none focus:ring-2 ring-white rounded px-2 min-h-[1.5em]" 
            style={{color: styles.subtitleColor}} 
            contentEditable 
            suppressContentEditableWarning 
            onBlur={(e) => onTextEdit('subtitle', e.currentTarget.textContent || '')}
         >
            {content.subtitle}
         </p>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {content.items?.map((item) => (
          <div key={item.id} className="relative group/item p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/50 transition-colors">
            {isSelected && <button onClick={(e) => {e.stopPropagation(); onRemoveItem(item.id);}} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center text-xs z-20">×</button>}
            <div className="text-4xl mb-4 outline-none focus:ring-2 ring-white rounded px-1 w-fit" contentEditable suppressContentEditableWarning onBlur={(e) => onItemEdit(item.id, { icon: e.currentTarget.textContent })}>{item.icon}</div>
            <h3 className="font-bold mb-3 text-xl outline-none focus:ring-2 ring-white rounded px-1" contentEditable suppressContentEditableWarning onBlur={(e) => onItemEdit(item.id, { title: e.currentTarget.textContent })}>{item.title}</h3>
            <p className="opacity-70 leading-relaxed outline-none focus:ring-2 ring-white rounded px-1" contentEditable suppressContentEditableWarning onBlur={(e) => onItemEdit(item.id, { description: e.currentTarget.textContent })}>{item.description}</p>
          </div>
        ))}
        {isSelected && <button onClick={(e) => {e.stopPropagation(); onAddItem();}} className="border-2 border-dashed border-white/20 rounded-2xl p-8 hover:border-white/40 hover:bg-white/5 transition flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs gap-4"><span className="text-2xl">+</span>Add Feature</button>}
      </div>
    </div>
  );
};
