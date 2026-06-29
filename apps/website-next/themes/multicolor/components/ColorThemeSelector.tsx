'use client';

import { ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';

const ColorThemeSelector = () => {
  const { theme, setSpecificTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes = [
    { name: 'crimson-jet', label: 'Crimson Jet', colors: ['#E11D48', '#F59E0B'] },
    { name: 'indigo-sand', label: 'Indigo Sand', colors: ['#4F46E5', '#EAB308'] },
    { name: 'saffron-charcoal', label: 'Saffron Charcoal — Vivid', colors: ['#FDB022', '#84CC16'] },
    { name: 'mint-slate', label: 'Mint Slate — Punchy', colors: ['#22C55E', '#60A5FA'] },
    { name: 'marine-teal', label: 'Marine Teal — Crisp', colors: ['#0EA5A4', '#22D3EE'] },
    { name: 'royal-plum', label: 'Royal Plum Noir', colors: ['#A855F7', '#F59E0B'] },
    { name: 'electric-cobalt', label: 'Electric Cobalt', colors: ['#2563EB', '#22D3EE'] },
    { name: 'copper-forest', label: 'Copper Forest', colors: ['#D97706', '#34D399'] },
    { name: 'ruby-night', label: 'Ruby Night', colors: ['#DC2626', '#FB923C'] },
    { name: 'citrus-navy', label: 'Citrus Navy', colors: ['#F59E0B', '#10B981'] }
  ];

  const currentTheme = themes.find(t => t.name === theme) || themes[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="fixed bottom-6 right-6 z-[100]">
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in w-64">
          <div className="max-h-80 overflow-y-auto">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setSpecificTheme(t.name as any);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                  theme === t.name 
                    ? 'bg-gray-100 border-l-4 border-gray-700' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex gap-1.5">
                  <div 
                    className="w-4 h-4 rounded-full ring-1 ring-gray-200"
                    style={{ backgroundColor: t.colors[0] }}
                  ></div>
                  <div 
                    className="w-4 h-4 rounded-full ring-1 ring-gray-200"
                    style={{ backgroundColor: t.colors[1] }}
                  ></div>
                </div>
                <span className={`text-sm font-medium ${theme === t.name ? 'text-gray-900' : 'text-gray-700'}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <div className="flex gap-1.5">
          <div 
            className="w-4 h-4 rounded-full ring-1 ring-gray-300"
            style={{ backgroundColor: currentTheme.colors[0] }}
          ></div>
          <div 
            className="w-4 h-4 rounded-full ring-1 ring-gray-300"
            style={{ backgroundColor: currentTheme.colors[1] }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {currentTheme.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

export default ColorThemeSelector;

