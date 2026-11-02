const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);

module.exports = router;
