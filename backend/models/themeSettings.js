const mongoose = require("mongoose");

// Define the schema for theme settings
const themeSettingsSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: "Project" // Reference to a Project model (if applicable)
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: "User" // Reference to a User model (if applicable)
  },
  theme: { 
    type: String, 
    required: true, // Preset theme name or 'custom'
    default: 'crimson-jet' // Default theme
  },
  presetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theme", // Reference to Theme model if preset is selected
    default: null
  },
  themes: [
    {
      key: { type: String, required: true },  // key could be "primary", "secondary", etc.
      value: { type: String, required: true }  // value could be a theme code or gradient string
    }
  ],
  themeSubColor: { 
    type: String, // Optional field for the subcolor of the theme
    default: null // Default value for themeSubColor if not provided
  },
  themeSecondaryColor: { 
    type: String, // Optional field for the subcolor of the theme
    default: null // Default value for themeSubColor if not provided
  },
  // Custom theme colors (when theme is 'custom')
  customColors: {
    heading: { type: String, default: "#000000" },
    description: { type: String, default: "#666666" },
    surface: { type: String, default: "#FFFFFF" },
    overlay: {
      color: { type: String, default: "rgba(0,0,0,0)" },
      blend: { type: String, default: "multiply" }
    },
    primaryButton: {
      bg: { type: String, default: "#000000" },
      text: { type: String, default: "#FFFFFF" },
      hover: { type: String, default: "#333333" }
    },
    secondaryButton: {
      bg: { type: String, default: "transparent" },
      text: { type: String, default: "#000000" },
      border: { type: String, default: "#000000" },
      hover: { type: String, default: "rgba(0,0,0,0.1)" }
    },
    accent: { type: String, default: "#000000" },
    gradient: {
      from: { type: String, default: "#FFFFFF" },
      to: { type: String, default: "#F0F0F0" }
    },
    ring: { type: String, default: "#000000" },
    shadow: { type: String, default: "rgba(0,0,0,0.1)" },
    badge: {
      text: { type: String, default: "#000000" },
      background: { type: String, default: "rgba(0,0,0,0.1)" }
    },
    trust: {
      text: { type: String, default: "#666666" },
      dot1: { type: String, default: "#22C55E" },
      dot2: { type: String, default: "#3B82F6" },
      dot3: { type: String, default: "#F59E0B" }
    },
    // Font and size settings (available for both preset and custom themes)
    headingSizes: {
      h1: { type: String, default: "3rem" },
      h2: { type: String, default: "2.5rem" },
      h3: { type: String, default: "2rem" },
      h4: { type: String, default: "1.5rem" },
      h5: { type: String, default: "1.25rem" },
      h6: { type: String, default: "1rem" }
    },
    buttonSizes: {
      small: { type: String, default: "8px 16px" },
      medium: { type: String, default: "12px 24px" },
      large: { type: String, default: "16px 32px" },
      fontSize: { type: String, default: "1rem" }
    },
    textSizes: {
      base: { type: String, default: "1rem" },
      small: { type: String, default: "0.875rem" },
      large: { type: String, default: "1.125rem" },
      xl: { type: String, default: "1.25rem" }
    },
    fontFamily: { type: String, default: "Inter, sans-serif" }
  },
  // Default styles array for database storage
  defaultStyles: [{
    tag: { type: String, required: true },
    fontSize: { type: String },
    value: { type: String }
  }],
  // Default font for all elements (separate from customColors.fontFamily)
  defaultFont: { 
    type: String, 
    default: "Inter, sans-serif" 
  },
  // Default sizes for headings and text (in px or rem, not Tailwind classes)
  defaultSizes: {
    h1: { type: String, default: "3rem" },      // 48px
    h2: { type: String, default: "2.5rem" },   // 40px
    h3: { type: String, default: "2rem" },     // 32px
    h4: { type: String, default: "1.5rem" },   // 24px
    h5: { type: String, default: "1.25rem" },  // 20px
    h6: { type: String, default: "1rem" },      // 16px
    text: { type: String, default: "1rem" },    // 16px
    textSmall: { type: String, default: "0.875rem" },  // 14px
    textLarge: { type: String, default: "1.125rem" },  // 18px
    textXl: { type: String, default: "1.25rem" }       // 20px
  },
  // Default typography settings
  defaultTypography: {
    fontFamily: { type: String, default: "Inter, sans-serif" }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create the model
const themeSettings = mongoose.model("themeSettings", themeSettingsSchema);

module.exports = themeSettings;
