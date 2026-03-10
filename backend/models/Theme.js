// models/Theme.js
const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema(
  {
    themeName: {
      type: String,
      required: true,
      trim: true
    },
    supportThemeSubColor: {
      type: Boolean,
      default: false
    },
    supportSecondaryColor: {
      type: Boolean,
      default: false
    },
    themeDemoUrl: {
      type: String,
      required: true,
      trim: true
    },
    themeImageUrl: {
      type: String,
      required: true,
      trim: true
    },
     isActive: {
      type: Boolean,
      default: false    // mark the currently active theme for the project
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Theme || mongoose.model('Theme', ThemeSchema);
