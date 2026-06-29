const mongoose = require("mongoose");
const { Schema } = mongoose;

const websiteDesignsDataSchema = new Schema({
  schemaVersion: {
    type: Number,
    default: 2
  },
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
  // Deprecated: global theme now lives in ThemeSetting table (single source of truth).
  colorScheme: { type: String, required: false, trim: true },
  colorPrimary: { type: String, trim: true },
  colorSecondary: { type: String, trim: true },
  colorAccent: { type: String, trim: true },
  theme: {
    type: Schema.Types.Mixed,
    default: {}
  },
  // Default styles for the whole website
  pageStyles: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  // Pages array with structure-only section layout.
  pages: [{
    pageId: { 
      type: Schema.Types.ObjectId, 
      ref: "WebsitePage", 
      required: true 
    },
    // Page-level style overrides only.
    pageStyles: {
      type: Schema.Types.Mixed, 
      default: {} 
    },
    sections: [{
      sectionId: {
        type: String,
        trim: true
      },
      order: {
        type: Number,
        default: 0
      },
      variant_uniqueId: {
        type: String,
        required: true,
        trim: true
      },
      componentId: { 
        type: Schema.Types.ObjectId, 
        ref: "WebsiteComponent",
        required: false
      },
      sectionData: {
        type: Schema.Types.Mixed,
        default: {}
      },
      uniqueId: {
        type: String,
        trim: true,
        lowercase: true
      },
      elementIds: { type: [Schema.Types.Mixed], default: [] }
    }],
    sectionLayout: [{
      order: { type: Number, default: 0 },
      sectionId: { type: String, trim: true }
    }]
  }]
}, { 
  timestamps: true 
});

// Create index on projectId for faster lookups
websiteDesignsDataSchema.index({ projectId: 1 });
websiteDesignsDataSchema.index({ userId: 1 });

module.exports = mongoose.model("WebsiteDesignsData", websiteDesignsDataSchema);

