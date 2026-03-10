const mongoose = require('mongoose');

const areaServicesDataSchema = new mongoose.Schema(
  {
    // Relations/Identifiers
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'userProjects'
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Service'
    },
     meta_title: {
    type: String,
    required: true,
  },
  meta_description: {
    type: String,
    required: true,
  },
  meta_keywords: {
    type: String,
    required: true,
  },
  meta_image: {
    type: String,  // Path to the image for Open Graph (optional)
    default: '',
  },
    areaId: {
      type: mongoose.Schema.Types.Mixed, // Could be ObjectId or string depending on your area ref
      required: true,
    },
    areaType:{
type: String, required: true
    },

    // Content fields
    service_description: { type: String, required: true },
    about_service: { type: String, required: false },
    whyChooseUsHeading: { type: String, required: false },
    whyChooseUsText: { type: String, required: false },
    whyChooseUsSection: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      iconClass: { type: String, required: true }
    }],
    comprehensiveCoverageText: { type: String, required: false },
    customSolutionText: { type: String, required: false },

    steps_process: [{
      stepName: { type: String, required: true },
      iconClass: { type: String, required: true },
      serviceDescription: { type: String, required: true }
    }],

    ourGuaranteeText: { type: String, required: false },
    ourGuaranteeSection: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      iconClass: { type: String, required: true }
    }],

    promiseLine: { type: String, required: false },

    residentialServices: [{
      title: { type: String, required: true },
      iconClass: { type: String, required: true }
    }],
    commercialServices: [{
      title: { type: String, required: true },
      iconClass: { type: String, required: true }
    }],
    professionalMethods: [{
      title: { type: String, required: true },
      iconClass: { type: String, required: true }
    }],
    premiumOptions: [{
      title: { type: String, required: true },
      iconClass: { type: String, required: true }
    }],

    serviceGroups: [{
      groupTitle: { type: String, required: true },
      items: [{
        title: { type: String, required: true },
        iconClass: { type: String, required: true }
      }]
    }],

    subServices: [{
      type: String,
      required: false,
    }],

    ctaSequence: {
      type: [{
        ctanumber: {
          type: Number,
          default: () => Math.floor(Math.random() * 4) + 1,
          min: 1,
          max: 4,
        }
      }],
      default: function () {
        const sequence = [];
        while (sequence.length < 4) {
          const randomNum = Math.floor(Math.random() * 4) + 1;
          if (!sequence.includes(randomNum)) {
            sequence.push(randomNum);
          }
        }
        return sequence.map(num => ({ ctanumber: num }));
      }
    }
  },
  { timestamps: true }
);

const AreaServicesData = mongoose.model('AreaServicesData', areaServicesDataSchema);

module.exports = AreaServicesData;
