import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AccessDenied from './pages/auth/AccessDenied';
import NotFound from './pages/auth/NotFound';

// Core Workflow Pages
import Dashboard from './pages/dashboard/Dashboard';
import InstitutionList from './pages/institutions/InstitutionList';
import InstitutionDetail from './pages/institutions/InstitutionDetail';
import FdrList from './pages/fdr/FdrList';
import FdrCreate from './pages/fdr/FdrCreate';
import FdrDetail from './pages/fdr/FdrDetail';
import VerificationQueue from './pages/verifications/VerificationQueue';
import VerificationDetail from './pages/verifications/VerificationDetail';
import ReleaseRequestList from './pages/release/ReleaseRequestList';
import ReleaseRequestDetail from './pages/release/ReleaseRequestDetail';
import NotificationCenter from './pages/notifications/NotificationCenter';
import Reports from './pages/reports/Reports';
import AuditLogs from './pages/audit/AuditLogs';
import UserManagement from './pages/users/UserManagement';
import Settings from './pages/settings/Settings';

function ProtectedRoute({ children, requiredRoles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-500">
        Loading institutional portal session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Authenticated Protected Layout Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="institutions" element={<InstitutionList />} />
              <Route path="institutions/:id" element={<InstitutionDetail />} />
              <Route path="fdr" element={<FdrList />} />
              <Route path="fdr/create" element={<FdrCreate />} />
              <Route path="fdr/:id" element={<FdrDetail />} />

              {/* Verification Routes (Super Admin & Officer) */}
              <Route
                path="verifications"
                element={
                  <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'VERIFICATION_OFFICER']}>
                    <VerificationQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="verifications/:id"
                element={
                  <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'VERIFICATION_OFFICER']}>
                    <VerificationDetail />
                  </ProtectedRoute>
                }
              />

              <Route path="release-requests" element={<ReleaseRequestList />} />
              <Route path="release-requests/:id" element={<ReleaseRequestDetail />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="reports" element={<Reports />} />

              {/* Super Admin Only Routes */}
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />

              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
