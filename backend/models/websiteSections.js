const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the model
const WebsiteSectionSchema = new Schema({
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'UserProject', // Reference to the UserProject model
    required: true
  },
  sectionTitle: { 
    type: String, 
    required: true 
  },
  sectionContent: { 
    type: Schema.Types.Mixed, // Can be text or an array of objects (e.g., FAQ)
    required: true
  },
  referencePage: {
  type: mongoose.Schema.Types.Mixed, // Can be string, number, or object// Single reference to any location (country, state, city, or local area) and service
    required: false
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

// Create the model
const WebsiteSection = mongoose.model('WebsiteSection', WebsiteSectionSchema);

module.exports = WebsiteSection;
