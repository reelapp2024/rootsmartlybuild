"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_TYPOGRAPHY, PRESET_THEMES } from '../../constants';

/**
 * Shape of `themeData` published by ThemeProvider. Mirrors PRESET_THEMES[0].elements
 * merged with the currently active typography. Fields are optional because the
 * preset objects evolve — callers should rely on `||` fallbacks, not field presence.
 */
export interface ThemeData {
  name?: string;
  surface?: string;
  heading?: string;
  description?: string;
  accent?: string;
  muted?: string;
  borderColor?: string;
  cardBackground?: string;
  cardBorder?: string;
  iconBg?: string;
  ring?: string;
  primaryButton?: { bg?: string; text?: string; hover?: string; border?: string; [key: string]: any };
  secondaryButton?: { bg?: string; text?: string; hover?: string; border?: string; [key: string]: any };
  badge?: { background?: string; text?: string };
  accordion?: { questionColor?: string; answerColor?: string };
  overlay?: { color?: string; opacity?: number; blend?: string };
  light?: {
    surface?: string;
    heading?: string;
    description?: string;
    accent?: string;
    muted?: string;
    borderColor?: string;
    cardBackground?: string;
    cardBorder?: string;
    iconBg?: string;
    icon?: string;
    subheading?: string;
    secondaryHeading?: string;
    buttonTextColor?: string;
    accordion?: { questionColor?: string; answerColor?: string };
    overlay?: { color?: string; opacity?: number; blend?: string };
    [key: string]: any;
  };
  icon?: string;
  subheading?: string;
  secondaryHeading?: string;
  elements?: any; // PRESET_THEMES[i].elements shape — preserved for raw preset passes
  typography?: typeof DEFAULT_TYPOGRAPHY;
  // Preserve extensibility for dynamically-added preset fields.
  [key: string]: any;
}

interface ThemeContextValue {
  theme: string;
  themeData: ThemeData;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'default',
  themeData: {
    ...PRESET_THEMES[0].elements,
    typography: DEFAULT_TYPOGRAPHY,
  } as ThemeData,
});

export const ThemeProvider = ({
  children,
  projectId,
  isBuilder,
  typography,
}: {
  children: React.ReactNode;
  projectId: string | null;
  isBuilder: boolean;
  typography?: typeof DEFAULT_TYPOGRAPHY;
}) => {
  const [activeTypography, setActiveTypography] = useState(typography || DEFAULT_TYPOGRAPHY);
  // Reactive theme — starts at Crimson Jet but updates when 'geniebuild-theme-change' fires
  const [activeThemeElements, setActiveThemeElements] = useState<ThemeData>(PRESET_THEMES[0].elements as ThemeData);

  useEffect(() => {
    setActiveTypography(typography || DEFAULT_TYPOGRAPHY);
  }, [typography]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const typoHandler = (e: any) => {
      const next = e?.detail?.typography;
      if (next) setActiveTypography(next);
    };
    const themeHandler = (e: any) => {
      const next = e?.detail?.themeElements;
      if (next) setActiveThemeElements(next);
    };
    window.addEventListener('geniebuild-typography-change', typoHandler as any);
    window.addEventListener('geniebuild-theme-change', themeHandler as any);
    return () => {
      window.removeEventListener('geniebuild-typography-change', typoHandler as any);
      window.removeEventListener('geniebuild-theme-change', themeHandler as any);
    };
  }, []);

  const themeData = useMemo<ThemeData>(
    () => ({
      ...activeThemeElements,
      typography: activeTypography,
    }),
    [activeTypography, activeThemeElements]
  );
  return (
    <ThemeContext.Provider value={{ theme: 'default', themeData }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
