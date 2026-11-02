import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import SchemeCard from '../components/SchemeCard';
import ReceiptDownload from '../components/ReceiptDownload';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getMyDonations } from '../api/donationsApi';
import { getBookmarks } from '../api/schemesApi';
import { formatINR, formatDate } from '../utils/formatters';

/**
 * Mask PAN: show first 5 and last 1 character, middle as ****.
 * Input: ABCDE1234F → Output: ABCDE****F
 */
function maskPAN(pan) {
  if (!pan || pan.length < 6) return '—';
  return pan.slice(0, 5) + '****' + pan.slice(-1);
}

const STATUS_CLASSES = {
  success: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};

export default function DonorAccount() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [activeTab, setActiveTab] = useState(0);
  const [donations, setDonations] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [donationsError, setDonationsError] = useState('');
  const [bookmarksError, setBookmarksError] = useState('');

  const tabs = [
    { id: 'profile', label: 'प्रोफ़ाइल / Profile' },
    { id: 'donations', label: 'मेरे दान / My Donations' },
    { id: 'schemes', label: 'सहेजी गई योजनाएं / Saved Schemes' },
  ];

  useEffect(() => {
    if (activeTab === 1 && donations.length === 0 && !donationsLoading) {
      fetchDonations();
    }
    if (activeTab === 2 && bookmarks.length === 0 && !bookmarksLoading) {
      fetchBookmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function fetchDonations() {
    setDonationsLoading(true);
    setDonationsError('');
    try {
      const res = await getMyDonations();
      setDonations(res.data?.data || []);
    } catch {
      setDonationsError('दान इतिहास लोड नहीं हो सका / Could not load donation history.');
    } finally {
      setDonationsLoading(false);
    }
  }

  async function fetchBookmarks() {
    setBookmarksLoading(true);
    setBookmarksError('');
    try {
      const res = await getBookmarks();
      // bookmarks API returns array of bookmark docs with schemeId populated
      const data = res.data?.data || [];
      // data may be array of {schemeId: schemeObject} or array of scheme objects
      const schemes = data.map((b) => (b.schemeId?._id ? b.schemeId : b));
      setBookmarks(schemes);
    } catch {
      setBookmarksError('सहेजी गई योजनाएं लोड नहीं हो सकीं / Could not load saved schemes.');
    } finally {
      setBookmarksLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-primaryText mb-6">
            मेरा खाता / My Account
          </h1>

          {/* Tab List */}
          <div
            role="tablist"
            aria-label="Account sections"
            className="flex border-b border-gray-200 mb-6 gap-1"
          >
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === idx}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t transition-colors focus:outline-none focus:ring-2 focus:ring-primaryText ${
                  activeTab === idx
                    ? 'bg-white border border-b-white border-gray-200 text-primaryText -mb-px'
                    : 'text-gray-600 hover:text-primaryText hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panel: Profile */}
          <div
            role="tabpanel"
            id="tabpanel-profile"
            aria-labelledby="tab-profile"
            hidden={activeTab !== 0}
          >
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                व्यक्तिगत जानकारी / Personal Information
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProfileField label="नाम / Name" value={user?.name} />
                <ProfileField label="ईमेल / Email" value={user?.email} />
                <ProfileField label="फोन / Phone" value={user?.phone || '—'} />
                <ProfileField
                  label="PAN"
                  value={user?.pan ? maskPAN(user.pan) : '—'}
                  hint="आंशिक रूप से छुपाया गया / Partially masked"
                />
              </dl>
            </div>
          </div>

          {/* Tab Panel: My Donations */}
          <div
            role="tabpanel"
            id="tabpanel-donations"
            aria-labelledby="tab-donations"
            hidden={activeTab !== 1}
          >
            {donationsLoading ? (
              <LoadingSpinner />
            ) : donationsError ? (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">
                {donationsError}
              </div>
            ) : donations.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                कोई दान नहीं मिला / No donations found.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-medium text-gray-700">तारीख / Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">अभियान / Campaign</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">राशि / Amount</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">स्थिति / Status</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">रसीद / Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {donations.map((don) => (
                      <tr key={don._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {formatDate(don.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {don.campaignId?.title || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatINR(don.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_CLASSES[don.paymentStatus] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {don.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {don.paymentStatus === 'success' && don.receiptNumber ? (
                            <ReceiptDownload
                              donationId={don._id}
                              receiptNumber={don.receiptNumber}
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tab Panel: Saved Schemes */}
          <div
            role="tabpanel"
            id="tabpanel-schemes"
            aria-labelledby="tab-schemes"
            hidden={activeTab !== 2}
          >
            {bookmarksLoading ? (
              <LoadingSpinner />
            ) : bookmarksError ? (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">
                {bookmarksError}
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                कोई सहेजी गई योजना नहीं / No saved schemes yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map((scheme) => (
                  <SchemeCard key={scheme._id} scheme={scheme} lang={lang} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProfileField({ label, value, hint }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 font-medium">
        {value}
        {hint && <span className="ml-2 text-xs text-gray-400">({hint})</span>}
      </dd>
    </div>
  );
}
