'use client';

import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, setSpecificTheme } = useTheme();

  const themes = [
    { name: 'default', label: 'Blue Theme', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#3b82f6' },
    { name: 'green', label: 'Green Theme', gradient: 'linear-gradient(135deg, #10b981, #059669)', color: '#10b981' },
    { name: 'black', label: 'Black Theme', gradient: 'linear-gradient(135deg, #374151, #111827)', color: '#374151' },
    { name: 'purple', label: 'Purple Theme', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#8b5cf6' },
    { name: 'orange', label: 'Orange Theme', gradient: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#f97316' },
    { name: 'red', label: 'Red Theme', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ef4444' },
    { name: 'cyan', label: 'Cyan Theme', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#06b6d4' },
    { name: 'yellow', label: 'Yellow Theme', gradient: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#eab308' },
    { name: 'pink', label: 'Pink Theme', gradient: 'linear-gradient(135deg, #ec4899, #db2777)', color: '#ec4899' },
    { name: 'indigo', label: 'Indigo Theme', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#6366f1' },
    { name: 'teal', label: 'Teal Theme', gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)', color: '#14b8a6' },
    { name: 'lime', label: 'Lime Theme', gradient: 'linear-gradient(135deg, #84cc16, #65a30d)', color: '#84cc16' },
    { name: 'rose', label: 'Rose Theme', gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: '#f43f5e' },
    { name: 'sky', label: 'Sky Theme', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#0ea5e9' },
    { name: 'mint', label: 'Mint Theme', gradient: 'linear-gradient(135deg, #34d399, #10b981)', color: '#34d399' },
    { name: 'lavender', label: 'Lavender Theme', gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', color: '#a78bfa' },
    { name: 'coral', label: 'Coral Theme', gradient: 'linear-gradient(135deg, #fb7185, #f43f5e)', color: '#fb7185' },
    { name: 'gold', label: 'Gold Theme', gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#fbbf24' }
  ];

  const currentThemeIndex = themes.findIndex(t => t.name === theme);
  const currentTheme = themes[currentThemeIndex];

  const getActivePosition = () => {
    const index = currentThemeIndex;
    return `translate-x-[${index * 32}px]`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="group relative">
        {/* Theme Toggle Container */}
        <div className="relative bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-full p-2 shadow-xl hover:shadow-2xl transition-all duration-300 max-w-[576px] overflow-x-auto overflow-y-visible animate-scale-in">
          {/* Active Theme Indicator */}
          <div 
            className="absolute top-2 left-2 w-8 h-8 rounded-full transition-all duration-500 ease-in-out transform animate-pulse-glow z-10"
            style={{ 
              transform: `translateX(${currentThemeIndex * 32}px)`,
              background: currentTheme?.gradient,
              boxShadow: `0 0 20px ${currentTheme?.color}40`
            }}
          />
          
          {/* Theme Options */}
          <div className="relative flex items-center space-x-0">
            {themes.map((themeOption, index) => (
              <button
                key={themeOption.name}
                onClick={() => setSpecificTheme(themeOption.name as any)}
                className="relative w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 active:scale-95 transition-all duration-200 flex-shrink-0 animate-float"
                style={{
                  background: themeOption.gradient,
                  animationDelay: `${index * 0.1}s`
                }}
                aria-label={themeOption.label}
                data-theme={themeOption.name}
              >
                <div className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white/20"></div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Enhanced Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg animate-slide-up">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ background: currentTheme?.color }}
            />
            {currentTheme?.label} Active
          </div>
          <div className="absolute top-full right-4 -mt-1 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
        </div>

        {/* Floating Active Indicator */}
        <div 
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-bounce"
          style={{ 
            background: currentTheme?.color,
            boxShadow: `0 0 15px ${currentTheme?.color}60`
          }}
        />
      </div>
    </div>
  );
};

export default ThemeToggle;
