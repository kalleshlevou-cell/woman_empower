import axiosInstance from './axiosInstance';

export const createOrder = (data) =>
  axiosInstance.post('/api/donations/create-order', data);

export const verifyPayment = (data) =>
  axiosInstance.post('/api/donations/verify', data);

export const getMyDonations = () =>
  axiosInstance.get('/api/donations/my');

export const getReceipt = (donationId) =>
  axiosInstance.get(`/api/donations/${donationId}/receipt`, {
    responseType: 'blob',
  });
