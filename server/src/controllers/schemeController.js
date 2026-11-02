const Scheme = require('../models/Scheme');
const Bookmark = require('../models/Bookmark');
const { matchSchemes } = require('../utils/eligibilityEngine');

const getSchemes = async (req, res, next) => {
  try {
    const { q, need, district, state, category, type, page = 1, limit = 12 } = req.query;

    const filter = { status: 'published' };

    if (q) {
      filter.$or = [
        { title_hi: { $regex: q, $options: 'i' } },
        { title_en: { $regex: q, $options: 'i' } },
        { description_en: { $regex: q, $options: 'i' } },
      ];
    }
    if (need) {
      // Accept single value or comma-separated list (e.g. ?need=health,pension)
      const needValues = need.split(',').map((s) => s.trim()).filter(Boolean);
      if (needValues.length === 1) {
        filter.need = needValues[0];
      } else if (needValues.length > 1) {
        filter.need = { $in: needValues };
      }
    }
    if (district) filter.districts = district;
    if (state) filter.state = state;
    if (category) filter.category = category;
    if (type === 'central') filter.state = 'Central';
    if (type === 'state' && !state) filter.state = { $ne: 'Central' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Scheme.countDocuments(filter);
    const schemes = await Scheme.find(filter).skip(skip).limit(Number(limit));

    return res.json({
      success: true,
      data: { schemes, total, page: Number(page), limit: Number(limit) },
    });
  } catch (e) {
    next(e);
  }
};

const getSchemeById = async (req, res, next) => {
  try {
    const scheme = await Scheme.findOne({
      _id: req.params.id,
      status: 'published',
    });

    if (!scheme) {
      return res.status(404).json({ success: false, error: 'Scheme not found.' });
    }

    return res.json({ success: true, data: scheme });
  } catch (e) {
    next(e);
  }
};

const checkEligibility = async (req, res, next) => {
  try {
    const { answers } = req.body;

    const schemes = await Scheme.find({ status: 'published' });
    const matched = matchSchemes(answers || {}, schemes);

    return res.json({ success: true, data: matched });
  } catch (e) {
    next(e);
  }
};

const bookmarkScheme = async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findOneAndUpdate(
      { userId: req.user.id, schemeId: req.params.id },
      { userId: req.user.id, schemeId: req.params.id },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: bookmark });
  } catch (e) {
    next(e);
  }
};

const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id }).populate('schemeId');
    return res.json({ success: true, data: bookmarks });
  } catch (e) {
    next(e);
  }
};

module.exports = { getSchemes, getSchemeById, checkEligibility, bookmarkScheme, getBookmarks };
