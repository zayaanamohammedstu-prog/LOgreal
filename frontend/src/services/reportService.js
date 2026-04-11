import api from './api';

const reportService = {
  getAnomalies: (params) =>
    api.get('/reports/anomalies', { params }),

  getAnomalyStats: (params) =>
    api.get('/reports/anomalies/stats', { params }),

  getAnomalyTrend: (params) =>
    api.get('/reports/anomalies/trend', { params }),

  generateReport: (data) =>
    api.post('/reports/generate', data),

  downloadReport: (reportId) =>
    api.get(`/reports/${reportId}/download`, { responseType: 'blob' }),

  listReports: (params) =>
    api.get('/reports', { params }),

  getPublicStats: () =>
    api.get('/reports/public/stats'),

  getAuditLogs: (params) =>
    api.get('/audit/logs', { params }),

  getUserActivity: (userId, params) =>
    api.get(`/audit/users/${userId}`, { params }),
};

export default reportService;
