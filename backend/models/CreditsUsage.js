const mongoose = require('mongoose');


const CreditsUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  usageData: [{
    usageType: {
      type: Number,
      required: true,
      enum: [0, 1, 2], // 0: OpenAI, 1: FreePik, 2: Others (can be extended)
      default: 0
    },
    promptFrom: {
      type: String,
      required: true,
      trim: true
    },
    promptFor: {
      type: String,
      required: true,
      trim: true
    },
    pageId: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    inputTokens: {
      type: Number,
      required: true,
      min: 0
    },
    outputTokens: {
      type: Number,
      required: true,
      min: 0
    },
    pricing: {
      type: Number,
      required: true,
      min: 0
    },
    is_retried: {
      type: Number,
      default: 0
    },
    status: {
      type: Number,
      default: 1
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('CreditsUsage', CreditsUsageSchema);

