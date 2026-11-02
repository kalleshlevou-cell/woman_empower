const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound unique index prevents duplicate bookmarks
bookmarkSchema.index({ userId: 1, schemeId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
