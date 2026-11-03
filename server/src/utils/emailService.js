const nodemailer = require('nodemailer');

/**
 * Send a donation confirmation email.
 * In development: uses Ethereal test account, logs preview URL to console.
 * In production: uses real SMTP via EMAIL_HOST, EMAIL_USER, EMAIL_PASS env vars.
 *
 * Never throws to the caller — wraps everything in try/catch.
 *
 * @param {Object} options
 * @param {string} options.to              Recipient email
 * @param {string} options.donorName
 * @param {string} options.receiptNumber
 * @param {number} options.amount          Amount in paise
 * @param {string} options.campaignName
 * @param {Buffer} options.pdfBuffer       Receipt PDF buffer
 */
async function sendDonationConfirmation({ to, donorName, receiptNumber, amount, campaignName, pdfBuffer }) {
  try {
    let transporter;

    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Production SMTP
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Dev: Ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const amountRupees = `Rs. ${(amount / 100).toFixed(2)}`;

    const info = await transporter.sendMail({
      from: '"EmpowerHer" <no-reply@empowerher.org>',
      to,
      subject: `Donation Receipt — ${receiptNumber}`,
      text: [
        `Dear ${donorName},`,
        '',
        `Thank you for your generous donation of ${amountRupees} to "${campaignName}".`,
        `Your receipt number is: ${receiptNumber}`,
        '',
        'Please find your receipt attached.',
        '',
        '⚠  This is a TEST/SANDBOX transaction and is not valid for actual tax purposes.',
        '',
        'Regards,',
        'EmpowerHer Team',
      ].join('\n'),
      html: `
        <p>Dear ${donorName},</p>
        <p>Thank you for your generous donation of <strong>${amountRupees}</strong> to <em>${campaignName}</em>.</p>
        <p>Your receipt number is: <strong>${receiptNumber}</strong></p>
        <p>Please find your receipt attached.</p>
        <p style="color:red;"><strong>⚠ This is a TEST/SANDBOX transaction and is not valid for actual tax purposes.</strong></p>
        <p>Regards,<br/>EmpowerHer Team</p>
      `,
      attachments: pdfBuffer
        ? [
            {
              filename: `receipt-${receiptNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ]
        : [],
    });

    // Log preview URL for dev Ethereal accounts
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Email preview URL:', previewUrl);
    }
    return previewUrl || null;
  } catch (err) {
    // Never fail the donation flow if email fails
    console.error('Email service error:', err.message);
    return null;
  }
}

module.exports = { sendDonationConfirmation };
