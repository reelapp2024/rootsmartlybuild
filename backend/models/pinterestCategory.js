const mongoose = require('mongoose');

const pinterestCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    status: {
      type: Number,
      enum: [0, 1], // 0 = inactive, 1 = active
      default: 1
    }
  },
  {
    timestamps: true // createdAt and updatedAt
  }
);

// Index for faster queries
pinterestCategorySchema.index({ status: 1 });
pinterestCategorySchema.index({ categoryName: 1 });

const PinterestCategory = mongoose.model('PinterestCategory', pinterestCategorySchema);

module.exports = PinterestCategory;

