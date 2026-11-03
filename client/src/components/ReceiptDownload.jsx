import { useState } from 'react';
import { getReceipt } from '../api/donationsApi';
import { useLanguage } from '../context/LanguageContext';

export default function ReceiptDownload({ donationId, receiptNumber }) {
  const { lang } = useLanguage();
  const t = (en, hi) => lang === 'hi' ? hi : en;
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [printLoading, setPrintLoading] = useState(false);
  const [printError, setPrintError]     = useState('');

  const handleDownload = async () => {
    setLoading(true); setError('');
    try {
      const res = await getReceipt(donationId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptNumber || donationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError(t('Receipt download failed. Please try again.', 'रसीद डाउनलोड विफल।'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setPrintLoading(true); setPrintError('');
    try {
      const res = await getReceipt(donationId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      // Open in new tab for browser's built-in print dialog.
      // Do NOT revoke the URL immediately — the new tab needs it to render the PDF.
      window.open(url);
    } catch {
      setPrintError(t('Print failed. Please try again.', 'प्रिंट विफल।'));
    } finally {
      setPrintLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
          aria-label={`Download receipt ${receiptNumber || ''}`}
        >
          {loading ? '…' : '⬇'} {t('Download Receipt', 'रसीद डाउनलोड')}
          {receiptNumber && <span className="text-xs opacity-80">({receiptNumber})</span>}
        </button>
        <button
          onClick={handlePrint}
          disabled={printLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors"
          aria-label={`Print receipt ${receiptNumber || ''}`}
        >
          {printLoading ? '…' : '🖨'} {t('Print', 'प्रिंट')}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      {printError && <p className="text-red-600 text-xs">{printError}</p>}
    </div>
  );
}
