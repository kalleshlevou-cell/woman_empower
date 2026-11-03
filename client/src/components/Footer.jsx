import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { lang } = useLanguage();
  const t = (en, hi) => lang === 'hi' ? hi : en;

  return (
    <footer className="bg-gray-900 text-gray-300 pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* NGO Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-2">EmpowerHer</h3>
            <p className="text-sm text-gray-400">
              {t('Dedicated to women\'s empowerment in Madhya Pradesh', 'महिलाओं के सशक्तिकरण के लिए समर्पित')}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-2">{t('Contact', 'संपर्क')}</h4>
            <address className="not-italic text-sm text-gray-400 space-y-1">
              <p>123 MP Nagar, Bhopal 462011</p>
              <p>
                {t('Helpline', 'हेल्पलाइन')}:{' '}
                <a href="tel:+917550000000" className="hover:text-primary transition-colors">
                  +91-755-0000000
                </a>
              </p>
              <p>
                <a href="mailto:help@empowerher.org" className="hover:text-primary transition-colors">
                  help@empowerher.org
                </a>
              </p>
            </address>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-2">{t('Links', 'लिंक')}</h4>
            <ul className="text-sm space-y-1">
              <li><Link to="/about"   className="hover:text-primary transition-colors">{t('About Us', 'हमारे बारे में')}</Link></li>
              <li><Link to="/schemes" className="hover:text-primary transition-colors">{t('Schemes', 'योजनाएँ')}</Link></li>
              <li><Link to="/donate"  className="hover:text-primary transition-colors">{t('Donate', 'दान करें')}</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">{t('Privacy Policy', 'गोपनीयता नीति')}</Link></li>
              <li><Link to="/terms"   className="hover:text-primary transition-colors">{t('Terms of Use', 'उपयोग की शर्तें')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} EmpowerHer NGO. {t('All rights reserved.', 'सर्वाधिकार सुरक्षित।')}</p>
        </div>
      </div>
    </footer>
  );
}
