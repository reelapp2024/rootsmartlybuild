
import React from 'react';
import { Section } from '../../../types';

interface FooterProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onLinkEdit: (index: number, value: string) => void;
  onLogoClick: () => void;
  readOnly?: boolean;
}

export const FooterMinimal: React.FC<FooterProps> = ({ section, onTextEdit, onLinkEdit, onLogoClick, readOnly }) => {
  const { content } = section;
  return (
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 text-sm text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            {content.logoImageUrl ? (
                 <img 
                    src={content.logoImageUrl} 
                    alt="Logo" 
                    className="h-8 w-auto object-contain cursor-pointer"
                    onClick={onLogoClick}
                />
            ) : (
                <div 
                    className="font-bold text-base outline-none focus:ring-2 ring-white rounded px-1" 
                    contentEditable={!readOnly}
                    suppressContentEditableWarning 
                    onBlur={(e) => onTextEdit('title', e.currentTarget.textContent || '')}
                >
                    {content.title}
                </div>
            )}
            <div 
                className="hidden md:block w-px h-4 bg-current opacity-30"
            ></div>
            <div 
                className="outline-none focus:ring-2 ring-white rounded px-1" 
                contentEditable={!readOnly}
                suppressContentEditableWarning 
                onBlur={(e) => onTextEdit('description', e.currentTarget.textContent || '')}
            >
                {content.description}
            </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
            {content.links?.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.href} 
                  className="hover:underline transition-all outline-none focus:ring-2 ring-white rounded px-1"
                  onClick={(e) => { if(!readOnly) e.preventDefault(); }}
                  contentEditable={!readOnly}
                  suppressContentEditableWarning
                  onBlur={(e) => onLinkEdit(idx, e.currentTarget.textContent || '')}
                >
                  {link.label}
                </a>
            ))}
        </div>
    </div>
  );
};
