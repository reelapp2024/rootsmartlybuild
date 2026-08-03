/**
 * ProjectKeywords — one document = one unique search intent.
 * Master Keyword Database for content websites (projectType = 2).
 *
 * Future modules (Clusters, Calendar, Articles, Pinterest, SEO) MUST read
 * from this collection — do not regenerate keywords.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectKeywordSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'userProjects',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: false,
      index: true,
    },

    /** Canonical phrase that future article will target */
    primaryKeyword: {
      type: String,
      required: true,
      trim: true,
    },

    /** Same search intent — do NOT create separate articles */
    relatedKeywords: {
      type: [String],
      default: [],
    },

    /** Questions attached for FAQ sections (never separate articles) */
    faqKeywords: {
      type: [String],
      default: [],
    },

    /** Pin / aesthetic tags for Pin Generation (never separate articles) */
    pinterestKeywords: {
      type: [String],
      default: [],
    },

    /** Seasonal variants that share this intent (different seasonal intent = its own doc) */
    seasonalKeywords: {
      type: [String],
      default: [],
    },

    /**
     * Nature of the primary:
     * main | longtail | seasonal | question_parent | other
     */
    keywordType: {
      type: String,
      enum: ['main', 'longtail', 'seasonal', 'question_parent', 'other'],
      default: 'main',
      index: true,
    },

    searchIntentSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    volume: { type: String, default: null },
    volumeLevel: { type: String, default: null },
    volumeRange: { type: String, default: null },
    searchVolume: { type: Number, default: null },
    trend: { type: String, default: null },
    seasonality: { type: String, default: null },
    pinterestDemand: { type: String, default: null },
    competition: { type: String, default: null },

    source: { type: String, default: null },
    country: { type: String, default: null },
    language: { type: String, default: null },
    nicheName: { type: String, default: null },
    categoryName: { type: String, default: null },

    status: {
      type: String,
      enum: ['active', 'archived', 'excluded'],
      default: 'active',
      index: true,
    },

    articleCreated: { type: Boolean, default: false },
    articleId: { type: Schema.Types.ObjectId, default: null },
    clusterId: { type: Schema.Types.ObjectId, default: null, index: true },

    /** Extra enrich payload (Ads/Trends/Pinterest modes, scores, etc.) */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

projectKeywordSchema.index(
  { projectId: 1, searchIntentSlug: 1 },
  { unique: true }
);
projectKeywordSchema.index({ projectId: 1, status: 1, keywordType: 1 });

module.exports = mongoose.model('ProjectKeywords', projectKeywordSchema);
