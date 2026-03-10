const mongoose = require('mongoose');

// Define the schema for LocalArea
const AdminLocalAreaSchema = new mongoose.Schema({
  id: { type: String, required: true },        // ID of the local area
  name: { type: String, required: false },     // Name of the local area
  city_id: { type: String, required: true },   // Associated city ID
  namepincode: { type: String, required: false },   // Associated city ID
  pincode: { type: String, required: false },   // Associated city ID
  manual: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  lat: { type: Number, required: false },      // Optional latitude
  lng: { type: Number, required: false },      // Optional longitude
  notavailable: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

// Create the LocalArea model
const AdminLocalArea = mongoose.model('AdminLocalArea', AdminLocalAreaSchema);

module.exports = AdminLocalArea;
