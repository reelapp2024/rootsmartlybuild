const mongoose = require('mongoose');

// Define the schema for Country
const AdminCountriesSchema = new mongoose.Schema({
  id: String,
  sortname: String,
  name: String,
  manual: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  lat: { type: Number, required: false },
  lng: { type: Number, required: false },
});

// Create the Country model
const AdminCountry = mongoose.model('AdminCountry', AdminCountriesSchema);

// Export the model if needed
module.exports = AdminCountry;
