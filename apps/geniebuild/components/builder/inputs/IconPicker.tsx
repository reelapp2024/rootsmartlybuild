import React, { useId, useState } from 'react';

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
  'fa-map-marker-alt', 'fa-globe', 'fa-plane', 'fa-car', 'fa-home',
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

interface IconPickerProps {
  label: string;
  value: string | undefined;
  onChange: (val: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ label, value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const panelId = useId();
  const searchId = useId();

  const normalizeIcon = (iconValue: string | undefined): string => {
    if (!iconValue) return 'fa-star';
    if (iconValue.startsWith('fa-solid fa-')) return iconValue.replace('fa-solid fa-', 'fa-');
    if (iconValue.startsWith('fa-solid ')) return iconValue.replace('fa-solid ', 'fa-');
    if (iconValue.startsWith('fa-')) return iconValue;
    return `fa-${iconValue}`;
  };

  const normalizedValue = normalizeIcon(value);
  const currentIcon = value === 'none' ? 'None' : normalizedValue.replace('fa-', '');

  const filteredIcons = POPULAR_ICONS.filter(icon =>
    icon.replace('fa-', '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIconClass = (iconName: string) => {
    if (iconName === 'none') return 'fa-solid fa-ban';
    const normalized = normalizeIcon(iconName);
    return `fa-solid ${normalized}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>

      {/* Current Icon Display — keyboard-accessible button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        aria-haspopup="listbox"
        aria-expanded={showPicker}
        aria-controls={panelId}
        aria-label={`${label}: ${value === 'none' ? 'None' : currentIcon.replace(/-/g, ' ')}. Click to change.`}
        className="w-full bg-[#151515] border border-[#333] rounded p-3 flex items-center justify-between cursor-pointer hover:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
      >
        <div className="flex items-center gap-3">
          <i className={`${getIconClass(value === 'none' ? 'none' : normalizedValue)} text-xl`} style={{ color: value === 'none' ? '#6B7280' : '#F59E0B' }} aria-hidden="true"></i>
          <span className="text-white text-xs font-medium">
            {value === 'none' ? 'None' : currentIcon.charAt(0).toUpperCase() + currentIcon.slice(1).replace(/-/g, ' ')}
          </span>
        </div>
        <i className={`fa-solid fa-chevron-${showPicker ? 'up' : 'down'} text-xs text-white/40`} aria-hidden="true"></i>
      </button>

      {/* Icon Picker Dropdown */}
      {showPicker && (
        <div id={panelId} role="listbox" aria-label="Icon picker" className="bg-[#151515] border border-[#333] rounded p-3 max-h-64 overflow-y-auto custom-scrollbar">
          {/* Search Input */}
          <div className="mb-3">
            <label htmlFor={searchId} className="sr-only">Search icons</label>
            <input
              id={searchId}
              type="text"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2 text-white text-xs focus:border-blue-500 focus:outline-none"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* Icons Grid */}
          <div className="grid grid-cols-6 gap-2">
            {/* None Option */}
            <button
              type="button"
              role="option"
              aria-selected={value === 'none'}
              onClick={(e) => {
                e.stopPropagation();
                onChange('none');
                setShowPicker(false);
                setSearchTerm('');
              }}
              className={`p-2 rounded border transition-all hover:border-blue-500 hover:bg-[#1a1a1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                value === 'none'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-[#333] bg-[#0a0a0a]'
              }`}
              title="None"
              aria-label="No icon"
            >
              <i className="fa-solid fa-ban text-lg text-gray-500" aria-hidden="true"></i>
            </button>

            {filteredIcons.map((icon) => {
              const iconName = icon.replace('fa-', '');
              const isSelected = normalizedValue === icon;
              const readableName = iconName.replace(/-/g, ' ');
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  key={icon}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(icon);
                    setShowPicker(false);
                    setSearchTerm('');
                  }}
                  className={`p-2 rounded border transition-all hover:border-blue-500 hover:bg-[#1a1a1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#333] bg-[#0a0a0a]'
                  }`}
                  title={readableName}
                  aria-label={readableName}
                >
                  <i className={`fa-solid ${icon} text-lg`} style={{ color: isSelected ? '#60A5FA' : '#D1D5DB' }} aria-hidden="true"></i>
                </button>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div role="status" className="text-center text-white/40 text-xs py-4">
              No icons found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
