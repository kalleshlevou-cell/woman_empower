const crypto = require('crypto');
const Joi = require('joi');
const Razorpay = require('razorpay');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const { getNextReceiptNumber } = require('../utils/receiptCounter');
const { generateReceiptPDF } = require('../utils/pdfGenerator');
const { sendDonationConfirmation } = require('../utils/emailService');

// DPDP: This controller handles personal financial data (PAN, email, phone, address).
// All data is collected under 80G donation receipt generation requirements.
// Data is retained for 7 years per Income Tax Act.

const createOrderSchema = Joi.object({
  campaignId: Joi.string().required(),
  // Amount in integer paise, minimum ₹500 = 50000 paise
  amount: Joi.number().integer().min(50000).required(),
  donorName: Joi.string().required(),
  // DPDP: email collected for receipt delivery
  donorEmail: Joi.string().email().required(),
  // DPDP: phone collected for donor contact
  donorPhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({ 'string.pattern.base': 'Phone must be 10 digits.' }),
  // DPDP: PAN collected for 80G receipt. Optional but required to get 80G certificate.
  pan: Joi.string()
    .uppercase()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .optional()
    .allow('', null)
    .messages({ 'string.pattern.base': 'Invalid PAN format. Expected: AAAAA0000A' }),
  isMonthly: Joi.boolean().default(false),
  address: Joi.string().required(),
  acceptedPrivacyPolicy: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the privacy policy.',
    'any.required': 'acceptedPrivacyPolicy is required.',
  }),
});

const createOrder = async (req, res, next) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details.map((d) => d.message).join('; '),
      });
    }

    const { campaignId, amount, donorName, donorEmail, donorPhone, pan, isMonthly, address } = value;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found.' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: String(campaignId),
    });

    const donation = new Donation({
      donorId: req.user ? req.user.id : null,
      campaignId,
      amount,
      paymentStatus: 'pending',
      razorpayOrderId: order.id,
      donorName,
      donorEmail,
      donorPhone,
      pan,
      donorAddress: address,
      isMonthly,
    });
    await donation.save();

    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        donationId: donation._id,
      },
    });
  } catch (e) {
    next(e);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, donationId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !donationId) {
      return res.status(400).json({ success: false, error: 'Missing required verification fields.' });
    }

    // Signature verification — backend only, using crypto.createHmac
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      await Donation.findByIdAndUpdate(donationId, { paymentStatus: 'failed' });
      return res.status(400).json({ success: false, error: 'Invalid payment signature.' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, error: 'Donation record not found.' });
    }

    // Foreign card detection: fetch payment details from Razorpay to check international flag
    try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const payment = await razorpay.payments.fetch(razorpayPaymentId);
      if (payment && payment.international === true) {
        await Donation.findByIdAndUpdate(donationId, { paymentStatus: 'failed' });
        return res.status(400).json({
          success: false,
          error: 'Foreign card rejected.',
          message_hi: 'विदेशी कार्ड स्वीकार नहीं किए जाते।',
          message_en: 'Foreign cards are not accepted.',
        });
      }
    } catch (fetchErr) {
      // Non-fatal — proceed if payment fetch fails
      console.warn('Could not fetch payment details for international check:', fetchErr.message);
    }

    const receiptNumber = await getNextReceiptNumber();

    const campaign = await Campaign.findById(donation.campaignId);

    const pdfBuffer = await generateReceiptPDF(
      {
        donorName: donation.donorName,
        pan: donation.pan,
        amount: donation.amount,
        createdAt: donation.createdAt,
        receiptNumber,
        donorAddress: donation.donorAddress,
      },
      { title: campaign ? campaign.title : 'General Donation' }
    );

    await Donation.findByIdAndUpdate(donationId, {
      paymentStatus: 'success',
      razorpayPaymentId,
      razorpaySignature,
      paymentReference: razorpayPaymentId,
      receiptNumber,
      receiptGeneratedAt: new Date(),
    });

    // Atomically update campaign raisedAmount
    if (campaign) {
      await Campaign.findByIdAndUpdate(donation.campaignId, {
        $inc: { raisedAmount: donation.amount },
      });
    }

    // Send confirmation email (non-blocking, errors are swallowed in emailService)
    sendDonationConfirmation({
      to: donation.donorEmail,
      donorName: donation.donorName,
      receiptNumber,
      amount: donation.amount,
      campaignName: campaign ? campaign.title : 'General Donation',
      pdfBuffer,
    });

    return res.json({
      success: true,
      data: { receiptNumber, donationId },
    });
  } catch (e) {
    next(e);
  }
};

const getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ donorId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('campaignId', 'title');
    return res.json({ success: true, data: donations });
  } catch (e) {
    next(e);
  }
};

const getReceipt = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('campaignId');

    if (!donation) {
      return res.status(404).json({ success: false, error: 'Donation not found.' });
    }

    // Ownership check: donor can only access their own receipts; admin can access all
    const isOwner = String(donation.donorId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    if (donation.paymentStatus !== 'success') {
      return res.status(400).json({ success: false, error: 'Receipt not available for this donation.' });
    }

    const campaign = donation.campaignId;
    const pdfBuffer = await generateReceiptPDF(
      {
        donorName: donation.donorName,
        pan: donation.pan,
        amount: donation.amount,
        createdAt: donation.createdAt,
        receiptNumber: donation.receiptNumber,
        donorAddress: donation.donorAddress,
      },
      { title: campaign ? campaign.title : 'General Donation' }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${donation.receiptNumber}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (e) {
    next(e);
  }
};

module.exports = { createOrder, verifyPayment, getMyDonations, getReceipt };
