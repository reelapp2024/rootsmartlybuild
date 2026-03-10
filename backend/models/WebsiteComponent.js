const mongoose = require("mongoose");
const { Schema } = mongoose;

const websiteComponentSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    lowercase: true
  },
  // Variants array: each variant has uniqueId and status
  variants: [{
    uniqueId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }, // Format: {name}_{variant} e.g., "hero_a", "services_a", "cta_b"
    status: {
      type: Number,
      default: 1, // 0 = disabled, 1 = enabled
      enum: [0, 1]
    }
  }],
  // Legacy fields for backward compatibility (deprecated)
  variant: {
    type: String,
    trim: true,
    lowercase: true
  },
  uniqueId: {
    type: String,
    trim: true,
    lowercase: true
  },
  pageId: {
    type: Schema.Types.ObjectId,
    ref: "WebsitePage",
    required: false
  } // Reference to the page this component belongs to
}, { 
  timestamps: true 
});

// Create indexes for faster lookups
websiteComponentSchema.index({ name: 1 });
websiteComponentSchema.index({ uniqueId: 1 });
websiteComponentSchema.index({ name: 1, variant: 1 }); // For finding all variants of a component
websiteComponentSchema.index({ name: 1, pageId: 1 }); // For finding components by name and pageId

module.exports = mongoose.model("WebsiteComponent", websiteComponentSchema);

