// models/Domain.js
const mongoose = require('mongoose');

const DomainSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // projectId is optional now
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },

  domain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        const d = (v || '').replace(/(^\w+:|^)\/\//, '').replace(/\/+$/, '').trim();
        return /^[a-z0-9\-._~%]+(\.[a-z0-9\-._~%]+)*(:\d+)?$/.test(d);
      },
      message: props => `${props.value} is not a valid domain`
    }
  },

  hosting: {
    type: String,
    enum: ['ours', 'theirs'],
    default: 'ours'
  },

  status: {
    type: String,
    enum: ['pending', 'verified', 'connected_to_our_server', 'verification_failed', 'inactive'],
    default: 'pending'
  },

  verificationMethod: {
    type: String,
    enum: ['dns-txt', 'nameserver_or_ip', null],
    default: null
  },

  verificationDetails: {
    type: Object,
    default: {}
  },

  lastVerifiedAt: {
    type: Date,
    default: null
  },

  hostingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostingConnection',
    default: null
  },

  siteHostRootPath: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// NOTE: unique per user + domain (projectId is optional)
DomainSchema.index({ userId: 1, domain: 1 }, { unique: true });

DomainSchema.pre('validate', function(next) {
  if (this.domain && typeof this.domain === 'string') {
    this.domain = this.domain.replace(/(^\w+:|^)\/\//, '').replace(/\/+$/, '').trim().toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Domain', DomainSchema);
