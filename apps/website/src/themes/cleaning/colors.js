export const colorThemes = [
  {
    "name": "Arctic Aurora",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#D7E3EA",
      "surface": "#0A1318",
      "overlay": { "color": "rgb(6, 14, 18, 0.3)", "blend": "multiply" },
      "primaryButton": { "bg": "#06B6D4", "text": "#031014", "hover": "#0891B2" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#67E8F9", "hover": "rgba(103,232,249,0.14)" },
      "accent": "#22C55E",
      "gradient": { "from": "#0A1318", "to": "#0F1F28" },
      "ring": "#67E8F9",
      "shadow": "rgba(0,0,0,0.40)"
    }
  },
  {
    "name": "Desert Rose",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#F1D9DE",
      "surface": "#1A0F12",
      "overlay": { "color": "rgba(24, 10, 12, 0.4)", "blend": "multiply" },
      "primaryButton": { "bg": "#F43F5E", "text": "#FFFFFF", "hover": "#BE123C" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#FDA4AF", "hover": "rgba(253,164,175,0.14)" },
      "accent": "#F59E0B",
      "gradient": { "from": "#1A0F12", "to": "#2A161A" },
      "ring": "#FDA4AF",
      "shadow": "rgba(0,0,0,0.44)"
    }
  },
  {
    "name": "Graphite Neon",
    "elements": {
      "heading": "#FAFAFA",
      "description": "#C9CED6",
      "surface": "#0D0F14",
      "overlay": { "color": "rgba(10,12,18,0.35)", "blend": "multiply" },
      "primaryButton": { "bg": "#22D3EE", "text": "#03161A", "hover": "#06B6D4" },
      "secondaryButton": { "bg": "transparent", "text": "#FAFAFA", "border": "#A7F3D0", "hover": "rgba(167,243,208,0.14)" },
      "accent": "#A7F3D0",
      "gradient": { "from": "#0D0F14", "to": "#151821" },
      "ring": "#22D3EE",
      "shadow": "rgba(0,0,0,0.46)"
    }
  },
  {
    "name": "Mocha Sky",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#E6DBD1",
      "surface": "#121012",
      "overlay": { "color": "rgba(22,14,10,0.3)", "blend": "soft-light" },
      "primaryButton": { "bg": "#8B5CF6", "text": "#FFFFFF", "hover": "#6D28D9" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#C4B5FD", "hover": "rgba(196,181,253,0.14)" },
      "accent": "#F59E0B",
      "gradient": { "from": "#121012", "to": "#1A161A" },
      "ring": "#C4B5FD",
      "shadow": "rgba(0,0,0,0.42)"
    }
  },
  {
    "name": "Sapphire Lime",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#CFE0F0",
      "surface": "#0A1020",
      "overlay": { "color": "rgba(8,12,28,0.35)", "blend": "multiply" },
      "primaryButton": { "bg": "#1D4ED8", "text": "#FFFFFF", "hover": "#163EB3" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#84CC16", "hover": "rgba(132,204,22,0.14)" },
      "accent": "#84CC16",
      "gradient": { "from": "#0A1020", "to": "#0E1830" },
      "ring": "#84CC16",
      "shadow": "rgba(0,0,0,0.40)"
    }
  },
  {
    "name": "Ocean Breeze",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#E0F2FE",
      "surface": "#0C1A2B",
      "overlay": { "color": "rgba(12,26,43,0.55)", "blend": "multiply" },
      "primaryButton": { "bg": "#0EA5E9", "text": "#FFFFFF", "hover": "#0284C7" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#7DD3FC", "hover": "rgba(125,211,252,0.14)" },
      "accent": "#06B6D4",
      "gradient": { "from": "#0C1A2B", "to": "#1E3A8A" },
      "ring": "#7DD3FC",
      "shadow": "rgba(0,0,0,0.45)"
    }
  },
  {
    "name": "Forest Emerald",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#DCFCE7",
      "surface": "#0F1B0F",
      "overlay": { "color": "rgba(15,27,15,0.60)", "blend": "multiply" },
      "primaryButton": { "bg": "#10B981", "text": "#FFFFFF", "hover": "#059669" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#6EE7B7", "hover": "rgba(110,231,183,0.14)" },
      "accent": "#34D399",
      "gradient": { "from": "#0F1B0F", "to": "#166534" },
      "ring": "#6EE7B7",
      "shadow": "rgba(0,0,0,0.42)"
    }
  }
];

// Default theme
export const defaultTheme = "Desert Rose";

// Get theme by name
export const getThemeByName = (themeName) => {
  if (themeName === 'Custom') {
    const customThemeData = localStorage.getItem('customTheme');
    if (customThemeData) {
      return JSON.parse(customThemeData);
    }
  }
  return colorThemes.find(theme => theme.name === themeName) || colorThemes[0];
};

// Get all theme names
export const getThemeNames = () => {
  return colorThemes.map(theme => theme.name);
};


