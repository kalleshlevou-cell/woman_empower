import axiosInstance from './axiosInstance';

// Dashboard
export const getDashboard = () =>
  axiosInstance.get('/api/admin/dashboard');

// Schemes
export const adminGetSchemes = (params) =>
  axiosInstance.get('/api/admin/schemes', { params });

export const adminCreateScheme = (data) =>
  axiosInstance.post('/api/admin/schemes', data);

export const adminUpdateScheme = (id, data) =>
  axiosInstance.put(`/api/admin/schemes/${id}`, data);

export const adminDeleteScheme = (id) =>
  axiosInstance.delete(`/api/admin/schemes/${id}`);

export const adminApproveDraft = (id) =>
  axiosInstance.post(`/api/admin/schemes/${id}/approve-draft`);

// Campaigns
export const adminGetCampaigns = (params) =>
  axiosInstance.get('/api/admin/campaigns', { params });

export const adminCreateCampaign = (data) =>
  axiosInstance.post('/api/admin/campaigns', data);

export const adminUpdateCampaign = (id, data) =>
  axiosInstance.put(`/api/admin/campaigns/${id}`, data);

// Donations
export const adminGetDonations = (params) =>
  axiosInstance.get('/api/admin/donations', { params });

export const adminExportCsv = (params) =>
  axiosInstance.get('/api/admin/donations/export-csv', { params, responseType: 'blob' });

export const adminGetForm10BD = () =>
  axiosInstance.get('/api/admin/donations/form10bd', { responseType: 'blob' });

// Logs
export const adminGetLogs = (params) =>
  axiosInstance.get('/api/admin/logs', { params });
