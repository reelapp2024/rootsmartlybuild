
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

export const FooterCentered: React.FC<FooterProps> = ({ section, onTextEdit, onLinkEdit, onLogoClick, buttonClass, readOnly }) => {
  const { content } = section;
  return (
    <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-10">
        {content.logoImageUrl ? (
             <img 
                src={content.logoImageUrl} 
                alt="Logo" 
                className="h-12 w-auto object-contain cursor-pointer"
                onClick={onLogoClick}
            />
        ) : (
            <h3 
                className="text-3xl font-bold outline-none focus:ring-2 ring-white rounded px-1" 
                contentEditable={!readOnly}
                suppressContentEditableWarning 
                onBlur={(e) => onTextEdit('title', e.currentTarget.textContent || '')}
            >
                {content.title}
            </h3>
        )}
        <p 
            className="opacity-60 max-w-lg outline-none focus:ring-2 ring-white rounded px-1 leading-relaxed" 
            contentEditable={!readOnly}
            suppressContentEditableWarning 
            onBlur={(e) => onTextEdit('description', e.currentTarget.textContent || '')}
        >
            {content.description}
        </p>
        <div className="flex flex-wrap justify-center gap-8">
            {content.links?.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.href} 
                  className="transition-opacity opacity-70 hover:opacity-100 font-medium outline-none focus:ring-2 ring-white rounded px-1"
                  onClick={(e) => { if(!readOnly) e.preventDefault(); }}
                  contentEditable={!readOnly}
                  suppressContentEditableWarning
                  onBlur={(e) => onLinkEdit(idx, e.currentTarget.textContent || '')}
                >
                  {link.label}
                </a>
            ))}
        </div>
        <div className="flex w-full max-w-md gap-2 mt-4">
            <input 
                type="email" 
                placeholder="Email address" 
                className="bg-white/5 border border-white/10 px-5 py-3 rounded-lg w-full focus:ring-1 ring-white/50 focus:outline-none focus:bg-white/10 transition-all placeholder:text-white/30" 
                disabled={readOnly}
            />
            <button className={`${buttonClass} px-6`}>Join</button>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 w-full text-xs opacity-30">
            © {new Date().getFullYear()} {content.title}. All rights reserved.
        </div>
    </div>
  );
};
