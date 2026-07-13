
import { WebsiteData, Section, WebsiteElement } from './types';

/** Default heading level for image-box card titles (design + canvas). */
export const IMAGE_BOX_DEFAULT_TITLE_HEADING = 'h5' as const;

// Global Element Defaults - Universal baseline styles for all elements
// NOTE: No color properties here - elements inherit from theme via ElementsSection
export const ELEMENT_DEFAULTS: Record<string, any> = {
  // ── Layout / Container elements ──────────────────────────────────────────
  card: {
    padding: '0px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  divider: {},
  spacer: {},

  // ── Text elements ─────────────────────────────────────────────────────────
  heading: { fontWeight: 'bold', textAlign: 'center' },
  text: { opacity: 1, textAlign: 'left', fontSize: '16px', lineHeight: '1.7' },
  blockquote: {
    padding: '16px 20px',
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderRadius: '0 8px 8px 0',
    fontSize: '16px',
    fontStyle: 'italic',
  },
  'highlight-text': { fontSize: '16px', lineHeight: '1.7' },

  // ── Interactive / Action elements ─────────────────────────────────────────
  button: { padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' },
  'call-to-action': {
    padding: '24px 32px',
    borderRadius: '16px',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // ── Media elements ────────────────────────────────────────────────────────
  image: {
    objectFit: 'cover',
    width: '100%',
    aspectRatio: 'auto',
    borderRadius: '0px',
    borderWidth: '0px',
    borderStyle: 'none',
    borderColor: 'transparent',
    boxShadow: 'none',
    filter: 'none',
  },
  'image-box': {
    borderRadius: '12px',
    imageHeight: '12rem',
    imageObjectFit: 'cover',
    contentPadding: '1.25rem',
    contentGap: '0.5rem',
    titleHeadingTag: IMAGE_BOX_DEFAULT_TITLE_HEADING,
  },
  video: {
    borderRadius: '12px',
    overflow: 'hidden',
    aspectRatio: '16/9',
    width: '100%',
  },

  // ── Icon elements ─────────────────────────────────────────────────────────
  icon: { fontSize: '32px' },
  'icon-box': {
    padding: '24px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    textAlign: 'center',
    iconSize: '32px',
    iconContainerSize: '56px',
    gap: '12px',
  },

  // ── Feature / Content blocks ──────────────────────────────────────────────
  'feature-box': {
    padding: '24px',
    borderRadius: '16px',
    iconSize: '24px',
    iconContainerSize: '48px',
    titleFontSize: '18px',
    titleFontWeight: '700',
    descriptionFontSize: '14px',
    lineHeight: '1.6',
  },
  list: {
    fontSize: '16px',
    lineHeight: '2',
    gap: '8px',
    iconSize: '16px',
  },

  // ── Rating / Social proof ─────────────────────────────────────────────────
  'star-rating': { gap: '4px', iconSize: '20px' },
  badge: { padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' },
  'user-avatars': { avatarSize: '40px', overlap: '-12px' },
  testimonial: {
    padding: '24px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    gap: '16px',
    fontSize: '14px',
  },
  'testimonial-card': {
    padding: '1.75rem',
    borderRadius: '1rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    avatarSize: '2.75rem',
    avatarBorderRadius: '50%',
    quoteFontSize: '0.95rem',
    quoteLineHeight: '1.65',
    quoteFontStyle: 'normal',
    titleFontSize: '0.95rem',
    titleFontWeight: '700',
    descriptionFontSize: '0.75rem',
    descriptionFontWeight: '400',
    starSize: '0.95rem',
  },
  'review-carousel': {
    padding: '32px',
    borderRadius: '20px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '14px',
    lineHeight: '1.7',
  },

  // ── Pricing elements ──────────────────────────────────────────────────────
  'pricing-item': {
    padding: '0px',
    borderRadius: '20px',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  'pricing-table': {
    padding: '32px',
    borderRadius: '20px',
    borderWidth: '1px',
    borderStyle: 'solid',
    textAlign: 'center',
  },

  // ── Interactive disclosure ────────────────────────────────────────────────
  accordion: {
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '0px',
    gap: '12px',
  },
  toggle: {
    borderRadius: '12px',
    padding: '16px',
    fontSize: '15px',
  },
  tabs: {
    borderRadius: '12px',
    gap: '8px',
    padding: '8px',
    tabFontSize: '14px',
    tabFontWeight: '600',
  },

  // ── Data display ──────────────────────────────────────────────────────────
  'stat-card': {
    padding: '24px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    valueFontSize: '36px',
    valueFontWeight: '800',
    labelFontSize: '13px',
  },
  counter: {
    textAlign: 'center',
    valueFontSize: '48px',
    valueFontWeight: '800',
    labelFontSize: '14px',
    gap: '8px',
  },
  'progress-bar': {
    height: '10px',
    borderRadius: '9999px',
    labelFontSize: '14px',
    gap: '8px',
  },

  // ── Complex / Special ────────────────────────────────────────────────────
  'flip-box': {
    height: '260px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '24px',
    textAlign: 'center',
  },
  'alert-box': {
    padding: '16px 20px',
    borderRadius: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderLeftWidth: '4px',
    fontSize: '14px',
    gap: '10px',
  },
  'countdown-timer': {
    textAlign: 'center',
    gap: '16px',
    digitFontSize: '48px',
    digitFontWeight: '800',
    labelFontSize: '12px',
  },
  'logo-cloud': {
    gap: '48px',
    logoHeight: '32px',
    padding: '16px 0',
    opacity: 0.5,
  },
  'trust-strip': {
    gap: '24px',
    padding: '12px 0',
    iconSize: '16px',
    iconContainerSize: '32px',
    iconBorderRadius: '9999px',
    titleFontSize: '13px',
    titleFontWeight: '600',
  },
  'table': {
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '14px',
    padding: '0px',
  },
};

export {
  PRESET_FONTS,
  DEFAULT_FONT_FAMILY,
  normalizePresetFontFamily,
  buildGoogleFontsCssUrl,
} from '../../packages/schema/src/presetFonts';
export {
  resolveSiteTypography,
  resolveSiteFontSizes,
  buildSiteTypographyCss,
  typographyFromDefaultTypographyState,
} from '../../packages/schema/src/siteTypography';
export {
  sortSectionObjectsByCanonicalOrder,
  sortSectionIdsByCanonicalOrder,
  CANONICAL_HOME_SECTION_ORDER,
  CANONICAL_SERVICE_SECTION_ORDER,
} from '../../backend/additional/siteSectionOrder.mjs';

// Shared typography for all themes — Poppins (headings/buttons) + Inter (body/captions)
const THEME_TYPOGRAPHY = {
  heading: '"Poppins", sans-serif',
  body: '"Inter", sans-serif',
  button: '"Poppins", sans-serif',
  caption: '"Inter", sans-serif',
};

export const PRESET_THEMES = [
  {
    "name": "Crimson Jet",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#F8FAFC", "description": "#B8C5D0", "surface": "#0C1015",
      "cardBackground": "#131A20", "cardBorder": "rgba(244,63,94,0.12)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#6B7A8D",
      "overlay": { "color": "#1A050C", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#E11D48", "text": "#FFFFFF", "hover": "#BE123C" },
      "secondaryButton": { "bg": "rgba(225,29,72,0.08)", "text": "#F8FAFC", "border": "#E11D48", "hover": "rgba(244,63,94,0.18)" },
      "icon": "#E11D48", "iconBg": "rgba(225,29,72,0.12)",
      "featureBox": { "background": "#131A20", "border": "rgba(244,63,94,0.14)", "iconColor": "#E11D48", "iconBg": "rgba(225,29,72,0.12)", "titleColor": "#F8FAFC", "textColor": "#B8C5D0" },
      "subheading": "#F43F5E", "secondaryHeading": "#E11D48",
      "accent": "#F59E0B",
      "gradient": { "from": "#0C1015", "to": "#1B2330" },
      "ring": "#F43F5E", "shadow": "rgba(225,29,72,0.20)",
      "badge": { "text": "#FFFFFF", "background": "rgba(225,29,72,0.18)" },
      "trust": { "text": "#B8C5D0", "dot1": "#22C55E", "dot2": "#60A5FA", "dot3": "#F59E0B" },
      "accordion": { "questionColor": "#F8FAFC", "answerColor": "#B8C5D0" },
      "link": "#F43F5E", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#131A20", "inputBorder": "rgba(244,63,94,0.25)", "inputText": "#F8FAFC", "inputPlaceholder": "#6B7A8D",
      "navBackground": "#0C1015", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#080C10",
      "light": {
        "surface": "#FFFFFF", "heading": "#0F172A", "description": "#374151",
        "cardBackground": "#FFF1F3", "cardBorder": "rgba(225,29,72,0.10)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#9CA3AF", "accent": "#E11D48",
        "subheading": "#E11D48", "secondaryHeading": "#E11D48",
        "icon": "#E11D48", "iconBg": "rgba(225,29,72,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(225,29,72,0.10)", "iconColor": "#E11D48", "iconBg": "rgba(225,29,72,0.10)", "titleColor": "#0F172A", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#E11D48", "text": "#FFFFFF", "hover": "#BE123C" },
        "badge": { "text": "#FFFFFF", "background": "rgba(225,29,72,0.12)" },
        "trust": { "text": "#6B7280", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#E11D48",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#0F172A", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#FFFFFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#0F172A", "answerColor": "#374151" }
      }
    }
  },
  {
    "name": "Indigo Sand",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#EEF2FF", "description": "#A5B4CE", "surface": "#0D1117",
      "cardBackground": "#131925", "cardBorder": "rgba(99,102,241,0.12)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#64748B",
      "overlay": { "color": "#1C0F00", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#6366F1", "text": "#FFFFFF", "hover": "#4F46E5" },
      "secondaryButton": { "bg": "rgba(99,102,241,0.08)", "text": "#EEF2FF", "border": "#6366F1", "hover": "rgba(129,140,248,0.18)" },
      "icon": "#818CF8", "iconBg": "rgba(99,102,241,0.12)",
      "featureBox": { "background": "#131925", "border": "rgba(99,102,241,0.14)", "iconColor": "#818CF8", "iconBg": "rgba(99,102,241,0.12)", "titleColor": "#EEF2FF", "textColor": "#A5B4CE" },
      "subheading": "#818CF8", "secondaryHeading": "#6366F1",
      "accent": "#FB923C",
      "gradient": { "from": "#0D1117", "to": "#161E2E" },
      "ring": "#818CF8", "shadow": "rgba(99,102,241,0.22)",
      "badge": { "text": "#EEF2FF", "background": "rgba(99,102,241,0.18)" },
      "trust": { "text": "#A5B4CE", "dot1": "#34D399", "dot2": "#818CF8", "dot3": "#FB923C" },
      "accordion": { "questionColor": "#EEF2FF", "answerColor": "#A5B4CE" },
      "link": "#818CF8", "success": "#34D399", "warning": "#FB923C", "error": "#F87171",
      "inputBg": "#131925", "inputBorder": "rgba(99,102,241,0.25)", "inputText": "#EEF2FF", "inputPlaceholder": "#64748B",
      "navBackground": "#0D1117", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#090D13",
      "light": {
        "surface": "#FFFFFF", "heading": "#1E1B4B", "description": "#374151",
        "cardBackground": "#F5F3FF", "cardBorder": "rgba(99,102,241,0.10)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#9CA3AF", "accent": "#6366F1",
        "subheading": "#6366F1", "secondaryHeading": "#6366F1",
        "icon": "#6366F1", "iconBg": "rgba(99,102,241,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(99,102,241,0.12)", "iconColor": "#6366F1", "iconBg": "rgba(99,102,241,0.10)", "titleColor": "#1E1B4B", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#6366F1", "text": "#FFFFFF", "hover": "#4F46E5" },
        "badge": { "text": "#FFFFFF", "background": "rgba(99,102,241,0.12)" },
        "trust": { "text": "#6B7280", "dot1": "#34D399", "dot2": "#6366F1", "dot3": "#FB923C" },
        "link": "#6366F1",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#1E1B4B", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#FFFFFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#1E1B4B", "answerColor": "#374151" }
      }
    }
  },
  {
    "name": "Saffron Charcoal",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FFFBEB", "description": "#D6D3D1", "surface": "#0A0A0A",
      "cardBackground": "#141414", "cardBorder": "rgba(251,191,36,0.12)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#78716C",
      "overlay": { "color": "#020C14", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#FBBF24", "text": "#1A1306", "hover": "#F59E0B" },
      "secondaryButton": { "bg": "rgba(251,191,36,0.08)", "text": "#FFFBEB", "border": "#FBBF24", "hover": "rgba(251,191,36,0.18)" },
      "icon": "#FBBF24", "iconBg": "rgba(251,191,36,0.10)",
      "featureBox": { "background": "#141414", "border": "rgba(251,191,36,0.16)", "iconColor": "#FBBF24", "iconBg": "rgba(251,191,36,0.12)", "titleColor": "#F9FAFB", "textColor": "#C7C3B0" },
      "subheading": "#FDE68A", "secondaryHeading": "#FBBF24",
      "accent": "#38BDF8",
      "gradient": { "from": "#0A0A0A", "to": "#1C1C1C" },
      "ring": "#FDE68A", "shadow": "rgba(251,191,36,0.18)",
      "badge": { "text": "#1A1306", "background": "rgba(251,191,36,0.20)" },
      "trust": { "text": "#D6D3D1", "dot1": "#4ADE80", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#FFFBEB", "answerColor": "#D6D3D1" },
      "link": "#FDE68A", "success": "#4ADE80", "warning": "#FBBF24", "error": "#F87171",
      "inputBg": "#141414", "inputBorder": "rgba(251,191,36,0.22)", "inputText": "#FFFBEB", "inputPlaceholder": "#78716C",
      "navBackground": "#0A0A0A", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#060606",
      "light": {
        "surface": "#FFFBEB", "heading": "#1A1306", "description": "#44403C",
        "cardBackground": "#FEF9C3", "cardBorder": "rgba(251,191,36,0.20)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#78716C", "accent": "#F59E0B",
        "subheading": "#D97706", "secondaryHeading": "#B45309",
        "icon": "#D97706", "iconBg": "rgba(251,191,36,0.12)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(217,119,6,0.15)", "iconColor": "#D97706", "iconBg": "rgba(251,191,36,0.15)", "titleColor": "#1C1917", "textColor": "#57534E" },
        "primaryButton": { "bg": "#F59E0B", "text": "#1A1306", "hover": "#D97706" },
        "badge": { "text": "#1A1306", "background": "rgba(251,191,36,0.25)" },
        "trust": { "text": "#57534E", "dot1": "#4ADE80", "dot2": "#38BDF8", "dot3": "#F59E0B" },
        "link": "#D97706",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#1A1306", "inputPlaceholder": "#78716C",
        "overlay": { "color": "#FFFBEB", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#1A1306", "answerColor": "#44403C" }
      }
    }
  },
  {
    "name": "Mint Slate",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#F0FDF4", "description": "#86EFAC", "surface": "#061209",
      "cardBackground": "#0C1F10", "cardBorder": "rgba(16,185,129,0.14)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#4B7A5A",
      "overlay": { "color": "#021408", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#10B981", "text": "#022C22", "hover": "#059669" },
      "secondaryButton": { "bg": "rgba(16,185,129,0.08)", "text": "#F0FDF4", "border": "#10B981", "hover": "rgba(52,211,153,0.18)" },
      "icon": "#34D399", "iconBg": "rgba(16,185,129,0.12)",
      "featureBox": { "background": "#0C1F10", "border": "rgba(16,185,129,0.16)", "iconColor": "#34D399", "iconBg": "rgba(16,185,129,0.12)", "titleColor": "#ECFDF5", "textColor": "#A7D7B8" },
      "subheading": "#6EE7B7", "secondaryHeading": "#10B981",
      "accent": "#60A5FA",
      "gradient": { "from": "#061209", "to": "#0F2318" },
      "ring": "#34D399", "shadow": "rgba(16,185,129,0.18)",
      "badge": { "text": "#022C22", "background": "rgba(16,185,129,0.20)" },
      "trust": { "text": "#86EFAC", "dot1": "#34D399", "dot2": "#60A5FA", "dot3": "#A78BFA" },
      "accordion": { "questionColor": "#F0FDF4", "answerColor": "#86EFAC" },
      "link": "#34D399", "success": "#10B981", "warning": "#FBBF24", "error": "#F87171",
      "inputBg": "#0C1F10", "inputBorder": "rgba(16,185,129,0.25)", "inputText": "#F0FDF4", "inputPlaceholder": "#4B7A5A",
      "navBackground": "#061209", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#030B06",
      "light": {
        "surface": "#F0FDF4", "heading": "#052E16", "description": "#166534",
        "cardBackground": "#DCFCE7", "cardBorder": "rgba(16,185,129,0.15)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#6B7280", "accent": "#10B981",
        "subheading": "#059669", "secondaryHeading": "#065F46",
        "icon": "#10B981", "iconBg": "rgba(16,185,129,0.10)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(16,185,129,0.15)", "iconColor": "#10B981", "iconBg": "rgba(16,185,129,0.12)", "titleColor": "#064E3B", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#10B981", "text": "#022C22", "hover": "#059669" },
        "badge": { "text": "#022C22", "background": "rgba(16,185,129,0.18)" },
        "trust": { "text": "#374151", "dot1": "#10B981", "dot2": "#3B82F6", "dot3": "#A78BFA" },
        "link": "#059669",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#052E16", "inputPlaceholder": "#6B7280",
        "overlay": { "color": "#F0FDF4", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#052E16", "answerColor": "#166534" }
      }
    }
  },
  {
    "name": "Marine Teal",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#ECFEFF", "description": "#A5F3FC", "surface": "#040E14",
      "cardBackground": "#091820", "cardBorder": "rgba(6,182,212,0.14)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#2E6A7A",
      "overlay": { "color": "#020C14", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#06B6D4", "text": "#000D14", "hover": "#0891B2" },
      "secondaryButton": { "bg": "rgba(6,182,212,0.08)", "text": "#ECFEFF", "border": "#06B6D4", "hover": "rgba(34,211,238,0.18)" },
      "icon": "#22D3EE", "iconBg": "rgba(6,182,212,0.12)",
      "featureBox": { "background": "#091820", "border": "rgba(6,182,212,0.16)", "iconColor": "#22D3EE", "iconBg": "rgba(6,182,212,0.12)", "titleColor": "#ECFEFF", "textColor": "#A6C7CE" },
      "subheading": "#67E8F9", "secondaryHeading": "#06B6D4",
      "accent": "#C084FC",
      "gradient": { "from": "#040E14", "to": "#08243A" },
      "ring": "#22D3EE", "shadow": "rgba(6,182,212,0.18)",
      "badge": { "text": "#000D14", "background": "rgba(6,182,212,0.22)" },
      "trust": { "text": "#A5F3FC", "dot1": "#4ADE80", "dot2": "#22D3EE", "dot3": "#C084FC" },
      "accordion": { "questionColor": "#ECFEFF", "answerColor": "#A5F3FC" },
      "link": "#22D3EE", "success": "#4ADE80", "warning": "#FBBF24", "error": "#F87171",
      "inputBg": "#091820", "inputBorder": "rgba(6,182,212,0.25)", "inputText": "#ECFEFF", "inputPlaceholder": "#2E6A7A",
      "navBackground": "#040E14", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#020A0F",
      "light": {
        "surface": "#F0FDFE", "heading": "#083344", "description": "#164E63",
        "cardBackground": "#CFFAFE", "cardBorder": "rgba(6,182,212,0.15)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#6B7280", "accent": "#06B6D4",
        "subheading": "#0891B2", "secondaryHeading": "#0E7490",
        "icon": "#06B6D4", "iconBg": "rgba(6,182,212,0.10)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(6,182,212,0.15)", "iconColor": "#06B6D4", "iconBg": "rgba(6,182,212,0.12)", "titleColor": "#083344", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#06B6D4", "text": "#000D14", "hover": "#0891B2" },
        "badge": { "text": "#000D14", "background": "rgba(6,182,212,0.18)" },
        "trust": { "text": "#374151", "dot1": "#4ADE80", "dot2": "#06B6D4", "dot3": "#C084FC" },
        "link": "#0891B2",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#083344", "inputPlaceholder": "#6B7280",
        "overlay": { "color": "#F0FDFE", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#083344", "answerColor": "#164E63" }
      }
    }
  },
  {
    "name": "Royal Plum Noir",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FAF5FF", "description": "#DDD6FE", "surface": "#09060F",
      "cardBackground": "#110D1C", "cardBorder": "rgba(139,92,246,0.14)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#5B4B7A",
      "overlay": { "color": "#0F0520", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#8B5CF6", "text": "#FFFFFF", "hover": "#7C3AED" },
      "secondaryButton": { "bg": "rgba(139,92,246,0.08)", "text": "#FAF5FF", "border": "#8B5CF6", "hover": "rgba(167,139,250,0.18)" },
      "icon": "#A78BFA", "iconBg": "rgba(139,92,246,0.12)",
      "featureBox": { "background": "#110D1C", "border": "rgba(139,92,246,0.16)", "iconColor": "#A78BFA", "iconBg": "rgba(139,92,246,0.12)", "titleColor": "#F5F3FF", "textColor": "#B8ADC9" },
      "subheading": "#C4B5FD", "secondaryHeading": "#8B5CF6",
      "accent": "#F472B6",
      "gradient": { "from": "#09060F", "to": "#1A1030" },
      "ring": "#A78BFA", "shadow": "rgba(139,92,246,0.22)",
      "badge": { "text": "#FAF5FF", "background": "rgba(139,92,246,0.20)" },
      "trust": { "text": "#DDD6FE", "dot1": "#4ADE80", "dot2": "#60A5FA", "dot3": "#F472B6" },
      "accordion": { "questionColor": "#FAF5FF", "answerColor": "#DDD6FE" },
      "link": "#C4B5FD", "success": "#4ADE80", "warning": "#FBBF24", "error": "#F87171",
      "inputBg": "#110D1C", "inputBorder": "rgba(139,92,246,0.28)", "inputText": "#FAF5FF", "inputPlaceholder": "#5B4B7A",
      "navBackground": "#09060F", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#060409",
      "light": {
        "surface": "#FAF5FF", "heading": "#2E1065", "description": "#4C1D95",
        "cardBackground": "#EDE9FE", "cardBorder": "rgba(139,92,246,0.12)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#9CA3AF", "accent": "#8B5CF6",
        "subheading": "#7C3AED", "secondaryHeading": "#6D28D9",
        "icon": "#8B5CF6", "iconBg": "rgba(139,92,246,0.10)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(139,92,246,0.14)", "iconColor": "#8B5CF6", "iconBg": "rgba(139,92,246,0.12)", "titleColor": "#1E1B4B", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#8B5CF6", "text": "#FFFFFF", "hover": "#7C3AED" },
        "badge": { "text": "#FFFFFF", "background": "rgba(139,92,246,0.15)" },
        "trust": { "text": "#6B7280", "dot1": "#4ADE80", "dot2": "#6366F1", "dot3": "#F472B6" },
        "link": "#7C3AED",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#2E1065", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#FAF5FF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#2E1065", "answerColor": "#4C1D95" }
      }
    }
  },
  {
    "name": "Electric Cobalt",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#EFF6FF", "description": "#93C5FD", "surface": "#060C18",
      "cardBackground": "#0C1628", "cardBorder": "rgba(59,130,246,0.14)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#2E4A6A",
      "overlay": { "color": "#04091A", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#3B82F6", "text": "#FFFFFF", "hover": "#2563EB" },
      "secondaryButton": { "bg": "rgba(59,130,246,0.08)", "text": "#EFF6FF", "border": "#3B82F6", "hover": "rgba(96,165,250,0.18)" },
      "icon": "#60A5FA", "iconBg": "rgba(59,130,246,0.12)",
      "featureBox": { "background": "#0C1628", "border": "rgba(59,130,246,0.16)", "iconColor": "#60A5FA", "iconBg": "rgba(59,130,246,0.12)", "titleColor": "#EFF6FF", "textColor": "#AABCD1" },
      "subheading": "#93C5FD", "secondaryHeading": "#3B82F6",
      "accent": "#34D399",
      "gradient": { "from": "#060C18", "to": "#0F1F3D" },
      "ring": "#60A5FA", "shadow": "rgba(59,130,246,0.22)",
      "badge": { "text": "#EFF6FF", "background": "rgba(59,130,246,0.20)" },
      "trust": { "text": "#93C5FD", "dot1": "#34D399", "dot2": "#60A5FA", "dot3": "#F472B6" },
      "accordion": { "questionColor": "#EFF6FF", "answerColor": "#93C5FD" },
      "link": "#60A5FA", "success": "#34D399", "warning": "#FBBF24", "error": "#F87171",
      "inputBg": "#0C1628", "inputBorder": "rgba(59,130,246,0.28)", "inputText": "#EFF6FF", "inputPlaceholder": "#2E4A6A",
      "navBackground": "#060C18", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#03070F",
      "light": {
        "surface": "#EFF6FF", "heading": "#1E3A5F", "description": "#1E40AF",
        "cardBackground": "#DBEAFE", "cardBorder": "rgba(59,130,246,0.12)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#9CA3AF", "accent": "#3B82F6",
        "subheading": "#2563EB", "secondaryHeading": "#1D4ED8",
        "icon": "#3B82F6", "iconBg": "rgba(59,130,246,0.10)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(59,130,246,0.14)", "iconColor": "#3B82F6", "iconBg": "rgba(59,130,246,0.12)", "titleColor": "#1E3A8A", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#3B82F6", "text": "#FFFFFF", "hover": "#2563EB" },
        "badge": { "text": "#FFFFFF", "background": "rgba(59,130,246,0.15)" },
        "trust": { "text": "#6B7280", "dot1": "#34D399", "dot2": "#3B82F6", "dot3": "#F472B6" },
        "link": "#2563EB",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#1E3A5F", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#EFF6FF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#1E3A5F", "answerColor": "#1E40AF" }
      }
    }
  },
  {
    "name": "Copper Forest",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FEF3C7", "description": "#D4C5A9", "surface": "#090E08",
      "cardBackground": "#111A0E", "cardBorder": "rgba(234,88,12,0.14)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#576047",
      "overlay": { "color": "#1A0D04", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#EA580C", "text": "#FFFFFF", "hover": "#C2410C" },
      "secondaryButton": { "bg": "rgba(234,88,12,0.08)", "text": "#FEF3C7", "border": "#EA580C", "hover": "rgba(251,146,60,0.18)" },
      "icon": "#FB923C", "iconBg": "rgba(234,88,12,0.12)",
      "featureBox": { "background": "#111A0E", "border": "rgba(234,88,12,0.16)", "iconColor": "#FB923C", "iconBg": "rgba(234,88,12,0.12)", "titleColor": "#FFF7ED", "textColor": "#B8C2AD" },
      "subheading": "#FED7AA", "secondaryHeading": "#EA580C",
      "accent": "#4ADE80",
      "gradient": { "from": "#090E08", "to": "#162410" },
      "ring": "#FB923C", "shadow": "rgba(234,88,12,0.20)",
      "badge": { "text": "#FEF3C7", "background": "rgba(234,88,12,0.20)" },
      "trust": { "text": "#D4C5A9", "dot1": "#4ADE80", "dot2": "#60A5FA", "dot3": "#FB923C" },
      "accordion": { "questionColor": "#FEF3C7", "answerColor": "#D4C5A9" },
      "link": "#FB923C", "success": "#4ADE80", "warning": "#FBBF24", "error": "#F87171",
      "inputBg": "#111A0E", "inputBorder": "rgba(234,88,12,0.25)", "inputText": "#FEF3C7", "inputPlaceholder": "#576047",
      "navBackground": "#090E08", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#050905",
      "light": {
        "surface": "#FFF7ED", "heading": "#431407", "description": "#7C2D12",
        "cardBackground": "#FFEDD5", "cardBorder": "rgba(234,88,12,0.15)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#78716C", "accent": "#EA580C",
        "subheading": "#C2410C", "secondaryHeading": "#9A3412",
        "icon": "#EA580C", "iconBg": "rgba(234,88,12,0.10)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(234,88,12,0.14)", "iconColor": "#EA580C", "iconBg": "rgba(234,88,12,0.12)", "titleColor": "#7C2D12", "textColor": "#57534E" },
        "primaryButton": { "bg": "#EA580C", "text": "#FFFFFF", "hover": "#C2410C" },
        "badge": { "text": "#431407", "background": "rgba(234,88,12,0.18)" },
        "trust": { "text": "#57534E", "dot1": "#4ADE80", "dot2": "#3B82F6", "dot3": "#EA580C" },
        "link": "#C2410C",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#431407", "inputPlaceholder": "#78716C",
        "overlay": { "color": "#FFF7ED", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#431407", "answerColor": "#7C2D12" }
      }
    }
  },
  {
    "name": "Ruby Night",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FFF1F2", "description": "#FECDD3", "surface": "#0D0408",
      "cardBackground": "#1A0810", "cardBorder": "rgba(244,63,94,0.14)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#7A3048",
      "overlay": { "color": "#1A0510", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#F43F5E", "text": "#FFFFFF", "hover": "#E11D48" },
      "secondaryButton": { "bg": "rgba(244,63,94,0.08)", "text": "#FFF1F2", "border": "#F43F5E", "hover": "rgba(251,113,133,0.18)" },
      "icon": "#FB7185", "iconBg": "rgba(244,63,94,0.12)",
      "featureBox": { "background": "#1A0810", "border": "rgba(244,63,94,0.16)", "iconColor": "#FB7185", "iconBg": "rgba(244,63,94,0.12)", "titleColor": "#FFF1F2", "textColor": "#C8ADB4" },
      "subheading": "#FDA4AF", "secondaryHeading": "#F43F5E",
      "accent": "#FB923C",
      "gradient": { "from": "#0D0408", "to": "#220B14" },
      "ring": "#FB7185", "shadow": "rgba(244,63,94,0.22)",
      "badge": { "text": "#FFF1F2", "background": "rgba(244,63,94,0.20)" },
      "trust": { "text": "#FECDD3", "dot1": "#4ADE80", "dot2": "#60A5FA", "dot3": "#FB923C" },
      "accordion": { "questionColor": "#FFF1F2", "answerColor": "#FECDD3" },
      "link": "#FB7185", "success": "#4ADE80", "warning": "#FBBF24", "error": "#F43F5E",
      "inputBg": "#1A0810", "inputBorder": "rgba(244,63,94,0.28)", "inputText": "#FFF1F2", "inputPlaceholder": "#7A3048",
      "navBackground": "#0D0408", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#080205",
      "light": {
        "surface": "#FFF1F2", "heading": "#4C0519", "description": "#881337",
        "cardBackground": "#FFE4E6", "cardBorder": "rgba(244,63,94,0.12)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#9CA3AF", "accent": "#F43F5E",
        "subheading": "#BE123C", "secondaryHeading": "#9F1239",
        "icon": "#F43F5E", "iconBg": "rgba(244,63,94,0.10)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(244,63,94,0.14)", "iconColor": "#F43F5E", "iconBg": "rgba(244,63,94,0.12)", "titleColor": "#881337", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#F43F5E", "text": "#FFFFFF", "hover": "#E11D48" },
        "badge": { "text": "#FFFFFF", "background": "rgba(244,63,94,0.15)" },
        "trust": { "text": "#6B7280", "dot1": "#4ADE80", "dot2": "#3B82F6", "dot3": "#FB923C" },
        "link": "#E11D48",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#4C0519", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#FFF1F2", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#4C0519", "answerColor": "#881337" }
      }
    }
  },
  {
    "name": "Citrus Navy",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#F0F9FF", "description": "#7DD3FC", "surface": "#050C18",
      "cardBackground": "#0A1628", "cardBorder": "rgba(14,165,233,0.14)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#1E4A6A",
      "overlay": { "color": "#030A18", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#0EA5E9", "text": "#FFFFFF", "hover": "#0284C7" },
      "secondaryButton": { "bg": "rgba(14,165,233,0.08)", "text": "#F0F9FF", "border": "#0EA5E9", "hover": "rgba(56,189,248,0.18)" },
      "icon": "#38BDF8", "iconBg": "rgba(14,165,233,0.12)",
      "featureBox": { "background": "#0A1628", "border": "rgba(14,165,233,0.16)", "iconColor": "#38BDF8", "iconBg": "rgba(14,165,233,0.12)", "titleColor": "#F0F9FF", "textColor": "#A6BCCC" },
      "subheading": "#7DD3FC", "secondaryHeading": "#0EA5E9",
      "accent": "#FB923C",
      "gradient": { "from": "#050C18", "to": "#0A1F3D" },
      "ring": "#38BDF8", "shadow": "rgba(14,165,233,0.20)",
      "badge": { "text": "#F0F9FF", "background": "rgba(14,165,233,0.20)" },
      "trust": { "text": "#7DD3FC", "dot1": "#4ADE80", "dot2": "#38BDF8", "dot3": "#FB923C" },
      "accordion": { "questionColor": "#F0F9FF", "answerColor": "#7DD3FC" },
      "link": "#38BDF8", "success": "#4ADE80", "warning": "#FB923C", "error": "#F87171",
      "inputBg": "#0A1628", "inputBorder": "rgba(14,165,233,0.28)", "inputText": "#F0F9FF", "inputPlaceholder": "#1E4A6A",
      "navBackground": "#050C18", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#02070F",
      "light": {
        "surface": "#F0F9FF", "heading": "#0C2340", "description": "#0369A1",
        "cardBackground": "#E0F2FE", "cardBorder": "rgba(14,165,233,0.15)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#9CA3AF", "accent": "#0EA5E9",
        "subheading": "#0284C7", "secondaryHeading": "#0369A1",
        "icon": "#0EA5E9", "iconBg": "rgba(14,165,233,0.10)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(14,165,233,0.15)", "iconColor": "#0EA5E9", "iconBg": "rgba(14,165,233,0.12)", "titleColor": "#0C4A6E", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#0EA5E9", "text": "#FFFFFF", "hover": "#0284C7" },
        "badge": { "text": "#FFFFFF", "background": "rgba(14,165,233,0.15)" },
        "trust": { "text": "#6B7280", "dot1": "#4ADE80", "dot2": "#0EA5E9", "dot3": "#FB923C" },
        "link": "#0284C7",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#0C2340", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#F0F9FF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#0C2340", "answerColor": "#0369A1" }
      }
    }
  },
  {
    "name": "Midnight Amber",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FFFBF0", "description": "#FDE68A", "surface": "#060504",
      "cardBackground": "#120F08", "cardBorder": "rgba(245,158,11,0.14)",
      "borderColor": "rgba(255,255,255,0.07)",
      "divider": "rgba(255,255,255,0.05)",
      "muted": "#6B5A30",
      "overlay": { "color": "#180E02", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#F59E0B", "text": "#1A1000", "hover": "#D97706" },
      "secondaryButton": { "bg": "rgba(245,158,11,0.08)", "text": "#FFFBF0", "border": "#F59E0B", "hover": "rgba(252,211,77,0.18)" },
      "icon": "#FCD34D", "iconBg": "rgba(245,158,11,0.12)",
      "featureBox": { "background": "#120F08", "border": "rgba(245,158,11,0.16)", "iconColor": "#FCD34D", "iconBg": "rgba(245,158,11,0.12)", "titleColor": "#FFFBEB", "textColor": "#C9BE9A" },
      "subheading": "#FDE68A", "secondaryHeading": "#F59E0B",
      "accent": "#C084FC",
      "gradient": { "from": "#060504", "to": "#1C1408" },
      "ring": "#FCD34D", "shadow": "rgba(245,158,11,0.20)",
      "badge": { "text": "#1A1000", "background": "rgba(245,158,11,0.22)" },
      "trust": { "text": "#FDE68A", "dot1": "#4ADE80", "dot2": "#60A5FA", "dot3": "#F59E0B" },
      "accordion": { "questionColor": "#FFFBF0", "answerColor": "#FDE68A" },
      "link": "#FCD34D", "success": "#4ADE80", "warning": "#F59E0B", "error": "#F87171",
      "inputBg": "#120F08", "inputBorder": "rgba(245,158,11,0.28)", "inputText": "#FFFBF0", "inputPlaceholder": "#6B5A30",
      "navBackground": "#060504", "navBorder": "rgba(255,255,255,0.05)",
      "footerBackground": "#030302",
      "light": {
        "surface": "#FFFBEB", "heading": "#451A03", "description": "#78350F",
        "cardBackground": "#FEF3C7", "cardBorder": "rgba(245,158,11,0.18)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.05)",
        "muted": "#78716C", "accent": "#F59E0B",
        "subheading": "#D97706", "secondaryHeading": "#B45309",
        "icon": "#F59E0B", "iconBg": "rgba(245,158,11,0.12)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(245,158,11,0.18)", "iconColor": "#F59E0B", "iconBg": "rgba(245,158,11,0.15)", "titleColor": "#78350F", "textColor": "#57534E" },
        "primaryButton": { "bg": "#F59E0B", "text": "#1A1000", "hover": "#D97706" },
        "badge": { "text": "#1A1000", "background": "rgba(245,158,11,0.22)" },
        "trust": { "text": "#57534E", "dot1": "#4ADE80", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#D97706",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.12)", "inputText": "#451A03", "inputPlaceholder": "#78716C",
        "overlay": { "color": "#FFFBEB", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#451A03", "answerColor": "#78350F" }
      }
    }
  }
];

// --- BASIC CONTENT ELEMENTS LIST ---
const BASIC_ELEMENTS_LIST: WebsiteElement[] = [
    {
        id: 'basic-head',
        type: 'heading',
        content: { text: 'Basic Building Blocks', htmlTag: 'h1' },
        style: { fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }
    },
    {
        id: 'basic-txt',
        type: 'text',
        content: { text: 'This section demonstrates standard HTML elements styled for your website.' },
        style: { fontSize: '1rem', lineHeight: '1.6', margin: '0 0 2rem 0' }
    },
    {
        id: 'basic-btn',
        type: 'button',
        content: { text: 'Click Me' },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'basic-icon-box',
        type: 'icon-box',
        content: { icon: 'fa-rocket', text: 'Fast Performance', subText: 'Optimized for speed and efficiency.' },
        style: { margin: '0 0 1rem 0' }
    },
    {
        id: 'basic-image-box',
        type: 'image-box',
        content: { src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400', text: 'Visual Card', subText: 'Images enhance user engagement.' },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'basic-list',
        type: 'list',
        content: { items: [{title: 'Responsive Design'}, {title: 'SEO Friendly'}, {title: 'Cross-browser'}] },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'basic-badge',
        type: 'badge',
        content: { text: 'New Feature' },
        style: {} // Use theme badge colors - empty style allows theme fallback
    },
    {
        id: 'basic-quote',
        type: 'blockquote',
        content: { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
        style: { margin: '0 0 2rem 0' }
    }
];

// --- ADVANCED CONTENT ELEMENTS LIST ---
export const ADVANCED_ELEMENTS_LIST: WebsiteElement[] = [
     {
        id: 'adv-head',
        type: 'heading',
        content: { text: 'Advanced Components', htmlTag: 'h2' },
        style: { fontSize: '2rem', fontWeight: 'bold', margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-1',
        type: 'accordion',
        content: { 
            items: [
                { title: 'How does it work?', content: 'Just click and edit. It is that simple.' },
                { title: 'Is it responsive?', content: 'Yes, all elements are mobile-friendly by default.' }
            ] 
        },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-3',
        type: 'progress-bar',
        content: { text: 'Project Completion', percentage: 75 },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-4',
        type: 'counter',
        content: { targetNumber: 5000, text: 'Happy Users' },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-6',
        type: 'alert-box',
        content: { text: 'Important Notice', subText: 'Please review your settings before publishing.', icon: 'fa-circle-exclamation' },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-7',
        type: 'flip-box',
        content: { 
            frontTitle: 'Hover Me', 
            frontDesc: 'Discover what is behind', 
            backTitle: 'Surprise!', 
            backDesc: 'Flip boxes are great for revealing details.',
            icon: 'fa-gift'
        },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-9',
        type: 'countdown-timer',
        content: { text: 'Launch In', targetDate: new Date(Date.now() + 100000000).toISOString() },
        style: { margin: '0 0 2rem 0', textAlign: 'left' }
    }
];

export const DEFAULT_TYPOGRAPHY = {
    h1: { fontFamily: '"Poppins", sans-serif', fontWeight: '700', fontSize: '3.75rem', lineHeight: '1.1', letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Poppins", sans-serif', fontWeight: '600', fontSize: '2.25rem', lineHeight: '1.2', letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Poppins", sans-serif', fontWeight: '600', fontSize: '1.5rem', lineHeight: '1.3', letterSpacing: '-0.005em' },
    h4: { fontFamily: '"Poppins", sans-serif', fontWeight: '600', fontSize: '1.25rem', lineHeight: '1.4', letterSpacing: '0' },
    h5: { fontFamily: '"Poppins", sans-serif', fontWeight: '500', fontSize: '1.125rem', lineHeight: '1.45', letterSpacing: '0' },
    h6: { fontFamily: '"Poppins", sans-serif', fontWeight: '500', fontSize: '1rem',    lineHeight: '1.5',  letterSpacing: '0.01em' },
    p: { fontFamily: '"Inter", sans-serif', fontWeight: '400', fontSize: '1rem', lineHeight: '1.7' },
    button: { fontFamily: '"Poppins", sans-serif', fontWeight: '600', fontSize: '0.9rem', textTransform: 'none' as const },
    link: { fontFamily: '"Inter", sans-serif', fontWeight: '500', fontSize: '1rem', textTransform: 'none' as const },
    caption: { fontFamily: '"Inter", sans-serif', fontWeight: '400', fontSize: '0.8rem', lineHeight: '1.5' },
};

export const INITIAL_TEMPLATE: WebsiteData = {
  name: "GenieBuild Template",
  globalStyles: {
    primaryFont: '"Poppins", sans-serif',
    themeMode: 'dark',
    borderRadius: 'rounded-xl',
    colors: {
        backgroundColor: '#0E1214',
        textColor: '#C7CDD6',
        titleColor: '#F8FAFC',
        subtitleColor: '#C7CDD6',
        accentColor: '#F59E0B',
        buttonBackgroundColor: '#E11D48',
        buttonTextColor: '#FFFFFF',
        linkColor: '#F43F5E',
        borderColor: '#F43F5E',
        subheadingColor: '#D1D5DB',
        iconColor: '#E11D48',
        iconBgColor: 'rgba(225,29,72,0.1)',
        secondaryHeadingColor: '#E11D48'
    },
    typography: DEFAULT_TYPOGRAPHY
  },
  sections: [
    // 0. HEADER (sticky top nav)
    {
        id: 'header-1',
        type: 'header',
        content: {
            phoneText: '(555) 123-4567',
            phoneLink: 'tel:5551234567',
            ctaText: 'Book Now',
            ctaLink: '#contact',
            sticky: true,
        },
        styles: {
            paddingX: 'px-4 sm:px-6 lg:px-8',
            variant: 'HeaderPlumbing',
            themeMode: 'light',
        },
        elements: [],
    },
    // 1. HERO
    {
        id: 'hero-1',
        type: 'hero',
        content: {
            title: 'Fast & Reliable <span style="color:#E11D48">Plumbing</span> Services',
            subtitle: 'Available 24/7 for emergency repairs. Licensed, insured and trusted by 5,000+ homeowners.',
            ctaText: 'Get Free Estimate',
            secondaryCtaText: 'Call (555) 123-4567',
            imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'left',
            variant: 'HeroPlumbing4'
        }
    },
    // 2. FEATURES (light)
    {
        id: 'features-1',
        type: 'features',
        content: {
            title: 'Why Homeowners Trust Us',
            subtitle: 'We combine speed, expertise and transparency to deliver plumbing services you can rely on.'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'center',
            variant: 'FeaturesPlumbing',
            themeMode: 'light'
        }
    },
    // 3. ABOUT
    {
        id: 'about-1',
        type: 'about',
        content: {
            title: 'About ProFlow Plumbing',
            subtitle: 'Trusted local plumbers with over 20 years of experience serving homeowners and businesses across Texas.',
            ctaText: 'Meet Our Team',
            imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'left',
            variant: 'AboutPlumbing',
            themeMode: 'light'
        }
    },
    // 4. SERVICES (light)
    {
        id: 'services-1',
        type: 'services',
        content: {
            title: 'Our Plumbing Services',
            subtitle: 'From routine maintenance to emergency repairs, we handle every plumbing need with expertise and care.',
            ctaText: 'View All Services',
            ctaHref: '#'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'left',
            variant: 'ServicesPlumbing2',
            themeMode: 'light'
        }
    },
    // 5. CTA 1
    {
        id: 'cta-1',
        type: 'cta',
        content: {
            title: "Pipe Burst? We're On Our Way.",
            subtitle: "Don't let a plumbing emergency wreck your home. Our team is standing by 24/7 to respond fast.",
            ctaText: 'Call Now — Free Quote'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'center',
            variant: 'CTAPlumbing1'
        }
    },
    // 6. PROCESS (light)
    {
        id: 'process-1',
        type: 'process',
        content: {
            title: 'How Our Service Works',
            subtitle: 'Four simple steps from your call to a fully fixed plumbing system — fast, clean and professional.'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'center',
            variant: 'ProcessPlumbing',
            themeMode: 'light'
        }
    },
    // 7. WHY CHOOSE US
    {
        id: 'why-choose-us-1',
        type: 'why-choose-us',
        content: {
            title: 'Why Choose Our Plumbing Services?',
            subtitle: "We set the benchmark for plumbing excellence — here's why homeowners choose us every time."
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'center',
            variant: 'WhyChoosePlumbing',
            themeMode: 'light'
        }
    },
    // 8. CTA 2
    {
        id: 'cta-2',
        type: 'cta',
        content: {
            title: 'Ready to Fix Your Plumbing Issues?',
            subtitle: 'Our expert technicians arrive on time, fix it right the first time, and leave your home clean and tidy.',
            ctaText: 'Book a Service'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'left',
            variant: 'CTAPlumbing2'
        }
    },
    // 9. GUARANTEE (light)
    {
        id: 'guarantee-1',
        type: 'guarantee',
        content: {
            title: 'Our 100% Satisfaction Guarantee',
            subtitle: "We stand behind every job we do. If anything goes wrong, we'll make it right — guaranteed.",
            ctaText: 'Book With Confidence'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'left',
            variant: 'GuaranteePlumbing',
            themeMode: 'light'
        }
    },
    // 10. TESTIMONIALS (light)
    {
        id: 'testimonials-1',
        type: 'testimonials',
        content: {
            title: 'What Our Customers Say',
            subtitle: 'Real reviews from real homeowners who trusted us with their plumbing needs.'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'center',
            variant: 'TestimonialsPlumbing',
            themeMode: 'light'
        },
        elements: []
    },
    // 11. AREAS
    {
        id: 'areas-1',
        type: 'areas',
        content: {
            title: 'Service Areas',
            subtitle: 'We provide fast, reliable plumbing services across the greater Texas area. Not sure if we serve your area? Give us a call!'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'center',
            variant: 'AreasPlumbing',
            themeMode: 'light'
        }
    },
    // 12. CTA 3
    {
        id: 'cta-3',
        type: 'cta',
        content: {
            title: 'Join 5,000+ Satisfied Customers',
            subtitle: 'Trusted by thousands of homeowners. Schedule your service today and experience the difference.',
            ctaText: 'Schedule Service Today'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'center',
            variant: 'CTAPlumbing3'
        }
    },
    // 13. FAQ (after final CTA)
    {
        id: 'faq-1',
        type: 'faq',
        content: {
            title: 'Frequently Asked Questions',
            subtitle: 'Straight answers about our services, pricing and guarantees — from the team you\'ll actually talk to.'
        },
        styles: {
            paddingTop: 'pt-10 lg:pt-16',
            paddingBottom: 'pb-10 lg:pb-16',
            paddingX: 'px-6',
            textAlign: 'center',
            variant: 'FAQPlumbing',
            themeMode: 'light'
        },
        elements: []
    },
    // 14. FOOTER (dark, last)
    {
        id: 'footer-1',
        type: 'footer',
        content: {
            logoMode: 'text',
            logoText: 'ProFlow',
            tagline: 'Licensed, insured and trusted by 5,000+ homeowners. Fast, reliable plumbing services 24/7.',
            phoneText: '(555) 123-4567',
            phoneLink: 'tel:5551234567',
            emailText: 'hello@proflow.com',
            emailLink: 'mailto:hello@proflow.com',
            addressText: '123 Main Street\nAustin, TX 78701',
            hoursText: 'Open 24/7 — Always on call',
            ctaTitle: 'Need a plumber today?',
            ctaSubtitle: 'Same-day appointments available. Call us or book online.',
            ctaButtonText: 'Book Now',
            ctaButtonLink: '#contact',
            showCtaBanner: true,
        },
        styles: {
            paddingX: 'px-4 sm:px-6 lg:px-8',
            variant: 'FooterPlumbing',
        },
        elements: [],
    },
  ]
};

export const SECTION_TEMPLATES: Record<string, Partial<Section>> = {
  allelementsTest: {
    type: 'allelementsTest',
    content: {
      title: 'All Elements Test Section',
      subtitle: 'This section contains all 25 elements for testing and debugging purposes.'
    },
    elements: [
      // Basic Elements (13)
      { id: 'test-heading', type: 'heading', content: { text: 'Sample Heading', htmlTag: 'h2' }, style: {} },
      { id: 'test-text', type: 'text', content: { text: 'This is a sample text element for testing.', textSize: 'base' }, style: {} },
      { id: 'test-button', type: 'button', content: { text: 'Click Me', link: '' }, style: {} },
      { id: 'test-image', type: 'image', content: { imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400', imageAlt: 'Sample Image' }, style: { width: '200px', height: '150px' } },
      { id: 'test-video', type: 'video', content: { videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoTitle: 'Sample Video' }, style: { width: '100%', maxWidth: '560px' } },
      { id: 'test-icon', type: 'icon', content: { icon: 'fa-star', iconSize: '24px' }, style: {} },
      { id: 'test-icon-box', type: 'icon-box', content: { icon: 'fa-check-circle', title: 'Icon Box', description: 'Sample icon box element' }, style: {} },
      { id: 'test-image-box', type: 'image-box', content: { imageUrl: 'http://localhost:1111/files/placeholder.jpg', title: 'Image Box', description: 'Sample image box element' }, style: {} },
      { id: 'test-list', type: 'list', content: { items: [{ title: 'Item 1' }, { title: 'Item 2' }, { title: 'Item 3' }], listType: 'ul' }, style: {} },
      { id: 'test-star-rating', type: 'star-rating', content: { rating: 4.5, maxRating: 5 }, style: {} },
      { id: 'test-badge', type: 'badge', content: { text: 'New', variant: 'primary' }, style: {} }, // Use theme badge colors
      { id: 'test-highlight-text', type: 'highlight-text', content: { text: 'This is highlighted text', highlightColor: '#F59E0B' }, style: {} },
      { id: 'test-blockquote', type: 'blockquote', content: { text: 'This is a sample blockquote for testing purposes.', author: 'Test Author' }, style: {} },
      // Advanced Elements (12)
      { id: 'test-accordion', type: 'accordion', content: { items: [{ title: 'Item 1', content: 'Content 1' }, { title: 'Item 2', content: 'Content 2' }] }, style: {} },
      { id: 'test-toggle', type: 'toggle', content: { label: 'Toggle Switch', checked: false }, style: {} },
      { id: 'test-tabs', type: 'tabs', content: { tabs: [{ label: 'Tab 1', content: 'Content 1' }, { label: 'Tab 2', content: 'Content 2' }] }, style: {} },
      { id: 'test-progress-bar', type: 'progress-bar', content: { value: 75, max: 100, label: 'Progress' }, style: {} },
      { id: 'test-counter', type: 'counter', content: { value: 100, label: 'Count', prefix: '', suffix: '+' }, style: {} },
      { id: 'test-testimonial', type: 'testimonial', content: { quote: 'Great service!', author: 'John Doe', role: 'CEO', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' }, style: {} },
      { id: 'test-review-carousel', type: 'review-carousel', content: { reviews: [{ rating: 5, text: 'Excellent!', author: 'Jane' }] }, style: {} },
      { id: 'test-alert-box', type: 'alert-box', content: { message: 'This is an alert message', type: 'info' }, style: {} },
      { id: 'test-pricing-table', type: 'pricing-table', content: { plans: [{ name: 'Basic', price: '$9', features: ['Feature 1', 'Feature 2'] }] }, style: {} },
      { id: 'test-flip-box', type: 'flip-box', content: { frontTitle: 'Front', backTitle: 'Back', frontContent: 'Front content', backContent: 'Back content' }, style: {} },
      { id: 'test-call-to-action', type: 'call-to-action', content: { text: 'Get Started', subText: 'Start your free trial today' }, style: {} },
      { id: 'test-countdown-timer', type: 'countdown-timer', content: { targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), text: 'Offer Ends In' }, style: {} },
    ],
    styles: {
      paddingTop: 'py-24',
      paddingBottom: 'py-24',
      paddingX: 'px-6',
      textAlign: 'center',
      titleSize: 'text-4xl',
      variant: 'AllElementsTest'
    }
  },
  elements: {
      type: 'elements',
      content: { title: 'New Elements Section' },
      elements: [...BASIC_ELEMENTS_LIST.slice(0,3)], 
      styles: {
          paddingTop: 'pt-16',
          paddingBottom: 'pb-16',
          paddingX: 'px-6',
          textAlign: 'left',
          titleSize: 'text-4xl',
          variant: 'default'
      }
  },
  hero: {
    type: 'hero',
    content: {
        title: 'Fast & Reliable <span style="color:#E11D48">Plumbing</span> Services',
        subtitle: 'Available 24/7 for emergency repairs. Licensed, insured and trusted by 5,000+ homeowners.',
        ctaText: 'Get Free Estimate',
        secondaryCtaText: 'Call (555) 123-4567',
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80'
    },
    styles: {
        paddingTop: 'pt-16 lg:pt-28',
        paddingBottom: 'pb-16 lg:pb-28',
        paddingX: 'px-6',
        textAlign: 'left',
        variant: 'HeroPlumbing4'
    },
    variantOverrides: {
      'center': { textAlign: 'center' },
      'HeroLight': {
          textAlign: 'center',
          themeMode: 'light', // This triggers our Dual-Palette Engine automatically!
          background: { 
              type: 'color', 
              overlay: { enabled: false } // No glass effect needed for a clean white background
          }
      },
      'HeroCrimsonJet': { 
          textAlign: 'center', 
          background: { 
              type: 'image', 
              image: {
                  url: '',
                  mode: 'single',
                  images: [],
                  position: 'center',
                  size: 'cover',
                  repeat: 'no-repeat',
                  overlay: { enabled: true, color: '#0E1214', opacity: 0.92, blendMode: 'normal' }
              }
          }
      },
      'HeroPlumbing4': {
          textAlign: 'center',
          titleColor: '#F8FAFC',
          textColor: '#E5E7EB',
          subtitleColor: '#E5E7EB',
          buttonBackgroundColor: '#E11D48',
          buttonTextColor: '#FFFFFF',
          overlayOpacityValue: '0.6',
          background: {
              type: 'image',
              image: {
                  url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1600&q=80',
                  mode: 'single',
                  images: [],
                  position: 'center',
                  size: 'cover',
                  repeat: 'no-repeat',
                  overlay: { enabled: true, color: '#0B0F14', opacity: 0.6, blendMode: 'normal' }
              }
          }
      },
      'HeroExplore': {
          textAlign: 'left',
          titleColor: '#F8FAFC',
          subtitleColor: '#D1D5DB',
          textColor: '#D1D5DB',
          background: {
              type: 'gradient',
              gradient: {
                  type: 'linear',
                  direction: 135,
                  stops: [
                      { color: '#0A1220', position: 0 },
                      { color: '#0F2430', position: 100 }
                  ]
              },
              overlay: { enabled: false }
          },
          imageOverlayOpacity: 0.14
      },
      'HeroMarquee': {
          textAlign: 'center',
          titleColor: '#F8FAFC',
          subtitleColor: '#E5E7EB',
          textColor: '#E5E7EB',
          titleSize: 'clamp(3rem, 8vw, 7rem)',
          background: {
              type: 'image',
              image: {
                  url: '',
                  mode: 'multiple',
                  images: [],
                  carouselSettings: {
                      enabled: true,
                      autoplay: true,
                      duration: 5500,
                      transitionType: 'fade',
                      transitionSpeed: 900,
                      loop: true,
                      pauseOnHover: false,
                      buttonVariant: 'hidden'
                  },
                  position: 'center',
                  size: 'cover',
                  repeat: 'no-repeat',
                  overlay: { enabled: true, color: '#000000', opacity: 0.92, blendMode: 'normal' }
              }
          }
      },
      'HeroOverlay': {
          textAlign: 'center',
          background: {
              type: 'gradient',
              gradient: {
                  type: 'linear',
                  direction: 165,
                  stops: [
                      { color: '#0f1419', position: 0 },
                      { color: '#1a2438', position: 100 }
                  ]
              },
              overlay: { enabled: true, color: '#000000', opacity: 0.4, blendMode: 'normal' }
          }
      },
      'HeroVariant9': {
          textAlign: 'center',
          titleColor: '#F8FAFC',
          textColor: '#C7CDD6',
          subtitleColor: '#C7CDD6',
          background: {
              type: 'gradient',
              gradient: {
                  type: 'linear',
                  direction: 135,
                  stops: [
                      { color: '#0E1214', position: 0 },
                      { color: '#1F2937', position: 100 }
                  ]
              },
              overlay: { enabled: false }
          }
      }
    }
  },
  about: {
      type: 'about',
      content: {
          title: 'About Our Plumbing Company',
          subtitle: 'Trusted local plumbers with over 20 years of experience serving homeowners and businesses.',
          ctaText: 'Meet Our Team',
          imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80'
      },
      styles: {
          paddingTop: 'pt-16 lg:pt-24',
          paddingBottom: 'pb-16 lg:pb-24',
          paddingX: 'px-6',
          textAlign: 'center',
          variant: 'AboutPlumbing'
      }
  },
  features: {
      type: 'features',
      content: {
          title: 'Why Homeowners Trust Us',
          subtitle: 'We combine speed, expertise and transparency to deliver plumbing services you can rely on.',
          items: [
              { id: 'new-f1', title: '24/7 Emergency Service', description: 'Burst pipes, floods, blocked drains — we respond day or night, 365 days a year.', icon: 'fa-clock' },
              { id: 'new-f2', title: 'Licensed & Insured', description: 'Fully certified plumbers with comprehensive insurance for your complete peace of mind.', icon: 'fa-certificate' },
              { id: 'new-f3', title: 'Same-Day Repairs', description: 'Fast response time means we\'re at your door quickly and fix the problem on the first visit.', icon: 'fa-bolt' }
          ]
      },
      styles: {
          paddingTop: 'pt-20 lg:pt-28',
          paddingBottom: 'pb-20 lg:pb-28',
          paddingX: 'px-6',
          textAlign: 'center',
          variant: 'FeaturesPlumbing'
      }
  },
  pricing: {
    type: 'pricing',
    content: {
        title: 'Simple Pricing',
        subtitle: 'Choose the plan that fits your needs.',
        items: [
            { id: 'p1', title: 'Starter', price: '$0', description: 'Perfect for side projects.', features: ['1 Project', 'Community Support'] },
            { id: 'p2', title: 'Pro', price: '$29', description: 'For growing businesses.', features: ['Unlimited Projects', 'Priority Support', 'Analytics'] }
        ]
    },
    styles: {
        paddingTop: 'pt-12 md:pt-24',
        paddingBottom: 'pb-12 md:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        titleSize: 'text-3xl md:text-5xl',
        variant: 'cards'
    }
  },
  testimonials: {
    type: 'testimonials',
    content: {
        title: 'What Our Customers Say',
        subtitle: 'Real reviews from real homeowners who trusted us with their plumbing needs.',
        items: [
            { id: '1', author: 'James Harrington', role: 'Austin, TX', title: 'Emergency Pipe Repair', description: 'Our main pipe burst at 2am and they were at our door within 45 minutes. Fixed everything cleanly and the price was fair.', avatar: 'https://i.pravatar.cc/80?img=11' },
            { id: '2', author: 'Maria Gonzalez', role: 'Houston, TX', title: 'Drain Cleaning', description: 'They found the root cause in minutes with a camera and cleared it permanently. Finally fixed for good. Outstanding service.', avatar: 'https://i.pravatar.cc/80?img=5' },
            { id: '3', author: 'David Chen', role: 'Dallas, TX', title: 'Water Heater Install', description: 'Installed our new tankless water heater quickly and professionally. Noticed a small gas leak and fixed it at no extra cost.', avatar: 'https://i.pravatar.cc/80?img=33' }
        ]
    },
    styles: {
        paddingTop: 'pt-20 lg:pt-28',
        paddingBottom: 'pb-20 lg:pb-28',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'TestimonialsPlumbing'
    },
    elements: []
  },
  faq: {
    type: 'faq',
    content: {
      title: 'Frequently Asked Questions',
      subtitle: 'Straight answers about our services, pricing and guarantees — from the team you\'ll actually talk to.',
    },
    styles: {
      variant: 'FAQPlumbing',
      paddingTop: 'pt-20 lg:pt-28',
      paddingBottom: 'pb-20 lg:pb-28',
      paddingX: 'px-6',
      textAlign: 'center'
    },
    elements: [],
    variantOverrides: {
      'FAQPlumbing': { textAlign: 'center' },
      'FAQCentered': { textAlign: 'center', maxWidth: 'max-w-4xl' },
      'FAQSplit': { textAlign: 'left' },
      'FAQLight': {
          textAlign: 'center',
          themeMode: 'light',
          background: { type: 'color', overlay: { enabled: false } }
      }
    }
  },
  cta: {
      type: 'cta',
      content: {
          title: 'Pipe Burst? We\'re On Our Way.',
          subtitle: 'Don\'t let a plumbing emergency wreck your home. Our team is standing by 24/7 to respond fast.',
          ctaText: 'Call Now — Free Quote'
      },
      styles: {
          paddingTop: 'pt-20 lg:pt-28',
          paddingBottom: 'pb-20 lg:pb-28',
          paddingX: 'px-6',
          textAlign: 'center',
          variant: 'CTAPlumbing1'
      },
      variantOverrides: {
        'CTAPlumbing1': { textAlign: 'center' },
        'CTAPlumbing2': { textAlign: 'left' },
        'CTAPlumbing3': { textAlign: 'center' }
      }
  },
  services: {
      type: 'services',
      content: {
          title: 'Our Plumbing Services',
          subtitle: 'From routine maintenance to emergency repairs, we handle every plumbing need with expertise and care.',
          ctaText: 'View All Services',
          ctaHref: '#',
          items: [
              { id: 's1', title: 'Drain Cleaning', description: 'Professional drain cleaning using the latest hydro-jetting technology. We clear blockages fast and prevent future clogs.', icon: 'fa-toilet-paper' },
              { id: 's2', title: 'Water Heater Services', description: 'Installation, repair and replacement of all water heater brands. Tank & tankless options with energy-saving solutions.', icon: 'fa-fire-burner' },
              { id: 's3', title: 'Pipe Repair & Replacement', description: 'From minor leaks to full repiping, our licensed plumbers handle every pipe issue using durable materials built to last.', icon: 'fa-pipe-section' },
              { id: 's4', title: 'Bathroom Plumbing', description: 'Complete bathroom plumbing installations and renovations. We handle everything from faucets to full bathroom remodels.', icon: 'fa-bath' }
          ]
      },
      styles: {
          paddingTop: 'pt-20 lg:pt-28',
          paddingBottom: 'pb-20 lg:pb-28',
          paddingX: 'px-6',
          textAlign: 'left',
          variant: 'ServicesPlumbing2'
      }
  },
  'why-choose-us': {
      type: 'why-choose-us',
      content: {
          title: 'Why Choose Our Plumbing Services?',
          subtitle: 'We set the benchmark for plumbing excellence in your area — here\'s why homeowners choose us every time.',
          items: [
              { id: 'w1', title: '20+ Years Experience', description: 'Two decades of solving every plumbing problem — residential, commercial and industrial.', icon: 'fa-medal' },
              { id: 'w2', title: 'Licensed & Certified', description: 'Every technician is fully licensed, background-checked and certified by industry bodies.', icon: 'fa-id-badge' },
              { id: 'w3', title: 'Fast Emergency Response', description: 'We\'re on-site within 60 minutes for emergencies — guaranteed, day or night.', icon: 'fa-bolt' },
              { id: 'w4', title: 'Honest Pricing', description: 'You\'ll always know the price before we start. No surprises, no hidden charges.', icon: 'fa-hand-holding-dollar' },
              { id: 'w5', title: 'Clean & Respectful', description: 'We treat your home like our own — all work areas are left spotless after every job.', icon: 'fa-broom' },
              { id: 'w6', title: 'Guaranteed Workmanship', description: 'Every repair comes with our full 10-year workmanship guarantee. Work done right.', icon: 'fa-shield-halved' }
          ]
      },
      styles: {
          paddingTop: 'pt-20 lg:pt-28',
          paddingBottom: 'pb-20 lg:pb-28',
          paddingX: 'px-6',
          textAlign: 'center',
          variant: 'WhyChoosePlumbing'
      }
  },
  guarantee: {
      type: 'guarantee',
      content: {
          title: 'Our 100% Satisfaction Guarantee',
          subtitle: 'We stand behind every job we do. If anything goes wrong, we\'ll make it right — guaranteed.',
          ctaText: 'Book With Confidence'
      },
      styles: {
          paddingTop: 'pt-20 lg:pt-28',
          paddingBottom: 'pb-20 lg:pb-28',
          paddingX: 'px-6',
          textAlign: 'left',
          variant: 'GuaranteePlumbing'
      }
  },
  process: {
      type: 'process',
      content: {
          title: 'How Our Service Works',
          subtitle: 'Four simple steps from your call to a fully fixed plumbing system — fast, clean and professional.',
          items: [
              { id: 'p1', title: 'Call or Book Online', description: 'Reach us 24/7 by phone or use our online booking. We confirm your appointment instantly.', icon: 'fa-phone' },
              { id: 'p2', title: 'Fast Diagnosis', description: 'Our licensed plumber arrives on time, assesses the issue and provides a clear upfront quote.', icon: 'fa-magnifying-glass' },
              { id: 'p3', title: 'Expert Repair', description: 'We fix the problem using premium materials and proven techniques, right the first time.', icon: 'fa-wrench' },
              { id: 'p4', title: 'Satisfaction Check', description: 'We review the work with you before leaving — you\'re 100% satisfied or we come back free.', icon: 'fa-circle-check' }
          ]
      },
      styles: {
          paddingTop: 'pt-20 lg:pt-28',
          paddingBottom: 'pb-20 lg:pb-28',
          paddingX: 'px-6',
          textAlign: 'center',
          variant: 'ProcessPlumbing'
      }
  },
  areas: {
      type: 'areas',
      content: {
          title: 'Service Areas',
          subtitle: 'We provide fast, reliable plumbing services across the greater Texas area. Not sure if we serve your area? Give us a call!',
          ctaText: 'Check Your Area',
          items: [
              { id: 'a1', title: 'Austin', subtitle: 'TX', description: '78701' },
              { id: 'a2', title: 'Houston', subtitle: 'TX', description: '77001' },
              { id: 'a3', title: 'Dallas', subtitle: 'TX', description: '75201' },
              { id: 'a4', title: 'San Antonio', subtitle: 'TX', description: '78201' },
              { id: 'a5', title: 'Fort Worth', subtitle: 'TX', description: '76101' },
              { id: 'a6', title: 'Plano', subtitle: 'TX', description: '75023' }
          ]
      },
      styles: {
          paddingTop: 'pt-20 lg:pt-28',
          paddingBottom: 'pb-20 lg:pb-28',
          paddingX: 'px-6',
          textAlign: 'center',
          variant: 'AreasPlumbing'
      }
  },
  /** About page — clean light sub-page hero (badge + title + subtitle + breadcrumb). */
  abouthero: {
    type: 'abouthero',
    content: {
        badgeText: 'About Us',
        title: 'About Our Plumbing Company',
        subtitle: 'Trusted local plumbers with over 20 years of experience — get to know our story, our mission, and the values that guide everything we do.'
    },
    styles: {
        paddingTop: 'pt-24 lg:pt-32',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'AboutHeroDefault'
    }
  },

  /** About page — Mission & Vision (2-column). */
  missionvision: {
    type: 'missionvision',
    content: {
        mission: {
            line: 'Quality service, every time.',
            subHeadings: ['Customer-focused solutions', 'Reliable expert workmanship', 'Honest transparent pricing']
        },
        vision: {
            line: 'Setting the industry standard.',
            subHeadings: ['Innovating for tomorrow', 'Building lasting community trust', 'Sustainable responsible growth']
        }
    },
    styles: {
        paddingTop: 'pt-16 lg:pt-24',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'left',
        variant: 'MissionVisionDefault'
    }
  },

  /** About page — Core Values (6 cards). */
  corevalues: {
    type: 'corevalues',
    content: {
        badgeText: 'Our Values',
        title: 'Our Core Values',
        intro: 'The principles that guide everything we do and define who we are.',
        items: [
            { title: 'Customer First', iconClass: 'fa-user-check', description: 'Every decision we make starts with what is best for the customers and community we serve.' },
            { title: 'Professional Team', iconClass: 'fa-user-tie', description: 'Skilled, certified professionals who take genuine pride in delivering exceptional workmanship.' },
            { title: 'Eco-Friendly', iconClass: 'fa-leaf', description: 'We use sustainable practices and products that protect both your home and the environment.' },
            { title: 'Quality Standards', iconClass: 'fa-award', description: 'We never cut corners — only the highest standards of quality and durability on every job.' },
            { title: 'Reliability', iconClass: 'fa-clock', description: 'On time, every time. You can count on us to show up and get the job done right.' },
            { title: 'Trust & Safety', iconClass: 'fa-shield-halved', description: 'Fully licensed, insured and background-checked for your complete peace of mind.' }
        ]
    },
    styles: {
        paddingTop: 'pt-16 lg:pt-24',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'CoreValuesDefault'
    }
  },

  /** About page — USP / What Makes Us Different (6 points). */
  usp: {
    type: 'usp',
    content: {
        badgeText: 'Why We\'re Different',
        title: 'What Makes Us Different',
        intro: 'The advantages that set us apart from everyone else in the industry.',
        items: [
            { title: 'Upfront Flat-Rate Pricing', iconClass: 'fa-tag', description: 'You approve the price before any work begins — no hourly surprises, no hidden fees, ever.' },
            { title: 'Same-Day Availability', iconClass: 'fa-bolt', description: 'Most jobs are handled the very same day you call, so problems never have time to get worse.' },
            { title: 'Master-Certified Technicians', iconClass: 'fa-user-graduate', description: 'Our team holds the highest industry certifications and trains continuously on the latest methods.' },
            { title: 'Lifetime Workmanship Warranty', iconClass: 'fa-shield-halved', description: 'We stand behind our work for life — if anything fails, we return and make it right at no cost.' },
            { title: 'Transparent Live Updates', iconClass: 'fa-location-dot', description: 'Track your technician in real time and get clear photo updates throughout every single job.' },
            { title: 'Locally Owned & Trusted', iconClass: 'fa-house-chimney', description: 'A proud part of this community for years, with thousands of happy neighbours who recommend us.' }
        ]
    },
    styles: {
        paddingTop: 'pt-16 lg:pt-24',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'USPDefault'
    }
  },

  /** Service page — short promise / tagline band. */
  promise: {
    type: 'promise',
    content: {
        badgeText: 'Our Promise',
        title: 'Your Satisfaction, Guaranteed',
        subtitle: 'We promise honest work, fair pricing and a job done right the first time — every single time. If you\'re not fully satisfied, we\'ll make it right.'
    },
    styles: {
        paddingTop: 'pt-14 lg:pt-20',
        paddingBottom: 'pb-14 lg:pb-20',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'PromiseDefault'
    }
  },

  /** Service page — related services cards grid. */
  relatedservices: {
    type: 'relatedservices',
    content: {
        badgeText: 'More Services',
        title: 'Related Services',
        subtitle: 'Explore other services we offer to keep your home running smoothly.',
        items: [
            { icon: 'fa-toilet-paper', title: 'Drain Cleaning', description: 'Professional drain cleaning using the latest hydro-jetting technology to clear blockages fast.' },
            { icon: 'fa-fire-burner', title: 'Water Heater Services', description: 'Installation, repair and replacement of all water heater brands — tank & tankless options.' },
            { icon: 'fa-droplet', title: 'Leak Detection & Repair', description: 'Advanced equipment to locate and fix hidden leaks before they cause costly damage.' },
            { icon: 'fa-bath', title: 'Bathroom Plumbing', description: 'Complete bathroom plumbing installations and renovations, from faucets to full remodels.' },
            { icon: 'fa-faucet', title: 'Faucet & Fixture Repair', description: 'Fast repair and replacement of leaky faucets, taps and fixtures throughout your home.' },
            { icon: 'fa-house-flood-water', title: 'Emergency Plumbing', description: 'Round-the-clock emergency response for burst pipes, floods and urgent plumbing failures.' }
        ]
    },
    styles: {
        paddingTop: 'pt-16 lg:pt-24',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'RelatedServicesDefault'
    }
  },

  /** Contact page — clean dark sub-page hero. */
  contacthero: {
    type: 'contacthero',
    content: {
        badgeText: 'Contact Us',
        contactHeroTitle: 'Get In Touch',
        contactHeroSubtitle: 'Have a question or ready to book? Reach out and our friendly team will get back to you fast — usually within a few hours.'
    },
    styles: {
        paddingTop: 'pt-24 lg:pt-32',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'ContactHeroDefault'
    }
  },

  /** Contact page — reach-us methods cards. */
  contactinfo: {
    type: 'contactinfo',
    content: {
        badgeText: 'Get In Touch',
        title: 'Ways to Reach Us',
        subtitle: 'Choose whatever way works best for you — we\'re always happy to help.',
        items: [
            { icon: 'fa-phone', title: 'Call Us', description: '(555) 123-4567 — available 24/7 for emergencies.' },
            { icon: 'fa-envelope', title: 'Email Us', description: 'hello@yourcompany.com — we reply within a few hours.' },
            { icon: 'fa-location-dot', title: 'Visit Us', description: '123 Main Street, Your City, ST 12345.' },
            { icon: 'fa-clock', title: 'Office Hours', description: 'Mon–Sat: 7am – 8pm. Sunday: emergency only.' }
        ]
    },
    styles: {
        paddingTop: 'pt-16 lg:pt-24',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'ContactInfoDefault'
    }
  },

  /** Contact page — contact form card. */
  contactform: {
    type: 'contactform',
    content: {
        badgeText: 'Send a Message',
        contactIntroHeading: 'Send Us a Message',
        contactIntroBody: 'Tell us a little about what you need and the best way to reach you. We\'ll get back to you as soon as possible.',
        ctaText: 'Send Message',
        fields: [
            { label: 'Full Name', type: 'text' },
            { label: 'Email Address', type: 'email' },
            { label: 'Phone Number', type: 'tel' },
            { label: 'Your Message', type: 'textarea' }
        ]
    },
    styles: {
        paddingTop: 'pt-16 lg:pt-24',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'ContactFormDefault'
    }
  },

  /** Blogs page — clean dark sub-page hero. */
  blogshero: {
    type: 'blogshero',
    content: {
        badgeText: 'Our Blog',
        blogsHeroTitle: 'Latest Articles & Insights',
        blogsHeroSubtitle: 'Tips, guides and industry updates from our team of experts — everything you need to stay informed and make the right decisions.'
    },
    styles: {
        paddingTop: 'pt-24 lg:pt-32',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'BlogsHeroDefault'
    }
  },

  /** Blogs page — search bar + category filter. */
  blogssearch: {
    type: 'blogssearch',
    content: {
        searchPlaceholder: 'Search articles…',
        filterHelperText: 'Browse by topic or search for exactly what you need.',
        categories: ['All', 'Tips & Guides', 'Industry News', 'How-To', 'Community']
    },
    styles: {
        paddingTop: 'pt-8 lg:pt-10',
        paddingBottom: 'pb-4 lg:pb-6',
        paddingX: 'px-6',
        textAlign: 'center',
        variant: 'BlogsSearchDefault'
    }
  },

  /** Blogs page — blog post cards grid. */
  blogslist: {
    type: 'blogslist',
    content: {},
    styles: {
        paddingTop: 'pt-6 lg:pt-8',
        paddingBottom: 'pb-16 lg:pb-24',
        paddingX: 'px-6',
        textAlign: 'left',
        variant: 'BlogsListDefault'
    }
  },

  /** Blog detail — article header (title + meta + cover) + breadcrumb. */
  blogarticlehero: {
    type: 'blogarticlehero',
    content: {
        category: 'Tips & Guides',
        title: 'How to Choose the Right Service Provider',
        authorName: 'Jane Doe',
        date: 'June 12, 2025',
        readTime: '6 min read',
        coverImage: { url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80', alt: '' }
    },
    styles: { paddingTop: 'pt-24 lg:pt-32', paddingBottom: 'pb-0', paddingX: 'px-6', textAlign: 'center', variant: 'BlogArticleHeroDefault' }
  },

  /** Blog detail — article body content. */
  blogcontent: {
    type: 'blogcontent',
    content: {},
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-10 lg:pb-16', paddingX: 'px-6', textAlign: 'left', variant: 'BlogContentDefault' }
  },

  /** Blog detail — author bio card. */
  blogauthor: {
    type: 'blogauthor',
    content: {
        name: 'Jane Doe',
        jobTitle: 'Senior Content Writer',
        bio: 'Jane has over 10 years of hands-on industry experience and loves sharing practical tips that help homeowners make confident decisions.',
        image: 'https://i.pravatar.cc/160?img=47',
        links: [{ label: 'Twitter', icon: 'fa-x-twitter', url: '#' }, { label: 'LinkedIn', icon: 'fa-linkedin-in', url: '#' }]
    },
    styles: { paddingTop: 'pt-8 lg:pt-10', paddingBottom: 'pb-8 lg:pb-10', paddingX: 'px-6', textAlign: 'left', variant: 'BlogAuthorDefault' }
  },

  /** Blog detail — related articles grid. */
  blogrelated: {
    type: 'blogrelated',
    content: { badgeText: 'Keep Reading', relatedTitle: 'Related Articles' },
    styles: { paddingTop: 'pt-14 lg:pt-20', paddingBottom: 'pb-14 lg:pb-20', paddingX: 'px-6', textAlign: 'center', variant: 'BlogRelatedDefault' }
  },

  /** Blog detail — comments section. */
  blogcomments: {
    type: 'blogcomments',
    content: {
        commentSectionTitle: 'Join the Conversation',
        commentSectionSubtitle: 'Share your thoughts — we\'d love to hear from you.',
        ctaText: 'Post Comment'
    },
    styles: { paddingTop: 'pt-10 lg:pt-16', paddingBottom: 'pb-14 lg:pb-20', paddingX: 'px-6', textAlign: 'left', variant: 'BlogCommentsDefault' }
  },

  /** Legal page — dark hero (Privacy / Terms / Disclaimer). */
  legalhero: {
    type: 'legalhero',
    content: {
        badgeText: 'Legal',
        heroTitle: 'Privacy Policy',
        heroSubtitle: 'Please read this page carefully to understand how we handle your information and your rights.',
        lastUpdatedLabel: 'Last updated: June 2025'
    },
    styles: { paddingTop: 'pt-24 lg:pt-32', paddingBottom: 'pb-14 lg:pb-20', paddingX: 'px-6', textAlign: 'center', variant: 'LegalHeroDefault' }
  },

  /** Legal page — document body (heading + rich-text sections). */
  legalcontent: {
    type: 'legalcontent',
    content: {
        sections: [
            { heading: '1. Information We Collect', bodyHtml: 'We collect information you provide directly to us, such as your name, email address and phone number when you contact us or request a service. We also collect limited technical data (like your browser type) to keep our site secure and functional.' },
            { heading: '2. How We Use Your Information', bodyHtml: 'Your information is used solely to respond to enquiries, schedule and deliver services, and improve your experience. We never sell your personal data to third parties.' },
            { heading: '3. Cookies & Tracking', bodyHtml: 'We use essential cookies to run the site and optional analytics cookies to understand how visitors use it. You can disable non-essential cookies in your browser settings at any time.' },
            { heading: '4. Data Security', bodyHtml: 'We apply reasonable technical and organisational measures to protect your data against unauthorised access, loss or misuse. No method of transmission is 100% secure, but we work hard to safeguard your information.' },
            { heading: '5. Your Rights', bodyHtml: 'You may request access to, correction of, or deletion of your personal data at any time. To exercise these rights, simply reach out to us through our contact page.' },
            { heading: '6. Changes to This Policy', bodyHtml: 'We may update this policy from time to time. Any changes will be posted on this page with an updated revision date above.' }
        ]
    },
    styles: { paddingTop: 'pt-14 lg:pt-20', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'left', variant: 'LegalContentDefault' }
  },

  /** Location page — sub-locations (states / cities / areas) grid. */
  sublocations: {
    type: 'sublocations',
    content: {
        badgeText: 'Areas We Serve',
        title: 'Explore Nearby Locations',
        subtitle: 'We proudly serve homes and businesses across these areas — find yours below.',
        items: [
            { name: 'Downtown', meta: '12 areas covered' },
            { name: 'North Side', meta: '9 areas covered' },
            { name: 'West End', meta: '8 areas covered' },
            { name: 'East Village', meta: '7 areas covered' },
            { name: 'Southgate', meta: '10 areas covered' },
            { name: 'Riverside', meta: '6 areas covered' },
            { name: 'Hillcrest', meta: '5 areas covered' },
            { name: 'Lakeside', meta: '8 areas covered' }
        ]
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'SubLocationsDefault' }
  },

  /** Location page — embedded map (renders when lat/lng or mapEmbedUrl exists). */
  locationmap: {
    type: 'locationmap',
    content: {
        badgeText: 'Find Us',
        title: 'Our Service Area',
        lat: '40.7128',
        lng: '-74.0060'
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'LocationMapDefault' }
  },

  navbar: {
    type: 'navbar',
    content: {
        logo: 'Brand',
        links: [{label: 'Home', href:'#'}, {label: 'About', href:'#'}],
        ctaText: 'Login'
    },
    styles: {
        paddingTop: 'py-4 md:py-6',
        paddingBottom: 'py-4 md:py-6',
        paddingX: 'px-6',
        textAlign: 'left',
        titleSize: '24px',
        variant: 'HeaderPlumbing'
    }
  },
  footer: {
    type: 'footer',
    content: {
        title: 'Brand',
        description: 'Building the future one pixel at a time.',
        links: [{label: 'Privacy', href:'#'}, {label: 'Terms', href:'#'}]
    },
    styles: {
        paddingTop: 'pt-8 md:pt-16',
        paddingBottom: 'pb-8 md:pb-16',
        paddingX: 'px-6',
        textAlign: 'left',
        titleSize: '24px',
        variant: 'FooterPlumbing'
    }
  },
  'image-banner': {
      type: 'image-banner',
      content: {
          title: 'Visual Impact',
          subtitle: 'Use high quality images to tell your story.',
          ctaText: 'Learn More'
      },
      styles: {
          background: { 
            type: 'image', 
            image: { 
              url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600', 
              position: 'center', 
              size: 'cover', 
              repeat: 'no-repeat', 
              attachment: 'scroll', 
              overlay: { 
                enabled: true, 
                color: '#000000', 
                opacity: 0.6, 
                blendMode: 'normal' 
              }
            } 
          },
          paddingTop: 'pt-24 md:pt-40',
          paddingBottom: 'pb-24 md:pb-40',
          paddingX: 'px-6',
          textAlign: 'center',
          titleSize: 'text-5xl md:text-7xl',
          backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600',
          overlayOpacity: 'bg-black/60',
          variant: 'center'
      }
  },

  /** Single-service page — body copy + image (resolved from the same service_sections bundle as the homepage services grid). */
  aboutservice: {
    type: 'aboutservice',
    content: {
      title: 'About this service',
      about_service:
        'This text is loaded from your service bundle for the current location. Edit it from the homepage services section or here — both stay in sync.',
    },
    styles: {
      themeMode: 'light',
      backgroundColor: '#F9FAFB',
      paddingTop: 'pt-12 sm:pt-16 lg:pt-20',
      paddingBottom: 'pb-12 sm:pb-16 lg:pb-20',
      paddingX: 'px-4 sm:px-6',
      variant: 'AboutServiceDefault',
    },
  },

  /** Single-service page — top hero band (bundle: servicehero). */
  servicehero: {
    type: 'servicehero',
    content: {
      serviceHeroBadge: 'Licensed · Insured',
      serviceHeroTitle: 'Professional service for your visit',
      serviceHeroSubtitle:
        'Clear scope, quality workmanship, and respect for your home or business. Copy is filled from your generated service page content.',
    },
    styles: {
      themeMode: 'light',
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      textColor: '#e2e8f0',
      paddingTop: 'pt-16 sm:pt-20',
      paddingBottom: 'pb-16 sm:pb-20',
      paddingX: 'px-4 sm:px-6',
      variant: 'ServiceHeroDefault',
    },
  },
};
