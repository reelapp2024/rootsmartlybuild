import React, { useState } from 'react';
import { Section, WebsiteElement } from '../types';
import { SectionRouter } from './sections/SectionRouter';
import { useTheme } from '@ui/blocks';

interface SectionRendererProps {
  section: Section;
  onUpdate: (id: string, updates: Partial<Section>) => void;
  isSelected: boolean;
  readOnly?: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onUpload?: (sectionId: string, field: string) => void;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  selectedElementId?: string | null;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ 
  section, 
  onUpdate, 
  isSelected, 
  readOnly = false,
  onClick, 
  onDelete,
  onMoveUp,
  onMoveDown,
  onUpload,
  onElementSelect,
  selectedElementId
}) => {
  const { type, content, styles } = section;
  const { themeData } = useTheme();

  const handleTextEdit = (key: keyof typeof content, value: string) => {
    if (readOnly) return;
    onUpdate(section.id, {
      content: { ...content, [key]: value }
    });
  };

  const handleItemEdit = (itemId: string, updates: any) => {
    if (readOnly) return;
    const newItems = content.items?.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    onUpdate(section.id, { content: { ...content, items: newItems } });
  };

  const handleElementUpdate = (elementId: string, updates: Partial<WebsiteElement>) => {
    if (readOnly) return;
    const newElements = section.elements?.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
    );
    onUpdate(section.id, { elements: newElements });
  };

  const handleLinkEdit = (index: number, newLabel: string) => {
    if (readOnly) return;
    const links = content.links || [];
    const newLinks = [...links];
    if(newLinks[index]) {
        newLinks[index] = { ...newLinks[index], label: newLabel };
        onUpdate(section.id, { content: { ...content, links: newLinks } });
    }
  };

  const addItem = () => {
    if (readOnly) return;
    const newItem = {
      id: `item-${Date.now()}`,
      title: 'New Item',
      description: 'Add a description here.',
      icon: '✨',
      price: '$29',
      features: ['Feature 1', 'Feature 2'],
      author: 'Name',
      role: 'Role',
      avatar: 'https://i.pravatar.cc/150'
    };
    onUpdate(section.id, { content: { ...content, items: [...(content.items || []), newItem] } });
  };

  const removeItem = (id: string) => {
    if (readOnly) return;
    onUpdate(section.id, { content: { ...content, items: content.items?.filter(i => i.id !== id) } });
  };

  const handleImageClick = () => {
    if (readOnly) return;
    if (onUpload) {
        onUpload(section.id, 'imageUrl');
    } else {
        const newUrl = prompt('Enter image URL:', content.imageUrl || '');
        if (newUrl !== null) {
          handleTextEdit('imageUrl', newUrl);
        }
    }
  };
  
  const handleLogoClick = () => {
    if (readOnly) return;
    if (onUpload) {
        onUpload(section.id, 'logoImageUrl');
    } else {
        const newUrl = prompt('Enter Logo URL:', content.logoImageUrl || '');
        if (newUrl !== null) {
          handleTextEdit('logoImageUrl', newUrl);
        }
    }
  };

  const isTailwindClass = (val?: string) => {
    if (!val) return false;
    const prefixes = ['text-', 'pt-', 'pb-', 'pl-', 'pr-', 'px-', 'py-', 'mt-', 'mb-', 'ml-', 'mr-', 'mx-', 'my-', 'bg-', 'font-', 'rounded-', 'shadow-', 'border-'];
    return prefixes.some(p => val.startsWith(p)) && !val.includes('px') && !val.includes('rem') && !val.includes('%');
  };
  
  const isCustomColor = (value?: string) => value && (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl'));

  const getBackgroundStyles = (): React.CSSProperties => {
    const bgStyles: React.CSSProperties = {};
    
    if (styles.background) {
      if (styles.background.type === 'color') {
        bgStyles.backgroundColor = styles.background.color || styles.backgroundColor || themeData?.surface || '#000000';
      } else if (styles.background.type === 'gradient') {
        const gradient = styles.background.gradient;
        if (gradient) {
          const stops = gradient.stops.map((stop: any) => `${stop.color} ${stop.position}%`).join(', ');
          if (gradient.type === 'linear') {
            bgStyles.backgroundImage = `linear-gradient(${gradient.direction || 90}deg, ${stops})`;
          } else {
            bgStyles.backgroundImage = `radial-gradient(circle, ${stops})`;
          }
        }
      } else if (styles.background.type === 'image' && styles.background.image?.url) {
        bgStyles.backgroundImage = `url(${styles.background.image.url})`;
        bgStyles.backgroundPosition = styles.background.image.position || styles.backgroundPosition || 'center';
        bgStyles.backgroundSize = styles.background.image.size || styles.backgroundSize || 'cover';
        bgStyles.backgroundRepeat = styles.background.image.repeat || styles.backgroundRepeat || 'no-repeat';
        bgStyles.backgroundAttachment = styles.background.image.attachment || styles.backgroundAttachment || 'scroll';
      }
    } else {
      if (styles.backgroundImage) {
        bgStyles.backgroundImage = `url(${styles.backgroundImage})`;
        bgStyles.backgroundSize = 'cover';
        bgStyles.backgroundPosition = 'center';
      }
      if (isCustomColor(styles.backgroundColor)) {
        bgStyles.backgroundColor = styles.backgroundColor;
      } else {
        // Fall back to theme surface color if no background is set (including empty string, null, undefined)
        const hasBackground = styles.backgroundColor && styles.backgroundColor.trim() !== '';
        if (!hasBackground && themeData?.surface) {
          bgStyles.backgroundColor = themeData.surface;
        } else if (hasBackground && !isCustomColor(styles.backgroundColor)) {
          // Keep Tailwind class-based backgrounds
          bgStyles.backgroundColor = undefined;
        }
      }
    }
    
    return bgStyles;
  };

  const inlineStyles: React.CSSProperties = {
    ...getBackgroundStyles(),
    ...(isCustomColor(styles.textColor) ? { color: styles.textColor } : { color: themeData?.description }),
    ...(!isTailwindClass(styles.marginTop) ? { marginTop: styles.marginTop } : {}),
    ...(!isTailwindClass(styles.marginBottom) ? { marginBottom: styles.marginBottom } : {}),
    ...(!isTailwindClass(styles.marginLeft) ? { marginLeft: styles.marginLeft } : {}),
    ...(!isTailwindClass(styles.marginRight) ? { marginRight: styles.marginRight } : {}),
    ...(!isTailwindClass(styles.paddingTop) ? { paddingTop: styles.paddingTop } : {}),
    ...(!isTailwindClass(styles.paddingBottom) ? { paddingBottom: styles.paddingBottom } : {}),
    ...(!isTailwindClass(styles.paddingLeft) ? { paddingLeft: styles.paddingLeft } : {}),
    ...(!isTailwindClass(styles.paddingRight) ? { paddingRight: styles.paddingRight } : {}),
  };

  const bgClass = !styles.background && !isCustomColor(styles.backgroundColor) ? styles.backgroundColor : '';
  const textClass = !isCustomColor(styles.textColor) ? styles.textColor : '';
  
  const spacingClasses = [
      isTailwindClass(styles.paddingTop) ? styles.paddingTop : '',
      isTailwindClass(styles.paddingBottom) ? styles.paddingBottom : '',
      isTailwindClass(styles.paddingLeft) ? styles.paddingLeft : '',
      isTailwindClass(styles.paddingRight) ? styles.paddingRight : '',
      isTailwindClass(styles.marginTop) ? styles.marginTop : '',
      isTailwindClass(styles.marginBottom) ? styles.marginBottom : '',
      isTailwindClass(styles.marginLeft) ? styles.marginLeft : '',
      isTailwindClass(styles.marginRight) ? styles.marginRight : ''
  ].filter(Boolean).join(' ');
  
  const containerClass = `relative group transition-all duration-300 ${bgClass} ${textClass} ${spacingClasses} ${!readOnly && isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black z-10 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : (!readOnly ? 'hover:ring-1 hover:ring-white/20 cursor-pointer' : '')}`;

  const formatColorClass = (prefix: string, val?: string) => {
    if (!val) return '';
    if (val.startsWith('#') || val.startsWith('rgb')) return `${prefix}-[${val}]`;
    return val;
  };

  const btnBg = formatColorClass('bg', styles.buttonBackgroundColor) || 'bg-white';
  const btnText = formatColorClass('text', styles.buttonTextColor) || 'text-black';

  const buttonBase = `${btnBg} ${btnText} px-6 py-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-current/20`;
  
  let borderRadius = 'rounded-lg';
  if (styles.borderRadius) {
      borderRadius = styles.borderRadius; 
  } else if (styles.buttonStyle === 'pill') {
      borderRadius = 'rounded-full';
  } else if (styles.buttonStyle === 'square') {
      borderRadius = 'rounded-none';
  }

  const buttonClass = `${buttonBase} ${borderRadius}`;
  
  const hasCustomSize = styles.titleSize && (styles.titleSize.includes('px') || styles.titleSize.includes('rem') || styles.titleSize.includes('em'));
  const titleClass = `font-bold mb-6 ${!isCustomColor(styles.titleColor) ? styles.titleColor || '' : ''}`;
  const titleStyle = {
    ...(isCustomColor(styles.titleColor) ? { color: styles.titleColor } : {}),
    ...(hasCustomSize ? { fontSize: styles.titleSize } : {})
  };

  const isFixedSection = type === 'navbar' || type === 'footer';

  // THE FIX: Properly prioritize Theme Overlay colors over the background image block
  const getOverlayStyles = (): { style: React.CSSProperties, show: boolean } => {
    // 1. Primary Source: Unified Background Object
    // Prioritize image overlay when background type is 'image'
    const bgOverlay = (styles.background?.type === 'image' ? styles.background?.image?.overlay : styles.background?.overlay) || styles.background?.overlay || styles.background?.image?.overlay;
    
    // 2. Secondary Source: Legacy Flat Properties
    const legacyColor = styles.overlayColor;
    const legacyOpacity = styles.overlayOpacityValue !== undefined ? styles.overlayOpacityValue : styles.overlayOpacity;
    const legacyBlend = styles.overlayBlendMode;
    
    // 3. Check if section has background image (for theme fallback)
    const hasBackgroundImage = styles.background?.type === 'image' || !!styles.backgroundImage;
    
    // 4. Fallback to theme overlay if background image exists and no explicit overlay is set
    const overlayColor = bgOverlay?.color || legacyColor || (hasBackgroundImage ? themeData?.overlay?.color : undefined);
    const hasOverlay = overlayColor && overlayColor !== 'transparent';
    
    if (hasOverlay && bgOverlay?.enabled !== false) {
      // Fallback opacity: bgOverlay -> legacy -> theme -> default 0.5
      const rawOpacityStr = bgOverlay?.opacity !== undefined 
        ? bgOverlay.opacity 
        : (legacyOpacity !== undefined 
          ? legacyOpacity 
          : (themeData?.overlay?.opacity !== undefined 
            ? themeData.overlay.opacity 
            : 0.5));
      const parsedOpacity = typeof rawOpacityStr === 'string' ? parseFloat(rawOpacityStr) : rawOpacityStr;
      const finalOpacity = parsedOpacity > 1 ? parsedOpacity / 100 : parsedOpacity;
      
      // Fallback blend mode: bgOverlay -> legacy -> theme -> 'normal'
      const blendMode = bgOverlay?.blendMode || legacyBlend || themeData?.overlay?.blend || 'normal';
      
      return {
        show: true,
        style: {
          backgroundColor: overlayColor,
          opacity: finalOpacity,
          mixBlendMode: blendMode as any
        }
      };
    }
    
    return { show: false, style: {} };
  };

  const overlay = getOverlayStyles();

  const renderContent = () => {
    return (
      <SectionRouter
        section={section}
        onTextEdit={handleTextEdit}
        onImageClick={handleImageClick}
        onLinkEdit={handleLinkEdit}
        onLogoClick={handleLogoClick}
        onItemEdit={handleItemEdit}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpload={onUpload}
        onElementUpdate={handleElementUpdate}
        onElementSelect={onElementSelect}
        selectedElementId={selectedElementId}
        buttonClass={buttonClass}
        isSelected={isSelected}
        titleClass={titleClass}
        titleStyle={titleStyle}
        readOnly={readOnly}
      />
    );
  };

  const enableGeometry = styles.enableGeometry !== undefined ? styles.enableGeometry : (styles.variant === 'HeroGeometric');
  
  return (
    <div className={containerClass} style={inlineStyles} onClick={(e) => { if(!readOnly) { e.stopPropagation(); onClick(); }}}>
      {/* Background overlay */}
      {overlay.show && (
          <div 
            className="absolute inset-0 z-0 pointer-events-none" 
            style={overlay.style}
          ></div>
      )}
      
      {/* Geometry overlay */}
      {enableGeometry && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
        </div>
      )}
      
      {isSelected && !readOnly && (
        <div className="absolute top-4 right-4 z-50 flex items-center space-x-2 bg-black/90 backdrop-blur-md p-1.5 rounded-lg shadow-2xl border border-white/10 font-sans">
            <div className="px-3 text-[10px] font-black uppercase tracking-widest text-white">Section {type}</div>
            
            {!isFixedSection && (
                <>
                <button onClick={(e) => { e.stopPropagation(); onMoveUp(section.id); }} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors" title="Move Up">
                <i className="fa-solid fa-arrow-up text-xs"></i>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onMoveDown(section.id); }} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors" title="Move Down">
                <i className="fa-solid fa-arrow-down text-xs"></i>
                </button>
                </>
            )}

            <div className="w-px h-6 bg-white/20 mx-1"></div>

            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(section.id); }}
              className="bg-red-500/10 text-red-500 p-2 rounded-md hover:bg-red-500 hover:text-white transition-all" 
              title="Delete Section"
            >
               <i className="fa-solid fa-trash-can text-xs"></i>
            </button>
        </div>
      )}
      
      {/* Ensure content sits above the background and overlays */}
      <div className="relative z-10 w-full h-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default SectionRenderer;