import type { CustomColorScheme } from "./businessWebsiteConfig";

import {

  PRESET_FONTS,

  DEFAULT_FONT_FAMILY,

} from "@schema/core/presetFonts";
import {
  getPresetIndexByAdminId,
  getThemeSlugForApiFromIndex,
  resolveAdminThemeIdFromSettings,
} from "@schema/core/presetThemeCatalog";
import { resolveSiteTypography } from "@schema/core/siteTypography";



export const PRESET_FONT_OPTIONS = PRESET_FONTS;

export { DEFAULT_FONT_FAMILY };



export const DEFAULT_CUSTOM_COLORS: CustomColorScheme = {

  heading: "#F8FAFC",

  description: "#94A3B8",

  surface: "#0E1214",

  primaryButton: { bg: "#E11D48", text: "#FFFFFF", hover: "#BE123C" },

  secondaryButton: {

    bg: "transparent",

    text: "#F8FAFC",

    border: "#F8FAFC",

    hover: "rgba(248,250,252,0.1)",

  },

  accent: "#E11D48",

};



export function buildTypographyFromFont(fontFamily: string) {

  const font = fontFamily || DEFAULT_FONT_FAMILY;

  return {

    fontFamily: font,

    titleFontFamily: font,

    subtitleFontFamily: font,

    descriptionFontFamily: font,

    buttonFontFamily: font,

  };

}



export function buildFullCustomColorsPayload(customColors: CustomColorScheme) {

  return {

    heading: customColors.heading || "#000000",

    description: customColors.description || "#666666",

    surface: customColors.surface || "#FFFFFF",

    overlay: { color: "rgba(0,0,0,0)", blend: "multiply" },

    primaryButton: {

      bg: customColors.primaryButton?.bg || "#000000",

      text: customColors.primaryButton?.text || "#FFFFFF",

      hover: customColors.primaryButton?.hover || "#333333",

    },

    secondaryButton: {

      bg: customColors.secondaryButton?.bg || "transparent",

      text: customColors.secondaryButton?.text || "#000000",

      border: customColors.secondaryButton?.border || "#000000",

      hover: customColors.secondaryButton?.hover || "rgba(0,0,0,0.1)",

    },

    accent: customColors.accent || "#000000",

    gradient: {

      from: customColors.surface || "#FFFFFF",

      to: customColors.surface || "#F0F0F0",

    },

    ring: customColors.accent || "#000000",

    shadow: "rgba(0,0,0,0.1)",

    badge: {

      text: customColors.heading || "#000000",

      background: "rgba(0,0,0,0.1)",

    },

    trust: {

      text: customColors.description || "#666666",

      dot1: "#22C55E",

      dot2: "#3B82F6",

      dot3: "#F59E0B",

    },

    fontFamily: DEFAULT_FONT_FAMILY,

  };

}



export type ThemeDesignState = {
  selectedTheme: string;
  showCustomColors: boolean;
  customColors: CustomColorScheme;
  selectedFont: string;
};

type PresetThemeSwatch = {
  id: string;
  name: string;
  primary: string;
  surface: string;
  heading: string;
  description: string;
};

/** Derive wizard color-scheme fields from the current theme selection (uses refs at save time). */
export function buildColorSchemeFromThemeState(
  state: ThemeDesignState,
  presetThemes: ReadonlyArray<PresetThemeSwatch>
) {
  if (state.showCustomColors) {
    return {
      id: "custom",
      name: "Custom Theme",
      primary: state.customColors.primaryButton.bg,
      secondary: state.customColors.accent,
      accent: state.customColors.accent,
      description: "Your custom color scheme",
    };
  }

  const preset = presetThemes.find((t) => t.id === state.selectedTheme);
  return {
    id: state.selectedTheme,
    name: preset?.name || "Crimson Jet",
    primary: preset?.primary || "#E11D48",
    secondary: preset?.surface || "#0E1214",
    accent: preset?.heading || "#F8FAFC",
    description: preset?.description || "Bold and modern",
  };
}

export function buildThemeApiPayload(input: {

  projectId: string;

  userId?: string;

  selectedTheme: string;

  showCustomColors: boolean;

  customColors: CustomColorScheme;

  selectedFont: string;

}) {

  const themeToSave = input.showCustomColors ? "custom" : input.selectedTheme;

  const font = input.selectedFont || DEFAULT_FONT_FAMILY;

  const typography = buildTypographyFromFont(font);



  const presetIndex =
    themeToSave === "custom" ? -1 : getPresetIndexByAdminId(themeToSave);

  const canonicalTheme =
    presetIndex >= 0 ? getThemeSlugForApiFromIndex(presetIndex) : themeToSave;

  const payload: Record<string, unknown> = {

    projectId: input.projectId,

    userId: input.userId || "",

    theme: canonicalTheme,

    presetId: presetIndex >= 0 ? String(presetIndex) : null,

    defaultFont: font,

    defaultTypography: typography,

  };



  if (input.showCustomColors && input.customColors) {

    payload.customColors = {

      ...buildFullCustomColorsPayload(input.customColors),

      fontFamily: font,

    };

  } else {

    payload.customColors = { fontFamily: font };

  }



  return payload;

}



export function parseThemeSettingsFromApi(data: any = {}) {

  const rawTheme = String(data?.theme || "crimson-jet");

  const showCustomColors = rawTheme === "custom";

  const selectedTheme = showCustomColors
    ? "crimson-jet"
    : resolveAdminThemeIdFromSettings(data);

  const selectedFont = resolveSiteTypography(data).descriptionFontFamily || DEFAULT_FONT_FAMILY;



  const cc = data?.customColors || {};

  const customColors: CustomColorScheme = showCustomColors

    ? {

        heading: cc.heading || DEFAULT_CUSTOM_COLORS.heading,

        description: cc.description || DEFAULT_CUSTOM_COLORS.description,

        surface: cc.surface || DEFAULT_CUSTOM_COLORS.surface,

        primaryButton: {

          bg: cc.primaryButton?.bg || DEFAULT_CUSTOM_COLORS.primaryButton.bg,

          text: cc.primaryButton?.text || DEFAULT_CUSTOM_COLORS.primaryButton.text,

          hover: cc.primaryButton?.hover || DEFAULT_CUSTOM_COLORS.primaryButton.hover,

        },

        secondaryButton: {

          bg: cc.secondaryButton?.bg || DEFAULT_CUSTOM_COLORS.secondaryButton.bg,

          text: cc.secondaryButton?.text || DEFAULT_CUSTOM_COLORS.secondaryButton.text,

          border: cc.secondaryButton?.border || DEFAULT_CUSTOM_COLORS.secondaryButton.border,

          hover: cc.secondaryButton?.hover || DEFAULT_CUSTOM_COLORS.secondaryButton.hover,

        },

        accent: cc.accent || DEFAULT_CUSTOM_COLORS.accent,

      }

    : { ...DEFAULT_CUSTOM_COLORS };



  return {

    selectedTheme,

    showCustomColors,

    selectedFont,

    customColors,

  };

}


