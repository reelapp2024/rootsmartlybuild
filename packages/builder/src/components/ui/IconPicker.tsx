import React, { useState, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';

// Popular Font Awesome icons list
const FONT_AWESOME_ICONS = [
  // Common icons
  { name: 'star', class: 'fas fa-star', category: 'common' },
  { name: 'heart', class: 'fas fa-heart', category: 'common' },
  { name: 'home', class: 'fas fa-home', category: 'common' },
  { name: 'user', class: 'fas fa-user', category: 'common' },
  { name: 'users', class: 'fas fa-users', category: 'common' },
  { name: 'envelope', class: 'fas fa-envelope', category: 'common' },
  { name: 'phone', class: 'fas fa-phone', category: 'common' },
  { name: 'search', class: 'fas fa-search', category: 'common' },
  { name: 'settings', class: 'fas fa-cog', category: 'common' },
  { name: 'menu', class: 'fas fa-bars', category: 'common' },
  { name: 'close', class: 'fas fa-times', category: 'common' },
  { name: 'check', class: 'fas fa-check', category: 'common' },
  { name: 'arrow-right', class: 'fas fa-arrow-right', category: 'common' },
  { name: 'arrow-left', class: 'fas fa-arrow-left', category: 'common' },
  { name: 'arrow-up', class: 'fas fa-arrow-up', category: 'common' },
  { name: 'arrow-down', class: 'fas fa-arrow-down', category: 'common' },
  
  // Social icons
  { name: 'facebook', class: 'fab fa-facebook', category: 'social' },
  { name: 'twitter', class: 'fab fa-twitter', category: 'social' },
  { name: 'instagram', class: 'fab fa-instagram', category: 'social' },
  { name: 'linkedin', class: 'fab fa-linkedin', category: 'social' },
  { name: 'youtube', class: 'fab fa-youtube', category: 'social' },
  { name: 'github', class: 'fab fa-github', category: 'social' },
  { name: 'whatsapp', class: 'fab fa-whatsapp', category: 'social' },
  
  // Business icons
  { name: 'briefcase', class: 'fas fa-briefcase', category: 'business' },
  { name: 'building', class: 'fas fa-building', category: 'business' },
  { name: 'chart-line', class: 'fas fa-chart-line', category: 'business' },
  { name: 'dollar-sign', class: 'fas fa-dollar-sign', category: 'business' },
  { name: 'handshake', class: 'fas fa-handshake', category: 'business' },
  { name: 'lightbulb', class: 'fas fa-lightbulb', category: 'business' },
  { name: 'rocket', class: 'fas fa-rocket', category: 'business' },
  { name: 'trophy', class: 'fas fa-trophy', category: 'business' },
  
  // Technology icons
  { name: 'laptop', class: 'fas fa-laptop', category: 'tech' },
  { name: 'mobile-alt', class: 'fas fa-mobile-alt', category: 'tech' },
  { name: 'code', class: 'fas fa-code', category: 'tech' },
  { name: 'database', class: 'fas fa-database', category: 'tech' },
  { name: 'server', class: 'fas fa-server', category: 'tech' },
  { name: 'cloud', class: 'fas fa-cloud', category: 'tech' },
  { name: 'shield-alt', class: 'fas fa-shield-alt', category: 'tech' },
  { name: 'lock', class: 'fas fa-lock', category: 'tech' },
  
  // Media icons
  { name: 'image', class: 'fas fa-image', category: 'media' },
  { name: 'video', class: 'fas fa-video', category: 'media' },
  { name: 'camera', class: 'fas fa-camera', category: 'media' },
  { name: 'music', class: 'fas fa-music', category: 'media' },
  { name: 'play', class: 'fas fa-play', category: 'media' },
  { name: 'pause', class: 'fas fa-pause', category: 'media' },
  
  // Navigation icons
  { name: 'map-marker-alt', class: 'fas fa-map-marker-alt', category: 'navigation' },
  { name: 'globe', class: 'fas fa-globe', category: 'navigation' },
  { name: 'compass', class: 'fas fa-compass', category: 'navigation' },
  { name: 'route', class: 'fas fa-route', category: 'navigation' },
  
  // Shopping icons
  { name: 'shopping-cart', class: 'fas fa-shopping-cart', category: 'shopping' },
  { name: 'shopping-bag', class: 'fas fa-shopping-bag', category: 'shopping' },
  { name: 'credit-card', class: 'fas fa-credit-card', category: 'shopping' },
  { name: 'tag', class: 'fas fa-tag', category: 'shopping' },
  
  // Communication icons
  { name: 'comment', class: 'fas fa-comment', category: 'communication' },
  { name: 'comments', class: 'fas fa-comments', category: 'communication' },
  { name: 'bell', class: 'fas fa-bell', category: 'communication' },
  { name: 'paper-plane', class: 'fas fa-paper-plane', category: 'communication' },
  
  // More icons
  { name: 'calendar', class: 'fas fa-calendar', category: 'common' },
  { name: 'clock', class: 'fas fa-clock', category: 'common' },
  { name: 'file', class: 'fas fa-file', category: 'common' },
  { name: 'folder', class: 'fas fa-folder', category: 'common' },
  { name: 'download', class: 'fas fa-download', category: 'common' },
  { name: 'upload', class: 'fas fa-upload', category: 'common' },
  { name: 'edit', class: 'fas fa-edit', category: 'common' },
  { name: 'trash', class: 'fas fa-trash', category: 'common' },
  { name: 'save', class: 'fas fa-save', category: 'common' },
  { name: 'print', class: 'fas fa-print', category: 'common' },
  { name: 'share', class: 'fas fa-share', category: 'common' },
  { name: 'link', class: 'fas fa-link', category: 'common' },
  { name: 'external-link-alt', class: 'fas fa-external-link-alt', category: 'common' },
  { name: 'info-circle', class: 'fas fa-info-circle', category: 'common' },
  { name: 'question-circle', class: 'fas fa-question-circle', category: 'common' },
  { name: 'exclamation-circle', class: 'fas fa-exclamation-circle', category: 'common' },
  { name: 'check-circle', class: 'fas fa-check-circle', category: 'common' },
  { name: 'times-circle', class: 'fas fa-times-circle', category: 'common' },
];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
}

export default function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Ensure Font Awesome is loaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if Font Awesome is already loaded
      const faLoaded = document.querySelector('link[href*="font-awesome"]') || 
                       document.querySelector('link[href*="fontawesome"]') ||
                       document.querySelector('link[href*="all.min.css"]');
      
      if (!faLoaded) {
        // Load Font Awesome if not present
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        link.integrity = 'sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==';
        link.crossOrigin = 'anonymous';
        link.referrerPolicy = 'no-referrer';
        document.head.appendChild(link);
      }
    }
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(FONT_AWESOME_ICONS.map(icon => icon.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredIcons = useMemo(() => {
    let filtered = FONT_AWESOME_ICONS;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(icon => icon.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(icon =>
        icon.name.toLowerCase().includes(query) ||
        icon.class.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const handleIconSelect = (iconClass: string) => {
    onChange(iconClass);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Select Icon</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search and Category Filter */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredIcons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No icons found matching "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-4">
              {filteredIcons.map((icon) => (
                <button
                  key={icon.class}
                  onClick={() => handleIconSelect(icon.class)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all hover:bg-blue-50 hover:border-blue-500 ${
                    value === icon.class
                      ? 'bg-blue-100 border-blue-500'
                      : 'border-gray-200'
                  }`}
                  title={icon.name}
                >
                  <i 
                    className={`${icon.class} icon-picker-icon`}
                    style={{ fontSize: '1.5rem' }}
                  ></i>
                  <span className="text-xs text-gray-600 truncate w-full text-center mt-1">
                    {icon.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} found
            </div>
            {value && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Selected:</span>
                <i className={`${value} icon-picker-icon`} style={{ fontSize: '1.25rem' }}></i>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded">{value}</code>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
