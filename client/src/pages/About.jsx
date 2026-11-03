import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

const TEAM = [
  {
    initials: 'AK',
    name: 'Anjali Kumari',
    role_hi: 'कार्यकारी निदेशक',
    role_en: 'Executive Director',
    bio_hi: '15 वर्षों से महिला सशक्तिकरण के क्षेत्र में कार्यरत।',
    bio_en: '15 years of experience in women empowerment and rural development.',
    color: 'bg-primary',
  },
  {
    initials: 'RP',
    name: 'Ramesh Patel',
    role_hi: 'कार्यक्रम प्रबंधक',
    role_en: 'Programme Manager',
    bio_hi: 'मध्यप्रदेश के 9 जिलों में 220+ कर्मचारियों की टीम का नेतृत्व।',
    bio_en: 'Leads a team of 220+ staff across 9 districts of Madhya Pradesh.',
    color: 'bg-secondary',
  },
  {
    initials: 'SP',
    name: 'Sunita Parihar',
    role_hi: 'स्वास्थ्य कार्यक्रम प्रमुख',
    role_en: 'Health Programme Lead',
    bio_hi: 'ग्रामीण स्वास्थ्य शिविरों और मातृत्व सेवाओं का संचालन।',
    bio_en: 'Leads rural health camps and maternal care services across MP.',
    color: 'bg-blue-500',
  },
  {
    initials: 'MV',
    name: 'Mohan Verma',
    role_hi: 'आजीविका विशेषज्ञ',
    role_en: 'Livelihood Specialist',
    bio_hi: 'स्व-सहायता समूहों के माध्यम से महिलाओं को आर्थिक सशक्तिकरण।',
    bio_en: 'Drives economic empowerment through SHG networks and micro-finance.',
    color: 'bg-purple-500',
  },
];

const STATS = [
  { value: '9', label_hi: 'जिले', label_en: 'Districts' },
  { value: '220+', label_hi: 'कर्मचारी', label_en: 'Staff Members' },
  { value: '1,400+', label_hi: 'स्वयंसेवक', label_en: 'Volunteers' },
  { value: '₹38-45 Cr', label_hi: 'वार्षिक बजट', label_en: 'Annual Budget' },
];

const FOCUS_AREAS = [
  {
    emoji: '🏥',
    title_hi: 'स्वास्थ्य',
    title_en: 'Health',
    desc_hi: 'ग्रामीण महिलाओं के लिए स्वास्थ्य शिविर, मातृत्व देखभाल और पोषण कार्यक्रम।',
    desc_en: 'Health camps, maternal care and nutrition programmes for rural women.',
  },
  {
    emoji: '💼',
    title_hi: 'आजीविका',
    title_en: 'Livelihoods',
    desc_hi: 'स्व-सहायता समूह, कौशल विकास और सूक्ष्म वित्त के माध्यम से आर्थिक सशक्तिकरण।',
    desc_en: 'Economic empowerment through SHGs, skill development and micro-finance.',
  },
  {
    emoji: '📚',
    title_hi: 'शिक्षा',
    title_en: 'Education',
    desc_hi: 'बालिकाओं की शिक्षा और साक्षरता कार्यक्रमों में सहयोग।',
    desc_en: 'Supporting girl child education and women\'s literacy programmes.',
  },
  {
    emoji: '⚖️',
    title_hi: 'अधिकार',
    title_en: 'Rights',
    desc_hi: 'सरकारी योजनाओं तक पहुँच और कानूनी अधिकारों की जानकारी।',
    desc_en: 'Access to government schemes and awareness of legal rights.',
  },
];

const PARTNERS = [
  'Ministry of Women & Child Development',
  'NABARD',
  'National Health Mission (MP)',
  'CSR Partners — TATA Trusts, Infosys Foundation',
  'UNICEF India',
];

export default function About() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col font-devanagari" id="about">
      <Navbar />
      <main role="main" className="flex-1 pt-14">

        {/* ── Hero Banner ── */}
        <section className="bg-gradient-to-r from-primary to-yellow-400 py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow mb-3">
              {lang === 'hi' ? 'हमारे बारे में' : 'About Us'}
            </h1>
            <p className="text-white text-lg sm:text-xl font-medium">
              {lang === 'hi'
                ? 'महिला सशक्तिकरण के लिए समर्पित — मध्यप्रदेश'
                : 'Dedicated to Women\'s Empowerment — Madhya Pradesh'}
            </p>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Text */}
            <div>
              <h2 className="text-2xl font-bold text-primaryText mb-4">
                {lang === 'hi' ? 'हमारा मिशन' : 'Our Mission'}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {lang === 'hi'
                  ? 'EmpowerHer एक पंजीकृत चैरिटेबल ट्रस्ट है जो मध्यप्रदेश के 9 जिलों में महिलाओं की आजीविका और स्वास्थ्य पर कार्य करता है। हम यह सुनिश्चित करते हैं कि हर महिला को सरकारी योजनाओं की जानकारी मिले और वह अपने अधिकारों का उपयोग कर सके।'
                  : 'EmpowerHer is a registered charitable trust working on women\'s livelihoods and health across 9 districts of Madhya Pradesh. We ensure every woman has access to government schemes and can exercise her rights.'}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'hi'
                  ? 'हमारे 220 कर्मचारी और 1,400 स्वयंसेवक प्रतिदिन ग्रामीण महिलाओं के जीवन को बेहतर बनाने के लिए काम करते हैं।'
                  : 'Our 220 staff and 1,400 volunteers work daily to improve the lives of rural women across MP.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/schemes"
                  className="px-5 py-2 bg-secondary text-white rounded font-semibold text-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {lang === 'hi' ? 'योजनाएँ खोजें' : 'Find Schemes'}
                </Link>
                <Link
                  to="/donate"
                  className="px-5 py-2 border-2 border-secondary text-secondary rounded font-semibold text-sm hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {lang === 'hi' ? 'दान करें' : 'Donate Now'}
                </Link>
              </div>
            </div>

            {/* SVG Illustration */}
            <div className="flex items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 320 260" className="w-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Ground */}
                <ellipse cx="160" cy="240" rx="140" ry="14" fill="#E5E7EB" />
                {/* Three women figures */}
                {/* Woman 1 */}
                <circle cx="80" cy="90" r="22" fill="#F5A623" />
                <rect x="62" y="112" width="36" height="50" rx="10" fill="#F5A623" opacity="0.8" />
                <line x1="62" y1="140" x2="44" y2="165" stroke="#F5A623" strokeWidth="10" strokeLinecap="round" />
                <line x1="98" y1="140" x2="116" y2="165" stroke="#F5A623" strokeWidth="10" strokeLinecap="round" />
                <line x1="72" y1="162" x2="68" y2="200" stroke="#F5A623" strokeWidth="10" strokeLinecap="round" />
                <line x1="88" y1="162" x2="92" y2="200" stroke="#F5A623" strokeWidth="10" strokeLinecap="round" />
                {/* Woman 2 (center, taller) */}
                <circle cx="160" cy="76" r="24" fill="#2D7D46" />
                <rect x="140" y="100" width="40" height="56" rx="12" fill="#2D7D46" opacity="0.85" />
                <line x1="140" y1="128" x2="120" y2="156" stroke="#2D7D46" strokeWidth="11" strokeLinecap="round" />
                <line x1="200" y1="128" x2="200" y2="128" stroke="#2D7D46" strokeWidth="11" strokeLinecap="round" />
                <line x1="160" y1="100" x2="200" y2="128" stroke="#2D7D46" strokeWidth="11" strokeLinecap="round" />
                <line x1="150" y1="156" x2="146" y2="200" stroke="#2D7D46" strokeWidth="11" strokeLinecap="round" />
                <line x1="170" y1="156" x2="174" y2="200" stroke="#2D7D46" strokeWidth="11" strokeLinecap="round" />
                {/* Woman 3 */}
                <circle cx="240" cy="90" r="22" fill="#C47F00" />
                <rect x="222" y="112" width="36" height="50" rx="10" fill="#C47F00" opacity="0.8" />
                <line x1="222" y1="140" x2="204" y2="165" stroke="#C47F00" strokeWidth="10" strokeLinecap="round" />
                <line x1="258" y1="140" x2="276" y2="165" stroke="#C47F00" strokeWidth="10" strokeLinecap="round" />
                <line x1="232" y1="162" x2="228" y2="200" stroke="#C47F00" strokeWidth="10" strokeLinecap="round" />
                <line x1="248" y1="162" x2="252" y2="200" stroke="#C47F00" strokeWidth="10" strokeLinecap="round" />
                {/* Stars / sparkles */}
                <text x="110" y="60" fontSize="16" fill="#F5A623">✦</text>
                <text x="200" y="50" fontSize="12" fill="#2D7D46">✦</text>
                <text x="50" y="70" fontSize="10" fill="#C47F00">✦</text>
              </svg>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="bg-secondary py-10 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label_en}>
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-green-100 text-sm mt-1">
                  {lang === 'hi' ? s.label_hi : s.label_en}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Focus Areas ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-primaryText text-center mb-8">
            {lang === 'hi' ? 'हमारे कार्यक्षेत्र' : 'Our Focus Areas'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FOCUS_AREAS.map((area) => (
              <div
                key={area.title_en}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-3" aria-hidden="true">{area.emoji}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2">
                  {lang === 'hi' ? area.title_hi : area.title_en}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {lang === 'hi' ? area.desc_hi : area.desc_en}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Our Work in Numbers ── */}
        <section className="bg-yellow-50 border-y border-yellow-200 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-primaryText text-center mb-6">
              {lang === 'hi' ? 'हमारी उपलब्धियाँ' : 'Our Impact'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { num: '50,000+', text_hi: 'योजना खोज उपयोग का लक्ष्य', text_en: 'Target scheme finder uses in year one' },
                { num: '2,500', text_hi: 'मासिक हेल्पलाइन कॉल', text_en: 'Monthly helpline calls answered' },
                { num: '40%', text_hi: 'हेल्पलाइन कॉल में कमी का लक्ष्य', text_en: 'Target reduction in helpline calls via portal' },
              ].map((item) => (
                <div key={item.num} className="bg-white rounded-lg border border-yellow-200 p-5 text-center shadow-sm">
                  <div className="text-3xl font-bold text-primaryText mb-2">{item.num}</div>
                  <p className="text-sm text-gray-600">
                    {lang === 'hi' ? item.text_hi : item.text_en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-primaryText text-center mb-8">
            {lang === 'hi' ? 'हमारी टीम' : 'Our Team'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-16 h-16 rounded-full ${member.color} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3`}
                  aria-hidden="true"
                >
                  {member.initials}
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{member.name}</h3>
                <p className="text-xs text-secondary font-medium mt-0.5">
                  {lang === 'hi' ? member.role_hi : member.role_en}
                </p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {lang === 'hi' ? member.bio_hi : member.bio_en}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Partners ── */}
        <section className="bg-gray-50 border-t border-gray-200 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-primaryText text-center mb-6">
              {lang === 'hi' ? 'हमारे साझेदार' : 'Our Partners'}
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {PARTNERS.map((p) => (
                <span
                  key={p}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact / Location ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-primaryText text-center mb-8">
            {lang === 'hi' ? 'संपर्क करें' : 'Contact Us'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Address */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <div className="text-3xl mb-3" aria-hidden="true">📍</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {lang === 'hi' ? 'पता' : 'Address'}
              </h3>
              <address className="not-italic text-sm text-gray-600 leading-relaxed">
                123 MP Nagar,<br />
                Bhopal 462011,<br />
                Madhya Pradesh
              </address>
            </div>
            {/* Phone */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <div className="text-3xl mb-3" aria-hidden="true">📞</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {lang === 'hi' ? 'हेल्पलाइन' : 'Helpline'}
              </h3>
              <a
                href="tel:+917550000000"
                className="text-secondary font-bold text-base hover:underline"
              >
                +91-755-0000000
              </a>
              <p className="text-xs text-gray-400 mt-1">
                {lang === 'hi' ? 'सोम–शनि, 9am–6pm' : 'Mon–Sat, 9am–6pm'}
              </p>
            </div>
            {/* Email */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <div className="text-3xl mb-3" aria-hidden="true">✉️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <a
                href="mailto:help@empowerher.org"
                className="text-secondary font-medium text-sm hover:underline"
              >
                help@empowerher.org
              </a>
              <p className="text-xs text-gray-400 mt-1">
                {lang === 'hi' ? '24 घंटे में जवाब' : 'Reply within 24 hours'}
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-gradient-to-r from-secondary to-green-600 py-12 px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            {lang === 'hi'
              ? 'हमारे साथ जुड़ें — महिलाओं का जीवन बदलें'
              : 'Join Us — Change Women\'s Lives'}
          </h2>
          <p className="text-green-100 mb-6 text-sm">
            {lang === 'hi'
              ? 'आपका दान हजारों महिलाओं को सरकारी योजनाओं तक पहुँचने में मदद करता है।'
              : 'Your donation helps thousands of women access government support.'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/donate"
              className="px-8 py-3 bg-white text-secondary font-bold rounded hover:bg-yellow-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            >
              {lang === 'hi' ? 'दान करें' : 'Donate Now'}
            </Link>
            <Link
              to="/schemes"
              className="px-8 py-3 border-2 border-white text-white font-bold rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            >
              {lang === 'hi' ? 'योजनाएँ खोजें' : 'Find Schemes'}
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
