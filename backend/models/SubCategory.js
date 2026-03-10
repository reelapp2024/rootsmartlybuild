const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectCategory',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isManual: {
      type: Number,
      default: 0, // 0 = from database, 1 = manually entered by user
      enum: [0, 1]
    },
  },
  { timestamps: true }
);

// Each subcategory name is unique within its category
subCategorySchema.index({ categoryId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);
