import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* NGO Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-2">EmpowerHer</h3>
            <p className="text-sm text-gray-400">
              महिलाओं के सशक्तिकरण के लिए समर्पित
            </p>
            <p className="text-sm text-gray-400 mt-1">Dedicated to women's empowerment</p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-2">संपर्क / Contact</h4>
            <address className="not-italic text-sm text-gray-400 space-y-1">
              <p>123 MP Nagar, Bhopal 462011</p>
              <p>
                Helpline:{' '}
                <a href="tel:+917550000000" className="hover:text-primary transition-colors">
                  +91-755-0000000
                </a>
              </p>
            </address>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-2">Links</h4>
            <ul className="text-sm space-y-1">
              <li>
                <Link to="/schemes" className="hover:text-primary transition-colors">
                  योजनाएँ / Schemes
                </Link>
              </li>
              <li>
                <Link to="/donate" className="hover:text-primary transition-colors">
                  दान करें / Donate
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} EmpowerHer NGO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
