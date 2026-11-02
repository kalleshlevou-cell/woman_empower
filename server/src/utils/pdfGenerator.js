const PDFDocument = require('pdfkit');

/**
 * Convert paise to English words for receipt.
 * English-only; full Hindi numeral conversion is out of scope.
 */
function amountToWords(paise) {
  const rupees = Math.floor(paise / 100);
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n) {
    if (n === 0) return 'Zero';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  return convert(rupees) + ' Rupees Only';
}

/**
 * Generate a donation receipt PDF buffer.
 *
 * @param {Object} donation - Donation document
 * @param {Object} campaign - Campaign document
 * @returns {Promise<Buffer>}
 */
function generateReceiptPDF(donation, campaign) {
  return new Promise((resolve, reject) => {
    const trustName = process.env.TRUST_NAME;
    const trustPan = process.env.TRUST_PAN;
    const trust80g = process.env.TRUST_80G_REG;

    if (!trustName) return reject(new Error('TRUST_NAME env variable is required for PDF generation'));
    if (!trustPan) return reject(new Error('TRUST_PAN env variable is required for PDF generation'));
    if (!trust80g) return reject(new Error('TRUST_80G_REG env variable is required for PDF generation'));
    if (!donation.donorName) return reject(new Error('donation.donorName is required'));
    if (!donation.pan) return reject(new Error('donation.pan is required'));
    if (donation.amount === undefined) return reject(new Error('donation.amount is required'));
    if (!donation.createdAt) return reject(new Error('donation.createdAt is required'));
    if (!donation.receiptNumber) return reject(new Error('donation.receiptNumber is required'));
    if (!campaign || !campaign.title) return reject(new Error('campaign.title is required'));

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const amountRupees = `Rs. ${(donation.amount / 100).toFixed(2)}`;
    const amountWords = amountToWords(donation.amount);
    const dateStr = new Date(donation.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // ─── Header ───────────────────────────────────────────────────────────────
    doc.fontSize(18).font('Helvetica-Bold').text(trustName, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Bhopal, Madhya Pradesh', { align: 'center' });
    doc.text(`PAN: ${trustPan}   |   80G Reg: ${trust80g}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ─── Receipt number + date ────────────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').text('DONATION RECEIPT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Receipt No: ${donation.receiptNumber}`, 50);
    doc.text(`Date: ${dateStr}`, 50);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ─── Donor details ────────────────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').text('Donor Details');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name:    ${donation.donorName}`);
    doc.text(`PAN:     ${donation.pan}`);
    if (donation.donorAddress) doc.text(`Address: ${donation.donorAddress}`);
    doc.moveDown(0.5);

    // ─── Donation details ─────────────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').text('Donation Details');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Campaign:       ${campaign.title}`);
    doc.text(`Amount:         ${amountRupees}`);
    doc.text(`Amount (words): ${amountWords}`);
    doc.moveDown(1);

    // ─── TEST/SANDBOX footer — ALWAYS present, never gated on env flag ────────
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('red')
      .text('⚠  TEST / SANDBOX TRANSACTION', { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('black')
      .text(
        'This is a TEST/SANDBOX transaction. Not valid for actual tax purposes until verified.',
        { align: 'center' }
      );

    doc.end();
  });
}

module.exports = { generateReceiptPDF, amountToWords };
