/**
 * ProjectClusters — one document = one content silo.
 * Built from Master Keyword Database (ProjectKeywords primaries).
 *
 * Depth rule: 1 pillar + few strong supporting articles (not 20 thin pages).
 * Calendar / Article Gen / Pinterest read this collection — do not regenerate silos.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const internalLinkSchema = new Schema(
  {
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    fromKeywordId: { type: Schema.Types.ObjectId, ref: 'ProjectKeywords', default: null },
    toKeywordId: { type: Schema.Types.ObjectId, ref: 'ProjectKeywords', default: null },
    relation: {
      type: String,
      enum: ['pillar_to_supporting', 'supporting_to_pillar', 'supporting_to_supporting'],
      default: 'supporting_to_pillar',
    },
  },
  { _id: false }
);

const supportingKeywordSchema = new Schema(
  {
    primaryKeyword: { type: String, required: true, trim: true },
    keywordId: { type: Schema.Types.ObjectId, ref: 'ProjectKeywords', default: null },
  },
  { _id: false }
);

const projectClusterSchema = new Schema(
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

    clusterName: {
      type: String,
      required: true,
      trim: true,
    },
    clusterSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    pillarKeywordId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectKeywords',
      default: null,
      index: true,
    },
    pillarKeyword: {
      type: String,
      required: true,
      trim: true,
    },

    supportingKeywordIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'ProjectKeywords' }],
      default: [],
    },
    supportingKeywords: {
      type: [supportingKeywordSchema],
      default: [],
    },

    /** Publish order: pillar first, then supporting (primary strings) */
    publishOrder: {
      type: [String],
      default: [],
    },

    internalLinks: {
      type: [internalLinkSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },

    nicheName: { type: String, default: null },
    categoryName: { type: String, default: null },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

projectClusterSchema.index({ projectId: 1, clusterSlug: 1 }, { unique: true });
projectClusterSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('ProjectClusters', projectClusterSchema);
