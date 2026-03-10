const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create User Schema
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    lowercase: true,
    match: [/^([\w-]+(?:\.[\w-]+)*@[a-z0-9-]+(?:\.[a-z0-9-]+)*(\.[a-z]{2,})?)$/i, 'Please enter a valid email address.'],
  },

  phone: {
    type: String,
    required: false,
    unique: false,

    match: [/^\+?(\d{1,4})?[\s\-]?\(?\d{1,5}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}$/, 'Please enter a valid phone number.'],
  },

  mail_otp: {
    type: String,
    required: false,
    minlength: 1,
    maxlength: 6,
    trim: true
  },


  password: {
    type: String,
    required: false,
    minlength: 6
  },
  address: {
    type: String,
    required: false,
  },
  // subscriptions: [{
  //   subscriptionType: {
  //     type: String,
  //     required: false,
  //     enum: ['basic', 'premium', 'enterprise'], // Subscription types
  //   },
  //   startDate: {
  //     type: Date,
  //     default: Date.now
  //   },
  //   endDate: {
  //     type: Date,
  //     required: false
  //   },
  //   status: {
  //     type: String,
  //     enum: ['active', 'inactive', 'cancelled'],
  //     default: 'active'
  //   },
  // }],
  wallet: {
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [{
      amount: {
        type: Number,
        required: false,
      },
      date: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        enum: ['credit', 'debit'],
        required: false
      },
      description: {
        type: String,
        required: false
      }
    }]
  },
  type: {
    type: Number,
    enum: [0, 1, 2], // 0 = App User, 1 = Admin, 2 = Reviewer
    default: 0
  },

  isSuper: {
    type: Number,
    enum: [0, 1],
    default: 0 //0 for not user 1 for Super Admin
  },

  devices: [
    {
      deviceToken: {
        type: String,
        required: false,
        unique: true, // Ensure no two devices share the same token
        trim: true,
        minlength: 10 // Minimum length to ensure validity (e.g., UUID or device identifier)
      },
      deviceType: {
        type: String,
        required: false,
        enum: ['0', '1', '2', "mobile", "android", "iphone", "ipad", "phone", "desktop"]


        // Limit to known device types 0 for ios 1 for android 2 for we b
      },

      tokenVersion: { type: Number, default: 0 } // Increment on logout-all,

    }
  ],

  image: {
    type: String,
    default: null, // reviewers may or may not upload
  },



  // optional OTP verification fields for reviewers
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: {
    type: String
  },
  emailOtpExpires: {
    type: Date
  },



  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});



// Create a model using the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
