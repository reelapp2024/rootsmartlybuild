
import React from 'react';
import { Section } from '../../../types';

interface FooterProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onLinkEdit: (index: number, value: string) => void;
  onLogoClick: () => void;
  buttonClass: string;
  readOnly?: boolean;
}

export const FooterColumns: React.FC<FooterProps> = ({ section, onTextEdit, onLinkEdit, onLogoClick, buttonClass, readOnly }) => {
  const { content } = section;
  return (
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
      <div className="md:col-span-2 space-y-4 flex flex-col items-center md:items-start">
        {content.logoImageUrl ? (
             <img 
                src={content.logoImageUrl} 
                alt="Logo" 
                className="h-10 w-auto object-contain mb-2 cursor-pointer"
                onClick={onLogoClick}
            />
        ) : (
            <h3 
                className="text-2xl font-bold outline-none focus:ring-2 ring-white rounded px-1 w-fit" 
                contentEditable={!readOnly}
                suppressContentEditableWarning 
                onBlur={(e) => onTextEdit('title', e.currentTarget.textContent || '')}
            >
                {content.title}
            </h3>
        )}
        <p 
            className="opacity-60 max-w-sm outline-none focus:ring-2 ring-white rounded px-1 leading-relaxed" 
            contentEditable={!readOnly}
            suppressContentEditableWarning 
            onBlur={(e) => onTextEdit('description', e.currentTarget.textContent || '')}
        >
            {content.description}
        </p>
      </div>
      
      <div>
        <h4 className="font-bold mb-6 text-sm uppercase tracking-wider opacity-80">Links</h4>
        <ul className="space-y-3">
          {content.links?.map((link, idx) => (
              <li key={idx}>
                <a 
                  href={link.href} 
                  className="opacity-60 hover:opacity-100 transition-opacity outline-none focus:ring-2 ring-white rounded px-1"
                  onClick={(e) => { if(!readOnly) e.preventDefault(); }}
                  contentEditable={!readOnly}
                  suppressContentEditableWarning
                  onBlur={(e) => onLinkEdit(idx, e.currentTarget.textContent || '')}
                >
                  {link.label}
                </a>
              </li>
          ))}
        </ul>
      </div>
      
      <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider opacity-80">Newsletter</h4>
          <div className="flex flex-col gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg w-full focus:ring-2 ring-white/20 focus:outline-none focus:border-white/20 transition-all placeholder:text-white/20" 
                disabled={readOnly}
              />
              <button className={`${buttonClass} w-full py-3 mt-2`}>Subscribe</button>
          </div>
      </div>
    </div>
  );
};
