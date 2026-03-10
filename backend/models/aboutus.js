const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for AboutUs
const AboutUsSchema = new mongoose.Schema({
    email: { type: String, required: false }, // 
    phone: { type: String, required: false }, //
    mainLocation: { type: String, required: false },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'UserProject', // Reference to the UserProject model
        required: true
    },
});

// Create the AboutUs model
const AboutUs = mongoose.model('AboutUs', AboutUsSchema);

module.exports = AboutUs; // Export the model for reuse
