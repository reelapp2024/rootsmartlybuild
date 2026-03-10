
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

export const FeaturesList: React.FC<FeaturesProps> = ({ section, isSelected, onTextEdit, onItemEdit, onAddItem, onRemoveItem }) => {
  const { content, styles } = section;
  return (
    <div className="max-w-4xl mx-auto px-6 relative z-10">
      {(() => {
        const headingTag = (styles.titleHeadingTag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        return React.createElement(
          headingTag,
          {
            key: `features-title-${headingTag}-${section.id}`,
            className: `${getHeadingSizeClass(headingTag, styles.titleSize || 'text-3xl md:text-4xl')} font-bold mb-12 text-center outline-none focus:ring-2 ring-white rounded px-2`,
            style: {color: styles.titleColor},
            contentEditable: true,
            suppressContentEditableWarning: true,
            onBlur: (e: any) => onTextEdit('title', e.currentTarget.textContent || '')
          },
          content.title
        );
      })()}
      <div className="flex flex-col gap-6">
        {content.items?.map((item) => (
          <div key={item.id} className="relative group/item flex items-start gap-6 p-6 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
            {isSelected && <button onClick={(e) => {e.stopPropagation(); onRemoveItem(item.id);}} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center text-xs z-20">×</button>}
            <div className="text-3xl shrink-0 outline-none focus:ring-2 ring-white rounded px-1" contentEditable suppressContentEditableWarning onBlur={(e) => onItemEdit(item.id, { icon: e.currentTarget.textContent })}>{item.icon}</div>
            <div className="flex-1">
                <h3 className="font-bold mb-2 text-xl outline-none focus:ring-2 ring-white rounded px-1" contentEditable suppressContentEditableWarning onBlur={(e) => onItemEdit(item.id, { title: e.currentTarget.textContent })}>{item.title}</h3>
                <p className="opacity-70 leading-relaxed outline-none focus:ring-2 ring-white rounded px-1" contentEditable suppressContentEditableWarning onBlur={(e) => onItemEdit(item.id, { description: e.currentTarget.textContent })}>{item.description}</p>
            </div>
          </div>
        ))}
        {isSelected && <button onClick={(e) => {e.stopPropagation(); onAddItem();}} className="border-2 border-dashed border-white/20 rounded-xl p-4 hover:border-white/40 hover:bg-white/5 transition text-slate-400 font-bold uppercase tracking-widest text-xs">+ Add Feature</button>}
      </div>
    </div>
  );
};
