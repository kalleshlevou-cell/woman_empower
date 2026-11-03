import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboard } from '../api/adminApi';
import { formatINR } from '../utils/formatters';

function StatCard({ title, value, color = 'text-primaryText', sub }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

function QuickLink({ to, label, icon }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-secondary transition-all group"
    >
      <span className="text-secondary group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-sm font-medium text-gray-700 group-hover:text-secondary">{label}</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data?.data || {}))
      .catch(() => setError('डैशबोर्ड डेटा लोड नहीं हो सका / Could not load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const publishedSchemes = data?.schemesByStatus?.published || 0;

  // Compute max raised for bar chart scaling
  const campaignStats = data?.campaignStats || [];
  const maxRaised = campaignStats.reduce((m, c) => Math.max(m, c.raised || 0), 1);

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <div className="flex flex-1 pt-14">
        <AdminSidebar />
        <main role="main" className="flex-1 p-6 bg-gray-50 overflow-auto">
          <h1 className="text-2xl font-bold text-primaryText mb-6">
            एडमिन डैशबोर्ड / Admin Dashboard
          </h1>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard
                  title="कुल दान / Total Donations"
                  value={data.totalDonations ?? 0}
                  color="text-primaryText"
                />
                <StatCard
                  title="कुल राशि / Total Amount"
                  value={formatINR(data.totalAmountPaise ?? 0)}
                  color="text-secondary"
                  sub="केवल सफल / Successful only"
                />
                <StatCard
                  title="सक्रिय अभियान / Active Campaigns"
                  value={data.activeCampaigns ?? 0}
                  color="text-blue-600"
                />
                <StatCard
                  title="प्रकाशित योजनाएं / Published Schemes"
                  value={publishedSchemes}
                  color="text-purple-600"
                />
                <StatCard
                  title="Unique Donors"
                  value={data.uniqueDonors ?? 0}
                  color="text-blue-600"
                />
                <StatCard
                  title="Successful Payments"
                  value={data.successfulDonationsCount ?? 0}
                  color="text-secondary"
                />
              </div>

              {/* Bar Chart */}
              {campaignStats.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-8">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">
                    अभियान-वार धनराशि / Campaign-wise Raised Amounts
                  </h2>
                  <svg
                    role="img"
                    aria-label="Campaign-wise raised amounts bar chart"
                    width="100%"
                    height={campaignStats.length * 44 + 16}
                    className="overflow-visible"
                  >
                    {campaignStats.map((c, i) => {
                      const barWidth = `${Math.max(2, (c.raised / maxRaised) * 80)}%`;
                      const y = i * 44;
                      return (
                        <g key={c._id || i}>
                          <text
                            x="0"
                            y={y + 14}
                            fontSize="12"
                            fill="#374151"
                            className="font-devanagari"
                            aria-hidden="true"
                          >
                            {c.campaignTitle || 'Campaign'}
                          </text>
                          <rect
                            x="0"
                            y={y + 20}
                            width={barWidth}
                            height="16"
                            rx="3"
                            fill="#2D7D46"
                            aria-label={`${c.campaignTitle || 'Campaign'}: ${formatINR(c.raised)}`}
                          />
                          <text
                            x={`calc(${barWidth} + 6px)`}
                            y={y + 32}
                            fontSize="11"
                            fill="#6B7280"
                            aria-hidden="true"
                          >
                            {formatINR(c.raised)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}

              {/* Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickLink
                  to="/admin/schemes"
                  label="योजना प्रबंधन / Manage Schemes"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
                <QuickLink
                  to="/admin/campaigns"
                  label="अभियान प्रबंधन / Manage Campaigns"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  }
                />
                <QuickLink
                  to="/admin/donations"
                  label="दान रिपोर्ट / Donation Reports"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
                <QuickLink
                  to="/admin/logs"
                  label="गतिविधि लॉग / Activity Logs"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
