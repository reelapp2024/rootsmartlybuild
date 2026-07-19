
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
    "name": "Midnight Emerald",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#F1F5F9", "description": "#94A3B8", "surface": "#0B1120",
      "cardBackground": "#111A2E", "cardBorder": "rgba(16,185,129,0.14)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#64748B",
      "overlay": { "color": "#04120C", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#10B981", "text": "#052E1B", "hover": "#059669" },
      "secondaryButton": { "bg": "rgba(16,185,129,0.08)", "text": "#F1F5F9", "border": "#10B981", "hover": "rgba(16,185,129,0.18)" },
      "icon": "#10B981", "iconBg": "rgba(16,185,129,0.12)",
      "featureBox": { "background": "#111A2E", "border": "rgba(16,185,129,0.16)", "iconColor": "#10B981", "iconBg": "rgba(16,185,129,0.12)", "titleColor": "#F1F5F9", "textColor": "#94A3B8" },
      "subheading": "#34D399", "secondaryHeading": "#10B981",
      "accent": "#10B981",
      "gradient": { "from": "#0B1120", "to": "#0F1E2E" },
      "ring": "#34D399", "shadow": "rgba(16,185,129,0.20)",
      "badge": { "text": "#052E1B", "background": "rgba(16,185,129,0.20)" },
      "trust": { "text": "#94A3B8", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#F1F5F9", "answerColor": "#94A3B8" },
      "link": "#34D399", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#111A2E", "inputBorder": "rgba(16,185,129,0.25)", "inputText": "#F1F5F9", "inputPlaceholder": "#64748B",
      "navBackground": "#0B1120", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#070D18",
      "light": {
        "surface": "#FFFFFF", "heading": "#0F172A", "description": "#374151",
        "cardBackground": "#F0FDF9", "cardBorder": "rgba(5,150,105,0.10)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#94A3B8", "accent": "#059669",
        "subheading": "#059669", "secondaryHeading": "#059669",
        "icon": "#059669", "iconBg": "rgba(5,150,105,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(5,150,105,0.10)", "iconColor": "#059669", "iconBg": "rgba(5,150,105,0.10)", "titleColor": "#0F172A", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#059669", "text": "#FFFFFF", "hover": "#047857" },
        "badge": { "text": "#FFFFFF", "background": "rgba(5,150,105,0.12)" },
        "trust": { "text": "#6B7280", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#059669",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#0F172A", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#FFFFFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#0F172A", "answerColor": "#374151" }
      }
    }
  },
  {
    "name": "Slate Violet",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#F8FAFC", "description": "#A5A0C0", "surface": "#0F0F1A",
      "cardBackground": "#181828", "cardBorder": "rgba(139,92,246,0.16)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#6B6890",
      "overlay": { "color": "#0C0818", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#8B5CF6", "text": "#FFFFFF", "hover": "#7C3AED" },
      "secondaryButton": { "bg": "rgba(139,92,246,0.08)", "text": "#F8FAFC", "border": "#8B5CF6", "hover": "rgba(139,92,246,0.18)" },
      "icon": "#8B5CF6", "iconBg": "rgba(139,92,246,0.12)",
      "featureBox": { "background": "#181828", "border": "rgba(139,92,246,0.18)", "iconColor": "#8B5CF6", "iconBg": "rgba(139,92,246,0.12)", "titleColor": "#F8FAFC", "textColor": "#A5A0C0" },
      "subheading": "#A78BFA", "secondaryHeading": "#8B5CF6",
      "accent": "#8B5CF6",
      "gradient": { "from": "#0F0F1A", "to": "#1A1730" },
      "ring": "#A78BFA", "shadow": "rgba(139,92,246,0.22)",
      "badge": { "text": "#FFFFFF", "background": "rgba(139,92,246,0.20)" },
      "trust": { "text": "#A5A0C0", "dot1": "#22C55E", "dot2": "#60A5FA", "dot3": "#F472B6" },
      "accordion": { "questionColor": "#F8FAFC", "answerColor": "#A5A0C0" },
      "link": "#A78BFA", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#181828", "inputBorder": "rgba(139,92,246,0.25)", "inputText": "#F8FAFC", "inputPlaceholder": "#6B6890",
      "navBackground": "#0F0F1A", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#0A0A14",
      "light": {
        "surface": "#FAFAFF", "heading": "#1E1B2E", "description": "#3F3B52",
        "cardBackground": "#F5F3FF", "cardBorder": "rgba(124,58,237,0.10)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#8B87A3", "accent": "#7C3AED",
        "subheading": "#7C3AED", "secondaryHeading": "#7C3AED",
        "icon": "#7C3AED", "iconBg": "rgba(124,58,237,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(124,58,237,0.10)", "iconColor": "#7C3AED", "iconBg": "rgba(124,58,237,0.10)", "titleColor": "#1E1B2E", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#7C3AED", "text": "#FFFFFF", "hover": "#6D28D9" },
        "badge": { "text": "#FFFFFF", "background": "rgba(124,58,237,0.12)" },
        "trust": { "text": "#6B7280", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F472B6" },
        "link": "#7C3AED",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#1E1B2E", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#FFFFFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#1E1B2E", "answerColor": "#3F3B52" }
      }
    }
  },
  {
    "name": "Warm Sand Stone",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FAFAF9", "description": "#D6D3D1", "surface": "#1C1917",
      "cardBackground": "#292524", "cardBorder": "rgba(234,88,12,0.16)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#A8A29E",
      "overlay": { "color": "#1A0E08", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#EA580C", "text": "#FFFFFF", "hover": "#C2410C" },
      "secondaryButton": { "bg": "rgba(234,88,12,0.08)", "text": "#FAFAF9", "border": "#EA580C", "hover": "rgba(234,88,12,0.18)" },
      "icon": "#EA580C", "iconBg": "rgba(234,88,12,0.12)",
      "featureBox": { "background": "#292524", "border": "rgba(234,88,12,0.18)", "iconColor": "#EA580C", "iconBg": "rgba(234,88,12,0.12)", "titleColor": "#FAFAF9", "textColor": "#D6D3D1" },
      "subheading": "#FB923C", "secondaryHeading": "#EA580C",
      "accent": "#EA580C",
      "gradient": { "from": "#1C1917", "to": "#292524" },
      "ring": "#FB923C", "shadow": "rgba(234,88,12,0.20)",
      "badge": { "text": "#FFFFFF", "background": "rgba(234,88,12,0.20)" },
      "trust": { "text": "#D6D3D1", "dot1": "#65A30D", "dot2": "#0EA5E9", "dot3": "#F59E0B" },
      "accordion": { "questionColor": "#FAFAF9", "answerColor": "#D6D3D1" },
      "link": "#FB923C", "success": "#65A30D", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#292524", "inputBorder": "rgba(234,88,12,0.25)", "inputText": "#FAFAF9", "inputPlaceholder": "#A8A29E",
      "navBackground": "#1C1917", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#171310",
      "light": {
        "surface": "#FAF7F2", "heading": "#292524", "description": "#57534E",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(194,65,12,0.10)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#A8A29E", "accent": "#C2410C",
        "subheading": "#C2410C", "secondaryHeading": "#C2410C",
        "icon": "#C2410C", "iconBg": "rgba(194,65,12,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(194,65,12,0.10)", "iconColor": "#C2410C", "iconBg": "rgba(194,65,12,0.10)", "titleColor": "#292524", "textColor": "#57534E" },
        "primaryButton": { "bg": "#C2410C", "text": "#FFFFFF", "hover": "#9A3412" },
        "badge": { "text": "#FFFFFF", "background": "rgba(194,65,12,0.12)" },
        "trust": { "text": "#78716C", "dot1": "#65A30D", "dot2": "#0EA5E9", "dot3": "#F59E0B" },
        "link": "#C2410C",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#292524", "inputPlaceholder": "#A8A29E",
        "overlay": { "color": "#FAF7F2", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#292524", "answerColor": "#57534E" }
      }
    }
  },
  {
    "name": "Corporate Navy",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#F8FAFC", "description": "#94A3B8", "surface": "#0F172A",
      "cardBackground": "#1A2537", "cardBorder": "rgba(14,165,233,0.14)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#64748B",
      "overlay": { "color": "#050B18", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#0EA5E9", "text": "#052235", "hover": "#0284C7" },
      "secondaryButton": { "bg": "rgba(14,165,233,0.08)", "text": "#F8FAFC", "border": "#0EA5E9", "hover": "rgba(14,165,233,0.18)" },
      "icon": "#0EA5E9", "iconBg": "rgba(14,165,233,0.12)",
      "featureBox": { "background": "#1A2537", "border": "rgba(14,165,233,0.16)", "iconColor": "#0EA5E9", "iconBg": "rgba(14,165,233,0.12)", "titleColor": "#F8FAFC", "textColor": "#94A3B8" },
      "subheading": "#38BDF8", "secondaryHeading": "#0EA5E9",
      "accent": "#0EA5E9",
      "gradient": { "from": "#0F172A", "to": "#152238" },
      "ring": "#38BDF8", "shadow": "rgba(14,165,233,0.20)",
      "badge": { "text": "#052235", "background": "rgba(14,165,233,0.20)" },
      "trust": { "text": "#94A3B8", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#F8FAFC", "answerColor": "#94A3B8" },
      "link": "#38BDF8", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#1A2537", "inputBorder": "rgba(14,165,233,0.25)", "inputText": "#F8FAFC", "inputPlaceholder": "#64748B",
      "navBackground": "#0F172A", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#0A1120",
      "light": {
        "surface": "#F8FAFC", "heading": "#0F172A", "description": "#334155",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(3,105,161,0.10)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#64748B", "accent": "#0369A1",
        "subheading": "#0369A1", "secondaryHeading": "#0369A1",
        "icon": "#0369A1", "iconBg": "rgba(3,105,161,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(3,105,161,0.10)", "iconColor": "#0369A1", "iconBg": "rgba(3,105,161,0.10)", "titleColor": "#0F172A", "textColor": "#475569" },
        "primaryButton": { "bg": "#0369A1", "text": "#FFFFFF", "hover": "#075985" },
        "badge": { "text": "#FFFFFF", "background": "rgba(3,105,161,0.12)" },
        "trust": { "text": "#64748B", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#0369A1",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#0F172A", "inputPlaceholder": "#94A3B8",
        "overlay": { "color": "#FFFFFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#0F172A", "answerColor": "#334155" }
      }
    }
  },
  {
    "name": "Obsidian Gold",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FAFAF9", "description": "#B8B2A7", "surface": "#12100E",
      "cardBackground": "#1C1917", "cardBorder": "rgba(202,138,4,0.16)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#78716C",
      "overlay": { "color": "#0A0806", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#CA8A04", "text": "#1A1204", "hover": "#A16207" },
      "secondaryButton": { "bg": "rgba(202,138,4,0.08)", "text": "#FAFAF9", "border": "#CA8A04", "hover": "rgba(202,138,4,0.18)" },
      "icon": "#CA8A04", "iconBg": "rgba(202,138,4,0.12)",
      "featureBox": { "background": "#1C1917", "border": "rgba(202,138,4,0.18)", "iconColor": "#CA8A04", "iconBg": "rgba(202,138,4,0.12)", "titleColor": "#FAFAF9", "textColor": "#B8B2A7" },
      "subheading": "#EAB308", "secondaryHeading": "#CA8A04",
      "accent": "#CA8A04",
      "gradient": { "from": "#12100E", "to": "#1C1917" },
      "ring": "#EAB308", "shadow": "rgba(202,138,4,0.20)",
      "badge": { "text": "#1A1204", "background": "rgba(202,138,4,0.20)" },
      "trust": { "text": "#B8B2A7", "dot1": "#22C55E", "dot2": "#60A5FA", "dot3": "#EAB308" },
      "accordion": { "questionColor": "#FAFAF9", "answerColor": "#B8B2A7" },
      "link": "#EAB308", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#1C1917", "inputBorder": "rgba(202,138,4,0.25)", "inputText": "#FAFAF9", "inputPlaceholder": "#78716C",
      "navBackground": "#12100E", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#0D0B09",
      "light": {
        "surface": "#FAFAF9", "heading": "#1C1917", "description": "#44403C",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(161,98,7,0.12)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#78716C", "accent": "#A16207",
        "subheading": "#A16207", "secondaryHeading": "#A16207",
        "icon": "#A16207", "iconBg": "rgba(161,98,7,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(161,98,7,0.12)", "iconColor": "#A16207", "iconBg": "rgba(161,98,7,0.12)", "titleColor": "#1C1917", "textColor": "#57534E" },
        "primaryButton": { "bg": "#A16207", "text": "#FFFFFF", "hover": "#854D0E" },
        "badge": { "text": "#FFFFFF", "background": "rgba(161,98,7,0.14)" },
        "trust": { "text": "#78716C", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#EAB308" },
        "link": "#A16207",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#1C1917", "inputPlaceholder": "#78716C",
        "overlay": { "color": "#FAFAF9", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#1C1917", "answerColor": "#44403C" }
      }
    }
  },
  {
    "name": "Graphite Indigo",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FAFAFA", "description": "#A1A1AA", "surface": "#121214",
      "cardBackground": "#1C1C1F", "cardBorder": "rgba(99,102,241,0.16)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#71717A",
      "overlay": { "color": "#09090B", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#6366F1", "text": "#FFFFFF", "hover": "#4F46E5" },
      "secondaryButton": { "bg": "rgba(99,102,241,0.08)", "text": "#FAFAFA", "border": "#6366F1", "hover": "rgba(99,102,241,0.18)" },
      "icon": "#6366F1", "iconBg": "rgba(99,102,241,0.12)",
      "featureBox": { "background": "#1C1C1F", "border": "rgba(99,102,241,0.18)", "iconColor": "#6366F1", "iconBg": "rgba(99,102,241,0.12)", "titleColor": "#FAFAFA", "textColor": "#A1A1AA" },
      "subheading": "#818CF8", "secondaryHeading": "#6366F1",
      "accent": "#6366F1",
      "gradient": { "from": "#121214", "to": "#1C1C1F" },
      "ring": "#818CF8", "shadow": "rgba(99,102,241,0.22)",
      "badge": { "text": "#FFFFFF", "background": "rgba(99,102,241,0.20)" },
      "trust": { "text": "#A1A1AA", "dot1": "#22C55E", "dot2": "#818CF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#FAFAFA", "answerColor": "#A1A1AA" },
      "link": "#818CF8", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#1C1C1F", "inputBorder": "rgba(99,102,241,0.25)", "inputText": "#FAFAFA", "inputPlaceholder": "#71717A",
      "navBackground": "#121214", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#0D0D0F",
      "light": {
        "surface": "#FAFAFA", "heading": "#18181B", "description": "#3F3F46",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(79,70,229,0.10)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#71717A", "accent": "#4F46E5",
        "subheading": "#4F46E5", "secondaryHeading": "#4F46E5",
        "icon": "#4F46E5", "iconBg": "rgba(79,70,229,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(79,70,229,0.10)", "iconColor": "#4F46E5", "iconBg": "rgba(79,70,229,0.10)", "titleColor": "#18181B", "textColor": "#52525B" },
        "primaryButton": { "bg": "#4F46E5", "text": "#FFFFFF", "hover": "#4338CA" },
        "badge": { "text": "#FFFFFF", "background": "rgba(79,70,229,0.12)" },
        "trust": { "text": "#71717A", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#4F46E5",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#18181B", "inputPlaceholder": "#71717A",
        "overlay": { "color": "#FAFAFA", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#18181B", "answerColor": "#3F3F46" }
      }
    }
  },
  {
    "name": "Teal Mist",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#F0FDFA", "description": "#99C6BF", "surface": "#0A1614",
      "cardBackground": "#122320", "cardBorder": "rgba(20,184,166,0.16)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#6B8A85",
      "overlay": { "color": "#040D0B", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#14B8A6", "text": "#04211D", "hover": "#0D9488" },
      "secondaryButton": { "bg": "rgba(20,184,166,0.08)", "text": "#F0FDFA", "border": "#14B8A6", "hover": "rgba(20,184,166,0.18)" },
      "icon": "#14B8A6", "iconBg": "rgba(20,184,166,0.12)",
      "featureBox": { "background": "#122320", "border": "rgba(20,184,166,0.18)", "iconColor": "#14B8A6", "iconBg": "rgba(20,184,166,0.12)", "titleColor": "#F0FDFA", "textColor": "#99C6BF" },
      "subheading": "#2DD4BF", "secondaryHeading": "#14B8A6",
      "accent": "#14B8A6",
      "gradient": { "from": "#0A1614", "to": "#122320" },
      "ring": "#2DD4BF", "shadow": "rgba(20,184,166,0.20)",
      "badge": { "text": "#04211D", "background": "rgba(20,184,166,0.20)" },
      "trust": { "text": "#99C6BF", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#F0FDFA", "answerColor": "#99C6BF" },
      "link": "#2DD4BF", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#122320", "inputBorder": "rgba(20,184,166,0.25)", "inputText": "#F0FDFA", "inputPlaceholder": "#6B8A85",
      "navBackground": "#0A1614", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#060F0D",
      "light": {
        "surface": "#FFFFFF", "heading": "#0F172A", "description": "#334155",
        "cardBackground": "#F8FAFC", "cardBorder": "rgba(15,23,42,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#64748B", "accent": "#0D9488",
        "subheading": "#0D9488", "secondaryHeading": "#0D9488",
        "icon": "#0D9488", "iconBg": "rgba(13,148,136,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(15,23,42,0.08)", "iconColor": "#0D9488", "iconBg": "rgba(13,148,136,0.10)", "titleColor": "#0F172A", "textColor": "#475569" },
        "primaryButton": { "bg": "#0D9488", "text": "#FFFFFF", "hover": "#0F766E" },
        "badge": { "text": "#FFFFFF", "background": "rgba(13,148,136,0.12)" },
        "trust": { "text": "#64748B", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#0D9488",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#0F172A", "inputPlaceholder": "#94A3B8",
        "overlay": { "color": "#FFFFFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#0F172A", "answerColor": "#334155" }
      }
    }
  },
  {
    "name": "Coral Dusk",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FFF7ED", "description": "#D6BBA8", "surface": "#170F0A",
      "cardBackground": "#241811", "cardBorder": "rgba(249,115,22,0.16)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#94786A",
      "overlay": { "color": "#0F0805", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#F97316", "text": "#2A1204", "hover": "#EA580C" },
      "secondaryButton": { "bg": "rgba(249,115,22,0.08)", "text": "#FFF7ED", "border": "#F97316", "hover": "rgba(249,115,22,0.18)" },
      "icon": "#F97316", "iconBg": "rgba(249,115,22,0.12)",
      "featureBox": { "background": "#241811", "border": "rgba(249,115,22,0.18)", "iconColor": "#F97316", "iconBg": "rgba(249,115,22,0.12)", "titleColor": "#FFF7ED", "textColor": "#D6BBA8" },
      "subheading": "#FB923C", "secondaryHeading": "#F97316",
      "accent": "#F97316",
      "gradient": { "from": "#170F0A", "to": "#241811" },
      "ring": "#FB923C", "shadow": "rgba(249,115,22,0.20)",
      "badge": { "text": "#2A1204", "background": "rgba(249,115,22,0.20)" },
      "trust": { "text": "#D6BBA8", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#FFF7ED", "answerColor": "#D6BBA8" },
      "link": "#FB923C", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#241811", "inputBorder": "rgba(249,115,22,0.25)", "inputText": "#FFF7ED", "inputPlaceholder": "#94786A",
      "navBackground": "#170F0A", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#120A06",
      "light": {
        "surface": "#FAFAF9", "heading": "#292524", "description": "#57534E",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(41,37,36,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#78716C", "accent": "#EA580C",
        "subheading": "#EA580C", "secondaryHeading": "#EA580C",
        "icon": "#EA580C", "iconBg": "rgba(234,88,12,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(41,37,36,0.08)", "iconColor": "#EA580C", "iconBg": "rgba(234,88,12,0.10)", "titleColor": "#292524", "textColor": "#57534E" },
        "primaryButton": { "bg": "#EA580C", "text": "#FFFFFF", "hover": "#C2410C" },
        "badge": { "text": "#FFFFFF", "background": "rgba(234,88,12,0.12)" },
        "trust": { "text": "#78716C", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#EA580C",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#292524", "inputPlaceholder": "#A8A29E",
        "overlay": { "color": "#FAFAF9", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#292524", "answerColor": "#57534E" }
      }
    }
  },
  {
    "name": "Royal Plum",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FAF5FF", "description": "#C9B6D6", "surface": "#130A17",
      "cardBackground": "#1E1024", "cardBorder": "rgba(162,28,175,0.16)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#8A7594",
      "overlay": { "color": "#0B0510", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#A21CAF", "text": "#FAF5FF", "hover": "#86198F" },
      "secondaryButton": { "bg": "rgba(162,28,175,0.08)", "text": "#FAF5FF", "border": "#A21CAF", "hover": "rgba(162,28,175,0.18)" },
      "icon": "#C026D3", "iconBg": "rgba(162,28,175,0.12)",
      "featureBox": { "background": "#1E1024", "border": "rgba(162,28,175,0.18)", "iconColor": "#C026D3", "iconBg": "rgba(162,28,175,0.12)", "titleColor": "#FAF5FF", "textColor": "#C9B6D6" },
      "subheading": "#D946EF", "secondaryHeading": "#C026D3",
      "accent": "#C026D3",
      "gradient": { "from": "#130A17", "to": "#1E1024" },
      "ring": "#D946EF", "shadow": "rgba(162,28,175,0.20)",
      "badge": { "text": "#FAF5FF", "background": "rgba(162,28,175,0.20)" },
      "trust": { "text": "#C9B6D6", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#FAF5FF", "answerColor": "#C9B6D6" },
      "link": "#D946EF", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#1E1024", "inputBorder": "rgba(162,28,175,0.25)", "inputText": "#FAF5FF", "inputPlaceholder": "#8A7594",
      "navBackground": "#130A17", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#0D0611",
      "light": {
        "surface": "#FFFFFF", "heading": "#1E1B2E", "description": "#3F3B52",
        "cardBackground": "#FAFAFF", "cardBorder": "rgba(30,27,46,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#6B6580", "accent": "#A21CAF",
        "subheading": "#A21CAF", "secondaryHeading": "#A21CAF",
        "icon": "#A21CAF", "iconBg": "rgba(162,28,175,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(30,27,46,0.08)", "iconColor": "#A21CAF", "iconBg": "rgba(162,28,175,0.10)", "titleColor": "#1E1B2E", "textColor": "#4B4660" },
        "primaryButton": { "bg": "#A21CAF", "text": "#FFFFFF", "hover": "#86198F" },
        "badge": { "text": "#FFFFFF", "background": "rgba(162,28,175,0.12)" },
        "trust": { "text": "#6B6580", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#A21CAF",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#1E1B2E", "inputPlaceholder": "#9691A8",
        "overlay": { "color": "#FFFFFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#1E1B2E", "answerColor": "#3F3B52" }
      }
    }
  },
  {
    "name": "Forest Sage",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#F1F8E9", "description": "#B7C7A6", "surface": "#0D130A",
      "cardBackground": "#161F10", "cardBorder": "rgba(77,124,15,0.18)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#7E8C6E",
      "overlay": { "color": "#070B05", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#65A30D", "text": "#0D130A", "hover": "#4D7C0F" },
      "secondaryButton": { "bg": "rgba(101,163,13,0.08)", "text": "#F1F8E9", "border": "#65A30D", "hover": "rgba(101,163,13,0.18)" },
      "icon": "#84CC16", "iconBg": "rgba(101,163,13,0.12)",
      "featureBox": { "background": "#161F10", "border": "rgba(101,163,13,0.18)", "iconColor": "#84CC16", "iconBg": "rgba(101,163,13,0.12)", "titleColor": "#F1F8E9", "textColor": "#B7C7A6" },
      "subheading": "#A3E635", "secondaryHeading": "#84CC16",
      "accent": "#84CC16",
      "gradient": { "from": "#0D130A", "to": "#161F10" },
      "ring": "#A3E635", "shadow": "rgba(101,163,13,0.20)",
      "badge": { "text": "#0D130A", "background": "rgba(101,163,13,0.20)" },
      "trust": { "text": "#B7C7A6", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#F1F8E9", "answerColor": "#B7C7A6" },
      "link": "#A3E635", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#161F10", "inputBorder": "rgba(101,163,13,0.25)", "inputText": "#F1F8E9", "inputPlaceholder": "#7E8C6E",
      "navBackground": "#0D130A", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#090E06",
      "light": {
        "surface": "#FAFAF9", "heading": "#1C2617", "description": "#44502F",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(28,38,23,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#6B7563", "accent": "#4D7C0F",
        "subheading": "#4D7C0F", "secondaryHeading": "#4D7C0F",
        "icon": "#4D7C0F", "iconBg": "rgba(77,124,15,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(28,38,23,0.08)", "iconColor": "#4D7C0F", "iconBg": "rgba(77,124,15,0.10)", "titleColor": "#1C2617", "textColor": "#4B5540" },
        "primaryButton": { "bg": "#4D7C0F", "text": "#FFFFFF", "hover": "#3F6212" },
        "badge": { "text": "#FFFFFF", "background": "rgba(77,124,15,0.12)" },
        "trust": { "text": "#6B7563", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#4D7C0F",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#1C2617", "inputPlaceholder": "#96A08C",
        "overlay": { "color": "#FAFAF9", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#1C2617", "answerColor": "#44502F" }
      }
    }
  },
  {
    "name": "Copper Bronze",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FEF6EC", "description": "#D3B99C", "surface": "#150E07",
      "cardBackground": "#20160D", "cardBorder": "rgba(180,83,9,0.18)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#95795F",
      "overlay": { "color": "#0E0904", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#B45309", "text": "#FEF6EC", "hover": "#92400E" },
      "secondaryButton": { "bg": "rgba(180,83,9,0.08)", "text": "#FEF6EC", "border": "#B45309", "hover": "rgba(180,83,9,0.18)" },
      "icon": "#D97706", "iconBg": "rgba(180,83,9,0.12)",
      "featureBox": { "background": "#20160D", "border": "rgba(180,83,9,0.18)", "iconColor": "#D97706", "iconBg": "rgba(180,83,9,0.12)", "titleColor": "#FEF6EC", "textColor": "#D3B99C" },
      "subheading": "#F59E0B", "secondaryHeading": "#D97706",
      "accent": "#D97706",
      "gradient": { "from": "#150E07", "to": "#20160D" },
      "ring": "#F59E0B", "shadow": "rgba(180,83,9,0.20)",
      "badge": { "text": "#FEF6EC", "background": "rgba(180,83,9,0.20)" },
      "trust": { "text": "#D3B99C", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#FEF6EC", "answerColor": "#D3B99C" },
      "link": "#F59E0B", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#20160D", "inputBorder": "rgba(180,83,9,0.25)", "inputText": "#FEF6EC", "inputPlaceholder": "#95795F",
      "navBackground": "#150E07", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#0F0A05",
      "light": {
        "surface": "#FAF7F2", "heading": "#292524", "description": "#57534E",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(41,37,36,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#78716C", "accent": "#B45309",
        "subheading": "#B45309", "secondaryHeading": "#B45309",
        "icon": "#B45309", "iconBg": "rgba(180,83,9,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(41,37,36,0.08)", "iconColor": "#B45309", "iconBg": "rgba(180,83,9,0.10)", "titleColor": "#292524", "textColor": "#57534E" },
        "primaryButton": { "bg": "#B45309", "text": "#FFFFFF", "hover": "#92400E" },
        "badge": { "text": "#FFFFFF", "background": "rgba(180,83,9,0.12)" },
        "trust": { "text": "#78716C", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#B45309",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#292524", "inputPlaceholder": "#A8A29E",
        "overlay": { "color": "#FAF7F2", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#292524", "answerColor": "#57534E" }
      }
    }
  },
  {
    "name": "Steel Cyan",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#ECFEFF", "description": "#A7C4CC", "surface": "#08131A",
      "cardBackground": "#0E1F27", "cardBorder": "rgba(8,145,178,0.18)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#6C8790",
      "overlay": { "color": "#050D12", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#0891B2", "text": "#ECFEFF", "hover": "#0E7490" },
      "secondaryButton": { "bg": "rgba(8,145,178,0.08)", "text": "#ECFEFF", "border": "#0891B2", "hover": "rgba(8,145,178,0.18)" },
      "icon": "#06B6D4", "iconBg": "rgba(8,145,178,0.12)",
      "featureBox": { "background": "#0E1F27", "border": "rgba(8,145,178,0.18)", "iconColor": "#06B6D4", "iconBg": "rgba(8,145,178,0.12)", "titleColor": "#ECFEFF", "textColor": "#A7C4CC" },
      "subheading": "#22D3EE", "secondaryHeading": "#06B6D4",
      "accent": "#06B6D4",
      "gradient": { "from": "#08131A", "to": "#0E1F27" },
      "ring": "#22D3EE", "shadow": "rgba(8,145,178,0.20)",
      "badge": { "text": "#08131A", "background": "rgba(8,145,178,0.20)" },
      "trust": { "text": "#A7C4CC", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#ECFEFF", "answerColor": "#A7C4CC" },
      "link": "#22D3EE", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#0E1F27", "inputBorder": "rgba(8,145,178,0.25)", "inputText": "#ECFEFF", "inputPlaceholder": "#6C8790",
      "navBackground": "#08131A", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#050D12",
      "light": {
        "surface": "#F8FAFC", "heading": "#0F172A", "description": "#334155",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(15,23,42,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#64748B", "accent": "#0891B2",
        "subheading": "#0891B2", "secondaryHeading": "#0891B2",
        "icon": "#0891B2", "iconBg": "rgba(8,145,178,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(15,23,42,0.08)", "iconColor": "#0891B2", "iconBg": "rgba(8,145,178,0.10)", "titleColor": "#0F172A", "textColor": "#475569" },
        "primaryButton": { "bg": "#0891B2", "text": "#FFFFFF", "hover": "#0E7490" },
        "badge": { "text": "#FFFFFF", "background": "rgba(8,145,178,0.12)" },
        "trust": { "text": "#64748B", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#0891B2",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#0F172A", "inputPlaceholder": "#94A3B8",
        "overlay": { "color": "#F8FAFC", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#0F172A", "answerColor": "#334155" }
      }
    }
  },
  {
    "name": "Rosewood Blush",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FFF1F5", "description": "#D6A9B8", "surface": "#160A0F",
      "cardBackground": "#221017", "cardBorder": "rgba(190,24,93,0.18)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#9A6E7C",
      "overlay": { "color": "#0F0609", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#BE185D", "text": "#FFF1F5", "hover": "#9D174D" },
      "secondaryButton": { "bg": "rgba(190,24,93,0.08)", "text": "#FFF1F5", "border": "#BE185D", "hover": "rgba(190,24,93,0.18)" },
      "icon": "#DB2777", "iconBg": "rgba(190,24,93,0.12)",
      "featureBox": { "background": "#221017", "border": "rgba(190,24,93,0.18)", "iconColor": "#DB2777", "iconBg": "rgba(190,24,93,0.12)", "titleColor": "#FFF1F5", "textColor": "#D6A9B8" },
      "subheading": "#EC4899", "secondaryHeading": "#DB2777",
      "accent": "#DB2777",
      "gradient": { "from": "#160A0F", "to": "#221017" },
      "ring": "#EC4899", "shadow": "rgba(190,24,93,0.20)",
      "badge": { "text": "#FFF1F5", "background": "rgba(190,24,93,0.20)" },
      "trust": { "text": "#D6A9B8", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#FFF1F5", "answerColor": "#D6A9B8" },
      "link": "#EC4899", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#221017", "inputBorder": "rgba(190,24,93,0.25)", "inputText": "#FFF1F5", "inputPlaceholder": "#9A6E7C",
      "navBackground": "#160A0F", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#100609",
      "light": {
        "surface": "#FFFFFF", "heading": "#1F2937", "description": "#374151",
        "cardBackground": "#FDF6F8", "cardBorder": "rgba(31,41,55,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#6B7280", "accent": "#BE185D",
        "subheading": "#BE185D", "secondaryHeading": "#BE185D",
        "icon": "#BE185D", "iconBg": "rgba(190,24,93,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(31,41,55,0.08)", "iconColor": "#BE185D", "iconBg": "rgba(190,24,93,0.10)", "titleColor": "#1F2937", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#BE185D", "text": "#FFFFFF", "hover": "#9D174D" },
        "badge": { "text": "#FFFFFF", "background": "rgba(190,24,93,0.12)" },
        "trust": { "text": "#6B7280", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#BE185D",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#1F2937", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#FFFFFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#1F2937", "answerColor": "#374151" }
      }
    }
  },
  {
    "name": "Arctic Blue",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#EFF6FF", "description": "#A9C0DA", "surface": "#0A121E",
      "cardBackground": "#111C2E", "cardBorder": "rgba(59,130,246,0.18)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#728AA6",
      "overlay": { "color": "#060B14", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#3B82F6", "text": "#0A121E", "hover": "#2563EB" },
      "secondaryButton": { "bg": "rgba(59,130,246,0.08)", "text": "#EFF6FF", "border": "#3B82F6", "hover": "rgba(59,130,246,0.18)" },
      "icon": "#60A5FA", "iconBg": "rgba(59,130,246,0.12)",
      "featureBox": { "background": "#111C2E", "border": "rgba(59,130,246,0.18)", "iconColor": "#60A5FA", "iconBg": "rgba(59,130,246,0.12)", "titleColor": "#EFF6FF", "textColor": "#A9C0DA" },
      "subheading": "#93C5FD", "secondaryHeading": "#60A5FA",
      "accent": "#60A5FA",
      "gradient": { "from": "#0A121E", "to": "#111C2E" },
      "ring": "#93C5FD", "shadow": "rgba(59,130,246,0.20)",
      "badge": { "text": "#0A121E", "background": "rgba(59,130,246,0.20)" },
      "trust": { "text": "#A9C0DA", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#EFF6FF", "answerColor": "#A9C0DA" },
      "link": "#93C5FD", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#111C2E", "inputBorder": "rgba(59,130,246,0.25)", "inputText": "#EFF6FF", "inputPlaceholder": "#728AA6",
      "navBackground": "#0A121E", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#070C15",
      "light": {
        "surface": "#F8FAFC", "heading": "#0F172A", "description": "#334155",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(15,23,42,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#64748B", "accent": "#3B82F6",
        "subheading": "#3B82F6", "secondaryHeading": "#3B82F6",
        "icon": "#3B82F6", "iconBg": "rgba(59,130,246,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(15,23,42,0.08)", "iconColor": "#3B82F6", "iconBg": "rgba(59,130,246,0.10)", "titleColor": "#0F172A", "textColor": "#475569" },
        "primaryButton": { "bg": "#3B82F6", "text": "#FFFFFF", "hover": "#2563EB" },
        "badge": { "text": "#FFFFFF", "background": "rgba(59,130,246,0.12)" },
        "trust": { "text": "#64748B", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#3B82F6",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#0F172A", "inputPlaceholder": "#94A3B8",
        "overlay": { "color": "#F8FAFC", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#0F172A", "answerColor": "#334155" }
      }
    }
  },
  {
    "name": "Mocha Taupe",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#F5EEE8", "description": "#C4B0A2", "surface": "#14100D",
      "cardBackground": "#1F1813", "cardBorder": "rgba(161,128,114,0.20)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#8A7A6E",
      "overlay": { "color": "#0D0A07", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#A18072", "text": "#14100D", "hover": "#8A6B5D" },
      "secondaryButton": { "bg": "rgba(161,128,114,0.08)", "text": "#F5EEE8", "border": "#A18072", "hover": "rgba(161,128,114,0.18)" },
      "icon": "#BFA091", "iconBg": "rgba(161,128,114,0.14)",
      "featureBox": { "background": "#1F1813", "border": "rgba(161,128,114,0.20)", "iconColor": "#BFA091", "iconBg": "rgba(161,128,114,0.14)", "titleColor": "#F5EEE8", "textColor": "#C4B0A2" },
      "subheading": "#CBB0A2", "secondaryHeading": "#BFA091",
      "accent": "#BFA091",
      "gradient": { "from": "#14100D", "to": "#1F1813" },
      "ring": "#CBB0A2", "shadow": "rgba(161,128,114,0.22)",
      "badge": { "text": "#14100D", "background": "rgba(161,128,114,0.22)" },
      "trust": { "text": "#C4B0A2", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#F5EEE8", "answerColor": "#C4B0A2" },
      "link": "#CBB0A2", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#1F1813", "inputBorder": "rgba(161,128,114,0.28)", "inputText": "#F5EEE8", "inputPlaceholder": "#8A7A6E",
      "navBackground": "#14100D", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#0E0B08",
      "light": {
        "surface": "#FAF8F6", "heading": "#292524", "description": "#57534E",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(41,37,36,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#78716C", "accent": "#8A6B5D",
        "subheading": "#8A6B5D", "secondaryHeading": "#8A6B5D",
        "icon": "#8A6B5D", "iconBg": "rgba(138,107,93,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(41,37,36,0.08)", "iconColor": "#8A6B5D", "iconBg": "rgba(138,107,93,0.10)", "titleColor": "#292524", "textColor": "#57534E" },
        "primaryButton": { "bg": "#8A6B5D", "text": "#FFFFFF", "hover": "#6F5449" },
        "badge": { "text": "#FFFFFF", "background": "rgba(138,107,93,0.14)" },
        "trust": { "text": "#78716C", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#8A6B5D",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#292524", "inputPlaceholder": "#A8A29E",
        "overlay": { "color": "#FAF8F6", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#292524", "answerColor": "#57534E" }
      }
    }
  },
  {
    "name": "Aubergine Wine",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FDF2F4", "description": "#CBA3AC", "surface": "#140708",
      "cardBackground": "#1F0D10", "cardBorder": "rgba(159,18,57,0.20)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#9A6B73",
      "overlay": { "color": "#0D0405", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#9F1239", "text": "#FDF2F4", "hover": "#881337" },
      "secondaryButton": { "bg": "rgba(159,18,57,0.08)", "text": "#FDF2F4", "border": "#9F1239", "hover": "rgba(159,18,57,0.18)" },
      "icon": "#E11D48", "iconBg": "rgba(159,18,57,0.14)",
      "featureBox": { "background": "#1F0D10", "border": "rgba(159,18,57,0.20)", "iconColor": "#E11D48", "iconBg": "rgba(159,18,57,0.14)", "titleColor": "#FDF2F4", "textColor": "#CBA3AC" },
      "subheading": "#FB7185", "secondaryHeading": "#E11D48",
      "accent": "#E11D48",
      "gradient": { "from": "#140708", "to": "#1F0D10" },
      "ring": "#FB7185", "shadow": "rgba(159,18,57,0.22)",
      "badge": { "text": "#FDF2F4", "background": "rgba(159,18,57,0.22)" },
      "trust": { "text": "#CBA3AC", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#FDF2F4", "answerColor": "#CBA3AC" },
      "link": "#FB7185", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#1F0D10", "inputBorder": "rgba(159,18,57,0.28)", "inputText": "#FDF2F4", "inputPlaceholder": "#9A6B73",
      "navBackground": "#140708", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#0E0405",
      "light": {
        "surface": "#FFFFFF", "heading": "#1F2937", "description": "#374151",
        "cardBackground": "#FDF5F6", "cardBorder": "rgba(31,41,55,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#6B7280", "accent": "#9F1239",
        "subheading": "#9F1239", "secondaryHeading": "#9F1239",
        "icon": "#9F1239", "iconBg": "rgba(159,18,57,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(31,41,55,0.08)", "iconColor": "#9F1239", "iconBg": "rgba(159,18,57,0.10)", "titleColor": "#1F2937", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#9F1239", "text": "#FFFFFF", "hover": "#881337" },
        "badge": { "text": "#FFFFFF", "background": "rgba(159,18,57,0.12)" },
        "trust": { "text": "#6B7280", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#9F1239",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#1F2937", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#FFFFFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#1F2937", "answerColor": "#374151" }
      }
    }
  },
  {
    "name": "Midnight Sapphire",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#EEF2FF", "description": "#A6ACD4", "surface": "#080B1A",
      "cardBackground": "#0F1329", "cardBorder": "rgba(29,78,216,0.20)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#6E749B",
      "overlay": { "color": "#050710", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#1D4ED8", "text": "#EEF2FF", "hover": "#1E40AF" },
      "secondaryButton": { "bg": "rgba(29,78,216,0.08)", "text": "#EEF2FF", "border": "#1D4ED8", "hover": "rgba(29,78,216,0.18)" },
      "icon": "#4F7DF9", "iconBg": "rgba(29,78,216,0.14)",
      "featureBox": { "background": "#0F1329", "border": "rgba(29,78,216,0.20)", "iconColor": "#4F7DF9", "iconBg": "rgba(29,78,216,0.14)", "titleColor": "#EEF2FF", "textColor": "#A6ACD4" },
      "subheading": "#818CF8", "secondaryHeading": "#4F7DF9",
      "accent": "#4F7DF9",
      "gradient": { "from": "#080B1A", "to": "#0F1329" },
      "ring": "#818CF8", "shadow": "rgba(29,78,216,0.22)",
      "badge": { "text": "#080B1A", "background": "rgba(29,78,216,0.22)" },
      "trust": { "text": "#A6ACD4", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#EEF2FF", "answerColor": "#A6ACD4" },
      "link": "#818CF8", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#0F1329", "inputBorder": "rgba(29,78,216,0.28)", "inputText": "#EEF2FF", "inputPlaceholder": "#6E749B",
      "navBackground": "#080B1A", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#050710",
      "light": {
        "surface": "#F8FAFF", "heading": "#111827", "description": "#374151",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(17,24,39,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#6B7280", "accent": "#1D4ED8",
        "subheading": "#1D4ED8", "secondaryHeading": "#1D4ED8",
        "icon": "#1D4ED8", "iconBg": "rgba(29,78,216,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(17,24,39,0.08)", "iconColor": "#1D4ED8", "iconBg": "rgba(29,78,216,0.10)", "titleColor": "#111827", "textColor": "#4B5563" },
        "primaryButton": { "bg": "#1D4ED8", "text": "#FFFFFF", "hover": "#1E40AF" },
        "badge": { "text": "#FFFFFF", "background": "rgba(29,78,216,0.12)" },
        "trust": { "text": "#6B7280", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#1D4ED8",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#111827", "inputPlaceholder": "#9CA3AF",
        "overlay": { "color": "#F8FAFF", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#111827", "answerColor": "#374151" }
      }
    }
  },
  {
    "name": "Mustard Ochre",
    "typography": THEME_TYPOGRAPHY,
    "elements": {
      "heading": "#FEFBEB", "description": "#CDBE8E", "surface": "#131005",
      "cardBackground": "#1D180A", "cardBorder": "rgba(202,138,4,0.20)",
      "borderColor": "rgba(255,255,255,0.08)",
      "divider": "rgba(255,255,255,0.06)",
      "muted": "#8F8258",
      "overlay": { "color": "#0C0A03", "opacity": 0.92, "blend": "normal" },
      "primaryButton": { "bg": "#CA8A04", "text": "#131005", "hover": "#A16207" },
      "secondaryButton": { "bg": "rgba(202,138,4,0.08)", "text": "#FEFBEB", "border": "#CA8A04", "hover": "rgba(202,138,4,0.18)" },
      "icon": "#EAB308", "iconBg": "rgba(202,138,4,0.14)",
      "featureBox": { "background": "#1D180A", "border": "rgba(202,138,4,0.20)", "iconColor": "#EAB308", "iconBg": "rgba(202,138,4,0.14)", "titleColor": "#FEFBEB", "textColor": "#CDBE8E" },
      "subheading": "#FACC15", "secondaryHeading": "#EAB308",
      "accent": "#EAB308",
      "gradient": { "from": "#131005", "to": "#1D180A" },
      "ring": "#FACC15", "shadow": "rgba(202,138,4,0.22)",
      "badge": { "text": "#131005", "background": "rgba(202,138,4,0.22)" },
      "trust": { "text": "#CDBE8E", "dot1": "#22C55E", "dot2": "#38BDF8", "dot3": "#FBBF24" },
      "accordion": { "questionColor": "#FEFBEB", "answerColor": "#CDBE8E" },
      "link": "#FACC15", "success": "#22C55E", "warning": "#F59E0B", "error": "#EF4444",
      "inputBg": "#1D180A", "inputBorder": "rgba(202,138,4,0.28)", "inputText": "#FEFBEB", "inputPlaceholder": "#8F8258",
      "navBackground": "#131005", "navBorder": "rgba(255,255,255,0.06)",
      "footerBackground": "#0D0A03",
      "light": {
        "surface": "#FAFAF9", "heading": "#292524", "description": "#57534E",
        "cardBackground": "#FFFFFF", "cardBorder": "rgba(41,37,36,0.08)",
        "borderColor": "rgba(0,0,0,0.08)", "divider": "rgba(0,0,0,0.06)",
        "muted": "#78716C", "accent": "#A16207",
        "subheading": "#A16207", "secondaryHeading": "#A16207",
        "icon": "#A16207", "iconBg": "rgba(161,98,7,0.08)",
        "featureBox": { "background": "#FFFFFF", "border": "rgba(41,37,36,0.08)", "iconColor": "#A16207", "iconBg": "rgba(161,98,7,0.10)", "titleColor": "#292524", "textColor": "#57534E" },
        "primaryButton": { "bg": "#A16207", "text": "#FFFFFF", "hover": "#854D0E" },
        "badge": { "text": "#FFFFFF", "background": "rgba(161,98,7,0.12)" },
        "trust": { "text": "#78716C", "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B" },
        "link": "#A16207",
        "inputBg": "#FFFFFF", "inputBorder": "rgba(0,0,0,0.15)", "inputText": "#292524", "inputPlaceholder": "#A8A29E",
        "overlay": { "color": "#FAFAF9", "opacity": 0.92, "blend": "normal" },
        "accordion": { "questionColor": "#292524", "answerColor": "#57534E" }
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

  /** About page — own why-choose. */
  aboutwhychoose: {
    type: 'aboutwhychoose',
    content: { badgeText: 'Why Choose Us', title: 'Why Homeowners Trust Us', subtitle: 'We combine experience, honesty and care to deliver a service you can rely on.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'AboutWhyChooseDefault' }
  },
  /** About page — own CTA. */
  aboutcta: {
    type: 'aboutcta',
    content: { title: 'Ready to Work With Us?', subtitle: 'Get in touch today and let our team take care of the rest.', ctaText: 'Get in Touch' },
    styles: { paddingTop: 'pt-20 lg:pt-28', paddingBottom: 'pb-20 lg:pb-28', paddingX: 'px-6', textAlign: 'center', variant: 'AboutCtaDefault' }
  },
  /** About page — own FAQ. */
  aboutfaq: {
    type: 'aboutfaq',
    content: { title: 'Frequently Asked Questions', subtitle: 'Everything you might want to know about our company and team.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'AboutFaqDefault' }
  },

  /** Contact page — own CTA. */
  contactcta: {
    type: 'contactcta',
    content: { title: 'Prefer to Talk Right Now?', subtitle: 'Our friendly team is a phone call away and ready to help.', ctaText: 'Call Us Today' },
    styles: { paddingTop: 'pt-20 lg:pt-28', paddingBottom: 'pb-20 lg:pb-28', paddingX: 'px-6', textAlign: 'center', variant: 'ContactCtaDefault' }
  },
  /** Contact page — own FAQ. */
  contactfaq: {
    type: 'contactfaq',
    content: { title: 'Contact FAQs', subtitle: 'Answers to common questions about getting in touch.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ContactFaqDefault' }
  },

  /** Services listing page — own sections. */
  serviceslisthero: {
    type: 'serviceslisthero',
    content: { badgeText: 'Our Services', serviceHeroBadge: 'Our Services', serviceHeroTitle: 'Everything We Offer', serviceHeroSubtitle: 'Explore our full range of professional services — quality work, fair pricing, done right.' },
    styles: { paddingTop: 'pt-24 lg:pt-32', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServicesListHeroDefault' }
  },
  serviceslistgrid: {
    type: 'serviceslistgrid',
    content: { badgeText: 'What We Do', title: 'Our Services', subtitle: 'A complete range of solutions for your home and business.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServicesListGridDefault' }
  },
  serviceslistwhychoose: {
    type: 'serviceslistwhychoose',
    content: { badgeText: 'Why Us', title: 'Why Choose Our Services', subtitle: 'The reasons customers pick us again and again.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServicesListWhyChooseDefault' }
  },
  serviceslistcta: {
    type: 'serviceslistcta',
    content: { title: 'Need One of These Services?', subtitle: 'Request a free quote and we\'ll get right back to you.', ctaText: 'Request a Quote' },
    styles: { paddingTop: 'pt-20 lg:pt-28', paddingBottom: 'pb-20 lg:pb-28', paddingX: 'px-6', textAlign: 'center', variant: 'ServicesListCtaDefault' }
  },
  serviceslistguarantee: {
    type: 'serviceslistguarantee',
    content: { badgeText: 'Our Promise', title: 'Our Service Guarantee', subtitle: 'Every service is backed by our satisfaction guarantee.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'left', variant: 'ServicesListGuaranteeDefault' }
  },
  serviceslistprocess: {
    type: 'serviceslistprocess',
    content: { title: 'How Our Service Works', subtitle: 'A simple, transparent process from booking to completion.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServicesListProcessDefault' }
  },
  serviceslistareas: {
    type: 'serviceslistareas',
    content: { title: 'Service Areas', subtitle: 'We provide our services across all these areas.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServicesListAreasDefault' }
  },
  serviceslistfaq: {
    type: 'serviceslistfaq',
    content: { title: 'Services FAQs', subtitle: 'Common questions about the services we offer.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServicesListFaqDefault' }
  },

  /** Service Detail page — own sections. */
  servicedetailhero: {
    type: 'servicedetailhero',
    content: { badgeText: 'Our Service', serviceHeroBadge: 'Our Service', serviceHeroTitle: 'Professional Service You Can Trust', serviceHeroSubtitle: 'Expert workmanship, upfront pricing and dependable support — every step of the way.' },
    styles: { paddingTop: 'pt-24 lg:pt-32', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServiceDetailHeroDefault' }
  },
  servicedetailabout: {
    type: 'servicedetailabout',
    content: { badgeText: 'About This Service', title: 'About This Service', service_name: 'About This Service' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'left', variant: 'ServiceDetailAboutDefault' }
  },
  servicedetailservices: {
    type: 'servicedetailservices',
    content: { badgeText: 'Sub-Services', title: 'What\'s Included', subtitle: 'Everything this service covers, at a glance.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServiceDetailServicesDefault' }
  },
  servicedetailprocess: {
    type: 'servicedetailprocess',
    content: { title: 'How This Service Works', subtitle: 'Our simple step-by-step process for this service.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServiceDetailProcessDefault' }
  },
  servicedetailcta: {
    type: 'servicedetailcta',
    content: { title: 'Ready to Book This Service?', subtitle: 'Book now and our team will take it from here.', ctaText: 'Book Now' },
    styles: { paddingTop: 'pt-20 lg:pt-28', paddingBottom: 'pb-20 lg:pb-28', paddingX: 'px-6', textAlign: 'center', variant: 'ServiceDetailCtaDefault' }
  },
  servicedetailwhychoose: {
    type: 'servicedetailwhychoose',
    content: { badgeText: 'Why Us', title: 'Why Choose Us for This Service', subtitle: 'What makes us the right choice for this job.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServiceDetailWhyChooseDefault' }
  },
  servicedetailguarantee: {
    type: 'servicedetailguarantee',
    content: { badgeText: 'Our Promise', title: 'Service Guarantee', subtitle: 'This service is backed by our full satisfaction guarantee.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'left', variant: 'ServiceDetailGuaranteeDefault' }
  },
  servicedetailtestimonials: {
    type: 'servicedetailtestimonials',
    content: { title: 'Happy Customers', subtitle: 'Real reviews from customers who booked this service.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServiceDetailTestimonialsDefault' }
  },
  servicedetailfaq: {
    type: 'servicedetailfaq',
    content: { title: 'Service FAQs', subtitle: 'Answers to common questions about this service.' },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'ServiceDetailFaqDefault' }
  },

  /** Location page — hero (own component). */
  locationhero: {
    type: 'locationhero',
    content: {
        badgeText: 'Serving Your Area',
        serviceHeroBadge: 'Serving Your Area',
        serviceHeroTitle: 'Trusted Local Experts in Your City',
        serviceHeroSubtitle: 'Fast, reliable and fully licensed service for homes and businesses right across your neighborhood — available 24/7.'
    },
    styles: { paddingTop: 'pt-24 lg:pt-32', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'LocationHeroDefault' }
  },

  /** Location page — about (own component). */
  locationabout: {
    type: 'locationabout',
    content: {
        badgeText: 'About This Location',
        title: 'Proudly Serving Your Community',
        service_name: 'Proudly Serving Your Community'
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'left', variant: 'LocationAboutDefault' }
  },

  /** Location page — services grid (own component). */
  locationservices: {
    type: 'locationservices',
    content: {
        badgeText: 'Our Services',
        title: 'Services We Offer Here',
        subtitle: 'Full-service solutions for every home and business in your area.'
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'LocationServicesDefault' }
  },

  /** Location page — why choose us (own component). */
  locationwhychoose: {
    type: 'locationwhychoose',
    content: {
        badgeText: 'Why Us',
        title: 'Why Locals Choose Us',
        subtitle: 'We\'re your trusted neighbors — here\'s what sets us apart in your area.'
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'LocationWhyChooseDefault' }
  },

  /** Location page — process (own component). */
  locationprocess: {
    type: 'locationprocess',
    content: {
        title: 'How We Work in Your Area',
        subtitle: 'A simple, transparent process from your first call to the finished job.'
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'LocationProcessDefault' }
  },

  /** Location page — CTA (own component). */
  locationcta: {
    type: 'locationcta',
    content: {
        title: 'Need Service in Your Area Today?',
        subtitle: 'Our local team is standing by. Book now and we\'ll be on our way.',
        ctaText: 'Book Your Local Visit'
    },
    styles: { paddingTop: 'pt-20 lg:pt-28', paddingBottom: 'pb-20 lg:pb-28', paddingX: 'px-6', textAlign: 'center', variant: 'LocationCtaDefault' }
  },

  /** Location page — guarantee (own component). */
  locationguarantee: {
    type: 'locationguarantee',
    content: {
        badgeText: 'Our Promise',
        title: 'Our Local Satisfaction Guarantee',
        subtitle: 'We stand behind every job we do in your neighborhood — guaranteed.'
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'left', variant: 'LocationGuaranteeDefault' }
  },

  /** Location page — promise (own component). */
  locationpromise: {
    type: 'locationpromise',
    content: {
        badgeText: 'Our Promise',
        title: 'A Promise to Your Neighborhood',
        subtitle: 'Honest work, fair pricing and a job done right the first time — for every home in your area.'
    },
    styles: { paddingTop: 'pt-14 lg:pt-20', paddingBottom: 'pb-14 lg:pb-20', paddingX: 'px-6', textAlign: 'center', variant: 'LocationPromiseDefault' }
  },

  /** Location page — testimonials (own component). */
  locationtestimonials: {
    type: 'locationtestimonials',
    content: {
        title: 'What Your Neighbors Say',
        subtitle: 'Real reviews from real customers right in your area.'
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'LocationTestimonialsDefault' }
  },

  /** Location page — areas (own component). */
  locationareas: {
    type: 'locationareas',
    content: {
        title: 'Neighborhoods We Cover',
        subtitle: 'We provide fast, reliable service across all these areas. Not sure if we cover yours? Just ask!'
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'LocationAreasDefault' }
  },

  /** Location page — FAQ (own component). */
  locationfaq: {
    type: 'locationfaq',
    content: {
        title: 'Local Service FAQs',
        subtitle: 'Answers to the questions we hear most from customers in your area.'
    },
    styles: { paddingTop: 'pt-16 lg:pt-24', paddingBottom: 'pb-16 lg:pb-24', paddingX: 'px-6', textAlign: 'center', variant: 'LocationFaqDefault' }
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
