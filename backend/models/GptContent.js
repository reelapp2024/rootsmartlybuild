const mongoose = require('mongoose');

// Define the Schema for GPT-generated content
const GptContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  niche: {
    type: String,  // Store the niche of title
    required: true,
  },
  serialNo: {
    type: Number,  // You can set this to auto-increment or manually manage it
    required: true,
  },
  content: {
    type: String,  // Store the full content (title, description, script, and CTA) as a string
    required: true,
  },
}, {
  timestamps: true,  // Optional: Adds createdAt and updatedAt fields
});

// Create a model using the schema
const GptContent = mongoose.model('GptContent', GptContentSchema);

module.exports = GptContent;
