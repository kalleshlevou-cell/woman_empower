import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SchemeCard from '../components/SchemeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSchemes, checkEligibility } from '../api/schemesApi';
import { useLanguage } from '../context/LanguageContext';
import axiosInstance from '../api/axiosInstance';

const MP_DISTRICTS = [
  'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain',
  'Sagar', 'Rewa', 'Satna', 'Ratlam', 'Chhindwara',
];

const NEEDS = [
  { key: 'health', hi: 'स्वास्थ्य', en: 'Health' },
  { key: 'livelihood', hi: 'आजीविका', en: 'Livelihood' },
  { key: 'pension', hi: 'पेंशन', en: 'Pension' },
  { key: 'maternity', hi: 'प्रसूति', en: 'Maternity' },
  { key: 'education', hi: 'शिक्षा', en: 'Education' },
  { key: 'housing', hi: 'आवास', en: 'Housing' },
];

const MARITAL_OPTIONS = [
  { value: 'single', hi: 'अविवाहित', en: 'Single' },
  { value: 'married', hi: 'विवाहित', en: 'Married' },
  { value: 'widowed', hi: 'विधवा', en: 'Widowed' },
  { value: 'divorced', hi: 'तलाकशुदा', en: 'Divorced' },
];

const PAGE_SIZE = 9;

export default function SchemeFinder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useLanguage();

  // Filters
  const [keyword, setKeyword] = useState('');
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [district, setDistrict] = useState('');
  const [schemeType, setSchemeType] = useState('');

  // Eligibility questionnaire
  const [showEligibility, setShowEligibility] = useState(false);
  const [answers, setAnswers] = useState({
    maritalStatus: '',
    age: '',
    bplCard: false,
    pregnant: false,
    shmMember: false,
    district: '',
  });

  // Results
  const [schemes, setSchemes] = useState([]);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Helpline modal
  const [showHelpline, setShowHelpline] = useState(false);
  const [helplinePhone, setHelplinePhone] = useState('');
  const [helplineMsg, setHelplineMsg] = useState('');
  const [helplineSubmitting, setHelplineSubmitting] = useState(false);
  const [helplineSuccess, setHelplineSuccess] = useState(false);

  // Pre-populate from URL params on mount
  useEffect(() => {
    const urlNeed = searchParams.get('need');
    const urlDistrict = searchParams.get('district');
    if (urlNeed) setSelectedNeeds([urlNeed]);
    if (urlDistrict) setDistrict(urlDistrict);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch schemes whenever filters/page change
  useEffect(() => {
    fetchSchemes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, selectedNeeds, district, schemeType, page]);

  const fetchSchemes = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        status: 'published',
        limit: PAGE_SIZE,
        page,
      };
      if (keyword) params.q = keyword;
      if (selectedNeeds.length > 0) params.need = selectedNeeds.join(',');
      if (district) params.district = district;
      if (schemeType) params.type = schemeType;

      const res = await getSchemes(params);
      setSchemes(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch {
      setError('योजनाएँ लोड नहीं हो सकीं। / Could not load schemes.');
    } finally {
      setLoading(false);
    }
  };

  const handleNeedToggle = (key) => {
    setSelectedNeeds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setPage(1);
  };

  const handleEligibilityCheck = async () => {
    try {
      setLoading(true);
      const res = await checkEligibility(answers);
      const matched = res.data?.data || [];
      setMatchedIds(new Set(matched.map((s) => s._id)));
      // Merge matched schemes into display list
      setSchemes((prev) => {
        const ids = new Set(prev.map((s) => s._id));
        const newOnes = matched.filter((s) => !ids.has(s._id));
        return [...matched, ...prev.filter((s) => !matchedIds.has(s._id) || ids.has(s._id)), ...newOnes];
      });
    } catch {
      setError('पात्रता जाँच विफल। / Eligibility check failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleHelplineSubmit = async (e) => {
    e.preventDefault();
    setHelplineSubmitting(true);
    try {
      await axiosInstance.post('/api/enquiries', {
        phone: helplinePhone,
        message: helplineMsg,
      });
      setHelplineSuccess(true);
    } catch {
      // ignore
    } finally {
      setHelplineSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-primaryText mb-6">
            महिला सरकारी योजना खोज{' '}
            <span className="text-sm font-normal text-gray-500">/ Women&apos;s Schemes Finder</span>
          </h1>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* ===== Left Sidebar ===== */}
            <aside className="lg:w-72 flex-shrink-0 space-y-5">
              {/* Keyword search */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label htmlFor="keyword-input" className="block text-sm font-semibold text-gray-700 mb-1">
                  योजना खोजें / Search
                </label>
                <input
                  id="keyword-input"
                  type="text"
                  value={keyword}
                  onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                  placeholder="योजना का नाम…"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primaryText"
                />
              </div>

              {/* Need checkboxes */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <fieldset>
                  <legend className="text-sm font-semibold text-gray-700 mb-2">
                    ज़रूरत / Need
                  </legend>
                  <div className="space-y-2">
                    {NEEDS.map((n) => (
                      <label key={n.key} htmlFor={`need-${n.key}`} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          id={`need-${n.key}`}
                          checked={selectedNeeds.includes(n.key)}
                          onChange={() => handleNeedToggle(n.key)}
                          className="accent-secondary"
                        />
                        <span className="text-sm text-gray-700">
                          {lang === 'hi' ? n.hi : n.en}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* District dropdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label htmlFor="district-filter" className="block text-sm font-semibold text-gray-700 mb-1">
                  जिला / District
                </label>
                <select
                  id="district-filter"
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primaryText"
                >
                  <option value="">— सभी —</option>
                  {MP_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Scheme type radio */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <fieldset>
                  <legend className="text-sm font-semibold text-gray-700 mb-2">
                    योजना प्रकार / Scheme Type
                  </legend>
                  <div className="space-y-2">
                    {[
                      { value: '', label: 'सभी / All' },
                      { value: 'central', label: 'केंद्र / Central' },
                      { value: 'state', label: 'राज्य / State' },
                    ].map((opt) => (
                      <label key={opt.value} htmlFor={`type-${opt.value || 'all'}`} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          id={`type-${opt.value || 'all'}`}
                          name="schemeType"
                          value={opt.value}
                          checked={schemeType === opt.value}
                          onChange={() => { setSchemeType(opt.value); setPage(1); }}
                          className="accent-secondary"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* Eligibility questionnaire */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <button
                  onClick={() => setShowEligibility((s) => !s)}
                  aria-expanded={showEligibility}
                  className="flex items-center justify-between w-full text-sm font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-primaryText rounded"
                >
                  <span>पात्रता जाँचें / Check Eligibility</span>
                  <span>{showEligibility ? '▲' : '▼'}</span>
                </button>

                {showEligibility && (
                  <div className="mt-3 space-y-3">
                    {/* Marital status */}
                    <div>
                      <label htmlFor="eq-marital" className="block text-xs text-gray-600 mb-1">
                        वैवाहिक स्थिति / Marital Status
                      </label>
                      <select
                        id="eq-marital"
                        value={answers.maritalStatus}
                        onChange={(e) => setAnswers((a) => ({ ...a, maritalStatus: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">— चुनें —</option>
                        {MARITAL_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {lang === 'hi' ? o.hi : o.en}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Age */}
                    <div>
                      <label htmlFor="eq-age" className="block text-xs text-gray-600 mb-1">
                        आयु / Age
                      </label>
                      <input
                        id="eq-age"
                        type="number"
                        min="10"
                        max="100"
                        value={answers.age}
                        onChange={(e) => setAnswers((a) => ({ ...a, age: parseInt(e.target.value) || '' }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                        placeholder="वर्ष / years"
                      />
                    </div>

                    {/* District */}
                    <div>
                      <label htmlFor="eq-district" className="block text-xs text-gray-600 mb-1">
                        जिला / District
                      </label>
                      <select
                        id="eq-district"
                        value={answers.district}
                        onChange={(e) => setAnswers((a) => ({ ...a, district: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">— चुनें —</option>
                        {MP_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Checkboxes */}
                    <label htmlFor="eq-bpl" className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="eq-bpl"
                        checked={answers.bplCard}
                        onChange={(e) => setAnswers((a) => ({ ...a, bplCard: e.target.checked }))}
                      />
                      <span className="text-xs text-gray-700">BPL कार्डधारक / BPL Card Holder</span>
                    </label>

                    <label htmlFor="eq-pregnant" className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="eq-pregnant"
                        checked={answers.pregnant}
                        onChange={(e) => setAnswers((a) => ({ ...a, pregnant: e.target.checked }))}
                      />
                      <span className="text-xs text-gray-700">गर्भवती / Pregnant</span>
                    </label>

                    <label htmlFor="eq-shm" className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="eq-shm"
                        checked={answers.shmMember}
                        onChange={(e) => setAnswers((a) => ({ ...a, shmMember: e.target.checked }))}
                      />
                      <span className="text-xs text-gray-700">SHG सदस्य / SHG Member</span>
                    </label>

                    <button
                      onClick={handleEligibilityCheck}
                      className="w-full bg-secondary text-white py-2 rounded text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      पात्रता जाँचें / Check
                    </button>
                  </div>
                )}
              </div>

              {/* Helpline button */}
              <button
                onClick={() => setShowHelpline(true)}
                aria-label="Request helpline callback"
                className="w-full bg-secondary text-white py-2 rounded text-sm font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                📞 सहायता कॉलबैक / Helpline Call-back
              </button>
            </aside>

            {/* ===== Right panel: Results ===== */}
            <section className="flex-1">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              {loading ? (
                <LoadingSpinner />
              ) : schemes.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    {total} योजनाएँ मिलीं / schemes found
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {schemes.map((s) => (
                      <SchemeCard
                        key={s._id}
                        scheme={{
                          ...s,
                          matchLabel: matchedIds.has(s._id) ? 'संभावित मिलान' : s.matchLabel,
                        }}
                        lang={lang}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex gap-2 justify-center mt-8">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primaryText"
                      >
                        ← पिछला
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-600">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primaryText"
                      >
                        अगला →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-lg">कोई योजना नहीं मिली</p>
                  <p className="text-sm mt-1">No schemes found. Try adjusting your filters.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Helpline modal */}
      {showHelpline && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Helpline Call-back"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-primaryText mb-4">
              सहायता कॉलबैक / Helpline Call-back
            </h2>
            {helplineSuccess ? (
              <p className="text-green-700 text-sm">
                ✅ अनुरोध प्राप्त हुआ। हम जल्द संपर्क करेंगे। / Request received. We will call you soon.
              </p>
            ) : (
              <form onSubmit={handleHelplineSubmit} className="space-y-3">
                <div>
                  <label htmlFor="hl-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    फ़ोन नंबर / Phone Number
                  </label>
                  <input
                    id="hl-phone"
                    type="tel"
                    required
                    value={helplinePhone}
                    onChange={(e) => setHelplinePhone(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
                    placeholder="10-digit mobile"
                  />
                </div>
                <div>
                  <label htmlFor="hl-msg" className="block text-sm font-medium text-gray-700 mb-1">
                    संदेश / Message (optional)
                  </label>
                  <textarea
                    id="hl-msg"
                    value={helplineMsg}
                    onChange={(e) => setHelplineMsg(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
                    placeholder="आपकी समस्या / Your query"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={helplineSubmitting}
                    className="flex-1 bg-secondary text-white py-2 rounded text-sm font-semibold hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    {helplineSubmitting ? '…' : 'भेजें / Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHelpline(false)}
                    aria-label="Close helpline modal"
                    className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    बंद / Close
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
