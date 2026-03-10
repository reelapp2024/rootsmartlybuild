
import React, { createContext, useContext, useEffect } from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings.js';
import { currentTheme } from '../App';

interface ColorContextType {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    destructive: string;
    success: string;
    warning: string;
    info: string;
    button: string;
    gradient: string;
  };
  isLoading: boolean;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const useColors = () => {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error('useColors must be used within DynamicColorProvider');
  }
  return context;
};

interface DynamicColorProviderProps {
  children: React.ReactNode;
}

export const DynamicColorProvider: React.FC<DynamicColorProviderProps> = ({ children }) => {
  const { siteSettings, isLoading } = useSiteSettings();

  // Helper function to check if a color is a gradient
  const isGradient = (color: string) => {
    return color && (color.includes('linear-gradient') || color.includes('radial-gradient'));
  };

  // Helper function to extract first hex color from gradient or return original color
  const extractColorFromGradient = (color: string) => {
    if (isGradient(color)) {
      // Extract first hex color from gradient
      const hexMatch = color.match(/#[0-9a-fA-F]{6}/);
      return hexMatch ? hexMatch[0] : '#3B82F6'; // fallback to blue
    }
    return color;
  };

  // Apply CSS custom properties for dynamic colors
  // useEffect(() => {
  //   if (!isLoading && siteSettings?.colors) {
  //     console.log('Applying colors from API:', siteSettings.colors);
  //     const root = document.documentElement;
  //     const apiColors = siteSettings.colors;
      
  //     // Handle primary color (could be gradient or hex)
  //     if (isGradient(apiColors.primary)) {
  //       root.style.setProperty('--primary-gradient', apiColors.primary);
  //       root.style.setProperty('--primary', extractColorFromGradient(apiColors.primary));
  //     } else {
  //       root.style.setProperty('--primary', apiColors.primary);
  //       root.style.setProperty('--primary-gradient', apiColors.primary);
  //     }

  //     // Handle secondary color (could be gradient or hex)
  //     if (isGradient(apiColors.secondary)) {
  //       root.style.setProperty('--secondary-gradient', apiColors.secondary);
  //       root.style.setProperty('--secondary', extractColorFromGradient(apiColors.secondary));
  //     } else {
  //       root.style.setProperty('--secondary', apiColors.secondary);
  //       root.style.setProperty('--secondary-gradient', apiColors.secondary);
  //     }

  //     // Set solid colors directly
  //     root.style.setProperty('--accent', apiColors.accent);
  //     root.style.setProperty('--button', apiColors.button);
  //     root.style.setProperty('--background', apiColors.background);
  //     root.style.setProperty('--foreground', apiColors.foreground);
  //     root.style.setProperty('--muted', apiColors.muted);
  //     root.style.setProperty('--border', apiColors.border);
  //     root.style.setProperty('--destructive', apiColors.destructive);
  //     root.style.setProperty('--success', apiColors.success);
  //     root.style.setProperty('--warning', apiColors.warning);
  //     root.style.setProperty('--info', apiColors.info);

  //     console.log('Applied primary:', apiColors.primary);
  //     console.log('Applied secondary:', apiColors.secondary);
  //     console.log('Applied accent:', apiColors.accent);
  //     console.log('Applied button:', apiColors.button);
  //   }
  // }, [siteSettings, isLoading]);

  const value: ColorContextType = {
    colors: siteSettings?.colors || {
      primary: '#3B82F6',
      secondary: '#64748B', 
      accent: '#10B981',
      background: '#FFFFFF',
      foreground: '#0F172A',
      muted: '#F1F5F9',
      border: '#E2E8F0',
      destructive: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      button: '#000000',
      gradient: 'from-green-600 to-emerald-600'
    },
    isLoading
  };

  return (
    <ColorContext.Provider value={value}>
      {children}
    </ColorContext.Provider>
  );
};
