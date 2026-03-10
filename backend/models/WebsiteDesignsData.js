const mongoose = require("mongoose");
const { Schema } = mongoose;

const websiteDesignsDataSchema = new Schema({
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: "userProjects", 
    required: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  colorScheme: { 
    type: String, 
    required: true, 
    trim: true 
  },
  colorPrimary: { 
    type: String, 
    trim: true 
  },
  colorSecondary: { 
    type: String, 
    trim: true 
  },
  colorAccent: { 
    type: String, 
    trim: true 
  },
  // Default styles for the whole website
  pageStyles: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  // Pages array with page-level styles, components, and elements
  pages: [{
    pageId: { 
      type: Schema.Types.ObjectId, 
      ref: "WebsitePage", 
      required: true 
    },
    // Main style of this whole page
    style: { 
      type: Schema.Types.Mixed, 
      default: {} 
    },
    // Layout JSON for element-only pages (no components required)
    // This allows pages to be built purely from sections + elements
    // Supports both hierarchical elements (new format) and flat customElements (old format for backward compatibility)
    layout: [{
      sectionId: {
        type: String,
        required: true,
        trim: true
      },
      componentType: {
        type: String,
        trim: true
      },
      // NEW FORMAT: Hierarchical elements (same structure as componentIds.elementIds)
      // This is the canonical format - matches component-backed pages
      elements: [{
        elementId: { 
          type: String, 
          required: false, // Not required for backward compatibility
          trim: true 
        },
        elementType: {
          type: String, 
          required: false,
          trim: true 
        },
        style: { 
          type: Schema.Types.Mixed, 
          default: {} 
        },
        data: { 
          type: Schema.Types.Mixed, 
          default: {} 
        },
        order: {
          type: Number,
          default: 0
        },
        // Children elements (recursive structure - supports infinite nesting)
        children: {
          type: [Schema.Types.Mixed],
          default: []
        }
      }],
      // OLD FORMAT: Flat customElements (backward compatibility - deprecated)
      customElements: [{
        id: { type: String, required: false }, // Not required for backward compatibility
        type: { type: String, required: false },
        elId: { type: String, required: false },
        order: { type: Number, default: 0 },
        parentElId: { type: String, default: null }
      }],
      customElementStyles: {
        type: Schema.Types.Mixed,
        default: {}
      },
      customElementProps: {
        type: Schema.Types.Mixed,
        default: {}
      },
      styles: {
        type: Schema.Types.Mixed,
        default: {}
      }
    }],
    componentIds: [{
      // variant_uniqueId: The variant filename (e.g., "HeroCenter", "NavbarSimple") - same as uniqueId for GenieBuild
      variant_uniqueId: {
        type: String,
        required: true,
        trim: true
      },
      // componentId: ObjectId reference to WebsiteComponent table (for variant management)
      componentId: { 
        type: Schema.Types.ObjectId, 
        ref: "WebsiteComponent",
        required: true
      },
      // sectionData: Full GenieBuild section data (type, content, styles) - single source of truth
      sectionData: {
        type: Schema.Types.Mixed,
        default: {}
      },
      // Legacy uniqueId for backward compatibility (deprecated - use variant_uniqueId)
      uniqueId: {
        type: String,
        trim: true,
        lowercase: true
      },
      // Component-level styles (legacy - use sectionData.styles instead)
      style: { 
        type: Schema.Types.Mixed, 
        default: {} 
      },
      // Elements within this component (hierarchical structure with infinite nesting)
      // Using recursive schema definition for children
      elementIds: [{
        elementId: { 
          type: String, 
          required: true, 
          trim: true 
        },
        elementType: {
          type: String, 
          required: true, 
          trim: true 
        },
        // Element-level styles
        style: { 
          type: Schema.Types.Mixed, 
          default: {} 
        },
        // Element data (props/content)
        data: { 
          type: Schema.Types.Mixed, 
          default: {} 
        },
        order: {
          type: Number,
          default: 0
        },
        // Children elements (recursive structure - supports infinite nesting)
        // Using Schema.Types.Mixed to allow unlimited depth
        children: {
          type: [Schema.Types.Mixed],
          default: []
        }
      }]
    }]
  }]
}, { 
  timestamps: true 
});

// Create index on projectId for faster lookups
websiteDesignsDataSchema.index({ projectId: 1 });
websiteDesignsDataSchema.index({ userId: 1 });

module.exports = mongoose.model("WebsiteDesignsData", websiteDesignsDataSchema);

