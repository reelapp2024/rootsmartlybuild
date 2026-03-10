
import React, { useState, useEffect } from 'react';
import { Section, WebsiteElement } from '../../types';
import { useTheme } from '@ui/blocks';
import { ELEMENT_DEFAULTS } from '../../constants';

interface ElementsSectionProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onUpload?: (sectionId: string, field: string) => void;
  onElementUpdate: (elementId: string, updates: Partial<WebsiteElement>) => void;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  selectedElementId?: string | null;
  buttonClass: string;
  readOnly?: boolean;
  isWrapped?: boolean; // If false, renders elements without wrapper div (for use in custom layouts)
  themeColors?: {
    titleColor?: string;
    textColor?: string;
    accentColor?: string;
    buttonBackgroundColor?: string;
    buttonTextColor?: string;
    backgroundColor?: string;
    // Global style properties for unified styling
    buttonFontWeight?: string;
    buttonFontSize?: string;
    buttonAlign?: string;
    buttonFontFamily?: string;
    titleFontWeight?: string;
    titleFontSize?: string;
    titleAlign?: string;
    titleFontFamily?: string;
    subtitleFontWeight?: string;
    subtitleFontSize?: string;
    subtitleAlign?: string;
    subtitleFontFamily?: string;
    fontWeight?: string;
    fontSize?: string;
    textAlign?: string;
    fontFamily?: string;
  };
}

// Helper for Countdown
const CountdownTimer = ({ targetDate, style }: { targetDate: string, style: any }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;
            
            if (distance < 0) {
                clearInterval(interval);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    const boxClass = "flex flex-col items-center p-3 rounded bg-white/5 border border-white/10 min-w-[60px] md:min-w-[80px]";
    const numClass = "text-xl md:text-2xl font-bold";
    const labelClass = "text-[10px] uppercase opacity-60";

    return (
        <div className="flex gap-2 md:gap-4" style={{ justifyContent: style.textAlign === 'center' ? 'center' : (style.textAlign === 'right' ? 'flex-end' : 'flex-start') }}>
            <div className={boxClass} style={{ borderColor: style.accentColor }}>
                <span className={numClass}>{timeLeft.days}</span>
                <span className={labelClass}>Days</span>
            </div>
            <div className={boxClass} style={{ borderColor: style.accentColor }}>
                <span className={numClass}>{timeLeft.hours}</span>
                <span className={labelClass}>Hrs</span>
            </div>
            <div className={boxClass} style={{ borderColor: style.accentColor }}>
                <span className={numClass}>{timeLeft.minutes}</span>
                <span className={labelClass}>Min</span>
            </div>
            <div className={boxClass} style={{ borderColor: style.accentColor }}>
                <span className={numClass}>{timeLeft.seconds}</span>
                <span className={labelClass}>Sec</span>
            </div>
        </div>
    );
};

const getSafeStyle = (style: any): React.CSSProperties => {
  const css: any = { ...style };
  
  // Explicitly handle 'margin' object from state
  if (typeof style.margin === 'object' && style.margin !== null) {
      if(style.margin.top) css.marginTop = style.margin.top;
      if(style.margin.right) css.marginRight = style.margin.right;
      if(style.margin.bottom) css.marginBottom = style.margin.bottom;
      if(style.margin.left) css.marginLeft = style.margin.left;
      delete css.margin;
  }
  
  // Explicitly handle 'padding' object from state
  if (typeof style.padding === 'object' && style.padding !== null) {
      if(style.padding.top) css.paddingTop = style.padding.top;
      if(style.padding.right) css.paddingRight = style.padding.right;
      if(style.padding.bottom) css.paddingBottom = style.padding.bottom;
      if(style.padding.left) css.paddingLeft = style.padding.left;
      delete css.padding;
  }
  
  // Remove non-standard CSS properties
  delete css.backgroundGradient;
  delete css.backgroundOverlay;
  delete css.accentColor;
  delete css.hiddenOnDesktop;
  delete css.hiddenOnTablet;
  delete css.hiddenOnMobile;
  
  // Remove fontFamily if it's undefined, null, or empty string (let CSS theme handle it)
  if (!css.fontFamily || css.fontFamily.trim() === '') {
    delete css.fontFamily;
  }

  return css as React.CSSProperties;
};

export const ElementsSection: React.FC<ElementsSectionProps> = ({ section, onElementUpdate, onElementSelect, selectedElementId, buttonClass, readOnly = false, isWrapped = true, themeColors }) => {
  const elements = section.elements || [];
  const [activeTabs, setActiveTabs] = useState<Record<string, number>>({});
  const { themeData } = useTheme();
  
  // Get theme colors from section styles or passed prop
  // Simplified: Only core colors, let ELEMENT_DEFAULTS handle the rest
  const theme = themeColors || {
    titleColor: section.styles?.titleColor || themeData?.heading || '#F8FAFC',
    textColor: section.styles?.textColor || themeData?.description || '#D1D5DB',
    accentColor: section.styles?.accentColor || themeData?.accent || '#3b82f6',
    buttonBackgroundColor: section.styles?.buttonBackgroundColor || themeData?.primaryButton?.bg || '#E11D48',
    buttonTextColor: section.styles?.buttonTextColor || themeData?.primaryButton?.text || '#FFFFFF',
  };
  
  // Helper to merge element style with theme defaults
  // Only uses element color if it's explicitly set (not undefined/null/empty)
  const getThemeAwareStyle = (elementStyle: any, colorKey: 'color' | 'backgroundColor' | 'borderColor', themeColor?: string): any => {
    const mergedStyle = { ...elementStyle };
    
    // If element has explicit color, use it; otherwise use theme color
    if (themeColor && (!elementStyle[colorKey] || elementStyle[colorKey] === 'transparent' || elementStyle[colorKey] === '')) {
      mergedStyle[colorKey] = themeColor;
    }
    
    return mergedStyle;
  };

  const handleContentUpdate = (id: string, key: string, value: any) => {
    const el = elements.find(e => e.id === id);
    if(el) {
        onElementUpdate(id, { content: { ...el.content, [key]: value } });
    }
  };

  const handleClick = (e: React.MouseEvent, element: WebsiteElement) => {
      e.stopPropagation();
      if (onElementSelect) {
          onElementSelect(element.id, element);
      }
  };

  const renderElement = (el: WebsiteElement) => {
    const { id, type, content, style } = el;
    const isSelected = selectedElementId === id;
    const selectedClass = isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black z-20' : 'hover:ring-1 hover:ring-white/20';

    // STEP 1: Merge Global Element Defaults with Element's specific style
    const renderStyle = {
      ...(ELEMENT_DEFAULTS[el.type] || {}),
      ...(el.style || {})
    };

    // Merge element style with theme colors (only if element doesn't have explicit colors)
    let mergedStyle = { ...renderStyle };
    if (theme) {
      // Only apply theme colors if element doesn't have explicit colors
      if (!renderStyle?.color || renderStyle.color === 'transparent' || renderStyle.color === '') {
        mergedStyle.color = theme.textColor;
      }
      // For buttons, use button theme colors
      if ((type === 'button' || type === 'call-to-action') && (!renderStyle?.backgroundColor || renderStyle.backgroundColor === 'transparent' || renderStyle.backgroundColor === '')) {
        mergedStyle.backgroundColor = theme.buttonBackgroundColor;
        if (!renderStyle?.color || renderStyle.color === 'transparent' || renderStyle.color === '') {
          mergedStyle.color = theme.buttonTextColor;
        }
      }
    }
    
    const safeStyle = getSafeStyle(mergedStyle);

    switch (type) {
        case 'heading':
            const headingTag = (content.htmlTag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
            // Style Hierarchy: renderStyle (ELEMENT_DEFAULTS + element.style) > Theme Colors
            const headingStyle: React.CSSProperties = {
                ...safeStyle,
                color: safeStyle.color || theme?.titleColor || '#F8FAFC',
                // Fallback to renderStyle (which already contains ELEMENT_DEFAULTS)
                fontWeight: renderStyle.fontWeight || 'bold',
                fontSize: renderStyle.fontSize || undefined,
                textAlign: (renderStyle.textAlign as any) || 'left',
                fontFamily: (renderStyle.fontFamily && renderStyle.fontFamily.trim() !== '') 
                    ? renderStyle.fontFamily 
                    : undefined,
            };
            // Remove undefined properties
            if (!headingStyle.fontFamily) delete headingStyle.fontFamily;
            if (!headingStyle.fontSize) delete headingStyle.fontSize;
            return React.createElement(
                headingTag,
                {
                    key: `${id}-${headingTag}`, // Force re-render when tag changes
                    className: `font-bold outline-none rounded px-1 relative transition-all cursor-pointer ${selectedClass}`,
                    style: headingStyle,
                    onClick: (e: React.MouseEvent) => handleClick(e, el),
                    contentEditable: !readOnly,
                    suppressContentEditableWarning: !readOnly,
                    onBlur: !readOnly ? (e: any) => handleContentUpdate(id, 'text', e.currentTarget.textContent) : undefined
                },
                content.text
            );

        case 'text':
            // Get text size class based on textSize variant
            const textSizeClass = content.textSize === 'small' ? 'text-sm' : 
                                  content.textSize === 'large' ? 'text-lg' : 
                                  content.textSize === 'xl' ? 'text-xl' : '';
            // Style Hierarchy: renderStyle (ELEMENT_DEFAULTS + element.style) > Theme Colors
            const textStyle: React.CSSProperties = {
                ...safeStyle,
                color: safeStyle.color || theme.textColor || '#D1D5DB',
                // Fallback to renderStyle (which already contains ELEMENT_DEFAULTS)
                fontWeight: renderStyle.fontWeight || '400',
                fontSize: renderStyle.fontSize || undefined,
                textAlign: (renderStyle.textAlign as any) || 'left',
                fontFamily: (renderStyle.fontFamily && renderStyle.fontFamily.trim() !== '') 
                    ? renderStyle.fontFamily 
                    : undefined,
            };
            // Remove undefined properties
            if (!textStyle.fontFamily) delete textStyle.fontFamily;
            if (!textStyle.fontSize) delete textStyle.fontSize;
            return (
                <p 
                    key={`${id}-${content.textSize || 'base'}`}
                    className={`outline-none rounded px-1 relative transition-all cursor-pointer ${textSizeClass} ${selectedClass}`}
                    style={textStyle}
                    onClick={!readOnly ? (e: React.MouseEvent) => handleClick(e, el) : undefined}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning={!readOnly}
                    onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'text', e.currentTarget.textContent) : undefined}
                >
                    {content.text}
                </p>
            );

        case 'button':
        case 'call-to-action':
            // Style Hierarchy: renderStyle (ELEMENT_DEFAULTS + element.style) > Theme Colors
            const buttonStyle: React.CSSProperties = {
                ...safeStyle, // This includes all properties from getSafeStyle
                backgroundColor: safeStyle.backgroundColor || theme?.buttonBackgroundColor || '#E11D48',
                color: safeStyle.color || theme?.buttonTextColor || '#FFFFFF',
                textAlign: 'center' as const, // Button text is always centered internally
                // Fallback to renderStyle (which already contains ELEMENT_DEFAULTS)
                fontWeight: renderStyle.fontWeight || 'bold',
                fontSize: renderStyle.fontSize || undefined,
                fontFamily: (renderStyle.fontFamily && renderStyle.fontFamily.trim() !== '') 
                    ? renderStyle.fontFamily 
                    : undefined,
            };
            // Remove undefined properties
            if (!buttonStyle.fontSize) delete buttonStyle.fontSize;
            if (!buttonStyle.fontFamily) delete buttonStyle.fontFamily;
            const buttonElement = (
                <button 
                    className={`${buttonClass} ${!readOnly ? 'outline-none relative transition-all cursor-pointer' : ''} ${selectedClass}`}
                    style={buttonStyle}
                    onClick={!readOnly ? (e) => handleClick(e, el) : undefined}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning={!readOnly}
                    onBlur={!readOnly ? (e: any) => handleContentUpdate(id, 'text', e.currentTarget.textContent) : undefined}
                >
                    {content.text}
                </button>
            );
            
            // Use flexbox with justify-content for proper button alignment
            // Convert textAlign to flexbox justify-content: left -> flex-start, center -> center, right -> flex-end
            const getJustifyContent = (textAlign?: string): 'flex-start' | 'center' | 'flex-end' => {
                if (!textAlign) return 'center';
                switch (textAlign) {
                    case 'left': return 'flex-start';
                    case 'right': return 'flex-end';
                    case 'center': return 'center';
                    case 'justify': return 'center'; // justify doesn't make sense for buttons, default to center
                    default: return 'center';
                }
            };
            
            // CRITICAL: Use display: flex and map element.style.textAlign to justify-content
            // Read textAlign directly from renderStyle (which includes ELEMENT_DEFAULTS)
            const elementTextAlign = (renderStyle?.textAlign as string) || undefined;
            const buttonTextAlign = elementTextAlign || 'center';
            
            return (
                <div 
                    key={id} 
                    style={{ 
                        display: 'flex', 
                        width: '100%', 
                        justifyContent: buttonTextAlign === 'left' ? 'flex-start' : buttonTextAlign === 'right' ? 'flex-end' : 'center' 
                    }}
                >
                    <div>
                        {content.link ? (
                            <a 
                                href={content.link}
                                target={content.link.startsWith('http') ? '_blank' : '_self'}
                                rel={content.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                onClick={!readOnly ? (e) => {
                                    handleClick(e, el);
                                } : undefined}
                                className="inline-block"
                            >
                                {buttonElement}
                            </a>
                        ) : (
                            buttonElement
                        )}
                        {type === 'call-to-action' && content.subText && (
                            <p className="mt-2 text-sm opacity-70" contentEditable={!readOnly} suppressContentEditableWarning={!readOnly} onBlur={!readOnly ? (e) => handleContentUpdate(id, 'subText', e.currentTarget.textContent) : undefined}>{content.subText}</p>
                        )}
                    </div>
                </div>
            );

        case 'image':
            const objectFit = (renderStyle?.objectFit || 'cover') as any;
            const objectPosition = (renderStyle?.objectPosition || 'center') as string;
            const overlayColor = (renderStyle as any)?.overlayColor;
            const overlayOpacity = (renderStyle as any)?.overlayOpacity !== undefined ? parseFloat((renderStyle as any).overlayOpacity) : 0;
            
            const imageUrl = content.imageUrl || content.src || '';
            const fullImageUrl = imageUrl 
                ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:1111${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`)
                : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
            // 1. Core Outer Style (No hardcoded boxShadow here!)
            const outerStyle: React.CSSProperties = {
                position: 'relative',
                width: renderStyle?.width || '100%',
                aspectRatio: renderStyle?.aspectRatio || 'auto',
                borderRadius: renderStyle?.borderRadius || '0%',
                borderWidth: renderStyle?.borderWidth || '0px',
                borderStyle: renderStyle?.borderStyle || 'none',
                borderColor: renderStyle?.borderColor || 'transparent',
                filter: renderStyle?.filter || 'none',
            };
            // 2. The Professional Shadow & Ring Merger
            let finalBoxShadow = (renderStyle?.boxShadow && renderStyle.boxShadow !== 'none') ? renderStyle.boxShadow : undefined;
            
            if (isSelected && !readOnly) {
                // Tailwind's exact ring-2 ring-blue-500 ring-offset-2 ring-offset-black equivalent
                const ringShadow = '0 0 0 2px #000000, 0 0 0 4px #3b82f6';
                // Merge user shadow with selection ring, or just apply ring
                finalBoxShadow = finalBoxShadow ? `${finalBoxShadow}, ${ringShadow}` : ringShadow;
            }
            if (finalBoxShadow) {
                outerStyle.boxShadow = finalBoxShadow;
            }
            // 3. Inner Style (Safely handles clipping)
            const innerStyle: React.CSSProperties = {
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: 'inherit',
                overflow: 'hidden',
            };
            const imgStyle: React.CSSProperties = {
                width: '100%',
                height: '100%',
                objectFit: objectFit,
                objectPosition: objectPosition,
                opacity: renderStyle?.opacity !== undefined ? renderStyle.opacity : 1,
            };
            return (
                <div 
                    key={id}
                    style={outerStyle} 
                    className="group transition-all duration-300"
                    onClick={!readOnly ? (e) => handleClick(e, el) : undefined}
                >
                    <div style={innerStyle}>
                        <img
                            src={fullImageUrl}
                            alt={content.imageAlt || content.altText || content.alt || 'Image'}
                            style={imgStyle}
                            onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400';
                            }}
                        />
                        {overlayOpacity > 0 && (
                            <div
                                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                                style={{
                                    backgroundColor: overlayColor || '#000000',
                                    opacity: overlayOpacity,
                                }}
                            />
                        )}
                    </div>
                </div>
            );

        case 'video':
            // Helper to check if URL is YouTube
            const isYouTubeUrl = (url: string): boolean => {
                return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(url);
            };
            
            // Helper to convert YouTube URL to embed format
            const convertToEmbedUrl = (url: string): string => {
                if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
                    return url;
                }
                const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                if (match && match[1]) {
                    return `https://www.youtube.com/embed/${match[1]}`;
                }
                return url;
            };
            
            // Construct full video URL
            const videoUrl = content.src || '';
            const fullVideoUrl = videoUrl 
                ? (videoUrl.startsWith('http') 
                    ? (isYouTubeUrl(videoUrl) ? convertToEmbedUrl(videoUrl) : videoUrl)
                    : `http://localhost:1111${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`)
                : '';
            
            return (
                <div 
                    key={id} 
                    className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden group ${selectedClass}`} 
                    onClick={!readOnly ? (e) => {
                        // Only handle click if not clicking on the overlay
                        if ((e.target as HTMLElement).closest('.video-edit-overlay')) {
                            return;
                        }
                                                handleClick(e, el);
                    } : undefined} 
                    style={safeStyle}
                >
                    {fullVideoUrl ? (
                        <>
                            {isYouTubeUrl(videoUrl) || fullVideoUrl.includes('youtube.com/embed/') ? (
                                <>
                                    <iframe 
                                        src={fullVideoUrl} 
                                        className={`w-full h-full border-0 ${!readOnly ? 'pointer-events-none' : ''}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    />
                                    {!readOnly && (
                                        <div 
                                            className="video-edit-overlay absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleClick(e, el);
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedElementId !== id) {
                                                    e.currentTarget.style.opacity = '0';
                                                }
                                            }}
                                            style={{ 
                                                opacity: selectedElementId === id ? 1 : 0 
                                            }}
                                        >
                                            <div className="bg-white text-black px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
                                                <i className="fa-solid fa-edit"></i>
                                                Edit Video
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <video 
                                        src={fullVideoUrl} 
                                        className={`w-full h-full object-contain ${!readOnly ? 'pointer-events-none' : ''}`}
                                        controls={readOnly}
                                        onClick={!readOnly ? (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleClick(e, el);
                                        } : undefined}
                                    />
                                    {!readOnly && (
                                        <div 
                                            className="video-edit-overlay absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleClick(e, el);
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedElementId !== id) {
                                                    e.currentTarget.style.opacity = '0';
                                                }
                                            }}
                                            style={{ 
                                                opacity: selectedElementId === id ? 1 : 0 
                                            }}
                                        >
                                            <div className="bg-white text-black px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
                                                <i className="fa-solid fa-edit"></i>
                                                Edit Video
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-white/20 flex-col gap-4">
                            <i className="fa-solid fa-play text-4xl"></i>
                            <span className="text-sm font-bold uppercase tracking-widest">Add Video URL</span>
                        </div>
                    )}
                </div>
            );

        case 'icon':
            // Ensure icon class is properly formatted (handle both 'fa-star' and 'star' formats)
            const iconClass = content.icon 
                ? (content.icon.startsWith('fa-') ? `fa-solid ${content.icon}` : `fa-solid fa-${content.icon}`)
                : 'fa-solid fa-star';
            // Use theme accentColor if element color is not explicitly set
            const iconColor = safeStyle.color || renderStyle?.accentColor || theme?.accentColor || '#F59E0B';
            return (
                <div key={id} className={`inline-block ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={safeStyle}>
                    <i className={iconClass} style={{ fontSize: content.iconSize || safeStyle.fontSize || '2rem', color: iconColor }}></i>
                </div>
            );
            
        case 'icon-box':
            // Ensure icon class is properly formatted
            const iconBoxClass = content.icon 
                ? (content.icon.startsWith('fa-') ? `fa-solid ${content.icon}` : `fa-solid fa-${content.icon}`)
                : 'fa-solid fa-layer-group';
            // Use theme accentColor if element color is not explicitly set
            const iconBoxColor = renderStyle?.accentColor || theme?.accentColor || '#F59E0B';
            return (
                <div key={id} className={`flex gap-4 p-4 rounded-lg bg-white/5 border border-white/5 ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={safeStyle}>
                    <div className="shrink-0">
                         <i className={iconBoxClass} style={{ fontSize: '2rem', color: iconBoxColor }}></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-1" style={{ color: theme?.titleColor || safeStyle.color }} contentEditable={!readOnly} suppressContentEditableWarning={!readOnly} onBlur={!readOnly ? (e) => handleContentUpdate(id, 'text', e.currentTarget.textContent) : undefined}>{content.text || 'Icon Box Title'}</h3>
                        <p className="opacity-70 text-sm" style={{ color: theme?.textColor || safeStyle.color }} contentEditable={!readOnly} suppressContentEditableWarning={!readOnly} onBlur={!readOnly ? (e) => handleContentUpdate(id, 'subText', e.currentTarget.textContent) : undefined}>{content.subText || 'Description for this icon box goes here.'}</p>
                    </div>
                </div>
            );

        case 'image-box':
            // Construct full image URL for image-box
            const imageBoxUrl = content.imageUrl || content.src || '';
            const fullImageBoxUrl = imageBoxUrl 
                ? (imageBoxUrl.startsWith('http') ? imageBoxUrl : `http://localhost:1111${imageBoxUrl.startsWith('/') ? '' : '/'}${imageBoxUrl}`)
                : 'https://via.placeholder.com/400x250';
            
            return (
                <div key={id} className={`flex flex-col gap-4 p-0 rounded-lg overflow-hidden bg-white/5 border border-white/5 ${selectedClass}`} onClick={!readOnly ? (e) => handleClick(e, el) : undefined} style={safeStyle}>
                     <img 
                        src={fullImageBoxUrl} 
                        className="w-full h-48 object-cover" 
                        alt={content.title || content.text || 'Image Box'} 
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250';
                        }}
                     />
                     <div className="p-6 pt-2">
                        <h3 className="font-bold text-xl mb-2" style={{ color: theme?.titleColor || safeStyle.color }} contentEditable={!readOnly} suppressContentEditableWarning={!readOnly} onBlur={!readOnly ? (e) => handleContentUpdate(id, 'text', e.currentTarget.textContent) : undefined}>{content.title || content.text || 'Image Box Title'}</h3>
                        <p className="opacity-70 text-sm" style={{ color: theme?.textColor || safeStyle.color }} contentEditable={!readOnly} suppressContentEditableWarning={!readOnly} onBlur={!readOnly ? (e) => handleContentUpdate(id, 'description', e.currentTarget.textContent) : undefined}>{content.description || content.subText || 'Description text for the image box element.'}</p>
                     </div>
                </div>
            );

        case 'list':
            // Use theme textColor if element color is not explicitly set
            const listStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
            return (
                <ul key={id} className={`list-disc list-inside space-y-2 ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={listStyle}>
                    {(content.items || [{title: 'List Item 1'}, {title: 'List Item 2'}, {title: 'List Item 3'}]).map((item, i) => (
                        <li key={i} className="opacity-90">
                            {item.title}
                        </li>
                    ))}
                </ul>
            );

        case 'star-rating':
            const rating = content.rating !== undefined ? parseFloat(String(content.rating)) : 5;
            const maxRating = content.maxRating !== undefined ? parseInt(String(content.maxRating)) : 5;
            const starColor = safeStyle.color || theme?.accentColor || '#F59E0B';
            const inactiveColor = 'rgba(255, 255, 255, 0.2)'; // Faded background star
            
            return (
                <div key={id} className={`flex gap-1 ${selectedClass}`} onClick={!readOnly ? (e) => handleClick(e, el) : undefined} style={{ ...safeStyle, color: undefined }}>
                    {Array.from({ length: maxRating }, (_, i) => i + 1).map(star => {
                        const isFull = rating >= star;
                        const isHalf = !isFull && rating >= star - 0.5;
                        
                        return (
                            <div key={star} className="relative inline-block leading-none">
                                {/* Always render inactive background star */}
                                <i className="fa-solid fa-star" style={{ color: inactiveColor }}></i>
                                
                                {/* Render colored foreground star (Full or Half) over it */}
                                {(isFull || isHalf) && (
                                    <i 
                                        className={`fa-solid ${isFull ? 'fa-star' : 'fa-star-half-stroke'} absolute top-0 left-0`}
                                        style={{ color: starColor }}
                                    ></i>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
            
        case 'badge':
            // Use theme accentColor if element backgroundColor is not explicitly set
            const badgeBgColor = renderStyle?.backgroundColor || renderStyle?.accentColor || theme?.accentColor || '#3b82f6';
            return (
                <span 
                    key={id} 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedClass}`} 
                    style={{ backgroundColor: badgeBgColor, color: '#fff', ...safeStyle }}
                    onClick={!readOnly ? (e) => handleClick(e, el) : undefined}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning={!readOnly}
                    onBlur={!readOnly ? (e) => handleContentUpdate(id, 'text', e.currentTarget.textContent) : undefined}
                >
                    {content.text || 'Badge'}
                </span>
            );

        case 'highlight-text':
            // Use theme accentColor if element backgroundColor is not explicitly set
            const highlightBgColor = renderStyle?.accentColor || theme?.accentColor || '#facc15';
            const highlightTextStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
            return (
                <p key={id} className={`${selectedClass}`} style={highlightTextStyle} onClick={!readOnly ? (e) => handleClick(e, el) : undefined}>
                    Here is some <span className="px-1 rounded" style={{ backgroundColor: highlightBgColor, color: '#000' }}>{content.text || 'Highlighted'}</span> text example.
                </p>
            );

        case 'blockquote':
            // Use theme accentColor and textColor if element colors are not explicitly set
            const blockquoteBorderColor = renderStyle?.borderColor || renderStyle?.accentColor || theme?.accentColor || '#fff';
            const blockquoteStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB',
                borderColor: blockquoteBorderColor
            };
            return (
                <blockquote key={id} className={`border-l-4 pl-4 py-2 italic opacity-80 ${selectedClass}`} style={blockquoteStyle} onClick={!readOnly ? (e) => handleClick(e, el) : undefined}>
                    <p className="mb-2" contentEditable={!readOnly} suppressContentEditableWarning={!readOnly} onBlur={!readOnly ? (e) => handleContentUpdate(id, 'text', e.currentTarget.textContent) : undefined}>"{content.text || 'This is a quote.'}"</p>
                    <cite className="text-sm font-bold not-italic opacity-70">- {content.author || 'Author Name'}</cite>
                </blockquote>
            );

        case 'accordion':
            const accordionStyle = { ...safeStyle, color: safeStyle.color || theme?.textColor || '#D1D5DB' };
            const items = content.items && content.items.length > 0 ? content.items : [
                { title: 'Sample Question 1', content: 'Sample answer 1.' },
                { title: 'Sample Question 2', content: 'Sample answer 2.' }
            ];
            return (
                <div key={id} className={`space-y-3 w-full ${selectedClass}`} onClick={!readOnly ? (e) => handleClick(e, el) : undefined} style={accordionStyle}>
                    {items.map((item: any, idx: number) => (
                        <details key={idx} className="group bg-white/5 border border-white/10 rounded-xl open:bg-white/10 transition-colors w-full overflow-hidden">
                            <summary className="flex items-center justify-between p-5 cursor-pointer list-none select-none">
                                <span className="font-bold text-lg" style={{ color: theme?.titleColor || '#F8FAFC' }}>{item.title || item.question}</span>
                                <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-open:rotate-180 transition-transform group-open:bg-white/10">
                                    <i className="fa-solid fa-chevron-down text-sm" style={{ color: theme?.accentColor || '#3b82f6' }}></i>
                                </div>
                            </summary>
                            <div className="p-5 pt-0 text-base opacity-80 leading-relaxed border-t border-white/5 mt-2">
                                {item.content || item.answer}
                            </div>
                        </details>
                    ))}
                </div>
            );

        case 'toggle':
            // Use theme textColor if element color is not explicitly set
            const toggleStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
            return (
                <div key={id} className={`bg-white/5 border border-white/10 rounded-lg ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={toggleStyle}>
                     <details className="group">
                        <summary className="flex items-center gap-3 p-4 cursor-pointer font-bold list-none" style={{ color: theme?.titleColor }}>
                             <div className="w-10 h-6 bg-white/10 rounded-full relative group-open:bg-green-500 transition-colors">
                                 <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all group-open:left-5"></div>
                             </div>
                             <span>{content.text || 'Toggle Title'}</span>
                        </summary>
                        <div className="p-4 pt-0 text-sm opacity-80">
                            {content.subText || 'Toggle Content goes here...'}
                        </div>
                     </details>
                </div>
            );

        case 'tabs':
            const currentTab = activeTabs[id] || 0;
            // Use theme accentColor and textColor if element colors are not explicitly set
            const tabsAccentColor = renderStyle?.accentColor || theme?.accentColor || '#3b82f6';
            const tabsStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
            return (
                <div key={id} className={`${selectedClass}`} onClick={(e) => handleClick(e, el)} style={tabsStyle}>
                    <div className="flex border-b border-white/10 mb-4 overflow-x-auto">
                        {content.items?.map((item, idx) => (
                            <button 
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setActiveTabs({...activeTabs, [id]: idx}); }}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${currentTab === idx ? 'border-blue-500 text-white' : 'border-transparent text-white/50 hover:text-white'}`}
                                style={{ borderColor: currentTab === idx ? tabsAccentColor : 'transparent' }}
                            >
                                {item.title}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 min-h-[100px]">
                        {content.items?.[currentTab]?.content}
                    </div>
                </div>
            );

        case 'progress-bar':
            // Use theme accentColor and textColor if element colors are not explicitly set
            const progressBarColor = renderStyle?.accentColor || theme?.accentColor || '#3b82f6';
            const progressBarStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
            return (
                <div key={id} className={`${selectedClass}`} onClick={(e) => handleClick(e, id)} style={progressBarStyle}>
                    <div className="flex justify-between mb-1 text-xs font-bold uppercase tracking-wider">
                        <span>{content.text}</span>
                        <span>{content.percentage}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2.5">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" 
                            style={{ width: `${content.percentage}%`, backgroundColor: progressBarColor }}
                        ></div>
                    </div>
                </div>
            );

        case 'counter':
            // Use theme accentColor and textColor if element colors are not explicitly set
            const counterAccentColor = renderStyle?.accentColor || theme?.accentColor || '#ffffff';
            const counterStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
            return (
                <div key={id} className={`text-center p-6 border border-white/10 bg-white/5 rounded-xl ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={counterStyle}>
                    <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: counterAccentColor }}>
                        {content.prefix}{content.targetNumber}{content.suffix}
                    </div>
                    <div className="text-sm font-bold uppercase tracking-widest opacity-60">
                        {content.text}
                    </div>
                </div>
            );
        
        case 'alert-box':
            const alertColors = {
                success: 'rgba(34, 197, 94, 0.1)',
                warning: 'rgba(234, 179, 8, 0.1)',
                error: 'rgba(239, 68, 68, 0.1)',
                info: 'rgba(59, 130, 246, 0.1)'
            };
            const alertBorder = {
                success: '#22c55e',
                warning: '#eab308',
                error: '#ef4444',
                info: '#3b82f6'
            };
            const alertBoxType = content.alertType || 'info';
            
            return (
                <div key={id} className={`p-4 rounded-lg border-l-4 flex gap-4 ${selectedClass}`} onClick={(e) => handleClick(e, el)} 
                    style={{ 
                        backgroundColor: alertColors[alertBoxType],
                        borderColor: alertBorder[alertBoxType],
                        ...safeStyle
                    }}
                >
                     <div style={{ color: alertBorder[alertBoxType] }}><i className={`fa-solid ${content.icon || 'fa-circle-info'}`}></i></div>
                     <div>
                         <strong className="block font-bold mb-1" contentEditable={!readOnly} suppressContentEditableWarning={!readOnly} onBlur={!readOnly ? (e) => handleContentUpdate(id, 'text', e.currentTarget.textContent) : undefined}>{content.text || 'Alert Title'}</strong>
                         <p className="text-sm opacity-80" contentEditable={!readOnly} suppressContentEditableWarning={!readOnly} onBlur={!readOnly ? (e) => handleContentUpdate(id, 'subText', e.currentTarget.textContent) : undefined}>{content.subText || 'Alert description.'}</p>
                     </div>
                </div>
            );

        case 'testimonial':
            // Use theme textColor if element color is not explicitly set
            const testimonialStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
            return (
                 <div key={id} className={`p-6 rounded-xl bg-white/5 border border-white/10 ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={testimonialStyle}>
                     <div className="flex items-center gap-4 mb-4">
                         <img src={content.items?.[0]?.avatar || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-full object-cover" alt="Avatar" />
                         <div>
                             <div className="font-bold" style={{ color: theme?.titleColor }}>{content.items?.[0]?.author || 'John Doe'}</div>
                             <div className="text-xs opacity-50">{content.items?.[0]?.role || 'Customer'}</div>
                         </div>
                         <div className="ml-auto text-yellow-500 text-sm">
                             <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                         </div>
                     </div>
                     <p className="italic opacity-80">"{content.items?.[0]?.content || 'Great service!'}"</p>
                 </div>
            );

        case 'pricing-table':
            // Use theme accentColor and textColor if element colors are not explicitly set
            const pricingBorderColor = renderStyle?.borderColor || renderStyle?.accentColor || theme?.accentColor || '#3b82f6';
            const pricingStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB',
                borderColor: pricingBorderColor
            };
             return (
                 <div key={id} className={`p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={pricingStyle}>
                     <h3 className="text-xl font-bold mb-2" style={{ color: theme?.titleColor }}>{content.text || 'Plan Name'}</h3>
                     <div className="text-4xl font-bold mb-1" style={{ color: theme?.accentColor }}>{content.price || '$99'}</div>
                     <div className="text-sm opacity-50 mb-6">{content.period || 'per month'}</div>
                     <ul className="space-y-3 mb-8 w-full text-left">
                         {content.items?.map((feature, i) => (
                             <li key={i} className="flex gap-2 text-sm opacity-80">
                                 <i className="fa-solid fa-check text-green-500 mt-1"></i> {feature.title}
                             </li>
                         ))}
                     </ul>
                     <button className={`${buttonClass} w-full`}>{content.link || 'Choose Plan'}</button>
                 </div>
             );

        case 'flip-box':
            const directionClass = {
                left: 'group-hover:rotate-y-180',
                right: 'group-hover:-rotate-y-180',
                top: 'group-hover:rotate-x-180',
                bottom: 'group-hover:-rotate-x-180'
            };
            const dir = content.flipDirection || 'left';
            const rotateClass = directionClass[dir] || directionClass.left;
            
            const backRotate = (dir === 'top' || dir === 'bottom') ? 'rotate-x-180' : 'rotate-y-180';
            
            // Use theme accentColor if element color is not explicitly set
            const flipBoxAccentColor = renderStyle?.accentColor || theme?.accentColor || '#3b82f6';
            const flipBoxStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };

            return (
                 <div key={id} className={`group h-64 perspective-1000 ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={flipBoxStyle}>
                     <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${rotateClass}`}>
                         <div className="absolute inset-0 backface-hidden bg-white/10 border border-white/10 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                              <i className={`fa-solid ${content.icon || 'fa-star'} text-4xl mb-4`} style={{color: flipBoxAccentColor}}></i>
                              <h3 className="font-bold text-xl" style={{ color: theme?.titleColor }}>{content.frontTitle || 'Front Title'}</h3>
                              <p className="text-sm opacity-70 mt-2">{content.frontDesc || 'Hover to flip'}</p>
                         </div>
                         <div className={`absolute inset-0 backface-hidden ${backRotate} bg-blue-600 rounded-xl flex flex-col items-center justify-center p-6 text-center`} style={{ backgroundColor: flipBoxAccentColor }}>
                              <h3 className="font-bold text-xl">{content.backTitle || 'Back Title'}</h3>
                              <p className="text-sm opacity-90 mt-2 mb-4">{content.backDesc || 'Hidden details revealed.'}</p>
                              <button className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full">Action</button>
                         </div>
                     </div>
                 </div>
            );

        case 'countdown-timer':
            // Use theme accentColor and textColor if element colors are not explicitly set
            const countdownAccentColor = renderStyle?.accentColor || theme?.accentColor || '#F59E0B';
            const countdownStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
             return (
                 <div key={id} className={`${selectedClass}`} onClick={(e) => handleClick(e, el)} style={countdownStyle}>
                     <h4 className="font-bold mb-4 uppercase tracking-widest text-xs opacity-50" style={{textAlign: safeStyle.textAlign}}>{content.text || 'Offer Ends In'}</h4>
                     <CountdownTimer targetDate={content.targetDate || new Date(Date.now() + 86400000).toISOString()} style={{ ...style, accentColor: countdownAccentColor }} />
                 </div>
             );

        case 'review-carousel':
            // Use theme textColor if element color is not explicitly set
            const reviewCarouselStyle = {
                ...safeStyle,
                color: safeStyle.color || theme?.textColor || '#D1D5DB'
            };
            return (
                 <div key={id} className={`p-6 bg-white/5 border border-white/10 rounded-xl ${selectedClass}`} onClick={(e) => handleClick(e, el)} style={reviewCarouselStyle}>
                     <div className="flex gap-4 overflow-hidden mask-linear-gradient">
                         {(content.items || [{title: 'Review 1'}, {title: 'Review 2'}]).map((item, i) => (
                             <div key={i} className="min-w-[250px] p-4 bg-black/20 rounded border border-white/5">
                                 <div className="text-yellow-500 text-xs mb-2"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
                                 <p className="text-sm italic opacity-80 mb-2">"{item.content || 'Excellent product.'}"</p>
                                 <div className="font-bold text-xs" style={{ color: theme?.titleColor }}>{item.author || 'User'}</div>
                             </div>
                         ))}
                     </div>
                 </div>
            );

        default:
             return (
                 <div key={id} className={`${selectedClass} opacity-50`} onClick={(e) => handleClick(e, el)}>
                     Element {type} not fully implemented in preview.
                 </div>
             );
    }
  };

  // Render elements
  // When isWrapped is false, render elements directly without grid wrapper (for custom layouts)
  // When isWrapped is true, wrap in grid for standard sections
  const elementsContent = isWrapped ? (
    <div className="grid gap-8">
      {elements.map(renderElement)}
    </div>
  ) : (
    <>
      {elements.map(renderElement)}
    </>
  );

  // If isWrapped is false, render elements directly without wrapper (for use in custom layouts)
  if (!isWrapped) {
    return elementsContent;
  }

  // Default: render with wrapper div for standard sections
  return (
    <div className="max-w-6xl mx-auto px-6 py-4 relative z-10 text-left">
      {elementsContent}
    </div>
  );
};
