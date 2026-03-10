
import React, { useState } from 'react';
import { Section } from '../../../types';

interface NavbarProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onLinkEdit: (index: number, value: string) => void;
  onLogoClick: () => void;
  buttonClass: string;
  readOnly?: boolean;
}

export const NavbarCentered: React.FC<NavbarProps> = ({ section, onTextEdit, onLinkEdit, onLogoClick, buttonClass, readOnly }) => {
  const { content, styles } = section;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isCustomColor = (value?: string) => value && (value.startsWith('#') || value.startsWith('rgb'));
  const logoStyle = { color: isCustomColor(styles.titleColor) ? styles.titleColor : undefined };

  return (
    <nav className="relative z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20 md:h-24 relative z-50 bg-inherit">
        
        {/* Desktop Links (Left) */}
        <div className="hidden md:flex space-x-8 flex-1 justify-start">
          {content.links?.map((link, idx) => (
            <a 
              key={idx} 
              href={link.href} 
              className="hover:opacity-75 font-medium transition-opacity text-sm lg:text-base outline-none focus:ring-2 ring-white rounded px-1"
              onClick={(e) => { if(!readOnly) e.preventDefault(); }}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onBlur={(e) => onLinkEdit(idx, e.currentTarget.textContent || '')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Logo (Center on Desktop, Left/Center on Mobile) */}
         <div className="flex-1 md:flex-none flex justify-start md:justify-center">
             {content.logoImageUrl ? (
                <img 
                    src={content.logoImageUrl} 
                    alt="Logo" 
                    className="h-8 md:h-10 w-auto object-contain cursor-pointer"
                    onClick={onLogoClick}
                />
            ) : (
                <div 
                    className="font-bold text-xl md:text-2xl outline-none focus:ring-2 ring-white rounded px-2" 
                    style={logoStyle} 
                    contentEditable={!readOnly}
                    suppressContentEditableWarning 
                    onBlur={(e) => onTextEdit('logo', e.currentTarget.textContent || '')}
                >
                    {content.logo}
                </div>
            )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
            <button 
                className="text-2xl focus:outline-none p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
            </button>
        </div>

        {/* Desktop Button (Right) */}
        <div className="hidden md:flex flex-1 justify-end">
          <button 
            className={buttonClass} 
            contentEditable={!readOnly}
            suppressContentEditableWarning 
            onBlur={(e) => onTextEdit('ctaText', e.currentTarget.textContent || '')}
          >
            {content.ctaText}
          </button>
        </div>
      </div>

       {/* Mobile Menu Overlay */}
       <div 
        className={`md:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-xl transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}
        style={{ top: 0 }}
       >
          <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
              {content.links?.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link.href} 
                    className="text-2xl font-medium hover:text-blue-400 transition-colors outline-none focus:ring-2 ring-white rounded px-1" 
                    onClick={(e) => { if(!readOnly) e.preventDefault(); else setIsMobileMenuOpen(false); }}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    onBlur={(e) => onLinkEdit(idx, e.currentTarget.textContent || '')}
                  >
                    {link.label}
                  </a>
              ))}
              <button 
                className={`${buttonClass} w-full max-w-xs mt-4 py-4 text-lg`}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onBlur={(e) => onTextEdit('ctaText', e.currentTarget.textContent || '')}
              >
                {content.ctaText}
              </button>
          </div>
      </div>
    </nav>
  );
};
