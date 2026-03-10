const mongoose = require('mongoose');

const taskStatusSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProject' },
  type: { type: String, enum: ['country', 'state', 'city'], required: true },
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
});

const TaskStatus = mongoose.model('TaskStatus', taskStatusSchema);

module.exports = TaskStatus;
