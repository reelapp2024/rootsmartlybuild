const mongoose = require('mongoose');

const pinterestProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PinterestCategory',
      required: true
    },
    niche: {
      type: String,
      required: true,
      trim: true
    },
    font: {
      type: String,
      required: false,
      trim: true
    },
    websiteName: {
      type: String,
      required: false,
      trim: true
    }
  },
  {
    timestamps: true // createdAt and updatedAt
  }
);

// Index for faster queries
pinterestProjectSchema.index({ userId: 1 });
pinterestProjectSchema.index({ categoryId: 1 });
pinterestProjectSchema.index({ userId: 1, categoryId: 1 });

const PinterestProject = mongoose.model('PinterestProject', pinterestProjectSchema);

module.exports = PinterestProject;

