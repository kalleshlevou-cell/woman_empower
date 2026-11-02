import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { adminGetLogs } from '../api/adminApi';
import { formatDate } from '../utils/formatters';

const LIMIT = 50;

function formatTimestamp(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetLogs({ page, limit: LIMIT });
      const { logs: l, total: t } = res.data?.data || {};
      setLogs(l || []);
      setTotal(t || 0);
    } catch {
      setError('लॉग लोड नहीं हो सके / Could not load logs.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <div className="flex flex-1 pt-14">
        <AdminSidebar />
        <main role="main" className="flex-1 p-6 bg-gray-50 overflow-auto">
          <h1 className="text-2xl font-bold text-primaryText mb-6">
            गतिविधि लॉग / Activity Log
          </h1>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">
              {error}
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Timestamp</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Admin</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Action</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Entity Type</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Entity ID</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                          कोई लॉग प्रविष्टि नहीं / No log entries found.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50 align-top">
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap font-mono">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {log.adminId?.email || log.adminId?.name || (typeof log.adminId === 'string' ? log.adminId : '—')}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{log.entityType || '—'}</td>
                          <td className="px-3 py-2 font-mono text-gray-500 max-w-[120px] truncate" title={log.entityId}>
                            {log.entityId || '—'}
                          </td>
                          <td className="px-3 py-2 max-w-xs">
                            {log.details && Object.keys(log.details).length > 0 ? (
                              <pre className="text-xs overflow-auto max-h-20 bg-gray-50 border border-gray-200 rounded p-1 text-gray-700">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
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
                    {page} / {totalPages} ({total} entries)
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
