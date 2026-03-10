const mongoose = require("mongoose");
const { Schema } = mongoose;

const websiteElementSchema = new Schema({
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: "userProjects", 
    required: true 
  },
  componentId: { 
    type: Schema.Types.ObjectId, 
    ref: "WebsiteComponent", 
    required: true 
  },
  pageId: { 
    type: Schema.Types.ObjectId, 
    ref: "WebsitePage", 
    required: true 
  },
  elementId: { 
    type: String, 
    required: true, 
    trim: true 
  }, // e.g., "title", "description", "button-1", etc.
  elementType: { 
    type: String, 
    required: true, 
    trim: true 
  }, // e.g., "heading", "text", "description", "button", "image", "video", "icon", "html", "container"
  order: { 
    type: Number, 
    default: 0 
  }, // Order within the component or parent container
  parentElId: {
    type: String,
    default: null,
    trim: true
  }, // Parent element ID for nested hierarchy (null = root level)
  props: { 
    type: Schema.Types.Mixed, 
    default: {} 
  }, // Element properties (text, src, href, etc.)
  style: { 
    type: Schema.Types.Mixed, 
    default: {} 
  }, // Element styles (CSS properties)
  defaultCode: { 
    type: String, 
    trim: true 
  }, // Default HTML/JSX code for this element type
  defaultStyle: { 
    type: Schema.Types.Mixed, 
    default: {} 
  }, // Default styles for this element type
}, { 
  timestamps: true 
});

// Create indexes for faster lookups
websiteElementSchema.index({ projectId: 1, componentId: 1, pageId: 1 });
websiteElementSchema.index({ projectId: 1, elementId: 1 });
websiteElementSchema.index({ componentId: 1, elementId: 1 });
websiteElementSchema.index({ parentElId: 1 }); // Index for parent-child relationships

module.exports = mongoose.model("WebsiteElement", websiteElementSchema);

