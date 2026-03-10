const mongoose = require('mongoose');

// SEO Schema for each page
const seoSettingsSchema = new mongoose.Schema({
  page_url: {
    type: String,
    required: true,
    
  },
  meta_title: {
    type: String,
    required: true,
  },
  meta_description: {
    type: String,
    required: true,
  },
  meta_keywords: {
    type: String,
    required: true,
  },
  meta_image: {
    type: String,  // Path to the image for Open Graph (optional)
    default: '',
  },
  canonical_url: {
    type: String,  // Optional: for SEO purposes
    default: '',
  },
  projectId: { 
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  builderPageId: {
    type: String,  // Page ID for builder-generated websites
    default: '',
  },
}, {
  timestamps: true,  // Automatically adds `createdAt` and `updatedAt` fields
});

// Create a model for SEO Settings
const SeoSettings = mongoose.model('SeoSettings', seoSettingsSchema);

module.exports = SeoSettings;
