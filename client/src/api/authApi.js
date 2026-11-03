import axiosInstance from './axiosInstance';

export const login = (data) =>
  axiosInstance.post('/api/auth/login', data);

export const register = (data) =>
  axiosInstance.post('/api/auth/register', data);

export const getMe = () =>
  axiosInstance.get('/api/auth/me');
