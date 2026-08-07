/**
 * Funky palette helpers for content-website section variants.
 * Visual identity only — GenieBuild editing still uses Section + ElementsSection.
 */

import type { WebsiteElement } from '../../types';
import type React from 'react';
import {
  isDarkCanvasTextColor,
  isLightSurfaceColor,
  resolveIsLightSurface,
} from '../../utils/themeSurface';
import {
  resolveSectionWrapperStyle,
  resolveSectionOverlay,
} from '../../utils/sectionBackground';
import { resolveSectionElement } from '../../elements';

export const FUNKY = {
  fonts: {
    display: '"Syne", "Outfit", system-ui, sans-serif',
    body: '"DM Sans", "Nunito", system-ui, sans-serif',
    accent: '"Caveat", cursive',
  },
  colors: {
    ink: '#1A1025',
    cream: '#FFF8F0',
    lime: '#C8F542',
    coral: '#FF4D6D',
    teal: '#00E5C0',
    sunshine: '#FFE566',
    grape: '#7B5CFF',
    sky: '#5BDBFF',
    blush: '#FFB4C8',
    charcoal: '#2A2135',
    night: '#14101C',
  },
  shadow: '4px 4px 0 #1A1025',
  shadowLg: '8px 8px 0 #1A1025',
  fontsHref:
    'https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=DM+Sans:wght@400;600;700&family=Nunito:wght@400;600;700&family=Outfit:wght@700;800&family=Syne:wght@700;800&display=swap',
} as const;

/** @deprecated use isDarkCanvasTextColor — kept for existing imports */
export const isLightCanvasColor = isDarkCanvasTextColor;

export function funkyFromTheme(tc?: any) {
  return {
    ink: FUNKY.colors.ink,
    cream: FUNKY.colors.cream,
    primary: tc?.buttonBackgroundColor || tc?.accentColor || FUNKY.colors.coral,
    accent: tc?.iconColor || tc?.accentColor || FUNKY.colors.lime,
    secondary: tc?.secondaryColor || FUNKY.colors.teal,
    sunshine: FUNKY.colors.sunshine,
    sky: FUNKY.colors.sky,
    blush: FUNKY.colors.blush,
    charcoal: FUNKY.colors.charcoal,
    grape: FUNKY.colors.grape,
    night: FUNKY.colors.night,
    white: '#FFFFFF',
    muted: '#6B6178',
    mutedOnDark: '#C7CDD6',
  };
}

export function resolveFunkyIsLight(section?: { styles?: any } | null, tc?: any): boolean {
  const s = section?.styles || {};
  return resolveIsLightSurface({
    themeMode: s.themeMode ?? tc?.themeMode ?? 'light',
    backgroundColor: s.backgroundColor,
    fallbackBackgroundColor: FUNKY.colors.cream,
  });
}

/**
 * Readable title/body colors for the active Funky surface (light or dark).
 */
export function funkyTextColors(tc?: any, isLight = true) {
  if (isLight) {
    const titleColor =
      tc?.titleColor && !isDarkCanvasTextColor(tc.titleColor)
        ? String(tc.titleColor)
        : FUNKY.colors.ink;
    const textColor =
      tc?.textColor && !isDarkCanvasTextColor(tc.textColor)
        ? String(tc.textColor)
        : '#6B6178';
    return {
      isLight: true as const,
      titleColor,
      textColor,
      themeMode: 'light' as const,
      themeColors: {
        titleColor,
        textColor,
        subheadingColor: textColor,
        accordionQuestionColor: titleColor,
        accordionAnswerColor: textColor,
        accordionBackgroundColor: '#FFFFFF',
        themeMode: 'light',
      },
    };
  }

  const titleColor =
    tc?.titleColor && !isLightCanvasTextColor(tc.titleColor)
      ? String(tc.titleColor)
      : '#F8FAFC';
  const textColor =
    tc?.textColor && !isLightCanvasTextColor(tc.textColor)
      ? String(tc.textColor)
      : '#C7CDD6';
  return {
    isLight: false as const,
    titleColor,
    textColor,
    themeMode: 'dark' as const,
    themeColors: {
      titleColor,
      textColor,
      subheadingColor: textColor,
      accordionQuestionColor: titleColor,
      accordionAnswerColor: textColor,
      accordionBackgroundColor: FUNKY.colors.charcoal,
      themeMode: 'dark',
    },
  };
}

/** Section + card backgrounds for the active Funky mode. */
export function funkySurfaceColors(isLight: boolean, sectionBg?: string) {
  if (isLight) {
    const bg =
      sectionBg && isLightSurfaceColor(sectionBg) !== false
        ? sectionBg
        : FUNKY.colors.cream;
    return {
      bg,
      card: '#FFFFFF',
      cardAlts: ['#FFFFFF', '#FFE566', '#FFF8F0', '#C8F542', '#FFB4C8', '#5BDBFF'] as string[],
    };
  }
  const bg =
    sectionBg && isLightSurfaceColor(sectionBg) === false
      ? sectionBg
      : FUNKY.colors.night;
  return {
    bg,
    card: FUNKY.colors.charcoal,
    cardAlts: ['#2A2135', '#1F1830', '#241C38', '#1A2230'] as string[],
  };
}

/**
 * Ensure element text color is set for the active surface.
 * Only fills missing/transparent color — never overwrites an explicit user override (SSOT).
 */
export function withFunkyTextStyle(
  style: Record<string, unknown> | undefined | null,
  fallbackColor: string,
  _isLight = true
): Record<string, unknown> {
  const next = { ...(style || {}) };
  const current = next.color != null ? String(next.color).trim() : '';
  if (!current || current === 'transparent') {
    next.color = fallbackColor;
  }
  return next;
}

/**
 * Prefer saved GenieBuild element (so color edits stick) over ephemeral defaults.
 * When preferFallbackText=true (live SiteNext), dynamic content.items titles win.
 * Theme color keys are stripped from DNA via resolveSectionElement (SSOT).
 */
export function mergeFunkyElement(
  section: { elements?: WebsiteElement[] } | null | undefined,
  id: string,
  fallback: WebsiteElement,
  options?: { preferFallbackText?: boolean }
): WebsiteElement {
  const resolved = resolveSectionElement(section as any, { ...fallback, id });
  if (!options?.preferFallbackText) return resolved;
  return {
    ...resolved,
    content: {
      ...(resolved.content as object),
      ...(fallback.content as object),
    },
  };
}

/**
 * Section chrome for Funky variants: shared background resolver + Funky default surface.
 * Spread `wrapperStyle` on the outer section; render overlay when `overlayStyle` is set.
 */
export function resolveFunkySectionChrome(
  styles: any,
  isLight: boolean
): {
  defaultSurface: string;
  wrapperStyle: React.CSSProperties;
  overlayStyle: React.CSSProperties | null;
} {
  const surface = funkySurfaceColors(isLight, styles?.backgroundColor);
  const wrapperStyle = resolveSectionWrapperStyle(styles || {}, {
    defaultSurface: surface.bg,
  });
  return {
    defaultSurface: surface.bg,
    wrapperStyle,
    overlayStyle: resolveSectionOverlay(styles),
  };
}
