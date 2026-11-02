import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

import Home from './pages/Home';
import SchemeFinder from './pages/SchemeFinder';
import SchemeDetail from './pages/SchemeDetail';
import DonationFlow from './pages/DonationFlow';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Lazy stubs for admin/account pages (to be implemented in later FEATs)
function DonorAccount() {
  return <main role="main" className="p-8 text-center"><h1>My Account</h1></main>;
}
function AdminDashboard() {
  return <main role="main" className="p-8 text-center"><h1>Admin Dashboard</h1></main>;
}
function AdminSchemes() {
  return <main role="main" className="p-8 text-center"><h1>Admin Schemes</h1></main>;
}
function AdminCampaigns() {
  return <main role="main" className="p-8 text-center"><h1>Admin Campaigns</h1></main>;
}
function AdminDonations() {
  return <main role="main" className="p-8 text-center"><h1>Admin Donations</h1></main>;
}
function AdminLogs() {
  return <main role="main" className="p-8 text-center"><h1>Admin Logs</h1></main>;
}

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
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
