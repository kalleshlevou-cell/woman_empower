import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 flex items-center justify-center bg-gray-50">
        <div className="text-center py-20 px-4">
          <div className="text-7xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            पृष्ठ नहीं मिला
          </h1>
          <p className="text-gray-500 mb-2">Page Not Found</p>
          <p className="text-sm text-gray-400 mb-8">
            जिस पृष्ठ को आप खोज रहे हैं वह मौजूद नहीं है।
            <br />
            The page you are looking for does not exist.
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-secondary text-white rounded font-semibold hover:bg-green-700 transition-colors"
          >
            होमपेज पर जाएँ / Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
