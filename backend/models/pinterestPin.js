const mongoose = require('mongoose');

const pinterestPinSchema = new mongoose.Schema(
  {
    pinterestProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PinterestProject',
      required: true
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
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
pinterestPinSchema.index({ pinterestProjectId: 1 });
pinterestPinSchema.index({ createdAt: -1 });

const PinterestPin = mongoose.model('PinterestPin', pinterestPinSchema);

module.exports = PinterestPin;

