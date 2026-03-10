const mongoose = require("mongoose");
const { Schema } = mongoose;

const websitePageSchema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "userProjects",
    required: true
  },
  name: { 
    type: String, 
    required: true, 
    trim: true,
    lowercase: true
    // name is unique identifier, non-changeable once created
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    default: function() {
      // Default slug is the name if not provided
      return this.name || '';
    }
  },
  displayName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  // Components/sections assigned to this page
  componentIds: [{
    componentId: {
      type: Schema.Types.ObjectId,
      ref: "WebsiteComponent",
      required: true
    },
    componentVariant: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    } // e.g., "hero_a", "cta_a" - full uniqueId with variant
  }]
}, { 
  timestamps: true 
});

// Create compound unique index on projectId + name (name is unique per project, non-changeable)
websitePageSchema.index({ projectId: 1, name: 1 }, { unique: true });
// Create index on projectId for faster lookups
websitePageSchema.index({ projectId: 1 });
// Note: Removed name_1 index - name should only be unique per project, not globally
// Create index on slug for faster lookups
websitePageSchema.index({ slug: 1 });

module.exports = mongoose.model("WebsitePage", websitePageSchema);

