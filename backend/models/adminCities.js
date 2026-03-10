const mongoose = require('mongoose');

// Define the schema for City
const AdminCitiesSchema = new mongoose.Schema({
  id: { type: String, required: true }, // ID of the city
  name: { type: String, required: false }, // Name of the city
  state_id: { type: String, required: true }, // Associated state ID
  manual: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
    lat: { type: Number, required: false },
  lng: { type: Number, required: false },
  notavailable: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
});

// Create the City model
const AdminCity = mongoose.model('AdminCity', AdminCitiesSchema);

module.exports = AdminCity; // Export the model for reuse
