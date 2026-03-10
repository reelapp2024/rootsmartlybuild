const mongoose = require('mongoose');

// Dynamic Form Schema
const dynamicFormSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProject',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    fields: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      type: {
        type: String,
        required: true,
        enum: ['text', 'email', 'tel', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date', 'file'],
      },
      label: {
        type: String,
        required: true,
        trim: true,
      },
      required: {
        type: Boolean,
        default: false,
      },
      options: [{
        type: String,
        trim: true,
      }],
      placeholder: {
        type: String,
        trim: true,
      },
      defaultValue: {
        type: mongoose.Schema.Types.Mixed,
      },
    }],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

const DynamicForm = mongoose.model('DynamicForm', dynamicFormSchema);

module.exports = DynamicForm;
