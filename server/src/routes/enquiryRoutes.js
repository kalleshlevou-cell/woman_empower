const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');

// POST /api/enquiries — no auth required (anonymous allowed)
router.post('/', async (req, res, next) => {
  try {
    const { schemeId, message, userId } = req.body;

    if (!schemeId) {
      return res.status(400).json({ success: false, error: 'schemeId is required.' });
    }

    const enquiry = await Enquiry.create({
      schemeId,
      message,
      userId: userId || null,
    });

    return res.status(201).json({ success: true, data: { id: enquiry._id } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
