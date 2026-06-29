const mongoose = require('mongoose');

// Define the schema for services
const serviceSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userProjects',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ projectId: 1, name: 1 }, { unique: true });
serviceSchema.index({ projectId: 1, slug: 1 });

// Create a model based on the schema
const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
