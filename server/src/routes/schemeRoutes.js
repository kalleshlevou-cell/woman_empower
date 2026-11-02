const express = require('express');
const router = express.Router();
const {
  getSchemes,
  getSchemeById,
  checkEligibility,
  bookmarkScheme,
  getBookmarks,
} = require('../controllers/schemeController');
const { protect } = require('../middleware/auth');
const { schemesLimiter } = require('../middleware/rateLimiter');

// IMPORTANT: mount /bookmarks and /eligibility BEFORE /:id
// to avoid Express matching them as the :id parameter
router.get('/bookmarks', protect, getBookmarks);
router.post('/eligibility', checkEligibility);

router.get('/', schemesLimiter, getSchemes);
router.get('/:id', getSchemeById);
router.post('/:id/bookmark', protect, bookmarkScheme);

module.exports = router;
