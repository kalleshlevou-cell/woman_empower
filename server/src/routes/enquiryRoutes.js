const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');

// POST /api/enquiries — no auth required (anonymous allowed)
router.post('/', async (req, res, next) => {
  try {
    const { schemeId, message, userId, phone } = req.body;

    // Combine phone into message if provided (for helpline call-back requests without a schemeId)
    const fullMessage = phone ? `Phone: ${phone}\n${message || ''}` : message;

    const enquiry = await Enquiry.create({
      schemeId: schemeId || null,
      message: fullMessage,
      userId: userId || null,
    });

    return res.status(201).json({ success: true, data: { id: enquiry._id } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
