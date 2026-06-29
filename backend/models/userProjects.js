const mongoose = require('mongoose');

// User Projects Schema
const userProjectsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hostingId: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    projectSlogan: {
      type: String,
      required: false,
      trim: true,
    },
    welcomeLine: {
      type: String,
      required: false,
    },

    promiseLine: {
      type: String,
      required: false,
    },
    
    // In your Mongoose model
    callToAction: { type: String, required: false },



    cta: [{
      serialno: {
        type: Number,
      },
      title: {
        type: String,
      },
      description: {
        type: String,
      },
    }],

    // ------------ NEW SECTIONS ------------
    featuresSection: [{
      serialno: { type: Number, required: true },  // 1–3
      iconName: { type: String, required: true },  // e.g. "CheckCircle", "Star", "Sparkles"
      title: { type: String, required: true },  // "Eco-Friendly", "5-Star Rated", "Same Day"
      subtitle: { type: String, required: true }   // "Safe, green products", "500+ happy customers", "Book today"
    }],

    statsSection: [{
      serialno: { type: Number, required: true },  // 1–4
      iconName: { type: String, required: true },  // e.g. "Clock", "Users", etc.
      value: { type: String, required: true },  // "10+", "3K+", "Same Day", "100%"
      label: { type: String, required: true }   // "Years Experience", "Happy Customers", "Booking Available", "Satisfaction Guarantee"
    }],
    // --------------------------------------
    description: {
      type: String,
      required: false,
    },
    heroHeading: {
      type: String,
      required: false,
    },

    descriptions: [{
      type: String,
      required: false,
    }],

    serviceType: {
      type: String,
      required: false,
      trim: true,
    },
    projectType: {
      type: Number,
      default: 0,
      enum: [0, 1], // 0 = location based site, 1 = business site
    },
    googleSiteVerification: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    googleSiteVerificationHtmlFile: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    defaultFasFaIcon: {
      type: String,
      required: false,
      trim: true,
    },
    locations: {
      country: [{
        countryId: { type: mongoose.Schema.Types.Mixed, required: true },
        name: { type: String, required: true },
        lat: { type: Number, required: false },
        lng: { type: Number, required: false },
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
        status: {
          type: Number,
          enum: [0, 1],
          default: 1        // <-- add this
        },
        pageGenerated: { type: Boolean, default: false }    // ← new
      }],
      state: [{
        stateId: { type: mongoose.Schema.Types.Mixed, required: true },
        countryId: { type: mongoose.Schema.Types.Mixed, required: true },
        name: { type: String, required: true },
        lat: { type: Number, required: false },
        lng: { type: Number, required: false },
        bounds: { /* same shape as above */ },
        status: {
          type: Number,
          enum: [0, 1],
          default: 1        // <-- add this
        },
        pageGenerated: { type: Boolean, default: false }    // ← new
      }],
      city: [{
        cityId: { type: mongoose.Schema.Types.Mixed, required: true },
        stateId: { type: mongoose.Schema.Types.Mixed, required: true },
        name: { type: String, required: true },
        lat: { type: Number, required: false },
        lng: { type: Number, required: false },
        bounds: { /* … */ },
        status: {
          type: Number,
          enum: [0, 1],
          default: 1        // <-- add this
        },
        pageGenerated: { type: Boolean, default: false }    // ← new
      }],
      localArea: [{
        localAreaId: { type: mongoose.Schema.Types.Mixed, required: true },

        cityId: { type: mongoose.Schema.Types.Mixed, required: false },
        name: { type: String, required: true },
        lat: { type: Number, required: false },
        lng: { type: Number, required: false },
        bounds: { /* … */ },
        status: {
          type: Number,
          enum: [0, 1],
          default: 1        // <-- add this
        },
        pageGenerated: { type: Boolean, default: false }    // ← new
      }],
      // Business locations (for business websites - projectType = 1)
      businessLocations: [{
        locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessLocation', required: true },
        areaName: { type: String, required: true },
        type: { type: Number, enum: [0, 1], required: true }, // 0 = parent, 1 = child
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessLocation', default: null }
      }]
    },
    status: {
      type: Number,
      enum: [0, 1, 2, 3], // 0 - Deactivate, 1 - processing,2-completed, 3 - Maintenance
      default: 0,
    },
    wantImages: {
      type: Number,
      enum: [0, 1], //  1 - yes, 0 - no
      default: 1, // Always default to 1 (yes)
    },
    /** 1 = Freepik stock search, 2 = Gemini (nano) AI images — used when images_mode env is 1 */
    sectionImageOrigin: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    isCountry: {
      type: Number,
      enum: [0, 1], // 0 - Inactive, 1 - Active
      default: 0,
    },
    isState: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    isCity: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    isLocal: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },

    // Array of general images
    images: [{
      description: {
        type: String,
      },
      url: {
        type: String,
      },
    }],
    servicesGenerated: {
      type: Boolean,
      default: false
    },
    serviceHeroText: {
      type: String,
      required: false,
    },
    aboutHeroText: {
      type: String,
      required: false,
    },
    siteContentGenerated: { type: Boolean, default: false }, // ← new

    ourGuaranteeText: {
      type: String,
      required: false,
    },

    ourGuaranteeSection: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      iconClass: { type: String, required: true }  // FontAwesome icon class

    }],

    // New image keys for specific queries
    ourGuaranteesImage: [{
      description: {
        type: String,
      },
      url: {
        type: String,
      },
    }],
    ourProcessImage: [{
      description: {
        type: String,
      },
      url: {
        type: String,
      },
    }],
    scheduleServiceImage: [{
      description: {
        type: String,
      },
      url: {
        type: String,
      },
    }],
    whyChooseUsImage: [{
      description: {
        type: String,
      },
      url: {
        type: String,
      },
    }],

    whyChooseUsSection: [{
      title: { type: String, required: true },  // Section title
      description: { type: String, required: true },  // section description
      iconClass: { type: String, required: true }  // FontAwesome icon class

    }],

    ourProcessSection: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      iconClass: { type: String, required: true }  // FontAwesome icon class

    }],

    // New 'icons' field to store an array of Font Awesome icons
    icons: {
      type: [String], // Array of strings to store Font Awesome icon classes
      default: [], // Default to an empty array if no icons are provided
    },

    steps_icons: [{
      service: { type: String, required: true },  // Service name
      iconClass: { type: String, required: true }  // FontAwesome icon class
    }],

    // 1) Core Values
    coreValuesIntro: { type: String },
    coreValues: [{
      iconClass: { type: String, required: false },
      title: { type: String, required: false },
      description: { type: String, required: false }
    }], // length 6
    whatMakesUsDifferent: [{
      iconClass: { type: String, required: false },
      title: { type: String, required: false },
      description: { type: String, required: false }
    }],

    whyChooseUsAboutPage: [{
      iconClass: { type: String, required: false },
      title: { type: String, required: false },
      description: { type: String, required: false }
    }],
    projectKeywordsText: {
      type: String,
      required: false, // or true if mandatory
      trim: true
    },
    focusKeyword: {
      type: String,
      required: false,
      trim: true
    },
    ai_image_prompt: {
      type: String,
      required: false,
      trim: true
    },
    non_ai_image_prompt: {
      type: String,
      required: false,
      trim: true
    },
    image_count: {
      type: Number,
      required: false,
      min: 0,
      max: 20
    },
    // 2) Commitment
    commitment: { type: String }, // ~80 words (two 40-word paragraphs)

    // 3) Mission
    missionSubHeadings: [{
      type: String,   // e.g. "Spotless Results"
      required: false  // expect exactly 3
    }],
    missionLine: {
      type: String,   // one line ~25 characters
      required: false
    },

    // 4) Vision
    visionSubHeadings: [{
      type: String,   // e.g. "Leading Eco-Friendly"
      required: false  // expect exactly 3
    }],
    visionLine: {
      type: String,   // one line ~25 characters
      required: false
    },
    domainName: { type: String, required: false },
    siteMapFilePath: { type: String, required: false },
    siteHostRootPath: { type: String, required: false },
    ourHosted: { type: Boolean, default: false },    // ← new
    // ------------------- NEW KEYS -------------------
    categories: [{
      type: String,
      trim: true
    }],

    subCategories: [{
      type: String,
      trim: true
    }],

    microCategories: [{
      type: String,
      trim: true
    }],

    isFormExists: {
      type: Number,
      default: 0,
      enum: [0, 1], // 0 = no form, 1 = form exists
    },
    // -------------------------------------------------
  },

  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

const UserProject = mongoose.model('UserProject', userProjectsSchema);

module.exports = UserProject;
