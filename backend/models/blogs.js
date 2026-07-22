const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProject' },

    title: { type: String, required: true, trim: true },
    information: { type: String, trim: true },
    content: { type: String, required: true },

    status: { type: Number, enum: [0, 1, 2], default: 0 }, // 0=draft,1=published,2=archived
    type: { type: String, required: true },

    coverImage: {
      url: { type: String },
      alt: { type: String },
    },

    seoMeta: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
    },

    likesCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },

    // store the Author reference (ID) instead of name
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },

    isSchedule: { type: Boolean, default: false },
    scheduleTime: { type: Date, default: null },

    // SEO-friendly unique slug per project, provided by frontend
    slug: { type: String, required: true, trim: true },
    oldSlugs: [{ type: String, trim: true }], // New field for old slugs

    /** Live/last fake-review generation progress (admin Generate Reviews). */
    fakeReviewsGeneration: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique per project// Unique index per project
blogSchema.index({ projectId: 1, slug: 1 }, { unique: true });
// Index for faster lookup on oldSlugs
blogSchema.index({ projectId: 1, oldSlugs: 1 });

module.exports = mongoose.model('Blog', blogSchema);