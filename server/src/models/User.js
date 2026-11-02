const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // DPDP: email is personal data. Used for login and donation confirmations.
  // Retain only as long as user account is active or as required by 80G rules (7 years).
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['donor', 'admin'], default: 'donor' },
  // DPDP: PAN is personal financial data. Required for 80G receipt generation.
  // Encrypt at rest in production. Retain for 7 years as required by Income Tax Act.
  pan: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // optional
        return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);
      },
      message: 'Invalid PAN format. Expected format: AAAAA0000A',
    },
  },
  // DPDP: phone is personal data. Retain only as long as required.
  phone: { type: String },
  // DPDP: address is personal data. Encrypt at rest in production. Retain for 7 years (80G).
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Hash password only when passwordHash field is modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
