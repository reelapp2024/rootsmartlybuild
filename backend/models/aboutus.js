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

// Define the schema for AboutUs
const AboutUsSchema = new mongoose.Schema({
    email: { type: String, required: false }, // 
    phone: { type: String, required: false }, //
    emails: { type: [ContactItemSchema], default: [] },
    phones: { type: [ContactItemSchema], default: [] },
    address: { type: String, required: false },
    mainLocation: { type: String, required: false },
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
