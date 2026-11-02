import axiosInstance from './axiosInstance';

export const getCampaigns = (params) =>
  axiosInstance.get('/api/campaigns', { params });

export const getCampaignById = (id) =>
  axiosInstance.get(`/api/campaigns/${id}`);
