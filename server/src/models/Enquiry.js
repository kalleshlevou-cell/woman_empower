const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // nullable for anonymous
  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', default: null }, // nullable for helpline call-back requests without a specific scheme
  message: { type: String },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Enquiry', enquirySchema);
