import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const navLinks = [
  { hi: 'योजनाएँ', en: 'Schemes', href: '/schemes' },
  { hi: 'दान करें', en: 'Donate', href: '/donate' },
  { hi: 'हमारे बारे में', en: 'About', href: '/about' },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { lang, toggleLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const t = (en, hi) => (lang === 'hi' ? hi : en);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="EmpowerHer Home">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="18" cy="18" r="18" fill="#F5A623" />
              <ellipse cx="18" cy="13" rx="4" ry="7" fill="white" opacity="0.9" transform="rotate(0 18 18)" />
              <ellipse cx="18" cy="13" rx="4" ry="7" fill="white" opacity="0.7" transform="rotate(60 18 18)" />
              <ellipse cx="18" cy="13" rx="4" ry="7" fill="white" opacity="0.7" transform="rotate(120 18 18)" />
              <ellipse cx="18" cy="13" rx="4" ry="7" fill="white" opacity="0.7" transform="rotate(180 18 18)" />
              <ellipse cx="18" cy="13" rx="4" ry="7" fill="white" opacity="0.7" transform="rotate(240 18 18)" />
              <ellipse cx="18" cy="13" rx="4" ry="7" fill="white" opacity="0.7" transform="rotate(300 18 18)" />
              <circle cx="18" cy="18" r="4" fill="#F5A623" />
            </svg>
            <span className="font-bold text-lg text-primaryText leading-none">EmpowerHer</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-primaryText hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primaryText rounded"
              >
                {t(link.en, link.hi)}
              </Link>
            ))}
            {isAdmin() && (
              <Link to="/admin" className="text-sm font-medium text-primaryText hover:underline focus:outline-none focus:ring-2 focus:ring-primaryText rounded">
                Admin
              </Link>
            )}
          </div>

          {/* Right side controls */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="px-3 py-1 rounded border border-primaryText text-primaryText text-sm font-semibold hover:bg-primary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primaryText"
              aria-label={lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
            >
              {lang === 'hi' ? 'EN' : 'हिं'}
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/account" className="text-sm text-primaryText hover:underline focus:outline-none focus:ring-2 focus:ring-primaryText rounded">
                  {user.name?.split(' ')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                >
                  {t('Logout', 'लॉगआउट')}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 bg-secondary text-white rounded text-sm font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                {t('Login', 'लॉगिन')}
              </Link>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="sm:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-primaryText"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6 text-primaryText" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div id="mobile-menu" className="sm:hidden fixed inset-0 top-14 z-40 bg-white border-t border-gray-100 shadow-lg overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-3 py-3 hover:bg-gray-50 rounded-lg text-base font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-primaryText"
                >
                  {t(link.en, link.hi)}
                </Link>
              ))}
              {isAdmin() && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center px-3 py-3 hover:bg-gray-50 rounded-lg text-sm font-medium text-primaryText">
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-3 px-3 pt-4 border-t border-gray-100 mt-2">
                <button
                  onClick={() => { toggleLang(); setMenuOpen(false); }}
                  aria-label={lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
                  className="px-3 py-1.5 rounded border border-primaryText text-primaryText text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primaryText"
                >
                  {lang === 'hi' ? 'EN' : 'हिं'}
                </button>
                {user ? (
                  <>
                    <Link to="/account" onClick={() => setMenuOpen(false)} className="text-sm text-primaryText hover:underline">
                      {user.name?.split(' ')[0]}
                    </Link>
                    <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
                      {t('Logout', 'लॉगआउट')}
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm text-secondary font-medium">
                    {t('Login', 'लॉगिन')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
