const mongoose = require('mongoose');

const HostingConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  /** Optional nickname shown in the UI, e.g. "Client A – cPanel" */
  label: {
    type: String,
    trim: true,
    default: '',
  },
  connectionType: {
    type: String,
    enum: ['ftp', 'ssh', 'cpanel', 'vps'],
    required: true
  },
  connectionConfig: {
    type: String, // store as stringified JSON
    required: true
  },
  isOur: {
    type: Boolean, default: false
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'failed'
  },
  /** Last connection error message (cleared on successful verify). */
  lastError: {
    type: String,
    default: '',
  },
  lastVerifiedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('HostingConnection', HostingConnectionSchema);
