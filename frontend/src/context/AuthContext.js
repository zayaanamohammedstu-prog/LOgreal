import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData, mfa_required, temp_token } = response.data;

      if (mfa_required) {
        localStorage.setItem('temp_token', temp_token || '');
        return { mfa_required: true };
      }

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      message.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('temp_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    message.success('Logged out successfully');
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      message.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const { access_token, user: userData } = response.data;
      if (access_token) {
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setToken(access_token);
        setUser(userData);
      }
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      message.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyTotp = useCallback(async (totpCode) => {
    setLoading(true);
    try {
      const tempToken = localStorage.getItem('temp_token');
      const response = await api.post('/auth/verify-totp', {
        totp_code: totpCode,
        temp_token: tempToken,
      });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('temp_token');
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'TOTP verification failed';
      message.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      return access_token;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  const getDashboardPath = useCallback((role) => {
    const paths = {
      viewer: '/dashboard/viewer',
      auditor: '/dashboard/auditor',
      admin: '/dashboard/admin',
      superadmin: '/dashboard/superadmin',
    };
    return paths[role] || '/dashboard/viewer';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        register,
        verifyOtp,
        verifyTotp,
        refreshToken,
        getDashboardPath,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
