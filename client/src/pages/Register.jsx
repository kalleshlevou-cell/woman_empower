import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as registerApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const registerSchema = z.object({
  name: z.string().min(1, 'नाम आवश्यक है / Name is required'),
  email: z.string().email('वैध ईमेल दर्ज करें / Enter valid email'),
  password: z
    .string()
    .min(8, 'न्यूनतम 8 अक्षर / Minimum 8 characters')
    .regex(/[A-Z]/, 'एक बड़ा अक्षर / At least one uppercase letter')
    .regex(/[0-9]/, 'एक अंक / At least one number')
    .regex(/[^A-Za-z0-9]/, 'एक विशेष वर्ण / At least one special character'),
  pan: z
    .string()
    .regex(PAN_REGEX, 'PAN format: AAAAA0000A')
    .or(z.literal(''))
    .optional(),
});

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const payload = { name: data.name, email: data.email, password: data.password };
      if (data.pan) payload.pan = data.pan;
      const res = await registerApi(payload);
      const { token, user } = res.data?.data || res.data;
      login(token, user);
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Registration failed. Please try again.');
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
            पंजीकरण / Register
          </h1>

          {serverError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1">
                पूरा नाम / Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                {...register('name')}
                aria-describedby={errors.name ? 'name-err' : undefined}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
                placeholder="आपका नाम"
              />
              {errors.name && (
                <p id="name-err" role="alert" className="text-red-600 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                ईमेल / Email <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-email"
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

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                पासवर्ड / Password <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                aria-describedby="pw-hint"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
              />
              <p id="pw-hint" className="text-xs text-gray-400 mt-0.5">
                Min 8 chars, 1 uppercase, 1 number, 1 special character
              </p>
              {errors.password && (
                <p role="alert" className="text-red-600 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* PAN (optional) */}
            <div>
              <label htmlFor="reg-pan" className="block text-sm font-medium text-gray-700 mb-1">
                PAN (वैकल्पिक / Optional — 80G रसीद के लिए)
              </label>
              <input
                id="reg-pan"
                type="text"
                autoComplete="off"
                maxLength={10}
                {...register('pan')}
                aria-describedby="pan-hint"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-primaryText"
                placeholder="AAAAA0000A"
              />
              <p id="pan-hint" className="text-xs text-gray-400 mt-0.5">
                Format: AAAAA0000A
              </p>
              {errors.pan && (
                <p role="alert" className="text-red-600 text-xs mt-1">
                  {errors.pan.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white py-2.5 rounded font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'पंजीकरण हो रहा है…' : 'पंजीकरण करें / Register'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            पहले से खाता है?{' '}
            <Link to="/login" className="text-secondary hover:underline font-medium">
              लॉगिन करें / Login
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
