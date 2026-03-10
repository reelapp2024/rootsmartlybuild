const mongoose = require('mongoose');

// Define the schema for State
const AdminStatesSchema = new mongoose.Schema({
  id: String,
  name: String,
  country_id: {
    type: String,
    required: false, // Makes the field optional
    default: null,  // Explicitly allows null as a default value
  },
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
    sortname: String,
});


// Create the State model
const AdminState = mongoose.model('AdminState', AdminStatesSchema);
module.exports = AdminState;