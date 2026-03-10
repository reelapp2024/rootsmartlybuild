const mongoose = require('mongoose');


const ProjectDeploymentSchema = new mongoose.Schema({
  hostingId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingConnection', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProject', required: true },
  domainName: { type: String, required: true },
  rootPath: { type: String, default: '/' },
  environment: { type: String, enum: ['development', 'staging', 'production'], default: 'development' },
  deploymentStatus: {
    type: String,
    enum: [
      'pending', 
      'building', 
      'build_failed', 
      'installing_npm', 
      'uploading', 
      'upload_failed', 
      'success'
    ],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProjectDeployment', ProjectDeploymentSchema);
