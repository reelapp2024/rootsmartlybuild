const mongoose = require("mongoose");
const { Schema } = mongoose;

const builderElementSchema = new Schema({
  elementId: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  }, // e.g., "heading", "text", "button", "image", etc.
  elementType: { 
    type: String, 
    required: true, 
    trim: true 
  }, // Same as elementId for now, can be used for categorization
  displayName: { 
    type: String, 
    required: true, 
    trim: true 
  }, // User-friendly name
  description: { 
    type: String, 
    trim: true 
  }, // Description of the element
  defaultCode: { 
    type: String, 
    trim: true 
  }, // Default HTML/JSX code template
  defaultStyle: { 
    type: Schema.Types.Mixed, 
    default: {} 
  }, // Default CSS styles
  defaultProps: { 
    type: Schema.Types.Mixed, 
    default: {} 
  }, // Default properties/data
  category: { 
    type: String, 
    trim: true,
    default: "basic"
  }, // e.g., "basic", "layout", "form", "media"
  isActive: { 
    type: Boolean, 
    default: true 
  }, // Enable/disable element
  order: { 
    type: Number, 
    default: 0 
  }, // Display order
}, { 
  timestamps: true 
});

// Create indexes for faster lookups
builderElementSchema.index({ elementId: 1 }, { unique: true });
builderElementSchema.index({ elementType: 1 });
builderElementSchema.index({ category: 1 });
builderElementSchema.index({ isActive: 1 });

module.exports = mongoose.model("BuilderElement", builderElementSchema);


