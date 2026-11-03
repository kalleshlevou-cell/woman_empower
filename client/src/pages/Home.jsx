import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SchemeCard from '../components/SchemeCard';
import CampaignCard from '../components/CampaignCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSchemes } from '../api/schemesApi';
import { getCampaigns } from '../api/campaignsApi';
import { useLanguage } from '../context/LanguageContext';

const MP_DISTRICTS = [
  'Bhopal','Indore','Jabalpur','Gwalior','Ujjain',
  'Sagar','Rewa','Satna','Ratlam','Chhindwara',
];

const NEEDS = [
  { key: 'health',     emoji: '🏥', hi: 'स्वास्थ्य',  en: 'Health' },
  { key: 'livelihood', emoji: '💼', hi: 'आजीविका',    en: 'Livelihood' },
  { key: 'pension',    emoji: '🧓', hi: 'पेंशन',      en: 'Pension' },
  { key: 'maternity',  emoji: '🤱', hi: 'प्रसूति',    en: 'Maternity' },
];

const IMPACT_STATS = [
  { value: 50000, labelHi: 'खोज उपयोग', labelEn: 'Finder Uses', suffix: '+' },
  { value: 6,     labelHi: '₹ करोड़ जुटाए', labelEn: '₹ Crore Raised', suffix: ' Cr' },
  { value: 12000, labelHi: 'महिलाओं की सहायता', labelEn: 'Women Helped', suffix: '+' },
  { value: 3,     labelHi: 'इस माह नई योजनाएँ', labelEn: 'New Schemes This Month', suffix: '' },
];

const TESTIMONIALS = [
  {
    initials: 'PB',
    name: 'Pooja Bai',
    district: 'Bhopal',
    hi: 'इस पोर्टल से मुझे विधवा पेंशन योजना के बारे में जानकारी मिली। आवेदन करना बहुत आसान था।',
    en: 'Through this portal I learned about the widow pension scheme. Applying was very easy.',
  },
  {
    initials: 'SR',
    name: 'Sunita Rajput',
    district: 'Indore',
    hi: 'मुझे प्रसूति सहायता योजना का लाभ मिला। EmpowerHer का बहुत धन्यवाद।',
    en: 'I benefited from the maternity assistance scheme. Many thanks to EmpowerHer.',
  },
];

function useCountUp(target, duration = 1500, startCounting) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startCounting) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, startCounting]);
  return count;
}

function StatCounter({ stat, startCounting, lang }) {
  const count = useCountUp(stat.value, 1500, startCounting);
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-primaryText">
        {count.toLocaleString('en-IN')}{stat.suffix}
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {lang === 'hi' ? stat.labelHi : stat.labelEn}
      </div>
    </div>
  );
}

export default function Home() {
  const { lang } = useLanguage();
  const t = (en, hi) => lang === 'hi' ? hi : en;
  const navigate = useNavigate();

  const [selectedNeed, setSelectedNeed]       = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [schemes, setSchemes]                 = useState([]);
  const [campaigns, setCampaigns]             = useState([]);
  const [loadingSchemes, setLoadingSchemes]   = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [statsVisible, setStatsVisible]       = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    getSchemes({ limit: 3, status: 'published' })
      .then((res) => setSchemes(res.data?.data?.schemes || []))
      .catch(() => setSchemes([]))
      .finally(() => setLoadingSchemes(false));

    getCampaigns()
      .then((res) => setCampaigns(res.data?.data || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCampaigns(false));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedNeed) params.set('need', selectedNeed);
    if (selectedDistrict) params.set('district', selectedDistrict);
    navigate(`/schemes?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />

      {/* Hero */}
      <header role="banner" className="pt-14 bg-gradient-to-r from-primary to-yellow-400" style={{ minHeight: '80px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="hidden sm:block" aria-hidden="true">
            <svg width="80" height="72" viewBox="0 0 80 72" fill="none">
              <ellipse cx="20" cy="20" rx="8" ry="8" fill="white" opacity="0.8" />
              <rect x="13" y="28" width="14" height="24" rx="5" fill="white" opacity="0.8" />
              <ellipse cx="40" cy="16" rx="9" ry="9" fill="white" opacity="0.9" />
              <rect x="32" y="25" width="16" height="28" rx="6" fill="white" opacity="0.9" />
              <ellipse cx="62" cy="20" rx="8" ry="8" fill="white" opacity="0.8" />
              <rect x="55" y="28" width="14" height="24" rx="5" fill="white" opacity="0.8" />
            </svg>
          </div>
          <div className="flex-1 text-center px-4">
            <h1 className="text-white font-bold text-xl sm:text-2xl leading-snug">
              {t('Find Support. Discover Opportunities. Build Your Future.', 'सहारा खोजें। अवसर पाएँ। अपना भविष्य बनाएँ।')}
            </h1>
            <p className="text-yellow-50 text-sm mt-1">
              {t('EmpowerHer — NGO for Women\'s Welfare, Madhya Pradesh', 'EmpowerHer — महिला कल्याण, मध्यप्रदेश')}
            </p>
          </div>
          <div className="hidden sm:block w-20" aria-hidden="true" />
        </div>
      </header>

      <main role="main" className="flex-1">
        {/* Schemes Finder Panel */}
        <section id="schemes-finder" aria-label="Women's Schemes Finder" className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-xl font-bold text-primaryText mb-4 text-center">
              🔍 {t("Find Women's Government Schemes", 'महिला सरकारी योजना खोजें')}
            </h2>

            {/* Need cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {NEEDS.map((n) => (
                <button
                  key={n.key}
                  onClick={() => { setSelectedNeed(n.key); navigate(`/schemes?need=${n.key}`); }}
                  aria-pressed={selectedNeed === n.key}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary
                    ${selectedNeed === n.key ? 'border-primaryText bg-yellow-50' : 'border-gray-200 hover:border-primaryText hover:bg-yellow-50'}`}
                >
                  <span className="text-2xl" aria-hidden="true">{n.emoji}</span>
                  <span className="text-sm font-semibold text-primaryText mt-1">{t(n.en, n.hi)}</span>
                </button>
              ))}
            </div>

            {/* District + Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end justify-center">
              <div className="flex flex-col gap-1 flex-1 max-w-xs">
                <label htmlFor="district-select" className="text-sm text-gray-600 font-medium">
                  {t('Select District', 'जिला चुनें')}
                </label>
                <select
                  id="district-select"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primaryText"
                >
                  <option value="">{t('— All Districts —', '— सभी जिले —')}</option>
                  {MP_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-2 bg-secondary text-white rounded font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                {t('Search', 'खोजें')}
              </button>
            </div>
          </div>
        </section>

        {/* Featured Schemes */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-xl font-bold text-primaryText mb-6 text-center">
            {t('Featured Schemes', 'प्रमुख योजनाएँ')}
          </h2>
          {loadingSchemes ? <LoadingSpinner /> : schemes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemes.map((s) => <SchemeCard key={s._id} scheme={s} lang={lang} />)}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">
              {t('Could not load schemes. Please try again later.', 'योजनाएँ लोड नहीं हो सकीं।')}
            </p>
          )}
        </section>

        {/* Campaigns */}
        <section className="bg-gray-50 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-primaryText mb-6 text-center">
              {t('Donation Campaigns', 'दान अभियान')}
            </h2>
            {loadingCampaigns ? <LoadingSpinner /> : campaigns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((c) => <CampaignCard key={c._id} campaign={c} lang={lang} />)}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm">
                {t('No active campaigns right now.', 'अभी कोई अभियान नहीं है।')}
              </p>
            )}
          </div>
        </section>

        {/* Impact Stats */}
        <section ref={statsRef} className="py-10 bg-white" aria-live="polite" aria-label="Impact Statistics">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-primaryText mb-8 text-center">
              {t('Our Impact', 'हमारा प्रभाव')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {IMPACT_STATS.map((stat) => (
                <StatCounter key={stat.labelEn} stat={stat} startCounting={statsVisible} lang={lang} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-gray-50 py-10" id="about">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-primaryText mb-6 text-center">
              {t('Beneficiary Voices', 'लाभार्थियों की आवाज़')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {TESTIMONIALS.map((t2) => (
                <div key={t2.name} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0" aria-hidden="true">
                    {t2.initials}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">{lang === 'hi' ? t2.hi : t2.en}</p>
                    <p className="text-xs text-gray-500 font-medium">— {t2.name}, {t2.district}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
