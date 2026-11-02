const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getDashboard,
  listSchemes,
  createScheme,
  updateScheme,
  deleteScheme,
  approveDraft,
  listCampaigns,
  createCampaign,
  updateCampaign,
  listDonations,
  exportCsv,
  exportForm10BD,
  getLogs,
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);

// Scheme routes
router.get('/schemes', listSchemes);
router.post('/schemes', createScheme);
router.put('/schemes/:id', updateScheme);
router.delete('/schemes/:id', deleteScheme);
router.post('/schemes/:id/approve-draft', approveDraft);

// Campaign routes — image upload uses multer memoryStorage
router.get('/campaigns', listCampaigns);
router.post('/campaigns', upload.single('image'), createCampaign);
router.put('/campaigns/:id', upload.single('image'), updateCampaign);

// Donation routes — export endpoints BEFORE /:id to avoid route shadowing
router.get('/donations/export-csv', exportCsv);
router.get('/donations/form10bd', exportForm10BD);
router.get('/donations', listDonations);

// Activity logs
router.get('/logs', getLogs);

module.exports = router;
