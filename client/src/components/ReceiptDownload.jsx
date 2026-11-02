import { useState } from 'react';
import { getReceipt } from '../api/donationsApi';

export default function ReceiptDownload({ donationId, receiptNumber }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
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
      setError('Receipt download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
        aria-label={`Download receipt ${receiptNumber || ''}`}
      >
        {loading ? '…' : '⬇'} Receipt {receiptNumber ? `(${receiptNumber})` : ''} डाउनलोड करें
      </button>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}
