const mongoose = require('mongoose');

// Define the schema for services
const serviceSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userProjects',
      required: true,
    },
    service_name: {
      type: String,
      required: true,
    },
    fas_fa_icon: {
      type: String,
      required: true,
      default: "fa-circle", // Example default icon from Font Awesome
    },
    service_description: {
      type: String,
      required: true,
    },
    about_service: {
      type: String,
      required: false
    },
    contact_phone: {
      type: String,
      required: false,
    },
    whyChooseUs: {
      type: String,
      required: false
    },
    ourProcess: {
      type: String,
      required: false
    },
    scheduleService: {
      type: String,
      required: false
    },
    ourGuarantees: {
      type: String,
      required: false
    },
    pageType: {
      type: String,
      enum: ['country', 'state', 'city', 'local_area', 'homepage'], // New enum types added
      required: false,
    },
    referenceId: {
      type: mongoose.Schema.Types.Mixed, // Can be string, number, or object Stores ID based on pageType
      required: false,
    },
    is_main: {
      type: Boolean,
      default: false, // Default value is false
      required: true  // Mandatory field
    },

    is_manual: {
      type: Boolean,
      default: false, // Default value is false
      required: true  // Mandatory field
    },
    images: [{
      description: {
        type: String,
      },
      url: {
        type: String,
      },
    }],

    steps_process: [{
      stepName: { type: String, required: true },  // stepName name
      iconClass: { type: String, required: true },  // FontAwesome icon class
      serviceDescription: { type: String, required: true }  // FontAwesome icon class
    }],
    serviceProcessed: {
      type: Boolean,
      default: false
    },

    ourGuaranteeText: {
      type: String,
      required: false,
    },

    ourGuaranteeSection: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      iconClass: { type: String, required: true }  // FontAwesome icon class

    }],

    whyChooseUsText: {
      type: String,
      required: false,
    },


    whyChooseUsSection: [{
      title: { type: String, required: true },  // Section title
      description: { type: String, required: true },  // section description
      iconClass: { type: String, required: true }  // FontAwesome icon class

    }],

    // … your existing fields …

    // new fields:
    residentialServices: [{
      title: {
        type: String,
        required: true
      },
      iconClass: {
        type: String,
        required: true
      }
    }],

    commercialServices: [{
      title: {
        type: String,
        required: true
      },
      iconClass: {
        type: String,
        required: true
      }
    }],

    professionalMethods: [{
      title: {
        type: String,
        required: true
      },
      iconClass: {
        type: String,
        required: true
      }
    }],

    premiumOptions: [{
      title: {
        type: String,
        required: true
      },
      iconClass: {
        type: String,
        required: true
      }
    }],



    serviceGroups: [{
      groupTitle: { type: String, required: true },
      items: [{
        title: { type: String, required: true },
        iconClass: { type: String, required: true }
      }]
    }],

    // ← New field for listing service-related sub-services
    subServices: [{
      type: String,
      required: false
    }],

    promiseLine: {
      type: String,
      required: false,
    },

    whyChooseUsHeading: {
      type: String,
      required: false
    },

    customSolutionText: {
      type: String,
      required: false
    },

    comprehensiveCoverageText: {
      type: String,
      required: false
    },


    // New CTA sequence field: array of objects with random ctanumber between 1 and 4
    ctaSequence: {
      type: [{
        ctanumber: {
          type: Number,
          default: () => Math.floor(Math.random() * 4) + 1,  // Random number between 1 and 4
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
        return sequence.map(num => ({ ctanumber: num }));  // Ensure unique random numbers 1-4
      }
    },



  },
  { timestamps: true }
);

serviceSchema.index({ projectId: 1, is_main: 1, service_name: 1 });

// Create a model based on the schema
const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
