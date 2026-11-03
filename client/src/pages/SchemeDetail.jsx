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
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

export default function SchemeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const t = (en, hi) => lang === 'hi' ? hi : en;
  const navigate = useNavigate();

  const [scheme, setScheme]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [bookmarked, setBookmarked]   = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSchemeById(id)
      .then((res) => setScheme(res.data?.data || res.data))
      .catch(() => setError(t('Could not load scheme.', 'योजना लोड नहीं हो सकी।')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBookmark = async () => {
    if (!user) { navigate('/login'); return; }
    setBookmarkLoading(true);
    try { await bookmarkScheme(id); setBookmarked((b) => !b); }
    catch { /* ignore */ }
    finally { setBookmarkLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar /><main role="main" className="flex-1 pt-14 flex items-center justify-center"><LoadingSpinner /></main><Footer />
    </div>
  );

  if (error || !scheme) return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || t('Scheme not found.', 'योजना नहीं मिली।')}</p>
          <Link to="/schemes" className="mt-4 inline-block text-secondary hover:underline">
            ← {t('Back to Schemes', 'योजनाएँ देखें')}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  const title = lang === 'hi' ? (scheme.title_hi || scheme.title_en) : (scheme.title_en || scheme.title_hi);
  const showAiDraftBanner = scheme.aiDraftApproved === false && scheme.aiDraft_hi;

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <Link to="/schemes" className="text-sm text-secondary hover:underline mb-4 inline-block">
            ← {t('Back to Schemes', 'योजनाएँ देखें')}
          </Link>

          {/* AI Draft banner */}
          {showAiDraftBanner && (
            <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded p-3 flex items-center gap-2">
              <span className="text-yellow-700 text-sm font-medium">
                ⚠️ {t('AI Draft — Pending Admin Review', 'AI मसौदा — समीक्षा करें')}
              </span>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-base text-gray-500 mt-1">
              {lang === 'hi' ? (scheme.title_en || '') : (scheme.title_hi || '')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">

            {/* Description */}
            <section aria-labelledby="desc-heading" className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 id="desc-heading" className="font-semibold text-primaryText mb-2">
                {t('Description', 'विवरण')}
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {lang === 'hi'
                  ? (scheme.description_hi || scheme.description_en || '—')
                  : (scheme.description_en || scheme.description_hi || '—')}
              </p>
            </section>

            {/* Benefits */}
            {scheme.benefits && (
              <section aria-labelledby="benefits-heading" className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 id="benefits-heading" className="font-semibold text-primaryText mb-2">
                  {t('Benefits', 'लाभ')}
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">{scheme.benefits}</p>
              </section>
            )}

            {/* Documents */}
            {scheme.documents?.length > 0 && (
              <section aria-labelledby="docs-heading" className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 id="docs-heading" className="font-semibold text-primaryText mb-2">
                  {t('Documents Required', 'आवश्यक दस्तावेज़')}
                </h2>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {scheme.documents.map((doc, i) => <li key={i}>{doc}</li>)}
                </ul>
              </section>
            )}

            {/* Application Process */}
            {scheme.applicationProcess && (
              <section aria-labelledby="app-heading" className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 id="app-heading" className="font-semibold text-primaryText mb-2">
                  {t('Application Process', 'आवेदन प्रक्रिया')}
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">{scheme.applicationProcess}</p>
              </section>
            )}

            {/* Help Centre */}
            {scheme.helpCentre && (
              <section aria-labelledby="help-heading" className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h2 id="help-heading" className="font-semibold text-blue-800 mb-2">
                  {t('Help Centre', 'सहायता केंद्र')}
                </h2>
                <p className="text-sm text-blue-700">{scheme.helpCentre}</p>
                <p className="text-sm text-blue-700 mt-1">
                  {t('Contact helpline:', 'हेल्पलाइन:')} <strong>+91-755-0000000</strong>
                </p>
              </section>
            )}

            {/* Official Source */}
            <section aria-labelledby="source-heading" className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 id="source-heading" className="font-semibold text-primaryText mb-2">
                {t('Official Source', 'आधिकारिक स्रोत')}
              </h2>
              {scheme.officialUrl ? (
                <a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer"
                  className="text-secondary hover:underline text-sm break-all">
                  {scheme.officialUrl}
                </a>
              ) : <p className="text-sm text-gray-500">—</p>}
              {scheme.lastCheckedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  {t('Last verified:', 'अंतिम जाँच:')} {formatDate(scheme.lastCheckedAt)}
                </p>
              )}
            </section>

            {/* Eligibility note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
              ⚠️ {t(
                'Eligibility shown is informational only — not an official approval. Always verify with the official source.',
                'पात्रता जानकारी केवल सूचनात्मक है — यह आधिकारिक स्वीकृति नहीं है।'
              )}
            </div>
          </div>

          {/* Bookmark */}
          <div className="mt-6">
            <button
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              aria-label={bookmarked ? 'Remove bookmark' : 'Save this scheme'}
              className={`flex items-center gap-2 px-5 py-2 rounded font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-secondary ${
                bookmarked
                  ? 'bg-secondary text-white hover:bg-green-700'
                  : 'border border-secondary text-secondary hover:bg-green-50'
              } disabled:opacity-60`}
            >
              {bookmarked
                ? `✅ ${t('Saved', 'सहेजा गया')}`
                : `🔖 ${t('Save Scheme', 'सहेजें')}`}
              {!user && <span className="text-xs text-gray-400">({t('login required', 'लॉगिन आवश्यक')})</span>}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
