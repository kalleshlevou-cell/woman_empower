import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSchemeById, bookmarkScheme } from '../api/schemesApi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function SchemeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contentTab, setContentTab] = useState('hi');
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSchemeById(id)
      .then((res) => setScheme(res.data?.data || res.data))
      .catch(() => setError('योजना लोड नहीं हो सकी।'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setBookmarkLoading(true);
    try {
      await bookmarkScheme(id);
      setBookmarked((b) => !b);
    } catch {
      // ignore
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 flex items-center justify-center">
        <LoadingSpinner />
      </main>
      <Footer />
    </div>
  );

  if (error || !scheme) return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'योजना नहीं मिली।'}</p>
          <Link to="/schemes" className="mt-4 inline-block text-secondary hover:underline">
            ← योजनाएँ देखें
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  const titleHi = scheme.title_hi || scheme.title_en || 'योजना';
  const titleEn = scheme.title_en || scheme.title_hi || 'Scheme';
  const showAiDraftBanner = scheme.aiDraftApproved === false && scheme.aiDraft_hi;

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back link */}
          <Link to="/schemes" className="text-sm text-secondary hover:underline mb-4 inline-block">
            ← योजनाएँ देखें / Back to Schemes
          </Link>

          {/* AI Draft banner */}
          {showAiDraftBanner && (
            <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded p-3 flex items-center gap-2">
              <span className="text-yellow-700 text-sm font-medium">
                ⚠️ AI Draft — समीक्षा करें | Pending Review
              </span>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{titleHi}</h1>
            <p className="text-lg text-gray-500 mt-1">{titleEn}</p>
          </div>

          {/* HI / EN tabs for description */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setContentTab('hi')}
              className={`px-4 py-1.5 rounded text-sm font-medium border transition-colors ${
                contentTab === 'hi'
                  ? 'bg-secondary text-white border-secondary'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setContentTab('en')}
              className={`px-4 py-1.5 rounded text-sm font-medium border transition-colors ${
                contentTab === 'en'
                  ? 'bg-secondary text-white border-secondary'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              English
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Description */}
            <section aria-labelledby="desc-heading" className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 id="desc-heading" className="font-semibold text-primaryText mb-2">
                विवरण / Description
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {contentTab === 'hi'
                  ? (scheme.description_hi || scheme.description_en || '—')
                  : (scheme.description_en || scheme.description_hi || '—')}
              </p>
            </section>

            {/* Benefits */}
            {(scheme.benefits_hi || scheme.benefits_en) && (
              <section aria-labelledby="benefits-heading" className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 id="benefits-heading" className="font-semibold text-primaryText mb-2">
                  लाभ / Benefits
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {contentTab === 'hi'
                    ? (scheme.benefits_hi || scheme.benefits_en)
                    : (scheme.benefits_en || scheme.benefits_hi)}
                </p>
              </section>
            )}

            {/* Documents required */}
            {(scheme.documents_hi || scheme.documents_en || (scheme.documents && scheme.documents.length > 0)) && (
              <section aria-labelledby="docs-heading" className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 id="docs-heading" className="font-semibold text-primaryText mb-2">
                  आवश्यक दस्तावेज़ / Documents Required
                </h2>
                {Array.isArray(scheme.documents) && scheme.documents.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {scheme.documents.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-700">
                    {contentTab === 'hi'
                      ? (scheme.documents_hi || scheme.documents_en)
                      : (scheme.documents_en || scheme.documents_hi)}
                  </p>
                )}
              </section>
            )}

            {/* Application process */}
            {(scheme.applicationProcess_hi || scheme.applicationProcess_en || scheme.applicationProcess) && (
              <section aria-labelledby="app-heading" className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 id="app-heading" className="font-semibold text-primaryText mb-2">
                  आवेदन प्रक्रिया / Application Process
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {contentTab === 'hi'
                    ? (scheme.applicationProcess_hi || scheme.applicationProcess_en || scheme.applicationProcess)
                    : (scheme.applicationProcess_en || scheme.applicationProcess_hi || scheme.applicationProcess)}
                </p>
              </section>
            )}

            {/* Help centre */}
            <section aria-labelledby="help-heading" className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h2 id="help-heading" className="font-semibold text-blue-800 mb-2">
                सहायता केंद्र / Help Centre
              </h2>
              <p className="text-sm text-blue-700">
                किसी सहायता के लिए हमसे संपर्क करें: <strong>+91-755-0000000</strong>
                <br />
                For assistance, contact us at <strong>help@empowerher.org</strong>
              </p>
            </section>

            {/* Official source */}
            <section aria-labelledby="source-heading" className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 id="source-heading" className="font-semibold text-primaryText mb-2">
                आधिकारिक स्रोत / Official Source
              </h2>
              {scheme.officialUrl ? (
                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:underline text-sm break-all"
                >
                  {scheme.officialUrl}
                </a>
              ) : (
                <p className="text-sm text-gray-500">—</p>
              )}
              {scheme.lastCheckedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  अंतिम जाँच तिथि / Last Verified: {formatDate(scheme.lastCheckedAt)}
                </p>
              )}
            </section>

            {/* Eligibility note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
              ⚠️ पात्रता जानकारी केवल सूचनात्मक है — यह आधिकारिक स्वीकृति नहीं है।
              Eligibility shown is informational only — not an official approval.
            </div>
          </div>

          {/* Bookmark / Save */}
          <div className="mt-6">
            <button
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded font-medium text-sm transition-colors ${
                bookmarked
                  ? 'bg-secondary text-white hover:bg-green-700'
                  : 'border border-secondary text-secondary hover:bg-green-50'
              } disabled:opacity-60`}
            >
              {bookmarked ? '✅ सहेजा गया / Saved' : '🔖 सहेजें / Save Scheme'}
              {!user && (
                <span className="text-xs text-gray-400">(login required)</span>
              )}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
