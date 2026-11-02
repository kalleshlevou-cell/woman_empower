import axiosInstance from './axiosInstance';

export const getSchemes = (params) =>
  axiosInstance.get('/api/schemes', { params });

export const getSchemeById = (id) =>
  axiosInstance.get(`/api/schemes/${id}`);

export const checkEligibility = (answers) =>
  axiosInstance.post('/api/schemes/eligibility', { answers });

export const bookmarkScheme = (id) =>
  axiosInstance.post(`/api/schemes/${id}/bookmark`);

export const getBookmarks = () =>
  axiosInstance.get('/api/schemes/bookmarks');
