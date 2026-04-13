import api from './api';

const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (data) =>
    api.post('/auth/register', data),

  verifyOtp: (email, otp) =>
    api.post('/auth/verify-otp', { email, otp }),

  resendOtp: (email) =>
    api.post('/auth/resend-otp', { email }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }),

  setupTotp: () =>
    api.post('/auth/setup-totp'),

  verifyTotp: (totpCode, tempToken) =>
    api.post('/auth/verify-totp', { totp_code: totpCode, temp_token: tempToken }),

  refreshToken: () =>
    api.post('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),

  getProfile: () =>
    api.get('/auth/profile'),

  updateProfile: (data) =>
    api.put('/auth/profile', data),
};

export default authService;
