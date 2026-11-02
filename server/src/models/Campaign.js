const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  // Money stored as integer paise (never floats)
  targetAmount: { type: Number, required: true },
  raisedAmount: { type: Number, default: 0 },
  image: { type: String }, // Cloudinary URL or local path
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  startDate: { type: Date },
  endDate: { type: Date },
});

module.exports = mongoose.model('Campaign', campaignSchema);
