const mongoose = require('mongoose');

const contentWebsiteLanguageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    name: {
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

contentWebsiteLanguageSchema.index({ status: 1 });

module.exports = mongoose.model('ContentWebsiteLanguage', contentWebsiteLanguageSchema);
