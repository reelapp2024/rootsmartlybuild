const mongoose = require('mongoose');

const pinterestNicheSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PinterestCategory',
      required: true,
      index: true,
    },
    nicheName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
  },
  { timestamps: true }
);

pinterestNicheSchema.index({ categoryId: 1, nicheName: 1 }, { unique: true });
pinterestNicheSchema.index({ status: 1 });

module.exports = mongoose.model('PinterestNiche', pinterestNicheSchema);
