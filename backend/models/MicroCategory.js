const mongoose = require('mongoose');

const microCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectCategory',
      required: true,
      index: true,
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
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

// Each micro category name is unique within its subcategory
microCategorySchema.index(
  { subCategoryId: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model('MicroCategory', microCategorySchema);
