
import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { colorThemes, getThemeByName, defaultTheme } from '../colors';

const CleaningLoader = () => {
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState(getThemeByName(defaultTheme));

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cleaningTheme');
    if (savedTheme) {
      setSelectedTheme(savedTheme);
      setCurrentTheme(getThemeByName(savedTheme));
    }
  }, []);

  // Listen for theme changes from header
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setSelectedTheme(newTheme);
      setCurrentTheme(getThemeByName(newTheme));
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: `${currentTheme.elements.surface}95`,
        backdropFilter: 'blur(8px)'
      }}
    >
      <div className="text-center">
        <div className="relative">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`,
              boxShadow: `0 10px 30px ${currentTheme.elements.primaryButton.bg}40`
            }}
          >
            <Sparkles className="w-8 h-8 text-white animate-spin" />
          </div>
          <div 
            className="absolute inset-0 w-16 h-16 rounded-full mx-auto animate-ping opacity-75"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.elements.primaryButton.bg}, ${currentTheme.elements.accent})`
            }}
          ></div>
        </div>
        <p 
          className="text-xl font-semibold mt-4"
          style={{ color: currentTheme.elements.heading }}
        >
          Loading
        </p>
        <div className="flex space-x-1 justify-center mt-2">
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: currentTheme.elements.primaryButton.bg,
              animationDelay: '0s'
            }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: currentTheme.elements.accent,
              animationDelay: '0.1s'
            }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: currentTheme.elements.primaryButton.bg,
              animationDelay: '0.2s'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default CleaningLoader;