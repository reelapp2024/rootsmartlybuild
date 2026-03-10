
export const getThemeGradient = (theme, colors) => {
  if (colors && colors.gradient) {
    return colors.gradient;
  }
  
  // Fallback gradients per theme
  const gradients = {
    cleaning: 'from-green-600 to-emerald-600',
    plumbing: 'from-blue-600 to-cyan-600', 
    hvac: 'from-orange-600 to-red-600',
    roofing: 'from-slate-600 to-gray-600',
    painting: 'from-purple-600 to-pink-600'
  };
  
  return gradients[theme] || gradients.cleaning;
};

export const getThemeTextGradient = (theme, colors) => {
  // Check if we have a CSS gradient for primary color
  if (colors && colors.primary && colors.primary.includes('linear-gradient')) {
    return 'text-gradient-primary';
  }
  
  const gradient = getThemeGradient(theme, colors);
  return `bg-gradient-to-r ${gradient} bg-clip-text text-transparent`;
};

export const getThemeButtonColors = (theme, colors) => {
  if (colors) {
    return {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      button: colors.button
    };
  }
  
  // Fallback colors per theme
  const buttonColors = {
    cleaning: {
      primary: '#10B981',
      secondary: '#3B82F6',
      accent: '#34D399',
      button: '#10B981'
    },
    plumbing: {
      primary: '#3B82F6', 
      secondary: '#1E40AF',
      accent: '#60A5FA',
      button: '#3B82F6'
    },
    hvac: {
      primary: '#EA580C',
      secondary: '#DC2626', 
      accent: '#F97316',
      button: '#EA580C'
    },
    roofing: {
      primary: '#64748B',
      secondary: '#475569',
      accent: '#94A3B8',
      button: '#64748B'
    },
    painting: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#A855F7',
      button: '#8B5CF6'
    }
  };
  
  return buttonColors[theme] || buttonColors.cleaning;
};

export const applyDynamicColors = (element, colors, theme) => {
  if (!element || !colors) return;
  
  const themeColors = getThemeButtonColors(theme, colors);
  
  // Apply inline styles for immediate color changes
  if (colors.primary && colors.primary.includes('linear-gradient')) {
    element.style.setProperty('--theme-primary-gradient', colors.primary);
    element.style.setProperty('--theme-primary', extractColorFromGradient(colors.primary));
  } else {
    element.style.setProperty('--theme-primary', colors.primary);
  }
  
  if (colors.secondary && colors.secondary.includes('linear-gradient')) {
    element.style.setProperty('--theme-secondary-gradient', colors.secondary);
    element.style.setProperty('--theme-secondary', extractColorFromGradient(colors.secondary));
  } else {
    element.style.setProperty('--theme-secondary', colors.secondary);
  }
  
  element.style.setProperty('--theme-accent', colors.accent);
  element.style.setProperty('--theme-button', colors.button);
};

// Helper function to extract hex color from gradient
const extractColorFromGradient = (color) => {
  if (color && color.includes('linear-gradient')) {
    const hexMatch = color.match(/#[0-9a-fA-F]{6}/);
    return hexMatch ? hexMatch[0] : '#3B82F6';
  }
  return color;
};
