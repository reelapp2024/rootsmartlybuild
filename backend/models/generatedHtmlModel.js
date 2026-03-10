const mongoose = require('mongoose');

// Define the schema for a country
const generatedHtmlSchema = new mongoose.Schema({
  // name: {
  //   type: String,
  //   required: true, // Name is mandatory
  //   // unique: true, // Country names should be unique
  //   trim: true, // Removes extra spaces
  // },
  country_name:{
    type:String
  },
  service_type:{
    type:String
  },
  user_id: {
    type: String,
    required: true, 
  },
  product_id: {
    type: String,
    required: true, 
  },

  generated_categories:{
    type: Array,
    required: true, 
  },

  generated_images:{
    type:Array
  }
 
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Create a model from the schema
const GeneratedHtml = mongoose.model('generatedHtml', generatedHtmlSchema);

module.exports = GeneratedHtml;
