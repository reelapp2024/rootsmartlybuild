import { DEFAULT_FONT_FAMILY, normalizePresetFontFamily } from "./presetFonts";

export type SiteTypography = {
  titleFontFamily: string;
  subtitleFontFamily: string;
  descriptionFontFamily: string;
  buttonFontFamily: string;
};

export type ThemeSettingsTypographyInput = {
  defaultFont?: string | null;
  defaultTypography?: Record<string, string | null | undefined> | null;
  customColors?: { fontFamily?: string | null } | null;
  defaultSizes?: Record<string, string | null | undefined> | null;
} | null | undefined;

const TITLE_FALLBACK = '"Poppins", sans-serif';
const BODY_FALLBACK = '"Inter", sans-serif';

export const DEFAULT_SITE_SIZES = {
  h1: "3rem",
  h2: "2.5rem",
  h3: "2rem",
  h4: "1.5rem",
  h5: "1.25rem",
  h6: "1rem",
  text: "1rem",
  textSmall: "0.875rem",
  textLarge: "1.125rem",
  textXl: "1.25rem",
} as const;

/** Single resolver for saved theme font settings (admin, GenieBuild, SiteNextJS). */
export function resolveSiteTypography(
  settings: ThemeSettingsTypographyInput
): SiteTypography {
  const dt = settings?.defaultTypography || {};
  const shared = normalizePresetFontFamily(
    String(
      settings?.defaultFont ||
        dt.fontFamily ||
        settings?.customColors?.fontFamily ||
        ""
    ),
    ""
  );

  const titleFontFamily = normalizePresetFontFamily(
    String(dt.titleFontFamily || shared || TITLE_FALLBACK),
    TITLE_FALLBACK
  );
  const subtitleFontFamily = normalizePresetFontFamily(
    String(dt.subtitleFontFamily || dt.titleFontFamily || shared || titleFontFamily),
    titleFontFamily
  );
  const descriptionFontFamily = normalizePresetFontFamily(
    String(dt.descriptionFontFamily || shared || BODY_FALLBACK),
    BODY_FALLBACK
  );
  const buttonFontFamily = normalizePresetFontFamily(
    String(dt.buttonFontFamily || shared || descriptionFontFamily),
    descriptionFontFamily
  );

  return {
    titleFontFamily,
    subtitleFontFamily,
    descriptionFontFamily,
    buttonFontFamily,
  };
}

export function resolveSiteFontSizes(settings: ThemeSettingsTypographyInput) {
  const sizes = settings?.defaultSizes || {};
  return {
    h1: sizes.h1 || DEFAULT_SITE_SIZES.h1,
    h2: sizes.h2 || DEFAULT_SITE_SIZES.h2,
    h3: sizes.h3 || DEFAULT_SITE_SIZES.h3,
    h4: sizes.h4 || DEFAULT_SITE_SIZES.h4,
    h5: sizes.h5 || DEFAULT_SITE_SIZES.h5,
    h6: sizes.h6 || DEFAULT_SITE_SIZES.h6,
    text: sizes.text || DEFAULT_SITE_SIZES.text,
    textSmall: sizes.textSmall || DEFAULT_SITE_SIZES.textSmall,
    textLarge: sizes.textLarge || DEFAULT_SITE_SIZES.textLarge,
    textXl: sizes.textXl || DEFAULT_SITE_SIZES.textXl,
  };
}

/** Shared canvas / live-site typography CSS — GenieBuild + SiteNextJS. */
export function buildSiteTypographyCss(
  typography: SiteTypography,
  sizes: Record<string, string> = { ...DEFAULT_SITE_SIZES }
): string {
  const { titleFontFamily, subtitleFontFamily, descriptionFontFamily, buttonFontFamily } =
    typography;

  return `
    .h1-default { font-size: ${sizes.h1} !important; }
    .h2-default { font-size: ${sizes.h2} !important; }
    .h3-default { font-size: ${sizes.h3} !important; }
    .h4-default { font-size: ${sizes.h4} !important; }
    .h5-default { font-size: ${sizes.h5} !important; }
    .h6-default { font-size: ${sizes.h6} !important; }
    .text-default { font-size: ${sizes.text} !important; }
    .text-small { font-size: ${sizes.textSmall} !important; }
    .text-large { font-size: ${sizes.textLarge} !important; }
    .text-xl { font-size: ${sizes.textXl} !important; }

    #canvas-root {
      font-family: ${descriptionFontFamily};
    }

    #canvas-root p,
    #canvas-root span,
    #canvas-root li,
    #canvas-root blockquote,
    #canvas-root label,
    #canvas-root input,
    #canvas-root textarea,
    #canvas-root a,
    #canvas-root div,
    #canvas-root details,
    #canvas-root summary {
      font-family: ${descriptionFontFamily};
    }

    #canvas-root h1,
    #canvas-root h3,
    #canvas-root h4,
    #canvas-root h5,
    #canvas-root h6,
    #canvas-root .acc-q {
      font-family: ${titleFontFamily};
    }

    #canvas-root h2 {
      font-family: ${subtitleFontFamily};
    }

    #canvas-root button,
    #canvas-root a[role="button"] {
      font-family: ${buttonFontFamily};
    }
  `;
}

export function typographyFromDefaultTypographyState(state: {
  titleFontFamily?: string;
  subtitleFontFamily?: string;
  descriptionFontFamily?: string;
  buttonFontFamily?: string;
}): SiteTypography {
  return resolveSiteTypography({
    defaultTypography: {
      titleFontFamily: state.titleFontFamily,
      subtitleFontFamily: state.subtitleFontFamily,
      descriptionFontFamily: state.descriptionFontFamily,
      buttonFontFamily: state.buttonFontFamily,
    },
  });
}
