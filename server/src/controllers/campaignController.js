const Campaign = require('../models/Campaign');

const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ status: 'active' });
    return res.json({ success: true, data: campaigns });
  } catch (e) {
    next(e);
  }
};

const getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found.' });
    }
    return res.json({ success: true, data: campaign });
  } catch (e) {
    next(e);
  }
};

module.exports = { getCampaigns, getCampaignById };
