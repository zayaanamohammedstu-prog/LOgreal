import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleGuard from './components/common/RoleGuard';
import theme from './theme';

// Pages
import HomePage from './pages/HomePage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SetupTOTP from './pages/auth/SetupTOTP';
import ViewerDashboard from './pages/dashboard/ViewerDashboard';
import AuditorDashboard from './pages/dashboard/AuditorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';

const App = () => (
  <ConfigProvider theme={theme}>
    <AntApp>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Authenticated only (any role) */}
              <Route
                path="/setup-totp"
                element={
                  <ProtectedRoute>
                    <SetupTOTP />
                  </ProtectedRoute>
                }
              />

              {/* Role-protected dashboards */}
              <Route
                path="/dashboard/viewer"
                element={
                  <ProtectedRoute>
                    <RoleGuard requiredRole="viewer">
                      <ViewerDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/auditor"
                element={
                  <ProtectedRoute>
                    <RoleGuard requiredRole="auditor">
                      <AuditorDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute>
                    <RoleGuard requiredRole="admin">
                      <AdminDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/superadmin"
                element={
                  <ProtectedRoute>
                    <RoleGuard requiredRole="superadmin">
                      <SuperAdminDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/viewer" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </AntApp>
  </ConfigProvider>
);

export default App;
