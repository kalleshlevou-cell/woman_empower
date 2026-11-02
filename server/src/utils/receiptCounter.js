const Counter = require('../models/Counter');

/**
 * THIS IS THE ONLY PLACE receipt numbers are generated.
 * Never use count() + 1 anywhere in the codebase.
 */
async function getNextReceiptNumber() {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: 'receipt' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `RCP-${year}-${String(counter.seq).padStart(6, '0')}`;
}

module.exports = { getNextReceiptNumber };
