import React, { useState, useMemo, useEffect, useRef } from 'react';
import { WebsiteData, Section, SectionType, WebsiteElement, ElementType } from './types';
import { INITIAL_TEMPLATE, SECTION_TEMPLATES, PRESET_THEMES, PRESET_FONTS, ELEMENT_DEFAULTS } from './constants';
import { geminiService } from './services/geminiService';
import SectionRenderer from './components/SectionRenderer';
import { PreviewFrame } from './components/PreviewFrame';
import toast, { Toaster } from 'react-hot-toast';
import { getDefaultVariant, getVariantsForSection } from './components/SectionsAndVariantRegistry';
import { ThemeProvider, useTheme } from '@ui/blocks';

// Get URL parameters
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  // If token is in URL, save it to localStorage for future use
  if (token) {
    localStorage.setItem('token', token);
    // Remove token from URL for security (clean URL)
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('token');
    window.history.replaceState({}, '', newUrl.toString());
  }
  
  return {
    projectId: params.get('projectId'),
    pageId: params.get('pageId'),
    token: token || localStorage.getItem('token'),
  };
};

// Helper lists for sidebar categorization
const BASIC_ELEMENTS: ElementType[] = ['heading', 'text', 'button', 'image', 'video', 'icon', 'icon-box', 'image-box', 'list', 'star-rating', 'badge', 'highlight-text', 'blockquote'];
const ADVANCED_ELEMENTS: ElementType[] = ['accordion', 'toggle', 'tabs', 'progress-bar', 'counter', 'testimonial', 'review-carousel', 'alert-box', 'pricing-table', 'flip-box', 'call-to-action', 'countdown-timer'];

// Helper function to format variant name for display
const formatVariantName = (variant: string | undefined, sectionType: string | undefined): string | null => {
  if (!variant) return null;
  
  // Remove the section type prefix (e.g., "Hero" from "HeroCenter")
  const sectionTypeCapitalized = sectionType ? sectionType.charAt(0).toUpperCase() + sectionType.slice(1) : '';
  let formatted = variant;
  
  // Remove common prefixes
  if (variant.startsWith(sectionTypeCapitalized)) {
    formatted = variant.slice(sectionTypeCapitalized.length);
  }
  
  // Handle camelCase: insert spaces before capital letters
  formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Capitalize first letter
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  
  return formatted;
};

// --- UI Components for Sidebar ---

const AccordionGroup = ({ title, children, defaultOpen = false }: { title: string, children?: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-white/5 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center justify-between w-full py-3 px-1 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
                <span>{title}</span>
                <i className={`fa-solid fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && <div className="pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">{children}</div>}
        </div>
    );
};

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
  const pickerValue = value && value.startsWith('#') && (value.length === 4 || value.length === 7) ? value : '#000000';
  return (
    <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>
        <div className="flex gap-2 items-center bg-[#151515] p-1 rounded border border-[#333] hover:border-[#444] transition-colors">
            <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0 shadow-sm">
              <input 
                  type="color" 
                  className="absolute inset-[-4px] w-[150%] h-[150%] p-0 border-none cursor-pointer"
                  value={pickerValue}
                  onChange={(e) => onChange(e.target.value)}
              />
            </div>
            <input 
                type="text" 
                className="bg-transparent border-none text-white text-[10px] focus:outline-none flex-1 uppercase w-full font-mono"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="NONE"
            />
        </div>
    </div>
  );
};

const TextInput = ({ label, value, onChange, placeholder, isNumeric = false }: { label: string, value: string | undefined, onChange: (val: string) => void, placeholder?: string, isNumeric?: boolean }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isNumeric) return;
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentVal = value || '0px';
      const num = parseInt(currentVal) || 0;
      const step = e.shiftKey ? 10 : 1;
      const nextNum = e.key === 'ArrowUp' ? num + step : num - step;
      onChange(`${nextNum}px`);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isNumeric && e.target.value && !isNaN(Number(e.target.value))) {
        onChange(`${e.target.value}px`);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>
        <input 
            type="text"
            className="w-full bg-[#151515] border border-[#333] rounded p-2 text-white text-xs focus:border-blue-500 focus:outline-none transition-colors"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
        />
    </div>
  );
};

const SpacingInputGroup = ({ label, values, onChange }: { 
    label: string, 
    values: { top?: string, right?: string, bottom?: string, left?: string }, 
    onChange: (newValues: { top?: string, right?: string, bottom?: string, left?: string }) => void 
}) => {
    
    const updateAll = (val: string) => {
        // Automatically enforce px for numeric-only inputs
        const finalVal = (val !== '' && !isNaN(Number(val))) ? `${val}px` : val;
        onChange({ top: finalVal, right: finalVal, bottom: finalVal, left: finalVal });
    };

    const updateSide = (side: keyof typeof values, val: string) => {
        // Instantly append px if it's a number to ensure CSS validity while typing
        const finalVal = (val !== '' && !isNaN(Number(val))) ? `${val}px` : val;
        onChange({ ...values, [side]: finalVal });
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</label>
                 <div className="flex items-center gap-1">
                     <span className="text-[8px] text-white/30 uppercase">All</span>
                     <input 
                        className="w-16 bg-[#151515] border border-[#333] rounded p-1 text-white text-xs focus:border-blue-500 focus:outline-none text-center"
                        placeholder="px"
                        onBlur={(e) => updateAll(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') updateAll(e.currentTarget.value);
                        }}
                     />
                 </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <TextInput label="Top" value={values.top} onChange={(v) => updateSide('top', v)} placeholder="0px" isNumeric />
                <TextInput label="Right" value={values.right} onChange={(v) => updateSide('right', v)} placeholder="0px" isNumeric />
                <TextInput label="Bottom" value={values.bottom} onChange={(v) => updateSide('bottom', v)} placeholder="0px" isNumeric />
                <TextInput label="Left" value={values.left} onChange={(v) => updateSide('left', v)} placeholder="0px" isNumeric />
            </div>
        </div>
    );
};

const TextAreaInput = ({ label, value, onChange, rows = 3 }: { label: string, value: string | undefined, onChange: (val: string) => void, rows?: number }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>
        <textarea 
            className="bg-[#151515] border border-[#333] rounded p-2 text-white text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
            rows={rows}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const ImageControl = ({ label, value, onChange, onUpload, uploading = false, uploadProgress = 0 }: { label: string, value: string | undefined, onChange: (val: string) => void, onUpload: () => void, uploading?: boolean, uploadProgress?: number }) => {
    // Construct full image URL for preview
    const getImageUrl = (url: string | undefined): string => {
        if (!url || url.trim().length < 5) return '';
        // If it's already a full URL, use it; otherwise prepend localhost:1111
        if (url.startsWith('http')) return url;
        return `http://localhost:1111${url.startsWith('/') ? '' : '/'}${url}`;
    };
    
    const previewUrl = getImageUrl(value);
    
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>
            
            {/* Image Preview */}
            {previewUrl ? (
                <div className="relative w-full aspect-video bg-[#151515] rounded border border-[#333] overflow-hidden group">
                    {uploading && (
                        <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                            <span className="text-white text-xs font-medium">Uploading...</span>
                            {uploadProgress > 0 && (
                                <div className="w-32 h-1 bg-[#333] rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    )}
                    <img 
                        src={previewUrl} 
                        className="w-full h-full object-cover" 
                        alt="Preview"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400';
                        }}
                    />
                    {!uploading && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button 
                             onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 onUpload();
                             }} 
                             className="px-3 py-1 bg-white text-black text-xs font-bold rounded hover:scale-105 transition-transform shadow-lg"
                         >
                             Change Image
                         </button>
                    </div>
                    )}
                </div>
            ) : (
                <div className="relative w-full aspect-video bg-[#151515] rounded border border-[#333] flex items-center justify-center">
                    {uploading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                            <span className="text-white text-xs font-medium">Uploading...</span>
                            {uploadProgress > 0 && (
                                <div className="w-32 h-1 bg-[#333] rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    ) : (
                    <div className="text-center text-white/40 text-xs">
                        <i className="fa-solid fa-image text-2xl mb-2 block"></i>
                        <span>No image preview</span>
                    </div>
                    )}
                </div>
            )}

            <div className="flex gap-2">
                <input 
                    type="text" 
                    className="w-full bg-[#151515] border border-[#333] rounded p-2 text-white text-xs focus:border-blue-500 focus:outline-none transition-colors"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Paste image URL or click upload"
                />
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!uploading) onUpload();
                    }}
                    disabled={uploading}
                    className={`px-3 bg-[#222] border border-[#333] rounded hover:bg-[#333] text-white shrink-0 transition-colors flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Upload Image"
                >
                    {uploading ? (
                        <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            <span className="text-[10px]">Uploading...</span>
                        </>
                    ) : (
                    <i className="fa-solid fa-upload text-xs"></i>
                    )}
                </button>
            </div>
        </div>
    );
};

const VideoControl = ({ label, value, onChange, onUpload }: { label: string, value: string | undefined, onChange: (val: string) => void, onUpload: () => void }) => {
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
    
    // Construct full video URL for preview
    const getVideoUrl = (url: string | undefined): string => {
        if (!url || url.trim().length < 5) return '';
        // If it's already a full URL, use it; otherwise prepend localhost:1111
        if (url.startsWith('http')) {
            // If it's YouTube, convert to embed format
            if (isYouTubeUrl(url)) {
                return convertToEmbedUrl(url);
            }
            return url;
        }
        return `http://localhost:1111${url.startsWith('/') ? '' : '/'}${url}`;
    };
    
    const previewUrl = getVideoUrl(value);
    const isYouTube = value ? isYouTubeUrl(value) : false;
    
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>
            
            {/* Video Preview */}
            {previewUrl ? (
                <div className="relative w-full aspect-video bg-[#151515] rounded border border-[#333] overflow-hidden group">
                    {isYouTube || previewUrl.includes('youtube.com/embed/') ? (
                        <iframe 
                            src={previewUrl} 
                            className="w-full h-full border-0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        />
                    ) : (
                        <video 
                            src={previewUrl} 
                            className="w-full h-full object-contain"
                            controls
                        />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button 
                             onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 onUpload();
                             }} 
                             className="px-3 py-1 bg-white text-black text-xs font-bold rounded hover:scale-105 transition-transform shadow-lg"
                         >
                             Change Video
                         </button>
                    </div>
                </div>
            ) : (
                <div className="w-full aspect-video bg-[#151515] rounded border border-[#333] flex items-center justify-center">
                    <span className="text-white/30 text-xs">No Video Selected</span>
                </div>
            )}

            <div className="flex gap-2">
                <input 
                    type="text" 
                    className="w-full bg-[#151515] border border-[#333] rounded p-2 text-white text-xs focus:border-blue-500 focus:outline-none transition-colors"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Paste YouTube URL, video URL, or click upload"
                />
                <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpload(); }}
                    className="px-3 bg-[#222] border border-[#333] rounded hover:bg-[#333] text-white shrink-0"
                    title="Upload Video"
                >
                    <i className="fa-solid fa-upload text-xs"></i>
                </button>
            </div>
        </div>
    );
};

// Popular FontAwesome icons list
const POPULAR_ICONS = [
    // Common
    'fa-star', 'fa-heart', 'fa-thumbs-up', 'fa-check', 'fa-times', 'fa-plus', 'fa-minus', 'fa-edit', 'fa-trash', 'fa-save',
    // Arrows & Navigation
    'fa-arrow-right', 'fa-arrow-left', 'fa-arrow-up', 'fa-arrow-down', 'fa-chevron-right', 'fa-chevron-left', 'fa-chevron-up', 'fa-chevron-down',
    // Social & Communication
    'fa-envelope', 'fa-phone', 'fa-comment', 'fa-share', 'fa-link', 'fa-user', 'fa-users', 'fa-bell', 'fa-message',
    // Business & Finance
    'fa-dollar-sign', 'fa-credit-card', 'fa-shopping-cart', 'fa-bag-shopping', 'fa-chart-line', 'fa-briefcase', 'fa-building',
    // Technology
    'fa-laptop', 'fa-mobile-screen', 'fa-tablet', 'fa-wifi', 'fa-cloud', 'fa-database', 'fa-code', 'fa-server',
    // Media & Entertainment
    'fa-play', 'fa-pause', 'fa-stop', 'fa-music', 'fa-video', 'fa-image', 'fa-camera', 'fa-microphone',
    // Location & Travel
    'fa-map-marker-alt', 'fa-globe', 'fa-plane', 'fa-car', 'fa-home', 'fa-building',
    // Food & Drink
    'fa-utensils', 'fa-coffee', 'fa-pizza-slice', 'fa-burger', 'fa-wine-glass',
    // Health & Fitness
    'fa-heartbeat', 'fa-dumbbell', 'fa-running', 'fa-bicycle', 'fa-swimming-pool',
    // Education & Learning
    'fa-graduation-cap', 'fa-book', 'fa-pencil', 'fa-chalkboard', 'fa-lightbulb',
    // Tools & Settings
    'fa-wrench', 'fa-cog', 'fa-tools', 'fa-screwdriver', 'fa-hammer', 'fa-key', 'fa-lock', 'fa-unlock',
    // Weather & Nature
    'fa-sun', 'fa-moon', 'fa-cloud-sun', 'fa-cloud-rain', 'fa-snowflake', 'fa-leaf', 'fa-tree', 'fa-mountain',
    // Shapes & Symbols
    'fa-circle', 'fa-square', 'fa-triangle', 'fa-diamond', 'fa-hexagon', 'fa-pentagon',
    // Time & Calendar
    'fa-clock', 'fa-calendar', 'fa-calendar-alt', 'fa-hourglass', 'fa-stopwatch',
    // Security & Safety
    'fa-shield', 'fa-shield-alt', 'fa-fire', 'fa-exclamation-triangle', 'fa-info-circle', 'fa-question-circle',
    // Transport
    'fa-truck', 'fa-ship', 'fa-train', 'fa-bus', 'fa-motorcycle',
    // Sports & Games
    'fa-football', 'fa-basketball', 'fa-baseball', 'fa-volleyball', 'fa-chess', 'fa-dice',
    // Miscellaneous
    'fa-gift', 'fa-trophy', 'fa-medal', 'fa-flag', 'fa-palette', 'fa-paint-brush', 'fa-magic', 'fa-rocket', 'fa-gem'
];

const IconPicker = ({ label, value, onChange }: { label: string, value: string | undefined, onChange: (val: string) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    
    // Normalize icon value to 'fa-icon-name' format
    const normalizeIcon = (iconValue: string | undefined): string => {
        if (!iconValue) return 'fa-star';
        // Remove 'fa-solid fa-' or 'fa-solid ' prefix if present
        if (iconValue.startsWith('fa-solid fa-')) {
            return iconValue.replace('fa-solid fa-', 'fa-');
        }
        if (iconValue.startsWith('fa-solid ')) {
            return iconValue.replace('fa-solid ', 'fa-');
        }
        // If it already starts with 'fa-', return as is
        if (iconValue.startsWith('fa-')) {
            return iconValue;
        }
        // Otherwise, add 'fa-' prefix
        return `fa-${iconValue}`;
    };
    
    const normalizedValue = normalizeIcon(value);
    
    // Get current icon name for display (remove 'fa-' prefix)
    const currentIcon = normalizedValue.replace('fa-', '');
    
    // Filter icons based on search
    const filteredIcons = POPULAR_ICONS.filter(icon => 
        icon.replace('fa-', '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Get icon class for display
    const getIconClass = (iconName: string) => {
        const normalized = normalizeIcon(iconName);
        return `fa-solid ${normalized}`;
    };
    
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>
            
            {/* Current Icon Display */}
            <div 
                className="w-full bg-[#151515] border border-[#333] rounded p-3 flex items-center justify-between cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => setShowPicker(!showPicker)}
            >
                <div className="flex items-center gap-3">
                    <i className={`${getIconClass(normalizedValue)} text-xl`} style={{ color: '#F59E0B' }}></i>
                    <span className="text-white text-xs font-medium">
                        {currentIcon.charAt(0).toUpperCase() + currentIcon.slice(1).replace(/-/g, ' ')}
                    </span>
                </div>
                <i className={`fa-solid fa-chevron-${showPicker ? 'up' : 'down'} text-xs text-white/40`}></i>
            </div>
            
            {/* Icon Picker Dropdown */}
            {showPicker && (
                <div className="bg-[#151515] border border-[#333] rounded p-3 max-h-64 overflow-y-auto custom-scrollbar">
                    {/* Search Input */}
                    <div className="mb-3">
                        <input
                            type="text"
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2 text-white text-xs focus:border-blue-500 focus:outline-none"
                            placeholder="Search icons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    
                    {/* Icons Grid */}
                    <div className="grid grid-cols-6 gap-2">
                        {filteredIcons.map((icon) => {
                            const iconName = icon.replace('fa-', '');
                            const isSelected = normalizedValue === icon;
                            return (
                                <button
                                    key={icon}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(icon);
                                        setShowPicker(false);
                                        setSearchTerm('');
                                    }}
                                    className={`p-2 rounded border transition-all hover:border-blue-500 hover:bg-[#1a1a1a] ${
                                        isSelected 
                                            ? 'border-blue-500 bg-blue-500/10' 
                                            : 'border-[#333] bg-[#0a0a0a]'
                                    }`}
                                    title={iconName.replace(/-/g, ' ')}
                                >
                                    <i className={`fa-solid ${icon} text-lg`} style={{ color: isSelected ? '#60A5FA' : '#D1D5DB' }}></i>
                                </button>
                            );
                        })}
                    </div>
                    
                    {filteredIcons.length === 0 && (
                        <div className="text-center text-white/40 text-xs py-4">
                            No icons found matching "{searchTerm}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const RangeInput = ({ label, value, min = 0, max = 100, step = 1, onChange, unit = '' }: { label: string, value: number, min?: number, max?: number, step?: number, onChange: (val: number) => void, unit?: string }) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center ml-1">
             <label className="text-[10px] font-bold text-white/40 capitalize">{label}</label>
             <span className="text-[10px] text-white/60 font-mono">{value}{unit}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
    </div>
);

const FontSizeInput = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (val: string) => void, placeholder?: string }) => {
  // Parse value to extract number and unit
  const parseValue = (val: string) => {
    const match = val.match(/^([\d.]+)(px|rem|em)$/);
    if (match) {
      return { num: parseFloat(match[1]), unit: match[2] };
    }
    return { num: 0, unit: 'rem' };
  };

  const currentValue = value || placeholder || '1rem';
  const parsed = parseValue(currentValue);
  const [selectedUnit, setSelectedUnit] = useState<'px' | 'rem' | 'em'>(parsed.unit as 'px' | 'rem' | 'em' || 'rem');
  const [displayNum, setDisplayNum] = useState<string>(parsed.num.toString());
  
  // Update display when value prop changes
  React.useEffect(() => {
    const parsed = parseValue(value || placeholder || '1rem');
    setDisplayNum(parsed.num.toString());
    setSelectedUnit(parsed.unit as 'px' | 'rem' | 'em' || 'rem');
  }, [value, placeholder]);

  const handleIncrement = () => {
    const step = selectedUnit === 'px' ? 1 : 0.125;
    const currentNum = parseFloat(displayNum) || 0;
    const newNum = currentNum + step;
    const newValue = `${newNum}${selectedUnit}`;
    setDisplayNum(newNum.toString());
    onChange(newValue);
  };

  const handleDecrement = () => {
    const step = selectedUnit === 'px' ? 1 : 0.125;
    const currentNum = parseFloat(displayNum) || 0;
    const newNum = Math.max(0.125, currentNum - step);
    const newValue = `${newNum}${selectedUnit}`;
    setDisplayNum(newNum.toString());
    onChange(newValue);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setDisplayNum(inputVal);
    
    // If it's just a number, add the unit
    if (/^\d+\.?\d*$/.test(inputVal)) {
      onChange(`${inputVal}${selectedUnit}`);
    } else if (/^\d+\.?\d*(px|rem|em)$/.test(inputVal)) {
      onChange(inputVal);
      // Update unit if changed
      const match = inputVal.match(/(px|rem|em)$/);
      if (match) setSelectedUnit(match[1] as 'px' | 'rem' | 'em');
    } else {
      onChange(inputVal);
    }
  };
  
  const handleUnitChange = (newUnit: 'px' | 'rem' | 'em') => {
    setSelectedUnit(newUnit);
    const currentNum = parseFloat(displayNum) || 0;
    onChange(`${currentNum}${newUnit}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>
      <div className="flex gap-2 items-center">
        <button
          onClick={handleDecrement}
          className="w-8 h-8 flex items-center justify-center bg-[#222] border border-[#333] rounded hover:bg-[#333] transition-colors text-white text-xs font-bold"
        >
          −
        </button>
        <div className="flex-1 flex gap-1 items-center bg-[#151515] border border-[#333] rounded p-1">
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none text-center font-mono"
            value={displayNum}
            onChange={handleValueChange}
            placeholder={parsed.num.toString()}
          />
          <select
            value={selectedUnit}
            onChange={(e) => handleUnitChange(e.target.value as 'px' | 'rem' | 'em')}
            className="bg-[#222] border border-[#333] rounded px-2 py-1 text-white text-[10px] focus:outline-none cursor-pointer"
          >
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="em">em</option>
          </select>
        </div>
        <button
          onClick={handleIncrement}
          className="w-8 h-8 flex items-center justify-center bg-[#222] border border-[#333] rounded hover:bg-[#333] transition-colors text-white text-xs font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
};

const SelectInput = ({ label, value, options, onChange, className = '' }: any) => {
  // Helper to check if this is likely a font dropdown
  const isFontSelect = label?.toLowerCase().includes('font');
  
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
        style={isFontSelect && value ? { fontFamily: value } : {}}
      >
        {options.map((opt: any, i: number) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const optValue = isObj ? opt.value : opt;
          const optLabel = isObj ? opt.label : opt;

          return (
            <option 
              key={isObj ? `${optValue}-${i}` : opt} 
              value={optValue} 
              className="bg-[#151515] text-white"
              style={isFontSelect && optValue ? { fontFamily: optValue } : {}}
            >
              {optLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};

// Comprehensive Background Control Component
const BackgroundControl = ({ 
  value, 
  onChange, 
  onUpload,
  uploading = false,
  uploadProgress = 0
}: { 
  value: any, 
  onChange: (val: any) => void,
  onUpload?: () => void,
  uploading?: boolean,
  uploadProgress?: number
}) => {
  const { themeData } = useTheme();
  
  // Get theme overlay defaults
  const getThemeOverlayDefaults = () => {
    if (themeData?.overlay) {
      const themeOverlay = themeData.overlay;
      // Extract opacity from rgba if present
      let overlayOpacity = 0.5;
      if (themeOverlay.color) {
        const rgbaMatch = themeOverlay.color.match(/rgba?\([^)]+\)/);
        if (rgbaMatch) {
          const rgbaValues = rgbaMatch[0].match(/[\d.]+/g);
          if (rgbaValues && rgbaValues.length >= 4) {
            overlayOpacity = parseFloat(rgbaValues[3]);
          }
        }
      }
      return {
        enabled: true,
        color: themeOverlay.color || '#000000',
        opacity: overlayOpacity,
        blendMode: (themeOverlay.blend as any) || 'multiply'
      };
    }
    // Default overlay settings (enabled by default)
    return {
      enabled: true,
      color: '#000000',
      opacity: 0.5,
      blendMode: 'normal' as const
    };
  };
  
  const themeOverlayDefaults = getThemeOverlayDefaults();
  const background = value || { type: 'color', color: '#000000', overlay: themeOverlayDefaults };
  const [localBackground, setLocalBackground] = useState(background);

  // Update local state when prop changes
  React.useEffect(() => {
    const defaultBg = value || { 
      type: 'color', 
      color: '#000000', 
      overlay: themeOverlayDefaults 
    };
    // If overlay is not set, initialize with theme defaults
    if (defaultBg && !defaultBg.overlay) {
      defaultBg.overlay = themeOverlayDefaults;
    }
    // If overlay exists but enabled is undefined/null, enable it
    if (defaultBg?.overlay && defaultBg.overlay.enabled === undefined) {
      defaultBg.overlay.enabled = true;
    }
    setLocalBackground(defaultBg);
  }, [value, themeOverlayDefaults]);

  const updateBackground = (updates: any) => {
    const newBg = { ...localBackground, ...updates };
    setLocalBackground(newBg);
    onChange(newBg);
  };

  const addGradientStop = () => {
    const stops = localBackground.gradient?.stops || [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 100 }];
    const newStop = { color: '#888888', position: 50 };
    updateBackground({
      gradient: {
        ...localBackground.gradient,
        stops: [...stops, newStop].sort((a, b) => a.position - b.position)
      }
    });
  };

  const removeGradientStop = (index: number) => {
    const stops = localBackground.gradient?.stops || [];
    if (stops.length <= 2) return; // Keep at least 2 stops
    updateBackground({
      gradient: {
        ...localBackground.gradient,
        stops: stops.filter((_, i) => i !== index)
      }
    });
  };

  const updateGradientStop = (index: number, field: 'color' | 'position', val: string | number) => {
    const stops = [...(localBackground.gradient?.stops || [])];
    stops[index] = { ...stops[index], [field]: val };
    updateBackground({
      gradient: {
        ...localBackground.gradient,
        stops: stops.sort((a, b) => a.position - b.position)
      }
    });
  };

  // Extract enableGeometry from value (it's passed separately in the merged value)
  const enableGeometry = (value as any)?.enableGeometry !== undefined ? (value as any).enableGeometry : true;
  
  return (
    <div className="space-y-4">
      {/* Enable Geometry Toggle */}
      <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#333]">
        <label className="text-xs font-medium text-white/80">Enable Geometry</label>
        <button
          type="button"
          onClick={() => {
            const newValue = !enableGeometry;
            // onChange will be called with the merged value, and the parent will extract enableGeometry
            onChange({ ...localBackground, enableGeometry: newValue } as any);
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enableGeometry ? 'bg-blue-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enableGeometry ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {/* Background Type Selector */}
      <SelectInput
        label="Background Type"
        value={localBackground.type || 'color'}
        options={[
          { label: 'Color', value: 'color' },
          { label: 'Gradient', value: 'gradient' },
          { label: 'Image', value: 'image' }
        ]}
        onChange={(v) => {
          if (v === 'color') {
            updateBackground({ 
              type: 'color', 
              color: localBackground.color || '#000000',
              overlay: localBackground.overlay || themeOverlayDefaults
            });
          } else if (v === 'gradient') {
            updateBackground({
              type: 'gradient',
              gradient: localBackground.gradient || {
                type: 'linear',
                direction: 90,
                stops: [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 100 }]
              },
              overlay: localBackground.overlay || themeOverlayDefaults
            });
          } else if (v === 'image') {
            updateBackground({
              type: 'image',
              image: localBackground.image || {
                url: '',
                position: 'center',
                size: 'cover',
                repeat: 'no-repeat',
                attachment: 'scroll',
                overlay: themeOverlayDefaults
              }
            });
          }
        }}
      />

      {/* Color Background */}
      {localBackground.type === 'color' && (
        <div className="space-y-3">
          <ColorInput
            label="Background Color"
            value={localBackground.color || '#000000'}
            onChange={(v) => updateBackground({ color: v })}
          />
        </div>
      )}

      {/* Gradient Background */}
      {localBackground.type === 'gradient' && (
        <div className="space-y-3">
          <SelectInput
            label="Gradient Type"
            value={localBackground.gradient?.type || 'linear'}
            options={[
              { label: 'Linear', value: 'linear' },
              { label: 'Radial', value: 'radial' }
            ]}
            onChange={(v) => updateBackground({
              gradient: { ...localBackground.gradient, type: v as 'linear' | 'radial' }
            })}
          />
          
          {localBackground.gradient?.type === 'linear' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Direction</label>
              <RangeInput
                label="Angle"
                value={localBackground.gradient?.direction || 90}
                min={0}
                max={360}
                step={1}
                unit="°"
                onChange={(v) => updateBackground({
                  gradient: { ...localBackground.gradient, direction: v }
                })}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Gradient Stops</label>
              <button
                onClick={addGradientStop}
                className="px-2 py-1 text-[9px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30"
              >
                <i className="fa-solid fa-plus mr-1"></i>Add Stop
              </button>
            </div>
            {(localBackground.gradient?.stops || []).map((stop: any, index: number) => (
              <div key={index} className="flex gap-2 items-center bg-[#151515] p-2 rounded border border-[#333]">
                <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                  <input
                    type="color"
                    className="absolute inset-[-4px] w-[150%] h-[150%] p-0 border-none cursor-pointer"
                    value={stop.color || '#000000'}
                    onChange={(e) => updateGradientStop(index, 'color', e.target.value)}
                  />
                </div>
                <RangeInput
                  label=""
                  value={stop.position || 0}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(v) => updateGradientStop(index, 'position', v)}
                />
                {(localBackground.gradient?.stops || []).length > 2 && (
                  <button
                    onClick={() => removeGradientStop(index)}
                    className="px-2 py-1 text-[9px] bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded border border-red-600/30"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Background */}
      {localBackground.type === 'image' && (
        <div className="space-y-3">
          <ImageControl
            label="Background Image"
            value={localBackground.image?.url || ''}
            onChange={(v) => {
              // Ensure background type is 'image' when URL is pasted
              const currentImage = localBackground.image || {
                url: '',
                position: 'center',
                size: 'cover',
                repeat: 'no-repeat',
                attachment: 'scroll',
                overlay: themeOverlayDefaults
              };
              // Update background with image URL and ensure type is 'image'
              updateBackground({
                type: 'image',
                image: { ...currentImage, url: v }
              });
            }}
            onUpload={onUpload || (() => {})}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        </div>
      )}
    </div>
  );
};


const ButtonGroup = ({ options, value, onChange }: { options: {icon: string, value: string, label: string}[], value: string | undefined, onChange: (val: string) => void }) => {
    const currentValue = value || 'left'; // Default to 'left' if undefined
    return (
        <div className="flex bg-[#151515] p-1 rounded border border-[#333]">
            {options.map(opt => (
                <button 
                    key={opt.value}
                    className={`flex-1 py-1.5 rounded text-xs transition-all ${currentValue === opt.value ? 'bg-[#333] text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                    onClick={() => onChange(opt.value)}
                    title={opt.label}
                >
                    <i className={`fa-solid ${opt.icon}`}></i>
                </button>
            ))}
        </div>
    );
};

// --- Main App Component ---

const AppContent: React.FC = () => {
  const { themeData } = useTheme();
  
  // Helper to get theme overlay defaults (accessible throughout AppContent)
  const getThemeOverlayDefaults = () => {
    if (themeData?.overlay) {
      const themeOverlay = themeData.overlay;
      let overlayOpacity = 0.5;
      if (themeOverlay.color) {
        const rgbaMatch = themeOverlay.color.match(/rgba?\([^)]+\)/);
        if (rgbaMatch) {
          const rgbaValues = rgbaMatch[0].match(/[\d.]+/g);
          if (rgbaValues && rgbaValues.length >= 4) {
            overlayOpacity = parseFloat(rgbaValues[3]);
          }
        }
      }
      return {
        enabled: true,
        color: themeOverlay.color || '#000000',
        opacity: overlayOpacity,
        blendMode: (themeOverlay.blend as any) || 'multiply'
      };
    }
    return {
      enabled: true,
      color: '#000000',
      opacity: 0.5,
      blendMode: 'normal' as const
    };
  };
  const [siteData, setSiteData] = useState<WebsiteData>(INITIAL_TEMPLATE);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null); 
  const [selectedVirtualElement, setSelectedVirtualElement] = useState<WebsiteElement | null>(null); 
  
  const [editTab, setEditTab] = useState<'content' | 'design' | 'advanced'>('content'); 
  const [globalTab, setGlobalTab] = useState<'themes' | 'colors' | 'typography'>('themes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // Zoom level in percentage (25-200%)
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Device viewport widths (fixed, independent of builder UI)
  const deviceWidths = {
    desktop: 1440,
    tablet: 1024,
    mobile: 375
  };
  
  const currentDeviceWidth = deviceWidths[viewMode]; 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{sectionId: string, elementId?: string, field: string} | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingPageData, setLoadingPageData] = useState(false);
  const [savingPageData, setSavingPageData] = useState(false);
  
  // Theme settings state
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [defaultSizes, setDefaultSizes] = useState({
    h1: '3rem',      // 48px
    h2: '2.5rem',    // 40px
    h3: '2rem',      // 32px
    h4: '1.5rem',    // 24px
    h5: '1.25rem',   // 20px
    h6: '1rem',      // 16px
    text: '1rem',    // 16px
    textSmall: '0.875rem',  // 14px
    textLarge: '1.125rem',  // 18px
    textXl: '1.25rem'       // 20px
  });
  const [defaultTypography, setDefaultTypography] = useState({
    fontFamily: 'Inter, sans-serif'
  });
  const [savingTheme, setSavingTheme] = useState(false);

  // PRELOAD ALL FONTS FOR INSTANT REAL-TIME PREVIEW
  useEffect(() => {
    const loadFonts = () => {
      const fontFamilies = PRESET_FONTS.map(f => f.name.replace(/\s+/g, '+') + ':wght@300;400;700;900');
      const url = `https://fonts.googleapis.com/css2?family=${fontFamilies.join('&family=')}&display=swap`;
      
      // Check if already loaded to avoid duplicates
      if (!document.getElementById('geniebuild-fonts')) {
        const link = document.createElement('link');
        link.id = 'geniebuild-fonts';
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
      }
    };
    loadFonts();
  }, []);

  // Load page data from API if projectId and pageId are in URL
  useEffect(() => {
    const { projectId, pageId } = getUrlParams();
    if (projectId && pageId) {
      loadPageData(projectId, pageId);
    }
    if (projectId) {
      loadThemeSettings(projectId);
    }
  }, []);

  const loadPageData = async (projectId: string, pageId: string) => {
    try {
      setLoadingPageData(true);
      const { token } = getUrlParams();
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:1111/admin/v1';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/getWebsiteDesignData/${projectId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch website data');
      }

      const data = await response.json();
      if (data?.data?.pages) {
        // Find the specific page
        const pageData = data.data.pages.find((p: any) => {
          const currentPageId = p.pageId?._id || p.pageId;
          return String(currentPageId) === String(pageId);
        });

        if (pageData && pageData.style?.renderer === 'geniebuild' && pageData.componentIds && Array.isArray(pageData.componentIds)) {
          // Extract sectionData from componentIds (single source of truth)
          const genieBuildSections: Section[] = pageData.componentIds
            .map((compData: any) => compData.sectionData)
            .filter((section: any) => section != null) as Section[];
          
          // Extract global colors from design data
          const globalColors = {
            backgroundColor: data.data.colorSecondary || '#0E1214',
            textColor: data.data.colorAccent || '#D1D5DB',
            titleColor: data.data.colorAccent || '#F8FAFC',
            subtitleColor: data.data.colorAccent || '#D1D5DB',
            accentColor: data.data.colorAccent || '#F8FAFC',
            buttonBackgroundColor: data.data.colorPrimary || '#E11D48',
            buttonTextColor: '#FFFFFF',
            linkColor: data.data.colorAccent || '#F8FAFC',
            borderColor: data.data.colorAccent || '#D1D5DB'
          };

          // Migrate sections to include variantStyles if not present
          const migratedSections = genieBuildSections.map((section: Section) => {
            if (!section.variantStyles) {
              const currentVariant = section.styles?.variant || getDefaultVariant(section.type);
              return {
                ...section,
                variantStyles: {
                  [currentVariant]: { ...section.styles }
                }
              };
            }
            return section;
          });

          setSiteData({
            ...INITIAL_TEMPLATE,
            sections: migratedSections,
            globalStyles: {
              ...INITIAL_TEMPLATE.globalStyles,
              colors: globalColors,
            },
          });
        } else {
          console.warn('Page does not have GenieBuild sections');
        }
      }
    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      setLoadingPageData(false);
    }
  };

  const savePageData = async () => {
    const { projectId, pageId, token } = getUrlParams();
    if (!projectId || !pageId) {
      toast.error('Missing projectId or pageId in URL');
      return;
    }

    if (!token) {
      toast.error('Authentication token not found. Please open GenieBuild from the admin panel.');
      return;
    }

    try {
      setSavingPageData(true);
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:1111/admin/v1';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      // Transform siteData back to the format expected by the API
      // We need to fetch the current page data first to get componentIds structure
      const getResponse = await fetch(`${apiUrl}/getWebsiteDesignData/${projectId}`, {
        method: 'GET',
        headers,
      });

      if (!getResponse.ok) {
        throw new Error('Failed to fetch current website data');
      }

      const getData = await getResponse.json();
      if (!getData?.data?.pages) {
        throw new Error('No pages data found');
      }

      // Find the specific page
      const currentPageData = getData.data.pages.find((p: any) => {
        const currentPageId = p.pageId?._id || p.pageId;
        return String(currentPageId) === String(pageId);
      });

      if (!currentPageData || !currentPageData.componentIds) {
        throw new Error('Page data not found or invalid');
      }

      // Update componentIds with new sectionData from siteData
      // Match sections by type and update sectionData, preserving componentId structure
      const updatedComponentIds = currentPageData.componentIds.map((compData: any) => {
        // Find matching section by type
        const matchingSection = siteData.sections.find((s: Section) => s.type === compData.sectionData?.type);
        if (matchingSection) {
          return {
            ...compData,
            sectionData: matchingSection
          };
        }
        // Keep existing component if no match found (section might have been removed from editor)
        return compData;
      });

      // Prepare the save payload
      const savePayload = {
        projectId,
        colorPrimary: siteData.globalStyles.colors.buttonBackgroundColor || '#E11D48',
        colorSecondary: siteData.globalStyles.colors.backgroundColor || '#0E1214',
        colorAccent: siteData.globalStyles.colors.titleColor || '#F8FAFC',
        pages: [{
          pageId,
          style: {
            renderer: 'geniebuild'
          },
          componentIds: updatedComponentIds
        }]
      };

      const saveResponse = await fetch(`${apiUrl}/saveWebsiteDesignData`, {
        method: 'POST',
        headers,
        body: JSON.stringify(savePayload),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || 'Failed to save website data');
      }

      // Also save theme settings if they exist
      try {
        const themePayload: any = {
          projectId,
          theme: selectedPresetId ? 
            PRESET_THEMES[parseInt(selectedPresetId)]?.name.toLowerCase().replace(/\s+/g, '-') || 'custom' :
            'custom',
          presetId: null, // Backend will look up presetId from theme name
          defaultSizes,
          defaultTypography
        };
        
        // Only include customColors if it's a custom theme
        if (themePayload.theme === 'custom') {
          themePayload.customColors = {
            heading: siteData.globalStyles.colors.titleColor,
            description: siteData.globalStyles.colors.textColor,
            surface: siteData.globalStyles.colors.backgroundColor,
            primaryButton: {
              bg: siteData.globalStyles.colors.buttonBackgroundColor,
              text: siteData.globalStyles.colors.buttonTextColor
            },
            accent: siteData.globalStyles.colors.accentColor
          };
        }
        
        const themeResponse = await fetch(`${apiUrl}/updateProjectTheme`, {
          method: 'POST',
          headers,
          body: JSON.stringify(themePayload)
        });
        
        if (!themeResponse.ok) {
          console.warn('Failed to save theme settings, but page data was saved');
        }
      } catch (themeError) {
        console.warn('Error saving theme settings:', themeError);
        // Don't fail the whole save if theme save fails
      }

      toast.success('Website changes saved successfully!');
    } catch (error: any) {
      console.error('Error saving page data:', error);
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setSavingPageData(false);
    }
  };

  const selectedSection = useMemo(() => {
    const section = siteData.sections.find(s => s.id === selectedSectionId);
    return section;
  }, [siteData.sections, selectedSectionId]);

  const selectedElement = useMemo(() => {
    if (!selectedSection || !selectedElementId) return null;
    const regularElement = selectedSection.elements?.find(e => e.id === selectedElementId);
    if (regularElement) return regularElement;
    if (selectedVirtualElement && selectedVirtualElement.id === selectedElementId) return selectedVirtualElement;
    return null;
  }, [selectedSection, selectedElementId, selectedVirtualElement]);

  // STEP 4: Advanced Cascading Data Resolvers
  // 1. Resolve Section Styles: Base Defaults -> Variant Overrides -> DB State
  const activeTemplate = selectedSection ? (SECTION_TEMPLATES[selectedSection.type] || null) : null;
  const currentVariant = selectedSection?.styles?.variant || activeTemplate?.styles?.variant || 'center';
  const variantOverrides = activeTemplate?.variantOverrides?.[currentVariant] || {};
  const resolvedSectionStyles: any = selectedSection ? {
    ...(activeTemplate?.styles || {}),
    ...variantOverrides,
    ...selectedSection.styles
  } : {};

  // 2. Resolve Element Styles: Global Element Defaults -> Section Element Defaults -> DB State
  const baseElementDefault = selectedElement ? (ELEMENT_DEFAULTS[selectedElement.type] || {}) : {};
  const sectionElementDefault = selectedElement && activeTemplate ? activeTemplate.elements?.find(e => e.type === selectedElement.type)?.style : {};
  const resolvedElementStyle = selectedElement ? {
    ...baseElementDefault,
    ...sectionElementDefault,
    ...selectedElement.style
  } : {};

  useEffect(() => {
    if (selectedSectionId && !isPreviewMode) {
      setIsSidebarOpen(true);
      
      // If an element is selected, verify it actually exists either in the array OR as our active virtual element
      if (selectedElementId && selectedSection) {
        const existsInArray = selectedSection.elements?.find(e => e.id === selectedElementId);
        const isOurVirtualElement = selectedVirtualElement && selectedVirtualElement.id === selectedElementId;
        
        // If it's completely orphaned (neither saved nor currently virtual), clear the selection
        if (!existsInArray && !isOurVirtualElement) {
          setSelectedElementId(null);
          setSelectedVirtualElement(null);
        }
      }
    } else {
      setIsSidebarOpen(false);
    }
  }, [selectedSectionId, selectedElementId, isPreviewMode, selectedSection, selectedVirtualElement]);
  
  useEffect(() => {
      if(selectedElementId) {
          if(editTab === 'advanced') setEditTab('content');
      }
  }, [selectedElementId]);

  // Auto-save theme settings when font family changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    const { projectId, token } = getUrlParams();
    if (!projectId || !token) return;
    
    // Skip initial mount - only save when font actually changes
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Debounce auto-save to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:1111/admin/v1';
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
        
        let themeName = 'custom';
        if (selectedPresetId !== null && selectedPresetId !== undefined) {
          const selectedTheme = PRESET_THEMES[parseInt(selectedPresetId)];
          if (selectedTheme) {
            themeName = selectedTheme.name.toLowerCase().replace(/\s+/g, '-');
          }
        }
        
        const payload: any = {
          projectId,
          theme: themeName,
          presetId: null,
          defaultSizes,
          defaultTypography
        };
        
        if (themeName === 'custom') {
          payload.customColors = {
            heading: siteData.globalStyles.colors.titleColor,
            description: siteData.globalStyles.colors.textColor,
            surface: siteData.globalStyles.colors.backgroundColor,
            primaryButton: {
              bg: siteData.globalStyles.colors.buttonBackgroundColor,
              text: siteData.globalStyles.colors.buttonTextColor
            },
            accent: siteData.globalStyles.colors.accentColor
          };
        }
        
        const response = await fetch(`${apiUrl}/updateProjectTheme`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          toast.success('Font updated and saved!', { duration: 2000 });
        }
      } catch (error) {
        console.error('Error auto-saving font:', error);
        // Don't show error toast for auto-save to avoid annoyance
      }
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timeoutId);
  }, [defaultTypography.fontFamily]);

  // Update sections with default sizes in real-time when defaultSizes change
  // Always clear titleSize/subtitleSize to let CSS defaults apply (unless custom override exists)
  useEffect(() => {
    setSiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        const updatedSection = { ...section };
        const stylesAny = updatedSection.styles as any;
        
        // Always clear titleSize - CSS will apply the default based on titleHeadingTag
        // Only keep titleSize if it's a custom override (doesn't match any default)
        if (stylesAny.titleHeadingTag && stylesAny.titleSize) {
          const headingTag = stylesAny.titleHeadingTag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
          const currentDefaultSize = defaultSizes[headingTag];
          
          // If titleSize matches the default for this heading tag, clear it
          if (stylesAny.titleSize === currentDefaultSize) {
            const { titleSize, ...restStyles } = stylesAny;
            updatedSection.styles = restStyles as typeof section.styles;
          }
        }
        
        // Don't clear subtitleSize - we need it to map to textSize for Hero subtitle virtual elements
        // The subtitleSize is used to determine which textSize variant (base/small/large/xl) to show in the dropdown
        // Clearing it would break the textSize selection functionality
        
        // Update elements that use heading tags
        if (updatedSection.elements && Array.isArray(updatedSection.elements)) {
          updatedSection.elements = updatedSection.elements.map(element => {
            const htmlTag = element.content?.htmlTag;
            if (htmlTag && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(htmlTag)) {
              const headingTag = htmlTag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
              const currentDefaultSize = defaultSizes[headingTag];
              
              // Clear fontSize if it matches the default for this heading tag
              if (element.style?.fontSize === currentDefaultSize) {
                const { fontSize, ...restStyle } = element.style;
                return {
                  ...element,
                  style: restStyle
                };
              }
            }
            // Update text elements (p tags) - clear fontSize if it matches any text default
            if (htmlTag === 'p' && element.style?.fontSize && (
                element.style.fontSize === defaultSizes.text || 
                element.style.fontSize === defaultSizes.textSmall ||
                element.style.fontSize === defaultSizes.textLarge ||
                element.style.fontSize === defaultSizes.textXl
              )) {
              const { fontSize, ...restStyle } = element.style;
              return {
                ...element,
                style: restStyle
              };
            }
            return element;
          });
        }
        
        return updatedSection;
      })
    }));
  }, [defaultSizes]);

  useEffect(() => {
    const { colors } = siteData.globalStyles;
    
    // Generate CSS for default font sizes and typography
    const fontSizesCSS = `
      .h1-default { font-size: ${defaultSizes.h1}; }
      .h2-default { font-size: ${defaultSizes.h2}; }
      .h3-default { font-size: ${defaultSizes.h3}; }
      .h4-default { font-size: ${defaultSizes.h4}; }
      .h5-default { font-size: ${defaultSizes.h5}; }
      .h6-default { font-size: ${defaultSizes.h6}; }
      .text-default { font-size: ${defaultSizes.text}; }
      .text-small { font-size: ${defaultSizes.textSmall}; }
      .text-large { font-size: ${defaultSizes.textLarge}; }
      .text-xl { font-size: ${defaultSizes.textXl}; }
      
      /* Apply default font family only to canvas content, not GenieBuild UI */
      /* Inline styles (with fontFamily) will automatically override this CSS rule */
      #canvas-root {
        font-family: ${defaultTypography.fontFamily};
      }
      
      /* Apply font family to all text elements within canvas */
      /* Inline fontFamily styles will automatically override this (higher specificity) */
      #canvas-root h1,
      #canvas-root h2,
      #canvas-root h3,
      #canvas-root h4,
      #canvas-root h5,
      #canvas-root h6,
      #canvas-root p,
      #canvas-root span,
      #canvas-root div {
        font-family: ${defaultTypography.fontFamily};
      }
      
      /* Default heading sizes - apply to all headings, inline styles will override */
      #canvas-root h1 { font-size: ${defaultSizes.h1}; }
      #canvas-root h2 { font-size: ${defaultSizes.h2}; }
      #canvas-root h3 { font-size: ${defaultSizes.h3}; }
      #canvas-root h4 { font-size: ${defaultSizes.h4}; }
      #canvas-root h5 { font-size: ${defaultSizes.h5}; }
      #canvas-root h6 { font-size: ${defaultSizes.h6}; }
      #canvas-root p { font-size: ${defaultSizes.text}; }
      
      /* Text size variants - override default p size */
      #canvas-root p.text-sm { font-size: ${defaultSizes.textSmall}; }
      #canvas-root p.text-lg { font-size: ${defaultSizes.textLarge}; }
      #canvas-root p.text-xl { font-size: ${defaultSizes.textXl}; }
      
      /* Zoom Slider Styles */
      .zoom-slider::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #1e293b;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .zoom-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #1e293b;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .zoom-slider:focus {
        outline: none;
      }
      
      .zoom-slider:focus::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      }
    `;
    
    const styleString = `
      :root { 
        --bg-color: ${colors.backgroundColor}; 
        --text-color: ${colors.textColor}; 
        --title-color: ${colors.titleColor}; 
        --accent-color: ${colors.accentColor}; 
        --btn-bg: ${colors.buttonBackgroundColor}; 
        --btn-text: ${colors.buttonTextColor}; 
      } 
      #canvas-root { 
        background-color: var(--bg-color); 
        color: var(--text-color); 
        min-height: 100vh; 
      }
      ${fontSizesCSS}
    `;
    let styleEl = document.getElementById('dynamic-theme-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-theme-styles';
        document.head.appendChild(styleEl);
    }
    // Update innerHTML without destroying the node, keeping the iframe MutationObserver connected!
    styleEl.innerHTML = styleString;
    return () => { /* Don't remove - keep the element alive for MutationObserver */ }
  }, [siteData.globalStyles.colors, defaultSizes, defaultTypography]);


  const updateSection = (id: string, updates: Partial<Section>) => {
    setSiteData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } as Section : s)
    }));
  };
  
  const updateElement = (sectionId: string, elementId: string, updates: Partial<WebsiteElement>) => {
      setSiteData(prev => ({
          ...prev,
          sections: prev.sections.map(s => {
              if (s.id !== sectionId) return s;
              
              // Universal Upsert Pattern: Works for ALL sections
              const existingElementIndex = s.elements?.findIndex(e => e.id === elementId) ?? -1;
              
              if (existingElementIndex >= 0) {
                  // Standard update for existing element
                  const newElements = [...(s.elements || [])];
                  newElements[existingElementIndex] = {
                      ...newElements[existingElementIndex],
                      ...updates,
                      content: { ...newElements[existingElementIndex].content, ...(updates.content || {}) },
                      style: { ...newElements[existingElementIndex].style, ...(updates.style || {}) },
                      settings: { ...newElements[existingElementIndex].settings, ...(updates.settings || {}) }
                  };
                  return { ...s, elements: newElements };
              } else if (selectedVirtualElement && selectedVirtualElement.id === elementId) {
                  // Universal Upsert: First edit on a hydrated element
                  const newElement = {
                      ...selectedVirtualElement,
                      ...updates,
                      content: { ...selectedVirtualElement.content, ...(updates.content || {}) },
                      style: { ...selectedVirtualElement.style, ...(updates.style || {}) }
                  };
                  return { ...s, elements: [...(s.elements || []), newElement] };
              }
              
              // Element not found and not a virtual element - return unchanged
              return s;
          })
      }));
  };

  const resetElementToDefault = async () => {
    if (!selectedSection || !selectedElementId) return;

    try {
      const { projectId, pageId, token } = getUrlParams();
      if (!projectId || !pageId || !token) {
        toast.error('Missing projectId, pageId, or authentication token');
        return;
      }

      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:1111/admin/v1';
      const sectionId = selectedSection.type; // Use section type as sectionId

      // Fetch original content from SectionContent
      const response = await fetch(`${apiUrl}/getSectionContent/${projectId}/${pageId}/${sectionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch original content');
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error('No original content found');
      }

      const originalData = result.data;

      // Handle Hero section virtual elements
      if (selectedSection.type === 'hero' && selectedElementId.startsWith(`${selectedSection.id}-hero-`)) {
        const elementType = selectedElementId.replace(`${selectedSection.id}-hero-`, '');
        
        if (elementType === 'title' && originalData.title) {
          updateElement(selectedSection.id, selectedElementId, { content: { text: originalData.title } });
        } else if (elementType === 'subtitle' && originalData.subtitle) {
          updateElement(selectedSection.id, selectedElementId, { content: { text: originalData.subtitle } });
        } else if (elementType === 'button' && originalData.ctaText) {
          updateElement(selectedSection.id, selectedElementId, { content: { text: originalData.ctaText } });
        } else if (elementType === 'image' && originalData.imageUrl) {
          updateElement(selectedSection.id, selectedElementId, { content: { imageUrl: originalData.imageUrl } });
        } else if (elementType === 'icon' && originalData.icon) {
          updateElement(selectedSection.id, selectedElementId, { content: { icon: originalData.icon } });
        } else if (elementType === 'badge' && originalData.badgeText) {
          updateElement(selectedSection.id, selectedElementId, { content: { text: originalData.badgeText } });
        }
      } else {
        // Handle regular elements - find the element in the original data
        // For now, we'll reset the entire section content if it's a regular element
        // This is a simplified approach - you may need to adjust based on your element structure
        if (selectedElement && originalData) {
          // Try to find matching element content in originalData
          // This depends on your element structure
          const elementContent = originalData[selectedElement.type] || originalData;
          if (elementContent) {
            updateElement(selectedSection.id, selectedElementId, { content: elementContent });
          }
        }
      }

      toast.success('Content reset to default successfully!');
    } catch (error: any) {
      console.error('Error resetting element:', error);
      toast.error(`Failed to reset: ${error.message}`);
    }
  };

  const updateSectionStyle = (id: string, key: string, value: any) => {
    setSiteData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id === id) {
          const currentVariant = s.styles?.variant || getDefaultVariant(s.type);
          
          // Update current styles
          const updatedStyles = {
              ...s.styles,
              [key]: value
          };
          
          // Save to variant-specific storage
          const variantStyles = s.variantStyles || {};
          variantStyles[currentVariant] = {
            ...variantStyles[currentVariant],
            [key]: value
          };
          
          return {
            ...s,
            styles: updatedStyles,
            variantStyles: variantStyles
          } as Section;
        }
        return s;
      })
    }));
  };

  // Restore missing elements from template
  const restoreSectionElements = (sectionId: string) => {
    setSiteData(prev => {
      const sections = prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        
        // Get the base template for this section type
        const template = SECTION_TEMPLATES[s.type] || SECTION_TEMPLATES.hero;
        const currentElements = s.elements || [];
        const templateElements = template.elements || [];
        
        let hasChanges = false;
        let updatedElements = [...currentElements];
        let updatedContent = { ...s.content };
        
        // For sections with elements arrays (like allelementsTest), restore missing element types
        if (templateElements && templateElements.length > 0) {
          // Track which element types already exist
          const existingElementTypes = new Set(currentElements.map(el => el.type));
          
          // Find missing elements by type (not by ID, since IDs are section-specific)
          const missingElements: WebsiteElement[] = [];
          templateElements.forEach(templateEl => {
            if (!existingElementTypes.has(templateEl.type)) {
              // Create a new element with a unique ID based on section ID and element type
              const newElementId = `${sectionId}-${templateEl.type}-${Date.now()}`;
              missingElements.push({
                ...templateEl,
                id: newElementId
              });
              hasChanges = true;
            }
          });
          
          if (missingElements.length > 0) {
            updatedElements = [...currentElements, ...missingElements];
          }
        }
        
        // For hero sections, restore core content properties if empty
        if (s.type === 'hero') {
          const templateContent = template.content || {};
          if (!updatedContent.imageUrl && templateContent.imageUrl) {
            updatedContent.imageUrl = templateContent.imageUrl;
            hasChanges = true;
          }
          if (!updatedContent.title && templateContent.title) {
            updatedContent.title = templateContent.title;
            hasChanges = true;
          }
          if (!updatedContent.subtitle && templateContent.subtitle) {
            updatedContent.subtitle = templateContent.subtitle;
            hasChanges = true;
          }
          if (!updatedContent.ctaText && templateContent.ctaText) {
            updatedContent.ctaText = templateContent.ctaText;
            hasChanges = true;
          }
        }
        
        // Only update if there are changes
        if (hasChanges) {
          return {
            ...s,
            elements: updatedElements,
            content: updatedContent
          } as Section;
        }
        
        return s;
      });
      
      return { ...prev, sections };
    });
    
    toast.success('Missing elements restored successfully!');
  };

  // Reset section styles to theme/section defaults (preserves current variant and content)
  const resetSectionStyles = async (sectionId: string) => {
    const { projectId, pageId, token } = getUrlParams();
    if (!projectId || !pageId) {
      toast.error('Missing projectId or pageId in URL');
      return;
    }

    setSiteData(prev => {
      const sections = prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        
        // CRITICAL: Preserve current variant - DO NOT CHANGE IT
        const currentVariant = s.styles?.variant || getDefaultVariant(s.type);
        
        // Get the base template for this section type
        const template = SECTION_TEMPLATES[s.type] || SECTION_TEMPLATES.hero;
        const templateStyles = (template.styles || {}) as any;
        
        // Start with template defaults (but exclude variant to preserve current one)
        const baseDefaults: any = {
          ...templateStyles,
          // Remove variant from template defaults - we'll set it explicitly
          variant: undefined
        };
        
        // Merge template styles with theme data defaults
        // Priority: Template defaults -> Theme data -> Hardcoded fallbacks
        const defaultStyles: any = {
          // Background colors - use theme surface as default
          backgroundColor: baseDefaults.backgroundColor || themeData?.surface || '#0E1214',
          background: baseDefaults.background || { 
            type: 'color', 
            color: baseDefaults.backgroundColor || themeData?.surface || '#0E1214' 
          },
          
          // Text colors - use theme description as default
          textColor: baseDefaults.textColor || themeData?.description || '#D1D5DB',
          
          // Title colors - use theme heading as default
          titleColor: baseDefaults.titleColor || themeData?.heading || '#F8FAFC',
          
          // Accent colors - use theme accent as default
          accentColor: baseDefaults.accentColor || themeData?.accent || '#F59E0B',
          
          // Button colors - use theme primaryButton as default
          buttonBackgroundColor: baseDefaults.buttonBackgroundColor || themeData?.primaryButton?.bg || '#E11D48',
          buttonTextColor: baseDefaults.buttonTextColor || themeData?.primaryButton?.text || '#FFFFFF',
          
          // Overlay - use theme overlay as default (if background image exists)
          overlayColor: baseDefaults.overlayColor || themeData?.overlay?.color || 'rgba(0, 0, 0, 0.5)',
          overlayBlendMode: baseDefaults.overlayBlendMode || themeData?.overlay?.blend || 'multiply',
          
          // Spacing and layout - use template defaults
          paddingTop: baseDefaults.paddingTop || 'pt-16',
          paddingBottom: baseDefaults.paddingBottom || 'pb-16',
          paddingX: baseDefaults.paddingX || 'px-6',
          textAlign: baseDefaults.textAlign || 'center',
          titleSize: baseDefaults.titleSize || 'text-4xl',
          
          // CRITICAL: Preserve current variant - DO NOT CHANGE
          variant: currentVariant,
          
          // Keep other template style properties (spacing, sizing, etc.)
          ...Object.fromEntries(
            Object.entries(baseDefaults).filter(([key]) => 
              !['variant', 'backgroundColor', 'background', 'textColor', 'titleColor', 
                'accentColor', 'buttonBackgroundColor', 'buttonTextColor', 
                'overlayColor', 'overlayBlendMode', 'paddingTop', 'paddingBottom', 
                'paddingX', 'textAlign', 'titleSize'].includes(key)
            )
          )
        };
        
        // Apply variant-specific overrides if they exist (but preserve variant)
        if (template.variantOverrides && template.variantOverrides[currentVariant]) {
          const variantOverrides = { ...template.variantOverrides[currentVariant] };
          // Remove variant from overrides to preserve current one
          delete variantOverrides.variant;
          Object.assign(defaultStyles, variantOverrides);
        }
        
        // CRITICAL: Ensure variant is preserved (final check)
        defaultStyles.variant = currentVariant;
        
        return {
          ...s,
          // Only update styles - preserve content and elements
          styles: defaultStyles
        } as Section;
      });
      
      return { ...prev, sections };
    });
    
    // Auto-save to DB after reset
    setTimeout(async () => {
      try {
        await savePageData();
        toast.success('Section styles reset to defaults and saved!');
      } catch (error) {
        console.error('Error saving reset styles:', error);
        toast.error('Styles reset but failed to save. Please save manually.');
      }
    }, 100);
  };

  // Helper to update section background (handles nested object)
  const updateSectionBackground = (id: string, background: any) => {
    updateSectionStyle(id, 'background', background);
  };

  // Handle variant refresh - cycles through available variants
  const handleRefreshVariant = () => {
    if (!selectedSectionId || !selectedSection) return;
    
    const sectionType = selectedSection.type;
    const availableVariants = getVariantsForSection(sectionType);
    
    // Only show button if there are multiple variants
    if (availableVariants.length <= 1) return;
    
    const currentVariant = selectedSection.styles?.variant || getDefaultVariant(sectionType);
    const currentIndex = availableVariants.indexOf(currentVariant);
    
    // Get next variant (cycle to first if at end)
    const nextIndex = (currentIndex + 1) % availableVariants.length;
    const nextVariant = availableVariants[nextIndex];
    
    // Save current styles to variant-specific storage before switching
    setSiteData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id === selectedSectionId) {
          const variantStyles = s.variantStyles || {};
          
          // Save current styles to current variant
          variantStyles[currentVariant] = {
            ...variantStyles[currentVariant],
            ...s.styles
          };
          
          // Load styles for next variant (or use defaults if not saved)
          const nextVariantStyles = variantStyles[nextVariant] || {};
          const template = SECTION_TEMPLATES[sectionType] || SECTION_TEMPLATES.hero;
          const defaultStyles = template?.styles || {};
          
          // Merge: defaults -> saved variant styles -> keep variant field
          const mergedStyles = {
            ...defaultStyles,
            ...nextVariantStyles,
            variant: nextVariant // Always set the variant
          };
          
          return {
            ...s,
            styles: mergedStyles,
            variantStyles: variantStyles
          } as Section;
        }
        return s;
      })
    }));
    
    toast.success(`Variant changed to ${formatVariantName(nextVariant, sectionType) || nextVariant}`);
  };
  
  const updateGlobalColor = (key: keyof typeof siteData.globalStyles.colors, value: string) => {
      setSiteData(prev => ({
          ...prev,
          globalStyles: { ...prev.globalStyles, colors: { ...prev.globalStyles.colors, [key]: value } }
      }));
  };

  const loadThemeSettings = async (projectId: string) => {
    try {
      const { token } = getUrlParams();
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:1111/admin/v1';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/getThemeSettings?projectId=${projectId}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        console.error('Failed to load theme settings, using defaults');
        // Use default values if API fails
        return;
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        const { presetId, defaultSizes: savedSizes, defaultTypography: savedTypography, theme, customColors } = result.data;
        
        // Load default sizes - use saved values or fallback to defaults
        setDefaultSizes({
          h1: savedSizes?.h1 || '3rem',
          h2: savedSizes?.h2 || '2.5rem',
          h3: savedSizes?.h3 || '2rem',
          h4: savedSizes?.h4 || '1.5rem',
          h5: savedSizes?.h5 || '1.25rem',
          h6: savedSizes?.h6 || '1rem',
          text: savedSizes?.text || '1rem',
          textSmall: savedSizes?.textSmall || '0.875rem',
          textLarge: savedSizes?.textLarge || '1.125rem',
          textXl: savedSizes?.textXl || '1.25rem'
        });
        
        // Load default typography - use saved value or fallback to default
        setDefaultTypography({
          fontFamily: savedTypography?.fontFamily || 'Inter, sans-serif'
        });
        
        // Apply custom colors if present (for custom theme)
        if (customColors && theme === 'custom') {
          const newGlobalStyles = {
            ...siteData.globalStyles,
            colors: {
              backgroundColor: customColors.surface || siteData.globalStyles.colors.backgroundColor,
              textColor: customColors.description || siteData.globalStyles.colors.textColor,
              titleColor: customColors.heading || siteData.globalStyles.colors.titleColor,
              subtitleColor: customColors.description || siteData.globalStyles.colors.subtitleColor,
              accentColor: customColors.accent || siteData.globalStyles.colors.accentColor,
              buttonBackgroundColor: customColors.primaryButton?.bg || siteData.globalStyles.colors.buttonBackgroundColor,
              buttonTextColor: customColors.primaryButton?.text || siteData.globalStyles.colors.buttonTextColor,
              linkColor: customColors.ring || siteData.globalStyles.colors.linkColor,
              borderColor: customColors.ring || siteData.globalStyles.colors.borderColor,
              overlayColor: customColors.overlay?.color || siteData.globalStyles.colors.overlayColor
            }
          };
          setSiteData(prev => ({
            ...prev,
            globalStyles: newGlobalStyles,
            sections: prev.sections.map(section => ({
              ...section,
              styles: {
                ...section.styles,
                backgroundColor: customColors.surface || section.styles.backgroundColor,
                textColor: customColors.description || section.styles.textColor,
                titleColor: customColors.heading || section.styles.titleColor,
                subtitleColor: customColors.description || section.styles.subtitleColor,
                accentColor: customColors.accent || section.styles.accentColor,
                buttonBackgroundColor: customColors.primaryButton?.bg || section.styles.buttonBackgroundColor,
                buttonTextColor: customColors.primaryButton?.text || section.styles.buttonTextColor
              }
            }))
          }));
        }
        
        // Apply theme if preset is selected - match by theme name and set index as selectedPresetId
        if (theme && theme !== 'custom') {
          const themeIndex = PRESET_THEMES.findIndex(t => t.name.toLowerCase().replace(/\s+/g, '-') === theme);
          if (themeIndex >= 0) {
            const presetTheme = PRESET_THEMES[themeIndex];
            setSelectedPresetId(themeIndex.toString());
            applyTheme(presetTheme, themeIndex.toString());
          }
        } else {
          // Custom theme - clear preset selection
          setSelectedPresetId(null);
        }
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
      // Use default values if error occurs
    }
  };

  const saveThemeSettings = async () => {
    try {
      setSavingTheme(true);
      const { projectId, token } = getUrlParams();
      if (!projectId) {
        toast.error('Project ID not found');
        return;
      }
      
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:1111/admin/v1';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Determine theme name from selected preset or use 'custom'
      // If selectedPresetId is set, find the theme name from PRESET_THEMES
      // Otherwise, check if custom colors are being used
      let themeName = 'custom';
      if (selectedPresetId !== null && selectedPresetId !== undefined) {
        const selectedTheme = PRESET_THEMES[parseInt(selectedPresetId)];
        if (selectedTheme) {
          themeName = selectedTheme.name.toLowerCase().replace(/\s+/g, '-');
        }
      }
      
      const payload: any = {
        projectId,
        theme: themeName,
        presetId: null, // Backend will look up presetId from theme name
        defaultSizes,
        defaultTypography
      };
      
      // Only include customColors if it's a custom theme
      if (themeName === 'custom') {
        payload.customColors = {
          heading: siteData.globalStyles.colors.titleColor,
          description: siteData.globalStyles.colors.textColor,
          surface: siteData.globalStyles.colors.backgroundColor,
          primaryButton: {
            bg: siteData.globalStyles.colors.buttonBackgroundColor,
            text: siteData.globalStyles.colors.buttonTextColor
          },
          accent: siteData.globalStyles.colors.accentColor
        };
      }
      
      const response = await fetch(`${apiUrl}/updateProjectTheme`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Failed to save theme settings: ${errorData.message || 'Unknown error'}`);
        return;
      }
      
      const result = await response.json();
      toast.success('Theme settings saved successfully!');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toast.error('Failed to save theme settings');
    } finally {
      setSavingTheme(false);
    }
  };

  const applyTheme = (theme: typeof PRESET_THEMES[0], presetId?: string | null) => {
      const colors = theme.elements;
      const newGlobalStyles = {
          ...siteData.globalStyles,
          colors: {
              backgroundColor: colors.surface,
              textColor: colors.description,
              titleColor: colors.heading,
              subtitleColor: colors.description,
              accentColor: colors.accent,
              buttonBackgroundColor: colors.primaryButton.bg,
              buttonTextColor: colors.primaryButton.text,
              linkColor: colors.ring,
              borderColor: colors.ring,
              overlayColor: colors.overlay.color
          }
      };
      const newSections = siteData.sections.map(section => ({
          ...section,
          styles: {
              ...section.styles,
              backgroundColor: colors.surface,
              textColor: colors.description,
              titleColor: colors.heading,
              subtitleColor: colors.description,
              accentColor: colors.accent,
              buttonBackgroundColor: colors.primaryButton.bg,
              buttonTextColor: colors.primaryButton.text,
              borderColor: colors.ring,
              overlayColor: colors.overlay.color,
              overlayOpacityValue: '1', 
              overlayBlendMode: colors.overlay.blend || 'normal'
          }
      }));
      setSiteData(prev => ({
          ...prev,
          globalStyles: newGlobalStyles,
          sections: newSections
      }));
      // Update selected preset ID
      if (presetId !== undefined) {
        setSelectedPresetId(presetId);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      setUploading(true);
      setUploadProgress(0);
      
      try {
        // Use uploadFile API instead of base64
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:1111/admin/v1';
        const { projectId, token } = getUrlParams();
        
        const formData = new FormData();
        formData.append('file', file);
        
        const headers: HeadersInit = {
          'Authorization': token ? `Bearer ${token}` : '',
        };
        
        // Simulate progress for better UX (since we can't track actual progress without backend support)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
        
        const response = await fetch(`${apiUrl}/uploadFile`, {
          method: 'POST',
          headers,
          body: formData,
        });
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await response.json();
        const uploadedUrl = data.data?.url || data.url || '';
        
        // Construct full URL with localhost:1111 base
        const fullImageUrl = uploadedUrl.startsWith('http') 
          ? uploadedUrl 
          : `http://localhost:1111${uploadedUrl.startsWith('/') ? '' : '/'}${uploadedUrl}`;
        
        if (uploadTarget.elementId) {
          const section = siteData.sections.find(s => s.id === uploadTarget.sectionId);
          const element = section?.elements?.find(el => el.id === uploadTarget.elementId);
          if (section && element) {
            const fieldName = uploadTarget.field === 'imageUrl' || uploadTarget.field === 'videoUrl' ? uploadTarget.field : uploadTarget.field;
            // For video elements, use 'src' field; for images, use 'imageUrl'
            const updateField = uploadTarget.field === 'videoUrl' ? 'src' : (fieldName === 'imageUrl' ? 'imageUrl' : fieldName);
            const newContent = { ...element.content, [updateField]: fullImageUrl };
            // Also update src for video elements
            if (uploadTarget.field === 'videoUrl' && element.type === 'video') {
                newContent.src = fullImageUrl;
            }
            updateElement(uploadTarget.sectionId, uploadTarget.elementId, { content: newContent });
          }
        } else {
          if (uploadTarget.field === 'backgroundImage') {
            // Update the new background.image.url structure
            const section = siteData.sections.find(s => s.id === uploadTarget.sectionId);
            if (section) {
              const themeOverlayDefaults = getThemeOverlayDefaults();
              const currentBackground = section.styles?.background || { 
                type: 'image', 
                image: { 
                  url: '', 
                  position: 'center', 
                  size: 'cover', 
                  repeat: 'no-repeat', 
                  attachment: 'scroll', 
                  overlay: themeOverlayDefaults 
                } 
              };
              
              // Ensure background type is 'image' and update the URL
              const updatedBackground = {
                ...currentBackground,
                type: 'image',
                image: {
                  ...(currentBackground.image || { 
                    position: 'center', 
                    size: 'cover', 
                    repeat: 'no-repeat', 
                    attachment: 'scroll', 
                    overlay: themeOverlayDefaults 
                  }),
                  url: fullImageUrl
                }
              };
              
              updateSectionStyle(uploadTarget.sectionId, 'background', updatedBackground);
            }
          } else {
            const section = siteData.sections.find(s => s.id === uploadTarget.sectionId);
            if (section) {
              updateSection(uploadTarget.sectionId, { content: {...section.content, [uploadTarget.field]: fullImageUrl} });
            }
          }
        }
        
        const fileType = file.type.startsWith('video/') ? 'Video' : 'Image';
        toast.success(`${fileType} uploaded successfully`);
      } catch (error: any) {
        console.error('Upload error:', error);
        const fileType = file.type?.startsWith('video/') ? 'video' : 'image';
        toast.error(error?.message || `Failed to upload ${fileType}`);
      } finally {
        setUploadTarget(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = (sectionId: string, field: string, elementId?: string) => {
    setUploadTarget({ sectionId, field, elementId });
    fileInputRef.current?.click();
  };

  const deleteSection = (id: string) => {
    setSiteData(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== id) }));
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setSiteData(prev => {
      const idx = prev.sections.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.sections.length) return prev;
      const newSections = [...prev.sections];
      const [moved] = newSections.splice(idx, 1);
      newSections.splice(newIdx, 0, moved);
      return { ...prev, sections: newSections };
    });
  };

  const addNewSection = (type: SectionType) => {
    const template = SECTION_TEMPLATES[type] || SECTION_TEMPLATES.hero;
    const defaultVariant = template.styles?.variant || 'center';
    
    // Ensure the new section gets its specific variant overrides immediately
    const variantOverrides = template.variantOverrides?.[defaultVariant] || {};
    
    const newSection: Section = { 
        ...template, 
        id: `section-${Date.now()}`,
        type: template.type || type,
        styles: {
            ...template.styles,
            ...variantOverrides
        }
    } as Section;
    
    setSiteData(prev => {
        const sections = [...prev.sections];
        const heroIdx = sections.findIndex(s => s.type === 'hero');
        if (heroIdx > -1 && type !== 'navbar') sections.splice(heroIdx + 1, 0, newSection);
        else sections.push(newSection);
        return { ...prev, sections };
    });
    setSelectedSectionId(newSection.id);
    setIsAddMenuOpen(false);
  };

  const renderStyleEditor = (styles: any, onUpdate: (key: string, val: any) => void, context: 'section' | 'element', elementType?: string, sectionId?: string, themeColors?: any, onBatchUpdate?: (updates: Record<string, any>) => void) => {
      const getSpacingValues = (type: 'margin' | 'padding') => {
        if (context === 'element') {
            const val = styles[type];
            if (typeof val === 'string') return { top: val, right: val, bottom: val, left: val };
            return val || {};
        } else {
            if (type === 'padding') return { top: styles.paddingTop, bottom: styles.paddingBottom, left: styles.paddingLeft, right: styles.paddingRight };
            return { top: styles.marginTop, bottom: styles.marginBottom, left: styles.marginLeft, right: styles.marginRight };
        }
      };

      const handleSpacingUpdate = (type: 'margin' | 'padding', newValues: any) => {
          if (context === 'element') {
              onUpdate(type, newValues);
          } else {
              if (type === 'padding') {
                  if (newValues.top !== undefined) onUpdate('paddingTop', newValues.top);
                  if (newValues.bottom !== undefined) onUpdate('paddingBottom', newValues.bottom);
                  if (newValues.left !== undefined) onUpdate('paddingLeft', newValues.left);
                  if (newValues.right !== undefined) onUpdate('paddingRight', newValues.right);
              } else {
                  if (newValues.top !== undefined) onUpdate('marginTop', newValues.top);
                  if (newValues.bottom !== undefined) onUpdate('marginBottom', newValues.bottom);
                  if (newValues.left !== undefined) onUpdate('marginLeft', newValues.left);
                  if (newValues.right !== undefined) onUpdate('marginRight', newValues.right);
              }
          }
      };
      
      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
              <AccordionGroup title="Layout & Spacing" defaultOpen={true}>
                  <div className="mb-4">
                      {context === 'section' && <TextInput label="Max Width" value={styles.maxWidth} onChange={(v) => onUpdate('maxWidth', v)} placeholder="max-w-6xl" />}
                  </div>
                  <div className="space-y-4">
                      <SpacingInputGroup label="Padding" values={getSpacingValues('padding')} onChange={(v) => handleSpacingUpdate('padding', v)} />
                      <div className="h-px bg-white/5"></div>
                      <SpacingInputGroup label="Margin" values={getSpacingValues('margin')} onChange={(v) => handleSpacingUpdate('margin', v)} />
                  </div>
              </AccordionGroup>
              {context === 'element' && (
              <AccordionGroup title="Typography" defaultOpen={true}>
                       {/* Text Color - show for all elements except badge (badge has its own section) */}
                       {elementType !== 'badge' && (
                           <ColorInput label="Text Color" value={styles.color || styles.textColor} onChange={(v) => onUpdate('color', v)} />
                       )}
                       {(elementType === 'heading' || elementType === 'text') && (
                       <SelectInput
                           label="Font Family"
                           value={styles.fontFamily || ''}
                           options={[
                              { label: `Theme Default (${(defaultTypography?.fontFamily || 'Inter').split(',')[0].replace(/['"]/g, '').trim()})`, value: '' },
                              ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value }))
                           ]}
                           onChange={(v: string) => {
                               if (v === '') {
                                   onUpdate('fontFamily', undefined);
                               } else {
                                   onUpdate('fontFamily', v);
                               }
                           }}
                       />
                   )}
                       {elementType === 'icon' && (
                           <TextInput 
                               label="Icon Size (px)" 
                               value={styles.fontSize || '24px'} 
                               onChange={(v) => onUpdate('fontSize', v)} 
                               placeholder="e.g., 24px, 48px, 128px"
                       />
                   )}
                   <SelectInput label="Font Weight" value={styles.fontWeight || '400'} options={[{label: 'Normal', value: '400'}, {label: 'Bold', value: '700'}, {label: 'Black', value: '900'}, {label: 'Light', value: '300'}]} onChange={(v) => onUpdate('fontWeight', v)} />
                   <div className="mt-2">
                        <label className="text-[10px] font-bold text-white/40 capitalize ml-1 mb-1 block">Alignment</label>
                        <ButtonGroup value={styles.textAlign || 'left'} onChange={(v) => onUpdate('textAlign', v)} options={[{ icon: 'fa-align-left', value: 'left', label: 'Left' }, { icon: 'fa-align-center', value: 'center', label: 'Center' }, { icon: 'fa-align-right', value: 'right', label: 'Right' }, { icon: 'fa-align-justify', value: 'justify', label: 'Justify' }]} />
                   </div>
              </AccordionGroup>
              )}
              {context === 'element' && elementType === 'badge' && (
                  <AccordionGroup title="Badge Styles" defaultOpen={true}>
                      {(() => {
                          // Get theme badge defaults from themeColors parameter or use fallback
                          // themeColors is passed from AppContent which has themeData
                          const themeBadgeBg = themeColors?.badgeBackgroundColor || (typeof themeData !== 'undefined' ? themeData?.badge?.background : undefined) || 'rgba(225,29,72,0.15)';
                          const themeBadgeText = themeColors?.badgeTextColor || (typeof themeData !== 'undefined' ? themeData?.badge?.text : undefined) || '#F8FAFC';
                          
                          // Show theme defaults if element doesn't have explicit colors
                          const badgeBgValue = styles.backgroundColor || themeBadgeBg;
                          const badgeTextValue = styles.color || themeBadgeText;
                          
                          return (
                              <>
                                  {/* Background Color - show theme default if not explicitly set */}
                                  <ColorInput 
                                      label="Background Color" 
                                      value={badgeBgValue} 
                                      onChange={(v) => onUpdate('backgroundColor', v)} 
                                  />
                                  {/* Text Color - show theme default if not explicitly set */}
                                  <ColorInput 
                                      label="Text Color" 
                                      value={badgeTextValue} 
                                      onChange={(v) => onUpdate('color', v)} 
                                  />
                              </>
                          );
                      })()}
                      <SelectInput 
                          label="Size" 
                          value={styles.fontSize || '0.75rem'} 
                          options={[
                              {label: 'XS (10px)', value: '0.625rem'},
                              {label: 'SM (12px)', value: '0.75rem'},
                              {label: 'Base (14px)', value: '0.875rem'},
                              {label: 'MD (16px)', value: '1rem'},
                              {label: 'LG (18px)', value: '1.125rem'}
                          ]}
                          onChange={(v) => onUpdate('fontSize', v)} 
                      />
                      <TextInput label="Padding" value={typeof styles.padding === 'string' ? styles.padding : '4px 12px'} onChange={(v) => onUpdate('padding', v)} placeholder="e.g., 4px 12px" />
                      {(() => {
                          // Parse borderRadius to number for slider (handle px, rem, %)
                          const parseBorderRadius = (val: string | undefined): number => {
                              if (!val) return 50; // Default to 50% (rounded)
                              if (val === '9999px' || val === '50%') return 50;
                              const match = val.match(/([\d.]+)(px|%|rem)/);
                              if (match) {
                                  const num = parseFloat(match[1]);
                                  if (match[2] === '%') return Math.min(100, Math.max(0, num));
                                  if (match[2] === 'px') return Math.min(100, Math.max(0, num));
                                  if (match[2] === 'rem') return Math.min(100, Math.max(0, num * 16));
                              }
                              return 50;
                          };
                          
                          const formatBorderRadius = (val: number): string => {
                              if (val >= 50) return '9999px'; // Fully rounded
                              return `${val}px`;
                          };
                          
                          const currentValue = parseBorderRadius(styles.borderRadius);
                          
                          return (
                              <RangeInput
                                  label="Border Radius"
                                  value={currentValue}
                                  min={0}
                                  max={50}
                                  step={1}
                                  unit="px"
                                  onChange={(v) => onUpdate('borderRadius', formatBorderRadius(v))}
                              />
                          );
                      })()}
                  </AccordionGroup>
              )}
              {context === 'element' && elementType === 'button' && (
                  <AccordionGroup title="Button Styles" defaultOpen={true}>
                      <div className="mb-3">
                          <button
                              type="button"
                              onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Reset button styles to theme defaults
                                  const defaultBgColor = themeColors?.buttonBackgroundColor || '#E11D48';
                                  const defaultTextColor = themeColors?.buttonTextColor || '#FFFFFF';
                                  // If batch update is available, use it to update all styles at once
                                  if (onBatchUpdate) {
                                      onBatchUpdate({
                                          backgroundColor: defaultBgColor,
                                          color: defaultTextColor,
                                          padding: undefined
                                      });
                                  } else {
                                      // Otherwise, update each property individually
                                      onUpdate('backgroundColor', defaultBgColor);
                                      onUpdate('color', defaultTextColor);
                                      onUpdate('padding', undefined);
                                  }
                              }}
                              className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              title="Reset to default theme button styles"
                          >
                              <i className="fa-solid fa-rotate-left"></i>
                              Default Theme Button
                          </button>
                      </div>
                      <ColorInput label="Background Color" value={styles.backgroundColor || ''} onChange={(v) => onUpdate('backgroundColor', v)} />
                      <ColorInput label="Text Color" value={styles.color || ''} onChange={(v) => onUpdate('color', v)} />
                      <TextInput label="Padding" value={typeof styles.padding === 'string' ? styles.padding : ''} onChange={(v) => onUpdate('padding', v)} placeholder="e.g., 12px 24px" />
                      </AccordionGroup>
              )}
              {context === 'section' && (
                  <AccordionGroup title="Background" defaultOpen={true}>
                       <BackgroundControl 
                         value={{ 
                           ...(styles.background || { 
                             type: styles.backgroundImage ? 'image' : (styles.backgroundColor && styles.backgroundColor !== 'transparent' ? 'color' : 'color'), 
                             color: styles.backgroundColor || '#0E1214',
                             image: styles.backgroundImage ? { 
                               url: styles.backgroundImage, 
                               position: 'center', 
                               size: 'cover', 
                               repeat: 'no-repeat', 
                               attachment: 'scroll', 
                               overlay: { 
                                 enabled: !!styles.overlayColor && styles.overlayColor !== 'transparent', 
                                 color: styles.overlayColor || '#000000', 
                                 opacity: parseFloat(styles.overlayOpacityValue || styles.overlayOpacity || '0.5'), 
                                 blendMode: styles.overlayBlendMode || 'normal' 
                               }
                             } : undefined
                           }), 
                           enableGeometry: styles.enableGeometry 
                         }} 
                         onChange={(v) => {
                           const { enableGeometry, ...backgroundObj } = v;
                           
                           // 1. Save new object state
                           onUpdate('background', backgroundObj);
                           if (enableGeometry !== undefined) onUpdate('enableGeometry', enableGeometry);
                           
                           // 2. BACKWARD COMPATIBILITY: Force update legacy properties so the canvas updates instantly
                           if (backgroundObj.type === 'color') {
                             onUpdate('backgroundColor', backgroundObj.color || '#000000');
                             onUpdate('backgroundImage', '');
                           } else if (backgroundObj.type === 'image' && backgroundObj.image) {
                             onUpdate('backgroundImage', backgroundObj.image.url);
                             onUpdate('backgroundColor', 'transparent');
                             if (backgroundObj.image.overlay?.enabled) {
                               onUpdate('overlayColor', backgroundObj.image.overlay.color);
                               onUpdate('overlayOpacityValue', backgroundObj.image.overlay.opacity.toString());
                               onUpdate('overlayBlendMode', backgroundObj.image.overlay.blendMode);
                             } else {
                               onUpdate('overlayColor', 'transparent');
                             }
                           } else if (backgroundObj.type === 'gradient') {
                             onUpdate('backgroundColor', 'transparent');
                             onUpdate('backgroundImage', '');
                           }
                         }}
                         onUpload={() => {
                           if (sectionId) triggerUpload(sectionId, 'backgroundImage');
                         }}
                         uploading={uploading && uploadTarget?.field === 'backgroundImage' && uploadTarget?.sectionId === sectionId}
                         uploadProgress={uploading && uploadTarget?.field === 'backgroundImage' && uploadTarget?.sectionId === sectionId ? uploadProgress : 0}
                       />
                       
                       {/* --- EXPLICIT SECTION OVERLAY CONTROLS --- */}
                       <div className="space-y-4 pt-4 border-t border-white/10">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Background Overlay</h4>
                         <ColorInput
                           label="Overlay Color"
                           value={styles.background?.overlay?.color || styles.background?.image?.overlay?.color || styles.overlayColor || 'transparent'}
                           onChange={(v) => {
                             onUpdate('overlayColor', v);
                             const newBg = { ...(styles.background || {}) };
                             newBg.overlay = { ...(newBg.overlay || {}), color: v, enabled: v !== 'transparent' };
                             if (newBg.type === 'image' && newBg.image) {
                               newBg.image = { ...newBg.image, overlay: { ...(newBg.image.overlay || {}), color: v, enabled: v !== 'transparent' } };
                             }
                             onUpdate('background', newBg);
                           }}
                         />
                         <RangeInput
                           label="Overlay Opacity"
                           value={styles.background?.overlay?.opacity !== undefined ? styles.background.overlay.opacity : (styles.background?.image?.overlay?.opacity !== undefined ? styles.background.image.overlay.opacity : parseFloat(styles.overlayOpacityValue || '0.5'))}
                           min={0} max={1} step={0.05}
                           onChange={(v) => {
                             onUpdate('overlayOpacityValue', v.toString());
                             const newBg = { ...(styles.background || {}) };
                             newBg.overlay = { ...(newBg.overlay || {}), opacity: v };
                             if (newBg.type === 'image' && newBg.image) {
                               newBg.image = { ...newBg.image, overlay: { ...(newBg.image.overlay || {}), opacity: v } };
                             }
                             onUpdate('background', newBg);
                           }}
                         />
                         <SelectInput
                           label="Blend Mode"
                           value={styles.background?.overlay?.blendMode || styles.background?.image?.overlay?.blendMode || styles.overlayBlendMode || 'normal'}
                           options={[
                             { label: 'Normal', value: 'normal' },
                             { label: 'Multiply', value: 'multiply' },
                             { label: 'Screen', value: 'screen' },
                             { label: 'Overlay', value: 'overlay' },
                             { label: 'Darken', value: 'darken' },
                             { label: 'Lighten', value: 'lighten' },
                             { label: 'Color Dodge', value: 'color-dodge' },
                             { label: 'Color Burn', value: 'color-burn' },
                             { label: 'Hard Light', value: 'hard-light' },
                             { label: 'Soft Light', value: 'soft-light' }
                           ]}
                           onChange={(v) => {
                             onUpdate('overlayBlendMode', v);
                             const newBg = { ...(styles.background || {}) };
                             newBg.overlay = { ...(newBg.overlay || {}), blendMode: v };
                             if (newBg.type === 'image' && newBg.image) {
                               newBg.image = { ...newBg.image, overlay: { ...(newBg.image.overlay || {}), blendMode: v } };
                             }
                             onUpdate('background', newBg);
                           }}
                         />
                       </div>
                       
                       {/* --- EXPLICIT IMAGE SETTINGS --- */}
                       {(styles.background?.type === 'image' || styles.backgroundImage) && (
                         <div className="space-y-4 pt-4 border-t border-white/10">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Settings</h4>
                           <SelectInput
                             label="Background Size"
                             value={styles.background?.image?.size || styles.backgroundSize || 'cover'}
                             options={[
                               { label: 'Cover', value: 'cover' },
                               { label: 'Contain', value: 'contain' },
                               { label: 'Auto', value: 'auto' },
                               { label: '100% 100%', value: '100% 100%' }
                             ]}
                             onChange={(v) => {
                               onUpdate('backgroundSize', v);
                               if (styles.background?.image) onUpdate('background', { ...styles.background, image: { ...styles.background.image, size: v } });
                             }}
                           />
                           <SelectInput
                             label="Background Position"
                             value={styles.background?.image?.position || styles.backgroundPosition || 'center'}
                             options={[
                               { label: 'Center', value: 'center' },
                               { label: 'Top', value: 'top' },
                               { label: 'Bottom', value: 'bottom' },
                               { label: 'Left', value: 'left' },
                               { label: 'Right', value: 'right' },
                               { label: 'Top Left', value: 'top left' },
                               { label: 'Top Right', value: 'top right' },
                               { label: 'Bottom Left', value: 'bottom left' },
                               { label: 'Bottom Right', value: 'bottom right' }
                             ]}
                             onChange={(v) => {
                               onUpdate('backgroundPosition', v);
                               if (styles.background?.image) onUpdate('background', { ...styles.background, image: { ...styles.background.image, position: v } });
                             }}
                           />
                         </div>
                       )}
              </AccordionGroup>
              )}
              {context === 'element' && (
                  <AccordionGroup title="Background & Overlay" defaultOpen={false}>
                      <ColorInput label="Background Color" value={styles.backgroundColor || ''} onChange={(v) => onUpdate('backgroundColor', v)} />
                      {elementType === 'image' && (
                          <>
                              <RangeInput 
                                  label="Opacity" 
                                  value={styles.opacity !== undefined ? Math.round(parseFloat(styles.opacity) * 100) : 100} 
                                  min={0} 
                                  max={100} 
                                  step={1} 
                                  unit="%" 
                                  onChange={(v) => onUpdate('opacity', (v / 100).toString())} 
                              />
                              <ColorInput 
                                  label="Overlay Color" 
                                  value={(styles as any).overlayColor || ''} 
                                  onChange={(v) => onUpdate('overlayColor', v)} 
                              />
                              <RangeInput 
                                  label="Overlay Opacity" 
                                  value={(styles as any).overlayOpacity !== undefined ? Math.round(parseFloat((styles as any).overlayOpacity) * 100) : 0} 
                                  min={0} 
                                  max={100} 
                                  step={1} 
                                  unit="%" 
                                  onChange={(v) => onUpdate('overlayOpacity', (v / 100).toString())} 
                              />
                          </>
                      )}
                      {elementType !== 'image' && (
                          <RangeInput 
                              label="Opacity" 
                              value={styles.opacity !== undefined ? Math.round(parseFloat(styles.opacity) * 100) : 100} 
                              min={0} 
                              max={100} 
                              step={1} 
                              unit="%" 
                              onChange={(v) => onUpdate('opacity', (v / 100).toString())} 
                          />
                      )}
                  </AccordionGroup>
              )}
              {context === 'element' && elementType === 'image' && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2">Shape & Structure</h4>
                  <SelectInput
                    label="Image Shape (Aspect Ratio)"
                    value={styles.aspectRatio || 'auto'}
                    options={[
                      { label: 'Original (Auto)', value: 'auto' },
                      { label: 'Square (1:1)', value: '1 / 1' },
                      { label: 'Landscape (16:9)', value: '16 / 9' },
                      { label: 'Portrait (3:4)', value: '3 / 4' }
                    ]}
                    onChange={(v: string) => onUpdate('aspectRatio', v)}
                  />
                  <RangeInput
                    label="Corner Roundness (%)"
                    value={parseFloat(styles.borderRadius) || 0}
                    min={0} max={50} step={1}
                    onChange={(v: number) => onUpdate('borderRadius', `${v}%`)}
                  />
                  <SelectInput
                    label="Image Fit"
                    value={styles.objectFit || 'cover'}
                    options={['cover', 'contain', 'fill']}
                    onChange={(v: string) => onUpdate('objectFit', v)}
                  />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2 pt-2">Borders & Effects</h4>
                  <RangeInput
                    label="Border Width (px)"
                    value={parseFloat(styles.borderWidth) || 0}
                    min={0} max={20} step={1}
                    onChange={(v: number) => {
                      onUpdate('borderWidth', `${v}px`);
                      if (v > 0 && (!styles.borderStyle || styles.borderStyle === 'none')) onUpdate('borderStyle', 'solid');
                      if (v === 0) onUpdate('borderStyle', 'none');
                    }}
                  />
                  {(parseFloat(styles.borderWidth) > 0) && (
                    <ColorInput
                      label="Border Color"
                      value={styles.borderColor || '#ffffff'}
                      onChange={(v: string) => onUpdate('borderColor', v)}
                    />
                  )}
                  <SelectInput
                    label="Box Shadow"
                    value={styles.boxShadow || 'none'}
                    options={[
                      { label: 'None', value: 'none' },
                      { label: 'Soft Drop', value: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' },
                      { label: 'Heavy Float', value: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
                      { label: 'Glow Effect', value: `0 0 30px ${themeColors?.accentColor || 'rgba(255,255,255,0.3)'}` }
                    ]}
                    onChange={(v: string) => onUpdate('boxShadow', v)}
                  />
                  <SelectInput
                    label="Color Filter"
                    value={styles.filter || 'none'}
                    options={[
                      { label: 'Normal', value: 'none' },
                      { label: 'Grayscale', value: 'grayscale(100%)' },
                      { label: 'Sepia Vintage', value: 'sepia(100%)' },
                      { label: 'High Contrast', value: 'contrast(150%) saturate(150%)' },
                      { label: 'Blurred Soft', value: 'blur(4px)' }
                    ]}
                    onChange={(v: string) => onUpdate('filter', v)}
                  />
                  
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2 pt-2">Image Tint Overlay</h4>
                  <ColorInput
                    label="Overlay Color"
                    value={styles.overlayColor || 'transparent'}
                    onChange={(v: string) => onUpdate('overlayColor', v)}
                  />
                  <RangeInput
                    label="Overlay Opacity"
                    value={parseFloat(styles.overlayOpacity || '0')}
                    min={0} max={1} step={0.05}
                    onChange={(v: number) => onUpdate('overlayOpacity', v.toString())}
                  />
                </div>
              )}
          </div>
      );
  };

  if (loadingPageData) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading page data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white selection:bg-blue-500/30 overflow-hidden flex flex-col">
        <header className="h-14 border-b border-white/10 bg-[#050505] flex items-center justify-between px-4 shrink-0 z-50">
            <div className="flex items-center gap-4">
                <span className="font-bold text-lg tracking-tighter">Genie<span className="text-blue-500">Build</span></span>
                <div className="h-4 w-px bg-white/10 mx-2"></div>
                <button onClick={() => { setSelectedSectionId(null); setSelectedElementId(null); setGlobalTab('themes'); setIsSidebarOpen(true); }} className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${!selectedSectionId && isSidebarOpen ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Global Design System"><i className="fa-solid fa-palette"></i>Theme</button>
                <button onClick={() => addNewSection('allelementsTest')} className="px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5" title="Add All Elements Test Section"><i className="fa-solid fa-vial"></i>Test All Elements</button>
            </div>
             <div className="flex items-center gap-2">
                 {/* Device View Buttons */}
                 <div className="flex bg-[#151515] rounded p-1 border border-[#333] mr-2">
                     <button 
                         onClick={() => setViewMode('desktop')} 
                         className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${viewMode === 'desktop' ? 'bg-[#333] text-white' : 'text-slate-500 hover:text-white'}`}
                         title="Desktop (1440px)"
                     >
                         <i className="fa-solid fa-desktop"></i>
                         <span className="text-[10px]">1440px</span>
                     </button>
                     <button 
                         onClick={() => setViewMode('tablet')} 
                         className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${viewMode === 'tablet' ? 'bg-[#333] text-white' : 'text-slate-500 hover:text-white'}`}
                         title="Tablet (1024px)"
                     >
                         <i className="fa-solid fa-tablet-screen-button"></i>
                         <span className="text-[10px]">1024px</span>
                     </button>
                     <button 
                         onClick={() => setViewMode('mobile')} 
                         className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${viewMode === 'mobile' ? 'bg-[#333] text-white' : 'text-slate-500 hover:text-white'}`}
                         title="Mobile (375px)"
                     >
                         <i className="fa-solid fa-mobile-screen"></i>
                         <span className="text-[10px]">375px</span>
                     </button>
                 </div>
                 
                 {/* Zoom Slider */}
                 <div className="flex items-center gap-3 bg-[#151515] rounded px-3 py-1.5 border border-[#333] mr-2">
                     <i className="fa-solid fa-magnifying-glass text-slate-400 text-xs"></i>
                     <input 
                         type="range" 
                         min="25" 
                         max="200" 
                         step="5"
                         value={zoomLevel} 
                         onChange={(e) => setZoomLevel(Number(e.target.value))}
                         className="zoom-slider w-28 h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer"
                         style={{
                             background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(zoomLevel - 25) / 175 * 100}%, #333 ${(zoomLevel - 25) / 175 * 100}%, #333 100%)`
                         }}
                         title={`Zoom: ${zoomLevel}%`}
                     />
                     <span className="text-xs text-white font-medium min-w-[3.5rem] text-right">{zoomLevel}%</span>
                     <button 
                         onClick={() => setZoomLevel(100)} 
                         className="px-2 py-1 rounded text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                         title="Reset to 100%"
                     >
                         <i className="fa-solid fa-rotate-left"></i>
                     </button>
                 </div>
                 <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${isPreviewMode ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/20 hover:bg-white/10'}`}>{isPreviewMode ? <><i className="fa-solid fa-eye-slash mr-2"></i>Edit</> : <><i className="fa-solid fa-eye mr-2"></i>Preview</>}</button>
                 <button 
                   onClick={savePageData} 
                   disabled={savingPageData}
                   className={`px-3 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-2 ${
                     savingPageData 
                       ? 'bg-gray-600 border-gray-600 text-white cursor-not-allowed' 
                       : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                   }`}
                 >
                   {savingPageData ? (
                     <>
                       <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                       Saving...
                     </>
                   ) : (
                     <>
                       <i className="fa-solid fa-save"></i>
                       Save
                     </>
                   )}
                 </button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative h-full">
            <aside className={`w-80 bg-[#080808] border-r border-white/10 flex flex-col shrink-0 transition-all duration-300 absolute z-40 h-full md:relative ${isSidebarOpen && !isPreviewMode ? 'translate-x-0' : '-translate-x-full md:hidden'} ${!isPreviewMode ? 'md:translate-x-0' : 'md:-translate-x-full md:w-0 md:border-none'}`}>
                {!selectedSectionId ? (
                     <div className="flex flex-col h-full">
                         <div className="p-4 border-b border-white/10">
                            <h2 className="font-bold text-xs uppercase tracking-widest text-white/50 mb-3">Global Theme</h2>
                            <div className="flex bg-[#151515] p-1 rounded">
                                <button onClick={() => setGlobalTab('themes')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${globalTab === 'themes' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}>Presets</button>
                                <button onClick={() => setGlobalTab('colors')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${globalTab === 'colors' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}>Colors</button>
                                <button onClick={() => setGlobalTab('typography')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${globalTab === 'typography' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}>Typography</button>
                            </div>
                         </div>
                         <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-20">
                             {globalTab === 'themes' && (
                                 <div className="space-y-4">
                                     {PRESET_THEMES.map((theme, idx) => (
                                         <button key={idx} onClick={() => applyTheme(theme, idx.toString())} className={`group flex flex-col gap-2 p-3 rounded-xl border transition-all ${selectedPresetId === idx.toString() ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30 bg-[#111] hover:bg-[#1a1a1a]'}`}>
                                             <div className="flex items-center justify-between w-full">
                                                 <span className="font-bold text-xs uppercase tracking-wider text-white/80">{theme.name}</span>
                                                 <div className="flex gap-1">
                                                     <div className="w-4 h-4 rounded-full border border-white/10" style={{backgroundColor: theme.elements.surface}}></div>
                                                     <div className="w-4 h-4 rounded-full border border-white/10" style={{backgroundColor: theme.elements.primaryButton.bg}}></div>
                                                 </div>
                                             </div>
                                         </button>
                                     ))}
                                 </div>
                             )}
                             {globalTab === 'colors' && (
                                <div className="space-y-4">
                                    <ColorInput label="Background" value={siteData.globalStyles.colors.backgroundColor} onChange={(v) => updateGlobalColor('backgroundColor', v)} />
                                    <ColorInput label="Text" value={siteData.globalStyles.colors.textColor} onChange={(v) => updateGlobalColor('textColor', v)} />
                                    <ColorInput label="Title" value={siteData.globalStyles.colors.titleColor} onChange={(v) => updateGlobalColor('titleColor', v)} />
                                    <ColorInput label="Accent" value={siteData.globalStyles.colors.accentColor} onChange={(v) => updateGlobalColor('accentColor', v)} />
                                    <ColorInput label="Button Bg" value={siteData.globalStyles.colors.buttonBackgroundColor} onChange={(v) => updateGlobalColor('buttonBackgroundColor', v)} />
                                    <ColorInput label="Button Text" value={siteData.globalStyles.colors.buttonTextColor} onChange={(v) => updateGlobalColor('buttonTextColor', v)} />
                                </div>
                             )}
                             {globalTab === 'typography' && (
                                <div className="space-y-6">
                                    <AccordionGroup title="Default Font" defaultOpen={true}>
                                        <SelectInput 
                                            label="Font Family" 
                                            value={defaultTypography.fontFamily} 
                                            options={PRESET_FONTS.map(f => ({ label: f.name, value: f.value }))} 
                                            onChange={(v: string) => setDefaultTypography(prev => ({ ...prev, fontFamily: v }))} 
                                        />
                                    </AccordionGroup>
                                    <AccordionGroup title="Heading Sizes" defaultOpen={true}>
                                        <div className="space-y-3">
                                            <FontSizeInput label="H1 (Default: 3rem / 48px)" value={defaultSizes.h1} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h1: v }))} placeholder="3rem" />
                                            <FontSizeInput label="H2 (Default: 2.5rem / 40px)" value={defaultSizes.h2} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h2: v }))} placeholder="2.5rem" />
                                            <FontSizeInput label="H3 (Default: 2rem / 32px)" value={defaultSizes.h3} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h3: v }))} placeholder="2rem" />
                                            <FontSizeInput label="H4 (Default: 1.5rem / 24px)" value={defaultSizes.h4} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h4: v }))} placeholder="1.5rem" />
                                            <FontSizeInput label="H5 (Default: 1.25rem / 20px)" value={defaultSizes.h5} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h5: v }))} placeholder="1.25rem" />
                                            <FontSizeInput label="H6 (Default: 1rem / 16px)" value={defaultSizes.h6} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h6: v }))} placeholder="1rem" />
                                        </div>
                                    </AccordionGroup>
                                    <AccordionGroup title="Text Sizes" defaultOpen={true}>
                                        <div className="space-y-3">
                                            <FontSizeInput label="Base Text (Default: 1rem / 16px)" value={defaultSizes.text} onChange={(v) => setDefaultSizes(prev => ({ ...prev, text: v }))} placeholder="1rem" />
                                            <FontSizeInput label="Small Text (Default: 0.875rem / 14px)" value={defaultSizes.textSmall} onChange={(v) => setDefaultSizes(prev => ({ ...prev, textSmall: v }))} placeholder="0.875rem" />
                                            <FontSizeInput label="Large Text (Default: 1.125rem / 18px)" value={defaultSizes.textLarge} onChange={(v) => setDefaultSizes(prev => ({ ...prev, textLarge: v }))} placeholder="1.125rem" />
                                            <FontSizeInput label="XL Text (Default: 1.25rem / 20px)" value={defaultSizes.textXl} onChange={(v) => setDefaultSizes(prev => ({ ...prev, textXl: v }))} placeholder="1.25rem" />
                                        </div>
                                    </AccordionGroup>
                                </div>
                             )}
                         </div>
                         <div className="p-4 border-t border-white/10 bg-[#080808]">
                             <button 
                                 onClick={saveThemeSettings}
                                 disabled={savingTheme}
                                 className={`w-full px-4 py-2 rounded text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                                     savingTheme 
                                       ? 'bg-gray-600 border-gray-600 text-white cursor-not-allowed' 
                                       : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                                 }`}
                             >
                                 {savingTheme ? (
                                     <>
                                         <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                         Saving...
                                     </>
                                 ) : (
                                     <>
                                         <i className="fa-solid fa-save"></i>
                                         Save Theme Settings
                                     </>
                                 )}
                             </button>
                         </div>
                     </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-white/10">
                             {(() => {
                                const variant = selectedSection?.styles?.variant || (selectedSection?.type ? getDefaultVariant(selectedSection.type) : null);
                                const formattedVariant = formatVariantName(variant || undefined, selectedSection?.type);
                                const availableVariants = selectedSection?.type ? getVariantsForSection(selectedSection.type) : [];
                                const hasMultipleVariants = availableVariants.length > 1;
                                
                                return (
                                    <>
                                        <div className="flex items-center gap-2 mb-3">
                                            <button onClick={() => { if(selectedElementId) setSelectedElementId(null); else setSelectedSectionId(null); }} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-slate-400">
                                                <i className="fa-solid fa-arrow-left text-[10px]"></i>
                                            </button>
                                            <div className="flex items-center text-xs font-bold capitalize truncate flex-1">
                                                <span className={selectedElementId ? 'text-slate-500' : 'text-white'}>{selectedSection?.type}</span>
                                                {formattedVariant && !selectedElementId && (
                                                    <>
                                                        <i className="fa-solid fa-chevron-right text-[8px] mx-1.5 text-slate-600"></i>
                                                        <span className="text-slate-400 text-[10px] font-normal">{formattedVariant}</span>
                                                    </>
                                                )}
                                                {selectedElementId && (
                                                    <>
                                                        <i className="fa-solid fa-chevron-right text-[8px] mx-1.5 text-slate-600"></i>
                                                        <span className="text-white">{selectedElement?.type}</span>
                                                    </>
                                                )}
                                            </div>
                                            {hasMultipleVariants && !selectedElementId && (
                                                <button
                                                    onClick={handleRefreshVariant}
                                                    className="px-2 py-1 text-[10px] font-medium rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-600/30 hover:border-blue-600/50 transition-all flex items-center gap-1.5"
                                                    title="Refresh Variant - Change to next available variant"
                                                >
                                                    <i className="fa-solid fa-rotate text-[9px]"></i>
                                                    <span>Refresh</span>
                                                </button>
                                            )}
                                        </div>
                            <div className="flex gap-1 bg-[#151515] rounded p-1">
                                <button onClick={() => setEditTab('content')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${editTab === 'content' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}>CONTENT</button><button onClick={() => setEditTab('design')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${editTab === 'design' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}>DESIGN</button>
                            </div>
                                    </>
                                );
                             })()}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-20">
                             {selectedElementId && selectedElement && selectedSection ? (
                                 editTab === 'design' ? (renderStyleEditor(
                                     // For buttons, merge element.style with section.styles.buttonFontWeight, etc. for proper dropdown display
                                     // For badges, merge with theme badge defaults for proper color display
                                     selectedElement.type === 'button' ? {
                                         ...resolvedElementStyle,
                                         // Fallback to section.styles for button-specific properties if not in element.style
                                         fontWeight: resolvedElementStyle?.fontWeight || (resolvedSectionStyles as any)?.buttonFontWeight || (resolvedSectionStyles as any)?.fontWeight || 'bold',
                                         fontSize: resolvedElementStyle?.fontSize || (resolvedSectionStyles as any)?.buttonSize || (resolvedSectionStyles as any)?.buttonFontSize || (resolvedSectionStyles as any)?.fontSize || '1rem',
                                         textAlign: resolvedElementStyle?.textAlign || (resolvedSectionStyles as any)?.buttonAlign || resolvedSectionStyles?.textAlign || 'center',
                                         fontFamily: resolvedElementStyle?.fontFamily || (resolvedSectionStyles as any)?.buttonFontFamily || (resolvedSectionStyles as any)?.fontFamily || undefined,
                                     } : selectedElement.type === 'badge' ? {
                                         ...resolvedElementStyle,
                                         // Pre-fill badge colors with theme defaults if not explicitly set
                                         // CRITICAL: Only use element colors if explicitly set (not empty/undefined)
                                         backgroundColor: (resolvedElementStyle?.backgroundColor && resolvedElementStyle.backgroundColor !== '' && resolvedElementStyle.backgroundColor !== 'transparent')
                                             ? resolvedElementStyle.backgroundColor
                                             : (themeData?.badge?.background || 'rgba(225,29,72,0.15)'),
                                         color: (resolvedElementStyle?.color && resolvedElementStyle.color !== '' && resolvedElementStyle.color !== 'transparent')
                                             ? resolvedElementStyle.color
                                             : (themeData?.badge?.text || '#F8FAFC'),
                                         fontSize: resolvedElementStyle?.fontSize || '0.75rem',
                                         padding: resolvedElementStyle?.padding || '4px 12px',
                                         borderRadius: resolvedElementStyle?.borderRadius || '9999px',
                                     } : resolvedElementStyle, 
                                     (k,v) => updateElement(selectedSection.id, selectedElement.id, { style: { ...selectedElement.style, [k]: v } }), 
                                     'element', 
                                     selectedElement.type, 
                                     undefined, 
                                     siteData.globalStyles?.colors,
                                     (updates) => updateElement(selectedSection.id, selectedElement.id, { style: { ...selectedElement.style, ...updates } })
                                 )) : (
                                     <div className="space-y-4">
                                         {selectedElement.type === 'image' ? (
                                             <div className="space-y-4">
                                                 <ImageControl 
                                                     label="Image URL" 
                                                     value={selectedElement.content.imageUrl || ''} 
                                                     onChange={(v) => updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, imageUrl: v} })} 
                                                     onUpload={() => triggerUpload(selectedSection.id, 'imageUrl', selectedElement.id)}
                                                 />
                                                 <TextInput 
                                                     label="Alt Text" 
                                                     value={selectedElement.content.imageAlt || selectedElement.content.alt || ''} 
                                                     onChange={(v) => updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, imageAlt: v, alt: v} })} 
                                                     placeholder="Enter image alt text"
                                                 />
                                             </div>
                                         ) : selectedElement.type === 'image-box' ? (
                                             <div className="space-y-4">
                                                 <ImageControl 
                                                     label="Image URL" 
                                                     value={selectedElement.content.imageUrl || selectedElement.content.src || ''} 
                                                     onChange={(v) => updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, imageUrl: v, src: v} })} 
                                                     onUpload={() => triggerUpload(selectedSection.id, 'imageUrl', selectedElement.id)}
                                                 />
                                                 <TextInput 
                                                     label="Alt Text" 
                                                     value={selectedElement.content.imageAlt || selectedElement.content.alt || ''} 
                                                     onChange={(v) => updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, imageAlt: v, alt: v} })} 
                                                     placeholder="Enter image alt text"
                                                 />
                                                 <TextInput 
                                                     label="Title" 
                                                     value={selectedElement.content.title || selectedElement.content.text || ''} 
                                                     onChange={(v) => updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, title: v, text: v} })} 
                                                     placeholder="Enter image box title"
                                                 />
                                                 <TextAreaInput 
                                                     label="Subtitle / Description" 
                                                     value={selectedElement.content.description || selectedElement.content.subText || ''} 
                                                     onChange={(v) => updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, description: v, subText: v} })} 
                                                 />
                                             </div>
                                         ) : selectedElement.type === 'video' ? (
                                             <div className="space-y-4">
                                                 <VideoControl 
                                                     label="Video URL" 
                                                     value={selectedElement.content.src || ''} 
                                                     onChange={(v) => {
                                                         // If it's a YouTube URL, convert to embed format
                                                         const isYouTube = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(v);
                                                         let finalUrl = v;
                                                         if (isYouTube && !v.includes('youtube.com/embed/')) {
                                                             const match = v.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                                                             if (match && match[1]) {
                                                                 finalUrl = `https://www.youtube.com/embed/${match[1]}`;
                                                             }
                                                         }
                                                         updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, src: finalUrl} });
                                                     }} 
                                                     onUpload={() => triggerUpload(selectedSection.id, 'videoUrl', selectedElement.id)}
                                                 />
                                             </div>
                                         ) : selectedElement.type === 'icon' ? (
                                             <div className="space-y-4">
                                                 <IconPicker 
                                                     label="Icon" 
                                                     value={selectedElement.content.icon || 'fa-star'} 
                                                     onChange={(v) => {
                                                         // Ensure icon is in correct format (fa-icon-name)
                                                         const iconValue = v.startsWith('fa-') ? v : `fa-${v}`;
                                                         updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, icon: iconValue} });
                                                     }} 
                                                 />
                                                 <TextInput 
                                                     label="Icon Size (px)" 
                                                     value={selectedElement.style?.fontSize || '128px'} 
                                                     onChange={(v) => {
                                                         // Preserve existing style properties and update fontSize
                                                         const currentStyle = selectedElement.style || {};
                                                         updateElement(selectedSection.id, selectedElement.id, { 
                                                             style: {
                                                                 ...currentStyle,
                                                                 fontSize: v
                                                             } 
                                                         });
                                                     }} 
                                                     placeholder="e.g., 128px, 64px, 200px"
                                                 />
                                             </div>
                                         ) : selectedElement.type === 'badge' ? (
                                             <div className="space-y-4">
                                                 <TextInput 
                                                     label="Badge Text" 
                                                     value={selectedElement.content.text || ''} 
                                                     onChange={(v) => updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, text: v} })} 
                                                     placeholder="Enter badge text"
                                                 />
                                             </div>
                                         ) : selectedElement.type === 'star-rating' ? (
                                             <div className="space-y-4">
                                                 <RangeInput 
                                                     label="Rating Value (e.g., 4.5)" 
                                                     value={selectedElement.content.rating !== undefined ? parseFloat(String(selectedElement.content.rating)) : 5} 
                                                     min={0} 
                                                     max={selectedElement.content.maxRating !== undefined ? parseInt(String(selectedElement.content.maxRating)) : 5} 
                                                     step={0.5} 
                                                     onChange={(v) => updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, rating: v} })} 
                                                 />
                                                 <RangeInput 
                                                     label="Total Stars (Max)" 
                                                     value={selectedElement.content.maxRating !== undefined ? parseInt(String(selectedElement.content.maxRating)) : 5} 
                                                     min={1} 
                                                     max={10} 
                                                     step={1} 
                                                     onChange={(v) => {
                                                         // If max rating drops below current rating, adjust rating automatically
                                                         const currentRating = selectedElement.content.rating !== undefined ? parseFloat(String(selectedElement.content.rating)) : 5;
                                                         const newRating = currentRating > v ? v : currentRating;
                                                         updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, maxRating: v, rating: newRating} });
                                                     }} 
                                                 />
                                             </div>
                                         ) : selectedElement.type === 'accordion' ? (
                                             (() => {
                                                 const items = selectedElement.content.items || [];
                                                 return (
                                                     <div className="space-y-4">
                                                         <div className="flex items-center justify-between mb-2">
                                                             <label className="text-[10px] font-bold text-white/40 uppercase">Accordion Items</label>
                                                             <button 
                                                                 onClick={() => {
                                                                     const newItems = [...items, { title: 'New Question', content: 'New answer goes here.' }];
                                                                     updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, items: newItems} });
                                                                 }}
                                                                 className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
                                                             >
                                                                 <i className="fa-solid fa-plus mr-1"></i>Add Item
                                                             </button>
                                                         </div>
                                                         {items.map((item: any, idx: number) => (
                                                             <div key={idx} className="p-3 bg-[#151515] border border-[#333] rounded space-y-3 relative group">
                                                                 <button 
                                                                     onClick={() => {
                                                                         const newItems = items.filter((_: any, i: number) => i !== idx);
                                                                         updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, items: newItems} });
                                                                     }}
                                                                     className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
                                                                 >
                                                                     <i className="fa-solid fa-xmark"></i>
                                                                 </button>
                                                                 <TextInput 
                                                                     label={`Question ${idx + 1}`} 
                                                                     value={item.title || item.question || ''} 
                                                                     onChange={(v) => {
                                                                         const newItems = [...items];
                                                                         // Save as standard 'title' and clear 'question' to unify data
                                                                         newItems[idx] = { ...newItems[idx], title: v, question: undefined };
                                                                         updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, items: newItems} });
                                                                     }} 
                                                                 />
                                                                 <TextAreaInput 
                                                                     label="Answer" 
                                                                     value={item.content || item.answer || ''} 
                                                                     onChange={(v) => {
                                                                         const newItems = [...items];
                                                                         // Save as standard 'content' and clear 'answer' to unify data
                                                                         newItems[idx] = { ...newItems[idx], content: v, answer: undefined };
                                                                         updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, items: newItems} });
                                                                     }} 
                                                                 />
                                                             </div>
                                                         ))}
                                                     </div>
                                                 );
                                             })()
                                         ) : (
                                             <>
                                                 <TextAreaInput 
                                                     label={selectedElement.type === 'heading' ? 'Heading' : selectedElement.type === 'button' ? 'Button Text' : 'Text'} 
                                                     value={selectedElement.content.text || ''} 
                                                     onChange={(v) => updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, text: v} })} 
                                                 />
                                                 {selectedElement.type === 'heading' && (
                                                     <SelectInput 
                                                         key={`heading-tag-${selectedElement.id}-${selectedElement.content.htmlTag || 'h2'}`}
                                                         label="Heading Level" 
                                                         value={
                                                             // For Hero title virtual elements, read from styles.titleHeadingTag
                                                             selectedElement.id.startsWith(`${selectedSection.id}-hero-title`) 
                                                                 ? (selectedSection.styles.titleHeadingTag || 'h1')
                                                                 : (selectedElement.content.htmlTag || 'h2')
                                                         } 
                                                         options={[
                                                             {label: 'H1 (Largest)', value: 'h1'},
                                                             {label: 'H2', value: 'h2'},
                                                             {label: 'H3', value: 'h3'},
                                                             {label: 'H4', value: 'h4'},
                                                             {label: 'H5', value: 'h5'},
                                                             {label: 'H6 (Smallest)', value: 'h6'}
                                                         ]} 
                                                         onChange={(v) => {
                                                             // For Hero title virtual elements, update titleHeadingTag in styles
                                                             if (selectedElement.id.startsWith(`${selectedSection.id}-hero-title`)) {
                                                                 updateSectionStyle(selectedSection.id, 'titleHeadingTag', v);
                                                             } else {
                                                                 // For regular heading elements
                                                                 updateElement(selectedSection.id, selectedElement.id, { content: {...selectedElement.content, htmlTag: v as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'} });
                                                             }
                                                         }} 
                                                         />
                                                 )}
                                                 {selectedElement.type === 'text' && (() => {
                                                     // For Hero subtitle virtual elements, we need to compute textSize from subtitleSize
                                                     // For regular text elements, read from content.textSize
                                                     let currentTextSize: 'base' | 'small' | 'large' | 'xl' = 'base';
                                                     
                                                     if (selectedElement.id.includes('-hero-subtitle')) {
                                                         // Hero subtitle virtual element - read textSize directly from content.subtitleTextSize
                                                         const currentSection = siteData.sections.find(s => s.id === selectedSection.id);
                                                         if (currentSection && currentSection.content.subtitleTextSize) {
                                                             // Direct storage - most reliable
                                                             currentTextSize = currentSection.content.subtitleTextSize;
                                                         } else {
                                                             // Fallback to selectedElement (from useMemo)
                                                             currentTextSize = selectedElement.content?.textSize || 'base';
                                                         }
                                                     } else {
                                                         // Regular text element - read from content.textSize
                                                         const currentSection = siteData.sections.find(s => s.id === selectedSection.id);
                                                         const currentElement = currentSection?.elements?.find(e => e.id === selectedElement.id);
                                                         currentTextSize = (currentElement?.content?.textSize || selectedElement.content?.textSize || 'base') as 'base' | 'small' | 'large' | 'xl';
                                                     }
                                                     
                                                     return (
                                                         <SelectInput 
                                                             key={`text-size-${selectedElement.id}-${currentTextSize}`}
                                                             label="Text Size" 
                                                             value={currentTextSize}
                                                             options={[
                                                                 {label: 'Base', value: 'base'},
                                                                 {label: 'Small', value: 'small'},
                                                                 {label: 'Large', value: 'large'},
                                                                 {label: 'XL', value: 'xl'}
                                                             ]} 
                                                             onChange={(v) => {
                                                                 const newTextSize = v as 'base' | 'small' | 'large' | 'xl';
                                                                 updateElement(selectedSection.id, selectedElement.id, { 
                                                                     content: {...selectedElement.content, textSize: newTextSize} 
                                                                 });
                                                             }} 
                                                         />
                                                     );
                                                 })()}
                                                 {selectedElement.type === 'button' && (
                                                     <TextInput 
                                                         label="Button Link (URL)" 
                                                         value={
                                                             // For Hero button virtual elements, read from section content
                                                             selectedElement.id.includes('-hero-button')
                                                                 ? (selectedSection.content.ctaHref || '')
                                                                 : (selectedElement.content.link || '')
                                                         }
                                                         onChange={(v) => {
                                                             // For Hero button virtual elements, update ctaHref in section content
                                                             if (selectedElement.id.includes('-hero-button')) {
                                                                 updateElement(selectedSection.id, selectedElement.id, {
                                                                     content: {
                                                                         ...selectedElement.content,
                                                                         link: v
                                                                     }
                                                                 });
                                                             } else {
                                                                 // For regular button elements
                                                                 updateElement(selectedSection.id, selectedElement.id, { 
                                                                     content: {...selectedElement.content, link: v} 
                                                                 });
                                                             }
                                                         }}
                                                         placeholder="https://example.com or /page"
                                                     />
                                                 )}
                                             </>
                                         )}
                                         <button
                                           onClick={resetElementToDefault}
                                           className="w-full mt-4 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/40 text-orange-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                           title="Reset to original AI-generated content"
                                         >
                                           <i className="fa-solid fa-rotate-left"></i>
                                           Reset to Default
                                         </button>
                                     </div>
                                 )
                             ) : (
                                 selectedSection && (
                                     editTab === 'design' ? (renderStyleEditor(resolvedSectionStyles, (k,v) => updateSectionStyle(selectedSection.id, k, v), 'section', undefined, selectedSection.id)) : (
                                         <div className="space-y-6">
                                             {/* Variant Info and Refresh Button */}
                                             {(() => {
                                                const variant = selectedSection.styles?.variant || getDefaultVariant(selectedSection.type);
                                                const formattedVariant = formatVariantName(variant || undefined, selectedSection.type);
                                                const availableVariants = getVariantsForSection(selectedSection.type);
                                                const hasMultipleVariants = availableVariants.length > 1;
                                                
                                                return (
                                                    <div className="space-y-4 pb-4 border-b border-white/10">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-white/40 capitalize mb-1 block">Current Variant</label>
                                                                <div className="text-sm font-bold text-white">
                                                                    {formattedVariant || variant || 'Default'}
                                                                </div>
                                                            </div>
                                                            {hasMultipleVariants && (
                                                                <button
                                                                    onClick={handleRefreshVariant}
                                                                    className="px-3 py-1.5 text-[10px] font-medium rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-600/30 hover:border-blue-600/50 transition-all flex items-center gap-1.5"
                                                                    title="Refresh Variant - Change to next available variant"
                                                                >
                                                                    <i className="fa-solid fa-rotate text-[9px]"></i>
                                                                    <span>Refresh</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                             })()}
                                             
                                             {/* Advanced Actions */}
                                             <AccordionGroup title="Advanced Actions" defaultOpen={false}>
                                                 <div className="space-y-2">
                                                     <button
                                                         onClick={() => restoreSectionElements(selectedSection.id)}
                                                         className="w-full px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/40 text-orange-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                                         title="Restore missing elements from template"
                                                     >
                                                         <i className="fa-solid fa-window-restore"></i>
                                                         Restore Missing Elements
                                                     </button>
                                                     <button
                                                         onClick={() => resetSectionStyles(selectedSection.id)}
                                                         className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                                         title="Reset section styles to theme/section defaults"
                                                     >
                                                         <i className="fa-solid fa-rotate-left"></i>
                                                         Reset Default Section Style
                                                     </button>
                                                 </div>
                                             </AccordionGroup>
                                         </div>
                                     )
                                 )
                             )}
                        </div>
                    </div>
                )}
            </aside>
            {/* Canvas Wrapper - Full width/height with browser-like content zoom */}
            <main 
                className="flex-1 bg-[#111] relative" 
                style={{ 
                    height: '100%', 
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative'
                }} 
                onClick={() => { setSelectedSectionId(null); setSelectedElementId(null); }}
            >
                {/* Page container - fixed at full width/height, connected to all edges (top, bottom, left, right) */}
                <div 
                    className="absolute inset-0 shadow-2xl ring-1 ring-white/10 bg-white"
                    style={{
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        position: 'absolute',
                        overflow: 'hidden'
                    }}
                >
                    {/* Content wrapper - only this scales, page container stays fixed */}
                    <div
                        style={{
                            width: `${100 / (zoomLevel / 100)}%`,
                            height: `${100 / (zoomLevel / 100)}%`,
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: 'top left',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            fontFamily: defaultTypography.fontFamily
                        }}
                    >
                        <PreviewFrame 
                            className="w-full h-full" 
                            style={{ 
                                backgroundColor: 'var(--bg-color)',
                                width: '100%',
                                height: '100%',
                                minHeight: '100%',
                                display: 'block',
                                border: 'none'
                            }}
                        >
                            <div 
                                id="canvas-root" 
                                className="w-full h-full" 
                                style={{ 
                                    width: '100%',
                                    height: '100%',
                                    minHeight: '100%'
                                }}
                            >
                         {siteData.sections.map((section) => (
                            <SectionRenderer 
                              key={`${section.id}-${section.styles.titleHeadingTag || 'h2'}-${JSON.stringify(defaultSizes)}`} 
                              section={section} 
                              onUpdate={updateSection} 
                              isSelected={selectedSectionId === section.id} 
                              readOnly={isPreviewMode} 
                              onClick={() => { 
                                setSelectedSectionId(section.id); 
                                setSelectedElementId(null); 
                                setSelectedVirtualElement(null); 
                              }} 
                              onDelete={deleteSection} 
                              onMoveUp={(id) => moveSection(id, 'up')} 
                              onMoveDown={(id) => moveSection(id, 'down')} 
                              onUpload={triggerUpload} 
                              selectedElementId={selectedElementId} 
                              onElementSelect={(elId, el) => { 
                                setSelectedSectionId(section.id); 
                                setSelectedElementId(elId); 
                                setSelectedVirtualElement(el || null);
                              }} 
                            />
                        ))}
                    </div>
                </PreviewFrame>
                    </div>
                </div>
            </main>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
              style: {
                background: '#1a1a1a',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: '#1a1a1a',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              },
            },
          }}
        />
    </div>
  );
};

const App: React.FC = () => {
  const urlParams = getUrlParams();
  const projectId = urlParams.projectId || undefined;
  
  return (
    <ThemeProvider projectId={projectId} isBuilder={true}>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;