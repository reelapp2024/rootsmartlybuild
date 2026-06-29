// Export just what we need from registry.tsx
export { registry } from "./registry";

// Export shared registry configuration for use in both builder and custom sites
export { REGISTRY_MAP, getComponentPath, getRegisteredComponentIds } from "./registry-shared";

// Export theme context and provider
export { ThemeProvider, useTheme, type ThemeName, type Theme } from "./themes/context";

// Import styles
import "./themes/styles.css";
import "./styles/responsive.css";

export { themes, fonts, type FontName } from "./themes/themePresets";
