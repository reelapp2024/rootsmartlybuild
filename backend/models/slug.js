// models/SlugModel.js
const mongoose = require('mongoose');

const slugSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
  },
  slugType: {
    type: String,
    required: true,
  },
  locationId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  showName: {
    type: String,
    required: true,
  }
  ,
  slugService: {
    type: String,
    required: false,
  }


}, {
  timestamps: true,
});

// COMPOUND UNIQUE INDEX on all four fields:
slugSchema.index(
  { slug: 1, slugType: 1, locationId: 1, projectId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Slug', slugSchema);
