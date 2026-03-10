
import React, { useState } from 'react';
import { Section } from '../../../types';

interface NavbarProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onLinkEdit: (index: number, value: string) => void;
  onLogoClick: () => void;
  readOnly?: boolean;
}

export const NavbarMinimal: React.FC<NavbarProps> = ({ section, onTextEdit, onLinkEdit, onLogoClick, readOnly }) => {
  const { content, styles } = section;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isCustomColor = (value?: string) => value && (value.startsWith('#') || value.startsWith('rgb'));
  const logoStyle = { color: isCustomColor(styles.titleColor) ? styles.titleColor : undefined };

  return (
    <nav className="relative z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between relative z-50 bg-inherit">
           <div className="shrink-0">
             {content.logoImageUrl ? (
                <img 
                    src={content.logoImageUrl} 
                    alt="Logo" 
                    className="h-8 md:h-9 w-auto object-contain cursor-pointer"
                    onClick={onLogoClick}
                />
            ) : (
                <div 
                    className="font-bold text-lg md:text-xl outline-none focus:ring-2 ring-white rounded px-1" 
                    style={logoStyle} 
                    contentEditable={!readOnly}
                    suppressContentEditableWarning 
                    onBlur={(e) => onTextEdit('logo', e.currentTarget.textContent || '')}
                >
                    {content.logo}
                </div>
            )}
           </div>
        
        {/* Desktop Links */}
        <div className="hidden md:flex gap-8">
            {content.links?.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.href} 
                  className="hover:opacity-75 font-medium text-sm transition-opacity outline-none focus:ring-2 ring-white rounded px-1"
                  onClick={(e) => { if(!readOnly) e.preventDefault(); }}
                  contentEditable={!readOnly}
                  suppressContentEditableWarning
                  onBlur={(e) => onLinkEdit(idx, e.currentTarget.textContent || '')}
                >
                  {link.label}
                </a>
            ))}
        </div>

        {/* Mobile Toggle */}
        <button 
            className="md:hidden text-xl z-50 focus:outline-none p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
            <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>

      {/* Mobile Menu */}
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
          </div>
      </div>
    </nav>
  );
};
