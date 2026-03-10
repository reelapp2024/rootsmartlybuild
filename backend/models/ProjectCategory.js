const mongoose = require('mongoose');

const projectCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Each category name is unique globally
    },
    isManual: {
      type: Number,
      default: 0, // 0 = from database, 1 = manually entered by user
      enum: [0, 1]
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProjectCategory', projectCategorySchema);
