'use client';

/* @refresh reset */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, fonts, type FontName } from './themePresets';

export type ThemeName = 'crimson-jet' | 'indigo-sand' | 'saffron-charcoal' | 'mint-slate' | 'marine-teal' | 'royal-plum' | 'electric-cobalt' | 'copper-forest' | 'ruby-night' | 'citrus-navy' | 'custom';

export interface Theme {
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
  headingSizes?: { h1: string; h2: string; h3: string; h4: string; h5: string; h6: string };
  buttonSizes?: { small: string; medium: string; large: string; fontSize: string };
  textSizes?: { base: string; small: string; large: string; xl: string };
  fontFamily?: string;
}

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeData: Theme;
  customTheme?: Theme; // For custom user-created themes
  setCustomTheme?: (theme: Theme) => void;
  font: FontName;
  setFont: (font: FontName) => void;
  fontFamily: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook must be defined as a function (not arrow function) for Fast Refresh compatibility
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return safe defaults instead of throwing - allows builder to work without theme
    return {
      theme: 'crimson-jet' as ThemeName,
      setTheme: () => {},
      themeData: themes['crimson-jet'] || themes['crimson-jet'],
      font: 'inter' as FontName,
      setFont: () => {},
      fontFamily: fonts['inter'] || 'Inter, sans-serif',
    };
  }
  return context;
}

// Export hook separately to maintain Fast Refresh compatibility
export { useTheme };

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeName;
  initialFont?: FontName;
  customTheme?: Theme; // Allow passing custom theme from database
  projectId?: string; // For loading theme from API
  isBuilder?: boolean; // Whether we're in builder mode (to scope styles)
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme,
  initialFont = 'inter',
  customTheme: initialCustomTheme,
  projectId,
  isBuilder = false
}) => {
  // If projectId is provided, don't use initialTheme - let API load it
  // Otherwise, use initialTheme or default to 'crimson-jet'
  const defaultTheme: ThemeName = projectId ? 'crimson-jet' : (initialTheme || 'crimson-jet');
  const [theme, setTheme] = useState<ThemeName>(defaultTheme);
  const [font, setFont] = useState<FontName>(initialFont);
  const [customTheme, setCustomTheme] = useState<Theme | undefined>(initialCustomTheme);
  
  // Get theme data - use custom theme if theme is 'custom', otherwise use preset
  const themeData = theme === 'custom' && customTheme ? customTheme : themes[theme] || themes['crimson-jet'];
  const fontFamily = fonts[font];
  
  // Load theme from API if projectId is provided - run immediately on mount
  useEffect(() => {
    if (projectId && typeof window !== 'undefined') {
      const loadThemeFromAPI = async () => {
        try {
          // Support both Vite (builder) and Next.js (custom sites) environments
          const viteApiUrl = (window as any).__API_URL__ || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
          const nextApiUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';
          
          // Determine API URL - prioritize Next.js env var, then Vite, then default
          let apiUrl = nextApiUrl || viteApiUrl || 'https://apis.smartlybuild.dev/admin/v1';
          
          // Ensure we have the full API URL with /admin/v1
          if (!apiUrl.includes('/admin/v1')) {
            const baseUrl = apiUrl.replace('/admin/v1', '').replace(/\/$/, '');
            apiUrl = `${baseUrl}/admin/v1`;
          }
          
          const response = await fetch(`${apiUrl}/getThemeSettings?projectId=${projectId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const themeSettings = data.data;
              
              // Get font/size settings from database (available for both preset and custom themes)
              const dbFontSizes = themeSettings.customColors || {};
              // Get defaultFont from separate key (preferred) or fallback to customColors.fontFamily
              const defaultFontFromDB = themeSettings.defaultFont || themeSettings.customColors?.fontFamily || 'Inter, sans-serif';
              
              if (themeSettings.customColors && themeSettings.customColors.heading && themeSettings.theme === 'custom') {
                // Custom theme from database - ensure it's in the correct format
                const customThemeData: Theme = {
                  heading: themeSettings.customColors.heading || '#000000',
                  description: themeSettings.customColors.description || '#666666',
                  surface: themeSettings.customColors.surface || '#FFFFFF',
                  overlay: themeSettings.customColors.overlay || { color: 'rgba(0,0,0,0)', blend: 'multiply' },
                  primaryButton: themeSettings.customColors.primaryButton || { bg: '#000000', text: '#FFFFFF', hover: '#333333' },
                  secondaryButton: themeSettings.customColors.secondaryButton || { bg: 'transparent', text: '#000000', border: '#000000', hover: 'rgba(0,0,0,0.1)' },
                  accent: themeSettings.customColors.accent || '#000000',
                  gradient: themeSettings.customColors.gradient || { from: '#FFFFFF', to: '#F0F0F0' },
                  ring: themeSettings.customColors.ring || '#000000',
                  shadow: themeSettings.customColors.shadow || 'rgba(0,0,0,0.1)',
                  badge: themeSettings.customColors.badge || { text: '#000000', background: 'rgba(0,0,0,0.1)' },
                  trust: themeSettings.customColors.trust || { text: '#666666', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#F59E0B' },
                  headingSizes: dbFontSizes.headingSizes || { h1: '3rem', h2: '2.5rem', h3: '2rem', h4: '1.5rem', h5: '1.25rem', h6: '1rem' },
                  buttonSizes: dbFontSizes.buttonSizes || { small: '8px 16px', medium: '12px 24px', large: '16px 32px', fontSize: '1rem' },
                  textSizes: dbFontSizes.textSizes || { base: '1rem', small: '0.875rem', large: '1.125rem', xl: '1.25rem' },
                  fontFamily: defaultFontFromDB
                };
                setCustomTheme(customThemeData);
                setTheme('custom');
              } else if (themeSettings.theme && themes[themeSettings.theme as ThemeName]) {
                // Preset theme - merge font/size settings from database
                const presetTheme = themes[themeSettings.theme as ThemeName];
                const mergedTheme: Theme = {
                  ...presetTheme,
                  headingSizes: dbFontSizes.headingSizes || { h1: '3rem', h2: '2.5rem', h3: '2rem', h4: '1.5rem', h5: '1.25rem', h6: '1rem' },
                  buttonSizes: dbFontSizes.buttonSizes || { small: '8px 16px', medium: '12px 24px', large: '16px 32px', fontSize: '1rem' },
                  textSizes: dbFontSizes.textSizes || { base: '1rem', small: '0.875rem', large: '1.125rem', xl: '1.25rem' },
                  fontFamily: defaultFontFromDB
                };
                setCustomTheme(mergedTheme);
                setTheme(themeSettings.theme as ThemeName);
              } else {
                // No theme settings found, keep default but log it
              }
            }
          } else {
            console.warn('[ThemeProvider] Failed to load theme from API:', response.status, response.statusText);
          }
        } catch (error) {
          console.warn('[ThemeProvider] Failed to load theme from API:', error);
        }
      };
      
      // Load immediately, don't wait
      loadThemeFromAPI();
      
      // Periodically refresh theme (every 30 seconds) to pick up changes from admin panel
      // This ensures custom sites reflect theme changes made in the builder
      const refreshInterval = setInterval(() => {
        loadThemeFromAPI();
      }, 30000); // Check every 30 seconds
      
      // Also refresh when page becomes visible (user switches tabs back)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          loadThemeFromAPI();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(refreshInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [projectId]);

  // Listen for theme change events (for instant updates in builder)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleThemeChange = async (event: CustomEvent) => {
      const { theme: newTheme, customColors: newCustomColors, projectId: eventProjectId } = event.detail || {};
      
      // Use projectId from event or from props
      const targetProjectId = eventProjectId || projectId;
      
      // If projectId exists, reload from API to get latest settings from DB
      if (targetProjectId) {
        try {
          const viteApiUrl = (window as any).__API_URL__ || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
          const nextApiUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';
          let apiUrl = nextApiUrl || viteApiUrl || 'https://apis.smartlybuild.dev/admin/v1';
          
          if (!apiUrl.includes('/admin/v1')) {
            const baseUrl = apiUrl.replace('/admin/v1', '').replace(/\/$/, '');
            apiUrl = `${baseUrl}/admin/v1`;
          }
          
          const response = await fetch(`${apiUrl}/getThemeSettings?projectId=${targetProjectId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const themeSettings = data.data;
              const dbFontSizes = themeSettings.customColors || {};
              // Get defaultFont from separate key (preferred) or fallback to customColors.fontFamily
              const defaultFontFromDB = themeSettings.defaultFont || themeSettings.customColors?.fontFamily || 'Inter, sans-serif';
              
              if (themeSettings.customColors && themeSettings.customColors.heading && themeSettings.theme === 'custom') {
                const customThemeData: Theme = {
                  heading: themeSettings.customColors.heading || '#000000',
                  description: themeSettings.customColors.description || '#666666',
                  surface: themeSettings.customColors.surface || '#FFFFFF',
                  overlay: themeSettings.customColors.overlay || { color: 'rgba(0,0,0,0)', blend: 'multiply' },
                  primaryButton: themeSettings.customColors.primaryButton || { bg: '#000000', text: '#FFFFFF', hover: '#333333' },
                  secondaryButton: themeSettings.customColors.secondaryButton || { bg: 'transparent', text: '#000000', border: '#000000', hover: 'rgba(0,0,0,0.1)' },
                  accent: themeSettings.customColors.accent || '#000000',
                  gradient: themeSettings.customColors.gradient || { from: '#FFFFFF', to: '#F0F0F0' },
                  ring: themeSettings.customColors.ring || '#000000',
                  shadow: themeSettings.customColors.shadow || 'rgba(0,0,0,0.1)',
                  badge: themeSettings.customColors.badge || { text: '#000000', background: 'rgba(0,0,0,0.1)' },
                  trust: themeSettings.customColors.trust || { text: '#666666', dot1: '#22C55E', dot2: '#3B82F6', dot3: '#F59E0B' },
                  headingSizes: dbFontSizes.headingSizes || { h1: '3rem', h2: '2.5rem', h3: '2rem', h4: '1.5rem', h5: '1.25rem', h6: '1rem' },
                  buttonSizes: dbFontSizes.buttonSizes || { small: '8px 16px', medium: '12px 24px', large: '16px 32px', fontSize: '1rem' },
                  textSizes: dbFontSizes.textSizes || { base: '1rem', small: '0.875rem', large: '1.125rem', xl: '1.25rem' },
                  fontFamily: defaultFontFromDB
                };
                setCustomTheme(customThemeData);
                setTheme('custom');
              } else if (themeSettings.theme && themes[themeSettings.theme as ThemeName]) {
                const presetTheme = themes[themeSettings.theme as ThemeName];
                const mergedTheme: Theme = {
                  ...presetTheme,
                  headingSizes: dbFontSizes.headingSizes || { h1: '3rem', h2: '2.5rem', h3: '2rem', h4: '1.5rem', h5: '1.25rem', h6: '1rem' },
                  buttonSizes: dbFontSizes.buttonSizes || { small: '8px 16px', medium: '12px 24px', large: '16px 32px', fontSize: '1rem' },
                  textSizes: dbFontSizes.textSizes || { base: '1rem', small: '0.875rem', large: '1.125rem', xl: '1.25rem' },
                  fontFamily: defaultFontFromDB
                };
                setCustomTheme(mergedTheme);
                setTheme(themeSettings.theme as ThemeName);
              }
            }
          }
        } catch (error) {
          console.error('[ThemeProvider] Failed to reload theme from API:', error);
        }
      } else {
        // Fallback to event detail if no projectId
        if (newTheme) {
          if (newTheme === 'custom' && newCustomColors) {
            setCustomTheme(newCustomColors);
            setTheme('custom');
          } else if (themes[newTheme]) {
            setTheme(newTheme as ThemeName);
            setCustomTheme(undefined);
          }
        }
      }
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, [projectId, isBuilder]);

  useEffect(() => {
    // Load Google Fonts
    const fontLinks = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap'
    ];

    fontLinks.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    });

    // Create or update style element for theme variables with !important
    let styleElement = document.getElementById('theme-variables-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'theme-variables-style';
      document.head.appendChild(styleElement);
    }
    
    // Determine selector: scope to website content in builder, global in custom sites
    // Check if we're in builder by looking for the data attribute or isBuilder prop
    // Use a function to check builder mode
    const checkBuilderMode = () => {
      if (isBuilder) return true;
      if (typeof window !== 'undefined') {
        return !!document.querySelector('[data-website-content="true"]');
      }
      return false;
    };
    
    const isInBuilder = checkBuilderMode();
    const selector = isInBuilder ? '[data-website-content="true"]' : ':root';
    
    // Build CSS with !important - scoped to website content in builder, global in custom sites
    const cssText = `
      ${selector} {
        --color-heading: ${themeData.heading} !important;
        --color-description: ${themeData.description} !important;
        --color-surface: ${themeData.surface} !important;
        --color-overlay: ${themeData.overlay.color} !important;
        --color-primary-bg: ${themeData.primaryButton.bg} !important;
        --color-primary-text: ${themeData.primaryButton.text} !important;
        --color-primary-hover: ${themeData.primaryButton.hover} !important;
        --color-secondary-bg: ${themeData.secondaryButton.bg} !important;
        --color-secondary-text: ${themeData.secondaryButton.text} !important;
        --color-secondary-border: ${themeData.secondaryButton.border} !important;
        --color-secondary-hover: ${themeData.secondaryButton.hover} !important;
        --color-accent: ${themeData.accent} !important;
        --color-gradient-from: ${themeData.gradient.from} !important;
        --color-gradient-to: ${themeData.gradient.to} !important;
        --color-ring: ${themeData.ring} !important;
        --color-shadow: ${themeData.shadow} !important;
        --color-badge-text: ${themeData.badge.text} !important;
        --color-badge-bg: ${themeData.badge.background} !important;
        --color-trust-text: ${themeData.trust.text} !important;
        --color-trust-dot1: ${themeData.trust.dot1} !important;
        --color-trust-dot2: ${themeData.trust.dot2} !important;
        --color-trust-dot3: ${themeData.trust.dot3} !important;
        /* CRITICAL: --font-family removed - typography is resolved inline per element */
        --heading-h1-size: ${themeData.headingSizes?.h1 || '3rem'} !important;
        --heading-h2-size: ${themeData.headingSizes?.h2 || '2.5rem'} !important;
        --heading-h3-size: ${themeData.headingSizes?.h3 || '2rem'} !important;
        --heading-h4-size: ${themeData.headingSizes?.h4 || '1.5rem'} !important;
        --heading-h5-size: ${themeData.headingSizes?.h5 || '1.25rem'} !important;
        --heading-h6-size: ${themeData.headingSizes?.h6 || '1rem'} !important;
        --button-padding-small: ${themeData.buttonSizes?.small || '8px 16px'} !important;
        --button-padding-medium: ${themeData.buttonSizes?.medium || '12px 24px'} !important;
        --button-padding-large: ${themeData.buttonSizes?.large || '16px 32px'} !important;
        --button-font-size: ${themeData.buttonSizes?.fontSize || '1rem'} !important;
        --text-size-base: ${themeData.textSizes?.base || '1rem'} !important;
        --text-size-small: ${themeData.textSizes?.small || '0.875rem'} !important;
        --text-size-large: ${themeData.textSizes?.large || '1.125rem'} !important;
        --text-size-xl: ${themeData.textSizes?.xl || '1.25rem'} !important;
      }
      /* Font-size precedence:
         1) Per-element inline style (custom slider/settings)
         2) Section/theme fallback in renderers
         3) CSS variable defaults above */
    `;
    
    styleElement.textContent = cssText;

    // Debug logging removed for performance
  }, [themeData, fontFamily, theme, isBuilder]);

  // CRITICAL: Store theme data globally for elementHelpers to access (for inline typography resolution)
  // This allows typography to be resolved per element without CSS variables
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__THEME_DATA__ = {
        defaultFont: themeData.fontFamily || fontFamily,
        textSizes: themeData.textSizes || {
          base: '1rem',
          small: '0.875rem',
          large: '1.125rem',
          xl: '1.25rem',
        },
        headingSizes: themeData.headingSizes || {
          h1: '3rem',
          h2: '2.5rem',
          h3: '2rem',
          h4: '1.5rem',
          h5: '1.25rem',
          h6: '1rem',
        },
        buttonFontSize: themeData.buttonSizes?.fontSize || '1rem',
      };
    }
  }, [themeData, fontFamily]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      themeData, 
      customTheme, 
      setCustomTheme, 
      font, 
      setFont, 
      fontFamily 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
