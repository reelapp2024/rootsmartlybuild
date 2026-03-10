const mongoose = require('mongoose');

const AreaPagesContentSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProject', required: true },
    areaId: { type: mongoose.Schema.Types.Mixed, required: true },

    areaType: { type: String, enum: ['country', 'state', 'city', 'local_area', 'business_location', 'business_local_area'], required: true },
    slug: { type: String },

    // SEO Fields
    meta_title: { type: String },
    meta_description: { type: String },
    meta_keywords: [{ type: String }],

    // Hero Section
    heroHeading: { type: String },
    heroSubheading: { type: String },
    heroImages: [{ type: String }],

    // Welcome Line
    welcomeLine: { type: String },

    // Promise Line
    promiseLine: { type: String },

    // Call to Actions (CTAs)
    cta: [{
        serialno: { type: Number },
        title: { type: String },
        description: { type: String }
    }],

    // Features Section
    featuresSection: [{
        serialno: { type: Number, required: true },
        iconName: { type: String, required: true },
        title: { type: String, required: true },
        subtitle: { type: String, required: true }
    }],

    // Stats Section
    statsSection: [{
        serialno: { type: Number, required: true },
        iconName: { type: String, required: true },
        value: { type: String, required: true },
        label: { type: String, required: true }
    }],

    // General Description
    description: { type: String },

    // Descriptions Array
    descriptions: [{ type: String }],

    // Our Guarantee Section
    ourGuaranteeText: { type: String },
    ourGuaranteeText2: { type: String },
    ourGuaranteeSection: [{
        title: { type: String, required: true },
        description: { type: String, required: true },
        iconClass: { type: String, required: true }
    }],

    // Images for Specific Sections
    ourGuaranteesImage: [{
        description: { type: String },
        url: { type: String }
    }],
    ourProcessImage: [{
        description: { type: String },
        url: { type: String }
    }],
    scheduleServiceImage: [{
        description: { type: String },
        url: { type: String }
    }],
    whyChooseUsImage: [{
        description: { type: String },
        url: { type: String }
    }],

    // Why Choose Us Section
    whyChooseUsText: { type: String },   // String line for Why Choose Us
    whyChooseUsSection: [{
        title: { type: String, required: true },
        description: { type: String, required: true },
        iconClass: { type: String, required: true }
    }],

    // Our Process Section
    ourProcessText: { type: String },    // String line for Our Process
    ourProcessSection: [{
        title: { type: String, required: true },
        description: { type: String, required: true },
        iconClass: { type: String, required: true }
    }],

    // Steps Icons
    steps_icons: [{
        service: { type: String, required: true },
        iconClass: { type: String, required: true }
    }],

    // Location Info for Maps
    locInfo: {
        name: { type: String },
        lat: { type: Number },
        lng: { type: Number }
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AreaPagesContent', AreaPagesContentSchema);
