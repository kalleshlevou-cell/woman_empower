const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getMyDonations, getReceipt } = require('../controllers/donationController');
const { protect } = require('../middleware/auth');

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/my', protect, getMyDonations);
router.get('/:id/receipt', protect, getReceipt);

module.exports = router;
