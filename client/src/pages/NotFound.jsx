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
        <div className="text-center py-20 px-4">
          <div className="text-7xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t('Page Not Found', 'पृष्ठ नहीं मिला')}
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {t(
              'The page you are looking for does not exist.',
              'जिस पृष्ठ को आप खोज रहे हैं वह मौजूद नहीं है।'
            )}
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-secondary text-white rounded font-semibold hover:bg-green-700 transition-colors"
          >
            {t('Back to Home', 'होमपेज पर जाएँ')}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
