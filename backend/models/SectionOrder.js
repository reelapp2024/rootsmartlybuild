const mongoose = require('mongoose');

const sectionOrderSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProject',
      required: true,
      unique: true,
      index: true
    },
    sections: [
      {
        sectionSchemaName: {
          type: String,   // e.g. 'WebsiteSection', 'Service'
          required: true
        },
        sectionType: {
          type: String,   // e.g. 'faq', 'reviews', 'welcomeLine'
          required: true
        },
        pageType: {
          type: String,   // e.g. 'home', 'state', 'city', 'country'
          required: true
        },
        serialNumber: {
          type: Number,   // determines render order
          required: true
        }
      }
    ]
  },
  {
    timestamps: true      // adds createdAt and updatedAt
  }
);

// fast lookup by project
sectionOrderSchema.index({ projectId: 1 });

module.exports = mongoose.model('SectionOrder', sectionOrderSchema);
