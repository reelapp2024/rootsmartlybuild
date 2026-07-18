const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContactItemSchema = new mongoose.Schema(
    {
        value: { type: String, required: true, trim: true },
        is_primary: { type: Boolean, default: false },
    },
    { _id: false }
);

const SocialLinkSchema = new mongoose.Schema(
    {
        platform: { type: String, required: true, trim: true },
        customLabel: { type: String, required: false, trim: true },
        url: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const BusinessHoursDaySchema = new mongoose.Schema(
    {
        day: { type: String, required: true, trim: true }, // mon–sun
        enabled: { type: Boolean, default: false },
        open: { type: String, default: '07:00' },
        close: { type: String, default: '20:00' },
    },
    { _id: false }
);

const BusinessHoursSchema = new mongoose.Schema(
    {
        /** same = selected days share open/close; custom = per-day times */
        mode: { type: String, enum: ['same', 'custom'], default: 'same' },
        open: { type: String, default: '07:00' },
        close: { type: String, default: '20:00' },
        note: { type: String, required: false, trim: true, default: '' },
        days: { type: [BusinessHoursDaySchema], default: [] },
    },
    { _id: false }
);

// Define the schema for AboutUs
const AboutUsSchema = new mongoose.Schema({
    email: { type: String, required: false }, // 
    phone: { type: String, required: false }, //
    emails: { type: [ContactItemSchema], default: [] },
    phones: { type: [ContactItemSchema], default: [] },
    address: { type: String, required: false },
    mainLocation: { type: String, required: false },
    /** Structured availability — drives Contact + Footer hours */
    businessHours: { type: BusinessHoursSchema, required: false },
    /** Preset keys (facebook, instagram, …) or "custom" with optional customLabel */
    socialLinks: { type: [SocialLinkSchema], default: [] },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'UserProject', // Reference to the UserProject model
        required: true
    },
});

// Create the AboutUs model
const AboutUs = mongoose.model('AboutUs', AboutUsSchema);

module.exports = AboutUs; // Export the model for reuse
