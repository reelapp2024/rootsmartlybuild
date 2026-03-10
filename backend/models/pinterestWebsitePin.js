const mongoose = require('mongoose');

const pinterestWebsitePinSchema = new mongoose.Schema(
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
    slug: {
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
    },
    isScheduled: {
      type: Number,
      enum: [0, 1], // 0 = not scheduled, 1 = scheduled
      default: 0
    },
    scheduleTime: {
      type: Date,
      default: null
    },
    altText: {
      type: String,
      required: false,
      trim: true
    },
    caption: {
      type: String,
      required: false,
      trim: true
    },
    followUpQuestionAnswer: {
      type: String, // HTML content
      required: false
    },
    trendingQuestionsAnswers: [{
      question: {
        type: String,
        trim: true
      },
      answer: {
        type: String,
        trim: true
      }
    }],
    images: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      altText: {
        type: String,
        trim: true
      },
      images: [{
        type: String,
        trim: true
      }]
    }],
    otherImages: [{
      type: String,
      trim: true
    }],
    authorName: {
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
pinterestWebsitePinSchema.index({ pinterestProjectId: 1 });
pinterestWebsitePinSchema.index({ slug: 1 });
pinterestWebsitePinSchema.index({ isScheduled: 1, scheduleTime: 1 });
pinterestWebsitePinSchema.index({ createdAt: -1 });

// Unique slug per project
pinterestWebsitePinSchema.index({ pinterestProjectId: 1, slug: 1 }, { unique: true });

const PinterestWebsitePin = mongoose.model('PinterestWebsitePin', pinterestWebsitePinSchema);

module.exports = PinterestWebsitePin;

