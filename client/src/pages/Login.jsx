import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login as loginApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const loginSchema = z.object({
  email: z.string().email('वैध ईमेल दर्ज करें / Enter valid email'),
  password: z.string().min(1, 'पासवर्ड आवश्यक है / Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await loginApi(data);
      const { token, user } = res.data?.data || res.data;
      login(token, user);
      // Redirect admins to /admin dashboard; others to where they came from
      const destination = user.role === 'admin' ? '/admin' : from;
      navigate(destination, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 flex items-center justify-center bg-gray-50 py-10">
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-primaryText text-center mb-6">
            लॉगिन / Login
          </h1>

          {serverError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                ईमेल / Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                aria-describedby={errors.email ? 'email-err' : undefined}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
                placeholder="email@example.com"
              />
              {errors.email && (
                <p id="email-err" role="alert" className="text-red-600 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                पासवर्ड / Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                aria-describedby={errors.password ? 'pw-err' : undefined}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
              />
              {errors.password && (
                <p id="pw-err" role="alert" className="text-red-600 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white py-2.5 rounded font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'लॉगिन हो रहा है…' : 'लॉगिन / Login'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            खाता नहीं है?{' '}
            <Link to="/register" className="text-secondary hover:underline font-medium">
              पंजीकरण करें / Register
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
