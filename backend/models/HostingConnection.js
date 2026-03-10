const mongoose = require('mongoose');

const HostingConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('HostingConnection', HostingConnectionSchema);
