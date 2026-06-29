'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'crimson-jet' | 'indigo-sand' | 'saffron-charcoal' | 'mint-slate' | 'marine-teal' | 'royal-plum' | 'electric-cobalt' | 'copper-forest' | 'ruby-night' | 'citrus-navy';

interface ColorElements {
  heading: string;
  description: string;
  surface: string;
  overlay: { color: string; blend: string };
  primaryButton: { bg: string; text: string; hover: string };
  secondaryButton: { bg: string; text: string; border: string; hover: string };
  accent: string;
  gradient: { from: string; to: string };
  ring: string;
  shadow: string;
  badge: { text: string; background: string };
  trust: { text: string; dot1: string; dot2: string; dot3: string };
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setSpecificTheme: (theme: Theme) => void;
  getThemeColors: () => ColorElements;
}

const themeColors: Record<Theme, ColorElements> = {
  'crimson-jet': {
    heading: '#F8FAFC',
    description: '#C7CDD6',
    surface: '#0E1214',
    overlay: { color: 'rgba(14, 16, 20, 0)', blend: 'multiply' },
    primaryButton: { bg: '#E11D48', text: '#FFFFFF', hover: '#BE123C' },
    secondaryButton: { bg: 'transparent', text: '#F8FAFC', border: '#F43F5E', hover: 'rgba(244,63,94,0.10)' },
    accent: '#F59E0B',
    gradient: { from: '#0E1214', to: '#1F2937' },
    ring: '#F43F5E',
    shadow: 'rgba(0,0,0,0.35)',
    badge: { text: '#F8FAFC', background: 'rgba(225,29,72,0.15)' },
    trust: { text: '#C7CDD6', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#F59E0B' }
  },
  'indigo-sand': {
    heading: '#F8FAFC',
    description: '#BCC6DD',
    surface: '#0F1222',
    overlay: { color: 'rgba(12, 14, 28, 0)', blend: 'multiply' },
    primaryButton: { bg: '#4F46E5', text: '#FFFFFF', hover: '#4338CA' },
    secondaryButton: { bg: 'transparent', text: '#E5E7EB', border: '#818CF8', hover: 'rgba(129,140,248,0.12)' },
    accent: '#EAB308',
    gradient: { from: '#0F1222', to: '#111827' },
    ring: '#818CF8',
    shadow: 'rgba(0,0,0,0.34)',
    badge: { text: '#F8FAFC', background: 'rgba(79,70,229,0.15)' },
    trust: { text: '#BCC6DD', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#EAB308' }
  },
  'saffron-charcoal': {
    heading: '#FFFFFF',
    description: '#E5E7EB',
    surface: '#121212',
    overlay: { color: 'rgba(12,12,12,0.46)', blend: 'multiply' },
    primaryButton: { bg: '#FDB022', text: '#1A1306', hover: '#DC8D05' },
    secondaryButton: { bg: 'transparent', text: '#FFFFFF', border: '#FACC15', hover: 'rgba(250,204,21,0.14)' },
    accent: '#84CC16',
    gradient: { from: '#0B0B0B', to: '#1A1A1A' },
    ring: '#FACC15',
    shadow: 'rgba(0,0,0,0.45)',
    badge: { text: '#FFFFFF', background: 'rgba(253,176,34,0.15)' },
    trust: { text: '#E5E7EB', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#84CC16' }
  },
  'mint-slate': {
    heading: '#FFFFFF',
    description: '#D3DEDA',
    surface: '#0B1412',
    overlay: { color: 'rgba(8,12,12,0.52)', blend: 'multiply' },
    primaryButton: { bg: '#22C55E', text: '#FFFFFF', hover: '#179B4A' },
    secondaryButton: { bg: 'transparent', text: '#FFFFFF', border: '#34D399', hover: 'rgba(52,211,153,0.16)' },
    accent: '#60A5FA',
    gradient: { from: '#0B1412', to: '#0F1A18' },
    ring: '#34D399',
    shadow: 'rgba(0,0,0,0.40)',
    badge: { text: '#FFFFFF', background: 'rgba(34,197,94,0.15)' },
    trust: { text: '#D3DEDA', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#60A5FA' }
  },
  'marine-teal': {
    heading: '#FFFFFF',
    description: '#BDD0DB',
    surface: '#0B1720',
    overlay: { color: 'rgba(7,16,18,0.62)', blend: 'multiply' },
    primaryButton: { bg: '#0EA5A4', text: '#FFFFFF', hover: '#0C7E7D' },
    secondaryButton: { bg: 'transparent', text: '#FFFFFF', border: '#22D3EE', hover: 'rgba(34,211,238,0.16)' },
    accent: '#A7F3D0',
    gradient: { from: '#0B1720', to: '#0F2430' },
    ring: '#22D3EE',
    shadow: 'rgba(0,0,0,0.38)',
    badge: { text: '#FFFFFF', background: 'rgba(14,165,164,0.15)' },
    trust: { text: '#BDD0DB', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#A7F3D0' }
  },
  'royal-plum': {
    heading: '#FFFFFF',
    description: '#D8CCE6',
    surface: '#120C18',
    overlay: { color: 'rgba(12,6,18,0.56)', blend: 'multiply' },
    primaryButton: { bg: '#A855F7', text: '#FFFFFF', hover: '#7E22CE' },
    secondaryButton: { bg: 'transparent', text: '#FFFFFF', border: '#C084FC', hover: 'rgba(192,132,252,0.14)' },
    accent: '#F59E0B',
    gradient: { from: '#0F0A16', to: '#1A1230' },
    ring: '#C084FC',
    shadow: 'rgba(0,0,0,0.42)',
    badge: { text: '#FFFFFF', background: 'rgba(168,85,247,0.15)' },
    trust: { text: '#D8CCE6', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#F59E0B' }
  },
  'electric-cobalt': {
    heading: '#F8FAFC',
    description: '#B8C7D9',
    surface: '#0A1220',
    overlay: { color: 'rgba(6,10,22,0.60)', blend: 'multiply' },
    primaryButton: { bg: '#2563EB', text: '#FFFFFF', hover: '#1E40AF' },
    secondaryButton: { bg: 'transparent', text: '#F8FAFC', border: '#38BDF8', hover: 'rgba(56,189,248,0.14)' },
    accent: '#22D3EE',
    gradient: { from: '#0A1220', to: '#0F172A' },
    ring: '#38BDF8',
    shadow: 'rgba(0,0,0,0.40)',
    badge: { text: '#F8FAFC', background: 'rgba(37,99,235,0.15)' },
    trust: { text: '#B8C7D9', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#22D3EE' }
  },
  'copper-forest': {
    heading: '#FFFFFF',
    description: '#C9D6CF',
    surface: '#0D1512',
    overlay: { color: 'rgba(8,18,14,0.58)', blend: 'multiply' },
    primaryButton: { bg: '#D97706', text: '#0E0A04', hover: '#B45309' },
    secondaryButton: { bg: 'transparent', text: '#FFFFFF', border: '#F59E0B', hover: 'rgba(245,158,11,0.14)' },
    accent: '#34D399',
    gradient: { from: '#0D1512', to: '#12201B' },
    ring: '#F59E0B',
    shadow: 'rgba(0,0,0,0.44)',
    badge: { text: '#FFFFFF', background: 'rgba(217,119,6,0.15)' },
    trust: { text: '#C9D6CF', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#34D399' }
  },
  'ruby-night': {
    heading: '#FFFFFF',
    description: '#E2C9CF',
    surface: '#140A0D',
    overlay: { color: 'rgba(18,6,8,0.60)', blend: 'multiply' },
    primaryButton: { bg: '#DC2626', text: '#FFFFFF', hover: '#991B1B' },
    secondaryButton: { bg: 'transparent', text: '#FFFFFF', border: '#F87171', hover: 'rgba(248,113,113,0.14)' },
    accent: '#FB923C',
    gradient: { from: '#140A0D', to: '#1F0E13' },
    ring: '#F87171',
    shadow: 'rgba(0,0,0,0.46)',
    badge: { text: '#FFFFFF', background: 'rgba(220,38,38,0.15)' },
    trust: { text: '#E2C9CF', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#FB923C' }
  },
  'citrus-navy': {
    heading: '#FFFFFF',
    description: '#C9D3E6',
    surface: '#0A1224',
    overlay: { color: 'rgba(8,12,28,0.62)', blend: 'multiply' },
    primaryButton: { bg: '#F59E0B', text: '#1A1306', hover: '#D97706' },
    secondaryButton: { bg: 'transparent', text: '#FFFFFF', border: '#FBBF24', hover: 'rgba(251,191,36,0.16)' },
    accent: '#10B981',
    gradient: { from: '#0A1224', to: '#0C1A33' },
    ring: '#FBBF24',
    shadow: 'rgba(0,0,0,0.43)',
    badge: { text: '#FFFFFF', background: 'rgba(245,158,11,0.15)' },
    trust: { text: '#C9D3E6', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#10B981' }
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const validThemes: Theme[] = ['crimson-jet', 'indigo-sand', 'saffron-charcoal', 'mint-slate', 'marine-teal', 'royal-plum', 'electric-cobalt', 'copper-forest', 'ruby-night', 'citrus-navy'];
  
  // Initialize with API theme if available, otherwise use static default
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') {
      return 'crimson-jet'; // Default for SSR
    }
    // Priority 1: Check if API has set the theme (from App.tsx)
    const apiTheme = localStorage.getItem('theme') as Theme;
    if (apiTheme && validThemes.includes(apiTheme)) {
      return apiTheme;
    }
    
    // Priority 2: Fallback to old localStorage key only if API didn't set it
    const savedTheme = localStorage.getItem('heroTheme') as Theme;
    if (savedTheme && validThemes.includes(savedTheme)) {
      return savedTheme;
    }
    
    // Priority 3: Static default (only if API hasn't set anything)
    return 'crimson-jet';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [apiThemeLoaded, setApiThemeLoaded] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    // Check if API theme is already set
    const apiTheme = localStorage.getItem('theme') as Theme;
    return apiTheme && validThemes.includes(apiTheme);
  });

  // Sync with API theme when it becomes available
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    // Check for API theme after a short delay to allow App.tsx to set it
    const checkApiTheme = () => {
      const apiTheme = localStorage.getItem('theme') as Theme;
      if (apiTheme && validThemes.includes(apiTheme)) {
        setTheme(apiTheme);
        setApiThemeLoaded(true);
      }
    };
    
    // Check immediately and after a short delay (for API response timing)
    checkApiTheme();
    const timeout = setTimeout(checkApiTheme, 500);
    
    // Listen for cross-window storage events (for same origin)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as Theme;
        if (validThemes.includes(newTheme)) {
          setTheme(newTheme);
          setApiThemeLoaded(true);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Only run once on mount

  // Only save to localStorage when user manually changes theme (not on API updates)
  // This prevents loops and fluctuations
  const setSpecificTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      // Save to localStorage only on manual changes
      localStorage.setItem('heroTheme', newTheme);
      // Don't overwrite 'theme' key as it's reserved for API
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const themes: Theme[] = ['crimson-jet', 'indigo-sand', 'saffron-charcoal', 'mint-slate', 'marine-teal', 'royal-plum', 'electric-cobalt', 'copper-forest', 'ruby-night', 'citrus-navy'];
      const currentIndex = themes.indexOf(prevTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      const newTheme = themes[nextIndex];
      if (typeof window !== 'undefined') {
        // Save to localStorage only on manual toggle
        localStorage.setItem('heroTheme', newTheme);
      }
      return newTheme;
    });
  };

  const getThemeColors = () => {
    return themeColors[theme];
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setSpecificTheme, getThemeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};
