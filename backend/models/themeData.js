// models/ThemeData.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ThemeDataSchema = new Schema(
  {
   
    themeName: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: false    // mark the currently active theme for the project
    },
    // the ordered list of sections for this theme
    sections: [
      {
        sectionSchemaName: {
          type: String,   // e.g. 'WebsiteSection', 'Service'
          required: true
        },
        sectionType: {
          type: String,   // e.g. 'faq', 'reviews', 'welcomeLine'
          required: true
        },
        pageType: {
          type: String,   // e.g. 'home', 'state', 'city', 'country'
          required: true
        },
        serialNumber: {
          type: Number,   // determines render order
          required: true
        }
      }
    ],
    // arbitrary theme-specific settings (colors, fonts, layout options, etc.)
    settings: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true     // adds createdAt and updatedAt
  }
);

// ensure one ThemeData per (projectId, themeName)


ThemeDataSchema.index({ projectId: 1, themeName: 1 }, { unique: true });

module.exports = mongoose.model('ThemeData', ThemeDataSchema);
