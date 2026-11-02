import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  adminGetDonations,
  adminExportCsv,
  adminGetForm10BD,
} from '../api/adminApi';
import { getCampaigns } from '../api/campaignsApi';
import { formatINR, formatDate } from '../utils/formatters';

const LIMIT = 20;

const STATUS_CLASSES = {
  success: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaigns, setCampaigns] = useState([]);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  // Load campaigns for dropdown
  useEffect(() => {
    getCampaigns()
      .then((res) => setCampaigns(res.data?.data || []))
      .catch(() => {});
  }, []);

  const buildFilter = useCallback(() => {
    const params = { page, limit: LIMIT };
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    if (campaignId) params.campaignId = campaignId;
    if (statusFilter) params.status = statusFilter;
    return params;
  }, [page, fromDate, toDate, campaignId, statusFilter]);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetDonations(buildFilter());
      const { donations: d, total: t } = res.data?.data || {};
      setDonations(d || []);
      setTotal(t || 0);
    } catch {
      setError('दान लोड नहीं हो सके / Could not load donations.');
    } finally {
      setLoading(false);
    }
  }, [buildFilter]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    // page reset will trigger fetchDonations via useEffect
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setExportError('');
    try {
      // Pass current filters to export endpoint
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (campaignId) params.campaignId = campaignId;
      if (statusFilter) params.status = statusFilter;

      const res = await adminExportCsv(params);
      triggerDownload(res.data, 'donations.csv');
    } catch {
      setExportError('CSV export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportForm10BD = async () => {
    setExporting(true);
    setExportError('');
    try {
      const res = await adminGetForm10BD();
      triggerDownload(res.data, 'form10bd.csv');
    } catch {
      setExportError('Form 10BD export failed.');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <div className="flex flex-1 pt-14">
        <AdminSidebar />
        <main role="main" className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-primaryText">दान रिपोर्ट / Donation Report</h1>
            <div className="flex gap-2">
              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="px-3 py-2 text-sm bg-secondary text-white rounded hover:bg-green-700 disabled:opacity-60 font-medium"
              >
                {exporting ? '…' : '⬇ Export CSV'}
              </button>
              <button
                onClick={handleExportForm10BD}
                disabled={exporting}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 font-medium"
              >
                {exporting ? '…' : '⬇ Form 10BD'}
              </button>
            </div>
          </div>

          {exportError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm mb-4">
              {exportError}
            </div>
          )}

          {/* Filters */}
          <form
            onSubmit={handleFilterSubmit}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="f-from" className="text-xs font-medium text-gray-600">From Date</label>
              <input
                id="f-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="form-input text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="f-to" className="text-xs font-medium text-gray-600">To Date</label>
              <input
                id="f-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="form-input text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="f-campaign" className="text-xs font-medium text-gray-600">Campaign</label>
              <select
                id="f-campaign"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="form-select text-sm"
              >
                <option value="">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="f-status" className="text-xs font-medium text-gray-600">Status</label>
              <select
                id="f-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select text-sm"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-800 self-end"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setCampaignId('');
                setStatusFilter('');
                setPage(1);
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 self-end"
            >
              Clear
            </button>
          </form>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">{error}</div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Receipt No</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Date</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Donor Name</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Email</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">PAN</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Campaign</th>
                      <th className="px-3 py-3 text-right font-medium text-gray-700">Amount</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-700">Status</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-700">Monthly</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-700">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {donations.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                          कोई दान नहीं / No donations found.
                        </td>
                      </tr>
                    ) : (
                      donations.map((d) => (
                        <tr key={d._id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-gray-700">{d.receiptNumber || '—'}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDate(d.createdAt)}</td>
                          <td className="px-3 py-2 text-gray-900">{d.donorName || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{d.donorEmail || '—'}</td>
                          <td className="px-3 py-2 font-mono text-gray-600">{d.pan || '—'}</td>
                          <td className="px-3 py-2 text-gray-700">{d.campaignId?.title || '—'}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">{formatINR(d.amount)}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[d.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                              {d.paymentStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600">
                            {d.isMonthly ? 'Yes' : 'No'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {d.receiptNumber ? (
                              <a
                                href={`${import.meta.env.VITE_API_URL}/api/donations/${d._id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`View receipt ${d.receiptNumber}`}
                                className="text-secondary hover:text-green-700"
                                title="View receipt"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 mt-4 justify-center">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    {page} / {totalPages} ({total} records)
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
