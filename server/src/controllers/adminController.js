const Scheme = require('../models/Scheme');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const AdminLog = require('../models/AdminLog');
const User = require('../models/User');
const { uploadToCloudinary } = require('../middleware/upload');

// DPDP: Admin endpoints expose donor PAN, email, phone, and address.
// Access is restricted to admin role only (enforced by adminOnly middleware).
// All exports (CSV, Form 10BD) must be treated as sensitive data and handled accordingly.

/**
 * Save an admin action log entry.
 */
async function logAdminAction(adminId, action, entityType, entityId, details) {
  try {
    await AdminLog.create({ adminId, action, entityType, entityId: String(entityId), details });
  } catch (err) {
    console.error('Failed to write admin log:', err.message);
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalDonationsCount,
      successfulDonations,
      uniqueDonorCount,
      schemesByStatus,
      campaignCount,
      successfulDonationsCount,
    ] = await Promise.all([
      Donation.countDocuments(),
      Donation.aggregate([
        { $match: { paymentStatus: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Donation.distinct('donorId', { donorId: { $ne: null } }),
      Scheme.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Campaign.countDocuments({ status: 'active' }),
      Donation.countDocuments({ paymentStatus: 'success' }),
    ]);

    const totalAmountPaise = successfulDonations[0]?.total || 0;

    // Campaign-wise raised amounts
    const campaignStats = await Donation.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: '$campaignId', raised: { $sum: '$amount' } } },
      {
        $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: '_id',
          as: 'campaign',
        },
      },
      { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: true } },
      { $project: { campaignTitle: '$campaign.title', raised: 1 } },
    ]);

    return res.json({
      success: true,
      data: {
        totalDonations: totalDonationsCount,
        totalAmountPaise,
        totalAmountRupees: (totalAmountPaise / 100).toFixed(2),
        uniqueDonors: uniqueDonorCount.length,
        activeCampaigns: campaignCount,
        schemesByStatus: Object.fromEntries(schemesByStatus.map((s) => [s._id, s.count])),
        campaignStats,
        successfulDonationsCount,
      },
    });
  } catch (e) {
    next(e);
  }
};

// ─── Schemes ──────────────────────────────────────────────────────────────────

const listSchemes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Scheme.countDocuments();
    const schemes = await Scheme.find().skip(skip).limit(Number(limit)).sort({ updatedAt: -1 });
    return res.json({ success: true, data: { schemes, total } });
  } catch (e) {
    next(e);
  }
};

const createScheme = async (req, res, next) => {
  try {
    const scheme = new Scheme({
      ...req.body,
      createdBy: req.user.id,
      // Mock AI draft — real OpenAI integration is out of scope
      aiDraft_hi: 'यह एक AI-निर्मित मसौदा है। कृपया समीक्षा करें और अनुमोदित करें।',
      aiDraftApproved: false,
      updatedAt: new Date(),
    });
    await scheme.save();
    await logAdminAction(req.user.id, 'CREATE_SCHEME', 'Scheme', scheme._id, { title: scheme.title_en });
    return res.status(201).json({ success: true, data: scheme });
  } catch (e) {
    next(e);
  }
};

const updateScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!scheme) return res.status(404).json({ success: false, error: 'Scheme not found.' });
    await logAdminAction(req.user.id, 'UPDATE_SCHEME', 'Scheme', scheme._id, { title: scheme.title_en });
    return res.json({ success: true, data: scheme });
  } catch (e) {
    next(e);
  }
};

// Soft-delete: set status to 'draft' rather than removing the document
const deleteScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id,
      { status: 'draft', updatedAt: new Date() },
      { new: true }
    );
    if (!scheme) return res.status(404).json({ success: false, error: 'Scheme not found.' });
    await logAdminAction(req.user.id, 'DELETE_SCHEME (soft)', 'Scheme', scheme._id, { title: scheme.title_en });
    return res.json({ success: true, data: { id: scheme._id, status: 'draft' } });
  } catch (e) {
    next(e);
  }
};

const approveDraft = async (req, res, next) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id,
      { aiDraftApproved: true, updatedAt: new Date() },
      { new: true }
    );
    if (!scheme) return res.status(404).json({ success: false, error: 'Scheme not found.' });
    await logAdminAction(req.user.id, 'APPROVE_AI_DRAFT', 'Scheme', scheme._id, {});
    return res.json({ success: true, data: scheme });
  } catch (e) {
    next(e);
  }
};

// ─── Campaigns ────────────────────────────────────────────────────────────────

const listCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find().sort({ _id: -1 });
    return res.json({ success: true, data: campaigns });
  } catch (e) {
    next(e);
  }
};

const createCampaign = async (req, res, next) => {
  try {
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'campaigns');
    }

    const campaign = new Campaign({
      ...req.body,
      image: imageUrl,
    });
    await campaign.save();
    await logAdminAction(req.user.id, 'CREATE_CAMPAIGN', 'Campaign', campaign._id, { title: campaign.title });
    return res.status(201).json({ success: true, data: campaign });
  } catch (e) {
    next(e);
  }
};

const updateCampaign = async (req, res, next) => {
  try {
    let updateData = { ...req.body };
    if (req.file) {
      updateData.image = await uploadToCloudinary(req.file.buffer, 'campaigns');
    }
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found.' });
    await logAdminAction(req.user.id, 'UPDATE_CAMPAIGN', 'Campaign', campaign._id, { title: campaign.title });
    return res.json({ success: true, data: campaign });
  } catch (e) {
    next(e);
  }
};

// ─── Donations ────────────────────────────────────────────────────────────────

const listDonations = async (req, res, next) => {
  try {
    const { campaignId, status, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (campaignId) filter.campaignId = campaignId;
    if (status) filter.paymentStatus = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Donation.countDocuments(filter);
    const donations = await Donation.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate('campaignId', 'title');

    return res.json({ success: true, data: { donations, total } });
  } catch (e) {
    next(e);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="donations.csv"');

    // Stream CSV header
    res.write('Receipt No,Date,Donor Name,Email,Phone,PAN,Campaign,Amount (INR),Status,Monthly\n');

    // Use Mongoose cursor to avoid loading all records into memory
    const cursor = Donation.find()
      .populate('campaignId', 'title')
      .sort({ createdAt: -1 })
      .cursor();

    for await (const doc of cursor) {
      const row = [
        doc.receiptNumber || '',
        doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-IN') : '',
        `"${(doc.donorName || '').replace(/"/g, '""')}"`,
        doc.donorEmail || '',
        doc.donorPhone || '',
        doc.pan || '',
        `"${(doc.campaignId?.title || '').replace(/"/g, '""')}"`,
        (doc.amount / 100).toFixed(2),
        doc.paymentStatus || '',
        doc.isMonthly ? 'Yes' : 'No',
      ].join(',');
      res.write(row + '\n');
    }

    res.end();
  } catch (e) {
    next(e);
  }
};

const exportForm10BD = async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="form10bd.csv"');

    // EXACT required headers for Form 10BD
    res.write('Sl. No.,Name of Donor,Address,PAN/Aadhaar,Amount,Mode of Receipt,Nature of Receipt,Date\n');

    let slNo = 1;
    const cursor = Donation.find({ paymentStatus: 'success' })
      .sort({ createdAt: 1 })
      .cursor();

    for await (const doc of cursor) {
      const row = [
        slNo++,
        `"${(doc.donorName || '').replace(/"/g, '""')}"`,
        `"${(doc.donorAddress || '').replace(/"/g, '""')}"`,
        doc.pan || '',
        (doc.amount / 100).toFixed(2),
        'Online',
        'Others',
        doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-IN') : '',
      ].join(',');
      res.write(row + '\n');
    }

    res.end();
  } catch (e) {
    next(e);
  }
};

// ─── Activity Logs ────────────────────────────────────────────────────────────

const getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await AdminLog.countDocuments();
    const logs = await AdminLog.find()
      .skip(skip)
      .limit(Number(limit))
      .sort({ timestamp: -1 })
      .populate('adminId', 'name email');
    return res.json({ success: true, data: { logs, total } });
  } catch (e) {
    next(e);
  }
};

module.exports = {
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
  logAdminAction,
};
