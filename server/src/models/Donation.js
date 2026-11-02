const mongoose = require('mongoose');

// DPDP: This model stores personal financial data under 80G provisions.
// PAN, email, and phone must be retained for 7 years per Income Tax Act Section 80G.
// Encrypt PAN and contact fields at rest in production.

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // nullable for guest
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  // Money stored as integer paise (never floats)
  amount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
  paymentReference: { type: String },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  // DPDP: PAN is required for 80G receipt. Retain 7 years.
  pan: { type: String },
  donorName: { type: String },
  // DPDP: email is personal contact data used for receipt delivery.
  donorEmail: { type: String },
  // DPDP: phone is personal contact data.
  donorPhone: { type: String },
  donorAddress: { type: String },
  receiptNumber: { type: String, unique: true, sparse: true },
  receiptGeneratedAt: { type: Date },
  isMonthly: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Donation', donationSchema);
