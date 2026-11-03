import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { lang } = useLanguage();
  const t = (en, hi) => lang === 'hi' ? hi : en;

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 flex items-center justify-center bg-gray-50">
        <div className="text-center py-20 px-4 max-w-lg mx-auto">
          {/* SVG illustration — question mark in circle */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary mx-auto mb-6"
            aria-hidden="true"
          >
            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" />
            <text
              x="40"
              y="55"
              textAnchor="middle"
              fontSize="40"
              fontWeight="bold"
              fill="currentColor"
              fontFamily="serif"
            >
              ?
            </text>
          </svg>

          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            {t('Oops! Page not found', 'अरे! पृष्ठ नहीं मिला')}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {t(
              "The page you're looking for doesn't exist or has been moved.",
              'जो पृष्ठ आप खोज रहे हैं वह मौजूद नहीं है या हटा दिया गया है।'
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="bg-secondary text-white px-6 py-2.5 rounded font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              {t('Go Home', 'होम जाएँ')}
            </Link>
            <Link
              to="/schemes"
              className="border border-secondary text-secondary px-6 py-2.5 rounded font-semibold hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              {t('Find Schemes', 'योजनाएँ खोजें')}
            </Link>
            <Link
              to="/donate"
              className="text-gray-600 px-6 py-2.5 rounded font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              {t('Donate', 'दान करें')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
