const express = require('express');
const router = express.Router();
const { getCampaigns, getCampaignById } = require('../controllers/campaignController');

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);

module.exports = router;
