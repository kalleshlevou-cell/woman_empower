const mongoose = require('mongoose');

const eligibilityCriterionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, required: true, enum: ['eq', 'gte', 'lte', 'includes', 'bool'] },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const schemeSchema = new mongoose.Schema({
  // Hindi fields must NOT have ASCII validators
  title_hi: { type: String, required: true },
  title_en: { type: String, required: true },
  description_hi: { type: String },
  description_en: { type: String },
  // Mock AI-drafted Hindi summary; must be reviewed by admin before publishing
  aiDraft_hi: { type: String },
  aiDraftApproved: { type: Boolean, default: false },
  need: {
    type: String,
    enum: ['health', 'livelihood', 'pension', 'maternity'],
    required: true,
  },
  state: { type: String, default: 'Madhya Pradesh' },
  districts: [{ type: String }],
  category: { type: String },
  eligibilityCriteria: [eligibilityCriterionSchema],
  benefits: { type: String },
  documents: [{ type: String }],
  applicationProcess: { type: String },
  officialUrl: { type: String },
  lastCheckedAt: { type: Date },
  helpCentre: { type: String },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for search performance
schemeSchema.index({ need: 1, state: 1, status: 1 });

module.exports = mongoose.model('Scheme', schemeSchema);
