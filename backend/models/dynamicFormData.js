const mongoose = require('mongoose');

// Dynamic Form Data Schema (for storing submitted form responses)
const dynamicFormDataSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DynamicForm',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProject',
      required: true,
    },   
    submittedData: {
      type: mongoose.Schema.Types.Mixed, // Flexible object to store dynamic form responses
      required: true,
    },
  
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

const DynamicFormData = mongoose.model('DynamicFormData', dynamicFormDataSchema);

module.exports = DynamicFormData;
