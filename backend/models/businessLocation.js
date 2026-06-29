const mongoose = require('mongoose');

const businessLocationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userProjects',
      required: true,
    },
    areaName: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessLocation',
      default: null, // null if parent, or parent's ID if child
    },
    type: {
      type: Number,
      enum: [0, 1], // 0 = parent area, 1 = child area (local area)
      required: true,
      default: 0,
    },
    // Google Places data
    googlePlaceId: {
      type: String,
      required: false,
    },
    formattedAddress: {
      type: String,
      required: false,
    },
    // Location coordinates
    lat: {
      type: Number,
      required: false,
    },
    lng: {
      type: Number,
      required: false,
    },
    bounds: {
      southwest: {
        lat: { type: Number, required: false },
        lng: { type: Number, required: false }
      },
      northeast: {
        lat: { type: Number, required: false },
        lng: { type: Number, required: false }
      }
    },
    // Location hierarchy (for business websites)
    country: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    // Status
    status: {
      type: Number,
      enum: [0, 1],
      default: 1, // 0 = inactive, 1 = active
    },
    pageGenerated: {
      type: Boolean,
      default: false,
    },
    /** Admin geo table id (AdminCountry/State/City/LocalArea). Null for manual business locations. */
    adminLocationId: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    /**
     * Geo / source category:
     * 0=country, 1=state, 2=city, 3=localArea, 4=business (manual business-site location)
     */
    locationType: {
      type: Number,
      enum: [0, 1, 2, 3, 4],
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
businessLocationSchema.index({ projectId: 1 });
businessLocationSchema.index({ parentId: 1 });
businessLocationSchema.index({ type: 1 });
businessLocationSchema.index({ projectId: 1, adminLocationId: 1, locationType: 1 });

module.exports = mongoose.model('BusinessLocation', businessLocationSchema);

