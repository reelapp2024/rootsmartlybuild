const mongoose = require('mongoose');

const contentWebsiteGoalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
  },
  { timestamps: true }
);

contentWebsiteGoalSchema.index({ status: 1 });

module.exports = mongoose.model('ContentWebsiteGoal', contentWebsiteGoalSchema);
