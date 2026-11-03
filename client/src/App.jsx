import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/Toast';

import Home from './pages/Home';
import SchemeFinder from './pages/SchemeFinder';
import SchemeDetail from './pages/SchemeDetail';
import DonationFlow from './pages/DonationFlow';
import DonorAccount from './pages/DonorAccount';
import AdminDashboard from './pages/AdminDashboard';
import AdminSchemes from './pages/AdminSchemes';
import AdminCampaigns from './pages/AdminCampaigns';
import AdminDonations from './pages/AdminDonations';
import AdminLogs from './pages/AdminLogs';
import Login from './pages/Login';
import Register from './pages/Register';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { token, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!token || !isAdmin()) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/schemes" element={<SchemeFinder />} />
      <Route path="/schemes/:id" element={<SchemeDetail />} />
      <Route path="/donate/:campaignId" element={<DonationFlow />} />
      <Route path="/donate" element={<DonationFlow />} />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <DonorAccount />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/about" element={<About />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/schemes"
        element={
          <AdminRoute>
            <AdminSchemes />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/campaigns"
        element={
          <AdminRoute>
            <AdminCampaigns />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/donations"
        element={
          <AdminRoute>
            <AdminDonations />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <AdminRoute>
            <AdminLogs />
          </AdminRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppRoutes />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
